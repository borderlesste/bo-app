const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

async function migratePayPalFields() {
  console.log('🔄 Iniciando migración de campos PayPal...');
  
  let connection;
  
  try {
    // Crear conexión usando variables de entorno
    const dbConfig = {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true
    };

    console.log('📝 Connecting to database:', `${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a la base de datos');

    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, '../src/migrations/add_paypal_fields.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`❌ Archivo de migración no encontrado: ${migrationPath}`);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Archivo de migración leído exitosamente');

    // Ejecutar la migración
    console.log('🔄 Ejecutando migración...');
    
    // Dividir las sentencias SQL y ejecutarlas una por una
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      try {
        console.log(`📝 Ejecutando: ${statement.substring(0, 50)}...`);
        await connection.execute(statement);
      } catch (error) {
        // Ignorar errores de "columna ya existe" o "tabla ya existe"
        if (error.code === 'ER_DUP_FIELDNAME' || 
            error.code === 'ER_TABLE_EXISTS_ERROR' ||
            error.message.includes('Duplicate column name') ||
            error.message.includes('already exists')) {
          console.log(`⚠️  Elemento ya existe, continuando: ${error.message}`);
          continue;
        }
        throw error;
      }
    }

    console.log('✅ Migración completada exitosamente');
    
    // Verificar que las columnas se agregaron correctamente
    console.log('🔍 Verificando estructura de tablas...');
    
    const [ordersColumns] = await connection.execute(`
      SHOW COLUMNS FROM orders WHERE Field IN ('paypal_order_id', 'paypal_capture_id', 'payment_method')
    `);
    
    const [pagosColumns] = await connection.execute(`
      SHOW COLUMNS FROM pagos WHERE Field IN ('paypal_order_id', 'paypal_capture_id', 'paypal_payer_email', 'payment_gateway')
    `);
    
    const [webhooksExists] = await connection.execute(`
      SHOW TABLES LIKE 'webhooks_paypal'
    `);
    
    console.log(`✅ Campos agregados a orders: ${ordersColumns.length}/3`);
    console.log(`✅ Campos agregados a pagos: ${pagosColumns.length}/4`);
    console.log(`✅ Tabla webhooks_paypal: ${webhooksExists.length > 0 ? 'Creada' : 'No encontrada'}`);
    
    if (ordersColumns.length === 3 && pagosColumns.length === 4 && webhooksExists.length > 0) {
      console.log('🎉 Todas las estructuras de PayPal están listas');
    } else {
      console.log('⚠️  Algunas estructuras pueden no haberse creado correctamente');
    }

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('📝 Conexión cerrada');
    }
  }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  migratePayPalFields()
    .then(() => {
      console.log('🎉 Proceso de migración completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = migratePayPalFields;