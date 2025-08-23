import { X, Calendar, CreditCard, FileText, Download, ExternalLink } from 'lucide-react';
import PropTypes from 'prop-types';
import { useToast } from '../../hooks/useToast';

const PaymentDetailsModal = ({ isOpen, onClose, payment }) => {
  const { success: showSuccess, error: showError } = useToast();

  const handleDownloadInvoice = async () => {
    try {
      // Aquí iría la lógica para descargar la factura
      showSuccess('Descarga iniciada');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      showError('Error al descargar la factura');
    }
  };

  const handleViewOnPayPal = () => {
    if (payment.paypal_transaction_id) {
      // Abrir PayPal en nueva pestaña
      window.open(`https://www.paypal.com/activity/payment/${payment.paypal_transaction_id}`, '_blank');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen || !payment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Detalles del Pago</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID de Transacción
              </label>
              <p className="text-sm text-gray-900 font-mono bg-gray-100 p-2 rounded">
                {payment.id}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                {payment.status === 'completed' ? 'Completado' : 
                 payment.status === 'pending' ? 'Pendiente' : 
                 payment.status === 'failed' ? 'Fallido' : payment.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <CreditCard className="h-4 w-4 inline mr-1" />
                Monto
              </label>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(payment.amount)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="h-4 w-4 inline mr-1" />
                Fecha
              </label>
              <p className="text-sm text-gray-900">
                {formatDate(payment.created_at)}
              </p>
            </div>
          </div>

          {payment.description && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FileText className="h-4 w-4 inline mr-1" />
                Descripción
              </label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                {payment.description}
              </p>
            </div>
          )}

          {payment.paypal_transaction_id && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID de PayPal
              </label>
              <p className="text-sm text-gray-900 font-mono bg-gray-100 p-2 rounded">
                {payment.paypal_transaction_id}
              </p>
            </div>
          )}

          {payment.pedido_id && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pedido Relacionado
              </label>
              <p className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                #{payment.pedido_id}
              </p>
            </div>
          )}

          <div className="flex space-x-3 pt-4 border-t">
            <button
              onClick={handleDownloadInvoice}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar Factura
            </button>
            
            {payment.paypal_transaction_id && (
              <button
                onClick={handleViewOnPayPal}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors flex items-center justify-center"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver en PayPal
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

PaymentDetailsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  payment: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    status: PropTypes.string,
    estado: PropTypes.string,
    amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    monto: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    created_at: PropTypes.string,
    description: PropTypes.string,
    descripcion: PropTypes.string,
    paypal_transaction_id: PropTypes.string,
    referencia: PropTypes.string,
    pedido_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    order_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    tipo: PropTypes.string
  })
};

PaymentDetailsModal.defaultProps = {
  payment: null
};

export default PaymentDetailsModal;
