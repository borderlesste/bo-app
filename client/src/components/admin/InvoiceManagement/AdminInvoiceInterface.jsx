import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Edit,
  Eye,
  FileText,
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  DollarSign,
  Filter,
  Download,
  Send,
  AlertCircle,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';
import { invoicesAPI } from '../../../api/services';

const AdminInvoiceInterface = () => {
  const [invoices, setInvoices] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [createFormData, setCreateFormData] = useState({
    titulo: '',
    descripcion: '',
    monto: '',
    fecha_vencimiento: '',
    moneda: 'MXN',
    notas: ''
  });

  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.estado = statusFilter;
      
      const response = await invoicesAPI.getAll(params);
      setInvoices(response.data);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const searchUsers = async (query) => {
    if (!query || query.length < 2) {
      setUsers([]);
      return;
    }

    try {
      const response = await invoicesAPI.searchUsers(query);
      setUsers(response.data);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleUserSearch = (e) => {
    const value = e.target.value;
    setUserSearchTerm(value);
    searchUsers(value);
  };

  const selectUser = (user) => {
    setSelectedUser(user);
    setShowUserSelector(false);
    setUserSearchTerm('');
    setUsers([]);
  };

  const toggleUserSelector = () => {
    setShowUserSelector(!showUserSelector);
    if (!showUserSelector) {
      setUserSearchTerm('');
      setUsers([]);
    }
  };

  const handleUserContact = (user, method) => {
    if (method === 'phone' && user.telefono) {
      window.open(`tel:${user.telefono}`);
    } else if (method === 'email' && user.email) {
      window.open(`mailto:${user.email}`);
    }
  };

  const getUserCompanyInfo = (user) => {
    return user.empresa || user.nombre || 'Sin información';
  };

  const createInvoice = async () => {
    if (!selectedUser) {
      alert('Selecciona un usuario primero');
      return;
    }

    try {
      const invoiceData = {
        ...createFormData,
        usuario_id: selectedUser.id,
        cliente_id: selectedUser.id,
        numero_factura: await generateInvoiceNumber(),
        estado: 'borrador',
        fecha_emision: new Date().toISOString().split('T')[0],
        created_by: 'admin'
      };

      await invoicesAPI.create(invoiceData);
      setShowCreateModal(false);
      resetCreateForm();
      loadInvoices();
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Error al crear la factura');
    }
  };

  const generateInvoiceNumber = async () => {
    try {
      const response = await invoicesAPI.generateNumber();
      return response.data.numero;
    } catch (error) {
      return `INV-${Date.now()}`;
    }
  };

  const resetCreateForm = () => {
    setSelectedUser(null);
    setCreateFormData({
      titulo: '',
      descripcion: '',
      monto: '',
      fecha_vencimiento: '',
      moneda: 'MXN',
      notas: ''
    });
  };

  const formatCurrency = (amount, currency = 'MXN') => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const badges = {
      borrador: { color: 'bg-gray-100 text-gray-800', icon: Edit },
      enviada: { color: 'bg-blue-100 text-blue-800', icon: Send },
      pagada: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      parcialmente_pagada: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      vencida: { color: 'bg-red-100 text-red-800', icon: AlertCircle },
      cancelada: { color: 'bg-gray-100 text-gray-800', icon: X }
    };

    const badge = badges[status] || badges.borrador;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </span>
    );
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.numero_factura?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.cliente_nombre?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Gestión de Facturas</h1>
            <p className="text-gray-600 text-sm sm:text-base">Administra facturas en nombre de usuarios</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2 text-sm"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nueva Factura</span>
            <span className="sm:hidden">Nueva</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar por título, número de factura o cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Todos los estados</option>
                <option value="borrador">Borrador</option>
                <option value="enviada">Enviada</option>
                <option value="pagada">Pagada</option>
                <option value="parcialmente_pagada">Parcialmente Pagada</option>
                <option value="vencida">Vencida</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
          </div>
        </div>

        {/* Invoices List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Cargando facturas...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron facturas</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Factura
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredInvoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {invoice.numero_factura || `INV-${invoice.id}`}
                            </div>
                            <div className="text-sm text-gray-500">{invoice.titulo}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {invoice.cliente_nombre}
                            </div>
                            <div className="text-sm text-gray-500">{invoice.cliente_email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(invoice.monto, invoice.moneda)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(invoice.estado)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(invoice.fecha_emision).toLocaleDateString('es-MX')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-900">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="text-green-600 hover:text-green-900">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button className="text-purple-600 hover:text-purple-900">
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {filteredInvoices.map((invoice) => (
                  <div key={invoice.id} className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {invoice.numero_factura || `INV-${invoice.id}`}
                        </h3>
                        <p className="text-sm text-gray-600">{invoice.titulo}</p>
                      </div>
                      {getStatusBadge(invoice.estado)}
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="font-medium text-gray-700">{invoice.cliente_nombre}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">{invoice.cliente_email}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="font-medium text-gray-900">
                          {formatCurrency(invoice.monto, invoice.moneda)}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">
                          {new Date(invoice.fecha_emision).toLocaleDateString('es-MX')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3">
                      <button className="text-blue-600 hover:text-blue-900 p-2">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900 p-2">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-purple-600 hover:text-purple-900 p-2">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Create Invoice Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Crear Nueva Factura</h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetCreateForm();
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* User Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleccionar Cliente *
                  </label>
                  {selectedUser ? (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <User className="h-4 w-4 text-blue-600 mr-2" />
                            <h3 className="font-medium text-gray-900">{selectedUser.nombre}</h3>
                          </div>
                          <div className="flex items-center mb-2">
                            <Mail className="h-4 w-4 text-blue-600 mr-2" />
                            <button
                              onClick={() => handleUserContact(selectedUser, 'email')}
                              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {selectedUser.email}
                            </button>
                          </div>
                          {selectedUser.empresa && (
                            <div className="flex items-center mb-2">
                              <Building className="h-4 w-4 text-blue-600 mr-2" />
                              <p className="text-sm text-gray-600">{getUserCompanyInfo(selectedUser)}</p>
                            </div>
                          )}
                          {selectedUser.telefono && (
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 text-blue-600 mr-2" />
                              <button
                                onClick={() => handleUserContact(selectedUser, 'phone')}
                                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {selectedUser.telefono}
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={toggleUserSelector}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Cambiar usuario"
                          >
                            <Search className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setSelectedUser(null)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Quitar usuario"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          type="text"
                          placeholder="Buscar por nombre, email, teléfono o empresa..."
                          value={userSearchTerm}
                          onChange={handleUserSearch}
                          onFocus={() => setShowUserSelector(true)}
                          className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      {users.length > 0 && (
                        <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                          {users.map((user) => (
                            <div
                              key={user.id}
                              onClick={() => selectUser(user)}
                              className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <div className="flex items-center space-x-3">
                                <User className="h-4 w-4 text-gray-400" />
                                <div>
                                  <p className="font-medium text-gray-900">{user.nombre}</p>
                                  <p className="text-sm text-gray-600">{user.email}</p>
                                  {user.empresa && (
                                    <p className="text-xs text-gray-500">{user.empresa}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Invoice Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Título de la Factura *
                    </label>
                    <input
                      type="text"
                      value={createFormData.titulo}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, titulo: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Título de la factura"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <textarea
                      value={createFormData.descripcion}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Descripción detallada..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Monto *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={createFormData.monto}
                        onChange={(e) => setCreateFormData(prev => ({ ...prev, monto: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Moneda
                      </label>
                      <select
                        value={createFormData.moneda}
                        onChange={(e) => setCreateFormData(prev => ({ ...prev, moneda: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="MXN">Peso Mexicano (MXN)</option>
                        <option value="USD">Dólar Americano (USD)</option>
                        <option value="EUR">Euro (EUR)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Vencimiento
                    </label>
                    <input
                      type="date"
                      value={createFormData.fecha_vencimiento}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, fecha_vencimiento: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notas Adicionales
                    </label>
                    <textarea
                      value={createFormData.notas}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, notas: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Notas internas..."
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetCreateForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={createInvoice}
                    disabled={!selectedUser || !createFormData.titulo || !createFormData.monto}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Crear Factura
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminInvoiceInterface;