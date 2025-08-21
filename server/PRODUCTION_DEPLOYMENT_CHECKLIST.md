# 🚀 Checklist de Deployment a Producción - Integración PayPal

## ✅ **Pre-requisitos Completados**

- [✅] Migración de base de datos ejecutada
- [✅] Pruebas de integración PayPal completadas
- [✅] Webhook PayPal configurado y funcional
- [✅] SDK PayPal verificado y operativo
- [✅] Flujo completo de pago probado end-to-end

---

## 🔧 **Configuración de Producción PayPal**

### 1. **Obtener Credenciales de Producción PayPal**

- [ ] Crear cuenta business en [PayPal](https://paypal.com)
- [ ] Acceder a [PayPal Developer Dashboard](https://developer.paypal.com/)
- [ ] Crear aplicación para producción
- [ ] Obtener `Client ID` y `Client Secret` de producción
- [ ] Documentar credenciales de forma segura

### 2. **Configurar Variables de Entorno**

```env
# PayPal Production Configuration
PAYPAL_CLIENT_ID=your_production_client_id_here
PAYPAL_CLIENT_SECRET=your_production_client_secret_here
PAYPAL_ENVIRONMENT=production
PAYPAL_BASE=https://api-m.paypal.com

# Production URLs
PAYPAL_RETURN_URL=https://borderlesstechno.com/payment/success
PAYPAL_CANCEL_URL=https://borderlesstechno.com/payment/cancel

# Webhook Configuration
PAYPAL_WEBHOOK_ID=your_production_webhook_id
```

### 3. **Configurar Webhook en PayPal Dashboard**

- [ ] Ir a PayPal Developer → My Apps & Credentials
- [ ] Seleccionar aplicación de producción
- [ ] Agregar webhook endpoint: `https://tu-dominio.com/api/paypal/webhook/paypal`
- [ ] Suscribirse a eventos:
  - [x] `PAYMENT.CAPTURE.COMPLETED`
  - [x] `PAYMENT.CAPTURE.DENIED`
  - [x] `PAYMENT.CAPTURE.DECLINED`
  - [x] `CHECKOUT.ORDER.APPROVED`
- [ ] Guardar `Webhook ID` generado

---

## 🗄️ **Base de Datos de Producción**

### 1. **Ejecutar Migración PayPal**

```bash
# En el servidor de producción
npm run db:migrate:paypal
```

### 2. **Verificar Estructura de Tablas**

- [ ] Verificar campos PayPal en tabla `pedidos`
- [ ] Verificar campos PayPal en tabla `pagos`
- [ ] Confirmar tabla `webhooks_paypal` creada
- [ ] Verificar índices para optimización

### 3. **Backup de Base de Datos**

```bash
# Crear backup antes del deployment
npm run db:backup
```

---

## 🚀 **Deployment del Servidor**

### 1. **Variables de Entorno de Producción**

- [ ] `NODE_ENV=production`
- [ ] `PAYPAL_ENVIRONMENT=production`
- [ ] Todas las variables PayPal configuradas
- [ ] URLs de webhook actualizadas

### 2. **Configuración de Seguridad**

- [ ] Verificar HTTPS habilitado
- [ ] Configurar CORS para dominio de producción
- [ ] Rate limiting configurado
- [ ] Headers de seguridad habilitados

### 3. **Deploy del Código**

```bash
# Build y deploy
git pull origin main
npm install --production
npm run start:production
```

---

## 🧪 **Pruebas en Producción**

### 1. **Pruebas de Conectividad**

- [ ] Verificar endpoints PayPal responden
- [ ] Confirmar webhook recibe eventos
- [ ] Probar autenticación de usuarios

### 2. **Pruebas de Pago**

- [ ] Crear pedido de prueba (monto pequeño)
- [ ] Completar flujo PayPal real
- [ ] Verificar captura de pago
- [ ] Confirmar webhook procesa correctamente
- [ ] Verificar estado en base de datos

### 3. **Pruebas de Reconciliación**

- [ ] Verificar estados consistentes
- [ ] Probar recuperación de webhooks
- [ ] Confirmar logging de eventos

---

## 📊 **Monitoreo y Alertas**

### 1. **Configurar Logging**

- [ ] Logs de PayPal SDK habilitados
- [ ] Logs de webhook configurados
- [ ] Monitoring de errores activo

### 2. **Métricas a Monitorear**

- [ ] Tasa de éxito de pagos
- [ ] Tiempo de respuesta de PayPal
- [ ] Webhooks procesados vs fallidos
- [ ] Discrepancias en reconciliación

### 3. **Alertas Críticas**

- [ ] Fallos de autenticación PayPal
- [ ] Webhooks fallando consecutivamente
- [ ] Pedidos sin captura por más de 1 hora
- [ ] Errores de base de datos

---

## 🔐 **Verificaciones de Seguridad**

### 1. **Credenciales**

- [ ] No hay credenciales hardcodeadas
- [ ] Variables de entorno seguras
- [ ] Acceso restringido a .env

### 2. **Validaciones**

- [ ] Validación de entrada habilitada
- [ ] Verificación de propiedad de pedidos
- [ ] Verificación de firma webhook

### 3. **Auditoría**

- [ ] Logs de eventos de seguridad
- [ ] Registro de accesos administrativos
- [ ] Trazabilidad de transacciones

---

## 📋 **Checklist Final de Go-Live**

### Pre-Launch

- [ ] Todas las pruebas pasando
- [ ] Backup de base de datos completado
- [ ] Credenciales de producción configuradas
- [ ] Webhook PayPal configurado y verificado
- [ ] Monitoring y alertas activos

### Launch

- [ ] Deploy a producción ejecutado
- [ ] Verificación de endpoints PayPal
- [ ] Prueba de pago real (monto mínimo)
- [ ] Confirmación de webhook funcionando
- [ ] Verificación de datos en base de datos

### Post-Launch

- [ ] Monitoreo activo por 24 horas
- [ ] Revisión de logs de errores
- [ ] Verificación de métricas de pago
- [ ] Documentación de incidencias

---

## 🆘 **Plan de Rollback**

### En caso de problemas críticos:

1. **Immediate Actions**
   - [ ] Revertir a versión anterior
   - [ ] Restaurar backup de base de datos
   - [ ] Notificar stakeholders

2. **Recovery Steps**
   - [ ] Identificar causa raíz
   - [ ] Aplicar fix en desarrollo
   - [ ] Re-ejecutar pruebas completas
   - [ ] Planificar nuevo deployment

---

## 📞 **Contactos de Emergencia**

- **PayPal Technical Support**: [PayPal Developer Support](https://developer.paypal.com/support/)
- **Database Admin**: [Tu contacto DBA]
- **DevOps Team**: [Tu equipo DevOps]
- **Product Owner**: [Dueño del producto]

---

## 📝 **Documentación Post-Deployment**

- [ ] Actualizar documentación de API
- [ ] Documentar configuración de producción
- [ ] Actualizar guías de troubleshooting
- [ ] Registrar métricas baseline

---

## ✅ **Sign-off**

| Rol | Nombre | Fecha | Firma |
|-----|--------|--------|-------|
| Developer | ____________ | ______ | _______ |
| DevOps | ____________ | ______ | _______ |
| QA | ____________ | ______ | _______ |
| Product Owner | ____________ | ______ | _______ |

---

**🎯 Una vez completado este checklist, la integración PayPal + MySQL estará lista para producción con todas las garantías de seguridad, monitoreo y recuperación necesarias.**