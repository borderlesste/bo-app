const { userService } = require('../services/userService.js');

// Obtener todos los usuarios (para el admin)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Obtener un usuario por ID
exports.getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await userService.getUserById(id);
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error(`Error fetching user with id ${id}:`, error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Crear un nuevo usuario (desde el panel de admin)
exports.createUser = async (req, res) => {
  try {
    const newUser = await userService.createUser(req.body);
    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Actualizar un usuario
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedUser = await userService.updateUser(id, req.body);
    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error(`Error updating user with id ${id}:`, error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Eliminar un usuario
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await userService.deleteUser(id);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error(`Error deleting user with id ${id}:`, error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};
