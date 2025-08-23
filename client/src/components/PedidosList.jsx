import { useState, useEffect, useCallback } from 'react';
import { getClientPedidos, updateClientPedidoStatus } from '../api/axios';
import { pedidosAPI } from '../api/services';
import { useToast } from '../hooks/useToast';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import LoadingSpinner from './LoadingSpinner';
import { 
  Package, 
  Calendar, 
  DollarSign, 
  Eye, 
  Pause, 
  Play,
  Filter,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';

const PedidosList = () => {
  const { success, error: showError } = useToast();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Cargar pedidos
  useEffect(() => {
    fetchPedidos();
  }, [filter, fetchPedidos]);

  // Buscar pedidos con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPedidos();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, fetchPedidos]);

  const fetchPedidos = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = {
        ...(filter !== 'all' && { estado: filter }),
        ...(searchTerm && { search: searchTerm })
      };
      
      try {
        // Try new API first
        const response = await pedidosAPI.getAll(params);
        
        if (response.data) {
          setPedidos(response.data);
          setError(null);
        } else {
          throw new Error('No se recibieron datos válidos');
        }
      } catch (apiError) {
        console.warn('Falling back to legacy API:', apiError.message);
        
        // Fallback to legacy API
        const response = await getClientPedidos();
        
        if (response.data && response.data.success) {
          let data = response.data.data || [];
          
          // Apply filters manually for legacy API
          if (filter !== 'all') {
            data = data.filter(pedido => pedido.estado === filter);
          }
          
          if (searchTerm) {
            data = data.filter(pedido => 
              pedido.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              pedido.numero_pedido?.toString().includes(searchTerm) ||
              pedido.cliente_nombre?.toLowerCase().includes(searchTerm.toLowerCase())
            );
          }
          
          setPedidos(data);
          setError(null);
        } else {
          throw new Error('Error al cargar pedidos');
        }
      }
    } catch (err) {
      console.error('Error fetching pedidos:', err);
      setError(err.message || 'Error al cargar los pedidos');
      showError('Error al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  }, [filter, searchTerm, showError]);

  const handleStatusChange = async (pedidoId, newStatus) => {
    try {
      setActionLoading(true);
      
      const response = await updateClientPedidoStatus(pedidoId, newStatus);
      
      if (response.data && response.data.success) {
        // Update local state
        setPedidos(prev => prev.map(pedido => 
          pedido.id === pedidoId 
            ? { ...pedido, estado: newStatus }
            : pedido
        ));
        
        success(`Estado del pedido actualizado a: ${newStatus}`);
      } else {
        throw new Error(response.data?.message || 'Error al actualizar estado');
      }
    } catch (err) {
      console.error('Error updating pedido status:', err);
      showError(err.message || 'Error al actualizar el estado del pedido');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'nuevo': return 'bg-yellow-500';
      case 'confirmado': return 'bg-blue-500';
      case 'en_proceso': return 'bg-indigo-500';
      case 'completado': return 'bg-green-500';
      case 'cancelado': return 'bg-red-500';
      case 'en_pausa': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'nuevo': return <Clock className="w-4 h-4" />;
      case 'confirmado': return <CheckCircle className="w-4 h-4" />;
      case 'en_proceso': return <Play className="w-4 h-4" />;
      case 'completado': return <CheckCircle className="w-4 h-4" />;
      case 'cancelado': return <XCircle className="w-4 h-4" />;
      case 'en_pausa': return <Pause className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No especificada';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredPedidos = pedidos.filter(pedido => {
    const statusMatch = filter === 'all' || pedido.estado === filter;
    const searchMatch = searchTerm === '' || 
      pedido.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pedido.numero_pedido?.toString().includes(searchTerm) ||
      pedido.cliente_nombre?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return statusMatch && searchMatch;
  });

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <LoadingSpinner />
          <span className="ml-2">Cargando pedidos...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error al cargar pedidos</h3>
          <p className="text-sm mb-4">{error}</p>
          <Button onClick={fetchPedidos} variant="outline">
            <Package className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              📦 Lista de Pedidos
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Gestiona todos tus pedidos desde aquí
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar pedidos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-80"
              />
            </div>
            
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="nuevo">Nuevo</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="en_proceso">En Proceso</SelectItem>
                <SelectItem value="en_pausa">En Pausa</SelectItem>
                <SelectItem value="completado">Completado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {pedidos.filter(p => p.estado === 'en_proceso').length}
            </div>
            <div className="text-sm text-blue-600">En Proceso</div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {pedidos.filter(p => p.estado === 'nuevo').length}
            </div>
            <div className="text-sm text-yellow-600">Nuevos</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {pedidos.filter(p => p.estado === 'completado').length}
            </div>
            <div className="text-sm text-green-600">Completados</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">
              {pedidos.length}
            </div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
        </div>
      </Card>

      {/* Pedidos Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha Entrega</TableHead>
              <TableHead>Presupuesto</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPedidos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No hay pedidos disponibles</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredPedidos.map((pedido) => (
                <TableRow key={pedido.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">#{pedido.numero_pedido}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {pedido.descripcion}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {pedido.cliente_nombre || 'Cliente no especificado'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(pedido.estado)} text-white`}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(pedido.estado)}
                        {pedido.estado}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {formatDate(pedido.fecha_entrega_estimada || pedido.fecha_entrega_deseada)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">
                        {formatCurrency(pedido.presupuesto_estimado || pedido.total)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedPedido(pedido)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Detalles del Pedido #{pedido.numero_pedido}</DialogTitle>
                          </DialogHeader>
                          {selectedPedido && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Cliente</label>
                                  <p className="text-lg">{selectedPedido.cliente_nombre}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Estado</label>
                                  <Badge className={`${getStatusColor(selectedPedido.estado)} text-white ml-2`}>
                                    {selectedPedido.estado}
                                  </Badge>
                                </div>
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium text-gray-600">Descripción</label>
                                <p className="mt-1">{selectedPedido.descripcion}</p>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Presupuesto</label>
                                  <p className="text-lg font-bold text-green-600">
                                    {formatCurrency(selectedPedido.presupuesto_estimado || selectedPedido.total)}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Fecha Entrega</label>
                                  <p>{formatDate(selectedPedido.fecha_entrega_estimada || selectedPedido.fecha_entrega_deseada)}</p>
                                </div>
                              </div>
                              
                              {selectedPedido.notas && (
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Notas</label>
                                  <p className="mt-1 text-sm text-gray-700">{selectedPedido.notas}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      {/* Status change buttons */}
                      {pedido.estado === 'nuevo' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(pedido.id, 'confirmado')}
                          disabled={actionLoading}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {pedido.estado === 'confirmado' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(pedido.id, 'en_proceso')}
                          disabled={actionLoading}
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {pedido.estado === 'en_proceso' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(pedido.id, 'en_pausa')}
                            disabled={actionLoading}
                          >
                            <Pause className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(pedido.id, 'completado')}
                            disabled={actionLoading}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      
                      {pedido.estado === 'en_pausa' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(pedido.id, 'en_proceso')}
                          disabled={actionLoading}
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default PedidosList;
