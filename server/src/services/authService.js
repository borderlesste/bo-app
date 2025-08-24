const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db.js');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'Wop39Jd!lf0d$w9v1qXL4#dOl1wP';

const authService = {
  async registerUser({ nombre, direccion, telefono, email, password, empresa, rfc }) {
    // Validate all required fields
    if (!nombre || !direccion || !telefono || !email || !password || !empresa || !rfc) {
      throw new Error('Todos los campos son obligatorios');
    }

    // Check if email already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new Error('El email ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if this is the first user (should be admin)
    const allUsers = await User.findAll({ limit: 1 });
    const rol = allUsers.length === 0 ? 'admin' : 'usuario';

    const userId = await User.create({
      nombre: nombre.trim(), 
      email: email.toLowerCase().trim(), 
      password: hashedPassword, 
      rol, 
      telefono: telefono.trim(), 
      direccion: direccion.trim(), 
      empresa: empresa.trim(), 
      rfc: rfc.trim().toUpperCase()
    });

    const user = await User.findById(userId);
    delete user.password;
    return { user };
  },

  async loginUser({ email, password }) {
    const user = await User.findByEmail(email);
    if (!user || user.estado !== 'activo') {
      throw new Error('Credenciales inválidas.');
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      throw new Error('Credenciales inválidas.');
    }

    // Update last access
    await User.updateLastAccess(user.id);

    delete user.password;
    return { user };
  },

  async changeUserPassword({ userId, oldPassword, newPassword }) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado.');
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new Error('Contraseña actual incorrecta.');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await User.update(userId, { password: hashedNewPassword });
  },

  async getUserProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado.');
    }
    
    delete user.password;
    return user;
  },

  async updateUserProfile({ userId, nombre, direccion, telefono, email, empresa, rfc }) {
    const updated = await User.update(userId, {
      nombre, 
      direccion, 
      telefono, 
      email, 
      empresa, 
      rfc
    });
    
    if (!updated) {
      throw new Error('Usuario no encontrado.');
    }
    
    const user = await User.findById(userId);
    delete user.password;
    return user;
  },

  async getAllUsers() {
    return await User.findAll({ estado: 'activo' });
  }
};

module.exports = { authService };
