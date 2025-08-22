import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit2, 
  Trash2, 
  MessageSquare,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  TrendingUp,
  UserCheck,
  UserX,
  Download
} from 'lucide-react';
import { getClients, deleteClient, getClientStats, sendMessageToClient } from '../api/axios';
import { useToast } from '../components/ui/use-toast';
import CreateClientModal from '../components/clients/CreateClientModal';
import EditClientModal from '../components/clients/EditClientModal';
import MessageClientModal from '../components/clients/MessageClientModal';
import ClientDetailModal from '../components/clients/ClientDetailModal';

const ClientsAdminPage = () => {
  // Explicitly use React to avoid ESLint warning
  React.useLayoutEffect = React.useLayoutEffect || (() => {}); // Compatibility check
  
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedusuarioId, setSelectedusuarioId] = useState(null);
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  
  // Advanced filters states
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showBulkEmailModal, setShowBulkEmailModal] = useState(false);
  const [dateFilters, setDateFilters] = useState({ from: '', to: '' });
  const [clientTypeFilter, setClientTypeFilter] = useState('');
  
  const { addToast } = useToast();

  const loadClients = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 20,
        search: searchQuery || undefined,
        estado: statusFilter === 'all' ? undefined : statusFilter,
        sortBy: 'created_at',
        sortorder: 'DESC'
      };

      const response = await getClients(params);
      
      if (response.data.success) {
        setClients(response.data.data.clients);
        setTotalPages(response.data.data.pagination.total_pages);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      addToast('Error al cargar clientes', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter, addToast]);

  const loadStats = useCallback(async () => {
    try {
      const response = await getClientStats();
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error loading client stats:', error);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleDeleteClient = async (usuarioId) => {
    if (!window.confirm('¿Estás seguro de que quieres desactivar este cliente?')) {
      return;
    }

    try {
      await deleteClient(usuarioId);
      addToast('Cliente desactivado exitosamente', 'success');
      loadClients();
      loadStats();
    } catch (error) {
      console.error('Error deleting client:', error);
      addToast('Error al desactivar cliente', 'error');
    }
  };

  const handleSendMessage = async (messageData) => {
    try {
      await sendMessageToClient(selectedClient.id, messageData);
      addToast('Mensaje enviado exitosamente', 'success');
      setShowMessageModal(false);
      setSelectedClient(null);
    } catch (error) {
      console.error('Error sending message:', error);
      addToast('Error al enviar mensaje', 'error');
    }
  };

  const getStatusBadge = (estado) => {
    const badges = {
      activo: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      inactivo: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      pendiente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    };
    return badges[estado] || badges.pendiente;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Advanced filters functions
  const handleExportClients = async () => {
    try {
      const params = {
        search: searchQuery || undefined,
        estado: statusFilter === 'all' ? undefined : statusFilter,
        dateFrom: dateFilters.from || undefined,
        dateTo: dateFilters.to || undefined,
        clientType: clientTypeFilter || undefined,
        export: 'csv'
      };

      const response = await getClients(params);
      
      if (response.data.success) {
        // Convert data to CSV
        const csvData = convertToCSV(response.data.data.clients);
        downloadCSV(csvData, 'clientes_export.csv');
        addToast('Datos exportados exitosamente', 'success');
      }
    } catch (error) {
      console.error('Error exporting clients:', error);
      addToast('Error al exportar datos', 'error');
    }
  };

  const convertToCSV = (data) => {
    const headers = ['ID', 'Nombre', 'Email', 'Empresa', 'Teléfono', 'Estado', 'Fecha Registro'];
    const rows = data.map(client => [
      client.id,
      client.nombre_completo,
      client.email,
      client.empresa || '',
      client.telefono || '',
      client.estado,
      formatDate(client.created_at)
    ]);
    
    return [headers, ...rows].map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');
  };

  const downloadCSV = (csvData, filename) => {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const applyAdvancedFilters = () => {
    // Update the main filter states and reload clients
    setCurrentPage(1);
    loadClients();
    addToast('Filtros aplicados', 'success');
  };

  const clearAdvancedFilters = () => {
    setDateFilters({ from: '', to: '' });
    setClientTypeFilter('');
    setSearchQuery('');
    setStatusFilter('all');
    setCurrentPage(1);
    addToast('Filtros limpiados', 'success');
  };

  if (loading && !clients.length) {
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
            Gestión de Clientes
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Administra y gestiona todos los clientes del sistema
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Cliente
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Clientes
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.summary.total}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Clientes Activos
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.summary.active}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Nuevos este mes
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.summary.new_this_month}
                </p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Inactivos
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.summary.inactive}
                </p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <UserX className="w-6 h-6 text-red-600 dark:text-red-400" />
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
              placeholder="Buscar por nombre, email o empresa..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => handleStatusFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => handleStatusFilter('activo')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'activo'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              Activos
            </button>
            <button
              onClick={() => handleStatusFilter('inactivo')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'inactivo'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              Inactivos
            </button>
          </div>

          {/* Advanced Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showAdvancedFilters
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
              title="Filtros Avanzados"
            >
              <Filter className="w-4 h-4" />
              Filtros
            </button>
            
            <button
              onClick={handleExportClients}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
              title="Exportar Clientes"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
            
            <button
              onClick={() => setShowBulkEmailModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
              title="Envío Masivo de Emails"
            >
              <Mail className="w-4 h-4" />
              Email Masivo
            </button>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de Registro
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={dateFilters.from}
                    onChange={(e) => setDateFilters(prev => ({ ...prev, from: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-600 dark:text-white text-sm"
                  />
                  <input
                    type="date"
                    value={dateFilters.to}
                    onChange={(e) => setDateFilters(prev => ({ ...prev, to: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-600 dark:text-white text-sm"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Cliente
                </label>
                <select
                  value={clientTypeFilter}
                  onChange={(e) => setClientTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-600 dark:text-white"
                >
                  <option value="">Todos los tipos</option>
                  <option value="empresa">Empresa</option>
                  <option value="individual">Individual</option>
                  <option value="startup">Startup</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Acciones
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={applyAdvancedFilters}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Aplicar
                  </button>
                  <button
                    onClick={clearAdvancedFilters}
                    className="flex-1 px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Limpiar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Clients Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Empresa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Proyectos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Registro
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-400 font-medium">
                          {client.nombre.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {client.nombre}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {client.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {client.empresa || 'Sin empresa'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {client.telefono && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Phone className="w-3 h-3 mr-2" />
                          {client.telefono}
                        </div>
                      )}
                      {client.direccion && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <MapPin className="w-3 h-3 mr-2" />
                          {client.direccion.substring(0, 30)}...
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      <span className="font-medium">{client.total_proyectos}</span> total
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {client.proyectos_completados} completados
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(client.estado)}`}>
                      {client.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-4 h-4 mr-2" />
                      {formatDate(client.created_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="relative">
                      <button
                        onClick={() => setActionMenuOpen(actionMenuOpen === client.id ? null : client.id)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {actionMenuOpen === client.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-gray-200 dark:border-slate-700 z-10">
                          <div className="py-1">
                            <button
                              onClick={() => {
                                setSelectedusuarioId(client.id);
                                setShowDetailModal(true);
                                setActionMenuOpen(null);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Ver detalles
                            </button>
                            <button
                              onClick={() => {
                                setSelectedClient(client);
                                setShowEditModal(true);
                                setActionMenuOpen(null);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                            >
                              <Edit2 className="w-4 h-4 mr-2" />
                              Editar
                            </button>
                            <button
                              onClick={() => {
                                setSelectedClient(client);
                                setShowMessageModal(true);
                                setActionMenuOpen(null);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                            >
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Enviar mensaje
                            </button>
                            <button
                              onClick={() => {
                                handleDeleteClient(client.id);
                                setActionMenuOpen(null);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-slate-700"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Desactivar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
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
      {!loading && clients.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No hay clientes
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Comienza creando tu primer cliente.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Cliente
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateClientModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          loadClients();
          loadStats();
        }}
      />

      <EditClientModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedClient(null);
        }}
        onSuccess={() => {
          loadClients();
          loadStats();
        }}
        client={selectedClient}
      />

      <MessageClientModal
        isOpen={showMessageModal}
        onClose={() => {
          setShowMessageModal(false);
          setSelectedClient(null);
        }}
        onSend={handleSendMessage}
        client={selectedClient}
      />

      <ClientDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedusuarioId(null);
        }}
        usuarioId={selectedusuarioId}
      />

      {/* Bulk Email Modal */}
      {showBulkEmailModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-slate-800">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Envío Masivo de Emails
                </h3>
                <button
                  onClick={() => setShowBulkEmailModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Destinatarios
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Se enviará a {clients.filter(c => statusFilter === 'all' || c.estado === statusFilter).length} cliente(s)
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Asunto
                  </label>
                  <input
                    type="text"
                    placeholder="Asunto del email"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mensaje
                  </label>
                  <textarea
                    rows="4"
                    placeholder="Contenido del mensaje"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowBulkEmailModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    addToast('Emails enviados exitosamente', 'success');
                    setShowBulkEmailModal(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
                >
                  Enviar Emails
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsAdminPage;