import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, CheckCircle, User, Mail, Phone, FileText, Building, Calendar, DollarSign } from 'lucide-react';

const QuotationCreateModal = ({ isOpen, onClose, onSave, clients: propClients }) => {
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    usuario_id: '',
    moneda: 'MXN',
    fecha_expiracion: '',
    comentarios: '',
    items: []
  });
  const [clients, setClients] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientInfo, setShowClientInfo] = useState(false);
  const [emailPreview, setEmailPreview] = useState(false);

  useEffect(() => {
    if (propClients) {
      setClients(propClients);
    }
  }, [propClients]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Actualizar cliente seleccionado cuando cambie usuario_id
    if (name === 'usuario_id') {
      const client = clients.find(c => c.id === parseInt(value));
      setSelectedClient(client || null);
    }
  };

  // Función para mostrar/ocultar información del cliente
  const toggleClientInfo = () => {
    setShowClientInfo(!showClientInfo);
  };

  // Función para mostrar/ocultar vista previa del email
  const toggleEmailPreview = () => {
    setEmailPreview(!emailPreview);
  };

  // Función para generar vista previa del contenido del email
  const generateEmailPreview = () => {
    if (!selectedClient || !formData.titulo) return '';
    
    return `Estimado/a ${selectedClient.nombre},

Nos complace enviarle la cotización solicitada:

📋 Cotización: ${formData.titulo}
💰 Moneda: ${formData.moneda}
${formData.fecha_expiracion ? `📅 Válida hasta: ${formData.fecha_expiracion}` : ''}

Descripción:
${formData.descripcion || 'Pendiente de completar'}

${formData.comentarios ? `Comentarios adicionales:
${formData.comentarios}` : ''}

Quedamos a su disposición para cualquier consulta.

Saludos cordiales,
El equipo de cotizaciones`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      if (!formData.titulo.trim()) {
        throw new Error('El título es obligatorio');
      }
      if (!formData.descripcion.trim()) {
        throw new Error('La descripción es obligatoria');
      }
      if (!formData.usuario_id) {
        throw new Error('Debe seleccionar un cliente');
      }
      
      await onSave(formData);
      
      // Reset form
      setFormData({
        titulo: '',
        descripcion: '',
        usuario_id: '',
        moneda: 'MXN',
        fecha_expiracion: '',
        comentarios: '',
        items: []
      });
      
      onClose();
    } catch (err) {
      setError(err.message || 'Error al crear la cotización');
    } finally {
      setLoading(false);
    }
  };

  const currencies = [
    { value: 'MXN', label: 'Peso Mexicano (MXN)' },
    { value: 'USD', label: 'Dólar Americano (USD)' },
    { value: 'EUR', label: 'Euro (EUR)' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              📋 Nueva Cotización
            </h2>
            <div className="flex items-center gap-2">
              {/* Botón para vista previa del email */}
              {selectedClient && selectedClient.email && formData.titulo && (
                <button
                  type="button"
                  onClick={toggleEmailPreview}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                  title="Vista previa del email"
                >
                  <Mail className="w-4 h-4" />
                  Vista Previa
                </button>
              )}
              
              {/* Botón para mostrar información del cliente */}
              {selectedClient && (
                <button
                  type="button"
                  onClick={toggleClientInfo}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                  title="Ver información del cliente"
                >
                  <Building className="w-4 h-4" />
                  Info Cliente
                </button>
              )}
              
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                disabled={loading}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6">
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          )}

          {/* Vista previa del email */}
          {emailPreview && selectedClient && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Vista Previa del Email
                </h3>
                <button
                  onClick={toggleEmailPreview}
                  className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded border p-3 text-sm">
                <p className="font-medium mb-2 text-gray-600 dark:text-gray-400">
                  Para: {selectedClient.email}
                </p>
                <p className="font-medium mb-3 text-gray-800 dark:text-gray-200">
                  Asunto: Cotización - {formData.titulo || 'Nueva cotización'}
                </p>
                <div className="whitespace-pre-line text-gray-700 dark:text-gray-300">
                  {generateEmailPreview()}
                </div>
              </div>
            </div>
          )}

          {/* Información del cliente seleccionado */}
          {showClientInfo && selectedClient && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Información del Cliente
                </h3>
                <button
                  onClick={toggleClientInfo}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">Nombre:</p>
                  <p className="text-gray-800 dark:text-gray-200">{selectedClient.nombre || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    Email:
                  </p>
                  <p className="text-gray-800 dark:text-gray-200">{selectedClient.email || 'No especificado'}</p>
                </div>
                {selectedClient.telefono && (
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 font-medium flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      Teléfono:
                    </p>
                    <p className="text-gray-800 dark:text-gray-200">{selectedClient.telefono}</p>
                  </div>
                )}
                {selectedClient.empresa && (
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 font-medium flex items-center gap-1">
                      <Building className="w-3 h-3" />
                      Empresa:
                    </p>
                    <p className="text-gray-800 dark:text-gray-200">{selectedClient.empresa}</p>
                  </div>
                )}
                {selectedClient.direccion && (
                  <div className="md:col-span-2">
                    <p className="text-gray-600 dark:text-gray-400 font-medium">Dirección:</p>
                    <p className="text-gray-800 dark:text-gray-200">{selectedClient.direccion}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Título de la Cotización *
                </label>
                <input
                  type="text"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                  placeholder="Título de la cotización"
                />
              </div>

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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-2" />
                  Moneda
                </label>
                <select
                  name="moneda"
                  value={formData.moneda}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                >
                  {currencies.map(currency => (
                    <option key={currency.value} value={currency.value}>
                      {currency.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Fecha de Expiración
                </label>
                <input
                  type="date"
                  name="fecha_expiracion"
                  value={formData.fecha_expiracion}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descripción del Proyecto *
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                placeholder="Describe detalladamente los servicios a cotizar..."
              />
            </div>

            {/* Comments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Comentarios Adicionales
              </label>
              <textarea
                name="comentarios"
                value={formData.comentarios}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                placeholder="Comentarios internos sobre la cotización..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                {loading ? 'Creando...' : 'Crear Cotización'}
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

QuotationCreateModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  clients: PropTypes.array
};

export default QuotationCreateModal;