const express = require('express');
const { body } = require('express-validator');
const { 
  login, register, logout, getUsers, changePassword, getProfile, updateProfile,
  getUserById, updateUser, deleteUser, getUserStats
} = require('../controllers/authController.js');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware.js');

const router = express.Router();

router.post('/register', [
    body('nombre', 'El nombre es obligatorio').not().isEmpty(),
    body('email', 'Por favor, incluye un email válido').isEmail(),
    body('password', 'La contraseña debe tener 6 o más caracteres').isLength({ min: 6 }),
    body('direccion', 'La dirección es obligatoria').not().isEmpty(),
    body('telefono', 'El teléfono es obligatorio').not().isEmpty(),
    body('empresa').optional(),
    body('rfc').optional()
], register);

router.post('/login', [
    body('email', 'Por favor, incluye un email válido').isEmail(),
    body('password', 'La contraseña es obligatoria').exists()
], login);

router.post('/logout', logout);

router.post('/change-password', [
    isAuthenticated,
    body('oldPassword', 'La contraseña antigua es obligatoria').exists(),
    body('newPassword', 'La nueva contraseña debe tener 6 o más caracteres').isLength({ min: 6 })
], changePassword);

router.get('/profile', isAuthenticated, getProfile);
router.put('/profile', isAuthenticated, updateProfile);

router.get('/users', isAuthenticated, isAdmin, getUsers);
router.get('/users/:id', isAuthenticated, isAdmin, getUserById);
router.get('/users/:id/stats', isAuthenticated, isAdmin, getUserStats);
router.put('/users/:id', isAuthenticated, isAdmin, updateUser);
router.delete('/users/:id', isAuthenticated, isAdmin, deleteUser);

// Endpoint temporal para crear usuarios de muestra
router.post('/create-sample-users', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { pool } = require('../config/db.js');
    
    const users = [
      {
        nombre: 'Administrador Principal',
        email: 'admin@borderlesstechno.com',
        password: '123456', // Usar la contraseña que quiere el usuario
        rol: 'admin',
        estado: 'activo',
        telefono: '+52 55 1234 5678',
        direccion: 'Av. Insurgentes Sur 123, CDMX',
        empresa: 'Borderless Techno Company',
        rfc: 'BTC123456789'
      }
    ];

    // Verificar si ya existe el admin
    const [existingAdmin] = await pool.execute('SELECT id FROM usuarios WHERE email = ?', ['admin@borderlesstechno.com']);
    if (existingAdmin.length > 0) {
      return res.json({
        success: true,
        message: 'El usuario admin ya existe',
        admin: { email: 'admin@borderlesstechno.com', password: '123456' }
      });
    }

    // Crear solo el usuario admin
    const user = users[0];
    const hashedPassword = await bcrypt.hash(user.password, 10);
    
    await pool.execute(
      `INSERT INTO usuarios (nombre, email, password, rol, estado, telefono, direccion, empresa, rfc) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.nombre,
        user.email,
        hashedPassword,
        user.rol,
        user.estado,
        user.telefono,
        user.direccion,
        user.empresa,
        user.rfc
      ]
    );
    
    res.json({
      success: true,
      message: 'Usuario admin creado exitosamente',
      admin: { email: 'admin@borderlesstechno.com', password: '123456' }
    });
    
  } catch (error) {
    console.error('Error creando usuario admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando usuario admin',
      error: error.message
    });
  }
});

module.exports = router;