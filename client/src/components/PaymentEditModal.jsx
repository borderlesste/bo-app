import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, CheckCircle, User, DollarSign, Calendar, FileText, CreditCard, Building } from 'lucide-react';

const PaymentEditModal = ({ isOpen, onClose, onSave, payment, clients, orders }) => {
  const [formData, setFormData] = useState({
    concepto: '',
    monto: '',
    usuario_id: '',
    metodo_pago: 'tarjeta',
    fecha: '',
    referencia: '',
    estado: 'pendiente',
    order_id: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (payment) {
      setFormData({
        concepto: payment.concepto || '',
        monto: payment.monto || '',
        usuario_id: payment.usuario_id || '',
        metodo_pago: payment.metodo_pago || 'tarjeta',
        fecha: payment.fecha ? payment.fecha.split('T')[0] : '',
        referencia: payment.referencia || '',
        estado: payment.estado || 'pendiente',
        order_id: payment.order_id || ''
      });
    }
  }, [payment]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      if (!formData.concepto.trim()) {
        throw new Error('El concepto es obligatorio');
      }
      if (!formData.monto || parseFloat(formData.monto) <= 0) {
        throw new Error('El monto debe ser mayor a 0');
      }
      if (!formData.usuario_id) {
        throw new Error('Debe seleccionar un cliente');
      }
      
      await onSave(payment.id, formData);
      onClose();
    } catch (err) {
      setError(err.message || 'Error al actualizar el pago');
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    { value: 'tarjeta', label: 'Tarjeta de Crédito/Débito', icon: CreditCard },
    { value: 'transferencia', label: 'Transferencia Bancaria', icon: Building },
    { value: 'efectivo', label: 'Efectivo', icon: DollarSign }
  ];

  const statusOptions = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'procesando', label: 'Procesando' },
    { value: 'aplicado', label: 'Aplicado' },
    { value: 'rechazado', label: 'Rechazado' },
    { value: 'cancelado', label: 'Cancelado' }
  ];

  const selectedClient = clients.find(client => client.id === parseInt(formData.usuario_id));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              ✏️ Editar Pago
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              disabled={loading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6">
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Concepto del Pago *
                </label>
                <input
                  type="text"
                  name="concepto"
                  value={formData.concepto}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                  placeholder="Descripción del pago"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-2" />
                  Monto *
                </label>
                <input
                  type="number"
                  name="monto"
                  value={formData.monto}
                  onChange={handleChange}
                  required
                  min="0.01"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Cliente *
                </label>
                <select
                  name="usuario_id"
                  value={formData.usuario_id}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Seleccionar cliente...</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.nombre} ({client.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Fecha
                </label>
                <input
                  type="date"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Método de Pago
                </label>
                <select
                  name="metodo_pago"
                  value={formData.metodo_pago}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                >
                  {paymentMethods.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado
                </label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* order Association */}
            {orders && orders.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Asociar a order (Opcional)
                </label>
                <select
                  name="order_id"
                  value={formData.order_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Sin asociar a order</option>
                  {orders.map(order => (
                    <option key={order.id} value={order.id}>
                      order #{order.id} - {order.titulo || 'Sin título'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Reference */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Referencia/Número de Transacción
              </label>
              <input
                type="text"
                name="referencia"
                value={formData.referencia}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                placeholder="Número de referencia o transacción"
              />
            </div>

            {/* Client Info Display */}
            {selectedClient && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                  Información del Cliente
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Nombre:</p>
                    <p className="font-medium">{selectedClient.nombre}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Email:</p>
                    <p className="font-medium">{selectedClient.email}</p>
                  </div>
                  {selectedClient.empresa && (
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Empresa:</p>
                      <p className="font-medium">{selectedClient.empresa}</p>
                    </div>
                  )}
                  {selectedClient.telefono && (
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Teléfono:</p>
                      <p className="font-medium">{selectedClient.telefono}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

PaymentEditModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  payment: PropTypes.object,
  clients: PropTypes.array,
  orders: PropTypes.array
};

export default PaymentEditModal;