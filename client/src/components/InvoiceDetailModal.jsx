import PropTypes from 'prop-types';
import { X, User, Mail, Calendar, DollarSign, FileText, Clock, CheckCircle, XCircle, AlertTriangle, Send, CreditCard } from 'lucide-react';

const InvoiceDetailModal = ({ isOpen, onClose, invoice }) => {
  if (!isOpen || !invoice) return null;

  const getStatusIcon = (estado) => {
    const icons = {
      borrador: Clock,
      enviada: Send,
      pagada: CheckCircle,
      parcialmente_pagada: CreditCard,
      vencida: AlertTriangle,
      cancelada: XCircle
    };
    return icons[estado] || Clock;
  };

  const getStatusColor = (estado) => {
    const colors = {
      borrador: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      enviada: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      pagada: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      parcialmente_pagada: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      vencida: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
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

  const isOverdue = (fechaVencimiento, estado) => {
    return new Date(fechaVencimiento) < new Date() && !['pagada', 'cancelada'].includes(estado);
  };

  const StatusIcon = getStatusIcon(invoice.estado_calculado || invoice.estado);
  const overdue = isOverdue(invoice.fecha_vencimiento, invoice.estado);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                📄 Detalles de Factura
              </h2>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.estado_calculado || invoice.estado)}`}>
                <StatusIcon className="w-4 h-4 mr-2" />
                {invoice.estado_calculado || invoice.estado}
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
                    Número de Factura
                  </label>
                  <p className="text-gray-900 dark:text-gray-100 font-mono text-lg">
                    {invoice.numero_factura}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Título
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {invoice.titulo}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Total
                  </label>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(invoice.total, invoice.moneda)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Estado de Pago
                  </label>
                  <div className="space-y-2">
                    {invoice.total_pagado > 0 && (
                      <p className="text-green-600 dark:text-green-400">
                        Pagado: {formatCurrency(invoice.total_pagado, invoice.moneda)}
                      </p>
                    )}
                    {(invoice.total - invoice.total_pagado) > 0 && (
                      <p className="text-orange-600 dark:text-orange-400">
                        Pendiente: {formatCurrency(invoice.total - invoice.total_pagado, invoice.moneda)}
                      </p>
                    )}
                  </div>
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
                    {invoice.cliente_nombre}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {invoice.cliente_email}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Empresa
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {invoice.cliente_empresa || 'No especificada'}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            {invoice.descripcion && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                  <FileText className="w-5 h-5 inline mr-2" />
                  Descripción
                </h3>
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {invoice.descripcion}
                  </p>
                </div>
              </div>
            )}

            {/* Notes */}
            {invoice.notas && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                  Notas Internas
                </h3>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {invoice.notas}
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
                    Fecha de Emisión
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {formatDate(invoice.fecha_emision)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha de Vencimiento
                  </label>
                  <p className={`text-gray-900 dark:text-gray-100 ${
                    overdue ? 'text-red-600 dark:text-red-400 font-semibold' : ''
                  }`}>
                    {formatDate(invoice.fecha_vencimiento)}
                    {overdue && (
                      <span className="block text-sm text-red-600 dark:text-red-400">
                        {invoice.dias_vencido} días vencida
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Última Actualización
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {formatDate(invoice.updated_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Items Preview */}
            {invoice.items && invoice.items.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                  Items de la Factura
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
                        {invoice.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                              {item.descripcion}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                              {item.cantidad}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                              {formatCurrency(item.precio_unitario, invoice.moneda)}
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {formatCurrency(item.cantidad * item.precio_unitario, invoice.moneda)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Warning for overdue */}
            {overdue && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                      Factura Vencida
                    </h3>
                    <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                      Esta factura está vencida desde hace {invoice.dias_vencido} días. 
                      Considera contactar al cliente para el seguimiento del pago.
                    </p>
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

InvoiceDetailModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  invoice: PropTypes.object
};

export default InvoiceDetailModal;