import { useState, useEffect } from 'react';
import { getClientQuotes, updateClientQuoteStatus } from '../api/axios';
import { quotationsAPI } from '../api/services';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import LoadingSpinner from './LoadingSpinner';
import { useToast } from '../hooks/useToast';
import { 
  FileText, 
  Calendar, 
  DollarSign, 
  Eye, 
  Check, 
  X, 
  Filter,
  Search,
  Download
} from 'lucide-react';

const QuotesList = () => {
  const { success, error: showError } = useToast();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showQuoteDetail, setShowQuoteDetail] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    pages: 0
  });

  // Cargar cotizaciones
  useEffect(() => {
    fetchQuotes();
  }, [filter]);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const params = {
        page: Math.floor(pagination.offset / pagination.limit) + 1,
        limit: pagination.limit,
        ...(filter !== 'all' && { estado: filter }),
        ...(searchTerm && { search: searchTerm })
      };
      
      try {
        // Try new API first
        const response = await quotationsAPI.getAll(params);
        
        if (response.data) {
          const quotations = Array.isArray(response.data.quotations) ? response.data.quotations : response.data;
          setQuotes(quotations);
          setPagination({
            total: response.data.totalItems || quotations.length,
            limit: pagination.limit,
            offset: pagination.offset,
            pages: Math.ceil((response.data.totalItems || quotations.length) / pagination.limit)
          });
        }
      } catch (newApiError) {
        // Fallback to old API
        console.log('Fallback to old API');
        const response = await getClientQuotes(params);
        
        if (response.data.success) {
          setQuotes(response.data.data);
          setPagination(response.data.pagination);
        } else {
          setError('Error al cargar cotizaciones');
        }
      }
    } catch (err) {
      setError('Error al cargar cotizaciones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar cotizaciones por búsqueda (ahora manejado por el backend)
  const filteredQuotes = quotes;

  // Manejar acción en cotización (aceptar/rechazar)
  const handleQuoteAction = async (quoteId, action, notas = '') => {
    try {
      setActionLoading(true);
      
      try {
        // Try new API first
        const response = await quotationsAPI.updateStatus(quoteId, action, notas);
        success(`Cotización ${action === 'Aprobada' ? 'aceptada' : 'rechazada'} exitosamente`);
      } catch (newApiError) {
        // Fallback to old API
        const response = await updateClientQuoteStatus(quoteId, {
          status: action,
          notas: notas
        });

        if (response.data.success) {
          success(`Cotización ${action === 'aceptada' ? 'aceptada' : 'rechazada'} exitosamente`);
        } else {
          showError(response.data.message || 'Error al procesar la acción');
          return;
        }
      }
      
      fetchQuotes(); // Recargar cotizaciones
      setSelectedQuote(null);
      setShowQuoteDetail(false);
    } catch (err) {
      showError('Error al procesar la acción');
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Obtener color del badge según el estado (actualizado para nuevos estados)
  const getStatusBadge = (estado) => {
    const statusConfig = {
      'Pendiente': { variant: 'default', text: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
      'Aprobada': { variant: 'default', text: 'Aprobada', className: 'bg-green-100 text-green-800' },
      'Rechazada': { variant: 'destructive', text: 'Rechazada' },
      'Expirada': { variant: 'secondary', text: 'Expirada' },
      // Legacy states
      'borrador': { variant: 'secondary', text: 'Borrador' },
      'enviada': { variant: 'default', text: 'Enviada' },
      'aceptada': { variant: 'default', text: 'Aceptada', className: 'bg-green-100 text-green-800' },
      'rechazada': { variant: 'destructive', text: 'Rechazada' },
      'vencida': { variant: 'secondary', text: 'Vencida' }
    };

    const config = statusConfig[estado] || { variant: 'secondary', text: estado };
    
    return (
      <Badge 
        variant={config.variant} 
        className={config.className}
      >
        {config.text}
      </Badge>
    );
  };

  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-MX');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
        <span className="ml-2">Cargando cotizaciones...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <div className="text-red-500 mb-4">
          <X className="w-12 h-12 mx-auto mb-2" />
          <p>{error}</p>
        </div>
        <Button onClick={fetchQuotes} variant="outline">
          Reintentar
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros y búsqueda */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Buscar cotizaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="Pendiente">Pendiente</SelectItem>
                <SelectItem value="Aprobada">Aprobada</SelectItem>
                <SelectItem value="Rechazada">Rechazada</SelectItem>
                <SelectItem value="Expirada">Expirada</SelectItem>
                {/* Legacy states */}
                <SelectItem value="borrador">Borrador</SelectItem>
                <SelectItem value="enviada">Enviada</SelectItem>
                <SelectItem value="aceptada">Aceptada</SelectItem>
                <SelectItem value="vencida">Vencida</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          {filteredQuotes.length} cotizaciones encontradas
        </div>
      </Card>

      {/* Lista de cotizaciones */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Servicio</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Fecha Emisión</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-500">No se found cotizaciones</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredQuotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-medium">
                    {quote.numero_cotizacion || quote.numeroConsecutivo}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{quote.titulo || quote.tipoServicio}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {quote.descripcion}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(quote.estado)}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(quote.precio_total || quote.total)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                      {formatDate(quote.fecha_creacion || quote.fechaEmision)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                      {formatDate(quote.fecha_vencimiento || quote.fechaVencimiento)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Dialog open={showQuoteDetail && selectedQuote?.id === quote.id}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedQuote(quote);
                              setShowQuoteDetail(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>
                              Cotización {quote.numeroConsecutivo}
                            </DialogTitle>
                          </DialogHeader>
                          <QuoteDetailModal 
                            quote={selectedQuote}
                            onAction={handleQuoteAction}
                            actionLoading={actionLoading}
                            onClose={() => {
                              setShowQuoteDetail(false);
                              setSelectedQuote(null);
                            }}
                          />
                        </DialogContent>
                      </Dialog>
                      
                      {['enviada', 'Pendiente'].includes(quote.estado) && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleQuoteAction(quote.id, 'Aprobada')}
                            disabled={actionLoading}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleQuoteAction(quote.id, 'Rechazada')}
                            disabled={actionLoading}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Paginación */}
      {pagination.pages > 1 && (
        <Card className="p-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Mostrando {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} de {pagination.total}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.offset === 0}
                onClick={() => {
                  setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }));
                  fetchQuotes();
                }}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.offset + pagination.limit >= pagination.total}
                onClick={() => {
                  setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }));
                  fetchQuotes();
                }}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

// Componente modal para detalles de cotización
const QuoteDetailModal = ({ quote, onAction, actionLoading, onClose }) => {
  const [notes, setNotes] = useState('');
  const [selectedAction, setSelectedAction] = useState('');

  if (!quote) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-MX');
  };

  const handleActionWithNotes = () => {
    if (selectedAction) {
      onAction(quote.id, selectedAction, notes);
    }
  };

  return (
    <div className="space-y-6">
      {/* Información básica */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold mb-2">Información General</h3>
          <div className="space-y-2 text-sm">
            <div><strong>Número:</strong> {quote.numero_cotizacion || quote.numeroConsecutivo}</div>
            <div><strong>Servicio:</strong> {quote.titulo || quote.tipoServicio}</div>
            <div><strong>Estado:</strong> {quote.estado}</div>
            <div><strong>Emisión:</strong> {formatDate(quote.fecha_creacion || quote.fechaEmision)}</div>
            <div><strong>Vencimiento:</strong> {formatDate(quote.fecha_vencimiento || quote.fechaVencimiento)}</div>
          </div>
        </div>
        
        <div>
          <h3 className="font-semibold mb-2">Montos</h3>
          <div className="space-y-2 text-sm">
            <div><strong>Precio estimado:</strong> {formatCurrency(quote.precio_estimado)}</div>
            <div><strong>Moneda:</strong> {quote.moneda || 'MXN'}</div>
            <div><strong>Tiempo entrega:</strong> {quote.tiempo_entrega_dias || 'N/A'} días</div>
            <div className="text-lg font-bold border-t pt-2">
              <strong>Total:</strong> {formatCurrency(quote.precio_total || quote.total || quote.precio_estimado)}
            </div>
          </div>
        </div>
      </div>

      {/* Descripción */}
      <div>
        <h3 className="font-semibold mb-2">Descripción</h3>
        <p className="text-sm bg-gray-50 p-3 rounded">{quote.descripcion}</p>
      </div>

      {/* Condiciones de pago */}
      {quote.condicionesPago && (
        <div>
          <h3 className="font-semibold mb-2">Condiciones de Pago</h3>
          <p className="text-sm bg-gray-50 p-3 rounded">{quote.condicionesPago}</p>
        </div>
      )}

      {/* Notas */}
      {quote.notas && (
        <div>
          <h3 className="font-semibold mb-2">Notas</h3>
          <p className="text-sm bg-gray-50 p-3 rounded">{quote.notas}</p>
        </div>
      )}

      {/* Acciones para cotizaciones pendientes */}
      {['enviada', 'Pendiente'].includes(quote.estado) && (
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-4">Acciones</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Seleccionar acción:
              </label>
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar acción..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aprobada">Aceptar Cotización</SelectItem>
                  <SelectItem value="Rechazada">Rechazar Cotización</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Notas (opcional):
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Agregar comentarios sobre la decisión..."
                rows={3}
              />
            </div>
            
            <div className="flex space-x-2 justify-end">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                onClick={handleActionWithNotes}
                disabled={!selectedAction || actionLoading}
                className={selectedAction === 'Aprobada' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              >
                {actionLoading ? 'Procesando...' : 'Confirmar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotesList;