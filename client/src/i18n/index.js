import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Traducciones
const resources = {
  es: {
    translation: {
      // Pagos
      'payment.method': 'Método de Pago',
      'payment.amount': 'Monto',
      'payment.total': 'Total',
      'payment.currency': 'Moneda',
      'payment.description': 'Descripción',
      'payment.reference': 'Referencia',
      'payment.status': 'Estado',
      'payment.pending': 'Pendiente',
      'payment.completed': 'Completado',
      'payment.failed': 'Fallido',
      'payment.cancelled': 'Cancelado',
      'payment.processing': 'Procesando',
      'payment.success': 'Pago exitoso',
      'payment.error': 'Error en el pago',
      'payment.confirm': 'Confirmar Pago',
      'payment.cancel': 'Cancelar',
      'payment.close': 'Cerrar',
      'payment.copy': 'Copiar',
      'payment.copied': 'Copiado',
      'payment.bank_transfer': 'Transferencia Bancaria',
      'payment.credit_card': 'Tarjeta de Crédito',
      'payment.cash': 'Efectivo',
      'payment.check': 'Cheque',
      'payment.online': 'Pago en Línea',
      
      // Formularios
      'form.required': 'Campo obligatorio',
      'form.invalid': 'Formato inválido',
      'form.save': 'Guardar',
      'form.cancel': 'Cancelar',
      'form.edit': 'Editar',
      'form.delete': 'Eliminar',
      'form.add': 'Agregar',
      'form.update': 'Actualizar',
      'form.search': 'Buscar',
      'form.filter': 'Filtrar',
      'form.clear': 'Limpiar',
      'form.submit': 'Enviar',
      
      // Mensajes
      'message.success': 'Operación exitosa',
      'message.error': 'Ocurrió un error',
      'message.warning': 'Advertencia',
      'message.info': 'Información',
      'message.loading': 'Cargando...',
      'message.no_data': 'No hay datos disponibles',
      'message.confirm_delete': '¿Estás seguro de que deseas eliminar este elemento?',
      
      // Navegación
      'nav.home': 'Inicio',
      'nav.dashboard': 'Panel',
      'nav.clients': 'Clientes',
      'nav.projects': 'Proyectos',
      'nav.quotes': 'Cotizaciones',
      'nav.invoices': 'Facturas',
      'nav.payments': 'Pagos',
      'nav.reports': 'Reportes',
      'nav.settings': 'Configuración',
      'nav.logout': 'Cerrar Sesión',
      
      // Estados
      'status.active': 'Activo',
      'status.inactive': 'Inactivo',
      'status.pending': 'Pendiente',
      'status.approved': 'Aprobado',
      'status.rejected': 'Rechazado',
      'status.draft': 'Borrador',
      'status.published': 'Publicado',
      
      // Fechas
      'date.today': 'Hoy',
      'date.yesterday': 'Ayer',
      'date.tomorrow': 'Mañana',
      'date.this_week': 'Esta semana',
      'date.last_week': 'Semana pasada',
      'date.this_month': 'Este mes',
      'date.last_month': 'Mes pasado',
      
      // Unidades
      'unit.currency.mxn': 'MXN',
      'unit.currency.usd': 'USD',
      'unit.currency.eur': 'EUR',
      'unit.time.days': 'días',
      'unit.time.hours': 'horas',
      'unit.time.minutes': 'minutos',
    }
  },
  en: {
    translation: {
      // Payments
      'payment.method': 'Payment Method',
      'payment.amount': 'Amount',
      'payment.total': 'Total',
      'payment.currency': 'Currency',
      'payment.description': 'Description',
      'payment.reference': 'Reference',
      'payment.status': 'Status',
      'payment.pending': 'Pending',
      'payment.completed': 'Completed',
      'payment.failed': 'Failed',
      'payment.cancelled': 'Cancelled',
      'payment.processing': 'Processing',
      'payment.success': 'Payment successful',
      'payment.error': 'Payment error',
      'payment.confirm': 'Confirm Payment',
      'payment.cancel': 'Cancel',
      'payment.close': 'Close',
      'payment.copy': 'Copy',
      'payment.copied': 'Copied',
      'payment.bank_transfer': 'Bank Transfer',
      'payment.credit_card': 'Credit Card',
      'payment.cash': 'Cash',
      'payment.check': 'Check',
      'payment.online': 'Online Payment',
      
      // Forms
      'form.required': 'Required field',
      'form.invalid': 'Invalid format',
      'form.save': 'Save',
      'form.cancel': 'Cancel',
      'form.edit': 'Edit',
      'form.delete': 'Delete',
      'form.add': 'Add',
      'form.update': 'Update',
      'form.search': 'Search',
      'form.filter': 'Filter',
      'form.clear': 'Clear',
      'form.submit': 'Submit',
      
      // Messages
      'message.success': 'Operation successful',
      'message.error': 'An error occurred',
      'message.warning': 'Warning',
      'message.info': 'Information',
      'message.loading': 'Loading...',
      'message.no_data': 'No data available',
      'message.confirm_delete': 'Are you sure you want to delete this item?',
      
      // Navigation
      'nav.home': 'Home',
      'nav.dashboard': 'Dashboard',
      'nav.clients': 'Clients',
      'nav.projects': 'Projects',
      'nav.quotes': 'Quotes',
      'nav.invoices': 'Invoices',
      'nav.payments': 'Payments',
      'nav.reports': 'Reports',
      'nav.settings': 'Settings',
      'nav.logout': 'Logout',
      
      // Status
      'status.active': 'Active',
      'status.inactive': 'Inactive',
      'status.pending': 'Pending',
      'status.approved': 'Approved',
      'status.rejected': 'Rejected',
      'status.draft': 'Draft',
      'status.published': 'Published',
      
      // Dates
      'date.today': 'Today',
      'date.yesterday': 'Yesterday',
      'date.tomorrow': 'Tomorrow',
      'date.this_week': 'This week',
      'date.last_week': 'Last week',
      'date.this_month': 'This month',
      'date.last_month': 'Last month',
      
      // Units
      'unit.currency.mxn': 'MXN',
      'unit.currency.usd': 'USD',
      'unit.currency.eur': 'EUR',
      'unit.time.days': 'days',
      'unit.time.hours': 'hours',
      'unit.time.minutes': 'minutes',
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'es', // idioma por defecto
    fallbackLng: 'es',
    
    interpolation: {
      escapeValue: false, // React ya maneja el escape por defecto
    },
    
    // Configuración adicional
    debug: import.meta.env.DEV
  });

export default i18n;