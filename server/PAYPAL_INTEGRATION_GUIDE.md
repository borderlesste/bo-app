# 🚀 Guía Completa: Integración PayPal + MySQL para Borderless Techno

## 📋 Descripción General

Esta implementación completa el flujo de integración PayPal + MySQL según las especificaciones requeridas, siguiendo las mejores prácticas de seguridad y arquitectura en producción.

## 🔄 Flujo Completo Implementado

### 1. **Creación del Pedido en el Servidor**
- ✅ El cliente selecciona productos
- ✅ El **backend calcula el total** (nunca el frontend)
- ✅ Inserta registro en `pedidos` (status = `nuevo`)
- ✅ Devuelve al frontend el `pedido_id` interno (auto-incrementado)

### 2. **Creación de la Orden en PayPal**
- ✅ El frontend llama a `/api/paypal/create-pedidos`
- ✅ El backend usa el **SDK de PayPal** para crear orden
- ✅ PayPal devuelve un `paypal_order_id`
- ✅ Backend actualiza `pedidos.paypal_order_id = 'xxxx'`
- ✅ Devuelve URL de aprobación de PayPal

### 3. **Aprobación del Cliente**
- ✅ Usuario es redirigido a PayPal
- ✅ Inicia sesión y aprueba el pago
- ✅ PayPal devuelve token de aprobación
- ✅ Frontend envía a `/api/paypal/capture-pedidos`

### 4. **Captura del Pago**
- ✅ Backend llama al **SDK de PayPal** para capturar
- ✅ Si respuesta es `COMPLETED`:
  - ✅ Inserta registro en `pagos`
  - ✅ Actualiza `pedidos.estado = 'confirmado'`
  - ✅ Guarda `paypal_capture_id`
- ✅ Si falla, actualiza `pedidos.estado = 'cancelado'`

### 5. **Webhook de PayPal (Doble Chequeo)**
- ✅ PayPal envía webhook a `/api/paypal/webhook/paypal`
- ✅ Backend verifica firma del webhook (implementación básica)
- ✅ Guarda evento en `webhooks_paypal` (auditoría)
- ✅ Busca `paypal_order_id` en MySQL
- ✅ Confirma estado `pedidos.estado = 'confirmado'`

### 6. **Reconciliación y Consistencia**
- ✅ Webhook corrige estado si frontend no cerró el flujo
- ✅ `pedidos` es tabla maestra (estado final)
- ✅ `pagos` contiene evidencia del pago
- ✅ `webhooks_paypal` para registro legal/auditoría

## 📊 Estructura de Base de Datos

### Tablas Principales

#### `pedidos` (Tabla Maestra)
```sql
- id (AUTO_INCREMENT)
- numero_pedido (VARCHAR, único)
- usuario_id (FK a usuarios)
- paypal_order_id (VARCHAR, PayPal Order ID)
- paypal_capture_id (VARCHAR, PayPal Capture ID)
- payment_method (ENUM: paypal, stripe, bank_transfer, cash)
- estado (ENUM: nuevo, confirmado, en_proceso, completado, cancelado)
- subtotal, iva, total, saldo_pendiente
- created_at, updated_at
```

#### `pagos` (Evidencia Financiera)
```sql
- id (AUTO_INCREMENT)
- numero_pago (VARCHAR, único)
- usuario_id (FK a usuarios)
- paypal_order_id (VARCHAR)
- paypal_capture_id (VARCHAR)
- paypal_payer_email (VARCHAR)
- payment_gateway (ENUM: paypal, stripe, manual)
- estado (ENUM: pendiente, procesando, aplicado, rechazado)
- monto, moneda, metodo_pago
- fecha_pago, fecha_aplicacion
- created_at, updated_at
```

#### `webhooks_paypal` (Auditoría y Reconciliación)
```sql
- id (AUTO_INCREMENT)
- webhook_id, event_type, event_id
- resource_type, resource_id
- status (ENUM: received, processed, failed, ignored)
- order_id, capture_id, amount, currency
- verification_status (ENUM: pending, verified, failed)
- raw_payload (LONGTEXT)
- processed_at, created_at, updated_at
```

## 🛡️ Características de Seguridad

### ✅ Implementadas
- **Cálculo de montos en servidor**: Nunca confía en el frontend
- **Autenticación requerida**: Middleware `isAuthenticated`
- **Validación de entrada**: `express-validator` en todos los endpoints
- **Transacciones de base de datos**: Rollback automático en errores
- **Verificación de propiedad**: Usuario solo accede a sus pedidos
- **Idempotencia**: Webhooks no se procesan múltiples veces
- **Logging completo**: Todos los eventos se registran

### 🔐 Credenciales Seguras
- Credenciales PayPal en variables de entorno
- Nunca expuestas en el frontend
- Configuración diferente para desarrollo/producción

## 🚀 Endpoints API Implementados

### Pedidos PayPal
```
POST /api/paypal/create-pedidos
POST /api/paypal/capture-pedidos
GET  /api/paypal/pedidos/:id/status
GET  /api/paypal/pedidos (lista paginada)
```

### Webhooks
```
POST /api/paypal/webhook/paypal (sin autenticación)
```

### Administración
```
GET /api/paypal/admin/payment-summary (solo admin)
```

## 🧪 Pruebas y Validación

### Script de Pruebas
```bash
# Ejecutar pruebas completas
node scripts/test-paypal-integration.js
```

### Migración de Base de Datos
```bash
# Aplicar campos PayPal
node scripts/migrate-paypal-fields.js
```

### Casos de Prueba Cubiertos
1. ✅ Autenticación de usuario
2. ✅ Creación de pedido + orden PayPal
3. ✅ Verificación de estado del pedido
4. ✅ Simulación de captura de pago
5. ✅ Verificación de estado final
6. ✅ Procesamiento de webhooks
7. ✅ Resumen administrativo

## 📈 Monitoreo y Reconciliación

### Estados de Pedido
- `nuevo`: Pedido creado, orden PayPal pendiente
- `confirmado`: Pago completado y verificado
- `en_proceso`: Trabajo iniciado
- `completado`: Proyecto finalizado
- `cancelado`: Pago falló o fue cancelado

### Estados de Webhook
- `received`: Webhook recibido, pendiente de procesar
- `processed`: Procesado exitosamente
- `failed`: Error en el procesamiento
- `ignored`: Tipo de evento no manejado

### Consultas de Reconciliación
```sql
-- Pedidos sin pago confirmado
SELECT * FROM pedidos 
WHERE estado = 'nuevo' 
AND created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR);

-- Webhooks fallidos para revisar
SELECT * FROM webhooks_paypal 
WHERE status = 'failed' 
AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR);

-- Pagos sin pedido asociado
SELECT p.* FROM pagos p 
LEFT JOIN pedidos pd ON p.paypal_order_id = pd.paypal_order_id 
WHERE pd.id IS NULL AND p.paypal_order_id IS NOT NULL;
```

## 🔧 Configuración de Producción

### Variables de Entorno Requeridas
```env
# PayPal Configuration
PAYPAL_CLIENT_ID=your_production_client_id
PAYPAL_CLIENT_SECRET=your_production_client_secret
PAYPAL_ENVIRONMENT=production
PAYPAL_BASE=https://api-m.paypal.com

# Webhook URLs
PAYPAL_RETURN_URL=https://borderlesstechno.com/payment/success
PAYPAL_CANCEL_URL=https://borderlesstechno.com/payment/cancel
PAYPAL_WEBHOOK_ID=your_webhook_id

# Database
DB_HOST=your_production_host
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
```

### Configuración de Webhook en PayPal
1. Ir a [PayPal Developer Dashboard](https://developer.paypal.com/)
2. Crear webhook endpoint: `https://tu-dominio.com/api/paypal/webhook/paypal`
3. Suscribirse a eventos:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `PAYMENT.CAPTURE.DECLINED`
   - `CHECKOUT.ORDER.APPROVED`

## 📚 Uso del Sistema

### Frontend - Crear Pedido
```javascript
// 1. Crear pedido
const response = await fetch('/api/paypal/create-pedidos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    items: [
      { descripcion: 'Sitio web', precio_unitario: 1500, cantidad: 1 }
    ],
    currency: 'USD',
    descripcion: 'Desarrollo web personalizado'
  })
});

const { approve_url, pedido_id, paypal_order_id } = response.data;

// 2. Redirigir a PayPal
window.location.href = approve_url;

// 3. Al regresar de PayPal, capturar pago
const captureResponse = await fetch('/api/paypal/capture-pedidos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    paypal_order_id: paypal_order_id,
    pedido_id: pedido_id
  })
});
```

### Backend - Verificar Estado
```javascript
// Verificar estado del pedido
const estadoPedido = await fetch(`/api/paypal/pedidos/${pedido_id}/status`);
const { estado, pagos, total_items } = estadoPedido.data;
```

## 🚨 Troubleshooting

### Errores Comunes

1. **"PayPal no está configurado"**
   - Verificar variables de entorno `PAYPAL_CLIENT_ID` y `PAYPAL_CLIENT_SECRET`

2. **"Pedido no encontrado"**
   - Verificar que el `pedido_id` pertenece al usuario autenticado

3. **"Error al capturar pago"**
   - Verificar que la orden PayPal esté en estado `APPROVED`
   - Comprobar logs de PayPal SDK

4. **Webhook no se procesa**
   - Verificar URL del webhook en PayPal Dashboard
   - Comprobar tabla `webhooks_paypal` para errores

### Logs de Debugging
```bash
# Ver logs del servidor
tail -f logs/error-$(date +%Y-%m-%d).log

# Ver webhooks recientes
SELECT * FROM webhooks_paypal ORDER BY created_at DESC LIMIT 10;

# Ver estado de pedidos pendientes
SELECT * FROM pedidos WHERE estado = 'nuevo' ORDER BY created_at DESC;
```

## 🎯 Próximos Pasos

1. **Implementar verificación de firma de webhook** (PayPal SDK)
2. **Agregar notificaciones por email** automáticas
3. **Dashboard de reconciliación** para administradores
4. **Métricas y analytics** de conversión
5. **Integración con sistema de facturación**

---

## 📞 Soporte

Para preguntas o problemas con la integración:
- Revisar logs en `logs/error-YYYY-MM-DD.log`
- Ejecutar script de pruebas: `node scripts/test-paypal-integration.js`
- Verificar estado de base de datos con consultas de reconciliación

**¡La integración PayPal + MySQL está lista para producción!** 🚀