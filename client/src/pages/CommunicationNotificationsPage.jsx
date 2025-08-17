import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Card, Button, Skeleton } from '../components';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '../api/axios';
import { 
  Search, 
  Filter, 
  Bell, 
  Calendar, 
  User, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Eye,
  Trash2,
  Download,
  RefreshCw,
  Mail,
  MessageSquare,
  Info,
  AlertTriangle,
  Zap
} from 'lucide-react';

const CommunicationNotificationsPage = ({ showNavigation = true }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Cargar datos desde las APIs
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const notificationsRes = await getNotifications();

      if (notificationsRes.data.success) {
        setNotifications(notificationsRes.data.data);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      const response = await markNotificationAsRead(id);
      if (response.data.success) {
        setNotifications(notifications.map(notification => 
          notification.id === id ? { ...notification, leida: true } : notification
        ));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await markAllNotificationsAsRead();
      if (response.data.success) {
        setNotifications(notifications.map(notification => ({ 
          ...notification, 
          leida: true 
        })));
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta notificación?')) {
      try {
        const response = await deleteNotification(id);
        if (response.data.success) {
          setNotifications(notifications.filter(notification => notification.id !== id));
        }
      } catch (error) {
        console.error('Error deleting notification:', error);
      }
    }
  };

  const getTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'info': case 'información': return <Info className="w-4 h-4" />;
      case 'warning': case 'advertencia': return <AlertTriangle className="w-4 h-4" />;
      case 'error': case 'fallo': return <XCircle className="w-4 h-4" />;
      case 'success': case 'éxito': return <CheckCircle className="w-4 h-4" />;
      case 'payment': case 'pago': return <Mail className="w-4 h-4" />;
      case 'order': case 'pedido': return <MessageSquare className="w-4 h-4" />;
      case 'system': case 'sistema': return <Zap className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'info': case 'información': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'warning': case 'advertencia': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'error': case 'fallo': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'success': case 'éxito': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'payment': case 'pago': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20';
      case 'order': case 'pedido': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case 'system': case 'sistema': return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'alta': case 'high': return 'border-l-red-500';
      case 'normal': case 'medium': return 'border-l-yellow-500';
      case 'baja': case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-500';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const statusMatch = filter === 'all' || 
      (filter === 'read' && notification.leida) ||
      (filter === 'unread' && !notification.leida);
    
    const typeMatch = typeFilter === 'all' || notification.tipo === typeFilter;
    
    const searchMatch = searchTerm === '' || 
      notification.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.mensaje?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return statusMatch && typeMatch && searchMatch;
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

  const exportNotifications = () => {
    const dataStr = JSON.stringify(filteredNotifications, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `notificaciones_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Calcular estadísticas
  const totalNotifications = notifications.length;
  const unreadNotifications = notifications.filter(n => !n.leida).length;
  const readNotifications = notifications.filter(n => n.leida).length;
  const highPriorityNotifications = notifications.filter(n => n.prioridad?.toLowerCase() === 'alta').length;

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
    <div className={showNavigation ? "min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6" : ""}>
      <div className={showNavigation ? "max-w-7xl mx-auto" : ""}>        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-heading font-bold text-gray-800 dark:text-gray-100 mb-4">
                🔔 Gestión de Notificaciones
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
                Administra todas las notificaciones del sistema y mantente informado de las actividades importantes
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchAllData}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Actualizar
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={exportNotifications}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar
              </Button>
              <Button
                variant="success"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-2"
                disabled={unreadNotifications === 0}
              >
                <CheckCircle className="w-4 h-4" />
                Marcar Todo Leído
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {totalNotifications}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Notificaciones</div>
          </Card>

          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {unreadNotifications}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Sin Leer</div>
          </Card>

          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {readNotifications}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Leídas</div>
          </Card>

          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <div className="text-3xl font-bold text-red-600 mb-2">
              {highPriorityNotifications}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Alta Prioridad</div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card variant="gradient" className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por título o mensaje..."
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
                Todas ({totalNotifications})
              </Button>
              <Button
                variant={filter === 'unread' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                Sin Leer ({unreadNotifications})
              </Button>
              <Button
                variant={filter === 'read' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('read')}
              >
                Leídas ({readNotifications})
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Tipo:
            </span>
            <Button
              variant={typeFilter === 'all' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setTypeFilter('all')}
            >
              Todos
            </Button>
            <Button
              variant={typeFilter === 'info' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setTypeFilter('info')}
            >
              Información
            </Button>
            <Button
              variant={typeFilter === 'warning' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setTypeFilter('warning')}
            >
              Advertencia
            </Button>
            <Button
              variant={typeFilter === 'payment' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setTypeFilter('payment')}
            >
              Pagos
            </Button>
            <Button
              variant={typeFilter === 'system' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setTypeFilter('system')}
            >
              Sistema
            </Button>
          </div>
        </Card>

        {/* Notifications List */}
        <div className="grid gap-6">
          {filteredNotifications.map((notification) => (
            <Card key={notification.id} variant="gradient" hover className={`group border-l-4 ${getPriorityColor(notification.prioridad)} ${!notification.leida ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                      <Bell className="w-5 h-5 inline mr-2" />
                      {notification.titulo || 'Notificación'}
                    </h3>
                    {!notification.leida && (
                      <span className="px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded-full">
                        Nueva
                      </span>
                    )}
                    {notification.tipo && (
                      <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(notification.tipo)}`}>
                        {getTypeIcon(notification.tipo)}
                        {notification.tipo}
                      </span>
                    )}
                    {notification.prioridad && (
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        notification.prioridad?.toLowerCase() === 'alta' ? 'bg-red-100 text-red-800' :
                        notification.prioridad?.toLowerCase() === 'normal' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {notification.prioridad}
                      </span>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-gray-700 dark:text-gray-300 mb-3">
                      {notification.mensaje || 'Sin mensaje'}
                    </p>
                    
                    {notification.datos_adicionales && (
                      <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Información adicional:</p>
                        <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {typeof notification.datos_adicionales === 'string' 
                            ? notification.datos_adicionales 
                            : JSON.stringify(notification.datos_adicionales, null, 2)
                          }
                        </pre>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(notification.createdAt)}</span>
                    </div>
                    {notification.usuario_id && (
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>Usuario: {notification.usuario_id}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row xl:flex-col gap-3 xl:w-48">
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => {
                      setSelectedNotification(notification);
                      setShowModal(true);
                      if (!notification.leida) {
                        handleMarkAsRead(notification.id);
                      }
                    }}
                  >
                    <Eye className="w-4 h-4" />
                    Ver Detalles
                  </Button>
                  
                  {!notification.leida && (
                    <Button 
                      variant="success" 
                      size="sm" 
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Marcar Leída
                    </Button>
                  )}
                  
                  <Button 
                    variant="danger" 
                    size="sm" 
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => handleDelete(notification.id)}
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
        {filteredNotifications.length === 0 && (
          <Card variant="gradient" className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Bell className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No hay notificaciones
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === 'all' ? 'No se han registrado notificaciones aún' : `No hay notificaciones ${filter === 'read' ? 'leídas' : 'sin leer'}`}
            </p>
          </Card>
        )}

        {/* Notification Details Modal */}
        {showModal && selectedNotification && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    Detalles de la Notificación
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
                    {selectedNotification.tipo && (
                      <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(selectedNotification.tipo)}`}>
                        {getTypeIcon(selectedNotification.tipo)}
                        {selectedNotification.tipo}
                      </span>
                    )}
                    {!selectedNotification.leida && (
                      <span className="px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded-full">
                        No leída
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Título
                    </label>
                    <p className="text-gray-900 dark:text-gray-100">{selectedNotification.titulo || 'Sin título'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Mensaje
                    </label>
                    <p className="text-gray-900 dark:text-gray-100">{selectedNotification.mensaje || 'Sin mensaje'}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Fecha de Creación
                      </label>
                      <p className="text-gray-900 dark:text-gray-100">{formatDate(selectedNotification.createdAt)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Prioridad
                      </label>
                      <p className="text-gray-900 dark:text-gray-100">{selectedNotification.prioridad || 'No especificada'}</p>
                    </div>
                  </div>

                  {selectedNotification.datos_adicionales && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Datos Adicionales
                      </label>
                      <div className="bg-gray-100 dark:bg-slate-700 p-3 rounded">
                        <pre className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                          {typeof selectedNotification.datos_adicionales === 'string' 
                            ? selectedNotification.datos_adicionales 
                            : JSON.stringify(selectedNotification.datos_adicionales, null, 2)
                          }
                        </pre>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t">
                    {!selectedNotification.leida && (
                      <Button 
                        variant="success" 
                        className="flex items-center gap-2"
                        onClick={() => {
                          handleMarkAsRead(selectedNotification.id);
                          setShowModal(false);
                        }}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Marcar como Leída
                      </Button>
                    )}
                    <Button 
                      variant="danger" 
                      className="flex items-center gap-2"
                      onClick={() => {
                        handleDelete(selectedNotification.id);
                        setShowModal(false);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </Button>
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

CommunicationNotificationsPage.propTypes = {
  showNavigation: PropTypes.bool
};

export default CommunicationNotificationsPage;