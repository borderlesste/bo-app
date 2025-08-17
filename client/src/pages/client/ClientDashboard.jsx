import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useClientData } from '../../contexts/ClientDataContext';
import { 
  FolderOpen, 
  FileText, 
  CreditCard, 
  Clock,
  CheckCircle,
  Calendar,
  DollarSign,
  Plus
} from 'lucide-react';

const ClientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Usar contexto optimizado
  const {
    stats,
    projects,
    fetchStats,
    fetchProjects,
    isLoading
  } = useClientData();

  // Cargar datos al montar el componente
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchStats(),
        fetchProjects(3) // Solo 3 proyectos para el dashboard
      ]);
    };
    
    loadData();
  }, [fetchStats, fetchProjects]);

  const isDashboardLoading = isLoading('stats') || isLoading('projects');
  const recentProjects = projects.slice(0, 3); // Asegurar máximo 3 proyectos

  // TODO: Reemplaza esto con la lógica real para obtener facturas recientes
  const recentInvoices = []; // Array vacío temporal para evitar errores

  const getStatusColor = (status) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'completado': 
      case 'completed': return 'text-green-600 bg-green-100';
      case 'en_proceso': 
      case 'en proceso':
      case 'en_progreso':
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'nuevo': 
      case 'new':
      case 'planificado':
      case 'pendiente': return 'text-yellow-600 bg-yellow-100';
      case 'pausado': 
      case 'paused': return 'text-orange-600 bg-orange-100';
      case 'cancelado': 
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'completado':
      case 'completed': return 'Completado';
      case 'en_proceso':
      case 'en proceso':
      case 'en_progreso':
      case 'in_progress': return 'En Proceso';
      case 'nuevo':
      case 'new': return 'Nuevo';
      case 'planificado':
      case 'pendiente': return 'Pendiente';
      case 'pausado':
      case 'paused': return 'Pausado';
      case 'cancelado':
      case 'cancelled': return 'Cancelado';
      default: return status || 'Sin estado';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isDashboardLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          ¡Bienvenido, {user?.nombre}! 👋
        </h1>
        <p className="text-blue-100">
          Aquí tienes un resumen de tus proyectos y actividad reciente.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FolderOpen className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Proyectos Totales
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.totalProyectos || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    En Progreso
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.proyectosEnProgreso || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Completados
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.proyectosCompletados || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Inversión Total
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(stats?.inversionTotal || 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Proyectos Recientes
              </h3>
              <button 
                onClick={() => navigate('/client/projects')}
                className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
              >
                Ver todos
              </button>
            </div>
            
            {recentProjects.length > 0 ? (
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {project.name}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {project.description ? 
                          `${project.description.substring(0, 60)}${project.description.length > 60 ? '...' : ''}` 
                          : 'Sin descripción disponible'
                        }
                      </p>
                      <div className="flex items-center mt-2 space-x-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                          {getStatusText(project.status)}
                        </span>
                        {project.value > 0 && (
                          <span className="text-xs text-gray-500">
                            {formatCurrency(project.value)}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {project.date ? new Date(project.date).toLocaleDateString('es-ES') : 'Sin fecha'}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay proyectos</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Aún no tienes proyectos asignados.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Facturas Recientes
              </h3>
              <button 
                onClick={() => navigate('/client/invoices')}
                className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
              >
                Ver todas
              </button>
            </div>
            
            {/* Temporalmente deshabilitado hasta implementar facturas */}
            {/* TODO: Reemplaza 'hasInvoices' con la condición real cuando implementes facturas */}
            {/* Reemplaza 'recentInvoices' con tu array real de facturas cuando esté disponible */}
            {(Array.isArray(recentInvoices) && recentInvoices.length > 0) ? (
              <div className="space-y-4">
                {recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {invoice.numero_factura}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDate(invoice.fecha_emision)}
                      </p>
                      <div className="flex items-center mt-2 space-x-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          invoice.estado === 'pagada' ? 'text-green-600 bg-green-100' :
                          invoice.estado === 'pendiente' ? 'text-yellow-600 bg-yellow-100' :
                          'text-red-600 bg-red-100'
                        }`}>
                          {invoice.estado === 'pagada' ? 'Pagada' :
                           invoice.estado === 'pendiente' ? 'Pendiente' : 'Vencida'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(invoice.total)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay facturas</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Aún no tienes facturas generadas.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Acciones Rápidas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              onClick={() => navigate('/client/nueva-solicitud')}
              className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
            >
              <Plus className="h-6 w-6 text-green-600 mr-3 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-green-600">Nueva Solicitud</span>
            </button>
            
            <button 
              onClick={() => navigate('/client/projects')}
              className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
            >
              <FolderOpen className="h-6 w-6 text-blue-600 mr-3 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-blue-600">Ver Proyectos</span>
            </button>
            
            <button 
              onClick={() => navigate('/client/quotations')}
              className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group"
            >
              <FileText className="h-6 w-6 text-purple-600 mr-3 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-purple-600">Cotizaciones</span>
            </button>
            
            <button 
              onClick={() => navigate('/client/invoices')}
              className="flex items-center p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors group"
            >
              <CreditCard className="h-6 w-6 text-orange-600 mr-3 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-orange-600">Facturas</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;