import { useState, useEffect } from 'react';
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
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeTab, setActiveTab] = useState('unpaid');
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();

  useEffect(() => {
    fetchOrdersAndPayments();
  }, []);

  const fetchOrdersAndPayments = async () => {
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
        console.log('Orders data received:', ordersData); // Debug log
        
        // Process orders data to ensure consistent structure
        const processedOrders = (ordersData || []).map(order => ({
          ...order,
          estado: order.status || order.estado || 'nuevo', // Priorizar status ya que viene del backend
          id: order.id,
          numero_pedido: order.numero_pedido,
          value: parseFloat(order.presupuesto_estimado) || parseFloat(order.value) || parseFloat(order.total) || 0,
          descripcion: order.descripcion || order.description || order.name || '',
          servicio: order.servicio || '',
          fecha_entrega_deseada: order.fecha_entrega_deseada,
          fecha_entrega_estimada: order.fecha_entrega_estimada,
          created_at: order.created_at
        }));
        
        console.log('Processed orders:', processedOrders); // Debug log
        setOrders(processedOrders);
      } else {
        console.error('Error fetching orders:', ordersResponse.status);
        setOrders([]);
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
  };

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
          showSuccess('Su pedido ha sido completado automáticamente');
        }
        
        setShowPaymentModal(false);
        setSelectedOrder(null);
        await fetchOrdersAndPayments();
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
  const pendingOrders = orders.filter(order => {
    // Only show projects that are confirmed by admin and need payment
    const isConfirmedByAdmin = order.estado === 'confirmado' || order.estado === 'en_proceso';
    const needsPayment = order.estado !== 'completado' && (order.value > 0);
    // Check if there's already a completed payment for this order
    const hasCompletedPayment = payments.some(payment => 
      payment.pedido_id === order.id && payment.estado === 'aplicado'
    );
    return isConfirmedByAdmin && needsPayment && !hasCompletedPayment;
  });

  // Filter orders waiting for admin approval (nuevo status)
  const ordersWaitingApproval = orders.filter(order => {
    const isWaitingApproval = order.estado === 'nuevo';
    const hasValue = order.value > 0;
    const hasCompletedPayment = payments.some(payment => 
      payment.pedido_id === order.id && payment.estado === 'aplicado'
    );
    return isWaitingApproval && hasValue && !hasCompletedPayment;
  });

  const completedOrders = orders.filter(order => order.estado === 'completado');

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
          <div className="flex items-center space-x-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-600">Listos para Pago</p>
                  <p className="text-2xl font-bold text-red-900">{pendingOrders.length}</p>
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
                Listos para Pagar ({pendingOrders.length})
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
              {pendingOrders.length === 0 ? (
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
                pendingOrders.map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(order.estado)}
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            Proyecto #{order.numero_pedido || order.id}
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
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">
                            ${parseFloat(order.value || 0).toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {order.tipo_presupuesto === 'estimado' ? 'Presupuesto Estimado' : 'Total a Pagar'}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowPaymentModal(true);
                          }}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                        >
                          <CreditCard className="h-4 w-4" />
                          <span>Pagar Ahora</span>
                        </button>
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
                            Proyecto #{order.numero_pedido || order.id}
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
      {showPaymentModal && selectedOrder && (
        <PaymentGatewayModal 
          order={selectedOrder}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedOrder(null);
          }}
          onPayment={handlePayment}
        />
      )}
    </div>
  );
};


export default ClientPayments;