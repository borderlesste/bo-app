import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { User, CreditCard, Clock, CheckCircle, AlertCircle, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { getClientStats, getClientProjects, getClientPayments, getClientActivity } from '../../api/axios';
import LoadingSpinner from '../LoadingSpinner';

const ClientStatsPanel = ({ clientData: propClientData, formatCurrency, className = '' }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [animations, setAnimations] = useState({});
  const [clientData, setClientData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [payments, setPayments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para cargar datos del cliente desde la API
  const loadClientData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statsResponse, projectsResponse, paymentsResponse, activityResponse] = await Promise.all([
        getClientStats(),
        getClientProjects(),
        getClientPayments(),
        getClientActivity()
      ]);
      
      setClientData(statsResponse.data);
      setProjects(projectsResponse.data);
      setPayments(paymentsResponse.data);
      setActivity(activityResponse.data);
    } catch (err) {
      console.error('Error al cargar datos del cliente:', err);
      setError('Error al cargar los datos del dashboard');
      setClientData(null);
    } finally {
      setLoading(false);
    }
  };

  const stats = propClientData || clientData || {};

  useEffect(() => {
    // Cargar datos del cliente al montar el componente
    if (!propClientData) {
      loadClientData();
    }
    
    // Animaciones de entrada
    const timer = setTimeout(() => {
      setAnimations({
        projects: true,
        payments: true,
        quotes: true
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [propClientData]);

  const quickStats = [
    {
      title: 'Proyectos Activos',
      value: stats.projects?.active || 0,
      icon: Clock,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      subtitle: `${stats.projects?.total || 0} en total`
    },
    {
      title: 'Completados',
      value: stats.projects?.completed || 0,
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      subtitle: 'Proyectos finalizados'
    },
    {
      title: 'Pagos Pendientes',
      value: formatCurrency(stats.payments?.pending || 0),
      icon: CreditCard,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800',
      subtitle: (stats.payments?.overdue || 0) > 0 ? `${formatCurrency(stats.payments.overdue)} vencido` : 'Todo al día'
    },
    {
      title: 'Notificaciones',
      value: stats.notifications?.unread || 0,
      icon: AlertCircle,
      color: (stats.notifications?.urgent || 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400',
      bgColor: (stats.notifications?.urgent || 0) > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-800',
      borderColor: (stats.notifications?.urgent || 0) > 0 ? 'border-red-200 dark:border-red-800' : 'border-gray-200 dark:border-gray-700',
      subtitle: `${stats.notifications?.urgent || 0} urgentes`
    }
  ];

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: TrendingUp },
    { id: 'projects', label: 'Proyectos', icon: CheckCircle },
    { id: 'payments', label: 'Pagos', icon: DollarSign },
    { id: 'activity', label: 'Actividad', icon: Calendar }
  ];

  const ProjectProgress = ({ completed, total }) => {
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    
    return (
      <div className="w-full">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
          <span>Progreso de Proyectos</span>
          <span>{percentage.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    );
  };

  ProjectProgress.propTypes = {
    completed: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Estado de la Cuenta
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Estado:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400 capitalize">
                      {stats.personalInfo?.status || 'active'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Cliente desde:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {stats.personalInfo?.joinDate ? new Date(stats.personalInfo.joinDate).toLocaleDateString('es-ES') : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total gastado:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(stats.payments?.paid || 0)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Progreso General
                </h3>
                <ProjectProgress completed={stats.projects?.completed || 0} total={stats.projects?.total || 0} />
                <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  {stats.projects?.completed || 0} de {stats.projects?.total || 0} proyectos completados
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Próximos Vencimientos
              </h3>
              <div className="space-y-3">
                {(stats.payments?.pending || 0) > 0 && (
                  <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center">
                      <CreditCard className="w-4 h-4 text-orange-600 mr-2" />
                      <span className="text-orange-800 dark:text-orange-400">Pago pendiente</span>
                    </div>
                    <span className="font-semibold text-orange-900 dark:text-orange-300">
                      {formatCurrency(stats.payments?.pending || 0)}
                    </span>
                  </div>
                )}
                
                {(stats.notifications?.urgent || 0) > 0 && (
                  <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="flex items-center">
                      <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                      <span className="text-red-800 dark:text-red-400">Notificaciones urgentes</span>
                    </div>
                    <span className="font-semibold text-red-900 dark:text-red-300">
                      {stats.notifications?.urgent || 0}
                    </span>
                  </div>
                )}

                {(stats.payments?.pending || 0) === 0 && (stats.notifications?.urgent || 0) === 0 && (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    🎉 ¡Todo está al día! No tienes pendientes urgentes.
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'projects':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800 text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.projects?.active || 0}
                </div>
                <div className="text-sm text-blue-800 dark:text-blue-400">Activos</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800 text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.projects?.completed || 0}
                </div>
                <div className="text-sm text-green-800 dark:text-green-400">Completados</div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800 text-center">
                <div className="text-sm text-orange-800 dark:text-orange-400">Pendientes</div>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {stats.projects?.pending || 0}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Historial de Proyectos
              </h3>
              <div className="space-y-3">
                {projects.length > 0 ? projects.slice(0, 5).map((project, index) => (
                  <div key={project.id || index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{project.name || 'Proyecto sin nombre'}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(project.date).toLocaleDateString('es-ES')}
                      </div>
                      {project.value && (
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {formatCurrency(project.value)}
                        </div>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      project.status?.toLowerCase() === 'completado' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400' :
                      project.status?.toLowerCase() === 'en_proceso' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400' :
                      'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-400'
                    }`}>
                      {project.status || 'pendiente'}
                    </span>
                  </div>
                )) : (
                  <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p>No hay proyectos registrados</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'payments':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-400 mb-2">
                  Total Pagado
                </h3>
                <div className="text-3xl font-bold text-green-900 dark:text-green-300">
                  {formatCurrency(stats.payments?.paid || 0)}
                </div>
              </div>
              
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800">
                <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-400 mb-2">
                  Pendiente
                </h3>
                <div className="text-3xl font-bold text-orange-900 dark:text-orange-300">
                  {formatCurrency(stats.payments?.pending || 0)}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Historial de Pagos
              </h3>
              <div className="space-y-3">
                {payments.length > 0 ? payments.slice(0, 5).map((payment, index) => (
                  <div key={payment.id || index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{payment.concept}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(payment.date).toLocaleDateString('es-ES')}
                      </div>
                      {payment.method && (
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          Método: {payment.method}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(payment.amount)}
                      </div>
                      <span className={`text-xs font-medium ${
                        payment.status?.toLowerCase() === 'pagado' ? 'text-green-600 dark:text-green-400' : 
                        payment.status?.toLowerCase() === 'vencido' ? 'text-red-600 dark:text-red-400' :
                        'text-orange-600 dark:text-orange-400'
                      }`}>
                        {payment.status || 'pendiente'}
                      </span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                    <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p>No hay pagos registrados</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'activity':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Actividad Reciente
            </h3>
            <div className="space-y-4">
              {activity.length > 0 ? activity.slice(0, 10).map((activityItem, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    activityItem.type === 'payment' ? 'bg-green-600' :
                    activityItem.type === 'project' ? 'bg-blue-600' :
                    'bg-gray-600'
                  }`}></div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">{activityItem.message}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {activityItem.type && (
                        <span className="capitalize">{activityItem.type} • </span>
                      )}
                      Prioridad: {activityItem.priority || 'normal'}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    {new Date(activityItem.time).toLocaleDateString('es-ES')}
                  </div>
                </div>
              )) : (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  <p>No hay actividad reciente</p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Mostrar loading si estamos cargando y no hay datos prop
  if (loading && !propClientData) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando datos del dashboard...</span>
        </div>
      </div>
    );
  }

  // Mostrar error si hay error y no hay datos
  if (error && !stats.personalInfo) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">Error al cargar datos</h3>
          <p className="text-red-600 dark:text-red-500 mb-4">{error}</p>
          <button 
            onClick={loadClientData}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with client info */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl p-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{stats.personalInfo?.name || 'Cliente'}</h1>
            <p className="text-blue-100">{stats.personalInfo?.email || 'email@cliente.com'}</p>
            <p className="text-blue-200 text-sm">
              Cliente desde {stats.personalInfo?.joinDate ? new Date(stats.personalInfo.joinDate).toLocaleDateString('es-ES') : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`${stat.bgColor} rounded-xl p-4 border ${stat.borderColor} transition-all duration-300 hover:scale-105 ${
                animations.projects ? 'animate-fade-in' : 'opacity-0'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {stat.title}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {stat.subtitle}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs navigation */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 rounded-md font-medium transition-colors flex-1 justify-center ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="transition-all duration-300">
        {renderTabContent()}
      </div>
    </div>
  );
};

ClientStatsPanel.propTypes = {
  clientData: PropTypes.object,
  formatCurrency: PropTypes.func.isRequired,
  className: PropTypes.string
};

export default ClientStatsPanel;