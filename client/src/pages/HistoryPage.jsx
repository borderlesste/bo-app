import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Card, Button, Skeleton } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { getQuotes, getOrders, getPayments } from '../api/axios';
import OrdersNavigation from '../components/OrdersNavigation';
import { 
  Search, 
  Filter, 
  Calendar, 
  FileText, 
  Package, 
  CreditCard,
  CheckCircle, 
  Clock, 
  AlertCircle, 
  XCircle,
  ArrowRight,
  Eye,
  Download,
  TrendingUp,
  Activity,
  History,
  User,
  DollarSign,
  Mail,
  Phone
} from 'lucide-react';

const HistoryPage = ({ showNavigation = true }) => {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState([]);
  const [orders, setorders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [dateRange, setDateRange] = useState('all');

  // Función para formatear moneda
  const formatCurrency = (amount) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Cargar todos los datos desde las APIs
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [quotesRes, ordersRes, paymentsRes] = await Promise.all([
        getQuotes(),
        getOrders(),
        getPayments()
      ]);

      if (quotesRes.data.success) {
        setQuotes(quotesRes.data.data);
      }
      if (ordersRes.data.success) {
        setorders(ordersRes.data.data);
      }
      if (paymentsRes.data.success) {
        setPayments(paymentsRes.data.data);
      }
    } catch (error) {
      console.error('Error loading history data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Combinar todos los elementos en una timeline unificada
  const getAllItems = () => {
    const items = [];

    // Agregar cotizaciones
    quotes.forEach(quote => {
      items.push({
        id: `quote-${quote.id}`,
        type: 'quote',
        title: `Cotización de ${quote.nombre}`,
        subtitle: quote.tipo_servicio,
        description: quote.descripcion,
        status: quote.estado,
        date: quote.createdAt,
        cliente: quote.nombre,
        email: quote.email,
        telefono: quote.telefono,
        valor: null,
        rawData: quote
      });
    });

    // Agregar orders
    orders.forEach(order => {
      items.push({
        id: `order-${order.id}`,
        type: 'order',
        title: `order #${order.id} - ${order.servicio}`,
        subtitle: `Cliente: ${order.cliente_nombre || 'No especificado'}`,
        description: order.descripcion,
        status: order.estado,
        date: order.fecha_creacion,
        cliente: order.cliente_nombre,
        valor: order.valor,
        prioridad: order.prioridad,
        fecha_entrega: order.fecha_entrega_estimada,
        rawData: order
      });
    });

    // Agregar pagos
    payments.forEach(payment => {
      items.push({
        id: `payment-${payment.id}`,
        type: 'payment',
        title: `Pago - ${payment.concepto}`,
        subtitle: `${formatCurrency(payment.monto)}`,
        description: `Método: ${payment.metodo_pago || payment.metodo || 'No especificado'}`,
        status: payment.estado,
        date: payment.fecha_pago,
        cliente: payment.cliente_nombre,
        valor: payment.monto,
        referencia: payment.referencia_transferencia,
        rawData: payment
      });
    });

    return items.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'quote': return <FileText className="w-5 h-5" />;
      case 'order': return <Package className="w-5 h-5" />;
      case 'payment': return <CreditCard className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'quote': return 'bg-blue-500 text-white';
      case 'order': return 'bg-green-500 text-white';
      case 'payment': return 'bg-purple-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = (status, type) => {
    if (type === 'quote') {
      switch (status.toLowerCase()) {
        case 'pendiente': case 'nuevo': return <Clock className="w-4 h-4" />;
        case 'contactado': return <CheckCircle className="w-4 h-4" />;
        case 'convertido a order': return <ArrowRight className="w-4 h-4" />;
        case 'rechazado': return <XCircle className="w-4 h-4" />;
        default: return <AlertCircle className="w-4 h-4" />;
      }
    } else if (type === 'order') {
      switch (status.toLowerCase()) {
        case 'pendiente': case 'nuevo': return <Clock className="w-4 h-4" />;
        case 'en_proceso': return <Activity className="w-4 h-4" />;
        case 'completado': return <CheckCircle className="w-4 h-4" />;
        case 'cancelado': return <XCircle className="w-4 h-4" />;
        default: return <AlertCircle className="w-4 h-4" />;
      }
    } else { // payment
      switch (status.toLowerCase()) {
        case 'pendiente': case 'nuevo': return <Clock className="w-4 h-4" />;
        case 'pagado': return <CheckCircle className="w-4 h-4" />;
        case 'vencido': return <XCircle className="w-4 h-4" />;
        case 'rechazado': return <XCircle className="w-4 h-4" />;
        default: return <AlertCircle className="w-4 h-4" />;
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pendiente': case 'nuevo': return 'bg-yellow-500 text-white';
      case 'contactado': case 'en_proceso': return 'bg-blue-500 text-white';
      case 'completado': case 'pagado': case 'convertido a order': return 'bg-green-500 text-white';
      case 'cancelado': case 'rechazado': case 'vencido': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const filterItemsByDate = (items) => {
    if (dateRange === 'all') return items;
    
    const now = new Date();
    let startDate;
    
    switch (dateRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        return items;
    }
    
    return items.filter(item => new Date(item.date) >= startDate);
  };

  const filteredItems = getAllItems().filter(item => {
    const typeMatch = filter === 'all' || item.type === filter;
    const searchMatch = searchTerm === '' || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return typeMatch && searchMatch;
  });

  const dateFilteredItems = filterItemsByDate(filteredItems);


  const exportHistory = () => {
    const dataStr = JSON.stringify(dateFilteredItems, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `historial_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getStatsForType = (type) => {
    switch (type) {
      case 'quote':
        return {
          total: quotes.length,
          pending: quotes.filter(q => q.estado?.toLowerCase() === 'pendiente' || q.estado?.toLowerCase() === 'nuevo').length,
          completed: quotes.filter(q => q.estado?.toLowerCase() === 'convertido a order').length
        };
      case 'order':
        return {
          total: orders.length,
          pending: orders.filter(o => o.estado?.toLowerCase() === 'pendiente' || o.estado?.toLowerCase() === 'nuevo').length,
          completed: orders.filter(o => o.estado?.toLowerCase() === 'completado').length,
          totalValue: orders.reduce((sum, o) => sum + (parseFloat(o.valor) || 0), 0)
        };
      case 'payment':
        return {
          total: payments.length,
          pending: payments.filter(p => p.estado?.toLowerCase() === 'pendiente' || p.estado?.toLowerCase() === 'nuevo').length,
          completed: payments.filter(p => p.estado?.toLowerCase() === 'pagado').length,
          totalValue: payments.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0)
        };
      default:
        return { total: 0, pending: 0, completed: 0 };
    }
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
                📚 Historial Completo
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
                Visualiza el historial completo de cotizaciones, orders y pagos en una línea de tiempo unificada
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
                onClick={exportHistory}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-blue-600" />
              <TrendingUp className="w-6 h-6 text-blue-600 ml-2" />
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {getStatsForType('quote').total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Cotizaciones</div>
            <div className="text-xs text-gray-500">
              {getStatsForType('quote').pending} pendientes, {getStatsForType('quote').completed} convertidas
            </div>
          </Card>
          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-green-600" />
              <TrendingUp className="w-6 h-6 text-green-600 ml-2" />
            </div>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {getStatsForType('order').total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">orders</div>
            <div className="text-xs text-gray-500">
              {getStatsForType('order').pending} pendientes, {getStatsForType('order').completed} completados
            </div>
          </Card>
          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="flex items-center justify-center mb-4">
              <CreditCard className="w-8 h-8 text-purple-600" />
              <TrendingUp className="w-6 h-6 text-purple-600 ml-2" />
            </div>
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {getStatsForType('payment').total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pagos</div>
            <div className="text-xs text-gray-500">
              {getStatsForType('payment').pending} pendientes, {getStatsForType('payment').completed} completados
            </div>
          </Card>
          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="flex items-center justify-center mb-4">
              <DollarSign className="w-8 h-8 text-gray-700 dark:text-gray-300" />
              <TrendingUp className="w-6 h-6 text-gray-700 dark:text-gray-300 ml-2" />
            </div>
            <div className="text-3xl font-bold text-gray-700 dark:text-gray-300 mb-2">
              {formatCurrency(
                getStatsForType('order').totalValue + getStatsForType('payment').totalValue
              )}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Valor Total</div>
          </Card>
        </div>

        {/* Filters */}
        <Card variant="gradient" className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar en historial..."
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
                Todo ({dateFilteredItems.length})
              </Button>
              <Button
                variant={filter === 'quote' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('quote')}
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Cotizaciones ({quotes.length})
              </Button>
              <Button
                variant={filter === 'order' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('order')}
                className="flex items-center gap-2"
              >
                <Package className="w-4 h-4" />
                orders ({orders.length})
              </Button>
              <Button
                variant={filter === 'payment' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('payment')}
                className="flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Pagos ({payments.length})
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Período:
            </span>
            <Button
              variant={dateRange === 'all' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setDateRange('all')}
            >
              Todo el tiempo
            </Button>
            <Button
              variant={dateRange === 'today' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setDateRange('today')}
            >
              Hoy
            </Button>
            <Button
              variant={dateRange === 'week' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setDateRange('week')}
            >
              Última semana
            </Button>
            <Button
              variant={dateRange === 'month' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setDateRange('month')}
            >
              Último mes
            </Button>
            <Button
              variant={dateRange === 'quarter' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setDateRange('quarter')}
            >
              Último trimestre
            </Button>
          </div>
        </Card>

        {/* Timeline */}
        <div className="space-y-6">
          {dateFilteredItems.map((item, index) => (
            <Card key={item.id} variant="gradient" hover className="group">
              <div className="flex gap-4">
                {/* Timeline indicator */}
                <div className="flex flex-col items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${getTypeColor(item.type)}`}>
                    {getTypeIcon(item.type)}
                  </div>
                  {index < dateFilteredItems.length - 1 && (
                    <div className="w-px h-16 bg-gradient-to-b from-gray-300 to-transparent dark:from-gray-600 mt-4"></div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                      {item.title}
                    </h3>
                    <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {getStatusIcon(item.status, item.type)}
                      {item.status}
                    </span>
                    {item.prioridad && (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.prioridad?.toLowerCase() === 'alta' ? 'bg-red-100 text-red-800' :
                        item.prioridad?.toLowerCase() === 'normal' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        Prioridad {item.prioridad}
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600 dark:text-gray-300 mb-3">{item.subtitle}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {item.cliente && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <User className="w-4 h-4" />
                        <span>{item.cliente}</span>
                      </div>
                    )}
                    {item.valor && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-semibold">{formatCurrency(item.valor)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(item.date)}</span>
                    </div>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-4">
                    {item.description}
                  </p>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedItem(item);
                      setShowModal(true);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Ver detalles
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {dateFilteredItems.length === 0 && (
          <Card variant="gradient" className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <History className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No hay elementos en el historial
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No se encontraron elementos que coincidan con los filtros seleccionados
            </p>
          </Card>
        )}

        {/* Detail Modal */}
        {showModal && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    Detalles del {selectedItem.type === 'quote' ? 'Cotización' : 
                                selectedItem.type === 'order' ? 'order' : 'Pago'}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-3 mb-4">
                    <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(selectedItem.type)}`}>
                      {getTypeIcon(selectedItem.type)}
                      {selectedItem.type === 'quote' ? 'Cotización' : 
                       selectedItem.type === 'order' ? 'order' : 'Pago'}
                    </span>
                    <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedItem.status)}`}>
                      {getStatusIcon(selectedItem.status, selectedItem.type)}
                      {selectedItem.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Título
                      </label>
                      <p className="text-gray-900 dark:text-gray-100">{selectedItem.title}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Fecha
                      </label>
                      <p className="text-gray-900 dark:text-gray-100">{formatDate(selectedItem.date)}</p>
                    </div>
                    {selectedItem.cliente && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Cliente
                        </label>
                        <p className="text-gray-900 dark:text-gray-100">{selectedItem.cliente}</p>
                      </div>
                    )}
                    {selectedItem.valor && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Valor
                        </label>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedItem.valor)}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Descripción
                    </label>
                    <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                      <p className="text-gray-900 dark:text-gray-100 leading-relaxed">{selectedItem.description}</p>
                    </div>
                  </div>

                  {/* Additional fields based on type */}
                  {selectedItem.type === 'quote' && (selectedItem.email || selectedItem.telefono) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedItem.email && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            <Mail className="w-4 h-4 inline mr-2" />
                            Email de contacto
                          </label>
                          <p className="text-gray-900 dark:text-gray-100">{selectedItem.email}</p>
                        </div>
                      )}
                      {selectedItem.telefono && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            <Phone className="w-4 h-4 inline mr-2" />
                            Teléfono de contacto
                          </label>
                          <p className="text-gray-900 dark:text-gray-100">{selectedItem.telefono}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedItem.type === 'payment' && selectedItem.referencia && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Referencia
                      </label>
                      <p className="text-gray-900 dark:text-gray-100">{selectedItem.referencia}</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t">
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
      </div>
    </div>
  );
};

HistoryPage.propTypes = {
  showNavigation: PropTypes.bool
};

export default HistoryPage;