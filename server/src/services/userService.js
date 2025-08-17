const { pool: db } = require('../config/db.js');
const bcrypt = require('bcryptjs');

const userService = {
  async getAllUsers() {
    const [rows] = await db.execute('SELECT id, nombre, email, telefono, direccion, empresa, rfc, rol, estado, fecha_registro, updated_at FROM usuarios ORDER BY fecha_registro DESC');
    return rows;
  },

  async getUserById(id) {
    const [rows] = await db.execute('SELECT id, nombre, email, telefono, direccion, empresa, rfc, rol, estado, fecha_registro, updated_at FROM usuarios WHERE id = ?', [id]);
    if (rows.length === 0) {
      throw new Error('Usuario no encontrado');
    }
    return rows[0];
  },

  async createUser({ nombre, email, password, telefono, direccion, empresa, rfc, rol, estado }) {
    if (!nombre || !email || !password) {
      throw new Error('Nombre, email y contraseña son requeridos');
    }

    const [existingUser] = await db.execute('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      throw new Error('El email ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await db.execute(
      'INSERT INTO usuarios (nombre, email, password, telefono, direccion, empresa, rfc, rol, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [nombre, email, hashedPassword, telefono, direccion, empresa || null, rfc || null, rol || 'cliente', estado || 'activo']
    );
    
    const [rows] = await db.execute('SELECT id, nombre, email, telefono, direccion, empresa, rfc, rol, estado, fecha_registro, updated_at FROM usuarios WHERE id = ?', [result.insertId]);
    const newUser = rows[0];
    delete newUser.password; 
    return newUser;
  },

  async updateUser(id, { nombre, email, telefono, direccion, empresa, rfc, rol, estado, password }) {
    const [userResult] = await db.execute('SELECT * FROM usuarios WHERE id = ?', [id]);
    if (userResult.length === 0) {
      throw new Error('Usuario no encontrado');
    }

    let hashedPassword;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    let query = `
      UPDATE usuarios 
      SET 
        nombre = ?, 
        email = ?, 
        telefono = ?, 
        direccion = ?, 
        empresa = ?, 
        rfc = ?, 
        rol = ?, 
        estado = ?
    `;
    const params = [nombre, email, telefono, direccion, empresa || null, rfc || null, rol || 'cliente', estado || 'activo'];

    if (password) {
      query += ', password = ?';
      params.push(hashedPassword);
    }

    query += ' WHERE id = ?';
    params.push(id);

    await db.execute(query, params);
    const [rows] = await db.execute('SELECT id, nombre, email, telefono, direccion, empresa, rfc, rol, estado, fecha_registro, updated_at FROM usuarios WHERE id = ?', [id]);
    return rows[0];
  },

  async deleteUser(id) {
    const [result] = await db.execute('DELETE FROM usuarios WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      throw new Error('Usuario no encontrado');
    }
    return { message: `Usuario con id ${id} eliminado correctamente` };
  }
};

module.exports = { userService };
