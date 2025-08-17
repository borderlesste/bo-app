import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { getInvoices, downloadClientInvoice } from '../../api/axios';
import { 
  CreditCard,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Download,
  Filter,
  Search,
  FileText,
  ExternalLink
} from 'lucide-react';

const ClientInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [filters, setFilters] = useState({
    estado: '',
    search: '',
    fechaDesde: '',
    fechaHasta: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (filters.estado) params.estado = filters.estado;
      if (filters.search) params.search = filters.search;
      if (filters.fechaDesde) params.fechaDesde = filters.fechaDesde;
      if (filters.fechaHasta) params.fechaHasta = filters.fechaHasta;
      
      const response = await getInvoices(params);
      console.log('Response from getInvoices:', response.data);
      setInvoices(response.data?.data || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [filters.estado, filters.search, filters.fechaDesde, filters.fechaHasta]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pagada': return 'text-green-600 bg-green-100';
      case 'pendiente': return 'text-yellow-600 bg-yellow-100';
      case 'vencida': return 'text-red-600 bg-red-100';
      case 'cancelada': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pagada': return CheckCircle;
      case 'pendiente': return Clock;
      case 'vencida': return AlertCircle;
      case 'cancelada': return FileText;
      default: return CreditCard;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pagada': return 'Pagada';
      case 'pendiente': return 'Pendiente';
      case 'vencida': return 'Vencida';
      case 'cancelada': return 'Cancelada';
      default: return status;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No definida';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isOverdue = (invoice) => {
    if (invoice.estado === 'pagada' || !invoice.fecha_vencimiento) return false;
    return new Date() > new Date(invoice.fecha_vencimiento);
  };

  const getDaysUntilDue = (invoice) => {
    if (!invoice.fecha_vencimiento || invoice.estado === 'pagada') return null;
    const today = new Date();
    const dueDate = new Date(invoice.fecha_vencimiento);
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleDownloadInvoice = async (invoiceId) => {
    try {
      const response = await downloadClientInvoice(invoiceId);
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `factura-${invoices.find(i => i.id === invoiceId)?.numero_factura}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading invoice:', error);
    }
  };

  const InvoiceCard = ({ invoice }) => {
    const StatusIcon = getStatusIcon(invoice.estado);
    const overdue = isOverdue(invoice);
    const daysUntilDue = getDaysUntilDue(invoice);
    
    return (
      <div className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 ${
        overdue ? 'border-l-4 border-red-500' : ''
      }`}>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <CreditCard className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {invoice.numero_factura}
                </h3>
              </div>
              
              {invoice.proyecto_titulo && (
                <p className="text-gray-600 text-sm mb-2">
                  Proyecto: {invoice.proyecto_titulo}
                </p>
              )}
              
              <div className="flex items-center mb-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  overdue ? 'text-red-600 bg-red-100' : getStatusColor(invoice.estado)
                }`}>
                  <StatusIcon className="w-4 h-4 mr-1" />
                  {overdue ? 'Vencida' : getStatusText(invoice.estado)}
                </span>
              </div>

              {/* Due date warning */}
              {daysUntilDue !== null && daysUntilDue <= 7 && daysUntilDue > 0 && (
                <div className="flex items-center text-yellow-600 text-sm mb-2">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  <span>Vence en {daysUntilDue} día{daysUntilDue !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
            
            <div className="flex space-x-2 ml-4">
              <button
                onClick={() => setSelectedInvoice(invoice)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Ver detalles"
              >
                <Eye className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDownloadInvoice(invoice.id)}
                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Descargar PDF"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div className="flex items-center text-gray-600">
              <Calendar className="w-4 h-4 mr-2" />
              <span>Emitida: {formatDate(invoice.fecha_emision)}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Clock className="w-4 h-4 mr-2" />
              <span>Vence: {formatDate(invoice.fecha_vencimiento)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center">
              <DollarSign className="w-5 h-5 text-green-600 mr-1" />
              <span className="text-lg font-bold text-green-600">
                {formatCurrency(invoice.total)}
              </span>
            </div>
            
            {invoice.estado === 'pendiente' && (
              <button className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200">
                <ExternalLink className="w-4 h-4 mr-1" />
                Pagar Ahora
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // PropTypes for InvoiceCard
  InvoiceCard.propTypes = {
    invoice: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      numero_factura: PropTypes.string.isRequired,
      estado: PropTypes.string.isRequired,
      proyecto_titulo: PropTypes.string,
      fecha_emision: PropTypes.string,
      fecha_vencimiento: PropTypes.string,
      total: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      cliente_nombre: PropTypes.string,
      cliente_empresa: PropTypes.string,
      cliente_email: PropTypes.string,
      subtotal: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      impuestos: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      porcentaje_impuesto: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      descuento: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      fecha_pago: PropTypes.string,
      metodo_pago: PropTypes.string,
      notas: PropTypes.string,
      items: PropTypes.string
    }).isRequired
  };

  const InvoiceModal = ({ invoice, onClose }) => {
    if (!invoice) return null;

    const items = invoice.items ? JSON.parse(invoice.items) : [];
    const overdue = isOverdue(invoice);

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {invoice.numero_factura}
              </h3>
              {invoice.proyecto_titulo && (
                <p className="text-gray-600 mt-1">Proyecto: {invoice.proyecto_titulo}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Status and Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Estado</label>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    overdue ? 'text-red-600 bg-red-100' : getStatusColor(invoice.estado)
                  }`}>
                    {overdue ? 'Vencida' : getStatusText(invoice.estado)}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Fecha de Emisión</label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDate(invoice.fecha_emision)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Fecha de Vencimiento</label>
                <p className={`mt-1 text-sm ${overdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                  {formatDate(invoice.fecha_vencimiento)}
                </p>
              </div>
            </div>

            {/* Company Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">De:</h4>
                <div className="text-sm space-y-1">
                  <p className="font-medium">Borderless Techno Company</p>
                  <p className="text-gray-600">123 Tech Street</p>
                  <p className="text-gray-600">Tech City, TC 12345</p>
                  <p className="text-gray-600">contact@borderlesstechno.com</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Para:</h4>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{invoice.cliente_nombre}</p>
                  <p className="text-gray-600">{invoice.cliente_empresa}</p>
                  <p className="text-gray-600">{invoice.cliente_email}</p>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3">Elementos de la Factura</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descripción
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cantidad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Precio Unitario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.descripcion}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.cantidad}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(item.precio_unitario)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(item.cantidad * item.precio_unitario)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(invoice.subtotal || 0)}</span>
                </div>
                {invoice.impuestos > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Impuestos ({invoice.porcentaje_impuesto}%):</span>
                    <span>{formatCurrency(invoice.impuestos)}</span>
                  </div>
                )}
                {invoice.descuento > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Descuento:</span>
                    <span>-{formatCurrency(invoice.descuento)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total a Pagar:</span>
                  <span className="text-green-600">{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            {invoice.estado === 'pagada' && invoice.fecha_pago && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-green-800 font-medium">
                    Pagada el {formatDate(invoice.fecha_pago)}
                  </span>
                </div>
                {invoice.metodo_pago && (
                  <p className="text-green-700 text-sm mt-1">
                    Método de pago: {invoice.metodo_pago}
                  </p>
                )}
              </div>
            )}

            {/* Notes */}
            {invoice.notas && (
              <div>
                <label className="text-sm font-medium text-gray-700">Notas</label>
                <p className="mt-1 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                  {invoice.notas}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cerrar
              </button>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => handleDownloadInvoice(invoice.id)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-transparent rounded-md hover:bg-blue-200"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar PDF
                </button>
                
                {invoice.estado === 'pendiente' && (
                  <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Pagar Ahora
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // PropTypes for InvoiceModal
  InvoiceModal.propTypes = {
    invoice: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      numero_factura: PropTypes.string.isRequired,
      estado: PropTypes.string.isRequired,
      proyecto_titulo: PropTypes.string,
      fecha_emision: PropTypes.string,
      fecha_vencimiento: PropTypes.string,
      total: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      cliente_nombre: PropTypes.string,
      cliente_empresa: PropTypes.string,
      cliente_email: PropTypes.string,
      subtotal: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      impuestos: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      porcentaje_impuesto: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      descuento: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      fecha_pago: PropTypes.string,
      metodo_pago: PropTypes.string,
      notas: PropTypes.string,
      items: PropTypes.string
    }),
    onClose: PropTypes.func.isRequired
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Facturas</h1>
          <p className="mt-1 text-sm text-gray-600">
            Gestiona el estado de pago de tus facturas
          </p>
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filtros
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar factura
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Número de factura..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={filters.estado}
                onChange={(e) => setFilters(prev => ({ ...prev, estado: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="pagada">Pagada</option>
                <option value="vencida">Vencida</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha desde
              </label>
              <input
                type="date"
                value={filters.fechaDesde}
                onChange={(e) => setFilters(prev => ({ ...prev, fechaDesde: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha hasta
              </label>
              <input
                type="date"
                value={filters.fechaHasta}
                onChange={(e) => setFilters(prev => ({ ...prev, fechaHasta: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Invoices Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      ) : invoices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {invoices.map((invoice) => (
            <InvoiceCard key={invoice.id} invoice={invoice} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay facturas</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filters.search || filters.estado || filters.fechaDesde || filters.fechaHasta
              ? 'No se encontraron facturas con los filtros aplicados.'
              : 'Aún no tienes facturas generadas.'
            }
          </p>
        </div>
      )}

      {/* Invoice Modal */}
      {selectedInvoice && (
        <InvoiceModal 
          invoice={selectedInvoice} 
          onClose={() => setSelectedInvoice(null)} 
        />
      )}
    </div>
  );
};

export default ClientInvoices;