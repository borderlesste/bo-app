const { pool } = require('../config/db.js');

const publicController = {
  // Create a public quote request from the homepage
  createPublicQuote: async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { nombre, email, telefono, empresa, servicio, mensaje } = req.body;
      
      // Validate required fields
      if (!nombre || !email || !servicio) {
        return res.status(400).json({
          success: false,
          message: 'Nombre, email y servicio son requeridos'
        });
      }
      
      // Check if this is a registered user
      const [existingUser] = await connection.execute(
        'SELECT id, nombre FROM usuarios WHERE email = ?',
        [email]
      );
      
      let usuarioId = null;
      if (existingUser.length > 0) {
        usuarioId = existingUser[0].id;
      }
      
      // Create the quote request in the cotizaciones table
      const [quoteResult] = await connection.execute(`
        INSERT INTO cotizaciones (
          usuario_id, 
          nombre,
          email,
          titulo, 
          descripcion, 
          estado, 
          prioridad,
          notas_internas
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        usuarioId,
        nombre,
        email,
        `Solicitud de ${servicio}${empresa ? ` - ${empresa}` : ''}`,
        mensaje || 'Solicitud de cotización desde la página web',
        'Pendiente',
        'media',
        JSON.stringify({
          telefono,
          empresa,
          servicio_solicitado: servicio,
          origen: 'web_publica'
        })
      ]);
      
      // OBLIGATORIO: Crear al menos un cotizacion_item
      await connection.execute(`
        INSERT INTO cotizacion_items (
          cotizacion_id, descripcion, cantidad, precio_unitario, descuento, subtotal, orden
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        quoteResult.insertId,
        `Servicio solicitado: ${servicio}${mensaje ? ` - ${mensaje}` : ''}`,
        1,
        0, // precio por definir
        0, // sin descuento
        0, // subtotal por definir
        0  // primer item
      ]);
      
      // Get the admin user for notifications
      const [adminUser] = await connection.execute(
        'SELECT id FROM usuarios WHERE rol = "admin" order BY id ASC LIMIT 1'
      );
      
      if (adminUser.length > 0) {
        // Create notification for admin
        await connection.execute(`
          INSERT INTO notificaciones (
            usuario_id, 
            tipo, 
            titulo, 
            mensaje, 
            entidad_tipo, 
            entidad_id, 
            leida, 
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
          adminUser[0].id,
          'cotizacion',
          'Nueva solicitud de cotización',
          `${nombre} ha solicitado una cotización para ${servicio}${empresa ? ` (${empresa})` : ''}. Email: ${email}`,
          'cotizacion',
          quoteResult.insertId,
          0
        ]);
      }
      
      await connection.commit();
      
      res.status(201).json({
        success: true,
        message: 'Solicitud de cotización enviada exitosamente. Nos pondremos en contacto contigo pronto.',
        data: {
          id: quoteResult.insertId,
          titulo: `Solicitud de ${servicio}${empresa ? ` - ${empresa}` : ''}`
        }
      });
      
    } catch (error) {
      await connection.rollback();
      console.error('Error al crear cotización pública:', error);
      
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor. Por favor, intenta de nuevo más tarde.'
      });
    } finally {
      connection.release();
    }
  }
};

module.exports = publicController;