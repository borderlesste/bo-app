
// src/api/axios.js
import axios from 'axios';

// API URLs in order of preference
const API_URLS = [
  import.meta.env.VITE_API_URL,
  'https://saas-backend-33g1.onrender.com',
  'http://localhost:4001'
].filter(Boolean); // Remove null/undefined values

let currentApiUrlIndex = 0;
let isTestingFallback = false;

// Get current base URL
function getCurrentBaseURL() {
  return API_URLS[currentApiUrlIndex] || API_URLS[0];
}

// Test if an API URL is available
async function testApiConnection(baseURL) {
  try {
    const testApi = axios.create({
      baseURL,
      timeout: 3000,
      withCredentials: true
    });
    
    // Try a simple request to test connectivity
    await testApi.get('/api/health');
    return true;
  } catch (error) {
    console.log(`API connection test failed for ${baseURL}:`, error.message);
    return false;
  }
}

// Switch to next available API URL
async function switchToNextAPI() {
  if (isTestingFallback) return false; // Prevent recursive calls
  
  isTestingFallback = true;
  
  for (let i = 0; i < API_URLS.length; i++) {
    if (i === currentApiUrlIndex) continue; // Skip current failing URL
    
    const testURL = API_URLS[i];
    console.log(`🔄 Testing API fallback: ${testURL}`);
    
    if (await testApiConnection(testURL)) {
      currentApiUrlIndex = i;
      api.defaults.baseURL = testURL;
      console.log(`✅ Switched to API: ${testURL}`);
      isTestingFallback = false;
      return true;
    }
  }
  
  isTestingFallback = false;
  console.error('❌ No API endpoints available');
  return false;
}

const api = axios.create({
  baseURL: getCurrentBaseURL(),
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 10000,
});

// Request interceptor para logging y modificaciones de request
api.interceptors.request.use(
  (config) => {
    // Agregar timestamp a requests para debugging
    config.metadata = { startTime: new Date() };
    
    // Log request en modo desarrollo
    if (import.meta.env.DEV) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor para manejo de errores y logging
api.interceptors.response.use(
  (response) => {
    // Calcular tiempo de respuesta
    const endTime = new Date();
    const duration = endTime - response.config.metadata.startTime;
    
    // Log response en modo desarrollo
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`, response.data);
    }
    
    return response;
  },
  async (error) => {
    // Calcular tiempo de respuesta para errores
    let duration = 'unknown';
    if (error.config?.metadata?.startTime) {
      const endTime = new Date();
      duration = endTime - error.config.metadata.startTime;
    }
    
    // Check if this is a network error or server unavailable
    const isNetworkError = error.code === 'NETWORK_ERROR' || 
                          error.code === 'ECONNABORTED' || 
                          !error.response;
    
    // Check if this is a CORS error
    const isCorsError = error.message?.includes('CORS') || 
                       error.message?.includes('Access-Control-Allow-Origin');
    
    // Log error - pero no para errores 401 en auth/profile (es normal)
    const isAuthProfileCheck = error.config?.url?.includes('/api/auth/profile') && error.response?.status === 401;
    if (!isAuthProfileCheck) {
      console.error(`❌ API Error: ${error.config?.method?.toUpperCase() || 'UNKNOWN'} ${error.config?.url || 'UNKNOWN'} (${duration}ms)`, error);
    }
    
    // Try to switch to fallback API if this is a network/CORS error and we haven't retried yet
    if ((isNetworkError || isCorsError) && !error.config._retryAttempted) {
      console.log('🔄 Network/CORS error detected, attempting API fallback...');
      
      const switched = await switchToNextAPI();
      if (switched) {
        // Mark this request as a retry attempt
        error.config._retryAttempted = true;
        error.config.baseURL = getCurrentBaseURL();
        
        console.log(`🔄 Retrying request with fallback API: ${getCurrentBaseURL()}`);
        return api.request(error.config);
      }
    }
    
    // Manejo específico de errores
    const errorMessage = getErrorMessage(error);
    const enhancedError = {
      ...error,
      userMessage: errorMessage,
      statusCode: error.response?.status,
      duration: duration
    };
    
    // Mostrar toast automático para ciertos errores (si toast está disponible)
    if (typeof window !== 'undefined' && window.showToast) {
      if (error.response?.status >= 500) {
        window.showToast({
          type: 'error',
          message: 'Error del servidor. Intenta de nuevo más tarde.',
          duration: 5000
        });
      } else if (error.response?.status === 401) {
        window.showToast({
          type: 'warning',
          message: 'Sesión expirada. Por favor, inicia sesión nuevamente.',
          duration: 5000
        });
      } else if (error.response?.status === 403) {
        window.showToast({
          type: 'error',
          message: 'No tienes permisos para realizar esta acción.',
          duration: 5000
        });
      } else if (error.response?.status === 429) {
        window.showToast({
          type: 'warning',
          message: 'Demasiadas solicitudes. Intenta de nuevo en unos momentos.',
          duration: 5000
        });
      } else if (isNetworkError || isCorsError) {
        window.showToast({
          type: 'error',
          message: 'Error de conexión. Verificando servidores alternativos...',
          duration: 3000
        });
      }
    }
    
    return Promise.reject(enhancedError);
  }
);

// Función para extraer mensajes de error user-friendly
const getErrorMessage = (error) => {
  // Error de red
  if (error.code === 'NETWORK_ERROR' || !error.response) {
    return 'Error de conexión. Verifica tu conexión a internet.';
  }
  
  // Error de timeout
  if (error.code === 'ECONNABORTED') {
    return 'La solicitud tardó demasiado. Intenta de nuevo.';
  }
  
  // Errores con respuesta del servidor
  if (error.response) {
    const { status, data } = error.response;
    
    // Mensaje específico del servidor
    if (data?.message) {
      return data.message;
    }
    
    // Mensajes por código de estado
    switch (status) {
      case 400:
        return 'Datos de entrada inválidos.';
      case 401:
        return 'No autorizado. Inicia sesión nuevamente.';
      case 403:
        return 'No tienes permisos para realizar esta acción.';
      case 404:
        return 'Recurso no encontrado.';
      case 409:
        return 'Conflicto con el estado actual del recurso.';
      case 422:
        return 'Los datos proporcionados no son válidos.';
      case 429:
        return 'Demasiadas solicitudes. Intenta más tarde.';
      case 500:
        return 'Error interno del servidor.';
      case 502:
        return 'Servidor no disponible temporalmente.';
      case 503:
        return 'Servicio no disponible.';
      default:
        return `Error del servidor (${status}).`;
    }
  }
  
  return 'Ha ocurrido un error inesperado.';
};

// Con sesiones basadas en cookies, no necesitamos el interceptor de tokens
// Las cookies se envían automáticamente con withCredentials: true

// Utility functions for API management
export const getApiStatus = () => ({
  currentUrl: getCurrentBaseURL(),
  availableUrls: API_URLS,
  currentIndex: currentApiUrlIndex
});

export const forceApiSwitch = async () => {
  return await switchToNextAPI();
};

// Initialize API with connection test
export const initializeAPI = async () => {
  console.log('🔗 Initializing API connection...');
  
  // Test current API first
  const currentWorks = await testApiConnection(getCurrentBaseURL());
  if (currentWorks) {
    console.log(`✅ API ready: ${getCurrentBaseURL()}`);
    return true;
  }
  
  // Try to find a working API
  const switched = await switchToNextAPI();
  if (switched) {
    console.log(`✅ API initialized with fallback: ${getCurrentBaseURL()}`);
    return true;
  }
  
  console.error('❌ No API endpoints available');
  return false;
};

// --- User Management ---
export const getUsers = (params = {}) => api.get('/api/auth/users', { params });
export const getUser = (id) => api.get(`/api/auth/users/${id}`);
export const getUserStats = (id) => api.get(`/api/auth/users/${id}/stats`);
export const createUser = (userData) => api.post('/api/auth/users', userData);
export const updateUser = (id, userData) => api.put(`/api/auth/users/${id}`, userData);
export const deleteUser = (id) => api.delete(`/api/auth/users/${id}`);

// --- Auth Management ---
export const changePassword = (passwords) => api.post('/api/auth/change-password', passwords);

// --- Order Management (Pedidos) ---
export const getOrders = () => api.get('/api/orders');
export const getOrder = (id) => api.get(`/api/orders/${id}`);
export const createOrder = (orderData) => api.post('/api/orders', orderData);
export const updateOrder = (id, orderData) => api.put(`/api/orders/${id}`, orderData);
export const deleteOrder = (id) => api.delete(`/api/orders/${id}`);
export const updateOrderStatus = (id, status) => api.put(`/api/orders/${id}/status`, { estado: status });
export const getOrderItems = (orderId) => api.get(`/api/orders/${orderId}/items`);

// --- Payment Management (Pagos) ---
export const getPayments = () => api.get('/api/payments');
export const getPayment = (id) => api.get(`/api/payments/${id}`);
export const createAdminPayment = (paymentData) => api.post('/api/payments', paymentData);
export const updateAdminPayment = (id, paymentData) => api.put(`/api/payments/${id}`, paymentData);
export const deletePayment = (id) => api.delete(`/api/payments/${id}`);
export const updatePaymentStatus = (id, status) => api.put(`/api/payments/${id}/status`, { estado: status });

// --- Client-specific Payment Routes ---
export const createClientPayment = (paymentData) => api.post('/api/client-payments', paymentData);
export const updateClientPayment = (id, paymentData) => api.put(`/api/client-payments/${id}`, paymentData);

// --- Payment Applications (Aplicación de Pagos) ---
export const applyPaymentToInvoice = (paymentId, invoiceId, amount) => api.post('/api/payments/apply', { 
  pago_id: paymentId, 
  factura_id: invoiceId, 
  monto_aplicado: amount 
});
export const getPaymentApplications = (paymentId) => api.get(`/api/payments/${paymentId}/applications`);


// --- Config Management ---
export const getConfig = () => api.get('/api/config');
export const updateConfig = (configData) => api.put('/api/config', configData);

// --- Quotes Management (Cotizaciones) ---
export const getQuotes = () => api.get('/api/quotes');
export const getQuote = (id) => api.get(`/api/quotes/${id}`);
export const createQuote = (quoteData) => api.post('/api/quotes', quoteData);
export const updateQuote = (id, quoteData) => api.put(`/api/quotes/${id}`, quoteData);
export const deleteQuote = (id) => api.delete(`/api/quotes/${id}`);
export const updateQuoteStatus = (id, status) => api.put(`/api/quotes/${id}/status`, { estado: status });
export const convertQuoteToOrder = (id) => api.post(`/api/quotes/${id}/convert`);
export const getQuoteItems = (quoteId) => api.get(`/api/quotes/${quoteId}/items`);


// --- Auth Management (additional) ---
export const login = (credentials) => api.post('/api/auth/login', credentials);
export const register = (userData) => api.post('/api/auth/register', userData);
export const getProfile = () => api.get('/api/auth/profile');
export const updateProfile = (profileData) => api.put('/api/auth/profile', profileData);

// --- Client Dashboard Management ---
export const getClientStats = () => api.get('/api/client/dashboard/stats');
export const getClientProjects = () => api.get('/api/client/dashboard/projects');
export const getClientPayments = () => api.get('/api/client/dashboard/payments');
export const getClientActivity = () => api.get('/api/client/dashboard/activity');

// --- Client Quotes Management ---
export const getClientQuotes = (params = {}) => api.get('/api/client/dashboard/quotes', { params });
export const updateClientQuoteStatus = (id, data) => api.put(`/api/client/dashboard/quotes/${id}/status`, data);

// --- Client Profile Management ---
export const getClientProfile = () => api.get('/api/client/dashboard/profile');
export const updateClientProfile = (data) => api.put('/api/client/dashboard/profile', data);
export const changeClientPassword = (data) => api.put('/api/client/dashboard/change-password', data);

// --- Client Orders Management ---
export const getClientOrders = (params = {}) => api.get('/api/client/dashboard/orders', { params });
export const updateClientOrderStatus = (id, data) => api.put(`/api/client/dashboard/orders/${id}/status`, data);

// --- Admin Dashboard Management ---
export const getAdminStats = () => api.get('/api/admin/stats');
export const getRecentActivity = () => api.get('/api/admin/recent-activity');
export const getTopClients = () => api.get('/api/admin/top-clients');
export const getChartsData = (period = 'month') => api.get(`/api/admin/charts?period=${period}`);
export const getFinancialSummary = () => api.get('/api/admin/financial-summary');

// --- Projects Management ---
export const getProjects = () => api.get('/api/projects');
export const getProject = (id) => api.get(`/api/projects/${id}`);
export const uploadProjectImage = (formData) => api.post('/api/projects/upload-image', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const uploadProjectGallery = (projectId, formData) => api.post(`/api/projects/${projectId}/gallery`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const getProjectGallery = (projectId) => api.get(`/api/projects/${projectId}/gallery`);
export const deleteProjectImage = (imageId) => api.delete(`/api/projects/images/${imageId}`);
export const createProject = (projectData) => api.post('/api/projects', projectData);
export const updateProject = (id, projectData) => api.put(`/api/projects/${id}`, projectData);
export const deleteProject = (id) => api.delete(`/api/projects/${id}`);
export const updateProjectStatus = (id, status) => api.put(`/api/projects/${id}/status`, { estado: status });

// --- Services Management ---
export const getServices = (params = {}) => api.get('/api/services', { params });
export const getActiveServices = () => api.get('/api/services/active');
export const getServiceCategories = () => api.get('/api/services/categories');
export const getServicesByCategory = (categoria) => api.get(`/api/services/category/${categoria}`);
export const getMostUsedServices = (limit = 10) => api.get(`/api/services/most-used?limit=${limit}`);
export const getService = (id) => api.get(`/api/services/${id}`);
export const getServiceUsage = (id) => api.get(`/api/services/${id}/usage`);
export const createService = (serviceData) => api.post('/api/services', serviceData);
export const updateService = (id, serviceData) => api.put(`/api/services/${id}`, serviceData);
export const updateServiceStatus = (id, statusData) => api.patch(`/api/services/${id}/status`, statusData);
export const deleteService = (id) => api.delete(`/api/services/${id}`);

// --- Configuration Management ---
export const getGeneralConfig = () => api.get('/api/config/general');
export const updateGeneralConfig = (configData) => api.put('/api/config/general', configData);
export const getPaymentConfig = () => api.get('/api/config/payments');
export const updatePaymentConfig = (configData) => api.put('/api/config/payments', configData);
export const getNotificationConfig = () => api.get('/api/config/notifications');
export const updateNotificationConfig = (configData) => api.put('/api/config/notifications', configData);
export const getSecurityConfig = () => api.get('/api/config/security');
export const updateSecurityConfig = (configData) => api.put('/api/config/security', configData);

// --- Monthly Statistics ---
export const getMonthlyStats = (year, month) => api.get(`/api/stats/monthly?year=${year}&month=${month}`);
export const getAllMonthlyStats = () => api.get('/api/stats/monthly');

// --- Activities Log ---
export const getActivities = () => api.get('/api/activities');
export const getActivityById = (id) => api.get(`/api/activities/${id}`);

// --- Security Log ---
export const getSecurityLog = () => api.get('/api/security/log');
export const getSecurityStats = () => api.get('/api/security/stats');

// --- Sessions Management ---
export const getActiveSessions = () => api.get('/api/sessions');
export const terminateSession = (id) => api.delete(`/api/sessions/${id}`);
export const terminateAllSessions = () => api.delete('/api/sessions/all');

// --- Dashboard Widgets ---
export const getDashboardWidgets = () => api.get('/api/dashboard/widgets');
export const updateDashboardWidget = (id, widgetData) => api.put(`/api/dashboard/widgets/${id}`, widgetData);
export const createDashboardWidget = (widgetData) => api.post('/api/dashboard/widgets', widgetData);
export const deleteDashboardWidget = (id) => api.delete(`/api/dashboard/widgets/${id}`);

// --- Integrations Management ---
export const getIntegrations = () => api.get('/api/integrations');
export const getIntegration = (id) => api.get(`/api/integrations/${id}`);
export const updateIntegration = (id, integrationData) => api.put(`/api/integrations/${id}`, integrationData);
export const testIntegration = (id) => api.post(`/api/integrations/${id}/test`);

// --- Webhooks Management ---
export const getWebhooks = () => api.get('/api/webhooks');
export const getWebhook = (id) => api.get(`/api/webhooks/${id}`);
export const createWebhook = (webhookData) => api.post('/api/webhooks', webhookData);
export const updateWebhook = (id, webhookData) => api.put(`/api/webhooks/${id}`, webhookData);
export const deleteWebhook = (id) => api.delete(`/api/webhooks/${id}`);
export const getWebhookLogs = (webhookId) => api.get(`/api/webhooks/${webhookId}/logs`);

// --- Messages Management ---
export const getMessages = (params = {}) => api.get('/api/messages', { params });
export const getUnreadMessagesCount = () => api.get('/api/messages/unread-count');
export const getUserMessages = (userId) => api.get(`/api/messages/user/${userId}`);
export const getMessage = (id) => api.get(`/api/messages/${id}`);
export const getConversation = (id) => api.get(`/api/messages/${id}/conversation`);
export const createMessage = (messageData) => api.post('/api/messages', messageData);
export const markMessageAsRead = (id) => api.put(`/api/messages/${id}/read`);

// --- Client Notification Settings ---
export const getClientNotificationSettings = () => api.get('/api/client/notification-settings');
export const updateClientNotificationSettings = (settings) => api.put('/api/client/notification-settings', settings);
export const getClientConversations = () => api.get('/api/messages/client/conversations');
export const getClientConversationMessages = (conversationId) => api.get(`/api/messages/client/conversations/${conversationId}/messages`);
export const markClientConversationAsRead = (conversationId) => api.put(`/api/messages/client/conversations/${conversationId}/read`);
export const sendClientMessage = (conversationId, messageData) => api.post(`/api/messages/client/conversations/${conversationId}/messages`, messageData);
export const startClientConversation = (conversationData) => api.post('/api/messages/client/conversations', conversationData);

// Admin messaging functions
export const getAdminConversations = (params = {}) => api.get('/api/messages/admin/conversations', { params });
export const getAdminConversationMessages = (conversationId) => api.get(`/api/messages/admin/conversations/${conversationId}/messages`);
export const adminReplyMessage = (conversationId, messageData) => api.post(`/api/messages/admin/conversations/${conversationId}/reply`, messageData);
export const markMessageAsResponded = (id) => api.patch(`/api/messages/${id}/mark-responded`);
export const archiveMessage = (id) => api.patch(`/api/messages/${id}/archive`);
// import { getClientConversations, getClientConversationMessages, markClientConversationAsRead, sendClientMessage, startClientConversation } from '../../api/axios';

// --- Email Campaigns Management ---
export const getEmailCampaigns = () => api.get('/api/email-campaigns');
export const getEmailCampaign = (id) => api.get(`/api/email-campaigns/${id}`);
export const createEmailCampaign = (campaignData) => api.post('/api/email-campaigns', campaignData);
export const updateEmailCampaign = (id, campaignData) => api.put(`/api/email-campaigns/${id}`, campaignData);
export const deleteEmailCampaign = (id) => api.delete(`/api/email-campaigns/${id}`);
export const sendEmailCampaign = (id) => api.post(`/api/email-campaigns/${id}/send`);

// --- Invoices Management (Facturas) ---
export const getInvoices = (params = {}) => api.get('/api/client/invoices', { params });
export const getAdminInvoices = (params = {}) => api.get('/api/invoices', { params });
export const getInvoice = (id) => api.get(`/api/invoices/${id}`);
export const createInvoice = (invoiceData) => api.post('/api/invoices', invoiceData);
export const updateInvoice = (id, invoiceData) => api.put(`/api/invoices/${id}`, invoiceData);
export const deleteInvoice = (id) => api.delete(`/api/invoices/${id}`);
export const updateInvoiceStatus = (id, statusData) => api.put(`/api/invoices/${id}/status`, statusData);
export const generateInvoiceFromQuotation = (quotationData) => api.post('/api/invoices/generate-from-quotation', quotationData);
export const getInvoiceStats = () => api.get('/api/invoices/stats');
export const generateInvoiceFromPayment = (paymentId) => api.post('/api/invoices/generate-from-payment', { pago_id: paymentId });
export const updateOverdueInvoices = () => api.post('/api/invoices/update-overdue');
export const getInvoiceItems = (invoiceId) => api.get(`/api/invoices/${invoiceId}/items`);
export const generateInvoiceFromOrder = (orderId) => api.post('/api/invoices/generate-from-order', { pedido_id: orderId });
export const downloadClientInvoice = (invoiceId) => api.get(`/api/client/invoices/${invoiceId}/pdf`, { responseType: 'blob' });

// --- Notifications Management ---
export const getNotifications = () => api.get('/api/notifications');
export const getUnreadCount = () => api.get('/api/notifications/unread-count');
export const createNotification = (notificationData) => api.post('/api/notifications', notificationData);
export const markNotificationAsRead = (id) => api.put(`/api/notifications/${id}/read`);
export const markAllNotificationsAsRead = () => api.put('/api/notifications/mark-all-read');
export const deleteNotification = (id) => api.delete(`/api/notifications/${id}`);

// --- Clients Management ---
export const getClients = (params = {}) => api.get('/api/clients', { params });
export const getClient = (id) => api.get(`/api/clients/${id}`);
export const createClient = (clientData) => api.post('/api/clients', clientData);
export const updateClient = (id, clientData) => api.put(`/api/clients/${id}`, clientData);
export const deleteClient = (id) => api.delete(`/api/clients/${id}`);
export const getAllClientsStats = () => api.get('/api/clients/stats');
export const sendMessageToClient = (id, messageData) => api.post(`/api/clients/${id}/message`, messageData);

// --- Quotations Management ---
export const getQuotations = (params = {}) => api.get('/api/quotations', { params });
export const getQuotation = (id) => api.get(`/api/quotations/${id}`);
export const createQuotation = (quotationData) => api.post('/api/quotations', quotationData);
export const updateQuotation = (id, quotationData) => api.put(`/api/quotations/${id}`, quotationData);
export const deleteQuotation = (id) => api.delete(`/api/quotations/${id}`);
export const updateQuotationStatus = (id, statusData) => api.put(`/api/quotations/${id}/status`, statusData);
export const convertQuotationToProject = (id) => api.post(`/api/quotations/${id}/convert`);
export const getQuotationStats = () => api.get('/api/quotations/stats');

// --- Advanced Configuration Management ---
export const getAdvancedConfiguration = () => api.get('/api/config-advanced');
export const updateAdvancedConfiguration = (configData) => api.put('/api/config-advanced', configData);
export const getCompanyInfo = () => api.get('/api/config-advanced/company');
export const updateCompanyInfo = (companyData) => api.put('/api/config-advanced/company', companyData);
export const getThemeSettings = () => api.get('/api/config-advanced/theme');
export const updateThemeSettings = (themeData) => api.put('/api/config-advanced/theme', themeData);
export const getAdvancedSecuritySettings = () => api.get('/api/config-advanced/security');
export const updateAdvancedSecuritySettings = (securityData) => api.put('/api/config-advanced/security', securityData);
export const getBusinessSettings = () => api.get('/api/config-advanced/business');

// --- Enhanced Payments Management ---
export const generatePaymentNumber = () => api.get('/api/payments/generate-number');
export const applyPayment = (paymentId, invoiceId, amount, appliedBy) => api.post('/api/payments/apply', {
  pago_id: paymentId,
  factura_id: invoiceId,
  monto_aplicado: amount,
  applied_by: appliedBy
});
export const getCashFlow = (params = {}) => api.get('/api/payments/cash-flow', { params });

// --- Enhanced Quotations Management ---
export const addQuotationItem = (quotationId, itemData) => api.post(`/api/quotations/${quotationId}/items`, itemData);
export const updateQuotationItem = (itemId, itemData) => api.put(`/api/quotations/items/${itemId}`, itemData);
export const deleteQuotationItem = (itemId) => api.delete(`/api/quotations/items/${itemId}`);

// --- Enhanced Orders Management ---
export const generateOrderNumber = () => api.get('/api/orders/generate-number');
export const getOrderStatusHistory = (orderId) => api.get(`/api/orders/${orderId}/status-history`);
export const getOrdersWithStatus = () => api.get('/api/orders/with-status');

// --- Enhanced Projects Management ---
export const generateProjectCode = (categoria = 'WEB') => api.get(`/api/projects/generate-code?categoria=${categoria}`);
export const getPortfolioProjects = (limit) => api.get(`/api/projects/portfolio${limit ? `?limit=${limit}` : ''}`);
export const getFeaturedProjects = () => api.get('/api/projects/featured');
export const addProjectImage = (projectId, imageData) => api.post(`/api/projects/${projectId}/images`, imageData);
export const updateProjectImage = (imageId, imageData) => api.put(`/api/projects/images/${imageId}`, imageData);

// --- Enhanced Invoices Management ---
export const generateInvoiceNumber = (serie = 'A') => api.get(`/api/invoices/generate-number?serie=${serie}`);
export const getOverdueInvoices = () => api.get('/api/invoices/overdue');
export const addInvoiceItem = (invoiceId, itemData) => api.post(`/api/invoices/${invoiceId}/items`, itemData);
export const updateInvoiceItem = (itemId, itemData) => api.put(`/api/invoices/items/${itemId}`, itemData);
export const deleteInvoiceItem = (itemId) => api.delete(`/api/invoices/items/${itemId}`);

// --- Monthly Statistics Management ---
export const generateCurrentMonthStats = () => api.post('/api/stats/generate-current-month');
export const getStatsComparison = (year1, month1, year2, month2) => 
  api.get(`/api/stats/comparison?year1=${year1}&month1=${month1}&year2=${year2}&month2=${month2}`);

// --- Database Update (temporary) ---
export const updateDatabaseForClients = () => api.post('/api/db-update/update-for-clients');
export const createSampleClients = () => api.post('/api/db-update/create-sample-clients');

export default api;
