import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, Package, DollarSign, User, Calendar, BarChart, CheckSquare } from 'lucide-react';

const orderModal = ({ isOpen, onClose, onSave, order, clients }) => {
  const [formData, setFormData] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    if (order) {
      setFormData({
        usuario_id: order.usuario_id || '',
        descripcion: order.descripcion || '',
        total: order.total || '',
        subtotal: order.subtotal || '',
        descuento: order.descuento || 0,
        iva: order.iva || '',
        anticipo: order.anticipo || 0,
        prioridad: order.prioridad || 'normal',
        estado: order.estado || 'nuevo',
        fecha_entrega_estimada: order.fecha_entrega_estimada ? new Date(order.fecha_entrega_estimada).toISOString().split('T')[0] : '',
        notas_internas: order.notas_internas || '',
      });
    } else {
      setFormData({
        usuario_id: '',
        descripcion: '',
        total: '',
        subtotal: '',
        descuento: 0,
        iva: '',
        anticipo: 0,
        prioridad: 'normal',
        estado: 'nuevo',
        fecha_entrega_estimada: '',
        notas_internas: '',
      });
    }
  }, [order]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Ocurrió un error al guardar el order.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md m-4">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              {order ? 'Editar order' : 'Crear Nuevo order'}
            </h2>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
                <p className="font-bold">Error</p>
                <p>{error}</p>
              </div>
            )}

            <div className="relative">
              <User className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <select name="usuario_id" value={formData.usuario_id} onChange={handleChange} required className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg appearance-none focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white">
                <option value="">Seleccionar Cliente</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.nombre}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Package className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input type="text" name="descripcion" value={formData.descripcion} onChange={handleChange} placeholder="Descripción del order" required className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <DollarSign className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                <input type="number" name="subtotal" value={formData.subtotal} onChange={handleChange} placeholder="Subtotal" required className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white" />
              </div>
              <div className="relative">
                <DollarSign className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                <input type="number" name="descuento" value={formData.descuento} onChange={handleChange} placeholder="Descuento" className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <DollarSign className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                <input type="number" name="iva" value={formData.iva} onChange={handleChange} placeholder="IVA" className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white" />
              </div>
              <div className="relative">
                <DollarSign className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                <input type="number" name="anticipo" value={formData.anticipo} onChange={handleChange} placeholder="Anticipo" className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white" />
              </div>
              <div className="relative">
                <DollarSign className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                <input type="number" name="total" value={formData.total} onChange={handleChange} placeholder="Total" required className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <BarChart className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                <select name="prioridad" value={formData.prioridad} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg appearance-none focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white">
                  <option value="baja">Baja</option>
                  <option value="normal">Normal</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
              <div className="relative">
                <CheckSquare className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                <select name="estado" value={formData.estado} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg appearance-none focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white">
                  <option value="nuevo">Nuevo</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="en_proceso">En Proceso</option>
                  <option value="completado">Completado</option>
                  <option value="cancelado">Cancelado</option>
                  <option value="en_pausa">En Pausa</option>
                </select>
              </div>
            </div>

            <div className="relative">
              <Calendar className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input type="date" name="fecha_entrega_estimada" value={formData.fecha_entrega_estimada} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white" />
            </div>

            <div className="relative">
              <Package className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <textarea name="notas_internas" value={formData.notas_internas} onChange={handleChange} placeholder="Notas internas (opcional)" rows="3" className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white resize-none"></textarea>
            </div>

          </div>

          <div className="p-6 bg-gray-50 dark:bg-slate-900/50 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-slate-600 dark:text-gray-200 dark:hover:bg-slate-500 transition-colors">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors">
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default orderModal;

orderModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  order: PropTypes.object,
  clients: PropTypes.array.isRequired,
};
