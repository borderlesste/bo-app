const { pool } = require('../src/config/db');

async function consultarClientes() {
    console.log('👥 CONSULTA DETALLADA DE CLIENTES');
    console.log('=' .repeat(40));
    
    try {
        const connection = await pool.getConnection();
        
        // 1. Conteo total de clientes
        const [totalRows] = await connection.execute('SELECT COUNT(*) as total FROM usuarios');
        const totalClientes = totalRows[0].total;
        
        console.log(`\n📊 RESUMEN GENERAL:`);
        console.log(`   Total de clientes: ${totalClientes}`);
        
        // 2. Clientes por estado
        const [statusRows] = await connection.execute(`
            SELECT estado, COUNT(*) as cantidad 
            FROM usuarios 
            GROUP BY estado
        `);
        
        console.log(`\n🔄 CLIENTES POR ESTADO:`);
        statusRows.forEach(row => {
            console.log(`   ${row.estado}: ${row.cantidad} clientes`);
        });
        
        // 3. Listar todos los clientes (datos básicos)
        const [clientesRows] = await connection.execute(`
            SELECT id, nombre, email, telefono, estado, created_at as fecha_registro 
            FROM usuarios 
            ORDER BY created_at DESC
        `);
        
        console.log(`\n📋 LISTA COMPLETA DE CLIENTES:`);
        clientesRows.forEach((cliente, index) => {
            console.log(`   ${index + 1}. ${cliente.nombre}`);
            console.log(`      Email: ${cliente.email}`);
            console.log(`      Teléfono: ${cliente.telefono || 'No especificado'}`);
            console.log(`      Estado: ${cliente.estado}`);
            console.log(`      Registrado: ${new Date(cliente.fecha_registro).toLocaleDateString('es-ES')}`);
            console.log(`      ID: ${cliente.id}\n`);
        });
        
        // 4. Estadísticas por fecha de registro
        const [statsRows] = await connection.execute(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN estado = 'activo' THEN 1 ELSE 0 END) as activos,
                SUM(CASE WHEN estado = 'inactivo' THEN 1 ELSE 0 END) as inactivos,
                SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as hoy,
                SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as esta_semana,
                SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as este_mes,
                MIN(created_at) as primer_cliente,
                MAX(created_at) as ultimo_cliente
            FROM usuarios
        `);
        
        const stats = statsRows[0];
        
        console.log(`📈 ESTADÍSTICAS DETALLADAS:`);
        console.log(`   Total: ${stats.total}`);
        console.log(`   Activos: ${stats.activos}`);
        console.log(`   Inactivos: ${stats.inactivos}`);
        console.log(`   Registrados hoy: ${stats.hoy}`);
        console.log(`   Esta semana: ${stats.esta_semana}`);
        console.log(`   Este mes: ${stats.este_mes}`);
        console.log(`   Primer cliente: ${new Date(stats.primer_cliente).toLocaleDateString('es-ES')}`);
        console.log(`   Último cliente: ${new Date(stats.ultimo_cliente).toLocaleDateString('es-ES')}`);
        
        // 5. Información relacionada (pedidos y pagos por cliente)
        const [relationRows] = await connection.execute(`
            SELECT 
                c.nombre,
                c.email,
                COUNT(DISTINCT p.id) as total_pedidos,
                COUNT(DISTINCT pg.id) as total_pagos,
                COALESCE(SUM(pg.monto), 0) as total_pagado
            FROM usuarios c
            LEFT JOIN pedidos p ON c.id = p.usuario_id
            LEFT JOIN pagos pg ON c.id = pg.usuario_id
            GROUP BY c.id, c.nombre, c.email
            ORDER BY total_pedidos DESC
        `);
        
        console.log(`\n💼 ACTIVIDAD POR CLIENTE:`);
        relationRows.forEach((rel, index) => {
            console.log(`   ${index + 1}. ${rel.nombre}`);
            console.log(`      Pedidos: ${rel.total_pedidos}`);
            console.log(`      Pagos: ${rel.total_pagos}`);
            console.log(`      Total pagado: $${parseFloat(rel.total_pagado).toFixed(2)}\n`);
        });
        
        connection.release();
        console.log('✅ Consulta completada exitosamente');
        
    } catch (error) {
        console.error('❌ Error consultando clientes:', error.message);
    } finally {
        await pool.end();
    }
}

consultarClientes().catch(console.error);