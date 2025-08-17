import PropTypes from 'prop-types';
import { X, User, Mail, Calendar, DollarSign, FileText, Clock, CheckCircle, XCircle, AlertCircle, Send, ArrowRight } from 'lucide-react';

const QuotationDetailModal = ({ isOpen, onClose, quotation }) => {
  if (!isOpen || !quotation) return null;

  const getStatusIcon = (estado) => {
    const icons = {
      borrador: Clock,
      enviada: Send,
      aprobada: CheckCircle,
      rechazada: XCircle,
      expirada: AlertCircle,
      convertida: ArrowRight,
      cancelada: X
    };
    return icons[estado] || Clock;
  };

  const getStatusColor = (estado) => {
    const colors = {
      borrador: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      enviada: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      aprobada: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      rechazada: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      expirada: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      convertida: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      cancelada: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    };
    return colors[estado] || colors.borrador;
  };

  const formatCurrency = (amount, currency = 'MXN') => {
    const symbols = { MXN: '$', USD: '$', EUR: '€' };
    return `${symbols[currency] || '$'}${amount?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No especificada';
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const StatusIcon = getStatusIcon(quotation.estado);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                📋 Detalles de Cotización
              </h2>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(quotation.estado)}`}>
                <StatusIcon className="w-4 h-4 mr-2" />
                {quotation.estado}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-8">
            {/* Basic Information */}
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                Información General
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Número de Cotización
                  </label>
                  <p className="text-gray-900 dark:text-gray-100 font-mono">
                    {quotation.numero_cotizacion}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Título
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {quotation.titulo}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Total
                  </label>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(quotation.total, quotation.moneda)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Items
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {quotation.total_items || 0} elementos
                  </p>
                </div>
              </div>
            </div>

            {/* Client Information */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                <User className="w-5 h-5 inline mr-2" />
                Información del Cliente
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {quotation.cliente_nombre}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {quotation.cliente_email}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Empresa
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {quotation.cliente_empresa || 'No especificada'}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                <FileText className="w-5 h-5 inline mr-2" />
                Descripción del Proyecto
              </h3>
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {quotation.descripcion || 'Sin descripción disponible'}
                </p>
              </div>
            </div>

            {/* Comments */}
            {quotation.comentarios && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                  Comentarios Internos
                </h3>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {quotation.comentarios}
                  </p>
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                <Calendar className="w-5 h-5 inline mr-2" />
                Fechas Importantes
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha de Creación
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {formatDate(quotation.created_at)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Última Actualización
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {formatDate(quotation.updated_at)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha de Expiración
                  </label>
                  <p className={`text-gray-900 dark:text-gray-100 ${
                    quotation.fecha_expiracion && new Date(quotation.fecha_expiracion) < new Date()
                      ? 'text-red-600 dark:text-red-400 font-semibold'
                      : ''
                  }`}>
                    {formatDate(quotation.fecha_expiracion)}
                  </p>
                </div>
              </div>
            </div>

            {/* Items Preview */}
            {quotation.items && quotation.items.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                  Items de la Cotización
                </h3>
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100 dark:bg-slate-600">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Descripción
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Cantidad
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Precio Unit.
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-slate-600">
                        {quotation.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                              {item.descripcion}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                              {item.cantidad}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                              {formatCurrency(item.precio_unitario, quotation.moneda)}
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {formatCurrency(item.cantidad * item.precio_unitario, quotation.moneda)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

QuotationDetailModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  quotation: PropTypes.object
};

export default QuotationDetailModal;