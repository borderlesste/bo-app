import { useState, useEffect, useCallback } from 'react';
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
// import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import LoadingSpinner from '../../components/LoadingSpinner';
import PaymentGatewayModal from '../../components/payments/PaymentGatewayModal';
import CreatePedidoModal from '../../components/CreatePedidoModal';
import PaymentDetailsModal from '../../components/modals/PaymentDetailsModal';
import api from '../../api/axios';

const ClientPayments = () => {
  const [pedidos, setPedidos] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeTab, setActiveTab] = useState('unpaid');
  const [filterDate, setFilterDate] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  // const { user } = useAuth(); // Disponible para futuras funcionalidades
  const { success: showSuccess, error: showError } = useToast();

  const fetchPedidosAndPayments = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch pedidos using the useClientData context
      const pedidosResponse = await api.get('/api/client/projects');
      
      if (pedidosResponse.data && pedidosResponse.data.success) {
        const pedidosData = pedidosResponse.data.data; // Access the actual array
        console.log('Pedidos data received:', pedidosData); // Debug log
        
        // Process pedidos data to ensure consistent structure
        const processedPedidos = (pedidosData || []).map(pedido => ({
          ...pedido,
          estado: pedido?.status || pedido?.estado || 'nuevo', // Priorizar status ya que viene del backend
          id: pedido.id,
          numero_pedido: pedido?.numero_pedido,
          value: parseFloat(pedido?.presupuesto_estimado) || parseFloat(pedido?.value) || parseFloat(pedido?.total) || 0,
          descripcion: pedido?.descripcion || pedido?.description || pedido?.name || '',
          servicio: pedido?.servicio || '',
          fecha_entrega_deseada: pedido?.fecha_entrega_deseada,
          fecha_entrega_estimada: pedido?.fecha_entrega_estimada,
          created_at: pedido.created_at
        })).filter(pedido => pedido && pedido.id); // Filter out any invalid pedidos
        
        console.log('Processed pedidos:', processedPedidos); // Debug log
        setPedidos(processedPedidos);
      } else {
        console.error('Error fetching pedidos:', pedidosResponse.status);
        setPedidos([]);
      }

      // Fetch payments using correct endpoint
      const paymentsResponse = await api.get('/api/client/dashboard/payments');
      
      if (paymentsResponse.data && paymentsResponse.data.success) {
        setPayments(paymentsResponse.data.data || []);
      } else {
        console.error('Error fetching payments: No data received');
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
    fetchPedidosAndPayments();
  }, [fetchPedidosAndPayments]);

  const handlePayment = async (paymentData) => {
    try {
      const response = await api.post('/api/client-payments', paymentData);

      const result = response.data;

      if (result.success) {
        showSuccess('Pago procesado exitosamente');
        
        if (result.order_updated) {
          showSuccess('Su pedido ha sido completado automáticamente');
        }
        
        setShowPaymentModal(false);
        setSelectedPedido(null);
        await fetchPedidosAndPayments();
      } else {
        showError(result.message || 'Error al procesar el pago');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      showError('Error al procesar el pago');
    }
  };

  // Función para filtrar por fecha
  const handleDateFilter = (event) => {
    setFilterDate(event.target.value);
  };

  // Función para crear nuevo pedido
  const handleCreatePedido = () => {
    setShowCreateModal(true);
  };

  // Función para ver detalles de pago
  const handleViewPaymentDetails = (payment) => {
    setSelectedPayment(payment);
    setShowPaymentDetails(true);
  };

  // Función para descargar reporte de pagos
  const handleDownloadReport = async () => {
    try {
      // TODO: Implement payments report endpoint
      showError('Función de reporte no disponible temporalmente');
      return;
      
      /*
      const response = await api.get('/api/client/dashboard/payments/report', {
        responseType: 'blob',
        params: { date: filterDate }
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte-pagos-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showSuccess('Reporte descargado exitosamente');
      */
    } catch (error) {
      console.error('Error downloading report:', error);
      showError('Error al descargar el reporte');
    }
  };

  // Función para obtener estadísticas de usuario
  const getClientStats = () => {
    const totalAmount = payments
      .filter(p => p.estado === 'aplicado')
      .reduce((sum, p) => sum + parseFloat(p.monto || 0), 0);
    
    const pendingAmount = pedidos
      .filter(o => o.estado !== 'completado' && o.estado !== 'cancelado')
      .reduce((sum, o) => sum + parseFloat(o.value || 0), 0);

    return {
      totalPaid: totalAmount,
      pendingPayments: pendingAmount,
      totalPedidos: pedidos.length,
      completedPedidos: pedidos.filter(o => o.estado === 'completado').length
    };
  };

  // Filter payments by status
  const pendingPayments = payments.filter(payment => 
    payment.estado === 'pendiente' || payment.estado === 'procesando'
  );
  
  const completedPayments = payments.filter(payment => 
    payment.estado === 'aplicado'
  );

  // Filter pedidos that need payment (only confirmed projects without completed payments)
  const pendingPedidos = (pedidos || []).filter(pedido => {
    if (!pedido || !pedido.id) return false; // Validación defensiva
    // Only show projects that are confirmed by admin and need payment
    const isConfirmedByAdmin = pedido.estado === 'confirmado' || pedido.estado === 'en_proceso';
    const needsPayment = pedido.estado !== 'completado' && (pedido.value > 0);
    // Check if there's already a completed payment for this pedido
    const hasCompletedPayment = payments.some(payment => 
      payment.pedido_id === pedido.id && payment.estado === 'aplicado'
    );
    return isConfirmedByAdmin && needsPayment && !hasCompletedPayment;
  });

  // Filter pedidos waiting for admin approval (nuevo status)
    const pedidosWaitingApproval = (pedidos || []).filter(pedido => {
    if (!pedido || !pedido.id) return false; // Validación defensiva
    // Only show projects waiting for admin approval (value is > 0 and there's no completed payment)
    const isWaitingApproval = pedido.estado === 'nuevo' || pedido.estado === 'revision';
    const hasValue = pedido.value > 0;
    const hasCompletedPayment = payments.some(payment => 
      payment.pedido_id === pedido.id && payment.estado === 'aplicado'
    );
    return isWaitingApproval && hasValue && !hasCompletedPayment;
  });

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
      {/* Header with Statistics and Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mis Pagos</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gestiona los pagos de tus proyectos
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Filtro por fecha */}
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={filterDate}
                onChange={handleDateFilter}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Filtrar por fecha"
              />
            </div>
            
            {/* Botón de descarga */}
            <button
              onClick={handleDownloadReport}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Descargar Reporte</span>
            </button>
            
            {/* Botón crear pedido */}
            <button
              onClick={handleCreatePedido}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo Pedido</span>
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">Total Pagado</p>
                <p className="text-2xl font-bold text-blue-900">${getClientStats().totalPaid.toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-600">Listos para Pago</p>
                <p className="text-2xl font-bold text-red-900">{pendingPedidos.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-orange-600">Pendientes</p>
                <p className="text-2xl font-bold text-orange-900">${getClientStats().pendingPayments.toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">Completados</p>
                <p className="text-2xl font-bold text-green-900">{getClientStats().completedPedidos}</p>
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
                Listos para Pagar ({pendingPedidos.length})
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
                Esperando Aprobación ({pedidosWaitingApproval.length})
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
              {pendingPedidos.length === 0 ? (
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
                pendingPedidos.filter(pedido => pedido && pedido.id).map((pedido) => (
                  <div key={pedido.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(pedido.estado)}
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            Proyecto #{pedido?.numero_pedido || pedido?.id || 'N/A'}
                          </h3>
                          <p className="text-sm text-gray-500">{pedido?.descripcion || 'Sin descripción'}</p>
                          <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                            <span>Estado: {getStatusText(pedido?.estado)}</span>
                            <span>Servicio: {pedido?.servicio || 'No especificado'}</span>
                            {pedido?.fecha_entrega_deseada && (
                              <span>Entrega: {new Date(pedido.fecha_entrega_deseada).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">
                            ${parseFloat(pedido?.value || 0).toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {pedido.tipo_presupuesto === 'estimado' ? 'Presupuesto Estimado' : 'Total a Pagar'}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedPedido(pedido);
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
              {pedidosWaitingApproval.length === 0 ? (
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
                pedidosWaitingApproval.filter(pedido => pedido && pedido.id).map((pedido) => (
                  <div key={pedido.id} className="border border-orange-200 rounded-lg p-6 bg-orange-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="bg-orange-100 p-2 rounded-lg">
                          <Clock className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            Proyecto #{pedido?.numero_pedido || pedido?.id || 'N/A'}
                          </h3>
                          <p className="text-sm text-gray-600">{pedido?.descripcion || 'Sin descripción'}</p>
                          <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                            <span>Estado: {getStatusText(pedido?.estado)}</span>
                            <span>Servicio: {pedido?.servicio || 'No especificado'}</span>
                            {pedido?.fecha_entrega_deseada && (
                              <span>Entrega: {new Date(pedido.fecha_entrega_deseada).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-orange-600">
                            ${parseFloat(pedido?.value || 0).toFixed(2)}
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
                        {payment.referencia && (
                          <button
                            onClick={() => window.open(`https://www.paypal.com/activity/payment/${payment.referencia}`, '_blank')}
                            className="bg-gray-100 text-gray-600 p-2 rounded-lg hover:bg-gray-200 transition-colors"
                            title="Ver en PayPal"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </button>
                        )}
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
                        <button
                          onClick={() => handleViewPaymentDetails(payment)}
                          className="bg-blue-100 text-blue-600 p-2 rounded-lg hover:bg-blue-200 transition-colors"
                          title="Ver detalles del pago"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
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
      {showPaymentModal && selectedPedido && (
        <PaymentGatewayModal 
          pedido={selectedPedido}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPedido(null);
          }}
          onPayment={handlePayment}
        />
      )}

      {/* Create Pedido Modal */}
      {showCreateModal && (
        <CreatePedidoModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onPedidoCreated={() => {
            fetchPedidosAndPayments();
            setShowCreateModal(false);
          }}
        />
      )}

      {/* Payment Details Modal */}
      {showPaymentDetails && selectedPayment && (
        <PaymentDetailsModal
          isOpen={showPaymentDetails}
          onClose={() => {
            setShowPaymentDetails(false);
            setSelectedPayment(null);
          }}
          payment={selectedPayment}
        />
      )}
    </div>
  );
};


export default ClientPayments;