import { useState } from 'react';
import PropTypes from 'prop-types';
import { X, MessageSquare, AlertTriangle, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '../ui/use-toast';
import useFormValidation from '../../hooks/useFormValidation';

const MessageClientModal = ({ isOpen, onClose, onSend, client }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const initialValues = {
    tipo: 'info',
    titulo: '',
    mensaje: '',
    prioridad: 'normal'
  };

  const validationSchema = {
    tipo: [(value) => value && value.length > 0 || 'El tipo de mensaje es requerido'],
    titulo: [(value) => value?.trim().length >= 3 || 'El título debe tener al menos 3 caracteres'],
    mensaje: [(value) => value?.trim().length >= 10 || 'El mensaje debe tener al menos 10 caracteres'],
    prioridad: [(value) => ['baja', 'normal', 'alta', 'critica'].includes(value) || 'Prioridad inválida']
  };

  const {
    values,
    errors,
    handleSubmit,
    resetForm,
    getFieldProps
  } = useFormValidation(initialValues, validationSchema);

  const messageTypes = [
    { value: 'info', label: 'Información', icon: Info, color: 'blue' },
    { value: 'aviso', label: 'Aviso', icon: AlertTriangle, color: 'yellow' },
    { value: 'confirmacion', label: 'Confirmación', icon: CheckCircle, color: 'green' },
    { value: 'urgente', label: 'Urgente', icon: AlertCircle, color: 'red' },
    { value: 'actualizacion', label: 'Actualización', icon: Info, color: 'purple' }
  ];

  const priorities = [
    { value: 'baja', label: 'Baja', color: 'gray' },
    { value: 'normal', label: 'Normal', color: 'blue' },
    { value: 'alta', label: 'Alta', color: 'orange' },
    { value: 'critica', label: 'Crítica', color: 'red' }
  ];

  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      await onSend(formData);
      resetForm();
    } catch (error) {
      console.error('Error sending message:', error);
      addToast('Error al enviar mensaje', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeIcon = (type) => {
    const typeObj = messageTypes.find(t => t.value === type);
    if (!typeObj) return Info;
    return typeObj.icon;
  };

  const getTypeColor = (type) => {
    const typeObj = messageTypes.find(t => t.value === type);
    return typeObj?.color || 'blue';
  };

  const getPriorityColor = (priority) => {
    const priorityObj = priorities.find(p => p.value === priority);
    return priorityObj?.color || 'blue';
  };

  if (!isOpen || !client) return null;

  const TypeIcon = getTypeIcon(values.tipo);
  const typeColor = getTypeColor(values.tipo);
  const priorityColor = getPriorityColor(values.prioridad);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-slate-800 shadow-xl rounded-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Enviar Mensaje
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Para: {client.nombre} ({client.email})
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Tipo y Prioridad */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Mensaje *
                </label>
                <select
                  {...getFieldProps('tipo')}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white ${
                    errors.tipo 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-slate-600'
                  }`}
                >
                  {messageTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.tipo && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.tipo}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prioridad *
                </label>
                <select
                  {...getFieldProps('prioridad')}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white ${
                    errors.prioridad 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-slate-600'
                  }`}
                >
                  {priorities.map((priority) => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
                {errors.prioridad && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.prioridad}</p>
                )}
              </div>
            </div>

            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Título del Mensaje *
              </label>
              <div className="relative">
                <TypeIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-${typeColor}-400 w-4 h-4`} />
                <input
                  {...getFieldProps('titulo')}
                  type="text"
                  placeholder="Ej: Actualización importante de tu proyecto"
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white ${
                    errors.titulo 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-slate-600'
                  }`}
                />
              </div>
              {errors.titulo && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.titulo}</p>
              )}
            </div>

            {/* Mensaje */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mensaje *
              </label>
              <textarea
                {...getFieldProps('mensaje')}
                rows={6}
                placeholder="Escribe aquí el contenido del mensaje para el cliente..."
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white resize-none ${
                  errors.mensaje 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-slate-600'
                }`}
              />
              {errors.mensaje && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.mensaje}</p>
              )}
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {values.mensaje.length}/1000 caracteres
              </div>
            </div>

            {/* Preview */}
            {values.titulo && values.mensaje && (
              <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                  Vista previa del mensaje
                </h4>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-600">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <TypeIcon className={`w-5 h-5 text-${typeColor}-500 mr-2`} />
                      <h5 className="font-medium text-gray-900 dark:text-white">
                        {values.titulo}
                      </h5>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-${priorityColor}-100 text-${priorityColor}-800 dark:bg-${priorityColor}-900/30 dark:text-${priorityColor}-400`}>
                      {priorities.find(p => p.value === values.prioridad)?.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {values.mensaje}
                  </p>
                </div>
              </div>
            )}

            {/* Información adicional */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-400 mb-2">
                Información importante
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• El cliente recibirá una notificación inmediatamente</li>
                <li>• El mensaje se guardará en el historial de comunicación</li>
                <li>• Los mensajes urgentes aparecerán destacados para el cliente</li>
              </ul>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-slate-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Enviando...' : 'Enviar Mensaje'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

MessageClientModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSend: PropTypes.func.isRequired,
  client: PropTypes.shape({
    nombre: PropTypes.string,
    email: PropTypes.string
  })
};

export default MessageClientModal;