// Enhanced API services for new database features
import api from './axios.js';

// --- Services API ---
export const servicesAPI = {
  // Get all services with filters
  getAll: (params = {}) => api.get('/api/services', { params }),
  
  // Get active services only
  getActive: () => api.get('/api/services/active'),
  
  // Get service categories
  getCategories: () => api.get('/api/services/categories'),
  
  // Get services by category
  getByCategory: (categoria) => api.get(`/api/services/category/${categoria}`),
  
  // Get most used services
  getMostUsed: (limit = 10) => api.get(`/api/services/most-used?limit=${limit}`),
  
  // Get service by ID
  getById: (id) => api.get(`/api/services/${id}`),
  
  // Get service usage statistics
  getUsage: (id) => api.get(`/api/services/${id}/usage`),
  
  // Create new service
  create: (serviceData) => api.post('/api/services', serviceData),
  
  // Update service
  update: (id, serviceData) => api.put(`/api/services/${id}`, serviceData),
  
  // Update service status
  updateStatus: (id, estado) => api.patch(`/api/services/${id}/status`, { estado }),
  
  // Delete service
  delete: (id) => api.delete(`/api/services/${id}`)
};

// --- Messages API ---
export const messagesAPI = {
  // Get all messages with filters
  getAll: (params = {}) => api.get('/api/messages', { params }),
  
  // Get unread messages count
  getUnreadCount: () => api.get('/api/messages/unread-count'),
  
  // Get user messages
  getUserMessages: (userId) => api.get(`/api/messages/user/${userId}`),
  
  // Get message by ID
  getById: (id) => api.get(`/api/messages/${id}`),
  
  // Get conversation thread
  getConversation: (id) => api.get(`/api/messages/${id}/conversation`),
  
  // Create new message
  create: (messageData) => api.post('/api/messages', messageData),
  
  // Mark message as read
  markAsRead: (id) => api.put(`/api/messages/${id}/read`),
  
  // Mark message as responded
  markAsResponded: (id) => api.patch(`/api/messages/${id}/mark-responded`),
  
  // Archive message
  archive: (id) => api.patch(`/api/messages/${id}/archive`)
};

// --- Advanced Configuration API ---
export const configurationAPI = {
  // Get all configuration
  getAll: () => api.get('/api/config-advanced'),
  
  // Update all configuration
  updateAll: (configData) => api.put('/api/config-advanced', configData),
  
  // Company information
  company: {
    get: () => api.get('/api/config-advanced/company'),
    update: (companyData) => api.put('/api/config-advanced/company', companyData)
  },
  
  // Theme settings
  theme: {
    get: () => api.get('/api/config-advanced/theme'),
    update: (themeData) => api.put('/api/config-advanced/theme', themeData)
  },
  
  // Security settings
  security: {
    get: () => api.get('/api/config-advanced/security'),
    update: (securityData) => api.put('/api/config-advanced/security', securityData)
  },
  
  // Business settings
  business: {
    get: () => api.get('/api/config-advanced/business')
  }
};

// --- Enhanced Payments API ---
export const paymentsAPI = {
  // Get all payments with filters
  getAll: (params = {}) => api.get('/api/payments', { params }),
  
  // Get payment by ID
  getById: (id) => api.get(`/api/payments/${id}`),
  
  // Create payment
  create: (paymentData) => api.post('/api/payments', paymentData),
  
  // Update payment
  update: (id, paymentData) => api.put(`/api/payments/${id}`, paymentData),
  
  // Update payment status
  updateStatus: (id, estado, verifiedBy) => api.patch(`/api/payments/${id}/status`, { estado, verified_by: verifiedBy }),
  
  // Generate payment number
  generateNumber: () => api.get('/api/payments/generate-number'),
  
  // Apply payment to invoice
  applyToInvoice: (paymentId, invoiceId, amount, appliedBy) => api.post('/api/payments/apply', {
    pago_id: paymentId,
    factura_id: invoiceId,
    monto_aplicado: amount,
    applied_by: appliedBy
  }),
  
  // Get payment applications
  getApplications: (paymentId) => api.get(`/api/payments/${paymentId}/applications`),
  
  // Get cash flow
  getCashFlow: (params = {}) => api.get('/api/payments/cash-flow', { params })
};

// --- Enhanced Quotations API ---
export const quotationsAPI = {
  // Get all quotations with filters
  getAll: (params = {}) => api.get('/api/quotations', { params }),
  
  // Get quotation by ID
  getById: (id) => api.get(`/api/quotations/${id}`),
  
  // Create quotation
  create: (quotationData) => api.post('/api/quotations', quotationData),
  
  // Update quotation
  update: (id, quotationData) => api.put(`/api/quotations/${id}`, quotationData),
  
  // Update quotation status
  updateStatus: (id, estado, comentarios) => api.put(`/api/quotations/${id}/status`, { estado, comentarios }),
  
  // Convert quotation to project
  convertToProject: (id) => api.post(`/api/quotations/${id}/convert`),
  
  // Get quotation statistics
  getStats: () => api.get('/api/quotations/stats'),
  
  // Items management
  items: {
    add: (quotationId, itemData) => api.post(`/api/quotations/${quotationId}/items`, itemData),
    update: (itemId, itemData) => api.put(`/api/quotations/items/${itemId}`, itemData),
    delete: (itemId) => api.delete(`/api/quotations/items/${itemId}`)
  }
};

// --- Enhanced Orders API ---
export const ordersAPI = {
  // Get all orders with filters
  getAll: (params = {}) => api.get('/api/orders', { params }),
  
  // Get orders with status
  getWithStatus: () => api.get('/api/orders/with-status'),
  
  // Get order by ID
  getById: (id) => api.get(`/api/orders/${id}`),
  
  // Create order
  create: (orderData) => api.post('/api/orders', orderData),
  
  // Update order
  update: (id, orderData) => api.put(`/api/orders/${id}`, orderData),
  
  // Update order status
  updateStatus: (id, estado, changedBy, comentario) => api.put(`/api/orders/${id}/status`, {
    estado,
    changed_by: changedBy,
    comentario
  }),
  
  // Generate order number
  generateNumber: () => api.get('/api/orders/generate-number'),
  
  // Get status history
  getStatusHistory: (orderId) => api.get(`/api/orders/${orderId}/status-history`),
  
  // Items management
  items: {
    get: (orderId) => api.get(`/api/orders/${orderId}/items`),
    add: (orderId, itemData) => api.post(`/api/orders/${orderId}/items`, itemData),
    update: (itemId, itemData) => api.put(`/api/orders/items/${itemId}`, itemData),
    delete: (itemId) => api.delete(`/api/orders/items/${itemId}`)
  }
};

// --- Enhanced Projects API ---
export const projectsAPI = {
  // Get all projects with filters
  getAll: (params = {}) => api.get('/api/projects', { params }),
  
  // Get portfolio projects
  getPortfolio: (limit) => api.get(`/api/projects/portfolio${limit ? `?limit=${limit}` : ''}`),
  
  // Get featured projects
  getFeatured: () => api.get('/api/projects/featured'),
  
  // Get project by ID
  getById: (id) => api.get(`/api/projects/${id}`),
  
  // Create project
  create: (projectData) => api.post('/api/projects', projectData),
  
  // Update project
  update: (id, projectData) => api.put(`/api/projects/${id}`, projectData),
  
  // Update project status
  updateStatus: (id, estado) => api.put(`/api/projects/${id}/status`, { estado }),
  
  // Generate project code
  generateCode: (categoria = 'WEB') => api.get(`/api/projects/generate-code?categoria=${categoria}`),
  
  // Images management
  images: {
    get: (projectId) => api.get(`/api/projects/${projectId}/images`),
    add: (projectId, imageData) => api.post(`/api/projects/${projectId}/images`, imageData),
    update: (imageId, imageData) => api.put(`/api/projects/images/${imageId}`, imageData),
    delete: (imageId) => api.delete(`/api/projects/images/${imageId}`)
  }
};

// --- Enhanced Invoices API ---
export const invoicesAPI = {
  // Get all invoices with filters
  getAll: (params = {}) => api.get('/api/invoices', { params }),
  
  // Get overdue invoices
  getOverdue: () => api.get('/api/invoices/overdue'),
  
  // Get invoice by ID
  getById: (id) => api.get(`/api/invoices/${id}`),
  
  // Create invoice
  create: (invoiceData) => api.post('/api/invoices', invoiceData),
  
  // Update invoice
  update: (id, invoiceData) => api.put(`/api/invoices/${id}`, invoiceData),
  
  // Update invoice status
  updateStatus: (id, estado) => api.put(`/api/invoices/${id}/status`, { estado }),
  
  // Generate invoice number
  generateNumber: (serie = 'A') => api.get(`/api/invoices/generate-number?serie=${serie}`),
  
  // Get invoice statistics
  getStats: () => api.get('/api/invoices/stats'),
  
  // Items management
  items: {
    get: (invoiceId) => api.get(`/api/invoices/${invoiceId}/items`),
    add: (invoiceId, itemData) => api.post(`/api/invoices/${invoiceId}/items`, itemData),
    update: (itemId, itemData) => api.put(`/api/invoices/items/${itemId}`, itemData),
    delete: (itemId) => api.delete(`/api/invoices/items/${itemId}`)
  }
};

// --- Monthly Statistics API ---
export const statisticsAPI = {
  // Get monthly statistics
  getMonthly: (year, month) => api.get(`/api/stats/monthly?year=${year}&month=${month}`),
  
  // Get all monthly statistics
  getAllMonthly: () => api.get('/api/stats/monthly'),
  
  // Generate current month statistics
  generateCurrentMonth: () => api.post('/api/stats/generate-current-month'),
  
  // Get statistics comparison
  getComparison: (year1, month1, year2, month2) => 
    api.get(`/api/stats/comparison?year1=${year1}&month1=${month1}&year2=${year2}&month2=${month2}`)
};

// Export all APIs


export default {
  services: servicesAPI,
  messages: messagesAPI,
  configuration: configurationAPI,
  payments: paymentsAPI,
  quotations: quotationsAPI,
  orders: ordersAPI,
  projects: projectsAPI,
  invoices: invoicesAPI,
  statistics: statisticsAPI
};