import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, CheckCircle, User, Mail, Calendar, DollarSign, FileText, Filter } from 'lucide-react';

const InvoiceEditModal = ({ isOpen, onClose, onSave, invoice }) => {
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fecha_vencimiento: '',
    moneda: 'MXN',
    estado: 'borrador',
    notas: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showClientInfo, setShowClientInfo] = useState(false);
  const [emailNotification, setEmailNotification] = useState({
    show: false,
    sending: false,
    message: ''
  });

  useEffect(() => {
    if (invoice) {
      setFormData({
        titulo: invoice.titulo || '',
        descripcion: invoice.descripcion || '',
        fecha_vencimiento: invoice.fecha_vencimiento ? invoice.fecha_vencimiento.split('T')[0] : '',
        moneda: invoice.moneda || 'MXN',
        estado: invoice.estado || 'borrador',
        notas: invoice.notas || ''
      });
    }
  }, [invoice]);

  // Toggle client information panel
  const toggleClientInfo = () => {
    setShowClientInfo(!showClientInfo);
  };

  // Send email notification to client
  const sendEmailNotification = async () => {
    if (!invoice.cliente_email) {
      setEmailNotification({
        show: true,
        sending: false,
        message: 'No hay email del cliente configurado'
      });
      return;
    }

    setEmailNotification(prev => ({ ...prev, sending: true }));
    
    try {
      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 1500));
      setEmailNotification({
        show: true,
        sending: false,
        message: `Factura enviada exitosamente a ${invoice.cliente_email}`
      });
      
      // Hide message after 3 seconds
      setTimeout(() => {
        setEmailNotification(prev => ({ ...prev, show: false }));
      }, 3000);
    } catch (error) {
      setEmailNotification({
        show: true,
        sending: false,
        message: 'Error al enviar email de notificación'
      });
    }
  };

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
      if (!formData.titulo.trim()) {
        throw new Error('El título es obligatorio');
      }
      
      await onSave(invoice.id, formData);
      onClose();
    } catch (err) {
      setError(err.message || 'Error al actualizar la factura');
    } finally {
      setLoading(false);
    }
  };

  const currencies = [
    { value: 'MXN', label: 'Peso Mexicano (MXN)' },
    { value: 'USD', label: 'Dólar Americano (USD)' },
    { value: 'EUR', label: 'Euro (EUR)' }
  ];

  const statusOptions = [
    { value: 'borrador', label: 'Borrador' },
    { value: 'enviada', label: 'Enviada' },
    { value: 'pagada', label: 'Pagada' },
    { value: 'parcialmente_pagada', label: 'Parcialmente Pagada' },
    { value: 'vencida', label: 'Vencida' },
    { value: 'cancelada', label: 'Cancelada' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              ✏️ Editar Factura
            </h2>
            <div className="flex items-center gap-2">
              {/* Client Info Button */}
              <button
                type="button"
                onClick={toggleClientInfo}
                className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                title="Información del cliente"
              >
                <User className="w-5 h-5" />
              </button>
              
              {/* Email Notification Button */}
              <button
                type="button"
                onClick={sendEmailNotification}
                disabled={emailNotification.sending}
                className="p-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50"
                title="Enviar por email"
              >
                <Mail className="w-5 h-5" />
              </button>
              
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                disabled={loading}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Client Information Panel */}
          {showClientInfo && invoice && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Información del Cliente
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Cliente:</span>
                  <p className="text-gray-600 dark:text-gray-400">{invoice.cliente_nombre || 'No especificado'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Email:</span>
                  <p className="text-gray-600 dark:text-gray-400">{invoice.cliente_email || 'No especificado'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Empresa:</span>
                  <p className="text-gray-600 dark:text-gray-400">{invoice.cliente_empresa || 'No especificado'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Factura #:</span>
                  <p className="text-gray-600 dark:text-gray-400">{invoice.numero_factura || invoice.id}</p>
                </div>
              </div>
            </div>
          )}

          {/* Email Notification Status */}
          {emailNotification.show && (
            <div className={`border-l-4 p-4 rounded-md mb-6 ${
              emailNotification.message.includes('exitosamente') 
                ? 'bg-green-100 border-green-500 text-green-700' 
                : 'bg-yellow-100 border-yellow-500 text-yellow-700'
            }`}>
              <div className="flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                <p className="font-medium">{emailNotification.message}</p>
              </div>
            </div>
          )}

          {/* Email Sending Status */}
          {emailNotification.sending && (
            <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-md mb-6">
              <div className="flex items-center">
                <Mail className="w-5 h-5 mr-2 animate-pulse" />
                <p className="font-medium">Enviando notificación por email...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6">
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Título de la Factura *
              </label>
              <input
                type="text"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                placeholder="Título de la factura"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descripción
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                placeholder="Descripción de la factura..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Fecha de Vencimiento
                </label>
                <input
                  type="date"
                  name="fecha_vencimiento"
                  value={formData.fecha_vencimiento}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                />
              </div>

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
                  <Filter className="w-4 h-4 inline mr-2" />
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

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notas Adicionales
              </label>
              <textarea
                name="notas"
                value={formData.notas}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                placeholder="Notas internas sobre la factura..."
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

InvoiceEditModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  invoice: PropTypes.object
};

export default InvoiceEditModal;