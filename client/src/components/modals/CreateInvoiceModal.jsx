import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, User, FileText, Calculator, Calendar } from 'lucide-react';
import { createInvoice, getUsers } from '../../api/axios';
import { useToast } from '../ui/use-toast';

const CreateInvoiceModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    usuario_id: '',
    titulo: '',
    descripcion: '',
    moneda: 'MXN',
    dias_credito: 30,
    condiciones_pago: 'Transferencia bancaria',
    metodo_pago: 'transferencia',
    notas: ''
  });

  const [items, setItems] = useState([
    {
      descripcion: '',
      cantidad: 1,
      precio_unitario: 0,
      descuento: 0,
      impuesto_porcentaje: 16
    }
  ]);

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { addToast } = useToast();

  // Cargar lista de clientes
  useEffect(() => {
    if (isOpen) {
      loadClients();
    }
  }, [isOpen]);

  const loadClients = async () => {
    try {
      const response = await getUsers({ rol: 'cliente', limit: 100 });
      if (response.data.success) {
        setClients(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      addToast('Error al cargar clientes', 'error');
    }
  };

  // Resetear formulario al abrir/cerrar
  useEffect(() => {
    if (isOpen) {
      setFormData({
        usuario_id: '',
        titulo: '',
        descripcion: '',
        moneda: 'MXN',
        dias_credito: 30,
        condiciones_pago: 'Transferencia bancaria',
        metodo_pago: 'transferencia',
        notas: ''
      });
      setItems([
        {
          descripcion: '',
          cantidad: 1,
          precio_unitario: 0,
          descuento: 0,
          impuesto_porcentaje: 16
        }
      ]);
      setErrors({});
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === 'descripcion' ? value : parseFloat(value) || 0
    };
    setItems(updatedItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        descripcion: '',
        cantidad: 1,
        precio_unitario: 0,
        descuento: 0,
        impuesto_porcentaje: 16
      }
    ]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateItemTotal = (item) => {
    const subtotal = item.cantidad * item.precio_unitario;
    const descuentoMonto = (subtotal * item.descuento) / 100;
    const subtotalConDescuento = subtotal - descuentoMonto;
    const impuestoMonto = (subtotalConDescuento * item.impuesto_porcentaje) / 100;
    return subtotalConDescuento + impuestoMonto;
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalDescuentos = 0;
    let totalImpuestos = 0;
    let total = 0;

    items.forEach(item => {
      const itemSubtotal = item.cantidad * item.precio_unitario;
      const descuentoMonto = (itemSubtotal * item.descuento) / 100;
      const subtotalConDescuento = itemSubtotal - descuentoMonto;
      const impuestoMonto = (subtotalConDescuento * item.impuesto_porcentaje) / 100;

      subtotal += itemSubtotal;
      totalDescuentos += descuentoMonto;
      totalImpuestos += impuestoMonto;
      total += subtotalConDescuento + impuestoMonto;
    });

    return {
      subtotal,
      totalDescuentos,
      totalImpuestos,
      total
    };
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.usuario_id) {
      newErrors.usuario_id = 'Debe seleccionar un cliente';
    }
    if (!formData.titulo.trim()) {
      newErrors.titulo = 'El título es obligatorio';
    }
    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es obligatoria';
    }

    // Validar items
    items.forEach((item, index) => {
      if (!item.descripcion.trim()) {
        newErrors[`item_${index}_descripcion`] = 'La descripción del item es obligatoria';
      }
      if (item.cantidad <= 0) {
        newErrors[`item_${index}_cantidad`] = 'La cantidad debe ser mayor a 0';
      }
      if (item.precio_unitario <= 0) {
        newErrors[`item_${index}_precio_unitario`] = 'El precio debe ser mayor a 0';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      addToast('Por favor, corrige los errores en el formulario', 'error');
      return;
    }

    setLoading(true);
    try {
      const invoiceData = {
        ...formData,
        items: items.filter(item => item.descripcion.trim()) // Solo items con descripción
      };

      const response = await createInvoice(invoiceData);
      
      if (response.data.success) {
        addToast(`Factura creada exitosamente: ${response.data.data.numero_factura}`, 'success');
        onSuccess && onSuccess(response.data.data);
        onClose();
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      const errorMessage = error.response?.data?.message || 'Error al crear la factura';
      addToast(errorMessage, 'error');
      
      // Mostrar errores específicos si los hay
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center">
            <FileText className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h3 className="text-xl font-bold text-gray-900">Nueva Factura</h3>
              <p className="text-sm text-gray-600">Crea una nueva factura para un cliente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información del Cliente */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-3">
              <User className="w-5 h-5 text-gray-600 mr-2" />
              <h4 className="text-lg font-medium text-gray-900">Información del Cliente</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente *
                </label>
                <select
                  name="usuario_id"
                  value={formData.usuario_id}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.usuario_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={loading}
                >
                  <option value="">Seleccionar cliente</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.nombre} - {client.empresa || client.email}
                    </option>
                  ))}
                </select>
                {errors.usuario_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.usuario_id}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Moneda
                </label>
                <select
                  name="moneda"
                  value={formData.moneda}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  <option value="MXN">MXN - Peso Mexicano</option>
                  <option value="USD">USD - Dólar Americano</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
              </div>
            </div>
          </div>

          {/* Información de la Factura */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título *
              </label>
              <input
                type="text"
                name="titulo"
                value={formData.titulo}
                onChange={handleInputChange}
                placeholder="Ej: Servicios de desarrollo web"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.titulo ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={loading}
              />
              {errors.titulo && (
                <p className="text-red-500 text-sm mt-1">{errors.titulo}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Días de Crédito
              </label>
              <input
                type="number"
                name="dias_credito"
                value={formData.dias_credito}
                onChange={handleInputChange}
                min="1"
                max="365"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción *
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              rows={3}
              placeholder="Descripción detallada de los servicios o productos..."
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.descripcion ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            />
            {errors.descripcion && (
              <p className="text-red-500 text-sm mt-1">{errors.descripcion}</p>
            )}
          </div>

          {/* Items de Facturación */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Calculator className="w-5 h-5 text-gray-600 mr-2" />
                <h4 className="text-lg font-medium text-gray-900">Items de Facturación</h4>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={loading}
              >
                <Plus className="w-4 h-4 mr-1" />
                Agregar Item
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h5 className="text-sm font-medium text-gray-700">Item #{index + 1}</h5>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-800"
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div className="lg:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Descripción *
                      </label>
                      <input
                        type="text"
                        value={item.descripcion}
                        onChange={(e) => handleItemChange(index, 'descripcion', e.target.value)}
                        placeholder="Descripción del item"
                        className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                          errors[`item_${index}_descripcion`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        disabled={loading}
                      />
                      {errors[`item_${index}_descripcion`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_descripcion`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Cantidad *
                      </label>
                      <input
                        type="number"
                        value={item.cantidad}
                        onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)}
                        min="0.01"
                        step="0.01"
                        className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                          errors[`item_${index}_cantidad`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        disabled={loading}
                      />
                      {errors[`item_${index}_cantidad`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_cantidad`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Precio Unitario *
                      </label>
                      <input
                        type="number"
                        value={item.precio_unitario}
                        onChange={(e) => handleItemChange(index, 'precio_unitario', e.target.value)}
                        min="0"
                        step="0.01"
                        className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                          errors[`item_${index}_precio_unitario`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        disabled={loading}
                      />
                      {errors[`item_${index}_precio_unitario`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_precio_unitario`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Total
                      </label>
                      <div className="px-2 py-1 text-sm bg-gray-100 border rounded text-gray-700 font-medium">
                        ${calculateItemTotal(item).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Descuento (%)
                      </label>
                      <input
                        type="number"
                        value={item.descuento}
                        onChange={(e) => handleItemChange(index, 'descuento', e.target.value)}
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Impuesto (%)
                      </label>
                      <input
                        type="number"
                        value={item.impuesto_porcentaje}
                        onChange={(e) => handleItemChange(index, 'impuesto_porcentaje', e.target.value)}
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totales */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 mb-3">Resumen de Totales</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>${totals.subtotal.toFixed(2)}</span>
              </div>
              {totals.totalDescuentos > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Descuentos:</span>
                  <span>-${totals.totalDescuentos.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Impuestos:</span>
                <span>${totals.totalImpuestos.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span className="text-blue-600">${totals.total.toFixed(2)} {formData.moneda}</span>
              </div>
            </div>
          </div>

          {/* Información Adicional */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Condiciones de Pago
              </label>
              <input
                type="text"
                name="condiciones_pago"
                value={formData.condiciones_pago}
                onChange={handleInputChange}
                placeholder="Ej: Transferencia bancaria"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Método de Pago
              </label>
              <select
                name="metodo_pago"
                value={formData.metodo_pago}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="transferencia">Transferencia Bancaria</option>
                <option value="efectivo">Efectivo</option>
                <option value="cheque">Cheque</option>
                <option value="tarjeta">Tarjeta de Crédito/Débito</option>
                <option value="paypal">PayPal</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas Adicionales
            </label>
            <textarea
              name="notas"
              value={formData.notas}
              onChange={handleInputChange}
              rows={3}
              placeholder="Notas adicionales para el cliente..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || totals.total <= 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando...' : 'Crear Factura'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateInvoiceModal;