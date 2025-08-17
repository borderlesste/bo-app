// scripts/create-sample-users.js
const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/db.js');

async function createSampleUsers() {
  console.log('🚀 Creando 5 usuarios de ejemplo...');
  
  try {
    const users = [
      {
        nombre: 'Administrador Principal',
        email: 'admin@borderlesstechno.com',
        password: 'admin123',
        rol: 'admin',
        estado: 'activo',
        telefono: '+52 55 1234 5678',
        direccion: 'Av. Insurgentes Sur 123, CDMX',
        empresa: 'Borderless Techno Company',
        rfc: 'BTC123456789'
      },
      {
        nombre: 'Juan Carlos Pérez',
        email: 'juan.perez@ejemplo.com',
        password: 'cliente123',
        rol: 'cliente',
        estado: 'activo',
        telefono: '+52 55 2345 6789',
        direccion: 'Calle Reforma 456, CDMX',
        empresa: 'Empresa ABC S.A. de C.V.',
        rfc: 'ABC987654321'
      },
      {
        nombre: 'María Elena González',
        email: 'maria.gonzalez@ejemplo.com',
        password: 'cliente123',
        rol: 'cliente',
        estado: 'activo',
        telefono: '+52 55 3456 7890',
        direccion: 'Blvd. Miguel de Cervantes 789, Guadalajara',
        empresa: 'Innovaciones XYZ',
        rfc: 'XYZ456789123'
      },
      {
        nombre: 'Roberto Silva Martinez',
        email: 'roberto.silva@ejemplo.com',
        password: 'cliente123',
        rol: 'cliente',
        estado: 'activo',
        telefono: '+52 81 4567 8901',
        direccion: 'Av. Constitución 321, Monterrey',
        empresa: 'TechSolutions Pro',
        rfc: 'TSP789123456'
      },
      {
        nombre: 'Ana Patricia Rodríguez',
        email: 'ana.rodriguez@ejemplo.com',
        password: 'empleado123',
        rol: 'empleado',
        estado: 'activo',
        telefono: '+52 33 5678 9012',
        direccion: 'Calle Juárez 654, Puebla',
        empresa: 'Borderless Techno Company',
        rfc: 'APR321654987'
      }
    ];

    // Verificar si ya existen usuarios para evitar duplicados
    const [existingUsers] = await pool.execute('SELECT COUNT(*) as count FROM usuarios');
    if (existingUsers[0].count > 0) {
      console.log('⚠️  Ya existen usuarios en la base de datos. Eliminando usuarios existentes...');
      await pool.execute('DELETE FROM usuarios');
      console.log('✅ Usuarios existentes eliminados');
    }

    console.log('📝 Insertando usuarios...');
    
    for (const [index, user] of users.entries()) {
      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      try {
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
        
        console.log(`✅ Usuario ${index + 1}: ${user.nombre} (${user.rol}) - ${user.email}`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️  Usuario ${user.email} ya existe, saltando...`);
        } else {
          throw error;
        }
      }
    }
    
    // Verificar que se crearon correctamente
    const [finalUsers] = await pool.execute(`
      SELECT id, nombre, email, rol, estado, telefono, empresa, created_at 
      FROM usuarios 
      ORDER BY id ASC
    `);
    
    console.log('\n📊 Usuarios creados exitosamente:');
    console.table(finalUsers);
    
    console.log('\n🔑 Credenciales de acceso:');
    console.log('👤 Admin: admin@borderlesstechno.com / admin123');
    console.log('👤 Cliente 1: juan.perez@ejemplo.com / cliente123');
    console.log('👤 Cliente 2: maria.gonzalez@ejemplo.com / cliente123');
    console.log('👤 Cliente 3: roberto.silva@ejemplo.com / cliente123');
    console.log('👤 Empleado: ana.rodriguez@ejemplo.com / empleado123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear usuarios:', error.message);
    process.exit(1);
  }
}

createSampleUsers();