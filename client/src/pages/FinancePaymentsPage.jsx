import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Card, Button, Skeleton } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { getPayments, createAdminPayment, updateAdminPayment, deletePayment, getUsers, getPedidos } from '../api/axios';
import PaymentCreateModal from '../components/PaymentCreateModal';
import PaymentEditModal from '../components/PaymentEditModal';
import { 
  Search, 
  Filter, 
  Plus, 
  DollarSign, 
  Calendar, 
  User, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  XCircle,
  Eye,
  Edit,
  Trash2,
  Download,
  Building,
  TrendingUp,
  TrendingDown,
  RefreshCw
} from 'lucide-react';

const FinancePaymentsPage = ({ showNavigation = true }) => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Cargar datos desde las APIs
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, usersRes, pedidosRes] = await Promise.all([
        getPayments(),
        getUsers(),
        getPedidos()
      ]);

      if (paymentsRes.data.success) {
        setPayments(paymentsRes.data.data);
      }
      if (usersRes.data.success) {
        setUsuarios(usersRes.data.data.filter(user => user.rol !== 'admin'));
      }
      if (pedidosRes.data.success) {
        setPedidos(pedidosRes.data.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const response = await updateAdminPayment(id, { estado: newStatus });
      if (response.data.success) {
        setPayments(payments.map(payment => 
          payment.id === id ? { ...payment, estado: newStatus } : payment
        ));
      }
    } catch (error) {
      console.error('Error updating payment:', error);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Estás seguro de que quieres eliminar este pago?')) {
      try {
        const response = await deletePayment(id);
        if (response.data.success) {
          setPayments(payments.filter(payment => payment.id !== id));
        }
      } catch (error) {
        console.error('Error deleting payment:', error);
      }
    }
  };

  const handleCreatePayment = async (paymentData) => {
    try {
      const response = await createAdminPayment({
        ...paymentData,
        admin_id: user.id,
        fecha_registro: new Date().toISOString()
      });
      if (response.data.success) {
        await fetchAllData();
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  };

  const handleEditPayment = async (paymentId, paymentData) => {
    try {
      const response = await updateAdminPayment(paymentId, paymentData);
      if (response.data.success) {
        await fetchAllData();
        setShowEditModal(false);
        setSelectedPayment(null);
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      throw error;
    }
  };

  const getStatusIcon = (estado) => {
    switch (estado) {
      case 'aplicado': return <CheckCircle className="w-4 h-4" />;
      case 'pendiente': return <Clock className="w-4 h-4" />;
      case 'procesando': return <Clock className="w-4 h-4" />;
      case 'rechazado': return <XCircle className="w-4 h-4" />;
      case 'cancelado': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'aplicado': return 'bg-green-500 text-white';
      case 'pendiente': return 'bg-yellow-500 text-white';
      case 'procesando': return 'bg-blue-500 text-white';
      case 'rechazado': return 'bg-red-500 text-white';
      case 'cancelado': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
      case 'tarjeta': case 'card': return <CreditCard className="w-4 h-4" />;
      case 'transferencia': case 'transfer': return <Building className="w-4 h-4" />;
      case 'efectivo': case 'cash': return <DollarSign className="w-4 h-4" />;
      default: return <CreditCard className="w-4 h-4" />;
    }
  };

  const getMethodColor = (method) => {
    switch (method?.toLowerCase()) {
      case 'tarjeta': case 'card': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'transferencia': case 'transfer': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'efectivo': case 'cash': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredPayments = payments.filter(payment => {
    const statusMatch = filter === 'all' || payment.estado === filter;
    const methodMatch = methodFilter === 'all' || payment.metodo_pago?.toLowerCase().includes(methodFilter.toLowerCase());
    const searchMatch = searchTerm === '' || 
      payment.concepto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.cliente_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.referencia?.toLowerCase().includes(searchTerm.toLowerCase());
    return statusMatch && methodMatch && searchMatch;
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

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const exportPayments = () => {
    const dataStr = JSON.stringify(filteredPayments, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `pagos_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Calcular estadísticas
  const totalPagos = payments.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0);
  const pagosPendientes = payments.filter(p => p.estado === 'pendiente').reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0);
  const pagosCompletados = payments.filter(p => p.estado === 'aplicado').reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0);
  const pagosProcesando = payments.filter(p => p.estado === 'procesando').reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0);
  const pagosRechazados = payments.filter(p => p.estado === 'rechazado').reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0);

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
                💰 Gestión de Pagos
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
                Administra todos los pagos, facturación y transacciones del sistema
              </p>
              {user && (
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <User className="w-4 h-4 inline mr-1" />
                  Sesión activa: {user.nombre} ({user.email})
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchAllData}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Actualizar
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={exportPayments}
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
                Nuevo Pago
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="flex items-center justify-center mb-4">
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {formatCurrency(totalPagos)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Pagos</div>
          </Card>

          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {formatCurrency(pagosCompletados)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Completados</div>
          </Card>

          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <div className="text-3xl font-bold text-yellow-600 mb-2">
              {formatCurrency(pagosPendientes)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Pendientes</div>
          </Card>

          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex items-center justify-center gap-2 text-3xl font-bold text-blue-600 mb-2">
              {formatCurrency(pagosProcesando)}
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Procesando</div>
          </Card>

          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <div className="flex items-center justify-center gap-2 text-3xl font-bold text-red-600 mb-2">
              {formatCurrency(pagosRechazados)}
              <TrendingDown className="w-6 h-6" />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Rechazados</div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card variant="gradient" className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por concepto, cliente o referencia..."
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
                Todos ({payments.length})
              </Button>
              <Button
                variant={filter === 'aplicado' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('aplicado')}
              >
                Aplicados ({payments.filter(p => p.estado === 'aplicado').length})
              </Button>
              <Button
                variant={filter === 'pendiente' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('pendiente')}
              >
                Pendientes ({payments.filter(p => p.estado === 'pendiente').length})
              </Button>
              <Button
                variant={filter === 'procesando' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('procesando')}
              >
                Procesando ({payments.filter(p => p.estado === 'procesando').length})
              </Button>
              <Button
                variant={filter === 'rechazado' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('rechazado')}
              >
                Rechazados ({payments.filter(p => p.estado === 'rechazado').length})
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Método:
            </span>
            <Button
              variant={methodFilter === 'all' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setMethodFilter('all')}
            >
              Todos
            </Button>
            <Button
              variant={methodFilter === 'tarjeta' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setMethodFilter('tarjeta')}
            >
              Tarjeta
            </Button>
            <Button
              variant={methodFilter === 'transferencia' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setMethodFilter('transferencia')}
            >
              Transferencia
            </Button>
            <Button
              variant={methodFilter === 'efectivo' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setMethodFilter('efectivo')}
            >
              Efectivo
            </Button>
          </div>
        </Card>

        {/* Payments List */}
        <div className="grid gap-6">
          {filteredPayments.map((payment) => (
            <Card key={payment.id} variant="gradient" hover className="group">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                      <DollarSign className="w-5 h-5 inline mr-2" />
                      {payment.concepto || 'Pago sin concepto'}
                    </h3>
                    <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.estado || 'pendiente')}`}>
                      {getStatusIcon(payment.estado || 'pendiente')}
                      {payment.estado === 'aplicado' ? 'Aplicado' : payment.estado === 'pendiente' ? 'Pendiente' : payment.estado === 'procesando' ? 'Procesando' : payment.estado === 'rechazado' ? 'Rechazado' : 'Cancelado'}
                    </span>
                    {payment.metodo_pago && (
                      <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getMethodColor(payment.metodo_pago)}`}>
                        {getMethodIcon(payment.metodo_pago)}
                        {payment.metodo_pago}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <DollarSign className="w-4 h-4" />
                      <div>
                        <p className="text-xs text-gray-500">Monto</p>
                        <p className="text-xl font-bold text-green-600">{formatCurrency(payment.monto)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <User className="w-4 h-4" />
                      <div>
                        <p className="text-xs text-gray-500">Cliente</p>
                        <p className="font-medium">{payment.cliente_nombre || 'No especificado'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <Calendar className="w-4 h-4" />
                      <div>
                        <p className="text-xs text-gray-500">Fecha</p>
                        <p className="font-medium">{formatDate(payment.fecha)}</p>
                      </div>
                    </div>
                  </div>
                  
                  {payment.referencia && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <Building className="w-4 h-4" />
                        <div>
                          <p className="text-xs text-gray-500">Referencia</p>
                          <p className="text-sm font-mono bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">
                            {payment.referencia}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>Registrado el {formatDate(payment.fecha_registro)}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row xl:flex-col gap-3 xl:w-48">
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => {
                      setSelectedPayment(payment);
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
                    onClick={() => {
                      setSelectedPayment(payment);
                      setShowEditModal(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </Button>
                  
                  {payment.estado === 'pendiente' && (
                    <Button 
                      variant="success" 
                      size="sm" 
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => handleUpdateStatus(payment.id, 'aplicado')}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Marcar Aplicado
                    </Button>
                  )}
                  {payment.estado === 'procesando' && (
                    <Button 
                      variant="success" 
                      size="sm" 
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => handleUpdateStatus(payment.id, 'aplicado')}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Confirmar Pago
                    </Button>
                  )}
                  
                  <Button 
                    variant="danger" 
                    size="sm" 
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => handleDelete(payment.id)}
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
        {filteredPayments.length === 0 && (
          <Card variant="gradient" className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <DollarSign className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No hay pagos
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === 'all' ? 'No se han registrado pagos aún' : `No hay pagos con estado "${filter}"`}
            </p>
          </Card>
        )}

        {/* Payment Details Modal */}
        {showModal && selectedPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    Detalles del Pago
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
                    <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedPayment.estado || 'pendiente')}`}>
                      {getStatusIcon(selectedPayment.estado || 'pendiente')}
                      {selectedPayment.estado === 'aplicado' ? 'Aplicado' : selectedPayment.estado === 'pendiente' ? 'Pendiente' : selectedPayment.estado === 'procesando' ? 'Procesando' : selectedPayment.estado === 'rechazado' ? 'Rechazado' : 'Cancelado'}
                    </span>
                    {selectedPayment.metodo_pago && (
                      <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getMethodColor(selectedPayment.metodo_pago)}`}>
                        {getMethodIcon(selectedPayment.metodo_pago)}
                        {selectedPayment.metodo_pago}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Concepto
                      </label>
                      <p className="text-gray-900 dark:text-gray-100">{selectedPayment.concepto || 'No especificado'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Monto
                      </label>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedPayment.monto)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Cliente
                      </label>
                      <p className="text-gray-900 dark:text-gray-100">{selectedPayment.cliente_nombre || 'No especificado'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Fecha
                      </label>
                      <p className="text-gray-900 dark:text-gray-100">{formatDate(selectedPayment.fecha)}</p>
                    </div>
                    {selectedPayment.referencia && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Referencia
                        </label>
                        <p className="text-gray-900 dark:text-gray-100 font-mono bg-gray-100 dark:bg-slate-700 px-3 py-2 rounded">
                          {selectedPayment.referencia}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Fecha de Registro
                      </label>
                      <p className="text-gray-900 dark:text-gray-100">{formatDate(selectedPayment.fecha_registro)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Última Actualización
                      </label>
                      <p className="text-gray-900 dark:text-gray-100">{formatDate(selectedPayment.fecha_actualizacion)}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    {selectedPayment.estado === 'pendiente' && (
                      <Button 
                        variant="success" 
                        className="flex items-center gap-2"
                        onClick={() => {
                          handleUpdateStatus(selectedPayment.id, 'aplicado');
                          setShowModal(false);
                        }}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Marcar como Aplicado
                      </Button>
                    )}
                    {selectedPayment.estado === 'procesando' && (
                      <Button 
                        variant="success" 
                        className="flex items-center gap-2"
                        onClick={() => {
                          handleUpdateStatus(selectedPayment.id, 'aplicado');
                          setShowModal(false);
                        }}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Confirmar Pago
                      </Button>
                    )}
                    <Button 
                      variant="secondary" 
                      className="flex items-center gap-2"
                      onClick={() => {
                        setShowModal(false);
                        setShowEditModal(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                      Editar Pago
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

        {/* Create Payment Modal */}
        <PaymentCreateModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreatePayment}
          usuarios={usuarios}
          pedidos={pedidos}
          user={user}
        />

        {/* Edit Payment Modal */}
        <PaymentEditModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPayment(null);
          }}
          onSave={handleEditPayment}
          payment={selectedPayment}
          usuarios={usuarios}
          pedidos={pedidos}
        />
      </div>
    </div>
  );
};

FinancePaymentsPage.propTypes = {
  showNavigation: PropTypes.bool
};

export default FinancePaymentsPage;