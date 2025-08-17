import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Card, Button, Skeleton } from '../components';
import { getUsers, updateUser, deleteUser, createUser } from '../api/axios';
import { 
  Search, 
  Filter, 
  Plus, 
  Mail, 
  Phone, 
  Calendar, 
  User, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  XCircle,
  Eye,
  Edit,
  Trash2,
  Download,
  Shield,
  MapPin,
  Building
} from 'lucide-react';

const ClientsViewPage = ({ showNavigation = true }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [createMode, setCreateMode] = useState(false);
  const [createForm, setCreateForm] = useState({});

  // Cargar clientes desde la API
  
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await getUsers();
      if (response.data.success) {
        // Filtrar solo usuarios que son clientes (no admins)
        const clientUsers = response.data.data.filter(user => user.rol !== 'admin');
        setClients(clientUsers);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      // Find the client to get their current rol
      const client = clients.find(c => c.id === id);
      const response = await updateUser(id, { 
        estado: newStatus,
        rol: client?.rol || 'cliente' // Ensure rol is not null
      });
      if (response.data.success) {
        setClients(clients.map(client => 
          client.id === id ? { ...client, estado: newStatus } : client
        ));
      }
    } catch (error) {
      console.error('Error updating client:', error);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      try {
        const response = await deleteUser(id);
        if (response.data.success) {
          setClients(clients.filter(client => client.id !== id));
        }
      } catch (error) {
        console.error('Error deleting client:', error);
      }
    }
  };

  const handleNewClient = () => {
    setCreateForm({
      nombre: '',
      email: '',
      telefono: '',
      empresa: '',
      direccion: '',
      estado: 'activo',
      rol: 'cliente',
      password: ''
    });
    setCreateMode(true);
  };

  const handleEditClient = (client) => {
    setEditForm({
      id: client.id,
      nombre: client.nombre || '',
      email: client.email || '',
      telefono: client.telefono || '',
      empresa: client.empresa || '',
      direccion: client.direccion || '',
      estado: client.estado || 'activo',
      rol: client.rol || 'cliente'
    });
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    try {
      // Validate required fields
      if (!editForm.nombre || !editForm.email) {
        alert('Nombre y email son campos requeridos');
        return;
      }

      console.log('Updating client with data:', editForm);
      
      const response = await updateUser(editForm.id, {
        nombre: editForm.nombre,
        email: editForm.email,
        telefono: editForm.telefono || '',
        empresa: editForm.empresa || '',
        direccion: editForm.direccion || '',
        estado: editForm.estado || 'activo',
        rol: editForm.rol || 'cliente'
      });
      
      console.log('Update response:', response);
      
      if (response.data.success) {
        // Actualizar cliente en la lista
        setClients(clients.map(client => 
          client.id === editForm.id ? { ...client, ...editForm } : client
        ));
        
        // Actualizar cliente seleccionado si está en el modal
        if (selectedClient && selectedClient.id === editForm.id) {
          setSelectedClient({ ...selectedClient, ...editForm });
        }
        
        setEditMode(false);
        setEditForm({});
        alert('Cliente actualizado exitosamente');
      } else {
        alert('Error: ' + (response.data.message || 'No se pudo actualizar el cliente'));
      }
    } catch (error) {
      console.error('Error updating client:', error);
      alert('Error al actualizar el cliente: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditForm({});
  };

  const handleFormChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateFormChange = (field, value) => {
    setCreateForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveCreate = async () => {
    try {
      // Validate required fields
      if (!createForm.nombre || !createForm.email || !createForm.password) {
        alert('Nombre, email y contraseña son campos requeridos');
        return;
      }

      const response = await createUser({
        nombre: createForm.nombre,
        email: createForm.email,
        password: createForm.password,
        telefono: createForm.telefono || '',
        empresa: createForm.empresa || '',
        direccion: createForm.direccion || '',
        estado: createForm.estado || 'activo',
        rol: createForm.rol || 'cliente'
      });
      
      if (response.data.success) {
        // Refresh clients list
        fetchClients();
        setCreateMode(false);
        setCreateForm({});
        alert('Cliente creado exitosamente');
      }
    } catch (error) {
      console.error('Error creating client:', error);
      alert('Error al crear el cliente: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCancelCreate = () => {
    setCreateMode(false);
    setCreateForm({});
  };

  const getStatusIcon = (estado) => {
    switch (estado) {
      case 'activo': return <CheckCircle className="w-4 h-4" />;
      case 'inactivo': return <XCircle className="w-4 h-4" />;
      case 'bloqueado': return <Clock className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'activo': return 'bg-green-500 text-white';
      case 'inactivo': return 'bg-red-500 text-white';
      case 'bloqueado': return 'bg-yellow-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getRoleIcon = (rol) => {
    switch (rol) {
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'cliente': return <User className="w-4 h-4" />;
      case 'empleado': return <Users className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getRoleColor = (rol) => {
    switch (rol) {
      case 'admin': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20';
      case 'cliente': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'empleado': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredClients = clients.filter(client => {
    const statusMatch = filter === 'all' || client.estado === filter;
    const roleMatch = roleFilter === 'all' || client.rol === roleFilter;
    const searchMatch = searchTerm === '' || 
      client.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.telefono?.toLowerCase().includes(searchTerm.toLowerCase());
    return statusMatch && roleMatch && searchMatch;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'No especificada';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportClients = () => {
    const dataStr = JSON.stringify(filteredClients, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `clientes_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (loading) {
    return (
      <div className={showNavigation ? "min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6" : "p-6"}>
        <div className={showNavigation ? "max-w-7xl mx-auto" : ""}>
          <div className="mb-8">
            <Skeleton height="8" width="1/3" className="mb-4" />
            <Skeleton height="4" width="2/3" />
          </div>
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} variant="gradient" className="animate-pulse">
                <Skeleton height="6" width="1/4" className="mb-4" />
                <Skeleton height="4" width="full" className="mb-2" />
                <Skeleton height="4" width="3/4" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={showNavigation ? "min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6" : ""}>
      <div className={showNavigation ? "max-w-7xl mx-auto" : ""}>        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-heading font-bold text-gray-800 dark:text-gray-100 mb-4">
                👥 Ver Clientes
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
                Visualiza y administra toda la información de tus clientes registrados
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={exportClients}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleNewClient}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nuevo Cliente
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {clients.filter(c => c.estado === 'activo').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Activos</div>
          </Card>
          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="text-3xl font-bold text-yellow-600 mb-2">
              {clients.filter(c => c.estado === 'bloqueado').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Bloqueados</div>
          </Card>
          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="text-3xl font-bold text-red-600 mb-2">
              {clients.filter(c => c.estado === 'inactivo').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Inactivos</div>
          </Card>
          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="text-3xl font-bold text-gray-700 dark:text-gray-300 mb-2">
              {clients.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card variant="gradient" className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, email o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant={filter === 'all' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                Todos ({clients.length})
              </Button>
              <Button
                variant={filter === 'activo' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('activo')}
              >
                Activos ({clients.filter(c => c.estado === 'activo').length})
              </Button>
              <Button
                variant={filter === 'bloqueado' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('bloqueado')}
              >
                Bloqueados ({clients.filter(c => c.estado === 'bloqueado').length})
              </Button>
              <Button
                variant={filter === 'inactivo' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('inactivo')}
              >
                Inactivos ({clients.filter(c => c.estado === 'inactivo').length})
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Tipo:
            </span>
            <Button
              variant={roleFilter === 'all' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setRoleFilter('all')}
            >
              Todos
            </Button>
            <Button
              variant={roleFilter === 'cliente' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setRoleFilter('cliente')}
            >
              Clientes ({clients.filter(c => c.rol === 'cliente').length})
            </Button>
            <Button
              variant={roleFilter === 'empleado' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setRoleFilter('empleado')}
            >
              Empleados ({clients.filter(c => c.rol === 'empleado').length})
            </Button>
          </div>
        </Card>

        {/* Clients List */}
        <div className="grid gap-6">
          {filteredClients.map((client) => (
            <Card key={client.id} variant="gradient" hover className="group">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                      <User className="w-5 h-5 inline mr-2" />
                      {client.nombre || client.username || 'Sin nombre'}
                    </h3>
                    <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(client.estado || 'inactivo')}`}>
                      {getStatusIcon(client.estado || 'inactivo')}
                      {client.estado === 'activo' ? 'Activo' : client.estado === 'inactivo' ? 'Inactivo' : 'Bloqueado'}
                    </span>
                    <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(client.rol)}`}>
                      {getRoleIcon(client.rol)}
                      {client.rol === 'cliente' ? 'Cliente' : client.rol === 'empleado' ? 'Empleado' : client.rol}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <Mail className="w-4 h-4" />
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="font-medium">{client.email || 'No especificado'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <Phone className="w-4 h-4" />
                      <div>
                        <p className="text-xs text-gray-500">Teléfono</p>
                        <p className="font-medium">{client.telefono || 'No especificado'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <Building className="w-4 h-4" />
                      <div>
                        <p className="text-xs text-gray-500">Empresa</p>
                        <p className="font-medium">{client.empresa || 'No especificada'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {client.direccion && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <MapPin className="w-4 h-4" />
                        <div>
                          <p className="text-xs text-gray-500">Dirección</p>
                          <p className="text-sm">{client.direccion}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>Registrado el {formatDate(client.fecha_registro)}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row xl:flex-col gap-3 xl:w-48">
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => {
                      setSelectedClient(client);
                      setShowModal(true);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                    Ver Detalles
                  </Button>
                  
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => handleEditClient(client)}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </Button>
                  
                  {client.estado === 'inactivo' && (
                    <Button 
                      variant="success" 
                      size="sm" 
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => handleUpdateStatus(client.id, 'activo')}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Activar
                    </Button>
                  )}
                  
                  {client.estado === 'activo' && (
                    <Button 
                      variant="warning" 
                      size="sm" 
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => handleUpdateStatus(client.id, 'inactivo')}
                    >
                      <XCircle className="w-4 h-4" />
                      Desactivar
                    </Button>
                  )}
                  
                  {client.estado === 'bloqueado' && (
                    <Button 
                      variant="info" 
                      size="sm" 
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => handleUpdateStatus(client.id, 'activo')}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Desbloquear
                    </Button>
                  )}
                  
                  <Button 
                    variant="danger" 
                    size="sm" 
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => handleDelete(client.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredClients.length === 0 && (
          <Card variant="gradient" className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Users className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No hay clientes
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === 'all' ? 'No se han registrado clientes aún' : `No hay clientes con estado "${filter}"`}
            </p>
          </Card>
        )}

        {/* Client Details Modal */}
        {showModal && selectedClient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    Detalles del Cliente
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="flex gap-3 mb-4">
                    <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedClient.estado || 'inactivo')}`}>
                      {getStatusIcon(selectedClient.estado || 'inactivo')}
                      {selectedClient.estado === 'activo' ? 'Activo' : selectedClient.estado === 'inactivo' ? 'Inactivo' : 'Bloqueado'}
                    </span>
                    <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(selectedClient.rol)}`}>
                      {getRoleIcon(selectedClient.rol)}
                      {selectedClient.rol === 'cliente' ? 'Cliente' : selectedClient.rol === 'empleado' ? 'Empleado' : selectedClient.rol}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nombre Completo
                      </label>
                      <p className="text-gray-900 dark:text-gray-100">{selectedClient.nombre || selectedClient.username || 'No especificado'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email
                      </label>
                      <p className="text-gray-900 dark:text-gray-100">{selectedClient.email || 'No especificado'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Teléfono
                      </label>
                      <p className="text-gray-900 dark:text-gray-100">{selectedClient.telefono || 'No especificado'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Empresa
                      </label>
                      <p className="text-gray-900 dark:text-gray-100">{selectedClient.empresa || 'No especificada'}</p>
                    </div>
                    {selectedClient.direccion && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Dirección
                        </label>
                        <p className="text-gray-900 dark:text-gray-100">{selectedClient.direccion}</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Fecha de Registro
                      </label>
                      <p className="text-gray-900 dark:text-gray-100">{formatDate(selectedClient.fecha_registro)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Última Actualización
                      </label>
                      <p className="text-gray-900 dark:text-gray-100">{formatDate(selectedClient.updated_at)}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    <Button 
                      variant="secondary" 
                      onClick={() => handleEditClient(selectedClient)}
                      className="flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Editar Cliente
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => setShowModal(false)}
                    >
                      Cerrar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Client Modal */}
        {createMode && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    Crear Nuevo Cliente
                  </h2>
                  <button
                    onClick={handleCancelCreate}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleSaveCreate(); }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        value={createForm.nombre}
                        onChange={(e) => handleCreateFormChange('nombre', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={createForm.email}
                        onChange={(e) => handleCreateFormChange('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Contraseña *
                      </label>
                      <input
                        type="password"
                        value={createForm.password}
                        onChange={(e) => handleCreateFormChange('password', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Teléfono
                      </label>
                      <input
                        type="text"
                        value={createForm.telefono}
                        onChange={(e) => handleCreateFormChange('telefono', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Empresa
                      </label>
                      <input
                        type="text"
                        value={createForm.empresa}
                        onChange={(e) => handleCreateFormChange('empresa', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Estado
                      </label>
                      <select
                        value={createForm.estado}
                        onChange={(e) => handleCreateFormChange('estado', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                      >
                        <option value="activo">Activo</option>
                        <option value="inactivo">Inactivo</option>
                        <option value="bloqueado">Bloqueado</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Dirección
                      </label>
                      <textarea
                        value={createForm.direccion}
                        onChange={(e) => handleCreateFormChange('direccion', e.target.value)}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    <Button 
                      type="submit"
                      variant="primary" 
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Crear Cliente
                    </Button>
                    <Button 
                      type="button"
                      variant="ghost" 
                      onClick={handleCancelCreate}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Client Modal */}
        {editMode && editForm.id && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    Editar Cliente
                  </h2>
                  <button
                    onClick={handleCancelEdit}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        value={editForm.nombre}
                        onChange={(e) => handleFormChange('nombre', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => handleFormChange('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Teléfono
                      </label>
                      <input
                        type="text"
                        value={editForm.telefono}
                        onChange={(e) => handleFormChange('telefono', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Empresa
                      </label>
                      <input
                        type="text"
                        value={editForm.empresa}
                        onChange={(e) => handleFormChange('empresa', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Dirección
                      </label>
                      <textarea
                        value={editForm.direccion}
                        onChange={(e) => handleFormChange('direccion', e.target.value)}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Estado
                      </label>
                      <select
                        value={editForm.estado}
                        onChange={(e) => handleFormChange('estado', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                      >
                        <option value="activo">Activo</option>
                        <option value="inactivo">Inactivo</option>
                        <option value="bloqueado">Bloqueado</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Rol
                      </label>
                      <select
                        value={editForm.rol}
                        onChange={(e) => handleFormChange('rol', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                      >
                        <option value="cliente">Cliente</option>
                        <option value="empleado">Empleado</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    <Button 
                      type="submit"
                      variant="primary" 
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Guardar Cambios
                    </Button>
                    <Button 
                      type="button"
                      variant="ghost" 
                      onClick={handleCancelEdit}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

ClientsViewPage.propTypes = {
  showNavigation: PropTypes.bool
};

export default ClientsViewPage;