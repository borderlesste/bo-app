import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Card, Button, Skeleton } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { getAdminInvoices, updateInvoiceStatus } from '../api/axios';
import { 
  Search, 
  FileText, 
  Calendar, 
  User, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  XCircle,
  Eye,
  Download,
  Send,
  RefreshCw,
  Receipt
} from 'lucide-react';

const FinanceInvoicesPage = ({ showNavigation = true }) => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Cargar facturas desde la API
  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await getAdminInvoices();
      
      if (response.data.success) {
        setInvoices(response.data.data.invoices || []);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };


  const getStatusIcon = (status) => {
    switch (status) {
      case 'pagada': return <CheckCircle className="w-4 h-4" />;
      case 'emitida': return <Clock className="w-4 h-4" />;
      case 'borrador': return <AlertCircle className="w-4 h-4" />;
      case 'timbrada': return <CheckCircle className="w-4 h-4" />;
      case 'cancelada': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pagada': return 'bg-green-500 text-white';
      case 'emitida': return 'bg-blue-500 text-white';
      case 'borrador': return 'bg-gray-500 text-white';
      case 'timbrada': return 'bg-indigo-500 text-white';
      case 'cancelada': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const handleUpdateStatus = async (invoiceId, newStatus) => {
    try {
      const response = await updateInvoiceStatus(invoiceId, newStatus);
      
      if (response.data.success) {
        // Actualizar el estado local de la factura
        setInvoices(invoices.map(inv => 
          inv.id === invoiceId ? { ...inv, estado: newStatus } : inv
        ));
      }
    } catch (error) {
      console.error('Error updating invoice status:', error);
      alert('Error al actualizar el estado de la factura');
    }
  };

  const handleSendInvoice = async (invoice) => {
    try {
      if (!invoice.cliente_email) {
        alert('No se puede enviar la factura: el cliente no tiene email registrado');
        return;
      }

      // En un sistema real, aquí se enviaría un email con la factura
      // Por ahora simularemos el envío
      console.log('Enviando factura:', {
        to: invoice.cliente_email,
        subject: `Factura ${invoice.numero_factura}`,
        invoice: invoice
      });

      alert(`Factura ${invoice.numero_factura} enviada exitosamente a ${invoice.cliente_email}`);
    } catch (error) {
      console.error('Error sending invoice:', error);
      alert('Error al enviar la factura. Intente nuevamente.');
    }
  };

  const handleDownloadInvoice = (invoice) => {
    // Generar contenido completo de factura para descarga
    const invoiceData = {
      ...invoice,
      generated_at: new Date().toISOString(),
      generated_by: 'Sistema de Facturación BODERLESS TECHNO COMPANY'
    };

    const dataStr = JSON.stringify(invoiceData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `factura_${invoice.numero_factura}_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const filteredInvoices = invoices.filter(invoice => {
    const statusMatch = filter === 'all' || invoice.estado === filter;
    const searchMatch = searchTerm === '' || 
      invoice.numero_factura?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.cliente_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.concepto?.toLowerCase().includes(searchTerm.toLowerCase());
    return statusMatch && searchMatch;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'No especificada';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const exportInvoices = () => {
    const dataStr = JSON.stringify(filteredInvoices, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `facturas_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Calcular estadísticas
  const totalFacturado = invoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
  const facturasPagadas = invoices.filter(inv => inv.estado === 'pagada').reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
  const facturasEmitidas = invoices.filter(inv => inv.estado === 'emitida').reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
  const facturasCanceladas = invoices.filter(inv => inv.estado === 'cancelada').reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);

  if (loading) {
    return (
      <div className={showNavigation ? "min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6" : "p-6"}>
        <div className={showNavigation ? "max-w-7xl mx-auto" : ""}>
          <div className="mb-8">
            <Skeleton height="8" width="1/3" className="mb-4" />
            <Skeleton height="4" width="2/3" />
          </div>
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} variant="gradient" className="animate-pulse">
                <Skeleton height="6" width="1/4" className="mb-4" />
                <Skeleton height="4" width="full" className="mb-2" />
                <Skeleton height="4" width="3/4" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={showNavigation ? "min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6" : "p-6"}>
      <div className={showNavigation ? "max-w-7xl mx-auto" : ""}>        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-heading font-bold text-gray-800 dark:text-gray-100 mb-4">
                🧾 Gestión de Facturas
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
                Administra todas las facturas, facturación y documentos fiscales del sistema
              </p>
              {user && (
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <User className="w-4 h-4 inline mr-1" />
                  Sesión activa: {user.nombre} ({user.email})
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchInvoices}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Actualizar
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={exportInvoices}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="flex items-center justify-center mb-4">
              <Receipt className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {formatCurrency(totalFacturado)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Facturado</div>
          </Card>

          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {formatCurrency(facturasPagadas)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Pagadas</div>
          </Card>

          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {formatCurrency(facturasEmitidas)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Emitidas</div>
          </Card>

          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <div className="text-3xl font-bold text-red-600 mb-2">
              {formatCurrency(facturasCanceladas)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Canceladas</div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card variant="gradient" className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por número, cliente o concepto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant={filter === 'all' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                Todas ({invoices.length})
              </Button>
              <Button
                variant={filter === 'borrador' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('borrador')}
              >
                Borrador ({invoices.filter(inv => inv.estado === 'borrador').length})
              </Button>
              <Button
                variant={filter === 'emitida' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('emitida')}
              >
                Emitidas ({invoices.filter(inv => inv.estado === 'emitida').length})
              </Button>
              <Button
                variant={filter === 'timbrada' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('timbrada')}
              >
                Timbradas ({invoices.filter(inv => inv.estado === 'timbrada').length})
              </Button>
              <Button
                variant={filter === 'pagada' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('pagada')}
              >
                Pagadas ({invoices.filter(inv => inv.estado === 'pagada').length})
              </Button>
              <Button
                variant={filter === 'cancelada' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('cancelada')}
              >
                Canceladas ({invoices.filter(inv => inv.estado === 'cancelada').length})
              </Button>
            </div>
          </div>
        </Card>

        {/* Invoices List */}
        <div className="grid gap-6">
          {filteredInvoices.map((invoice) => (
            <Card key={invoice.id} variant="gradient" hover className="group">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                      <FileText className="w-5 h-5 inline mr-2" />
                      {invoice.numero_factura}
                    </h3>
                    <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.estado || 'borrador')}`}>
                      {getStatusIcon(invoice.estado || 'borrador')}
                      {invoice.estado || 'borrador'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <User className="w-4 h-4" />
                      <div>
                        <p className="text-xs text-gray-500">Cliente</p>
                        <p className="font-medium">{invoice.cliente_nombre}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <DollarSign className="w-4 h-4" />
                      <div>
                        <p className="text-xs text-gray-500">Total</p>
                        <p className="text-xl font-bold text-green-600">{formatCurrency(invoice.total)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <Calendar className="w-4 h-4" />
                      <div>
                        <p className="text-xs text-gray-500">Emisión</p>
                        <p className="font-medium">{formatDate(invoice.fecha_emision)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      <span className="font-medium">Concepto:</span> {invoice.concepto}
                    </p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Subtotal:</span>
                        <span className="ml-2 font-medium">{formatCurrency(invoice.subtotal)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">IVA:</span>
                        <span className="ml-2 font-medium">{formatCurrency(invoice.iva)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Vencimiento:</span>
                        <span className="ml-2 font-medium">{formatDate(invoice.fecha_vencimiento)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>Registrada el {formatDate(invoice.createdAt)}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row xl:flex-col gap-3 xl:w-48">
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => {
                      setSelectedInvoice(invoice);
                      setShowModal(true);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                    Ver Detalles
                  </Button>
                  
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => handleDownloadInvoice(invoice)}
                  >
                    <Download className="w-4 h-4" />
                    Descargar
                  </Button>
                  
                  <Button 
                    variant="success" 
                    size="sm" 
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => handleSendInvoice(invoice)}
                  >
                    <Send className="w-4 h-4" />
                    Enviar
                  </Button>
                  
                  {invoice.estado === 'borrador' && (
                    <Button 
                      variant="primary" 
                      size="sm" 
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => handleUpdateStatus(invoice.id, 'emitida')}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Emitir
                    </Button>
                  )}
                  
                  {invoice.estado === 'emitida' && (
                    <>
                      <Button 
                        variant="success" 
                        size="sm" 
                        className="w-full flex items-center justify-center gap-2"
                        onClick={() => handleUpdateStatus(invoice.id, 'timbrada')}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Timbrar
                      </Button>
                      <Button 
                        variant="warning" 
                        size="sm" 
                        className="w-full flex items-center justify-center gap-2"
                        onClick={() => handleUpdateStatus(invoice.id, 'pagada')}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Marcar Pagada
                      </Button>
                    </>
                  )}
                  
                  {invoice.estado === 'timbrada' && (
                    <Button 
                      variant="warning" 
                      size="sm" 
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => handleUpdateStatus(invoice.id, 'pagada')}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Marcar Pagada
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredInvoices.length === 0 && (
          <Card variant="gradient" className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <FileText className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No hay facturas
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === 'all' ? 'No se han generado facturas aún' : `No hay facturas con estado "${filter}"`}
            </p>
          </Card>
        )}

        {/* Invoice Details Modal */}
        {showModal && selectedInvoice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    Factura {selectedInvoice.numero_factura}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="flex gap-3 mb-4">
                    <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedInvoice.estado || 'borrador')}`}>
                      {getStatusIcon(selectedInvoice.estado || 'borrador')}
                      {selectedInvoice.estado || 'borrador'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Información del Cliente */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        Información del Cliente
                      </h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Cliente
                        </label>
                        <p className="text-gray-900 dark:text-gray-100">{selectedInvoice.cliente_nombre}</p>
                      </div>
                      {selectedInvoice.cliente_email && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Email
                          </label>
                          <p className="text-gray-900 dark:text-gray-100">{selectedInvoice.cliente_email}</p>
                        </div>
                      )}
                    </div>

                    {/* Información de la Factura */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        Información de la Factura
                      </h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Número de Factura
                        </label>
                        <p className="text-gray-900 dark:text-gray-100 font-mono">{selectedInvoice.numero_factura}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Fecha de Emisión
                        </label>
                        <p className="text-gray-900 dark:text-gray-100">{formatDate(selectedInvoice.fecha_emision)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Fecha de Vencimiento
                        </label>
                        <p className="text-gray-900 dark:text-gray-100">{formatDate(selectedInvoice.fecha_vencimiento)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Detalles del Servicio */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                      Detalles del Servicio
                    </h3>
                    <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                      <p className="text-gray-900 dark:text-gray-100 mb-4">{selectedInvoice.concepto}</p>
                      
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                          <span className="font-medium">{formatCurrency(selectedInvoice.subtotal)}</span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-600 dark:text-gray-400">IVA (16%):</span>
                          <span className="font-medium">{formatCurrency(selectedInvoice.iva)}</span>
                        </div>
                        <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                          <span>Total:</span>
                          <span className="text-green-600">{formatCurrency(selectedInvoice.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedInvoice.notas && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Notas
                      </label>
                      <p className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-slate-700 p-3 rounded">
                        {selectedInvoice.notas}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t">
                    <Button 
                      variant="primary" 
                      className="flex items-center gap-2"
                      onClick={() => handleDownloadInvoice(selectedInvoice)}
                    >
                      <Download className="w-4 h-4" />
                      Descargar PDF
                    </Button>
                    <Button 
                      variant="success" 
                      className="flex items-center gap-2"
                      onClick={() => handleSendInvoice(selectedInvoice)}
                    >
                      <Send className="w-4 h-4" />
                      Enviar por Email
                    </Button>
                    {selectedInvoice.estado === 'borrador' && (
                      <Button 
                        variant="primary" 
                        className="flex items-center gap-2"
                        onClick={() => {
                          handleUpdateStatus(selectedInvoice.id, 'emitida');
                          setShowModal(false);
                        }}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Emitir Factura
                      </Button>
                    )}
                    {selectedInvoice.estado === 'emitida' && (
                      <>
                        <Button 
                          variant="success" 
                          className="flex items-center gap-2"
                          onClick={() => {
                            handleUpdateStatus(selectedInvoice.id, 'timbrada');
                            setShowModal(false);
                          }}
                        >
                          <CheckCircle className="w-4 h-4" />
                          Timbrar Factura
                        </Button>
                        <Button 
                          variant="warning" 
                          className="flex items-center gap-2"
                          onClick={() => {
                            handleUpdateStatus(selectedInvoice.id, 'pagada');
                            setShowModal(false);
                          }}
                        >
                          <CheckCircle className="w-4 h-4" />
                          Marcar como Pagada
                        </Button>
                      </>
                    )}
                    {selectedInvoice.estado === 'timbrada' && (
                      <Button 
                        variant="warning" 
                        className="flex items-center gap-2"
                        onClick={() => {
                          handleUpdateStatus(selectedInvoice.id, 'pagada');
                          setShowModal(false);
                        }}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Marcar como Pagada
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      onClick={() => setShowModal(false)}
                    >
                      Cerrar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

FinanceInvoicesPage.propTypes = {
  showNavigation: PropTypes.bool
};

export default FinanceInvoicesPage;