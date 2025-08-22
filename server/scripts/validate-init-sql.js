const fs = require('fs');
const path = require('path');

const sqlPath = path.resolve(__dirname, '../src/migrations/init.sql');
const raw = fs.readFileSync(sqlPath, 'utf8');
const text = raw;

function extractCreateTables(sql) {
  // More tolerant parser: locate 'CREATE TABLE `name`' then grab until the closing ')\n' before the ENGINE or next section
  const re = /CREATE TABLE `([^`]+)` \(([\s\S]*?)\)\s*ENGINE=/g;
  const tables = {};
  let m;
  while ((m = re.exec(sql))) {
    const name = m[1];
    const body = m[2];
    const cols = new Set();
    // match column definitions that begin with a backtick
    const colRe = /\n\s*`([^`]+)`\s+[^,\n]+/g;
    let c;
    while ((c = colRe.exec('\n' + body))) {
      cols.add(c[1]);
    }
    tables[name] = { cols: Array.from(cols) };
  }
  return tables;
}

function extractAlterBlocks(sql) {
  const re = /ALTER TABLE `([^`]+)`([\s\S]*?);\s*\n/g;
  const blocks = [];
  let m;
  while ((m = re.exec(sql))) {
    blocks.push({ table: m[1], stmt: m[2] });
  }
  return blocks;
}

function colsFromParenList(s) {
  // s like `a`,`b` or `a`
  return s.split(',').map(x => x.replace(/[`\s]/g,'')).filter(Boolean);
}

const tables = extractCreateTables(text);
const alters = extractAlterBlocks(text);

// Fallback: if any ALTER references a table not parsed, try extracting that CREATE TABLE block manually
function ensureParsed(tableName) {
  if (tables[tableName]) return;
  const marker = `CREATE TABLE \`${tableName}\``;
  const idx = text.indexOf(marker.replace(/\\`/g, '`'));
  if (idx === -1) return;
  // find the closing ") ENGINE=" after idx
  const endIdx = text.indexOf(') ENGINE=', idx);
  if (endIdx === -1) return;
  const startBody = text.indexOf('(', idx);
  if (startBody === -1 || startBody >= endIdx) return;
  const body = text.slice(startBody + 1, endIdx);
  const cols = new Set();
  const colRe = /\n\s*`([^`]+)`\s+[^,\n]+/g;
  let c;
  while ((c = colRe.exec('\n' + body))) {
    cols.add(c[1]);
  }
  tables[tableName] = { cols: Array.from(cols) };
  console.log(`DEBUG: fallback parsed table ${tableName} ->`, tables[tableName].cols);
}

const issues = [];

// DEBUG: print parsed columns for `webhooks` if present
if (tables['webhooks']) {
  console.log('DEBUG: parsed columns for webhooks ->', tables['webhooks'].cols);
} else {
  console.log('DEBUG: webhooks table not parsed');
}

// DEBUG: print ALTER blocks for webhooks
for (const blk of alters) {
  if (blk.table === 'webhooks') {
    console.log('DEBUG: found ALTER block for webhooks ->', blk.stmt.trim().slice(0,200));
  }
}

// check keys
for (const blk of alters) {
  const { table, stmt } = blk;
  ensureParsed(table);
  // ADD KEY / ADD UNIQUE KEY / ADD PRIMARY KEY with column lists
  const keyRe = /ADD (?:UNIQUE )?KEY `[^`]+` \(([^)]+)\)/g;
  let k;
  while ((k = keyRe.exec(stmt))) {
    const cols = colsFromParenList(k[1]);
    for (const col of cols) {
      if (!tables[table] || !tables[table].cols.includes(col)) {
        issues.push({ type: 'MISSING_KEY_COLUMN', table, column: col, context: stmt.trim().slice(0,200) });
      }
    }
  }
  // primary key variant: ADD PRIMARY KEY (`id`)
  const pkRe = /ADD PRIMARY KEY \(([^)]+)\)/g;
  while ((k = pkRe.exec(stmt))) {
    const cols = colsFromParenList(k[1]);
    for (const col of cols) {
      if (!tables[table] || !tables[table].cols.includes(col)) {
        issues.push({ type: 'MISSING_PK_COLUMN', table, column: col, context: stmt.trim().slice(0,200) });
      }
    }
  }
  // foreign keys
  const fkRe = /ADD CONSTRAINT `[^`]+` FOREIGN KEY \(([^)]+)\) REFERENCES `([^`]+)` \(([^)]+)\)/g;
  while ((k = fkRe.exec(stmt))) {
    const localCols = colsFromParenList(k[1]);
    const refTable = k[2];
    const refCols = colsFromParenList(k[3]);
    for (const col of localCols) {
      if (!tables[table] || !tables[table].cols.includes(col)) {
        issues.push({ type: 'MISSING_FK_LOCAL_COLUMN', table, column: col, references: `${refTable}(${refCols.join(',')})` });
      }
    }
    for (const rcol of refCols) {
      if (!tables[refTable] || !tables[refTable].cols.includes(rcol)) {
        issues.push({ type: 'MISSING_FK_REF_COLUMN', table, column: rcol, referenced_by: `${table}(${localCols.join(',')})` });
      }
    }
  }
}

// Summarize
if (issues.length === 0) {
  console.log('No missing column references found in ALTER TABLE ADD KEY / ADD CONSTRAINT statements.');
} else {
  console.log('Issues found:');
  for (const it of issues) {
    if (it.type === 'MISSING_KEY_COLUMN') {
      console.log(`- Table ${it.table}: key refers to missing column ${it.column}`);
    } else if (it.type === 'MISSING_PK_COLUMN') {
      console.log(`- Table ${it.table}: PRIMARY KEY refers to missing column ${it.column}`);
    } else if (it.type === 'MISSING_FK_LOCAL_COLUMN') {
      console.log(`- Table ${it.table}: FOREIGN KEY refers to missing local column ${it.column} -> references ${it.references}`);
    } else if (it.type === 'MISSING_FK_REF_COLUMN') {
      console.log(`- Table ${it.table}: FOREIGN KEY references missing column ${it.column} in referenced table (referenced by ${it.referenced_by})`);
    } else {
      console.log('- Unknown issue', it);
    }
  }
  console.log(`\nTotal issues: ${issues.length}`);
}

// optional: print summary of tables parsed count
console.log(`\nParsed ${Object.keys(tables).length} CREATE TABLE blocks.`);
