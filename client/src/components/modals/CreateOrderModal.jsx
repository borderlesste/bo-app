import { useState } from 'react';
import { X, Briefcase, DollarSign, Calendar } from 'lucide-react';
import PropTypes from 'prop-types';
import api from '../../api/axios';
import { useToast } from '../../hooks/useToast';

const CreateOrderModal = ({ isOpen, onClose, onOrderCreated }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    servicio: '',
    descripcion: '',
    presupuesto_estimado: '',
    fecha_entrega_deseada: '',
    urgente: false
  });

  const { success: showSuccess, error: showError } = useToast();

  const servicios = [
    'Desarrollo Web',
    'Aplicación Móvil',
    'E-commerce',
    'Diseño Gráfico',
    'Marketing Digital',
    'Consultoría IT',
    'Mantenimiento',
    'Otro'
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/api/pedidos', formData);
      
      if (response.data.success) {
        showSuccess('Pedido creado exitosamente');
        onOrderCreated();
        onClose();
        setFormData({
          servicio: '',
          descripcion: '',
          presupuesto_estimado: '',
          fecha_entrega_deseada: '',
          urgente: false
        });
      } else {
        showError('Error al crear el pedido');
      }
    } catch (error) {
      console.error('Error creating pedido:', error);
      showError('Error al crear el pedido');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Crear Nuevo Pedido</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Briefcase className="h-4 w-4 inline mr-2" />
              Servicio
            </label>
            <select
              name="servicio"
              value={formData.servicio}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecciona un servicio</option>
              {servicios.map(servicio => (
                <option key={servicio} value={servicio}>{servicio}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción del Proyecto
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              required
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe tu proyecto en detalle..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="h-4 w-4 inline mr-2" />
              Presupuesto Estimado
            </label>
            <input
              type="number"
              name="presupuesto_estimado"
              value={formData.presupuesto_estimado}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-2" />
              Fecha de Entrega Deseada
            </label>
            <input
              type="date"
              name="fecha_entrega_deseada"
              value={formData.fecha_entrega_deseada}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="urgente"
              checked={formData.urgente}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Marcar como urgente
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear Pedido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

CreateOrderModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onOrderCreated: PropTypes.func.isRequired
};

export default CreateOrderModal;
