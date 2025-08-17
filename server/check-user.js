const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSpecificUser() {
    console.log('🔍 Buscando usuario: edithjo2015@gmail.com');
    
    try {
        const connection = await mysql.createConnection(process.env.DATABASE_URL);
        
        // Buscar usuario específico
        const [userRows] = await connection.execute(
            'SELECT * FROM usuarios WHERE email = ?', 
            ['edithjo2015@gmail.com']
        );
        
        if (userRows.length > 0) {
            const user = userRows[0];
            console.log('\n✅ Usuario encontrado:');
            console.log(`   ID: ${user.id}`);
            console.log(`   Nombre: ${user.nombre}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Teléfono: ${user.telefono || 'No especificado'}`);
            console.log(`   Rol: ${user.rol}`);
            console.log(`   Estado: ${user.estado}`);
            console.log(`   Fecha de registro: ${new Date(user.created_at).toLocaleDateString('es-ES')}`);
            console.log(`   Última actualización: ${new Date(user.updated_at).toLocaleDateString('es-ES')}`);
            
            // Verificar si tiene contraseña
            if (user.password) {
                console.log(`   ✅ Contraseña configurada: Sí`);
            } else {
                console.log(`   ❌ Contraseña configurada: No`);
            }
        } else {
            console.log('\n❌ Usuario NO encontrado en la base de datos');
            console.log('   El email edithjo2015@gmail.com no está registrado');
        }
        
        await connection.end();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkSpecificUser();