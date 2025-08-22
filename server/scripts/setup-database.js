const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

async function setupDatabase() {
  console.log('🚀 Iniciando configuración de la base de datos...');
  
  let connection;
  
  try {
    // Crear conexión sin especificar base de datos
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('❌ DATABASE_URL no está configurada en el archivo .env');
    }

    // Extraer información de la URL de la base de datos (parse manual para mysql://)
    const match = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):?(\d+)?\/(.+)/);
    if (!match) {
      throw new Error('❌ Formato de DATABASE_URL inválido. Use: mysql://user:pass@host:port/dbname');
    }
    
    const [, username, password, hostname, port, dbName] = match;
    
    // Crear conexión al servidor MySQL (sin especificar base de datos)
    connection = await mysql.createConnection({
      host: hostname,
      port: port || 3306,
      user: username,
      password: password
    });
    
    console.log('✅ Conectado al servidor MySQL');

    // Crear base de datos si no existe
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✅ Base de datos '${dbName}' creada o ya existe`);

    // Conectar a la base de datos específica
    await connection.changeUser({ database: dbName });
    console.log(`✅ Conectado a la base de datos '${dbName}'`);

    // Leer y ejecutar el archivo init.sql
    const initSqlPath = path.join(__dirname, '../src/migrations/init.sql');
    
    if (!fs.existsSync(initSqlPath)) {
      throw new Error(`❌ Archivo init.sql no encontrado en: ${initSqlPath}`);
    }

    const initSql = fs.readFileSync(initSqlPath, 'utf8');
    console.log('📄 Archivo init.sql leído correctamente');

    // Dividir el SQL en declaraciones individuales (por punto y coma)
    const statements = initSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`🔧 Ejecutando ${statements.length} declaraciones SQL...`);

    // Ejecutar cada declaración SQL
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await connection.execute(statement);
        console.log(`✅ Declaración ${i + 1}/${statements.length} ejecutada`);
      } catch (error) {
        console.log(`⚠️  Advertencia en declaración ${i + 1}: ${error.message}`);
        // Continuar con las siguientes declaraciones
      }
    }

    // Verificar que las tablas se crearon correctamente
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📊 Tablas creadas en la base de datos:');
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`   - ${tableName}`);
    });

    // Insertar datos de prueba si las tablas están vacías
    await insertSampleData(connection);

    console.log('🎉 ¡Base de datos configurada exitosamente!');
    console.log('');
    console.log('📋 Resumen:');
    console.log(`   - Base de datos: ${dbName}`);
    console.log(`   - Tablas creadas: ${tables.length}`);
    console.log('   - Datos de prueba insertados');
    console.log('');
    console.log('🚀 Ya puedes iniciar el servidor con: npm run dev');

  } catch (error) {
    console.error('❌ Error configurando la base de datos:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión a la base de datos cerrada');
    }
  }
}

async function insertSampleData(connection) {
  console.log('📝 Insertando datos de prueba...');

  try {
    // Verificar si ya existen datos
    const [existingClients] = await connection.execute('SELECT COUNT(*) as count FROM usuarios');
    if (existingClients[0].count > 0) {
      console.log('ℹ️  Ya existen datos en la base de datos, omitiendo inserción de datos de prueba');
      return;
    }

    // Insertar cliente admin
    await connection.execute(`
      INSERT INTO usuarios (nombre, email, direccion, telefono, password, rol) VALUES 
      ('Administrador', 'admin@borderlesstechno.com', 'Oficina Principal', '+52 55 1234 5678', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
    `);

    // Insertar clientes de prueba
    await connection.execute(`
      INSERT INTO usuarios (nombre, email, direccion, telefono, password, rol) VALUES 
      ('Juan Pérez', 'juan@example.com', 'Calle Principal 123, CDMX', '+52 55 1111 2222', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'cliente'),
      ('María González', 'maria@example.com', 'Av. Reforma 456, CDMX', '+52 55 3333 4444', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'cliente'),
      ('Carlos Ruiz', 'carlos@example.com', 'Zona Rosa 789, CDMX', '+52 55 5555 6666', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'cliente')
    `);

    // Insertar cotizaciones de prueba
    await connection.execute(`
      INSERT INTO cotizaciones (nombre, email, telefono, tipo_servicio, descripcion, estado) VALUES 
      ('Ana López', 'ana@example.com', '+52 55 7777 8888', 'Desarrollo Web', 'Necesito un sitio web para mi restaurante con sistema de reservas online', 'Pendiente'),
      ('Roberto Silva', 'roberto@example.com', '+52 55 9999 0000', 'Apps Móviles', 'Quiero desarrollar una app para mi tienda de ropa', 'Contactado'),
      ('Elena Castro', 'elena@example.com', '+52 55 1122 3344', 'Backend & APIs', 'Necesito APIs para conectar mi sistema de inventario', 'Pendiente')
    `);

    // Insertar orders de prueba
    await connection.execute(`
      INSERT INTO orders (usuario_id, servicio, descripcion, estado, prioridad, total, fecha_entrega_estimada) VALUES 
      (2, 'Desarrollo Web', 'Sitio web corporativo con panel de administración', 'En progreso', 'Alta', 25000.00, '2024-02-15'),
      (3, 'Apps Móviles', 'Aplicación móvil para delivery', 'Pendiente', 'Media', 45000.00, '2024-03-01'),
      (4, 'Backend & APIs', 'Sistema de APIs RESTful', 'Completado', 'Baja', 18000.00, '2024-01-25')
    `);

    // Insertar pagos de prueba
    await connection.execute(`
      INSERT INTO pagos (usuario_id, concepto, monto, estado, metodo_pago, referencia) VALUES 
      (2, 'Pago inicial - 50% del proyecto', 12500.00, 'Pagado', 'Transferencia bancaria', 'TXN-2024-001'),
      (3, 'Anticipo del 30%', 13500.00, 'Pendiente', 'PayPal', NULL),
      (4, 'Pago final del proyecto', 18000.00, 'Pagado', 'Stripe', 'stripe_1OXKlvL')
    `);

    // Insertar notificaciones de prueba
    await connection.execute(`
      INSERT INTO notificaciones (usuario_id, tipo, mensaje, leida) VALUES 
      (2, 'pago_recibido', 'Se ha recibido tu pago de $12,500.00 MXN', false),
      (3, 'proyecto_iniciado', 'Tu proyecto "App Móvil para Delivery" ha iniciado desarrollo', false),
      (1, 'nuevo_cliente', 'Nuevo cliente registrado: Elena Castro', true)
    `);

    console.log('✅ Datos de prueba insertados correctamente');
    console.log('');
    console.log('🔐 Credenciales de prueba:');
    console.log('   Admin: admin@borderlesstechno.com / password');
    console.log('   Cliente: juan@example.com / password');

  } catch (error) {
    console.log('⚠️  Error insertando datos de prueba:', error.message);
  }
}

// Ejecutar el script si se llama directamente
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };