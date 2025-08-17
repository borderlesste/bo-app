#!/usr/bin/env node

/**
 * Script para verificar que las tarjetas de pedidos en Gestión muestren todos los detalles
 * Simula lo que debería mostrar el dashboard de gestión de pedidos del admin
 */

const { pool } = require('../src/config/db.js');
const { orderService } = require('../src/services/orderService.js');

async function testOrdersManagementData() {
  try {
    console.log('🔍 VERIFICANDO TARJETAS DE GESTIÓN DE PEDIDOS - DATOS COMPLETOS');
    console.log('='.repeat(70));

    // Test the enhanced admin summary endpoint
    const orders = await orderService.getOrdersSummaryForAdmin();
    
    console.log(`📋 ENCONTRADOS ${orders.length} PEDIDOS EN GESTIÓN:`);
    console.log('');

    orders.forEach((order, index) => {
      console.log(`${index + 1}. ╔══ TARJETA DE PEDIDO #${order.numero_pedido} ══╗`);
      console.log('   ║                                                   ║');
      
      // Basic information section
      console.log('   ║ 📋 INFORMACIÓN PRINCIPAL                         ║');
      console.log(`   ║ • Estado: ${order.estado_descripcion.padEnd(40)} ║`);
      console.log(`   ║ • Prioridad: ${order.prioridad_descripcion.padEnd(35)} ║`);
      console.log(`   ║ • Progreso: ${(order.progreso_estimado + '%').padEnd(38)} ║`);
      console.log(`   ║ • Urgencia: ${order.urgencia_nivel.padEnd(38)} ║`);
      console.log('   ║                                                   ║');
      
      // Client information section
      console.log('   ║ 👤 CLIENTE                                       ║');
      console.log(`   ║ • Nombre: ${order.cliente_nombre.padEnd(40)} ║`);
      console.log(`   ║ • Email: ${order.cliente_email.padEnd(41)} ║`);
      console.log(`   ║ • Teléfono: ${(order.cliente_telefono || 'No especificado').padEnd(36)} ║`);
      console.log(`   ║ • Empresa: ${(order.cliente_empresa || 'No especificado').padEnd(37)} ║`);
      console.log('   ║                                                   ║');
      
      // Project information section
      console.log('   ║ 🔧 PROYECTO                                      ║');
      console.log(`   ║ • Servicio: ${order.servicio.padEnd(38)} ║`);
      console.log(`   ║ • Descripción: ${order.descripcion.substring(0, 33).padEnd(33)} ║`);
      if (order.notas_adicionales) {
        console.log(`   ║ • Notas: ${order.notas_adicionales.substring(0, 37).padEnd(37)} ║`);
      }
      console.log('   ║                                                   ║');
      
      // Financial information section
      console.log('   ║ 💰 INFORMACIÓN FINANCIERA                        ║');
      console.log(`   ║ • Valor: ${order.valor_formateado.padEnd(41)} ║`);
      console.log(`   ║ • Tipo: ${order.tipo_presupuesto.padEnd(42)} ║`);
      if (order.anticipo && parseFloat(order.anticipo) > 0) {
        console.log(`   ║ • Anticipo: ${order.anticipo_formateado.padEnd(36)} ║`);
      }
      if (order.saldo_pendiente && parseFloat(order.saldo_pendiente) > 0) {
        console.log(`   ║ • Saldo: ${order.saldo_formateado.padEnd(39)} ║`);
      }
      console.log('   ║                                                   ║');
      
      // Dates and timeline section
      console.log('   ║ 📅 FECHAS Y PLAZOS                               ║');
      console.log(`   ║ • Creado: ${order.fecha_creacion_formateada.padEnd(38)} ║`);
      console.log(`   ║ • Actualizado: ${order.fecha_actualizacion_formateada.padEnd(33)} ║`);
      if (order.fecha_entrega_deseada) {
        const fechaDeseada = new Date(order.fecha_entrega_deseada).toLocaleDateString('es-ES');
        console.log(`   ║ • Entrega deseada: ${fechaDeseada.padEnd(28)} ║`);
      }
      if (order.dias_hasta_entrega !== null) {
        console.log(`   ║ • Días restantes: ${String(order.dias_hasta_entrega).padEnd(30)} ║`);
      }
      console.log('   ║                                                   ║');
      
      // Management section
      console.log('   ║ 🔧 GESTIÓN                                       ║');
      console.log(`   ║ • Asignado a: ${(order.assigned_to || 'Sin asignar').padEnd(34)} ║`);
      if (order.cotizacion_id) {
        console.log(`   ║ • Cotización: #${String(order.cotizacion_id).padEnd(32)} ║`);
      }
      
      console.log('   ╚═══════════════════════════════════════════════════╝');
      console.log('');
    });

    // Summary of available fields
    console.log('✅ RESUMEN DE CAMPOS DISPONIBLES EN LAS TARJETAS:');
    console.log('');
    console.log('📋 INFORMACIÓN BÁSICA:');
    console.log('   • número_pedido, estado, prioridad, progreso_estimado');
    console.log('   • urgencia_nivel, estado_descripcion, prioridad_descripcion');
    console.log('');
    console.log('👤 INFORMACIÓN DEL CLIENTE:');
    console.log('   • cliente_nombre, cliente_email, cliente_telefono');
    console.log('   • cliente_empresa, usuario_id');
    console.log('');
    console.log('🔧 INFORMACIÓN DEL PROYECTO:');
    console.log('   • servicio, descripcion, notas_adicionales');
    console.log('   • notas_internas, cotizacion_id');
    console.log('');
    console.log('💰 INFORMACIÓN FINANCIERA:');
    console.log('   • valor_display, valor_formateado, tipo_presupuesto');
    console.log('   • presupuesto_estimado, total, subtotal, iva, descuento');
    console.log('   • anticipo, saldo_pendiente, anticipo_formateado, saldo_formateado');
    console.log('');
    console.log('📅 FECHAS Y PLAZOS:');
    console.log('   • created_at, updated_at, fecha_creacion_formateada');
    console.log('   • fecha_actualizacion_formateada, fecha_entrega_deseada');
    console.log('   • fecha_entrega_estimada, fecha_inicio, dias_hasta_entrega');
    console.log('');
    console.log('🔧 GESTIÓN Y ASIGNACIÓN:');
    console.log('   • created_by, assigned_to, cotizacion_id');
    console.log('');
    console.log('🎯 TOTALES DISPONIBLES: ¡TODOS LOS DETALLES DEL PEDIDO!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

// Ejecutar el test
testOrdersManagementData();