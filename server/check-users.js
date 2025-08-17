const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkUsers() {
    console.log('🔍 Consultando usuarios registrados...');
    
    try {
        // Usar la DATABASE_URL del .env original
        const connection = await mysql.createConnection('mysql://dblzyyrh_techno:dblzyyrh_techno@216.246.47.89:3306/dblzyyrh_techno');
        
        // Contar usuarios
        const [rows] = await connection.execute('SELECT COUNT(*) as total FROM usuarios');
        const totalUsers = rows[0].total;
        
        console.log(`\n👥 Total de usuarios registrados: ${totalUsers}`);
        
        // Obtener algunos detalles
        const [userRows] = await connection.execute(`
            SELECT nombre, email, rol, estado, created_at 
            FROM usuarios 
            ORDER BY created_at DESC 
            LIMIT 10
        `);
        
        if (userRows.length > 0) {
            console.log('\n📋 Últimos usuarios registrados:');
            userRows.forEach((user, index) => {
                console.log(`   ${index + 1}. ${user.nombre} (${user.email})`);
                console.log(`      Rol: ${user.rol} | Estado: ${user.estado}`);
                console.log(`      Registrado: ${new Date(user.created_at).toLocaleDateString('es-ES')}\n`);
            });
        }
        
        // Estadísticas por rol
        const [roleStats] = await connection.execute(`
            SELECT rol, COUNT(*) as cantidad 
            FROM usuarios 
            GROUP BY rol
        `);
        
        console.log('📊 Usuarios por rol:');
        roleStats.forEach(stat => {
            console.log(`   ${stat.rol}: ${stat.cantidad} usuarios`);
        });
        
        await connection.end();
        console.log('\n✅ Consulta completada');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkUsers();