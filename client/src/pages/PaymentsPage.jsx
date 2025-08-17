import { useState, useEffect } from 'react';
import { Card, Button, Skeleton } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { getPayments, updateAdminPayment } from '../api/axios';
import { useToast } from '../hooks/useToast';
import PaymentDetailModal from '../components/PaymentDetailModal';

const PaymentsPage = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transfersLoading, setTransfersLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const { success: showSuccess, error: showError } = useToast();

  useEffect(() => {
    const fetchPaymentsData = async () => {
      try {
        setLoading(true);
        const response = await getPayments();
        setPayments(response.data || []);
      } catch (error) {
        console.error('Error fetching payments:', error);
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentsData();
    if (user?.rol === 'admin') {
      fetchPendingTransfers();
    }
  }, [user]);

  const fetchPendingTransfers = async () => {
    try {
      setTransfersLoading(true);
      const response = await fetch('/api/payment-gateway/bank-transfers/pending', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setPendingTransfers(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching pending transfers:', error);
    } finally {
      setTransfersLoading(false);
    }
  };

  const handleTransferVerification = async (paymentId, verified, notes = '') => {
    try {
      const response = await fetch(`/api/payment-gateway/bank-transfer/verify/${paymentId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ verified, notes })
      });

      const result = await response.json();

      if (response.ok) {
        showSuccess(result.message);
        await fetchPendingTransfers(); // Refresh the list
        await fetchPaymentsData(); // Refresh payments list
      } else {
        showError(result.message || 'Error al verificar transferencia');
      }
    } catch (error) {
      console.error('Error verifying transfer:', error);
      showError('Error al verificar transferencia');
    }
  };

  const fetchPaymentsData = async () => {
    try {
      setLoading(true);
      const response = await getPayments();
      setPayments(response.data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'aplicado': return 'bg-green-500';
      case 'pendiente': return 'bg-yellow-500';
      case 'procesando': return 'bg-blue-500';
      case 'rechazado': return 'bg-red-500';
      case 'cancelado': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  const getMethodIcon = (method) => {
    switch (method) {
      case 'paypal':
        return '💳';
      case 'tarjeta':
        return '💳';
      case 'transferencia':
        return '🏦';
      case 'efectivo':
        return '💰';
      case 'cheque':
        return '📄';
      default:
        return '💰';
    }
  };

  const filteredPayments = payments.filter(payment => {
    const statusMatch = filter === 'all' || payment.estado === filter;
    const dateMatch = dateFilter === 'all' || isInDateRange(payment.fecha_pago, dateFilter);
    return statusMatch && dateMatch;
  });

  const isInDateRange = (dateString, range) => {
    const date = new Date(dateString);
    const now = new Date();
    
    switch (range) {
      case 'today':
        return date.toDateString() === now.toDateString();
      case 'week': {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return date >= weekAgo;
      }
      case 'month': {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return date >= monthAgo;
      }
      default:
        return true;
    }
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const getTotalByStatus = (status) => {
    return payments
      .filter(p => p.estado === status)
      .reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0);
  };

  const handleShowPaymentDetails = (payment) => {
    setSelectedPayment(payment);
    setIsDetailModalOpen(true);
  };

  const handleApprovePayment = async (paymentId) => {
    try {
      await updateAdminPayment(paymentId, { estado: 'aplicado' });
      showSuccess('Pago marcado como aplicado');
      await fetchPaymentsData();
    } catch (error) {
      showError('Error al aprobar el pago');
      throw error;
    }
  };

  const handleRejectPayment = async (paymentId, reason) => {
    try {
      await updateAdminPayment(paymentId, { 
        estado: 'rechazado', 
        notas: reason ? `Rechazado: ${reason}` : 'Rechazado' 
      });
      showSuccess('Pago rechazado');
      await fetchPaymentsData();
    } catch (error) {
      showError('Error al rechazar el pago');
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ghost-50 via-white to-ghost-100 dark:from-ghost-800 dark:via-ghost-900 dark:to-ghost-900 p-6">
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
    <div className="min-h-screen bg-gradient-to-br from-ghost-50 via-white to-ghost-100 dark:from-ghost-800 dark:via-ghost-900 dark:to-ghost-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-heading font-bold text-ghost-800 dark:text-ghost-100 mb-4">
            Gestión de Pagos
          </h1>
          <p className="text-lg text-ghost-600 dark:text-ghost-300 max-w-2xl">
            Administra y monitorea todos los pagos y transacciones de tus clientes
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card variant="gradient" className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {formatCurrency(getTotalByStatus('aplicado'))}
            </div>
            <div className="text-sm text-ghost-600 dark:text-ghost-400">Total Aplicado</div>
          </Card>
          <Card variant="gradient" className="text-center">
            <div className="text-3xl font-bold text-yellow-600 mb-2">
              {formatCurrency(getTotalByStatus('pendiente'))}
            </div>
            <div className="text-sm text-ghost-600 dark:text-ghost-400">Pendientes</div>
          </Card>
          <Card variant="gradient" className="text-center">
            <div className="text-3xl font-bold text-red-600 mb-2">
              {formatCurrency(getTotalByStatus('rechazado'))}
            </div>
            <div className="text-sm text-ghost-600 dark:text-ghost-400">Rechazados</div>
          </Card>
          <Card variant="gradient" className="text-center">
            <div className="text-3xl font-bold text-ghost-700 dark:text-ghost-300 mb-2">
              {payments.length}
            </div>
            <div className="text-sm text-ghost-600 dark:text-ghost-400">Total Transacciones</div>
          </Card>
        </div>

        {/* Tabs for Admin */}
        {user?.rol === 'admin' && (
          <div className="mb-8">
            <Card variant="gradient" className="p-0">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'all'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Todos los Pagos
                  </button>
                  <button
                    onClick={() => setActiveTab('transfers')}
                    className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'transfers'
                        ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Transferencias Pendientes ({pendingTransfers.length})
                  </button>
                </nav>
              </div>
            </Card>
          </div>
        )}

        {/* Bank Transfer Verification Section */}
        {user?.rol === 'admin' && activeTab === 'transfers' && (
          <div className="mb-8">
            <Card variant="gradient" className="mb-6">
              <h2 className="text-2xl font-bold text-ghost-800 dark:text-ghost-100 mb-4">
                🏦 Verificación de Transferencias Bancarias
              </h2>
              <p className="text-ghost-600 dark:text-ghost-300 mb-4">
                Revisa y verifica las transferencias bancarias reportadas por los clientes
              </p>
            </Card>

            {transfersLoading ? (
              <div className="grid gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} variant="gradient" className="animate-pulse">
                    <Skeleton height="6" width="1/4" className="mb-4" />
                    <Skeleton height="4" width="full" className="mb-2" />
                    <Skeleton height="4" width="3/4" />
                  </Card>
                ))}
              </div>
            ) : pendingTransfers.length === 0 ? (
              <Card variant="gradient" className="text-center py-12">
                <div className="text-green-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-ghost-700 dark:text-ghost-300 mb-2">
                  ¡Todas las transferencias están verificadas!
                </h3>
                <p className="text-ghost-600 dark:text-ghost-400">
                  No hay transferencias bancarias pendientes de verificación
                </p>
              </Card>
            ) : (
              <div className="grid gap-6">
                {pendingTransfers.map((transfer) => (
                  <Card key={transfer.id} variant="gradient" className="border-l-4 border-yellow-500">
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                          <h3 className="text-xl font-semibold text-ghost-800 dark:text-ghost-100">
                            🏦 Transferencia #{transfer.id}
                          </h3>
                          <span className="px-3 py-1 rounded-full text-xs font-medium text-yellow-800 bg-yellow-100">
                            Pendiente Verificación
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-ghost-600 dark:text-ghost-400">Cliente</p>
                            <p className="text-ghost-800 dark:text-ghost-200 font-medium">{transfer.cliente_nombre}</p>
                            <p className="text-sm text-ghost-500">{transfer.cliente_email}</p>
                          </div>
                          <div>
                            <p className="text-sm text-ghost-600 dark:text-ghost-400">Monto</p>
                            <p className="text-2xl font-bold text-ghost-800 dark:text-ghost-200">
                              ${parseFloat(transfer.monto).toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-ghost-600 dark:text-ghost-400">Fecha de Reporte</p>
                            <p className="text-ghost-800 dark:text-ghost-200">{formatDate(transfer.created_at)}</p>
                          </div>
                          {transfer.proyecto_descripcion && (
                            <div>
                              <p className="text-sm text-ghost-600 dark:text-ghost-400">Proyecto</p>
                              <p className="text-ghost-800 dark:text-ghost-200">{transfer.proyecto_descripcion}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-sm text-ghost-600 dark:text-ghost-400">Banco Origen</p>
                            <p className="text-ghost-800 dark:text-ghost-200 font-mono text-sm bg-ghost-100 dark:bg-ghost-700 px-2 py-1 rounded">
                              {transfer.referencia_transferencia}
                            </p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm text-ghost-600 dark:text-ghost-400 mb-2">Concepto</p>
                          <p className="text-ghost-700 dark:text-ghost-300 leading-relaxed">
                            {transfer.concepto}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 xl:w-48">
                        <Button 
                          variant="success" 
                          size="sm" 
                          className="w-full"
                          onClick={() => handleTransferVerification(transfer.id, true)}
                        >
                          ✅ Verificar y Aplicar
                        </Button>
                        <Button 
                          variant="danger" 
                          size="sm" 
                          className="w-full"
                          onClick={() => {
                            const notes = prompt('Motivo del rechazo (opcional):');
                            handleTransferVerification(transfer.id, false, notes || '');
                          }}
                        >
                          ❌ Rechazar
                        </Button>
                        <Button variant="ghost" size="sm" className="w-full">
                          📄 Ver Detalles
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Filters - Only show when viewing all payments */}
        {activeTab === 'all' && (
          <Card variant="gradient" className="mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex flex-wrap gap-3">
                <Button
                  variant={filter === 'all' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  Todos
                </Button>
              <Button
                variant={filter === 'aplicado' ? 'success' : 'ghost'}
                size="sm"
                onClick={() => setFilter('aplicado')}
              >
                Aplicados
              </Button>
              <Button
                variant={filter === 'pendiente' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('pendiente')}
              >
                Pendientes
              </Button>
              <Button
                variant={filter === 'procesando' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('procesando')}
              >
                Procesando
              </Button>
              <Button
                variant={filter === 'rechazado' ? 'danger' : 'ghost'}
                size="sm"
                onClick={() => setFilter('rechazado')}
              >
                Rechazados
              </Button>
              <Button
                variant={filter === 'cancelado' ? 'warning' : 'ghost'}
                size="sm"
                onClick={() => setFilter('cancelado')}
              >
                Cancelados
              </Button>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant={dateFilter === 'all' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setDateFilter('all')}
              >
                Todas las fechas
              </Button>
              <Button
                variant={dateFilter === 'today' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setDateFilter('today')}
              >
                Hoy
              </Button>
              <Button
                variant={dateFilter === 'week' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setDateFilter('week')}
              >
                Esta semana
              </Button>
              <Button
                variant={dateFilter === 'month' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setDateFilter('month')}
              >
                Este mes
              </Button>
            </div>
          </div>
        </Card>
        )}

        {/* Payments List - Only show when viewing all payments */}
        {activeTab === 'all' && (
          <div className="grid gap-6">
            {filteredPayments.map((payment) => (
              <Card key={payment.id} variant="gradient" hover className="group">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                  <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <h3 className="text-xl font-semibold text-ghost-800 dark:text-ghost-100">
                      Pago #{payment.id} - {payment.cliente_nombre || payment.clienteNombre || 'Cliente desconocido'}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(payment.estado)}`}>
                      {payment.estado}
                    </span>
                    <span className="text-2xl">
                      {getMethodIcon(payment.metodo_pago)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-ghost-600 dark:text-ghost-400">Monto</p>
                      <p className="text-2xl font-bold text-ghost-800 dark:text-ghost-200">
                        {formatCurrency(payment.monto)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-ghost-600 dark:text-ghost-400">Método de Pago</p>
                      <p className="text-ghost-800 dark:text-ghost-200 font-medium">{payment.metodo_pago}</p>
                    </div>
                    <div>
                      <p className="text-sm text-ghost-600 dark:text-ghost-400">Fecha</p>
                      <p className="text-ghost-800 dark:text-ghost-200">{formatDate(payment.fecha_pago || payment.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-ghost-600 dark:text-ghost-400">Cliente</p>
                      <p className="text-ghost-800 dark:text-ghost-200">{payment.cliente_email || payment.clienteEmail || 'Email no disponible'}</p>
                    </div>
                    {payment.pedidoTitulo && (
                      <div>
                        <p className="text-sm text-ghost-600 dark:text-ghost-400">Proyecto</p>
                        <p className="text-ghost-800 dark:text-ghost-200 font-medium">{payment.pedidoTitulo}</p>
                      </div>
                    )}
                    {payment.transaccion_id && (
                      <div>
                        <p className="text-sm text-ghost-600 dark:text-ghost-400">ID Transacción</p>
                        <p className="text-ghost-800 dark:text-ghost-200 font-mono text-sm">{payment.transaccion_id}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-ghost-600 dark:text-ghost-400 mb-2">Concepto</p>
                    <p className="text-ghost-700 dark:text-ghost-300 leading-relaxed">
                      {payment.concepto}
                    </p>
                  </div>

                  {payment.referencia_transferencia && (
                    <div className="mb-4">
                      <p className="text-sm text-ghost-600 dark:text-ghost-400 mb-2">Referencia de Transferencia</p>
                      <p className="text-ghost-700 dark:text-ghost-300 font-mono text-sm bg-ghost-100 dark:bg-ghost-700 px-3 py-2 rounded">
                        {payment.referencia_transferencia}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row xl:flex-col gap-3 xl:w-40">
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleShowPaymentDetails(payment)}
                  >
                    Ver Detalles
                  </Button>
                  {payment.estado === 'procesando' && (
                    <Button variant="success" size="sm" className="w-full">
                      Aplicar
                    </Button>
                  )}
                  {payment.estado === 'pendiente' && (
                    <Button variant="secondary" size="sm" className="w-full">
                      Procesar
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="w-full">
                    Descargar
                  </Button>
                </div>
              </div>
            </Card>
            ))}
            
            {filteredPayments.length === 0 && (
              <Card variant="gradient" className="text-center py-12">
                <div className="text-ghost-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-ghost-700 dark:text-ghost-300 mb-2">
                  No hay pagos
                </h3>
                <p className="text-ghost-600 dark:text-ghost-400">
                  No se encontraron pagos que coincidan con los filtros seleccionados
                </p>
              </Card>
            )}
          </div>
        )}

        {/* Payment Detail Modal */}
        <PaymentDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedPayment(null);
          }}
          payment={selectedPayment}
          onApprove={handleApprovePayment}
          onReject={handleRejectPayment}
        />
      </div>
    </div>
  );
};

export default PaymentsPage;