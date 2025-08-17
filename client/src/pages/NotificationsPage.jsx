import { useState, useEffect } from 'react';
import { Card, Button, Skeleton } from '../components';
import { Trash2 } from 'lucide-react';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '../api/axios';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Cargar notificaciones desde la API
  
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await getNotifications();
      if (response.data.success) {
        setNotifications(response.data.data);
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
    try {
      const response = await deleteNotification(id);
      if (response.data.success) {
        setNotifications(notifications.filter(notification => notification.id !== id));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (tipo) => {
    switch (tipo) {
      case 'pago_recibido':
        return { icon: '💰', color: 'text-green-600 bg-green-100 dark:bg-green-900/20' };
      case 'nuevo_pedido':
        return { icon: '📋', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20' };
      case 'proyecto_completado':
        return { icon: '✅', color: 'text-green-600 bg-green-100 dark:bg-green-900/20' };
      case 'pago_vencido':
        return { icon: '⚠️', color: 'text-red-600 bg-red-100 dark:bg-red-900/20' };
      case 'mensaje_cliente':
        return { icon: '💬', color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20' };
      case 'sistema':
        return { icon: '⚙️', color: 'text-gray-600 bg-gray-100 dark:bg-gray-900/20' };
      case 'pago_pendiente':
        return { icon: '⏰', color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20' };
      default:
        return { icon: '📢', color: 'text-gray-600 bg-gray-100 dark:bg-gray-900/20' };
    }
  };

  const getNotificationTitle = (tipo) => {
    switch (tipo) {
      case 'pago_recibido': return 'Pago Recibido';
      case 'nuevo_pedido': return 'Nueva Cotización';
      case 'proyecto_completado': return 'Proyecto Completado';
      case 'pago_vencido': return 'Pago Vencido';
      case 'mensaje_cliente': return 'Mensaje de Cliente';
      case 'sistema': return 'Notificación del Sistema';
      case 'pago_pendiente': return 'Pago Pendiente';
      default: return 'Notificación';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread': return !notification.leida;
      case 'read': return notification.leida;
      case 'payments': return ['pago_recibido', 'pago_vencido', 'pago_pendiente'].includes(notification.tipo);
      case 'projects': return ['nuevo_pedido', 'proyecto_completado'].includes(notification.tipo);
      case 'messages': return notification.tipo === 'mensaje_cliente';
      case 'system': return notification.tipo === 'sistema';
      default: return true;
    }
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Hace 1 día';
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    } else {
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const markAsRead = (id) => {
    handleMarkAsRead(id);
  };

  const unreadCount = notifications.filter(n => !n.leida).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Skeleton height="8" width="1/3" className="mb-4" />
            <Skeleton height="4" width="2/3" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} variant="gradient" className="animate-pulse">
                <div className="flex items-start gap-4">
                  <Skeleton variant="circular" width="12" height="12" />
                  <div className="flex-1">
                    <Skeleton height="6" width="1/3" className="mb-2" />
                    <Skeleton height="4" width="full" className="mb-2" />
                    <Skeleton height="4" width="2/3" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-heading font-bold text-gray-800 dark:text-gray-100 mb-4">
                Centro de Notificaciones
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Mantente al día con todas las actividades de tu negocio
                {unreadCount > 0 && (
                  <span className="ml-2 px-2 py-1 bg-red-500 text-white text-sm rounded-full">
                    {unreadCount} sin leer
                  </span>
                )}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button 
                variant="primary" 
                onClick={handleMarkAllAsRead}
                className="whitespace-nowrap"
              >
                Marcar todas como leídas
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <Card variant="gradient" className="mb-8">
          <div className="flex flex-wrap gap-3">
            <Button
              variant={filter === 'all' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Todas ({notifications.length})
            </Button>
            <Button
              variant={filter === 'unread' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('unread')}
            >
              Sin leer ({unreadCount})
            </Button>
            <Button
              variant={filter === 'payments' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('payments')}
            >
              Pagos
            </Button>
            <Button
              variant={filter === 'projects' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('projects')}
            >
              Proyectos
            </Button>
            <Button
              variant={filter === 'messages' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('messages')}
            >
              Mensajes
            </Button>
            <Button
              variant={filter === 'system' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('system')}
            >
              Sistema
            </Button>
          </div>
        </Card>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.map((notification) => {
            const { icon, color } = getNotificationIcon(notification.tipo);
            return (
              <Card 
                key={notification.id} 
                variant="gradient" 
                hover 
                className={`group cursor-pointer transition-all duration-300 ${
                  !notification.leida ? 'ring-2 ring-blue-200 dark:ring-blue-800 bg-blue-50/30 dark:bg-blue-900/10' : ''
                }`}
                onClick={() => !notification.leida && markAsRead(notification.id)}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color} flex-shrink-0`}>
                    <span className="text-xl">{icon}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <h3 className={`font-semibold ${!notification.leida ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                        {getNotificationTitle(notification.tipo)}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(notification.fecha)}
                        </span>
                        {!notification.leida && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('¿Estás seguro de que quieres eliminar esta notificación?')) {
                              handleDelete(notification.id);
                            }
                          }}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          title="Eliminar notificación"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <p className={`leading-relaxed ${!notification.leida ? 'text-gray-800 dark:text-gray-200' : 'text-gray-600 dark:text-gray-400'}`}>
                      {notification.mensaje}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {!notification.leida && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}
                        >
                          Marcar como leída
                        </Button>
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('¿Estás seguro de que quieres eliminar esta notificación?')) {
                          handleDelete(notification.id);
                        }
                      }}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredNotifications.length === 0 && (
          <Card variant="gradient" className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 01-7.5-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No hay notificaciones
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === 'all' 
                ? 'No tienes notificaciones en este momento' 
                : `No hay notificaciones que coincidan con el filtro "${filter}"`
              }
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;