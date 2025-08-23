import { useState } from 'react';
import PropTypes from 'prop-types';
import { X, DollarSign, User, Calendar, CreditCard, Hash, Building, FileText, CheckCircle, XCircle, Clock, Loader } from 'lucide-react';

const PaymentDetailModal = ({ isOpen, onClose, payment, onApprove, onReject }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !payment) return null;

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'No especificada') return 'No especificada';
    try {
      return new Date(dateString).toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'aplicado': return 'bg-green-100 text-green-800';
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'procesando': return 'bg-blue-100 text-blue-800';
      case 'rechazado': return 'bg-red-100 text-red-800';
      case 'cancelado': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'aplicado': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pendiente': return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'procesando': return <Loader className="w-5 h-5 text-blue-600" />;
      case 'rechazado': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'cancelado': return <XCircle className="w-5 h-5 text-gray-600" />;
      default: return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getMethodIcon = (method) => {
    switch (method) {
      case 'paypal': return '💳 PayPal';
      case 'tarjeta': return '💳 Tarjeta de Crédito';
      case 'transferencia': return '🏦 Transferencia Bancaria';
      case 'efectivo': return '💰 Efectivo';
      case 'cheque': return '📄 Cheque';
      default: return '💰 Efectivo';
    }
  };

  const handleApprove = async () => {
    if (!onApprove) return;
    setLoading(true);
    setError(null);
    try {
      await onApprove(payment.id);
      onClose();
    } catch (err) {
      setError(err.message || 'Error al aprobar el pago');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!onReject) return;
    const reason = prompt('Motivo del rechazo (opcional):');
    setLoading(true);
    setError(null);
    try {
      await onReject(payment.id, reason || '');
      onClose();
    } catch (err) {
      setError(err.message || 'Error al rechazar el pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-3xl m-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-blue-600" />
              Detalles del Pago
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Pago #{payment.id} - {payment.numero_pago || 'Sin número'}
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          )}

          {/* Status and Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                {getStatusIcon(payment.estado)}
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Estado</span>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(payment.estado)}`}>
                {payment.estado || 'No especificado'}
              </span>
            </div>
            <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Monto</span>
              </div>
              <span className="text-2xl font-bold text-gray-800 dark:text-white">
                {formatCurrency(payment.monto)}
              </span>
              {payment.moneda && payment.moneda !== 'MXN' && (
                <span className="text-sm text-gray-500 ml-2">({payment.moneda})</span>
              )}
            </div>
          </div>

          {/* Payment Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white border-b pb-2">
                Información del Pago
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-gray-600 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Método de Pago</p>
                    <p className="text-gray-800 dark:text-white">{getMethodIcon(payment.metodo_pago)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-gray-600 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Concepto</p>
                    <p className="text-gray-800 dark:text-white">{payment.concepto || 'No especificado'}</p>
                  </div>
                </div>

                {payment.referencia && (
                  <div className="flex items-start gap-3">
                    <Hash className="w-5 h-5 text-gray-600 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Referencia</p>
                      <p className="text-gray-800 dark:text-white font-mono text-sm bg-gray-100 dark:bg-slate-600 px-2 py-1 rounded">
                        {payment.referencia}
                      </p>
                    </div>
                  </div>
                )}

                {payment.banco_origen && (
                  <div className="flex items-start gap-3">
                    <Building className="w-5 h-5 text-gray-600 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Banco Origen</p>
                      <p className="text-gray-800 dark:text-white">{payment.banco_origen}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white border-b pb-2">
                Información de Usuario
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-600 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Usuario</p>
                    <p className="text-gray-800 dark:text-white">{payment.cliente_nombre || payment.usuarioNombre || 'No especificado'}</p>
                    {(payment.cliente_email || payment.usuarioEmail) && (
                      <p className="text-sm text-gray-500">{payment.cliente_email || payment.usuarioEmail}</p>
                    )}
                  </div>
                </div>

                {payment.pedidoTitulo && (
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-gray-600 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Pedido</p>
                      <p className="text-gray-800 dark:text-white">{payment.pedidoTitulo}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dates Information */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Información de Fechas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-600 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Fecha de Pago</p>
                  <p className="text-gray-800 dark:text-white">
                    {formatDate(payment.fecha_pago)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-600 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Fecha de Registro</p>
                  <p className="text-gray-800 dark:text-white">
                    {formatDate(payment.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-600 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Última Actualización</p>
                  <p className="text-gray-800 dark:text-white">
                    {formatDate(payment.updated_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {payment.notas && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                Notas Adicionales
              </h3>
              <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {payment.notas}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-gray-50 dark:bg-slate-900/50 border-t flex justify-between items-center">
          <div className="flex gap-4">
            {payment.estado === 'pendiente' && onApprove && (
              <button 
                onClick={handleApprove}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Marcar como Aplicado
              </button>
            )}
            {payment.estado === 'pendiente' && onReject && (
              <button 
                onClick={handleReject}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Rechazar
              </button>
            )}
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

PaymentDetailModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  payment: PropTypes.object,
  onApprove: PropTypes.func,
  onReject: PropTypes.func,
};

export default PaymentDetailModal;