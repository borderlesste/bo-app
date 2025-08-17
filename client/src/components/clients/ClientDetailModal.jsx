import { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  MapPin, 
  Calendar, 
  FileText,
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  Activity,
  Eye
} from 'lucide-react';
import PropTypes from 'prop-types';
import { getClient } from '../../api/axios';
import { useToast } from '../ui/use-toast';

const ClientDetailModal = ({ isOpen, onClose, usuarioId }) => {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen && usuarioId) {
      loadClientDetail();
    }
  }, [isOpen, usuarioId, loadClientDetail]);

  const loadClientDetail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getClient(usuarioId);
      
      if (response.data.success) {
        setClient(response.data.data);
      }
    } catch (error) {
      console.error('Error loading client detail:', error);
      addToast('Error al cargar detalles del cliente', 'error');
    } finally {
      setLoading(false);
    }
  }, [usuarioId, addToast]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getProjectStatusBadge = (estado) => {
    const badges = {
      completado: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      en_desarrollo: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      planificacion: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      pausado: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    };
    return badges[estado] || badges.planificacion;
  };

  const getProjectStatusIcon = (estado) => {
    const icons = {
      completado: CheckCircle,
      en_desarrollo: Clock,
      planificacion: AlertCircle,
      pausado: Package
    };
    return icons[estado] || AlertCircle;
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"></div>
          <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-slate-800 shadow-xl rounded-lg">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!client) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-slate-800 shadow-xl rounded-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-4">
                <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">
                  {client.nombre.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {client.nombre}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {client.empresa || 'Cliente individual'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-slate-700 mb-6">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Eye className="w-4 h-4 inline mr-2" />
                Resumen
              </button>
              <button
                onClick={() => setActiveTab('projects')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'projects'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Package className="w-4 h-4 inline mr-2" />
                Proyectos ({client.projects.length})
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'activity'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Activity className="w-4 h-4 inline mr-2" />
                Actividad
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Información Personal */}
                <div className="bg-gray-50 dark:bg-slate-700 p-6 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Información Personal
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <User className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Nombre</div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {client.nombre}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Mail className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Email</div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {client.email}
                        </div>
                      </div>
                    </div>

                    {client.telefono && (
                      <div className="flex items-center">
                        <Phone className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Teléfono</div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {client.telefono}
                          </div>
                        </div>
                      </div>
                    )}

                    {client.empresa && (
                      <div className="flex items-center">
                        <Building2 className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Empresa</div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {client.empresa}
                          </div>
                        </div>
                      </div>
                    )}

                    {client.rfc && (
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">RFC</div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {client.rfc}
                          </div>
                        </div>
                      </div>
                    )}

                    {client.direccion && (
                      <div className="flex items-start">
                        <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-1" />
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Dirección</div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {client.direccion}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Cliente desde</div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {formatDate(client.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Estadísticas */}
                <div className="bg-gray-50 dark:bg-slate-700 p-6 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Estadísticas
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {client.statistics.total_proyectos}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Total Proyectos
                      </div>
                    </div>

                    <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {client.statistics.proyectos_completados}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Completados
                      </div>
                    </div>

                    <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {client.statistics.proyectos_en_desarrollo}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        En Desarrollo
                      </div>
                    </div>

                    <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {client.statistics.proyectos_planificacion}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        En Planificación
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'projects' && (
              <div className="space-y-4">
                {client.projects.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                      Sin proyectos
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Este cliente aún no tiene proyectos asignados.
                    </p>
                  </div>
                ) : (
                  client.projects.map((project) => {
                    const StatusIcon = getProjectStatusIcon(project.estado);
                    return (
                      <div
                        key={project.id}
                        className="bg-white dark:bg-slate-700 p-6 rounded-lg border border-gray-200 dark:border-slate-600"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <h5 className="text-lg font-medium text-gray-900 dark:text-white">
                                {project.nombre}
                              </h5>
                              <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                                #{project.codigo}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                              {project.descripcion}
                            </p>
                            <div className="mt-3 flex items-center text-sm text-gray-500 dark:text-gray-400">
                              <Calendar className="w-4 h-4 mr-1" />
                              Creado: {formatDate(project.created_at)}
                            </div>
                          </div>
                          <div className="ml-4 flex flex-col items-end">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getProjectStatusBadge(project.estado)}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {project.estado.replace('_', ' ')}
                            </span>
                            <span className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                              {project.categoria}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-4">
                {client.activities.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                      Sin actividad
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      No hay actividad registrada para este cliente.
                    </p>
                  </div>
                ) : (
                  <div className="flow-root">
                    <ul className="-mb-8">
                      {client.activities.map((activity, index) => (
                        <li key={index}>
                          <div className="relative pb-8">
                            {index !== client.activities.length - 1 && (
                              <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-slate-600" />
                            )}
                            <div className="relative flex space-x-3">
                              <div>
                                <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white dark:ring-slate-800">
                                  <Activity className="w-4 h-4 text-white" />
                                </span>
                              </div>
                              <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                <div>
                                  <p className="text-sm text-gray-900 dark:text-white">
                                    {activity.descripcion}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Tipo: {activity.tipo}
                                    {activity.entidad_tipo && ` • ${activity.entidad_tipo}`}
                                  </p>
                                </div>
                                <div className="text-right text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                                  {formatDate(activity.created_at)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-slate-700 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

ClientDetailModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  usuarioId: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ])
};

export default ClientDetailModal;