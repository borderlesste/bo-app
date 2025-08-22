import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { 
  CreditCard, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  DollarSign,
  Calendar,
  FileText,
  Plus,
  Eye,
  Download,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import LoadingSpinner from '../../components/LoadingSpinner';
import PaymentGatewayModal from '../../components/payments/PaymentGatewayModal';

const ClientPayments = () => {
  const [orders, setorders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedorder, setSelectedorder] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeTab, setActiveTab] = useState('unpaid');
  const [showFinancialDetails, setShowFinancialDetails] = useState({});
  const [showDateDetails, setShowDateDetails] = useState({});
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [selectedItemForDetails, setSelectedItemForDetails] = useState(null);
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();

  const fetchordersAndPayments = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch orders using the useClientData context
      const ordersResponse = await fetch('/api/client/dashboard/projects', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        console.log('orders data received:', ordersData); // Debug log
        
        // Process orders data to ensure consistent structure
        const processedorders = (ordersData || []).map(order => ({
          ...order,
          estado: order.status || order.estado || 'nuevo', // Priorizar status ya que viene del backend
          id: order.id,
          numero_order: order.numero_order,
          value: parseFloat(order.presupuesto_estimado) || parseFloat(order.value) || parseFloat(order.total) || 0,
          descripcion: order.descripcion || order.description || order.name || '',
          servicio: order.servicio || '',
          fecha_entrega_deseada: order.fecha_entrega_deseada,
          fecha_entrega_estimada: order.fecha_entrega_estimada,
          created_at: order.created_at
        }));
        
        console.log('Processed orders:', processedorders); // Debug log
        setorders(processedorders);
      } else {
        console.error('Error fetching orders:', ordersResponse.status);
        setorders([]);
      }

      // Fetch payments using correct endpoint
      const paymentsResponse = await fetch('/api/client/dashboard/payments', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        setPayments(paymentsData || []);
      } else {
        console.error('Error fetching payments:', paymentsResponse.status);
        // Don't show error for payments as it might be empty
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      showError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchordersAndPayments();
  }, [fetchordersAndPayments]);

  const handlePayment = async (paymentData) => {
    try {
      const response = await fetch('/api/client-payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showSuccess('Pago procesado exitosamente');
        
        if (result.order_updated) {
          showSuccess('Su order ha sido completado automáticamente');
        }
        
        setShowPaymentModal(false);
        setSelectedorder(null);
        await fetchordersAndPayments();
      } else {
        showError(result.message || 'Error al procesar el pago');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      showError('Error al procesar el pago');
    }
  };

  // Filter payments by status
  const pendingPayments = payments.filter(payment => 
    payment.estado === 'pendiente' || payment.estado === 'procesando'
  );
  
  const completedPayments = payments.filter(payment => 
    payment.estado === 'aplicado'
  );

  // Filter orders that need payment (only confirmed projects without completed payments)
  const pendingorders = orders.filter(order => {
    // Only show projects that are confirmed by admin and need payment
    const isConfirmedByAdmin = order.estado === 'confirmado' || order.estado === 'en_proceso';
    const needsPayment = order.estado !== 'completado' && (order.value > 0);
    // Check if there's already a completed payment for this order
    const hasCompletedPayment = payments.some(payment => 
      payment.order_id === order.id && payment.estado === 'aplicado'
    );
    return isConfirmedByAdmin && needsPayment && !hasCompletedPayment;
  });

  // Filter orders waiting for admin approval (nuevo status)
  const ordersWaitingApproval = orders.filter(order => {
    const isWaitingApproval = order.estado === 'nuevo';
    const hasValue = order.value > 0;
    const hasCompletedPayment = payments.some(payment => 
      payment.order_id === order.id && payment.estado === 'aplicado'
    );
    return isWaitingApproval && hasValue && !hasCompletedPayment;
  });

  const completedorders = orders.filter(order => order.estado === 'completado');

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completado':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'en_proceso':
      case 'confirmado':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'cancelado':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'nuevo': 'Nuevo - Esperando Aprobación',
      'confirmado': 'Confirmado - Listo para Pago',
      'en_proceso': 'En Proceso',
      'completado': 'Completado',
      'cancelado': 'Cancelado',
      'en_pausa': 'En Pausa'
    };
    return statusMap[status] || status;
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'aplicado':
        return 'bg-green-100 text-green-800';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'procesando':
        return 'bg-blue-100 text-blue-800';
      case 'rechazado':
        return 'bg-red-100 text-red-800';
      case 'cancelado':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Usar el completedorders para mostrar estadísticas
  const completedordersStats = completedorders.reduce((acc, order) => {
    acc.count++;
    acc.totalValue += order.value || 0;
    return acc;
  }, { count: 0, totalValue: 0 });

  // Función para mostrar/ocultar detalles financieros  
  const toggleFinancialDetails = (itemId) => {
    setShowFinancialDetails(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // Función para mostrar/ocultar detalles de fechas
  const toggleDateDetails = (itemId) => {
    setShowDateDetails(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // Función para ver detalles completos de un item
  const viewItemDetails = (item) => {
    setSelectedItemForDetails(item);
  };

  // Función para descargar comprobante/reporte
  const downloadItemInfo = (item, type = 'pdf') => {
    const data = {
      usuario: user?.name || 'Usuario',
      item_id: item.id,
      numero_order: item.numero_order || 'N/A',
      descripcion: item.descripcion || 'N/A',
      valor: item.value || 0,
      estado: item.estado,
      fecha_creacion: item.created_at,
      fecha_generacion: new Date().toISOString()
    };

    const filename = `${type === 'pdf' ? 'comprobante' : 'reporte'}_${item.numero_order || item.id}_${new Date().toISOString().split('T')[0]}`;
    
    if (type === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Para PDF/CSV, aquí se podría integrar con una API real
      showSuccess(`Descargando ${type.toUpperCase()} para ${item.numero_order || item.id}`);
    }
  };

  // Función para abrir enlace externo de pago
  const openExternalPaymentLink = (order) => {
    if (order.paypal_link) {
      window.open(order.paypal_link, '_blank', 'noopener,noreferrer');
    } else {
      // Crear enlace de PayPal simulado
      const paypalUrl = `https://www.paypal.com/checkout?amount=${order.value}&item=${order.numero_order}`;
      window.open(paypalUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Función para mostrar modal de agregar pago manual
  const showAddPaymentModalHandler = () => {
    setShowAddPaymentModal(true);
  };

  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mis Pagos</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gestiona los pagos de tus proyectos
            </p>
          </div>
          
          {/* Botón Agregar Pago Manual */}
          <button
            onClick={showAddPaymentModalHandler}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Registrar Pago Manual
          </button>
        </div>
        
        {/* Estadísticas mejoradas con completedordersStats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-600">Listos para Pago</p>
                <p className="text-2xl font-bold text-red-900">{pendingorders.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-orange-600">Esperando Aprobación</p>
                <p className="text-2xl font-bold text-orange-900">{ordersWaitingApproval.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-600">Pagos Pendientes</p>
                <p className="text-2xl font-bold text-yellow-900">{pendingPayments.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">Pagos Completados</p>
                <p className="text-2xl font-bold text-green-900">{completedPayments.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">Total Completados</p>
                <p className="text-xl font-bold text-blue-900">{formatCurrency(completedordersStats.totalValue)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('unpaid')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'unpaid'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <CreditCard className="h-4 w-4 mr-2" />
                Listos para Pagar ({pendingorders.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('waiting')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'waiting'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Esperando Aprobación ({ordersWaitingApproval.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'pending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Pagos Pendientes ({pendingPayments.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Historial de Pagos ({completedPayments.length})
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'unpaid' && (
            <div className="space-y-4">
              {pendingorders.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="mx-auto h-12 w-12 text-green-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    ¡No hay proyectos listos para pagar!
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Los proyectos aparecerán aquí una vez que sean confirmados por el administrador.
                  </p>
                </div>
              ) : (
                pendingorders.map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(order.estado)}
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            Proyecto #{order.numero_order || order.id}
                          </h3>
                          <p className="text-sm text-gray-500">{order.descripcion}</p>
                          <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                            <span>Estado: {getStatusText(order.estado)}</span>
                            <span>Servicio: {order.servicio}</span>
                            {order.fecha_entrega_deseada && (
                              <span>Entrega: {new Date(order.fecha_entrega_deseada).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {/* Detalles Financieros */}
                        <div className="text-right">
                          <button
                            onClick={() => toggleFinancialDetails(order.id)}
                            className="flex items-center text-blue-600 hover:text-blue-800 mb-2"
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            <span className="text-2xl font-bold">${parseFloat(order.value || 0).toFixed(2)}</span>
                          </button>
                          {showFinancialDetails[order.id] && (
                            <div className="text-xs text-gray-500 space-y-1">
                              <p>Presupuesto: {formatCurrency(order.presupuesto_estimado || 0)}</p>
                              <p>Total: {formatCurrency(order.total || 0)}</p>
                              <p>Tipo: {order.tipo_presupuesto || 'Por definir'}</p>
                            </div>
                          )}
                          <p className="text-sm text-gray-500">
                            {order.tipo_presupuesto === 'estimado' ? 'Presupuesto Estimado' : 'Total a Pagar'}
                          </p>
                        </div>

                        {/* Botones de Acción */}
                        <div className="flex flex-col space-y-2">
                          <div className="flex space-x-2">
                            {/* Ver Detalles */}
                            <button
                              onClick={() => viewItemDetails(order)}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Ver detalles completos"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            
                            {/* Descargar Comprobante */}
                            <button
                              onClick={() => downloadItemInfo(order, 'pdf')}
                              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Descargar comprobante"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            
                            {/* Enlace Externo PayPal */}
                            <button
                              onClick={() => openExternalPaymentLink(order)}
                              className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Pagar con PayPal"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </button>
                            
                            {/* Ver Fechas */}
                            <button
                              onClick={() => toggleDateDetails(order.id)}
                              className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Ver fechas importantes"
                            >
                              <Calendar className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Detalles de Fechas */}
                          {showDateDetails[order.id] && (
                            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded text-left">
                              <p>Creado: {formatDate(order.created_at)}</p>
                              <p>Entrega deseada: {formatDate(order.fecha_entrega_deseada)}</p>
                              <p>Entrega estimada: {formatDate(order.fecha_entrega_estimada)}</p>
                            </div>
                          )}

                          {/* Botón Principal de Pago */}
                          <button
                            onClick={() => {
                              setSelectedorder(order);
                              setShowPaymentModal(true);
                            }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                          >
                            <CreditCard className="h-4 w-4" />
                            <span>Pagar Ahora</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'waiting' && (
            <div className="space-y-4">
              {ordersWaitingApproval.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    ¡Todos tus proyectos han sido revisados!
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No tienes proyectos esperando aprobación del administrador.
                  </p>
                </div>
              ) : (
                ordersWaitingApproval.map((order) => (
                  <div key={order.id} className="border border-orange-200 rounded-lg p-6 bg-orange-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="bg-orange-100 p-2 rounded-lg">
                          <Clock className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            Proyecto #{order.numero_order || order.id}
                          </h3>
                          <p className="text-sm text-gray-600">{order.descripcion}</p>
                          <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                            <span>Estado: {getStatusText(order.estado)}</span>
                            <span>Servicio: {order.servicio}</span>
                            {order.fecha_entrega_deseada && (
                              <span>Entrega: {new Date(order.fecha_entrega_deseada).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-orange-600">
                            ${parseFloat(order.value || 0).toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Esperando Aprobación
                          </p>
                        </div>
                        <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-lg text-sm font-medium">
                          <Clock className="h-4 w-4 inline mr-2" />
                          Pendiente de Revisión
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'pending' && (
            <div className="space-y-4">
              {pendingPayments.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="mx-auto h-12 w-12 text-yellow-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No hay pagos pendientes
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Todos tus pagos han sido procesados.
                  </p>
                </div>
              ) : (
                pendingPayments.map((payment) => (
                  <div key={payment.id} className="border border-yellow-200 rounded-lg p-6 bg-yellow-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="bg-yellow-100 p-2 rounded-lg">
                          <Clock className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            Pago #{payment.numero_pago}
                          </h3>
                          <p className="text-sm text-gray-600">{payment.concepto}</p>
                          <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                            <span>Método: {payment.metodo_pago}</span>
                            <span>Enviado: {new Date(payment.created_at).toLocaleDateString()}</span>
                            {payment.referencia && (
                              <span>Ref: {payment.referencia}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(payment.estado)}`}>
                          {payment.estado === 'pendiente' ? 'Pendiente' : 'Procesando'}
                        </span>
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900">
                            ${parseFloat(payment.monto || 0).toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500">{payment.tipo}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              {completedPayments.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No hay historial de pagos
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Cuando realices pagos, aparecerán aquí.
                  </p>
                </div>
              ) : (
                completedPayments.map((payment) => (
                  <div key={payment.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <CreditCard className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            Pago #{payment.numero_pago}
                          </h3>
                          <p className="text-sm text-gray-500">{payment.concepto}</p>
                          <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                            <span>Método: {payment.metodo_pago}</span>
                            <span>Fecha: {new Date(payment.fecha_pago).toLocaleDateString()}</span>
                            {payment.referencia && (
                              <span>Ref: {payment.referencia}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(payment.estado)}`}>
                          {payment.estado}
                        </span>
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900">
                            ${parseFloat(payment.monto || 0).toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500">{payment.tipo}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedorder && (
        <PaymentGatewayModal 
          order={selectedorder}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedorder(null);
          }}
          onPayment={handlePayment}
        />
      )}

      {/* Modal de Detalles del Item */}
      {selectedItemForDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Detalles del Proyecto #{selectedItemForDetails.numero_order || selectedItemForDetails.id}
                </h2>
                <button
                  onClick={() => setSelectedItemForDetails(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Información General</h3>
                  <div className="mt-2 space-y-2 text-sm">
                    <p><strong>Descripción:</strong> {selectedItemForDetails.descripcion || 'N/A'}</p>
                    <p><strong>Servicio:</strong> {selectedItemForDetails.servicio || 'N/A'}</p>
                    <p><strong>Estado:</strong> {getStatusText(selectedItemForDetails.estado)}</p>
                    <p><strong>Usuario:</strong> {user?.name || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900">Información Financiera</h3>
                  <div className="mt-2 space-y-2 text-sm">
                    <p><strong>Valor Total:</strong> {formatCurrency(selectedItemForDetails.value)}</p>
                    <p><strong>Presupuesto Estimado:</strong> {formatCurrency(selectedItemForDetails.presupuesto_estimado)}</p>
                    <p><strong>Total Final:</strong> {formatCurrency(selectedItemForDetails.total)}</p>
                    <p><strong>Tipo de Presupuesto:</strong> {selectedItemForDetails.tipo_presupuesto || 'Por definir'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900">Fechas Importantes</h3>
                  <div className="mt-2 space-y-2 text-sm">
                    <p><strong>Fecha de Creación:</strong> {formatDate(selectedItemForDetails.created_at)}</p>
                    <p><strong>Entrega Deseada:</strong> {formatDate(selectedItemForDetails.fecha_entrega_deseada)}</p>
                    <p><strong>Entrega Estimada:</strong> {formatDate(selectedItemForDetails.fecha_entrega_estimada)}</p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => downloadItemInfo(selectedItemForDetails, 'json')}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar JSON
                  </button>
                  <button
                    onClick={() => setSelectedItemForDetails(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Agregar Pago Manual */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Registrar Pago Manual</h2>
                <button
                  onClick={() => setShowAddPaymentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción del Pago
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Pago por transferencia bancaria"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monto
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha del Pago
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Método de Pago
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Seleccionar método</option>
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="tarjeta">Tarjeta de Crédito/Débito</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="paypal">PayPal</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowAddPaymentModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Registrar Pago
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// PropTypes para validación - útil si se convierte en componente reutilizable
ClientPayments.propTypes = {
  // Props opcionales para configuración futura
  initialTab: PropTypes.string,
  showHeader: PropTypes.bool,
  onPaymentComplete: PropTypes.func
};

export default ClientPayments;