import { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit2, 
  Trash2, 
  Send,
  Clock,
  DollarSign,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileDown,
  CreditCard
} from 'lucide-react';
import { getAdminInvoices, deleteInvoice, getInvoiceStats, updateInvoiceStatus, generateInvoiceFromQuotation, getClients, updateInvoice } from '../api/axios';
import { useToast } from '../components/ui/use-toast';
import CreateInvoiceModal from '../components/modals/CreateInvoiceModal';
import InvoiceEditModal from '../components/InvoiceEditModal';
import InvoiceDetailModal from '../components/InvoiceDetailModal';

const InvoicesAdminPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [clients, setClients] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const { addToast } = useToast();

  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 20,
        search: searchQuery || undefined,
        estado: statusFilter === 'all' ? undefined : statusFilter,
        usuario_id: clientFilter === 'all' ? undefined : clientFilter,
        sortBy: 'created_at',
        sortOrder: 'DESC'
      };

      const response = await getAdminInvoices(params);
      
      if (response.data.success) {
        setInvoices(response.data.data.invoices);
        setTotalPages(response.data.data.pagination.total_pages);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
      addToast('Error al cargar facturas', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter, clientFilter, addToast]);

  const loadStats = useCallback(async () => {
    try {
      const response = await getInvoiceStats();
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error loading invoice stats:', error);
    }
  }, []);

  const loadClients = useCallback(async () => {
    try {
      const response = await getClients();
      if (response.data.success) {
        setClients(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      addToast('Error al cargar clientes', 'error');
    }
  }, [addToast]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  useEffect(() => {
    loadStats();
    loadClients();
  }, [loadStats, loadClients]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleClientFilter = (clientId) => {
    setClientFilter(clientId);
    setCurrentPage(1);
  };

  const handleStatusChange = async (invoiceId, newStatus, notas = '') => {
    try {
      await updateInvoiceStatus(invoiceId, { estado: newStatus, notas });
      addToast('Estado de factura actualizado exitosamente', 'success');
      loadInvoices();
      loadStats();
      setActionMenuOpen(null);
    } catch (error) {
      console.error('Error updating invoice status:', error);
      addToast('Error al actualizar estado de factura', 'error');
    }
  };

  const handleGenerateFromQuotation = async (quotationId) => {
    try {
      const response = await generateInvoiceFromQuotation({ cotizacion_id: quotationId });
      if (response.data.success) {
        addToast(`Factura generada exitosamente: ${response.data.data.numero_factura}`, 'success');
        loadInvoices();
        loadStats();
      }
    } catch (error) {
      console.error('Error generating invoice from quotation:', error);
      addToast('Error al generar factura desde cotización', 'error');
    }
  };

  const handleEditInvoice = async (invoiceId, formData) => {
    try {
      const response = await updateInvoice(invoiceId, formData);
      if (response.data.success) {
        addToast('Factura actualizada exitosamente', 'success');
        loadInvoices();
        loadStats();
        setShowEditModal(false);
        setSelectedInvoice(null);
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
      addToast('Error al actualizar factura', 'error');
      throw error;
    }
  };

  const handleCreateInvoiceSuccess = () => {
    // Recargar datos después de crear una factura
    loadInvoices();
    loadStats();
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (!window.confirm('¿Estás seguro de que quieres cancelar esta factura?')) {
      return;
    }

    try {
      await deleteInvoice(invoiceId);
      addToast('Factura cancelada exitosamente', 'success');
      loadInvoices();
      loadStats();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      addToast('Error al cancelar factura', 'error');
    }
  };

  const getStatusBadge = (estado) => {
    const badges = {
      borrador: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      enviada: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      pagada: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      parcialmente_pagada: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      vencida: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      cancelada: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    };
    return badges[estado] || badges.borrador;
  };

  const getStatusIcon = (estado) => {
    const icons = {
      borrador: Clock,
      enviada: Send,
      pagada: CheckCircle,
      parcialmente_pagada: CreditCard,
      vencida: AlertTriangle,
      cancelada: XCircle
    };
    return icons[estado] || Clock;
  };

  const formatCurrency = (amount, currency = 'MXN') => {
    const symbols = { MXN: '$', USD: '$', EUR: '€' };
    return `${symbols[currency] || '$'}${amount?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = (fechaVencimiento, estado) => {
    return new Date(fechaVencimiento) < new Date() && !['pagada', 'cancelada'].includes(estado);
  };

  if (loading && !invoices.length) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestión de Facturas
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Administra y gestiona todas las facturas del sistema
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Factura
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Facturas
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.summary.total}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Pagado
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(stats.summary.total_pagado)}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Pendiente
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(stats.summary.total_pendiente)}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Vencidas
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.summary.vencidas}
                </p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por número, título o cliente..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            />
          </div>

          {/* Client Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={clientFilter}
              onChange={(e) => handleClientFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white text-sm"
            >
              <option value="all">Todos los clientes</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleStatusFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => handleStatusFilter('borrador')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'borrador'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              Borrador
            </button>
            <button
              onClick={() => handleStatusFilter('enviada')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'enviada'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              Enviadas
            </button>
            <button
              onClick={() => handleStatusFilter('pagada')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'pagada'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              Pagadas
            </button>
            <button
              onClick={() => handleStatusFilter('vencida')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'vencida'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              Vencidas
            </button>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Factura
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fechas
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {invoices.map((invoice) => {
                const StatusIcon = getStatusIcon(invoice.estado_calculado || invoice.estado);
                const overdue = isOverdue(invoice.fecha_vencimiento, invoice.estado);
                return (
                  <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {invoice.numero_factura}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {invoice.titulo}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {invoice.cliente_nombre}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {invoice.cliente_empresa || invoice.cliente_email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        {formatCurrency(invoice.total, invoice.moneda)}
                      </div>
                      {invoice.total_pagado > 0 && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Pagado: {formatCurrency(invoice.total_pagado)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(invoice.estado_calculado || invoice.estado)}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {invoice.estado_calculado || invoice.estado}
                      </span>
                      {overdue && (
                        <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {invoice.dias_vencido} días vencida
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {formatDate(invoice.fecha_emision)}
                      </div>
                      <div className={`text-sm ${overdue ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        Vence: {formatDate(invoice.fecha_vencimiento)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative">
                        <button
                          onClick={() => setActionMenuOpen(actionMenuOpen === invoice.id ? null : invoice.id)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {actionMenuOpen === invoice.id && (
                          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-gray-200 dark:border-slate-700 z-10">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  setSelectedInvoice(invoice);
                                  setShowDetailModal(true);
                                  setActionMenuOpen(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Ver detalles
                              </button>
                              
                              {invoice.estado === 'borrador' && (
                                <>
                                  <button
                                    onClick={() => {
                                      setSelectedInvoice(invoice);
                                      setShowEditModal(true);
                                      setActionMenuOpen(null);
                                    }}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                                  >
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => handleStatusChange(invoice.id, 'enviada')}
                                    className="flex items-center w-full px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700"
                                  >
                                    <Send className="w-4 h-4 mr-2" />
                                    Enviar al cliente
                                  </button>
                                </>
                              )}
                              
                              {['enviada', 'parcialmente_pagada'].includes(invoice.estado) && (
                                <button
                                  onClick={() => handleStatusChange(invoice.id, 'pagada')}
                                  className="flex items-center w-full px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-slate-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Marcar como pagada
                                </button>
                              )}
                              
                              <div className="border-t border-gray-200 dark:border-slate-700"></div>
                              
                              <button
                                onClick={() => {
                                  // Download invoice PDF
                                  setActionMenuOpen(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                              >
                                <FileDown className="w-4 h-4 mr-2" />
                                Descargar PDF
                              </button>
                              
                              {['borrador', 'enviada'].includes(invoice.estado) && (
                                <button
                                  onClick={() => {
                                    handleDeleteInvoice(invoice.id);
                                    setActionMenuOpen(null);
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-slate-700"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Cancelar
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white dark:bg-slate-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-slate-700">
            <div className="flex items-center">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Página {currentPage} de {totalPages}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {!loading && invoices.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No hay facturas
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Comienza creando tu primera factura.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Factura
            </button>
          </div>
        </div>
      )}

      {/* Overdue Invoices Alert */}
      {stats && stats.overdue_invoices && stats.overdue_invoices.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                Facturas Vencidas ({stats.overdue_invoices.length})
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                <ul className="list-disc list-inside space-y-1">
                  {stats.overdue_invoices.slice(0, 3).map((invoice) => (
                    <li key={invoice.id}>
                      {invoice.numero_factura} - {invoice.cliente_nombre} - {formatCurrency(invoice.total)} 
                      ({invoice.dias_vencido} días vencida)
                    </li>
                  ))}
                </ul>
                {stats.overdue_invoices.length > 3 && (
                  <p className="mt-1">
                    Y {stats.overdue_invoices.length - 3} más...
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      <CreateInvoiceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateInvoiceSuccess}
      />

      {/* Edit Invoice Modal */}
      <InvoiceEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedInvoice(null);
        }}
        onSave={handleEditInvoice}
        invoice={selectedInvoice}
      />

      {/* Invoice Detail Modal */}
      <InvoiceDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
      />
    </div>
  );
};

export default InvoicesAdminPage;