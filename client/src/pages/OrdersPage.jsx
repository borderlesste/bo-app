import { useState, useEffect } from 'react';
import { Card, Button, Skeleton } from '../components';
import { getOrders, updateOrder, updateOrderStatus, deleteOrder, createOrder, getClients } from '../api/axios';
import OrdersNavigation from '../components/OrdersNavigation';
import CreateOrderModal from '../components/CreateOrderModal';
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

const OrdersPage = ({ showNavigation = true }) => {
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
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

  // Cargar pedidos y clientes desde la API
  useEffect(() => {
    fetchOrders();
    fetchClients();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await getOrders();
      if (response.data.success) {
        setOrders(response.data.data);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await getClients();
      if (response.data.success) {
        setClients(response.data.data);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const handleCreateOrder = async (orderData) => {
    try {
      const response = await createOrder(orderData);
      if (response.data.success) {
        await fetchOrders(); // Refresh the orders list
        return response.data;
      }
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const response = await updateOrderStatus(id, newStatus);
      if (response.data.success) {
        setOrders(orders.map(order => 
          order.id === id ? { ...order, estado: newStatus } : order
        ));
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const handleUpdatePriority = async (id, newPriority) => {
    try {
      const response = await updateOrder(id, { prioridad: newPriority });
      if (response.data.success) {
        setOrders(orders.map(order => 
          order.id === id ? { ...order, prioridad: newPriority } : order
        ));
        // Update selectedOrder if it's the same order being updated
        if (selectedOrder && selectedOrder.id === id) {
          setSelectedOrder({ ...selectedOrder, prioridad: newPriority });
        }
      }
    } catch (error) {
      console.error('Error updating priority:', error);
    }
  };

  const handleEditOrder = (order) => {
    setSelectedOrder(order);
    setEditForm({
      descripcion: order.descripcion || '',
      estado: order.estado || '',
      prioridad: order.prioridad || '',
      total: order.total || '',
      fecha_entrega_estimada: order.fecha_entrega_estimada ? order.fecha_entrega_estimada.split('T')[0] : ''
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
      const response = await updateOrder(selectedOrder.id, editForm);
      if (response.data.success) {
        setOrders(orders.map(order => 
          order.id === selectedOrder.id ? { ...order, ...editForm } : order
        ));
        setShowEditModal(false);
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Error al actualizar el pedido');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Estás seguro de que quieres eliminar este pedido?')) {
      try {
        const response = await deleteOrder(id);
        if (response.data.success) {
          setOrders(orders.filter(order => order.id !== id));
        }
      } catch (error) {
        console.error('Error deleting order:', error);
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

  const filteredOrders = orders.filter(order => {
    const statusMatch = filter === 'all' || order.estado === filter;
    const priorityMatch = priorityFilter === 'all' || order.prioridad === priorityFilter;
    const searchMatch = searchTerm === '' || 
      order.numero_pedido?.toString().includes(searchTerm) ||
      order.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.cliente_nombre?.toLowerCase().includes(searchTerm.toLowerCase());
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

  const exportOrders = () => {
    const dataStr = JSON.stringify(filteredOrders, null, 2);
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
        {showNavigation && <OrdersNavigation />}
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-heading font-bold text-gray-800 dark:text-gray-100 mb-4">
                📦 Gestión de Pedidos
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
                Administra todos los proyectos y órdenes de trabajo de tus clientes
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={exportOrders}
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
              {orders.filter(o => o.estado === 'en_proceso').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">En Proceso</div>
          </Card>
          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="text-3xl font-bold text-yellow-600 mb-2">
              {orders.filter(o => o.estado === 'nuevo').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Nuevos</div>
          </Card>
          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {orders.filter(o => o.estado === 'completado').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Completados</div>
          </Card>
          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="text-3xl font-bold text-gray-700 dark:text-gray-300 mb-2">
              {formatCurrency(orders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0))}
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
                Todos ({orders.length})
              </Button>
              <Button
                variant={filter === 'nuevo' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('nuevo')}
              >
                Nuevos ({orders.filter(o => o.estado === 'nuevo').length})
              </Button>
              <Button
                variant={filter === 'en_proceso' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('en_proceso')}
              >
                En Proceso ({orders.filter(o => o.estado === 'en_proceso').length})
              </Button>
              <Button
                variant={filter === 'completado' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('completado')}
              >
                Completados ({orders.filter(o => o.estado === 'completado').length})
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
              Alta ({orders.filter(o => o.prioridad === 'alta').length})
            </Button>
            <Button
              variant={priorityFilter === 'normal' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setPriorityFilter('normal')}
            >
              Normal ({orders.filter(o => o.prioridad === 'normal').length})
            </Button>
            <Button
              variant={priorityFilter === 'baja' ? 'success' : 'ghost'}
              size="sm"
              onClick={() => setPriorityFilter('baja')}
            >
              Baja ({orders.filter(o => o.prioridad === 'baja').length})
            </Button>
          </div>
        </Card>

        {/* Orders List */}
        <div className="grid gap-6">
          {filteredOrders.map((order) => (
            <Card key={order.id} variant="gradient" hover className="group">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                      <Package className="w-5 h-5 inline mr-2" />
                      Pedido #{order.numero_pedido}
                    </h3>
                    <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.estado)}`}>
                      {getStatusIcon(order.estado)}
                      {order.estado}
                    </span>
                    <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(order.prioridad)}`}>
                      {getPriorityIcon(order.prioridad)}
                      Prioridad {order.prioridad}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <User className="w-4 h-4" />
                      <div>
                        <p className="text-xs text-gray-500">Cliente</p>
                        <p className="font-medium">{order.cliente_nombre || 'Cliente no especificado'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <DollarSign className="w-4 h-4" />
                      <div>
                        <p className="text-xs text-gray-500">Valor</p>
                        <p className="text-xl font-bold text-gray-800 dark:text-gray-200">
                          {formatCurrency(order.presupuesto_estimado || order.total || 0)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <Calendar className="w-4 h-4" />
                      <div>
                        <p className="text-xs text-gray-500">Entrega Estimada</p>
                        <p className="font-medium">{formatDate(order.fecha_entrega_estimada || order.fecha_entrega_deseada)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Descripción</p>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {order.descripcion}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>Creado el {formatDate(order.created_at)}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row xl:flex-col gap-3 xl:w-48">
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => {
                      setSelectedOrder(order);
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
                    onClick={() => handleEditOrder(order)}
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </Button>
                  
                  {order.estado === 'nuevo' && (
                    <Button 
                      variant="success" 
                      size="sm" 
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => handleUpdateStatus(order.id, 'confirmado')}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Confirmar
                    </Button>
                  )}
                  
                  {order.estado === 'confirmado' && (
                    <Button 
                      variant="success" 
                      size="sm" 
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => handleUpdateStatus(order.id, 'en_proceso')}
                    >
                      <PlayCircle className="w-4 h-4" />
                      Iniciar
                    </Button>
                  )}
                  
                  {order.estado === 'en_proceso' && (
                    <>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="w-full flex items-center justify-center gap-2"
                        onClick={() => handleUpdateStatus(order.id, 'en_pausa')}
                      >
                        <PauseCircle className="w-4 h-4" />
                        Pausar
                      </Button>
                      <Button 
                        variant="success" 
                        size="sm" 
                        className="w-full flex items-center justify-center gap-2"
                        onClick={() => handleUpdateStatus(order.id, 'completado')}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Completar
                      </Button>
                    </>
                  )}
                  
                  {order.estado === 'en_pausa' && (
                    <Button 
                      variant="success" 
                      size="sm" 
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => handleUpdateStatus(order.id, 'en_proceso')}
                    >
                      <PlayCircle className="w-4 h-4" />
                      Reanudar
                    </Button>
                  )}
                  
                  <Button 
                    variant="danger" 
                    size="sm" 
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => handleDelete(order.id)}
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
        {filteredOrders.length === 0 && (
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

        {/* Order Details Modal */}
        {showModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    Detalles del Pedido #{selectedOrder.numero_pedido}
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
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">#{selectedOrder.numero_pedido}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Estado Actual
                      </label>
                      <div className="flex gap-2 items-center">
                        <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.estado)}`}>
                          {getStatusIcon(selectedOrder.estado)}
                          {selectedOrder.estado}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedOrder.prioridad)}`}>
                            {getPriorityIcon(selectedOrder.prioridad)}
                            {selectedOrder.prioridad}
                          </span>
                          <select
                            value={selectedOrder.prioridad}
                            onChange={(e) => handleUpdatePriority(selectedOrder.id, e.target.value)}
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
                      <p className="text-gray-900 dark:text-gray-100">{selectedOrder.cliente_nombre || 'No especificado'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Valor del Proyecto
                      </label>
                      <div>
                        {selectedOrder.presupuesto_estimado > 0 && (
                          <p className="text-lg font-bold text-blue-600">Presupuesto Estimado: {formatCurrency(selectedOrder.presupuesto_estimado)}</p>
                        )}
                        {selectedOrder.subtotal > 0 && (
                          <p className="text-lg font-bold text-gray-600">Subtotal: {formatCurrency(selectedOrder.subtotal)}</p>
                        )}
                        {selectedOrder.descuento > 0 && (
                          <p className="text-sm text-gray-500">Descuento: {formatCurrency(selectedOrder.descuento)}</p>
                        )}
                        {selectedOrder.iva > 0 && (
                          <p className="text-sm text-gray-500">IVA: {formatCurrency(selectedOrder.iva)}</p>
                        )}
                        {selectedOrder.total > 0 && (
                          <p className="text-2xl font-bold text-green-600">Total: {formatCurrency(selectedOrder.total)}</p>
                        )}
                        {selectedOrder.anticipo > 0 && (
                          <p className="text-md text-blue-600">Anticipo: {formatCurrency(selectedOrder.anticipo)}</p>
                        )}
                        {selectedOrder.saldo_pendiente > 0 && (
                          <p className="text-md text-orange-600">Saldo: {formatCurrency(selectedOrder.saldo_pendiente)}</p>
                        )}
                        {(!selectedOrder.presupuesto_estimado || selectedOrder.presupuesto_estimado === 0) && 
                         (!selectedOrder.total || selectedOrder.total === 0) && (
                          <p className="text-lg text-gray-500">Sin valor especificado</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Fecha de Inicio
                      </label>
                      <p className="text-gray-900 dark:text-gray-100">{formatDate(selectedOrder.fecha_inicio)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Fecha de Entrega
                      </label>
                      <p className="text-gray-900 dark:text-gray-100">
                        {selectedOrder.fecha_entrega_deseada && (
                          <>Deseada por cliente: {formatDate(selectedOrder.fecha_entrega_deseada)}<br/></>
                        )}
                        {selectedOrder.fecha_entrega_estimada && (
                          <>Estimada por admin: {formatDate(selectedOrder.fecha_entrega_estimada)}<br/></>
                        )}
                        {selectedOrder.fecha_entrega_real && (
                          <>Real: {formatDate(selectedOrder.fecha_entrega_real)}</>
                        )}
                        {!selectedOrder.fecha_entrega_deseada && !selectedOrder.fecha_entrega_estimada && !selectedOrder.fecha_entrega_real && (
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
                      <p className="text-gray-900 dark:text-gray-100 leading-relaxed">{selectedOrder.descripcion}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    {selectedOrder.estado === 'nuevo' && (
                      <Button 
                        variant="success" 
                        className="flex items-center gap-2"
                        onClick={() => {
                          handleUpdateStatus(selectedOrder.id, 'confirmado');
                          setShowModal(false);
                        }}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Confirmar Pedido
                      </Button>
                    )}
                    {selectedOrder.estado === 'confirmado' && (
                      <Button 
                        variant="success" 
                        className="flex items-center gap-2"
                        onClick={() => {
                          handleUpdateStatus(selectedOrder.id, 'en_proceso');
                          setShowModal(false);
                        }}
                      >
                        <PlayCircle className="w-4 h-4" />
                        Iniciar Proyecto
                      </Button>
                    )}
                    {selectedOrder.estado === 'en_proceso' && (
                      <>
                        <Button 
                          variant="secondary" 
                          className="flex items-center gap-2"
                          onClick={() => {
                            handleUpdateStatus(selectedOrder.id, 'en_pausa');
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
                            handleUpdateStatus(selectedOrder.id, 'completado');
                            setShowModal(false);
                          }}
                        >
                          <CheckCircle className="w-4 h-4" />
                          Marcar como Completado
                        </Button>
                      </>
                    )}
                    {selectedOrder.estado === 'en_pausa' && (
                      <Button 
                        variant="success" 
                        className="flex items-center gap-2"
                        onClick={() => {
                          handleUpdateStatus(selectedOrder.id, 'en_proceso');
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
                        handleEditOrder(selectedOrder);
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
        {showEditModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    Editar Pedido #{selectedOrder.numero_pedido}
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

        {/* Create Order Modal */}
        <CreateOrderModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateOrder}
          clients={clients}
        />
      </div>
    </div>
  );
};

// Props validation
OrdersPage.propTypes = {
  showNavigation: PropTypes.bool
};

export default OrdersPage;