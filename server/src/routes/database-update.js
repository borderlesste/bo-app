const express = require('express');
const router = express.Router();
const { pool } = require('../config/db.js');

// Route to update database schema for clients system
router.post('/update-for-clients', async (req, res) => {
  try {
    const updates = [];
    
    // 1. Add client_id column to projects table if it doesn't exist
    try {
      await pool.execute(`
        ALTER TABLE proyectos 
        ADD COLUMN usuario_id INT NULL AFTER id,
        ADD INDEX idx_usuario_id (usuario_id),
        ADD FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
      `);
      updates.push('Added usuario_id to proyectos table');
    } catch (error) {
      if (!error.message.includes('Duplicate column name')) {
        throw error;
      }
      updates.push('usuario_id column already exists in proyectos table');
    }
    
    // 2. Create notifications table if it doesn't exist
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS notificaciones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        tipo VARCHAR(50) NOT NULL DEFAULT 'info',
        titulo VARCHAR(255) NOT NULL,
        mensaje TEXT NOT NULL,
        prioridad ENUM('baja', 'normal', 'alta', 'critica') DEFAULT 'normal',
        leida BOOLEAN DEFAULT FALSE,
        entidad_tipo VARCHAR(50) NULL,
        entidad_id INT NULL,
        accion_url VARCHAR(500) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_usuario_id (usuario_id),
        INDEX idx_tipo (tipo),
        INDEX idx_leida (leida),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
    updates.push('Created/verified notificaciones table');
    
    // 3. Verify that activities table has the correct structure
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS actividades (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        descripcion TEXT NOT NULL,
        entidad_tipo VARCHAR(50) NULL,
        entidad_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_usuario_id (usuario_id),
        INDEX idx_tipo (tipo),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
    updates.push('Created/verified actividades table');
    
    // 4. Create project gallery table for multiple images
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS proyecto_galeria (
        id INT AUTO_INCREMENT PRIMARY KEY,
        proyecto_id INT NOT NULL,
        imagen_url VARCHAR(500) NOT NULL,
        descripcion VARCHAR(255) NULL,
        orden INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_proyecto_id (proyecto_id),
        FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
    updates.push('Created/verified proyecto_galeria table');

    // 5. Create quotations table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS cotizaciones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        numero_cotizacion VARCHAR(20) UNIQUE NOT NULL,
        usuario_id INT NOT NULL,
        titulo VARCHAR(255) NOT NULL,
        descripcion TEXT NULL,
        subtotal DECIMAL(10,2) DEFAULT 0.00,
        impuestos DECIMAL(10,2) DEFAULT 0.00,
        total DECIMAL(10,2) DEFAULT 0.00,
        moneda VARCHAR(3) DEFAULT 'MXN',
        estado ENUM('borrador', 'enviada', 'aprobada', 'rechazada', 'expirada', 'convertida', 'cancelada') DEFAULT 'borrador',
        validez_dias INT DEFAULT 30,
        fecha_expiracion DATE NULL,
        notas TEXT NULL,
        template_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_usuario_id (usuario_id),
        INDEX idx_numero_cotizacion (numero_cotizacion),
        INDEX idx_estado (estado),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
    updates.push('Created/verified cotizaciones table');

    // 6. Create quotation items table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS cotizacion_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cotizacion_id INT NOT NULL,
        descripcion TEXT NOT NULL,
        cantidad DECIMAL(8,2) DEFAULT 1.00,
        precio_unitario DECIMAL(10,2) DEFAULT 0.00,
        subtotal DECIMAL(10,2) DEFAULT 0.00,
        orden INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_cotizacion_id (cotizacion_id),
        FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
    updates.push('Created/verified cotizacion_items table');

    // 7. Create quotation templates table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS cotizacion_templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        descripcion TEXT NULL,
        contenido_html LONGTEXT NULL,
        estilos_css TEXT NULL,
        variables_disponibles JSON NULL,
        es_activo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);
    updates.push('Created/verified cotizacion_templates table');
    
    // 8. Get current table structures for verification
    const [projectsStructure] = await pool.execute('DESCRIBE proyectos');
    const [notificationsStructure] = await pool.execute('DESCRIBE notificaciones');
    const [activitiesStructure] = await pool.execute('DESCRIBE actividades');
    const [galleryStructure] = await pool.execute('DESCRIBE proyecto_galeria');
    const [quotationsStructure] = await pool.execute('DESCRIBE cotizaciones');
    const [quotationItemsStructure] = await pool.execute('DESCRIBE cotizacion_items');
    const [quotationTemplatesStructure] = await pool.execute('DESCRIBE cotizacion_templates');
    
    // 9. Get table counts
    const [projectsCount] = await pool.execute('SELECT COUNT(*) as count FROM proyectos');
    const [usersCount] = await pool.execute('SELECT COUNT(*) as count FROM usuarios');
    const [notificationsCount] = await pool.execute('SELECT COUNT(*) as count FROM notificaciones');
    const [activitiesCount] = await pool.execute('SELECT COUNT(*) as count FROM actividades');
    const [quotationsCount] = await pool.execute('SELECT COUNT(*) as count FROM cotizaciones');
    const [quotationItemsCount] = await pool.execute('SELECT COUNT(*) as count FROM cotizacion_items');
    
    res.json({
      success: true,
      message: 'Database updated successfully for clients system',
      updates,
      verification: {
        tables: {
          proyectos: {
            columns: projectsStructure.map(col => col.Field),
            count: projectsCount[0].count
          },
          usuarios: {
            count: usersCount[0].count
          },
          notificaciones: {
            columns: notificationsStructure.map(col => col.Field),
            count: notificationsCount[0].count
          },
          actividades: {
            columns: activitiesStructure.map(col => col.Field),
            count: activitiesCount[0].count
          },
          proyecto_galeria: {
            columns: galleryStructure.map(col => col.Field),
            count: 0 // New table
          },
          cotizaciones: {
            columns: quotationsStructure.map(col => col.Field),
            count: quotationsCount[0].count
          },
          cotizacion_items: {
            columns: quotationItemsStructure.map(col => col.Field),
            count: quotationItemsCount[0].count
          },
          cotizacion_templates: {
            columns: quotationTemplatesStructure.map(col => col.Field),
            count: 0 // New table
          }
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error updating database for clients:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating database for clients system',
      error: error.message
    });
  }
});

// Route to create sample clients for testing
router.post('/create-sample-clients', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    
    // Check if sample clients already exist
    const [existingClients] = await pool.execute(
      'SELECT COUNT(*) as count FROM usuarios WHERE rol = "cliente"'
    );
    
    if (existingClients[0].count > 0) {
      return res.json({
        success: true,
        message: `Already have ${existingClients[0].count} clients in database`
      });
    }
    
    const sampleClients = [
      {
        nombre: 'Juan Pérez González',
        email: 'juan.perez@empresa1.com',
        telefono: '+52 55 1234 5678',
        direccion: 'Av. Reforma 123, Col. Centro, CDMX',
        empresa: 'Tecnología Innovadora S.A.',
        rfc: 'PEGJ850123ABC'
      },
      {
        nombre: 'María Carmen López',
        email: 'maria.lopez@startup2.com',
        telefono: '+52 55 9876 5432',
        direccion: 'Calle Insurgentes 456, Col. Roma Norte, CDMX',
        empresa: 'Startup Digital MX',
        rfc: 'LOCM901215DEF'
      },
      {
        nombre: 'Carlos Rodriguez Mendoza',
        email: 'carlos.rodriguez@comercial3.com',
        telefono: '+52 55 5555 1111',
        direccion: 'Blvd. Avila Camacho 789, Polanco, CDMX',
        empresa: 'Comercial Internacional Ltd.',
        rfc: 'ROMC750308GHI'
      }
    ];
    
    const hashedPassword = await bcrypt.hash('cliente123', 10);
    
    for (const client of sampleClients) {
      await pool.execute(
        `INSERT INTO usuarios (nombre, email, password, telefono, direccion, empresa, rfc, rol, estado) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'cliente', 'activo')`,
        [client.nombre, client.email, hashedPassword, client.telefono, client.direccion, client.empresa, client.rfc]
      );
    }
    
    res.json({
      success: true,
      message: `Created ${sampleClients.length} sample clients successfully`,
      clients: sampleClients.map(c => ({ nombre: c.nombre, email: c.email, empresa: c.empresa })),
      default_password: 'cliente123'
    });
    
  } catch (error) {
    console.error('Error creating sample clients:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating sample clients',
      error: error.message
    });
  }
});

// Route to update database schema for billing system
router.post('/update-for-billing', async (req, res) => {
  try {
    const updates = [];
    
    // 1. Create invoices table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS facturas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        numero_factura VARCHAR(20) UNIQUE NOT NULL,
        cotizacion_id INT NULL,
        proyecto_id INT NULL,
        usuario_id INT NOT NULL,
        titulo VARCHAR(255) NOT NULL,
        descripcion TEXT NULL,
        subtotal DECIMAL(12,2) DEFAULT 0.00,
        impuestos DECIMAL(12,2) DEFAULT 0.00,
        descuentos DECIMAL(12,2) DEFAULT 0.00,
        total DECIMAL(12,2) DEFAULT 0.00,
        moneda VARCHAR(3) DEFAULT 'MXN',
        estado ENUM('borrador', 'enviada', 'pagada', 'parcialmente_pagada', 'vencida', 'cancelada') DEFAULT 'borrador',
        fecha_emision DATE NOT NULL,
        fecha_vencimiento DATE NOT NULL,
        dias_credito INT DEFAULT 30,
        notas TEXT NULL,
        condiciones_pago TEXT NULL,
        metodo_pago ENUM('transferencia', 'efectivo', 'cheque', 'tarjeta_credito', 'tarjeta_debito') DEFAULT 'transferencia',
        template_id INT NULL,
        archivo_pdf VARCHAR(500) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_usuario_id (usuario_id),
        INDEX idx_cotizacion_id (cotizacion_id),
        INDEX idx_proyecto_id (proyecto_id),
        INDEX idx_numero_factura (numero_factura),
        INDEX idx_estado (estado),
        INDEX idx_fecha_emision (fecha_emision),
        INDEX idx_fecha_vencimiento (fecha_vencimiento),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id) ON DELETE SET NULL,
        FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE SET NULL
      ) ENGINE=InnoDB
    `);
    updates.push('Created/verified facturas table');

    // 2. Create invoice items table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS factura_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        factura_id INT NOT NULL,
        descripcion TEXT NOT NULL,
        cantidad DECIMAL(8,2) DEFAULT 1.00,
        precio_unitario DECIMAL(12,2) DEFAULT 0.00,
        descuento DECIMAL(5,2) DEFAULT 0.00,
        subtotal DECIMAL(12,2) DEFAULT 0.00,
        impuesto_porcentaje DECIMAL(5,2) DEFAULT 16.00,
        impuesto_monto DECIMAL(12,2) DEFAULT 0.00,
        total DECIMAL(12,2) DEFAULT 0.00,
        orden INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_factura_id (factura_id),
        FOREIGN KEY (factura_id) REFERENCES facturas(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
    updates.push('Created/verified factura_items table');

    // 3. Create payments table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS pagos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        numero_pago VARCHAR(20) UNIQUE NOT NULL,
        factura_id INT NOT NULL,
        usuario_id INT NOT NULL,
        monto DECIMAL(12,2) NOT NULL,
        moneda VARCHAR(3) DEFAULT 'MXN',
        metodo_pago ENUM('transferencia', 'efectivo', 'cheque', 'tarjeta_credito', 'tarjeta_debito') NOT NULL,
        referencia VARCHAR(100) NULL,
        fecha_pago DATE NOT NULL,
        estado ENUM('pendiente', 'confirmado', 'rechazado', 'cancelado') DEFAULT 'pendiente',
        notas TEXT NULL,
        comprobante_url VARCHAR(500) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_factura_id (factura_id),
        INDEX idx_usuario_id (usuario_id),
        INDEX idx_numero_pago (numero_pago),
        INDEX idx_estado (estado),
        INDEX idx_fecha_pago (fecha_pago),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (factura_id) REFERENCES facturas(id) ON DELETE CASCADE,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
    updates.push('Created/verified pagos table');

    // 4. Create invoice templates table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS factura_templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        descripcion TEXT NULL,
        contenido_html LONGTEXT NULL,
        estilos_css TEXT NULL,
        variables_disponibles JSON NULL,
        es_activo BOOLEAN DEFAULT TRUE,
        es_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);
    updates.push('Created/verified factura_templates table');

    // 5. Create payment applications table (for partial payments)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS pago_aplicaciones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pago_id INT NOT NULL,
        factura_id INT NOT NULL,
        monto_aplicado DECIMAL(12,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_pago_id (pago_id),
        INDEX idx_factura_id (factura_id),
        FOREIGN KEY (pago_id) REFERENCES pagos(id) ON DELETE CASCADE,
        FOREIGN KEY (factura_id) REFERENCES facturas(id) ON DELETE CASCADE,
        UNIQUE KEY unique_pago_factura (pago_id, factura_id)
      ) ENGINE=InnoDB
    `);
    updates.push('Created/verified pago_aplicaciones table');

    // 6. Create financial reports table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS reportes_financieros (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        tipo ENUM('ingresos', 'facturas_pendientes', 'clientes_morosos', 'flujo_efectivo', 'personalizado') NOT NULL,
        parametros JSON NULL,
        fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        generado_por INT NOT NULL,
        archivo_url VARCHAR(500) NULL,
        INDEX idx_tipo (tipo),
        INDEX idx_fecha_generacion (fecha_generacion),
        INDEX idx_generado_por (generado_por),
        FOREIGN KEY (generado_por) REFERENCES usuarios(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
    updates.push('Created/verified reportes_financieros table');

    // 7. Update cotizaciones table to add invoice tracking
    try {
      await pool.execute(`
        ALTER TABLE cotizaciones 
        ADD COLUMN factura_id INT NULL AFTER template_id,
        ADD INDEX idx_factura_id (factura_id),
        ADD FOREIGN KEY (factura_id) REFERENCES facturas(id) ON DELETE SET NULL
      `);
      updates.push('Added factura_id to cotizaciones table');
    } catch (error) {
      if (!error.message.includes('Duplicate column name')) {
        throw error;
      }
      updates.push('factura_id column already exists in cotizaciones table');
    }

    // 8. Update proyectos table to add invoice tracking
    try {
      await pool.execute(`
        ALTER TABLE proyectos 
        ADD COLUMN factura_id INT NULL AFTER usuario_id,
        ADD INDEX idx_factura_id (factura_id),
        ADD FOREIGN KEY (factura_id) REFERENCES facturas(id) ON DELETE SET NULL
      `);
      updates.push('Added factura_id to proyectos table');
    } catch (error) {
      if (!error.message.includes('Duplicate column name')) {
        throw error;
      }
      updates.push('factura_id column already exists in proyectos table');
    }

    // 9. Get table structures for verification
    const [invoicesStructure] = await pool.execute('DESCRIBE facturas');
    const [invoiceItemsStructure] = await pool.execute('DESCRIBE factura_items');
    const [paymentsStructure] = await pool.execute('DESCRIBE pagos');
    const [invoiceTemplatesStructure] = await pool.execute('DESCRIBE factura_templates');
    const [paymentApplicationsStructure] = await pool.execute('DESCRIBE pago_aplicaciones');
    const [reportsStructure] = await pool.execute('DESCRIBE reportes_financieros');
    
    // 10. Get table counts
    const [invoicesCount] = await pool.execute('SELECT COUNT(*) as count FROM facturas');
    const [invoiceItemsCount] = await pool.execute('SELECT COUNT(*) as count FROM factura_items');
    const [paymentsCount] = await pool.execute('SELECT COUNT(*) as count FROM pagos');
    const [invoiceTemplatesCount] = await pool.execute('SELECT COUNT(*) as count FROM factura_templates');
    const [paymentApplicationsCount] = await pool.execute('SELECT COUNT(*) as count FROM pago_aplicaciones');
    const [reportsCount] = await pool.execute('SELECT COUNT(*) as count FROM reportes_financieros');
    
    res.json({
      success: true,
      message: 'Database updated successfully for billing system',
      updates,
      verification: {
        tables: {
          facturas: {
            columns: invoicesStructure.map(col => col.Field),
            count: invoicesCount[0].count
          },
          factura_items: {
            columns: invoiceItemsStructure.map(col => col.Field),
            count: invoiceItemsCount[0].count
          },
          pagos: {
            columns: paymentsStructure.map(col => col.Field),
            count: paymentsCount[0].count
          },
          factura_templates: {
            columns: invoiceTemplatesStructure.map(col => col.Field),
            count: invoiceTemplatesCount[0].count
          },
          pago_aplicaciones: {
            columns: paymentApplicationsStructure.map(col => col.Field),
            count: paymentApplicationsCount[0].count
          },
          reportes_financieros: {
            columns: reportsStructure.map(col => col.Field),
            count: reportsCount[0].count
          }
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error updating database for billing:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating database for billing system',
      error: error.message
    });
  }
});

// Route to run complete database initialization
router.post('/init-complete-database', async (req, res) => {
  try {
    console.log('🗃️ Starting complete database initialization...');
    const updates = [];
    
    // Read and execute the complete init.sql script
    const fs = require('fs');
    const path = require('path');
    const initSqlPath = path.join(__dirname, '../migrations/init.sql');
    
    if (!fs.existsSync(initSqlPath)) {
      throw new Error('init.sql file not found');
    }
    
    const initSql = fs.readFileSync(initSqlPath, 'utf8');
    
    // Split SQL into individual statements (handle multi-statement execution)
    const statements = initSql
      .split(/;\s*\n/)
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    let executed = 0;
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          await pool.execute(statement);
          executed++;
          console.log(`✅ Statement ${i + 1}/${statements.length} executed successfully`);
        } catch (error) {
          // Log warning for errors that might be expected (like table already exists)
          if (error.code === 'ER_TABLE_EXISTS_ERROR' || 
              error.code === 'ER_DUP_KEYNAME' || 
              error.message.includes('already exists')) {
            console.log(`⚠️ Statement ${i + 1}: ${error.message} (ignoring)`);
            updates.push(`Statement ${i + 1}: ${error.message} (ignored)`);
          } else {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
            updates.push(`Error in statement ${i + 1}: ${error.message}`);
            // Continue with other statements instead of stopping
          }
        }
      }
    }
    
    updates.push(`Executed ${executed}/${statements.length} SQL statements successfully`);
    
    // Verify critical tables exist
    const criticalTables = [
      'usuarios', 'cotizaciones', 'pedidos', 'facturas', 'pagos', 'proyectos', 
      'servicios', 'mensajes', 'notificaciones', 'configuracion', 
      'seguridad_log', 'estadisticas_mensuales'
    ];
    
    const tableStatus = {};
    for (const table of criticalTables) {
      try {
        const [result] = await pool.execute(`SELECT COUNT(*) as count FROM ${table}`);
        tableStatus[table] = { exists: true, count: result[0].count };
      } catch (error) {
        tableStatus[table] = { exists: false, error: error.message };
      }
    }
    
    const existingTables = Object.keys(tableStatus).filter(table => tableStatus[table].exists);
    
    console.log(`✅ Database initialization completed. ${existingTables.length}/${criticalTables.length} critical tables verified.`);
    
    res.json({
      success: true,
      message: 'Complete database initialization executed',
      updates,
      execution_summary: {
        total_statements: statements.length,
        executed_successfully: executed,
        critical_tables_verified: existingTables.length,
        total_critical_tables: criticalTables.length
      },
      table_status: tableStatus,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error in complete database initialization:', error);
    res.status(500).json({
      success: false,
      message: 'Error in complete database initialization',
      error: error.message
    });
  }
});

// Route to create security log table specifically
router.post('/create-security-log-table', async (req, res) => {
  try {
    console.log('🔒 Creating security log table...');
    
    // Create the security log table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS seguridad_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NULL,
        tipo ENUM('login_exitoso', 'login_fallido', 'logout', 'acceso_denegado', 'cambio_password', 'intento_sesion_multiple', 'actividad_sospechosa') NOT NULL,
        email_intento VARCHAR(255) NULL,
        ip VARCHAR(45) NULL,
        user_agent TEXT NULL,
        dispositivo VARCHAR(50) NULL,
        ubicacion VARCHAR(100) NULL,
        detalles JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_usuario_id (usuario_id),
        INDEX idx_tipo (tipo),
        INDEX idx_ip (ip),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
      ) ENGINE=InnoDB COMMENT='Log de eventos de seguridad y autenticación'
    `);
    
    // Verify table was created
    const [result] = await pool.execute(`SELECT COUNT(*) as count FROM seguridad_log`);
    
    console.log('✅ Security log table created successfully');
    
    res.json({
      success: true,
      message: 'Security log table created successfully',
      table_count: result[0].count,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error creating security log table:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating security log table',
      error: error.message
    });
  }
});

module.exports = router;