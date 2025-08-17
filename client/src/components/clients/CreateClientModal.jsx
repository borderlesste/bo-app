import { useState } from 'react';
import PropTypes from 'prop-types';
import { X, User, Mail, Phone, Building2, MapPin, FileText } from 'lucide-react';
import { createClient } from '../../api/axios';
import { useToast } from '../ui/use-toast';
import useFormValidation from '../../hooks/useFormValidation';
import { validateClient } from '../../utils/validators';

const CreateClientModal = ({ isOpen, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const initialValues = {
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    empresa: '',
    rfc: ''
  };

  const validationSchema = {
    nombre: [(value) => value?.trim().length >= 2 || 'El nombre debe tener al menos 2 caracteres'],
    email: [(value) => validateClient({ email: value }).isValid || 'Email requerido con formato válido'],
    telefono: [(value) => !value || value.length >= 10 || 'Teléfono debe tener al menos 10 caracteres'],
    empresa: [(value) => !value || value.length <= 255 || 'Empresa no puede exceder 255 caracteres'],
    direccion: [(value) => !value || value.length <= 500 || 'Dirección no puede exceder 500 caracteres'],
    rfc: [(value) => !value || (value.length >= 10 && value.length <= 13) || 'RFC debe tener entre 10 y 13 caracteres']
  };

  const {
    errors,
    handleSubmit,
    resetForm,
    getFieldProps
  } = useFormValidation(initialValues, validationSchema);

  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      const response = await createClient(formData);
      
      if (response.data.success) {
        addToast('Cliente creado exitosamente', 'success');
        resetForm();
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error creating client:', error);
      const errorMessage = error.response?.data?.message || 'Error al crear cliente';
      addToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-slate-800 shadow-xl rounded-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Crear Nuevo Cliente
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre Completo *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    {...getFieldProps('nombre')}
                    type="text"
                    placeholder="Ej: Juan Pérez González"
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white ${
                      errors.nombre 
                        ? 'border-red-300 dark:border-red-600' 
                        : 'border-gray-300 dark:border-slate-600'
                    }`}
                  />
                </div>
                {errors.nombre && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.nombre}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    {...getFieldProps('email')}
                    type="email"
                    placeholder="cliente@empresa.com"
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white ${
                      errors.email 
                        ? 'border-red-300 dark:border-red-600' 
                        : 'border-gray-300 dark:border-slate-600'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                )}
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Teléfono
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    {...getFieldProps('telefono')}
                    type="tel"
                    placeholder="+52 55 1234 5678"
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white ${
                      errors.telefono 
                        ? 'border-red-300 dark:border-red-600' 
                        : 'border-gray-300 dark:border-slate-600'
                    }`}
                  />
                </div>
                {errors.telefono && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.telefono}</p>
                )}
              </div>

              {/* Empresa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Empresa
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    {...getFieldProps('empresa')}
                    type="text"
                    placeholder="Nombre de la empresa"
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white ${
                      errors.empresa 
                        ? 'border-red-300 dark:border-red-600' 
                        : 'border-gray-300 dark:border-slate-600'
                    }`}
                  />
                </div>
                {errors.empresa && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.empresa}</p>
                )}
              </div>

              {/* RFC */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  RFC
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    {...getFieldProps('rfc')}
                    type="text"
                    placeholder="PEGJ850123ABC"
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white ${
                      errors.rfc 
                        ? 'border-red-300 dark:border-red-600' 
                        : 'border-gray-300 dark:border-slate-600'
                    }`}
                  />
                </div>
                {errors.rfc && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.rfc}</p>
                )}
              </div>
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dirección
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                <textarea
                  {...getFieldProps('direccion')}
                  rows={3}
                  placeholder="Dirección completa del cliente"
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white resize-none ${
                    errors.direccion 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-slate-600'
                  }`}
                />
              </div>
              {errors.direccion && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.direccion}</p>
              )}
            </div>

            {/* Información adicional */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-400 mb-2">
                Información importante
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Se creará una cuenta automáticamente con contraseña temporal: <code>cliente123</code></li>
                <li>• El cliente recibirá una notificación de bienvenida</li>
                <li>• El estado inicial será &quot;activo&quot;</li>
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
                {isSubmitting ? 'Creando...' : 'Crear Cliente'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

CreateClientModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired
};

export default CreateClientModal;