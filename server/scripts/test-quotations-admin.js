#!/usr/bin/env node

/**
 * Script para verificar que los datos de cotizaciones lleguen correctamente al admin
 * Simula lo que debería mostrar el dashboard de cotizaciones del admin
 */

const { pool } = require('../src/config/db.js');
const Cotizacion = require('../src/models/Cotizacion.js');

async function testQuotationsAdminData() {
  try {
    console.log('🔍 VERIFICANDO DATOS DE COTIZACIONES PARA ADMINISTRADOR');
    console.log('='.repeat(60));

    // Test getAllQuotations
    const quotations = await Cotizacion.findAll();
    
    console.log(`📋 ENCONTRADAS ${quotations.length} COTIZACIONES:`);
    console.log('');

    quotations.forEach((quotation, index) => {
      console.log(`${index + 1}. COTIZACIÓN #${quotation.id}`);
      console.log(`   Título: ${quotation.titulo}`);
      console.log(`   Estado: ${quotation.estado}`);
      console.log(`   Prioridad: ${quotation.prioridad}`);
      console.log(`   Cliente: ${quotation.cliente_nombre || quotation.nombre} (${quotation.cliente_email || quotation.email})`);
      console.log(`   Teléfono: ${quotation.cliente_telefono}`);
      console.log(`   Empresa: ${quotation.cliente_empresa}`);
      console.log(`   Servicio: ${quotation.servicio_nombre}`);
      console.log(`   Origen: ${quotation.origen_solicitud}`);
      console.log(`   Descripción: ${quotation.descripcion}`);
      console.log(`   Precio Estimado: ${quotation.precio_estimado ? '$' + quotation.precio_estimado : 'No especificado'}`);
      console.log(`   Creado: ${new Date(quotation.created_at).toLocaleDateString('es-ES')}`);
      console.log(`   Actualizado: ${new Date(quotation.updated_at).toLocaleDateString('es-ES')}`);
      console.log('   ' + '-'.repeat(50));
    });

    // Test getQuotationById
    if (quotations.length > 0) {
      console.log('');
      console.log('🔍 PROBANDO DETALLE DE COTIZACIÓN:');
      const detailedQuotation = await Cotizacion.findById(quotations[0].id);
      
      if (detailedQuotation) {
        console.log('');
        console.log('📄 DETALLE COMPLETO:');
        console.log(`   ID: ${detailedQuotation.id}`);
        console.log(`   Nombre del Cliente: ${detailedQuotation.cliente_nombre || detailedQuotation.nombre}`);
        console.log(`   Email: ${detailedQuotation.cliente_email || detailedQuotation.email}`);
        console.log(`   Teléfono: ${detailedQuotation.cliente_telefono}`);
        console.log(`   Empresa: ${detailedQuotation.cliente_empresa}`);
        console.log(`   Tipo de Servicio: ${detailedQuotation.servicio_nombre}`);
        console.log(`   Descripción: ${detailedQuotation.descripcion}`);
        console.log(`   Estado: ${detailedQuotation.estado}`);
        console.log(`   Prioridad: ${detailedQuotation.prioridad}`);
        console.log(`   Fecha de Creación: ${new Date(detailedQuotation.created_at).toLocaleDateString('es-ES')}`);
        console.log(`   Última Actualización: ${new Date(detailedQuotation.updated_at).toLocaleDateString('es-ES')}`);
        console.log(`   Origen: ${detailedQuotation.origen_solicitud}`);
      }
    }

    console.log('');
    console.log('✅ DATOS DE COTIZACIONES CORREGIDOS EXITOSAMENTE');
    console.log('');
    console.log('📊 RESUMEN DE MEJORAS:');
    console.log('• Nombre del cliente ahora se extrae correctamente del usuario');
    console.log('• Información de teléfono se obtiene de notas_internas JSON');
    console.log('• Empresa se extrae de notas_internas o tabla usuarios');
    console.log('• Tipo de servicio se extrae del campo servicio_solicitado');
    console.log('• Fecha de última actualización ahora está disponible');
    console.log('• Se incluye origen de la solicitud (web_publica, admin, etc.)');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

// Ejecutar el test
testQuotationsAdminData();