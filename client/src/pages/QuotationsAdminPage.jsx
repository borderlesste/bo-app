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
  Check,
  X,
  Send,
  Clock,
  DollarSign,
  User,
  Calendar,
  TrendingUp,
  CheckCircle,
  XCircle,
  RefreshCw,
  FileDown,
  ArrowRight
} from 'lucide-react';
import { getQuotations, deleteQuotation, getQuotationStats, updateQuotationStatus, convertQuotationToProject, getClients, createQuotation, updateQuotation } from '../api/axios';
import { useToast } from '../components/ui/use-toast';
import QuotationCreateModal from '../components/QuotationCreateModal';
import QuotationEditModal from '../components/QuotationEditModal';
import QuotationDetailModal from '../components/QuotationDetailModal';

const QuotationsAdminPage = () => {
  const [quotations, setQuotations] = useState([]);
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
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const { addToast } = useToast();

  const loadQuotations = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 20,
        search: searchQuery || undefined,
        estado: statusFilter === 'all' ? undefined : statusFilter,
        usuario_id: clientFilter === 'all' ? undefined : clientFilter,
        sortBy: 'created_at',
        sortorder: 'DESC'
      };

      const response = await getQuotations(params);
      
      if (response.data.success) {
        setQuotations(response.data.data.quotations);
        setTotalPages(response.data.data.pagination.total_pages);
      }
    } catch (error) {
      console.error('Error loading quotations:', error);
      addToast('Error al cargar cotizaciones', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter, clientFilter, addToast]);

  const loadStats = useCallback(async () => {
    try {
      const response = await getQuotationStats();
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error loading quotation stats:', error);
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
      setClients([]);
    }
  }, [addToast]);

  useEffect(() => {
    loadQuotations();
  }, [loadQuotations]);

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

  const handleCreateQuotation = async (quotationData) => {
    try {
      const response = await createQuotation(quotationData);
      if (response.data.success) {
        addToast('Cotización creada exitosamente', 'success');
        loadQuotations();
        loadStats();
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Error creating quotation:', error);
      addToast('Error al crear cotización', 'error');
    }
  };

  const handleEditQuotation = async (quotationId, quotationData) => {
    try {
      const response = await updateQuotation(quotationId, quotationData);
      if (response.data.success) {
        addToast('Cotización actualizada exitosamente', 'success');
        loadQuotations();
        loadStats();
        setShowEditModal(false);
        setSelectedQuotation(null);
      }
    } catch (error) {
      console.error('Error updating quotation:', error);
      addToast('Error al actualizar cotización', 'error');
    }
  };

  const handleStatusChange = async (quotationId, newStatus, comentarios = '') => {
    try {
      await updateQuotationStatus(quotationId, { estado: newStatus, comentarios });
      addToast('Estado de cotización actualizado exitosamente', 'success');
      loadQuotations();
      loadStats();
      setActionMenuOpen(null);
    } catch (error) {
      console.error('Error updating quotation status:', error);
      addToast('Error al actualizar estado de cotización', 'error');
    }
  };

  const handleConvertToProject = async (quotationId) => {
    if (!window.confirm('¿Estás seguro de que quieres convertir esta cotización a proyecto?')) {
      return;
    }

    try {
      const response = await convertQuotationToProject(quotationId);
      if (response.data.success) {
        addToast(`Cotización convertida a proyecto: ${response.data.data.project_code}`, 'success');
        loadQuotations();
        loadStats();
      }
    } catch (error) {
      console.error('Error converting quotation:', error);
      addToast('Error al convertir cotización', 'error');
    }
    setActionMenuOpen(null);
  };

  const handleDeleteQuotation = async (quotationId) => {
    if (!window.confirm('¿Estás seguro de que quieres cancelar esta cotización?')) {
      return;
    }

    try {
      await deleteQuotation(quotationId);
      addToast('Cotización cancelada exitosamente', 'success');
      loadQuotations();
      loadStats();
    } catch (error) {
      console.error('Error deleting quotation:', error);
      addToast('Error al cancelar cotización', 'error');
    }
  };

  const getStatusBadge = (estado) => {
    const badges = {
      borrador: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      enviada: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      aprobada: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      rechazada: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      expirada: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      convertida: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      cancelada: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    };
    return badges[estado] || badges.borrador;
  };

  const getStatusIcon = (estado) => {
    const icons = {
      borrador: Clock,
      enviada: Send,
      aprobada: CheckCircle,
      rechazada: XCircle,
      expirada: Clock,
      convertida: ArrowRight,
      cancelada: X
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

  const isExpired = (fechaExpiracion) => {
    return new Date(fechaExpiracion) < new Date();
  };

  if (loading && !quotations.length) {
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
            Gestión de Cotizaciones
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Administra y gestiona todas las cotizaciones del sistema
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Cotización
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Cotizaciones
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
                  Este Mes
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.summary.this_month}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Valor Aprobado
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(stats.summary.approved_value)}
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
                  Tasa Conversión
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.summary.conversion_rate}%
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <RefreshCw className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Convertidas
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.summary.converted}
                </p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <ArrowRight className="w-6 h-6 text-orange-600 dark:text-orange-400" />
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
              onClick={() => handleStatusFilter('aprobada')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'aprobada'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              Aprobadas
            </button>
            <button
              onClick={() => handleStatusFilter('convertida')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'convertida'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              Convertidas
            </button>
          </div>
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cotización
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
              {quotations.map((quotation) => {
                const StatusIcon = getStatusIcon(quotation.estado);
                const expired = quotation.fecha_expiracion && isExpired(quotation.fecha_expiracion);
                return (
                  <tr key={quotation.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {quotation.numero_cotizacion}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {quotation.titulo}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {quotation.cliente_nombre}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {quotation.cliente_empresa || quotation.cliente_email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        {formatCurrency(quotation.total, quotation.moneda)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {quotation.total_items} items
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(quotation.estado)}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {quotation.estado}
                      </span>
                      {expired && quotation.estado === 'enviada' && (
                        <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                          Expirada
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {formatDate(quotation.created_at)}
                      </div>
                      {quotation.fecha_expiracion && (
                        <div className={`text-sm ${expired ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          Exp: {formatDate(quotation.fecha_expiracion)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative">
                        <button
                          onClick={() => setActionMenuOpen(actionMenuOpen === quotation.id ? null : quotation.id)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {actionMenuOpen === quotation.id && (
                          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-gray-200 dark:border-slate-700 z-10">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  setSelectedQuotation(quotation);
                                  setShowDetailModal(true);
                                  setActionMenuOpen(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Ver detalles
                              </button>
                              
                              {quotation.estado === 'borrador' && (
                                <>
                                  <button
                                    onClick={() => {
                                      setSelectedQuotation(quotation);
                                      setShowEditModal(true);
                                      setActionMenuOpen(null);
                                    }}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                                  >
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => handleStatusChange(quotation.id, 'enviada')}
                                    className="flex items-center w-full px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700"
                                  >
                                    <Send className="w-4 h-4 mr-2" />
                                    Enviar al cliente
                                  </button>
                                </>
                              )}
                              
                              {quotation.estado === 'enviada' && (
                                <>
                                  <button
                                    onClick={() => handleStatusChange(quotation.id, 'aprobada')}
                                    className="flex items-center w-full px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-slate-700"
                                  >
                                    <Check className="w-4 h-4 mr-2" />
                                    Aprobar
                                  </button>
                                  <button
                                    onClick={() => handleStatusChange(quotation.id, 'rechazada')}
                                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-slate-700"
                                  >
                                    <X className="w-4 h-4 mr-2" />
                                    Rechazar
                                  </button>
                                </>
                              )}
                              
                              {quotation.estado === 'aprobada' && (
                                <button
                                  onClick={() => handleConvertToProject(quotation.id)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-gray-100 dark:hover:bg-slate-700"
                                >
                                  <ArrowRight className="w-4 h-4 mr-2" />
                                  Convertir a proyecto
                                </button>
                              )}
                              
                              <div className="border-t border-gray-200 dark:border-slate-700"></div>
                              
                              <button
                                onClick={() => {
                                  // Download quotation PDF
                                  setActionMenuOpen(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                              >
                                <FileDown className="w-4 h-4 mr-2" />
                                Descargar PDF
                              </button>
                              
                              {['borrador', 'enviada'].includes(quotation.estado) && (
                                <button
                                  onClick={() => {
                                    handleDeleteQuotation(quotation.id);
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
      {!loading && quotations.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No hay cotizaciones
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Comienza creando tu primera cotización.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Cotización
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <QuotationCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateQuotation}
        clients={clients}
      />

      <QuotationEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedQuotation(null);
        }}
        onSave={handleEditQuotation}
        quotation={selectedQuotation}
        clients={clients}
      />

      <QuotationDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedQuotation(null);
        }}
        quotation={selectedQuotation}
      />
    </div>
  );
};

export default QuotationsAdminPage;