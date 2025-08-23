import { useState, useEffect } from 'react';
import { Card, Button, Skeleton } from '../components';
import { getPedidos, updatePedido, updatePedidoStatus, deletePedido, createPedido, getUsers } from '../api/axios';
import PedidosNavigation from '../components/PedidosNavigation';
import CreatePedidoModal from '../components/CreatePedidoModal';
import PropTypes from 'prop-types';
import { 
  Search, 
  Filter, 
  Plus, 
  Calendar, 
  User, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  XCircle,
  Eye,
  Edit,
  Trash2,
  Download,
  DollarSign,
  PlayCircle,
  PauseCircle,
  Target,
  TrendingUp,
  Package
} from 'lucide-react';

const PedidosPage = ({ showNavigation = true }) => {
  const [pedidos, setPedidos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    descripcion: '',
    estado: '',
    prioridad: '',
    total: '',
    fecha_entrega_estimada: ''
  });

  // Cargar pedidos y usuarios desde la API
  useEffect(() => {
    fetchPedidos();
    fetchUsuarios();
  }, []);

  const fetchPedidos = async () => {
    try {
      setLoading(true);
      const response = await getPedidos();
      if (response.data.success) {
        setPedidos(response.data.data);
      }
    } catch (error) {
      console.error('Error loading pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsuarios = async () => {
    try {
      const response = await getUsers();
      if (response.data.success) {
        setUsuarios(response.data.data);
      }
    } catch (error) {
      console.error('Error loading usuarios:', error);
    }
  };

    const handleCreatePedido = async (pedidoData) => {
    try {
      const response = await createPedido(pedidoData);
      if (response.data.success) {
        await fetchPedidos(); // Refresh the pedidos list
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Error creating pedido:', error);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await updatePedidoStatus(id, newStatus);
      if (response.data.success) {
        setPedidos(pedidos.map(pedido => 
          pedido.id === id ? { ...pedido, estado: newStatus } : pedido
        ));
      }
    } catch (error) {
      console.error('Error updating pedido:', error);
    }
  };

  const handlePriorityChange = async (id, newPriority) => {
    try {
      const response = await updatePedido(id, { prioridad: newPriority });
      if (response.data.success) {
        setPedidos(pedidos.map(pedido => 
          pedido.id === id ? { ...pedido, prioridad: newPriority } : pedido
        ));
        
        // Update selectedPedido if it's the same pedido being updated
        if (selectedPedido && selectedPedido.id === id) {
          setSelectedPedido({ ...selectedPedido, prioridad: newPriority });
        }
      }
    } catch (error) {
      console.error('Error updating priority:', error);
    }
  };

  const handleEditPedido = (pedido) => {
    setSelectedPedido(pedido);
    setEditForm({
      descripcion: pedido.descripcion || '',
      fecha_entrega: pedido.fecha_entrega || '',
      prioridad: pedido.prioridad || 'normal',
      notas: pedido.notas || ''
    });
    setShowEditModal(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveEdit = async () => {
    try {
      const response = await updatePedido(selectedPedido.id, editForm);
      if (response.data.success) {
        setPedidos(pedidos.map(pedido => 
          pedido.id === selectedPedido.id ? { ...pedido, ...editForm } : pedido
        ));
        setShowEditModal(false);
        setSelectedPedido(null);
      }
    } catch (error) {
      console.error('Error updating pedido:', error);
      alert('Error al actualizar el pedido');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Estás seguro de que quieres eliminar este pedido?')) {
      try {
        const response = await deletePedido(id);
        if (response.data.success) {
          setPedidos(pedidos.filter(pedido => pedido.id !== id));
        }
      } catch (error) {
        console.error('Error deleting pedido:', error);
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'nuevo': return <Clock className="w-4 h-4" />;
      case 'confirmado': return <CheckCircle className="w-4 h-4" />;
      case 'en_proceso': return <PlayCircle className="w-4 h-4" />;
      case 'completado': return <CheckCircle className="w-4 h-4" />;
      case 'cancelado': return <XCircle className="w-4 h-4" />;
      case 'en_pausa': return <PauseCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'nuevo': return 'bg-yellow-500 text-white';
      case 'confirmado': return 'bg-blue-500 text-white';
      case 'en_proceso': return 'bg-indigo-500 text-white';
      case 'completado': return 'bg-green-500 text-white';
      case 'cancelado': return 'bg-red-500 text-white';
      case 'en_pausa': return 'bg-orange-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'alta': return <AlertCircle className="w-4 h-4" />;
      case 'urgente': return <AlertCircle className="w-4 h-4" />;
      case 'normal': return <Target className="w-4 h-4" />;
      case 'baja': return <TrendingUp className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgente': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'alta': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case 'normal': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'baja': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredPedidos = pedidos.filter(pedido => {
    const statusMatch = filter === 'all' || pedido.estado === filter;
    const priorityMatch = priorityFilter === 'all' || pedido.prioridad === priorityFilter;
    const searchMatch = searchTerm === '' || 
      pedido.numero_pedido?.toString().includes(searchTerm) ||
      pedido.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pedido.cliente_nombre?.toLowerCase().includes(searchTerm.toLowerCase());
    return statusMatch && priorityMatch && searchMatch;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'No especificada';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const exportPedidos = () => {
    const dataStr = JSON.stringify(filteredPedidos, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `pedidos_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
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
        {/* Navigation */}
        {showNavigation && <PedidosNavigation />}
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-heading font-bold text-gray-800 dark:text-gray-100 mb-4">
                📦 Gestión de Pedidos
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
                Administra todos los proyectos y pedidos de trabajo de tus clientes
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={exportPedidos}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nuevo Pedido
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {pedidos.filter(p => p.estado === 'en_proceso').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">En Proceso</div>
          </Card>
          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="text-3xl font-bold text-yellow-600 mb-2">
              {pedidos.filter(p => p.estado === 'nuevo').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Nuevos</div>
          </Card>
          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {pedidos.filter(p => p.estado === 'completado').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Completados</div>
          </Card>
          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="text-3xl font-bold text-gray-700 dark:text-gray-300 mb-2">
              {formatCurrency(pedidos.reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0))}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Valor Total</div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card variant="gradient" className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por servicio, descripción o cliente..."
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
                Todos ({pedidos.length})
              </Button>
              <Button
                variant={filter === 'nuevo' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('nuevo')}
              >
                Nuevos ({pedidos.filter(p => p.estado === 'nuevo').length})
              </Button>
              <Button
                variant={filter === 'en_proceso' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('en_proceso')}
              >
                En Proceso ({pedidos.filter(p => p.estado === 'en_proceso').length})
              </Button>
              <Button
                variant={filter === 'completado' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('completado')}
              >
                Completados ({pedidos.filter(p => p.estado === 'completado').length})
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Prioridad:
            </span>
            <Button
              variant={priorityFilter === 'all' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setPriorityFilter('all')}
            >
              Todas
            </Button>
            <Button
              variant={priorityFilter === 'alta' ? 'danger' : 'ghost'}
              size="sm"
              onClick={() => setPriorityFilter('alta')}
            >
              Alta ({pedidos.filter(p => p.prioridad === 'alta').length})
            </Button>
            <Button
              variant={priorityFilter === 'normal' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setPriorityFilter('normal')}
            >
              Normal ({pedidos.filter(p => p.prioridad === 'normal').length})
            </Button>
            <Button
              variant={priorityFilter === 'baja' ? 'success' : 'ghost'}
              size="sm"
              onClick={() => setPriorityFilter('baja')}
            >
              Baja ({pedidos.filter(p => p.prioridad === 'baja').length})
            </Button>
          </div>
        </Card>

        {/* Pedidos List */}
        <div className="grid gap-6">
          {filteredPedidos.map((pedido) => (
            <Card key={pedido.id} variant="gradient" hover className="group">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                      <Package className="w-5 h-5 inline mr-2" />
                      Pedido #{pedido.numero_pedido}
                    </h3>
                    <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(pedido.estado)}`}>
                      {getStatusIcon(pedido.estado)}
                      {pedido.estado}
                    </span>
                    <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(pedido.prioridad)}`}>
                      {getPriorityIcon(pedido.prioridad)}
                      Prioridad {pedido.prioridad}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <User className="w-4 h-4" />
                      <div>
                        <p className="text-xs text-gray-500">Cliente</p>
                        <p className="font-medium">{pedido.cliente_nombre || 'Cliente no especificado'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <DollarSign className="w-4 h-4" />
                      <div>
                        <p className="text-xs text-gray-500">Valor</p>
                        <p className="text-xl font-bold text-gray-800 dark:text-gray-200">
                          {formatCurrency(pedido.presupuesto_estimado || pedido.total || 0)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <Calendar className="w-4 h-4" />
                      <div>
                        <p className="text-xs text-gray-500">Entrega Estimada</p>
                        <p className="font-medium">{formatDate(pedido.fecha_entrega_estimada || pedido.fecha_entrega_deseada)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Descripción</p>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {pedido.descripcion}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>Creado el {formatDate(pedido.created_at)}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row xl:flex-col gap-3 xl:w-48">
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => {
                      setSelectedPedido(pedido);
                      setShowModal(true);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                    Ver Detalles
                  </Button>
                  
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => handleEditPedido(pedido)}
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </Button>
                  
                  {pedido.estado === 'nuevo' && (
                    <Button 
                      variant="success" 
                      size="sm" 
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => handleStatusChange(pedido.id, 'confirmado')}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Confirmar
                    </Button>
                  )}
                  
                  {pedido.estado === 'confirmado' && (
                    <Button 
                      variant="success" 
                      size="sm" 
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => handleStatusChange(pedido.id, 'en_proceso')}
                    >
                      <PlayCircle className="w-4 h-4" />
                      Iniciar
                    </Button>
                  )}
                  
                  {pedido.estado === 'en_proceso' && (
                    <>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="w-full flex items-center justify-center gap-2"
                        onClick={() => handleStatusChange(pedido.id, 'en_pausa')}
                      >
                        <PauseCircle className="w-4 h-4" />
                        Pausar
                      </Button>
                      <Button 
                        variant="success" 
                        size="sm" 
                        className="w-full flex items-center justify-center gap-2"
                        onClick={() => handleStatusChange(pedido.id, 'completado')}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Completar
                      </Button>
                    </>
                  )}
                  
                  {pedido.estado === 'en_pausa' && (
                    <Button 
                      variant="success" 
                      size="sm" 
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => handleStatusChange(pedido.id, 'en_proceso')}
                    >
                      <PlayCircle className="w-4 h-4" />
                      Reanudar
                    </Button>
                  )}
                  
                  <Button 
                    variant="danger" 
                    size="sm" 
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => handleDelete(pedido.id)}
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
        {filteredPedidos.length === 0 && (
          <Card variant="gradient" className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Package className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No hay pedidos
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No se encontraron pedidos que coincidan con los filtros seleccionados
            </p>
          </Card>
        )}

        {/* Pedido Details Modal */}
        {showModal && selectedPedido && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    Detalles del Pedido #{selectedPedido.numero_pedido}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Número de Pedido
                      </label>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">#{selectedPedido.numero_pedido}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Estado Actual
                      </label>
                      <div className="flex gap-2 items-center">
                        <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedPedido.estado)}`}>
                          {getStatusIcon(selectedPedido.estado)}
                          {selectedPedido.estado}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedPedido.prioridad)}`}>
                            {getPriorityIcon(selectedPedido.prioridad)}
                            {selectedPedido.prioridad}
                          </span>
                          <select
                            value={selectedPedido.prioridad}
                            onChange={(e) => handlePriorityChange(selectedPedido.id, e.target.value)}
                            className="ml-2 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                            title="Cambiar prioridad"
                          >
                            <option value="baja">Baja</option>
                            <option value="normal">Normal</option>
                            <option value="alta">Alta</option>
                            <option value="urgente">Urgente</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Cliente
                      </label>
                      <p className="text-gray-900 dark:text-gray-100">{selectedPedido.usuario_nombre || 'No especificado'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Valor del Proyecto
                      </label>
                      <div>
                        {selectedPedido.presupuesto_estimado > 0 && (
                          <p className="text-lg font-bold text-blue-600">Presupuesto Estimado: {formatCurrency(selectedPedido.presupuesto_estimado)}</p>
                        )}
                        {selectedPedido.subtotal > 0 && (
                          <p className="text-lg font-bold text-gray-600">Subtotal: {formatCurrency(selectedPedido.subtotal)}</p>
                        )}
                        {selectedPedido.descuento > 0 && (
                          <p className="text-sm text-gray-500">Descuento: {formatCurrency(selectedPedido.descuento)}</p>
                        )}
                        {selectedPedido.iva > 0 && (
                          <p className="text-sm text-gray-500">IVA: {formatCurrency(selectedPedido.iva)}</p>
                        )}
                        {selectedPedido.total > 0 && (
                          <p className="text-2xl font-bold text-green-600">Total: {formatCurrency(selectedPedido.total)}</p>
                        )}
                        {selectedPedido.anticipo > 0 && (
                          <p className="text-md text-blue-600">Anticipo: {formatCurrency(selectedPedido.anticipo)}</p>
                        )}
                        {selectedPedido.saldo_pendiente > 0 && (
                          <p className="text-md text-orange-600">Saldo: {formatCurrency(selectedPedido.saldo_pendiente)}</p>
                        )}
                        {(!selectedPedido.presupuesto_estimado || selectedPedido.presupuesto_estimado === 0) && 
                         (!selectedPedido.total || selectedPedido.total === 0) && (
                          <p className="text-lg text-gray-500">Sin valor especificado</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Fecha de Inicio
                      </label>
                      <p className="text-gray-900 dark:text-gray-100">{formatDate(selectedPedido.fecha_inicio)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Fecha de Entrega
                      </label>
                      <p className="text-gray-900 dark:text-gray-100">
                        {selectedPedido.fecha_entrega_deseada && (
                          <>Deseada por cliente: {formatDate(selectedPedido.fecha_entrega_deseada)}<br/></>
                        )}
                        {selectedPedido.fecha_entrega_estimada && (
                          <>Estimada por admin: {formatDate(selectedPedido.fecha_entrega_estimada)}<br/></>
                        )}
                        {selectedPedido.fecha_entrega_real && (
                          <>Real: {formatDate(selectedPedido.fecha_entrega_real)}</>
                        )}
                        {!selectedPedido.fecha_entrega_deseada && !selectedPedido.fecha_entrega_estimada && !selectedPedido.fecha_entrega_real && (
                          <span className="text-gray-500">No especificada</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Descripción del Pedido
                    </label>
                    <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                      <p className="text-gray-900 dark:text-gray-100 leading-relaxed">{selectedPedido.descripcion}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    {selectedPedido.estado === 'nuevo' && (
                      <Button 
                        variant="success" 
                        className="flex items-center gap-2"
                        onClick={() => {
                          handleStatusChange(selectedPedido.id, 'confirmado');
                          setShowModal(false);
                        }}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Confirmar Pedido
                      </Button>
                    )}
                    {selectedPedido.estado === 'confirmado' && (
                      <Button 
                        variant="success" 
                        className="flex items-center gap-2"
                        onClick={() => {
                          handleStatusChange(selectedPedido.id, 'en_proceso');
                          setShowModal(false);
                        }}
                      >
                        <PlayCircle className="w-4 h-4" />
                        Iniciar Proyecto
                      </Button>
                    )}
                    {selectedPedido.estado === 'en_proceso' && (
                      <>
                        <Button 
                          variant="secondary" 
                          className="flex items-center gap-2"
                          onClick={() => {
                            handleStatusChange(selectedPedido.id, 'en_pausa');
                            setShowModal(false);
                          }}
                        >
                          <PauseCircle className="w-4 h-4" />
                          Pausar Proyecto
                        </Button>
                        <Button 
                          variant="success" 
                          className="flex items-center gap-2"
                          onClick={() => {
                            handleStatusChange(selectedPedido.id, 'completado');
                            setShowModal(false);
                          }}
                        >
                          <CheckCircle className="w-4 h-4" />
                          Marcar como Completado
                        </Button>
                      </>
                    )}
                    {selectedPedido.estado === 'en_pausa' && (
                      <Button 
                        variant="success" 
                        className="flex items-center gap-2"
                        onClick={() => {
                          handleStatusChange(selectedPedido.id, 'en_proceso');
                          setShowModal(false);
                        }}
                      >
                        <PlayCircle className="w-4 h-4" />
                        Reanudar Proyecto
                      </Button>
                    )}
                    <Button 
                      variant="secondary" 
                      className="flex items-center gap-2"
                      onClick={() => {
                        setShowModal(false);
                        handleEditPedido(selectedPedido);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                      Editar Pedido
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

        {/* Modal de Edición */}
        {showEditModal && selectedPedido && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    Editar Pedido #{selectedPedido.numero_pedido}
                  </h2>
                  <button 
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <form className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Descripción del Proyecto
                    </label>
                    <textarea
                      name="descripcion"
                      value={editForm.descripcion}
                      onChange={handleEditFormChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                      placeholder="Describe los detalles del proyecto..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Estado
                      </label>
                      <select
                        name="estado"
                        value={editForm.estado}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="nuevo">Nuevo</option>
                        <option value="confirmado">Confirmado</option>
                        <option value="en_proceso">En Proceso</option>
                        <option value="completado">Completado</option>
                        <option value="cancelado">Cancelado</option>
                        <option value="en_pausa">En Pausa</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Prioridad
                      </label>
                      <select
                        name="prioridad"
                        value={editForm.prioridad}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="baja">Baja</option>
                        <option value="normal">Normal</option>
                        <option value="alta">Alta</option>
                        <option value="urgente">Urgente</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Valor Total ($)
                      </label>
                      <input
                        type="number"
                        name="total"
                        value={editForm.total}
                        onChange={handleEditFormChange}
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Fecha de Entrega Estimada
                      </label>
                      <input
                        type="date"
                        name="fecha_entrega_estimada"
                        value={editForm.fecha_entrega_estimada}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <Button 
                      variant="primary" 
                      className="flex items-center gap-2"
                      onClick={handleSaveEdit}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Guardar Cambios
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => setShowEditModal(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Create Pedido Modal */}
        <CreatePedidoModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreatePedido}
          usuarios={usuarios}
        />
      </div>
    </div>
  );
};

// Props validation
PedidosPage.propTypes = {
  showNavigation: PropTypes.bool
};

export default PedidosPage;