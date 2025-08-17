const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController.js');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware.js');

// Todas las rutas de este archivo están protegidas y requieren rol de administrador
router.use(isAuthenticated, isAdmin);

// GET /api/users - Obtener todos los usuarios
router.get('/', userController.getAllUsers);

// GET /api/users/:id - Obtener un usuario por ID
router.get('/:id', userController.getUserById);

// POST /api/users - Crear un nuevo usuario
router.post('/', userController.createUser);

// PUT /api/users/:id - Actualizar un usuario
router.put('/:id', userController.updateUser);

// DELETE /api/users/:id - Eliminar un usuario
router.delete('/:id', userController.deleteUser);

module.exports = router;
