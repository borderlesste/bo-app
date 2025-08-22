const mysql = require('mysql2/promise');
require('dotenv').config();

async function addInvoicesTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'dblzyyrh_techno'
  });

  try {
    console.log('🗃️  Creando tabla de facturas...');

    // Crear tabla de facturas
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS facturas (
        id INT PRIMARY KEY AUTO_INCREMENT,
        numero_factura VARCHAR(50) UNIQUE NOT NULL,
        usuario_id INT,
        cliente_nombre VARCHAR(255) NOT NULL,
        cliente_email VARCHAR(255),
        order_id INT,
        pago_id INT,
        concepto TEXT NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        iva DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        estado ENUM('Pendiente', 'Pagada', 'Vencida', 'Cancelada') DEFAULT 'Pendiente',
        fecha_emision DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        fecha_vencimiento DATETIME NOT NULL,
        metodo_pago VARCHAR(100),
        moneda VARCHAR(10) DEFAULT 'MXN',
        notas TEXT,
        referencia_transferencia VARCHAR(255),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
        FOREIGN KEY (pago_id) REFERENCES pagos(id) ON DELETE SET NULL,
        
        INDEX idx_facturas_cliente (usuario_id),
        INDEX idx_facturas_numero (numero_factura),
        INDEX idx_facturas_estado (estado),
        INDEX idx_facturas_fecha (fecha_emision),
        INDEX idx_facturas_pago (pago_id)
      )
    `);

    console.log('✅ Tabla de facturas creada exitosamente');

    // Verificar si ya hay datos de ejemplo
    const [existingRows] = await connection.execute('SELECT COUNT(*) as count FROM facturas');
    
    if (existingRows[0].count === 0) {
      console.log('📄 Insertando datos de ejemplo...');
      
      // Insertar algunos datos de ejemplo basados en pagos existentes
      await connection.execute(`
        INSERT INTO facturas (
          numero_factura, usuario_id, cliente_nombre, cliente_email, 
          pago_id, concepto, subtotal, iva, total, estado,
          fecha_emision, fecha_vencimiento, metodo_pago, notas
        )
        SELECT 
          CONCAT('FAC-', YEAR(CURDATE()), '-', LPAD(ROW_NUMBER() OVER (order BY p.id), 3, '0')) as numero_factura,
          p.usuario_id,
          p.cliente_nombre,
          c.email as cliente_email,
          p.id as pago_id,
          p.concepto,
          ROUND(p.monto / 1.16, 2) as subtotal,
          ROUND(p.monto - (p.monto / 1.16), 2) as iva,
          p.monto as total,
          CASE 
            WHEN p.estado = 'Pagado' THEN 'Pagada'
            WHEN p.estado = 'Pendiente' THEN 'Pendiente'
            ELSE 'Pendiente'
          END as estado,
          p.fecha_pago as fecha_emision,
          DATE_ADD(p.fecha_pago, INTERVAL 30 DAY) as fecha_vencimiento,
          p.metodo_pago,
          CONCAT('Factura generada para pago #', p.id) as notas
        FROM pagos p
        LEFT JOIN usuarios c ON p.usuario_id = c.id
        WHERE p.estado IN ('Pagado', 'Pendiente')
        LIMIT 10
      `);

      console.log('✅ Datos de ejemplo insertados');
    } else {
      console.log('ℹ️  Ya existen facturas en la base de datos');
    }

    // Mostrar estadísticas
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_facturas,
        COUNT(CASE WHEN estado = 'Pagada' THEN 1 END) as facturas_pagadas,
        COUNT(CASE WHEN estado = 'Pendiente' THEN 1 END) as facturas_pendientes,
        SUM(total) as monto_total
      FROM facturas
    `);

    console.log('\n📊 Estadísticas de facturas:');
    console.log(`   Total de facturas: ${stats[0].total_facturas}`);
    console.log(`   Facturas pagadas: ${stats[0].facturas_pagadas}`);
    console.log(`   Facturas pendientes: ${stats[0].facturas_pendientes}`);
    console.log(`   Monto total: $${(stats[0].monto_total || 0).toLocaleString()}`);

    console.log('\n🎉 Migración completada exitosamente!');

  } catch (error) {
    console.error('❌ Error al crear la tabla de facturas:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Ejecutar la migración si el archivo se ejecuta directamente
if (require.main === module) {
  addInvoicesTable()
    .then(() => {
      console.log('✅ Script completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script falló:', error);
      process.exit(1);
    });
}

module.exports = addInvoicesTable;