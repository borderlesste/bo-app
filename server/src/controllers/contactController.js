// src/controllers/contactController.js
const { validationResult } = require('express-validator');
const { pool } = require('../config/db.js');
const emailService = require('../services/emailService.js');
const notificationService = require('../services/notificationService.js');

const contactController = {};

contactController.sendContact = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { nombre, email, mensaje } = req.body;
  try {
    // Guardar en base de datos
    await pool.execute(
      'INSERT INTO contactos (nombre, email, mensaje) VALUES (?, ?, ?)',
      [nombre, email, mensaje]
    );

    // Enviar notificación por email (no bloquear si falla)
    emailService.sendContactNotification({ nombre, email, mensaje })
      .then(result => {
        if (result.success) {
          console.log('✅ Notificación de contacto enviada por email');
        } else {
          console.log('⚠️ Fallo enviando notificación de contacto:', result.error);
        }
      })
      .catch(err => {
        console.log('⚠️ Error enviando notificación de contacto:', err.message);
      });

    // Crear notificación de nuevo contacto
    try {
      await notificationService.notifyNewContact({
        nombre,
        email,
        mensaje
      });
    } catch (notificationError) {
      console.log('⚠️ Error creando notificación de contacto:', notificationError);
    }

    res.status(200).json({ 
      success: true,
      message: 'Mensaje recibido correctamente. Te contactaremos pronto.' 
    });
  } catch (err) {
    console.error('Error al guardar contacto:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error al enviar el mensaje. Por favor intenta de nuevo.' 
    });
  }
};

module.exports = contactController;