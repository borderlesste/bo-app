import { useState, useEffect } from "react";
import { 
  Package, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Calendar,
  DollarSign,
  Filter,
  Search,
  Eye,
  Download
} from "lucide-react";
import { createClientPayment, updateClientPayment, getorders, getPayments } from '../api/axios';
import ClientPaymentModal from './ClientPaymentModal';
import logger from '../utils/logger';

function ClientPanel() {
  const [orders, setorders] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("orders");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const handleOpenPaymentModal = (payment) => {
    setSelectedPayment(payment);
    setPaymentModalOpen(true);
  };

  const handleClosePaymentModal = () => {
    setPaymentModalOpen(false);
    setSelectedPayment(null);
  };

  const handlePayForCompletedorder = (order) => {
    const paymentFororder = {
      id: `temp-payment-${order.id}`, // Temporary ID
      order_id: order.id,
      concepto: `Pago por: ${order.descripcion}`,
      monto: order.valor,
      estado: 'pendiente',
      fecha_pago: new Date().toISOString(),
    };
    handleOpenPaymentModal(paymentFororder);
  };

  const handleProcessPayment = async (paymentData) => {
    if (!selectedPayment) return;
    try {
      const payload = {
        ...selectedPayment,
        metodo: paymentData.metodo,
        referencia_transferencia: paymentData.referencia_transferencia,
      };

      let updatedPayment;

      if (String(payload.id).startsWith('temp-')) {
        // New payment for a completed order
        const { data } = await createClientPayment({
          order_id: payload.order_id,
          monto: payload.monto,
          concepto: payload.concepto,
          metodo: payload.metodo,
          referencia_transferencia: payload.referencia_transferencia,
        });
        updatedPayment = data;
        setPagos(prev => [...prev, updatedPayment]);
      } else {
        // Existing pending payment
        const { data } = await updateClientPayment(payload.id, {
          metodo: payload.metodo,
          referencia_transferencia: payload.referencia_transferencia,
        });
        updatedPayment = data;
        setPagos(pagos.map(p => p.id === payload.id ? updatedPayment : p));
      }

      // Refetch orders to update their status
      const ordersRes = await getorders();
      const fetchedorders = ordersRes.data;
      const paymentsRes = await getPayments(); // Refetch payments as well
      const fetchedPayments = paymentsRes.data;

      const ordersWithPayments = fetchedorders.map(order => {
        const associatedPayment = fetchedPayments.find(payment => 
          payment.order_id === order.id && payment.estado.toLowerCase() === 'pendiente'
        );
        return { ...order, pendingPayment: associatedPayment };
      });

      setorders(ordersWithPayments);
      setPagos(fetchedPayments);
      
      handleClosePaymentModal();
    } catch (err) {
      setError('Error al procesar el pago. Por favor, inténtelo de nuevo.');
      logger.setContext('ClientPanel').error('Error in ClientPanel:', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, paymentsRes] = await Promise.all([
          getorders(),
          getPayments(),
        ]);
        
        const fetchedorders = ordersRes.data.data || ordersRes.data || [];
        const fetchedPayments = paymentsRes.data.data || paymentsRes.data || [];

        // Map payments to orders
        const ordersWithPayments = fetchedorders.map(order => {
          const associatedPayment = fetchedPayments.find(payment => 
            payment.order_id === order.id && payment.estado.toLowerCase() === 'pendiente'
          );
          return { ...order, pendingPayment: associatedPayment };
        });

        setorders(ordersWithPayments);
        setPagos(fetchedPayments);
      } catch (err) {
        setError("Error al cargar los datos");
        logger.setContext('ClientPanel').error('Error in ClientPanel:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusIcon = (estado) => {
    switch (estado.toLowerCase()) {
      case "completado":
      case "pagado":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "en_proceso":
        return <Clock className="w-5 h-5 text-blue-500" />;
      case "pendiente":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case "vencido":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (estado) => {
    switch (estado.toLowerCase()) {
      case "completado":
      case "pagado":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "en_proceso":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "pendiente":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "vencido":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getPriorityColor = (prioridad) => {
    switch (prioridad?.toLowerCase()) {
      case "alta":
        return "bg-red-500";
      case "normal":
        return "bg-yellow-500";
      case "baja":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const isorderPaid = (orderId) => {
    return pagos.some(p => p.order_id === orderId && p.estado.toLowerCase() === 'pagado');
  }

  const filteredorders = orders.filter(p => {
    const matchesSearch = p.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "todos" || p.estado.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const filteredPagos = pagos.filter(p => {
    const matchesSearch = p.concepto.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "todos" || p.estado.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Panel del Cliente
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Gestiona tus orders y pagos desde un solo lugar
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total orders</p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{orders.length}</p>
              </div>
              <Package className="w-8 h-8 text-indigo-500" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completados</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {orders.filter(p => p.estado.toLowerCase() === 'completado').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Pagos</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ${pagos.reduce((sum, p) => sum + parseFloat(p.monto || 0), 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">orders Pendientes</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {orders.filter(p => p.estado.toLowerCase() === 'pendiente' || p.estado.toLowerCase() === 'en_proceso').length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex items-center px-4 py-2 rounded-md font-medium transition-all ${
              activeTab === "orders"
                ? "bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow"
                : "text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
            }`}
          >
            <Package className="w-4 h-4 mr-2" />
            orders
          </button>
          <button
            onClick={() => setActiveTab("pagos")}
            className={`flex items-center px-4 py-2 rounded-md font-medium transition-all ${
              activeTab === "pagos"
                ? "bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow"
                : "text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
            }`}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Pagos
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-800 dark:text-white"
            >
              <option value="todos">Todos</option>
              <option value="completado">Completado</option>
              <option value="en_proceso">En progreso</option>
              <option value="pendiente">Pendiente</option>
              <option value="pagado">Pagado</option>
              <option value="vencido">Vencido</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
          {activeTab === "orders" ? (
            <div>
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  orders ({filteredorders.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Descripción
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Prioridad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Fecha de Entrega Estimada
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredorders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {order.descripcion}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {getStatusIcon(order.estado)}
                            <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.estado)}`}>
                              {order.estado}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${getPriorityColor(order.prioridad)}`}></div>
                            <span className="text-sm text-gray-600 dark:text-gray-300">{order.prioridad}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">${order.valor?.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                            <Calendar className="w-4 h-4 mr-1" />
                            {order.fecha_entrega_estimada ? new Date(order.fecha_entrega_estimada).toLocaleDateString() : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300">
                              <Download className="w-4 h-4" />
                            </button>
                            {order.pendingPayment && (
                              <button
                                onClick={() => handleOpenPaymentModal(order.pendingPayment)}
                                className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                              >
                                Pagar
                              </button>
                            )}
                            {order.estado.toLowerCase() === 'completado' && order.valor && !order.pendingPayment && !isorderPaid(order.id) && (
                              <button
                                onClick={() => handlePayForCompletedorder(order)}
                                className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                              >
                                Pagar ahora
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div>
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pagos ({filteredPagos.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Concepto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Monto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredPagos.map((pago) => (
                      <tr key={pago.id} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {pago.concepto}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-gray-900 dark:text-white">
                            ${pago.monto.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {getStatusIcon(pago.estado)}
                            <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(pago.estado)}`}>
                              {pago.estado}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                            <Calendar className="w-4 h-4 mr-1" />
                            {pago.fecha_pago ? new Date(pago.fecha_pago).toLocaleDateString() : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300">
                              <Download className="w-4 h-4" />
                            </button>
                            {pago.estado.toLowerCase() === 'pendiente' && (
                              <button 
                                onClick={() => handleOpenPaymentModal(pago)}
                                className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                              >
                                Pagar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <ClientPaymentModal 
          isOpen={isPaymentModalOpen}
          onClose={handleClosePaymentModal}
          payment={selectedPayment}
          onConfirm={handleProcessPayment}
        />

      </div>
    </div>
  );
}

export default ClientPanel;
