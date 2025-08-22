const { pool } = require('../src/config/db');

async function testConnection() {
  console.log('🔌 Probando conexión a la base de datos...');
  
  try {
    // Probar conexión básica
    const connection = await pool.getConnection();
    console.log('✅ Conexión establecida correctamente');

    // Probar consulta básica
    const [result] = await connection.execute('SELECT 1 as test');
    console.log('✅ Consulta de prueba exitosa:', result);

    // Verificar tablas existentes
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📊 Tablas en la base de datos:');
    
    if (tables.length === 0) {
      console.log('   ⚠️  No hay tablas en la base de datos');
      console.log('   💡 Ejecuta: npm run db:setup');
    } else {
      tables.forEach(table => {
        const tableName = Object.values(table)[0];
        console.log(`   - ${tableName}`);
      });
    }

    // Verificar datos de ejemplo
    if (tables.length > 0) {
      try {
        const [clientes] = await connection.execute('SELECT COUNT(*) as count FROM usuarios');
        const [quotes] = await connection.execute('SELECT COUNT(*) as count FROM cotizaciones');
        const [orders] = await connection.execute('SELECT COUNT(*) as count FROM orders');
        
        console.log('📊 Conteo de registros:');
        console.log(`   - Usuarios: ${clientes[0].count}`);
        console.log(`   - Cotizaciones: ${quotes[0].count}`);
        console.log(`   - orders: ${orders[0].count}`);
      } catch (error) {
        console.log('⚠️  Error consultando datos:', error.message);
      }
    }

    connection.release();
    console.log('🎉 ¡Base de datos funcionando correctamente!');

  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.log('');
    console.log('💡 Posibles soluciones:');
    console.log('   1. Verifica que MySQL esté ejecutándose');
    console.log('   2. Revisa las credenciales en el archivo .env');
    console.log('   3. Ejecuta: npm run db:setup');
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testConnection().then(() => {
    process.exit(0);
  });
}

module.exports = { testConnection };