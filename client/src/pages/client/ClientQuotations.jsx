import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { getClientQuotes, updateClientQuoteStatus } from '../../api/axios';
import { 
  FileText,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Filter,
  Search,
  AlertCircle,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

const ClientQuotations = () => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [filters, setFilters] = useState({
    estado: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const loadQuotations = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (filters.estado) params.estado = filters.estado;
      if (filters.search) params.search = filters.search;
      
      const response = await getClientQuotes(params);
      setQuotations(response.data || []);
    } catch (error) {
      console.error('Error loading quotations:', error);
      setQuotations([]);
    } finally {
      setLoading(false);
    }
  }, [filters.estado, filters.search]);

  useEffect(() => {
    loadQuotations();
  }, [loadQuotations]);

  const handleQuotationAction = async (quotationId, action) => {
    try {
      setActionLoading(quotationId);
      
      await updateClientQuoteStatus(quotationId, { status: action });
      
      // Reload quotations
      await loadQuotations();
      
      // Close modal if open
      setSelectedQuotation(null);
      
      // Show success message
      const actionText = action === 'approve' ? 'aprobada' : 'rechazada';
      // You can implement a toast notification here
      console.log(`Cotización ${actionText} exitosamente`);
      
    } catch (error) {
      console.error(`Error ${action} quotation:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'aprobada': return 'text-green-600 bg-green-100';
      case 'rechazada': return 'text-red-600 bg-red-100';
      case 'pendiente': return 'text-yellow-600 bg-yellow-100';
      case 'enviada': return 'text-blue-600 bg-blue-100';
      case 'expirada': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'aprobada': return CheckCircle;
      case 'rechazada': return XCircle;
      case 'pendiente': return Clock;
      case 'enviada': return FileText;
      case 'expirada': return AlertCircle;
      default: return FileText;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'aprobada': return 'Aprobada';
      case 'rechazada': return 'Rechazada';
      case 'pendiente': return 'Pendiente';
      case 'enviada': return 'Enviada';
      case 'expirada': return 'Expirada';
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

  const isExpired = (quotation) => {
    if (!quotation.fecha_expiracion) return false;
    return new Date() > new Date(quotation.fecha_expiracion);
  };

  const canTakeAction = (quotation) => {
    return quotation.estado === 'enviada' && !isExpired(quotation);
  };

  const QuotationCard = ({ quotation }) => {
    const StatusIcon = getStatusIcon(quotation.estado);
    const expired = isExpired(quotation);
    
    return (
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <FileText className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {quotation.numero_cotizacion}
                </h3>
              </div>
              
              <p className="text-gray-600 text-sm mb-3">
                {quotation.descripcion}
              </p>
              
              <div className="flex items-center mb-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  expired ? 'text-red-600 bg-red-100' : getStatusColor(quotation.estado)
                }`}>
                  <StatusIcon className="w-4 h-4 mr-1" />
                  {expired ? 'Expirada' : getStatusText(quotation.estado)}
                </span>
              </div>
            </div>
            
            <button
              onClick={() => setSelectedQuotation(quotation)}
              className="ml-4 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Ver detalles"
            >
              <Eye className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div className="flex items-center text-gray-600">
              <Calendar className="w-4 h-4 mr-2" />
              <span>Creada: {formatDate(quotation.fecha_creacion)}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Clock className="w-4 h-4 mr-2" />
              <span>Expira: {formatDate(quotation.fecha_expiracion)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center">
              <DollarSign className="w-5 h-5 text-green-600 mr-1" />
              <span className="text-lg font-bold text-green-600">
                {formatCurrency(quotation.total)}
              </span>
            </div>
            
            {canTakeAction(quotation) && (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleQuotationAction(quotation.id, 'approve')}
                  disabled={actionLoading === quotation.id}
                  className="inline-flex items-center px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 disabled:opacity-50"
                >
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  Aprobar
                </button>
                <button
                  onClick={() => handleQuotationAction(quotation.id, 'reject')}
                  disabled={actionLoading === quotation.id}
                  className="inline-flex items-center px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 disabled:opacity-50"
                >
                  <ThumbsDown className="w-4 h-4 mr-1" />
                  Rechazar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // PropTypes for QuotationCard
  QuotationCard.propTypes = {
    quotation: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      numero_cotizacion: PropTypes.string.isRequired,
      descripcion: PropTypes.string.isRequired,
      estado: PropTypes.string.isRequired,
      fecha_creacion: PropTypes.string.isRequired,
      fecha_expiracion: PropTypes.string.isRequired,
      total: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      subtotal: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      impuestos: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      porcentaje_impuesto: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      descuento: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      notas: PropTypes.string,
      items: PropTypes.string
    }).isRequired
  };

  const QuotationModal = ({ quotation, onClose }) => {
    if (!quotation) return null;

    const items = quotation.items ? JSON.parse(quotation.items) : [];
    const expired = isExpired(quotation);

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {quotation.numero_cotizacion}
              </h3>
              <p className="text-gray-600 mt-1">{quotation.descripcion}</p>
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
                    expired ? 'text-red-600 bg-red-100' : getStatusColor(quotation.estado)
                  }`}>
                    {expired ? 'Expirada' : getStatusText(quotation.estado)}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Fecha de Creación</label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDate(quotation.fecha_creacion)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Fecha de Expiración</label>
                <p className={`mt-1 text-sm ${expired ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                  {formatDate(quotation.fecha_expiracion)}
                </p>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3">Elementos de la Cotización</h4>
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
                  <span>{formatCurrency(quotation.subtotal || 0)}</span>
                </div>
                {quotation.impuestos > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Impuestos ({quotation.porcentaje_impuesto}%):</span>
                    <span>{formatCurrency(quotation.impuestos)}</span>
                  </div>
                )}
                {quotation.descuento > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Descuento:</span>
                    <span>-{formatCurrency(quotation.descuento)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span className="text-green-600">{formatCurrency(quotation.total)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {quotation.notas && (
              <div>
                <label className="text-sm font-medium text-gray-700">Notas</label>
                <p className="mt-1 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                  {quotation.notas}
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
                <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-transparent rounded-md hover:bg-blue-200">
                  <Download className="w-4 h-4 mr-2" />
                  Descargar PDF
                </button>
                
                {canTakeAction(quotation) && (
                  <>
                    <button
                      onClick={() => handleQuotationAction(quotation.id, 'reject')}
                      disabled={actionLoading === quotation.id}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-transparent rounded-md hover:bg-red-200 disabled:opacity-50"
                    >
                      <ThumbsDown className="w-4 h-4 mr-2" />
                      Rechazar
                    </button>
                    <button
                      onClick={() => handleQuotationAction(quotation.id, 'approve')}
                      disabled={actionLoading === quotation.id}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      Aprobar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // PropTypes for QuotationModal
  QuotationModal.propTypes = {
    quotation: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      numero_cotizacion: PropTypes.string.isRequired,
      descripcion: PropTypes.string.isRequired,
      estado: PropTypes.string.isRequired,
      fecha_creacion: PropTypes.string.isRequired,
      fecha_expiracion: PropTypes.string.isRequired,
      total: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      subtotal: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      impuestos: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      porcentaje_impuesto: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      descuento: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
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
          <h1 className="text-2xl font-bold text-gray-900">Mis Cotizaciones</h1>
          <p className="mt-1 text-sm text-gray-600">
            Revisa y gestiona las cotizaciones de tus proyectos
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar cotización
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por número o descripción..."
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
                <option value="enviada">Enviada</option>
                <option value="pendiente">Pendiente</option>
                <option value="aprobada">Aprobada</option>
                <option value="rechazada">Rechazada</option>
                <option value="expirada">Expirada</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Quotations Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      ) : quotations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quotations.map((quotation) => (
            <QuotationCard key={quotation.id} quotation={quotation} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay cotizaciones</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filters.search || filters.estado 
              ? 'No se encontraron cotizaciones con los filtros aplicados.'
              : 'Aún no tienes cotizaciones generadas.'
            }
          </p>
        </div>
      )}

      {/* Quotation Modal */}
      {selectedQuotation && (
        <QuotationModal 
          quotation={selectedQuotation} 
          onClose={() => setSelectedQuotation(null)} 
        />
      )}
    </div>
  );
};

export default ClientQuotations;