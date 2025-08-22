import { useState, useEffect } from 'react';
import { Card, Button, Skeleton } from '../components';
import { getQuotes, updateQuote, deleteQuote, convertQuoteToorder, createQuote } from '../api/axios';
import OrdersNavigation from '../components/OrdersNavigation';
import CreateQuoteModal from '../components/CreateQuoteModal';
import EditQuoteModal from '../components/EditQuoteModal';
import PropTypes from 'prop-types';
import { 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  Calendar, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  XCircle,
  ArrowRight,
  Eye,
  Edit,
  Trash2,
  Download
} from 'lucide-react';

const QuotesPage = ({ showNavigation = true }) => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Cargar cotizaciones desde la API
  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const response = await getQuotes();
      if (response.data.success) {
        setQuotes(response.data.data);
      }
    } catch (error) {
      console.error('Error loading quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const response = await updateQuote(id, { estado: newStatus });
      if (response.data.success) {
        setQuotes(quotes.map(quote => 
          quote.id === id ? { ...quote, estado: newStatus } : quote
        ));
      }
    } catch (error) {
      console.error('Error updating quote:', error);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta cotización?')) {
      try {
        const response = await deleteQuote(id);
        if (response.data.success) {
          setQuotes(quotes.filter(quote => quote.id !== id));
        }
      } catch (error) {
        console.error('Error deleting quote:', error);
      }
    }
  };

  const handleCreateQuote = async (quoteData) => {
    try {
      const response = await createQuote(quoteData);
      if (response.data.success) {
        await fetchQuotes(); // Refresh the quotes list
        return response.data;
      }
    } catch (error) {
      console.error('Error creating quote:', error);
      throw error;
    }
  };

  const handleEditQuote = (quote) => {
    setSelectedQuote(quote);
    setShowEditModal(true);
  };

  const handleUpdateQuote = async (id, quoteData) => {
    try {
      const response = await updateQuote(id, quoteData);
      if (response.data.success) {
        await fetchQuotes(); // Refresh the quotes list
        return response.data;
      }
    } catch (error) {
      console.error('Error updating quote:', error);
      throw error;
    }
  };

  const handleConvertToorder = async (id) => {
    try {
      const response = await convertQuoteToorder(id);
      if (response.data.success) {
        setQuotes(quotes.map(quote => 
          quote.id === id ? { ...quote, estado: 'aceptada' } : quote
        ));
        alert('Cotización convertida a order exitosamente');
      }
    } catch (error) {
      console.error('Error converting quote:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'borrador': return <Clock className="w-4 h-4" />;
      case 'enviada': return <CheckCircle className="w-4 h-4" />;
      case 'aceptada': return <ArrowRight className="w-4 h-4" />;
      case 'rechazada': return <XCircle className="w-4 h-4" />;
      case 'vencida': return <AlertCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'borrador': return 'bg-gray-500 text-white';
      case 'enviada': return 'bg-blue-500 text-white';
      case 'aceptada': return 'bg-green-500 text-white';
      case 'rechazada': return 'bg-red-500 text-white';
      case 'vencida': return 'bg-orange-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const filteredQuotes = quotes.filter(quote => {
    const statusMatch = filter === 'all' || quote.estado === filter;
    const searchMatch = searchTerm === '' || 
      quote.nombre_prospecto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.email_prospecto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.tipo_servicio.toLowerCase().includes(searchTerm.toLowerCase());
    return statusMatch && searchMatch;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const exportQuotes = () => {
    const dataStr = JSON.stringify(filteredQuotes, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `cotizaciones_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
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
    <div className={showNavigation ? "min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6" : ""}>
      <div className={showNavigation ? "max-w-7xl mx-auto" : ""}>
        {/* Navigation */}
        {showNavigation && <OrdersNavigation />}
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-heading font-bold text-gray-800 dark:text-gray-100 mb-4">
                📋 Gestión de Cotizaciones
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
                Administra todas las solicitudes de cotización de clientes potenciales
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={exportQuotes}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nueva Cotización
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="text-3xl font-bold text-gray-600 mb-2">
              {quotes.filter(q => q.estado === 'borrador').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Borrador</div>
          </Card>
          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {quotes.filter(q => q.estado === 'enviada').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Enviadas</div>
          </Card>
          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {quotes.filter(q => q.estado === 'aceptada').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Aceptadas</div>
          </Card>
          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="text-3xl font-bold text-red-600 mb-2">
              {quotes.filter(q => q.estado === 'rechazada').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Rechazadas</div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card variant="gradient" className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, email o servicio..."
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
                Todas ({quotes.length})
              </Button>
              <Button
                variant={filter === 'borrador' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('borrador')}
              >
                Borrador ({quotes.filter(q => q.estado === 'borrador').length})
              </Button>
              <Button
                variant={filter === 'enviada' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('enviada')}
              >
                Enviadas ({quotes.filter(q => q.estado === 'enviada').length})
              </Button>
              <Button
                variant={filter === 'aceptada' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('aceptada')}
              >
                Aceptadas ({quotes.filter(q => q.estado === 'aceptada').length})
              </Button>
              <Button
                variant={filter === 'rechazada' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('rechazada')}
              >
                Rechazadas ({quotes.filter(q => q.estado === 'rechazada').length})
              </Button>
            </div>
          </div>
        </Card>

        {/* Quotes List */}
        <div className="grid gap-6">
          {filteredQuotes.map((quote) => (
            <Card key={quote.id} variant="gradient" hover className="group">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                      {quote.nombre_prospecto}
                    </h3>
                    <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(quote.estado)}`}>
                      {getStatusIcon(quote.estado)}
                      {quote.estado}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <Mail className="w-4 h-4" />
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="font-medium">{quote.email_prospecto}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <Phone className="w-4 h-4" />
                      <div>
                        <p className="text-xs text-gray-500">Teléfono</p>
                        <p className="font-medium">{quote.telefono_prospecto || 'No especificado'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <FileText className="w-4 h-4" />
                      <div>
                        <p className="text-xs text-gray-500">Servicio</p>
                        <p className="font-medium">{quote.tipo_servicio}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Descripción</p>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {quote.descripcion}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>Recibida el {formatDate(quote.created_at)}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row xl:flex-col gap-3 xl:w-48">
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => {
                      setSelectedQuote(quote);
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
                    onClick={() => handleEditQuote(quote)}
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </Button>
                  
                  {quote.estado === 'borrador' && (
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => handleUpdateStatus(quote.id, 'enviada')}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Enviar
                    </Button>
                  )}
                  
                  {quote.estado === 'enviada' && (
                    <>
                      <Button 
                        variant="success" 
                        size="sm" 
                        className="w-full flex items-center justify-center gap-2"
                        onClick={() => handleUpdateStatus(quote.id, 'aceptada')}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Aceptar
                      </Button>
                      <Button 
                        variant="danger" 
                        size="sm" 
                        className="w-full flex items-center justify-center gap-2"
                        onClick={() => handleUpdateStatus(quote.id, 'rechazada')}
                      >
                        <XCircle className="w-4 h-4" />
                        Rechazar
                      </Button>
                    </>
                  )}
                  
                  {quote.estado === 'aceptada' && (
                    <Button 
                      variant="success" 
                      size="sm" 
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => handleConvertToorder(quote.id)}
                    >
                      <ArrowRight className="w-4 h-4" />
                      Convertir a order
                    </Button>
                  )}
                  
                  <Button 
                    variant="danger" 
                    size="sm" 
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => handleDelete(quote.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredQuotes.length === 0 && (
          <Card variant="gradient" className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <FileText className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No hay cotizaciones
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === 'all' ? 'No se han registrado cotizaciones aún' : `No hay cotizaciones con estado "${filter}"`}
            </p>
          </Card>
        )}

        {/* Quote Details Modal */}
        {showModal && selectedQuote && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    Detalles de Cotización
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Nombre del Cliente
                      </label>
                      <p className="mt-1 text-gray-900 dark:text-gray-100">{selectedQuote.nombre_prospecto}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Estado
                      </label>
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(selectedQuote.estado)}`}>
                        {getStatusIcon(selectedQuote.estado)}
                        {selectedQuote.estado}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email
                      </label>
                      <p className="mt-1 text-gray-900 dark:text-gray-100">{selectedQuote.email_prospecto}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Teléfono
                      </label>
                      <p className="mt-1 text-gray-900 dark:text-gray-100">{selectedQuote.telefono_prospecto || 'No especificado'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Empresa
                      </label>
                      <p className="mt-1 text-gray-900 dark:text-gray-100">{selectedQuote.empresa_prospecto || 'No especificado'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Tipo de Servicio
                      </label>
                      <p className="mt-1 text-gray-900 dark:text-gray-100">{selectedQuote.tipo_servicio}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Descripción
                      </label>
                      <p className="mt-1 text-gray-900 dark:text-gray-100 leading-relaxed">{selectedQuote.descripcion}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Fecha de Creación
                      </label>
                      <p className="mt-1 text-gray-900 dark:text-gray-100">{formatDate(selectedQuote.created_at)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Última Actualización
                      </label>
                      <p className="mt-1 text-gray-900 dark:text-gray-100">{formatDate(selectedQuote.updated_at)}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    {selectedQuote.estado === 'borrador' && (
                      <Button 
                        variant="secondary" 
                        className="flex items-center gap-2"
                        onClick={() => {
                          handleUpdateStatus(selectedQuote.id, 'enviada');
                          setShowModal(false);
                        }}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Enviar Cotización
                      </Button>
                    )}
                    {selectedQuote.estado === 'enviada' && (
                      <>
                        <Button 
                          variant="success" 
                          className="flex items-center gap-2"
                          onClick={() => {
                            handleUpdateStatus(selectedQuote.id, 'aceptada');
                            setShowModal(false);
                          }}
                        >
                          <CheckCircle className="w-4 h-4" />
                          Marcar como Aceptada
                        </Button>
                        <Button 
                          variant="danger" 
                          className="flex items-center gap-2"
                          onClick={() => {
                            handleUpdateStatus(selectedQuote.id, 'rechazada');
                            setShowModal(false);
                          }}
                        >
                          <XCircle className="w-4 h-4" />
                          Marcar como Rechazada
                        </Button>
                      </>
                    )}
                    {selectedQuote.estado === 'aceptada' && (
                      <Button 
                        variant="success" 
                        className="flex items-center gap-2"
                        onClick={() => {
                          handleConvertToorder(selectedQuote.id);
                          setShowModal(false);
                        }}
                      >
                        <ArrowRight className="w-4 h-4" />
                        Convertir a order
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

        {/* Create Quote Modal */}
        <CreateQuoteModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateQuote}
        />

        {/* Edit Quote Modal */}
        <EditQuoteModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedQuote(null);
          }}
          onSave={handleUpdateQuote}
          quote={selectedQuote}
        />
      </div>
    </div>
  );
};

// Props validation
QuotesPage.propTypes = {
  showNavigation: PropTypes.bool
};

export default QuotesPage;