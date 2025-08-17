import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';
import { 
  Package, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  Send
} from 'lucide-react';

const ClientRequestForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    servicio: '',
    descripcion: '',
    presupuesto_estimado: '',
    fecha_entrega_deseada: '',
    prioridad: 'normal',
    notas_adicionales: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const servicios = [
    { value: 'desarrollo-web', label: 'Desarrollo Web' },
    { value: 'aplicaciones-a-medida', label: 'Aplicaciones a Medida' },
    { value: 'e-commerce', label: 'E-commerce' },
    { value: 'integraciones-y-apis', label: 'Integraciones y APIs' },
    { value: 'soporte-y-mantenimiento', label: 'Soporte y Mantenimiento' },
    { value: 'consultoria', label: 'Consultoría Técnica' },
    { value: 'otro', label: 'Otro (especificar en descripción)' }
  ];

  const prioridades = [
    { value: 'baja', label: 'Baja - No hay prisa' },
    { value: 'normal', label: 'Normal - Tiempo estándar' },
    { value: 'alta', label: 'Alta - Prioritario' },
    { value: 'urgente', label: 'Urgente - Lo antes posible' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validaciones básicas
      if (!formData.servicio || !formData.descripcion) {
        throw new Error('Por favor completa todos los campos requeridos.');
      }

      // Enviar solicitud
      const response = await api.post('/api/orders', formData);

      if (response.data.success) {
        setSubmitted(true);
        // Después de 3 segundos, redirigir al dashboard
        setTimeout(() => {
          navigate('/client/dashboard');
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate('/client/dashboard');
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            ¡Solicitud Enviada!
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Tu solicitud ha sido enviada correctamente. Nuestro equipo la revisará y te contactaremos pronto con una cotización.
          </p>
          <p className="text-xs text-gray-500">
            Redirigiendo al dashboard en unos segundos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleGoBack}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nueva Solicitud de Proyecto</h1>
            <p className="mt-1 text-sm text-gray-600">
              Describe tu proyecto y te enviaremos una cotización personalizada
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error al enviar la solicitud
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Información del Cliente */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Información del Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <p className="mt-1 text-sm text-gray-900">{user?.nombre}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Tipo de Servicio */}
          <div>
            <label htmlFor="servicio" className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Package className="w-4 h-4 mr-2 text-blue-600" />
              Tipo de Servicio <span className="text-red-500">*</span>
            </label>
            <select
              id="servicio"
              name="servicio"
              value={formData.servicio}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Selecciona un servicio</option>
              {servicios.map((servicio) => (
                <option key={servicio.value} value={servicio.value}>
                  {servicio.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Elige el tipo de servicio que mejor se adapte a tu proyecto
            </p>
          </div>

          {/* Descripción del Proyecto */}
          <div>
            <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
              Descripción del Proyecto <span className="text-red-500">*</span>
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows={4}
              required
              placeholder="Describe detalladamente tu proyecto, objetivos, funcionalidades deseadas, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Grid de campos adicionales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Presupuesto Estimado */}
            <div>
              <label htmlFor="presupuesto_estimado" className="block text-sm font-medium text-gray-700 mb-2">
                Presupuesto Estimado (USD)
              </label>
              <input
                type="number"
                id="presupuesto_estimado"
                name="presupuesto_estimado"
                value={formData.presupuesto_estimado}
                onChange={handleChange}
                min="0"
                step="100"
                placeholder="ej. 5000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Opcional. Nos ayuda a preparar una cotización más precisa.
              </p>
            </div>

            {/* Fecha de Entrega Deseada */}
            <div>
              <label htmlFor="fecha_entrega_deseada" className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Entrega Deseada
              </label>
              <input
                type="date"
                id="fecha_entrega_deseada"
                name="fecha_entrega_deseada"
                value={formData.fecha_entrega_deseada}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Prioridad */}
          <div>
            <label htmlFor="prioridad" className="block text-sm font-medium text-gray-700 mb-2">
              Prioridad del Proyecto
            </label>
            <select
              id="prioridad"
              name="prioridad"
              value={formData.prioridad}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {prioridades.map((prioridad) => (
                <option key={prioridad.value} value={prioridad.value}>
                  {prioridad.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notas Adicionales */}
          <div>
            <label htmlFor="notas_adicionales" className="block text-sm font-medium text-gray-700 mb-2">
              Notas Adicionales
            </label>
            <textarea
              id="notas_adicionales"
              name="notas_adicionales"
              value={formData.notas_adicionales}
              onChange={handleChange}
              rows={3}
              placeholder="Cualquier información adicional que consideres relevante..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Información adicional */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FileText className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  ¿Qué sucede después?
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Revisaremos tu solicitud en 24-48 horas</li>
                    <li>Te contactaremos para aclarar detalles si es necesario</li>
                    <li className="flex items-center">
                      <Package className="w-3 h-3 mr-1 text-blue-600" />
                      Recibirás una cotización detallada con el paquete de servicios
                    </li>
                    <li>Podrás aprobar o solicitar modificaciones</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleGoBack}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Solicitud
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientRequestForm;