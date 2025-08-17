import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useClientData } from '../../contexts/ClientDataContext';
import { 
  FolderOpen,
  Calendar,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Filter,
  Search,
  Download,
  CreditCard,
  Lock
} from 'lucide-react';

const ClientProjects = () => {
  const { projects, fetchProjects, isLoading } = useClientData();
  const [selectedProject, setSelectedProject] = useState(null);
  const [filters, setFilters] = useState({
    estado: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  // Cargar proyectos al montar el componente
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Cerrar menú de descarga al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.download-menu')) {
        setShowDownloadMenu(false);
      }
    };

    if (showDownloadMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showDownloadMenu]);

  // Filtrar proyectos cuando cambien los filtros o los proyectos
  useEffect(() => {
    let filtered = projects || [];
    
    if (filters.estado) {
      filtered = filtered.filter(project => 
        (project.status || project.estado) === filters.estado
      );
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(project => 
        (project.name || project.titulo || '').toLowerCase().includes(searchLower) ||
        (project.description || project.descripcion || '').toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredProjects(filtered);
  }, [projects, filters]);

  const loading = isLoading('projects');

  // Función para descargar información del proyecto
  const downloadProjectInfo = (project, format = 'txt') => {
    const fileName = `proyecto-${project.numero_pedido || project.id}-info`;
    let content, mimeType, extension;

    switch (format) {
      case 'csv':
        content = `Campo,Valor
Número de Proyecto,"${project.numero_pedido || 'N/A'}"
Nombre,"${project.name || 'Sin nombre'}"
Descripción,"${project.description || 'Sin descripción'}"
Servicio,"${project.servicio || 'No especificado'}"
Estado,"${getStatusText(project.status || project.estado)}"
Progreso,"${getProjectProgress(project)}%"
Prioridad,"${project.priority || 'Normal'}"
Presupuesto Estimado,"${formatCurrency(project.presupuesto_estimado)}"
Total Final,"${formatCurrency(project.total)}"
Presupuesto Actual,"${formatCurrency(project.value || project.presupuesto_estimado || project.total)}"
Fecha de Creación,"${formatDate(project.date)}"
Fecha de Inicio,"${formatDate(project.fecha_inicio)}"
Fecha de Entrega Estimada,"${formatDate(project.fecha_entrega_estimada)}"
Fecha de Entrega Deseada,"${formatDate(project.fecha_entrega_deseada)}"
Última Actualización,"${formatDate(project.deliveryDate)}"
Notas Adicionales,"${project.notas_adicionales || 'Sin notas adicionales'}"
Generado el,"${new Date().toLocaleString('es-ES')}"`;
        mimeType = 'text/csv;charset=utf-8';
        extension = 'csv';
        break;

      case 'json': {
        const jsonData = {
          numero_pedido: project.numero_pedido || 'N/A',
          nombre: project.name || 'Sin nombre',
          descripcion: project.description || 'Sin descripción',
          servicio: project.servicio || 'No especificado',
          estado: {
            valor: project.status || project.estado,
            texto: getStatusText(project.status || project.estado),
            progreso: getProjectProgress(project)
          },
          prioridad: project.priority || 'Normal',
          financiero: {
            presupuesto_estimado: project.presupuesto_estimado || 0,
            total_final: project.total || 0,
            presupuesto_actual: project.value || project.presupuesto_estimado || project.total || 0
          },
          fechas: {
            creacion: project.date,
            inicio: project.fecha_inicio,
            entrega_estimada: project.fecha_entrega_estimada,
            entrega_deseada: project.fecha_entrega_deseada,
            ultima_actualizacion: project.deliveryDate
          },
          notas_adicionales: project.notas_adicionales || 'Sin notas adicionales',
          generado_el: new Date().toISOString()
        };
        content = JSON.stringify(jsonData, null, 2);
        mimeType = 'application/json;charset=utf-8';
        extension = 'json';
        break;
      }

      default: // txt
        content = `
INFORMACIÓN DEL PROYECTO
========================

Número de Proyecto: ${project.numero_pedido || 'N/A'}
Nombre: ${project.name || 'Sin nombre'}
Descripción: ${project.description || 'Sin descripción'}
Servicio: ${project.servicio || 'No especificado'}

ESTADO Y PROGRESO
================
Estado: ${getStatusText(project.status || project.estado)}
Progreso: ${getProjectProgress(project)}%
Prioridad: ${project.priority || 'Normal'}

INFORMACIÓN FINANCIERA
======================
Presupuesto Estimado: ${formatCurrency(project.presupuesto_estimado)}
Total Final: ${formatCurrency(project.total)}
Presupuesto Actual: ${formatCurrency(project.value || project.presupuesto_estimado || project.total)}

FECHAS IMPORTANTES
==================
Fecha de Creación: ${formatDate(project.date)}
Fecha de Inicio: ${formatDate(project.fecha_inicio)}
Fecha de Entrega Estimada: ${formatDate(project.fecha_entrega_estimada)}
Fecha de Entrega Deseada: ${formatDate(project.fecha_entrega_deseada)}
Última Actualización: ${formatDate(project.deliveryDate)}

NOTAS ADICIONALES
=================
${project.notas_adicionales || 'Sin notas adicionales'}

---
Documento generado el ${new Date().toLocaleString('es-ES')}
`;
        mimeType = 'text/plain;charset=utf-8';
        extension = 'txt';
        break;
    }

    // Crear y descargar el archivo
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'completado': 
      case 'completed': return 'text-green-600 bg-green-100';
      case 'en_proceso': 
      case 'en proceso':
      case 'en_progreso':
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'confirmado': return 'text-purple-600 bg-purple-100';
      case 'nuevo': 
      case 'new':
      case 'planificado':
      case 'pendiente': return 'text-yellow-600 bg-yellow-100';
      case 'pausado': 
      case 'en_pausa':
      case 'paused': return 'text-orange-600 bg-orange-100';
      case 'cancelado': 
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'completado':
      case 'completed': return CheckCircle;
      case 'en_proceso':
      case 'en proceso':
      case 'en_progreso':
      case 'in_progress': return Clock;
      case 'confirmado': return CheckCircle;
      case 'nuevo':
      case 'new':
      case 'planificado':
      case 'pendiente': return Calendar;
      case 'pausado':
      case 'en_pausa':
      case 'paused': return AlertCircle;
      case 'cancelado':
      case 'cancelled': return AlertCircle;
      default: return FolderOpen;
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
      case 'confirmado': return 'Confirmado - Listo para Pago';
      case 'nuevo':
      case 'new': return 'Nuevo - Esperando Aprobación';
      case 'planificado':
      case 'pendiente': return 'Pendiente';
      case 'pausado':
      case 'en_pausa':
      case 'paused': return 'Pausado';
      case 'cancelado':
      case 'cancelled': return 'Cancelado';
      default: return status || 'Sin estado';
    }
  };

  const handlePayment = (project) => {
    if (project.status === 'confirmado') {
      // Redirigir a la página de pagos o abrir modal de pago
      console.log('Procesando pago para proyecto:', project);
      
      // Aquí se integraría con PayPal, Stripe, u otro gateway de pagos
      const amount = project.value || project.presupuesto_estimado || 0;
      
      // Mostrar confirmación antes de proceder al pago
      const confirmed = window.confirm(
        `¿Confirma que desea proceder con el pago de ${formatCurrency(amount)} para el proyecto "${project.name}"?\n\n` +
        `Se le redirigirá a la plataforma de pagos para completar la transacción.`
      );
      
      if (confirmed) {
        // En un entorno real, aquí se redirigirá a PayPal, Stripe, etc.
        alert(`Redirigiendo a la plataforma de pagos...\n\nMonto: ${formatCurrency(amount)}\nProyecto: ${project.name}\nNúmero de pedido: ${project.numero_pedido || project.id}`);
        
        // Ejemplo de redirección a PayPal:
        // window.location.href = `/api/payments/paypal/create?orderId=${project.id}&amount=${amount}`;
        
        // O navegar a la página interna de pagos:
        // navigate('/client/payments', { state: { project } });
      }
    }
  };

  const isPaymentEnabled = (project) => {
    // El pago está habilitado solo si el pedido está confirmado por el admin
    return project.status === 'confirmado';
  };

  const formatCurrency = (amount) => {
    if (!amount || amount === 0 || isNaN(amount)) {
      return 'No definido';
    }
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

  const getProjectProgress = (project) => {
    // Si el proyecto tiene un campo progress específico, usarlo
    if (project.progress !== undefined && project.progress !== null) {
      return project.progress;
    }
    
    // Si no, calcular basado en el estado
    const status = (project.status || project.estado || '').toLowerCase();
    switch (status) {
      case 'completado':
      case 'completed': return 100;
      case 'en_proceso':
      case 'en proceso':
      case 'en_progreso':
      case 'in_progress': return 60;
      case 'confirmado': return 30;
      case 'nuevo':
      case 'new':
      case 'planificado':
      case 'pendiente': return 10;
      case 'pausado':
      case 'en_pausa':
      case 'paused': return 25;
      case 'cancelado':
      case 'cancelled': return 0;
      default: return 0;
    }
  };

  const ProjectCard = ({ project }) => {
    const [showTeamMembers, setShowTeamMembers] = useState(false);
    const StatusIcon = getStatusIcon(project.status || project.estado);
    
    return (
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {project.name || project.titulo || 'Proyecto sin título'}
              </h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {project.description || project.descripcion || 'Sin descripción disponible'}
              </p>
              
              <div className="flex items-center mb-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status || project.estado)}`}>
                  <StatusIcon className="w-4 h-4 mr-1" />
                  {getStatusText(project.status || project.estado)}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progreso</span>
                  <span>{getProjectProgress(project)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getProjectProgress(project)}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Inicio: {formatDate(project.date || project.fecha_inicio)}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <DollarSign className="w-4 h-4 mr-2" />
                  <span>{formatCurrency(project.value || project.presupuesto_estimado || project.total || project.presupuesto)}</span>
                </div>
              </div>

              {/* Team Members Section */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => setShowTeamMembers(!showTeamMembers)}
                  className="flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <Users className="w-4 h-4 mr-2" />
                  <span>Equipo de Proyecto</span>
                  <svg 
                    className={`w-4 h-4 ml-1 transition-transform ${showTeamMembers ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showTeamMembers && (
                  <div className="mt-2 pl-6 space-y-1">
                    <div className="text-xs text-gray-500">
                      <div>• Project Manager: Admin Team</div>
                      <div>• Developer: Desarrollo Team</div>
                      <div>• Cliente: {project.cliente_nombre || 'Cliente'}</div>
                      {project.team_members && project.team_members.length > 0 ? (
                        project.team_members.map((member, index) => (
                          <div key={index}>• {member.role}: {member.name}</div>
                        ))
                      ) : (
                        <div className="text-gray-400 italic">Equipo estándar asignado</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="ml-4 flex flex-col gap-2">
              <button
                onClick={() => setSelectedProject(project)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Ver detalles"
              >
                <Eye className="w-5 h-5" />
              </button>
              
              {/* Botón de Pago */}
              <button
                onClick={() => handlePayment(project)}
                disabled={!isPaymentEnabled(project)}
                className={`p-2 rounded-lg transition-colors ${
                  isPaymentEnabled(project)
                    ? 'text-green-600 hover:text-green-700 hover:bg-green-50 cursor-pointer'
                    : 'text-gray-300 cursor-not-allowed'
                }`}
                title={
                  isPaymentEnabled(project) 
                    ? `Pagar ${formatCurrency(project.value || project.presupuesto_estimado)} - Proyecto confirmado`
                    : `Pago no disponible - Estado actual: ${getStatusText(project.status)}`
                }
              >
                {isPaymentEnabled(project) ? (
                  <CreditCard className="w-5 h-5" />
                ) : (
                  <Lock className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Technologies */}
          {project.tecnologias && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center flex-wrap gap-2">
                <span className="text-sm text-gray-500 mr-2">Tecnologías:</span>
                {JSON.parse(project.tecnologias).map((tech, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // PropTypes para ProjectCard
  ProjectCard.propTypes = {
    project: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      titulo: PropTypes.string,
      description: PropTypes.string,
      descripcion: PropTypes.string,
      status: PropTypes.string,
      estado: PropTypes.string,
      date: PropTypes.string,
      fecha_inicio: PropTypes.string,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      presupuesto_estimado: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      total: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      presupuesto: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      cliente_nombre: PropTypes.string,
      team_members: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string,
        role: PropTypes.string
      })),
      tecnologias: PropTypes.string
    }).isRequired
  };

  const ProjectModal = ({ project, onClose }) => {
    if (!project) return null;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              {project.name || project.titulo || 'Proyecto sin título'}
            </h3>
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
            {/* Status and Progress */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Estado</label>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status || project.estado)}`}>
                    {getStatusText(project.status || project.estado)}
                  </span>
                  {project.status === 'confirmado' && (
                    <div className="mt-2 text-xs text-green-600 font-medium">
                      ✅ Puede proceder con el pago
                    </div>
                  )}
                  {project.status === 'nuevo' && (
                    <div className="mt-2 text-xs text-yellow-600 font-medium">
                      ⏳ Esperando aprobación del administrador
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Progreso</label>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${getProjectProgress(project)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 mt-1">{getProjectProgress(project)}%</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium text-gray-700">Descripción</label>
              <p className="mt-1 text-sm text-gray-600">
                {project.description || project.descripcion || 'Sin descripción disponible'}
              </p>
            </div>

            {/* Timeline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Fecha de Inicio</label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDate(project.date || project.fecha_inicio)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Fecha de Finalización</label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDate(project.deliveryDate || project.fecha_fin)}
                </p>
              </div>
            </div>

            {/* Budget */}
            <div>
              <label className="text-sm font-medium text-gray-700">Presupuesto</label>
              <p className="mt-1 text-lg font-semibold text-green-600">
                {formatCurrency(project.value || project.presupuesto_estimado || project.total || project.presupuesto)}
              </p>
              {project.presupuesto_estimado > 0 && project.total === 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  * Presupuesto estimado
                </p>
              )}
              {project.total > 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  * Presupuesto final aprobado
                </p>
              )}
            </div>

            {/* Technologies */}
            {project.tecnologias && (
              <div>
                <label className="text-sm font-medium text-gray-700">Tecnologías</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {JSON.parse(project.tecnologias).map((tech, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cerrar
              </button>
              <div className="relative download-menu">
                <button 
                  onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar Info
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showDownloadMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                    <button
                      onClick={() => {
                        downloadProjectInfo(project, 'txt');
                        setShowDownloadMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-md"
                    >
                      📄 Descargar como TXT
                    </button>
                    <button
                      onClick={() => {
                        downloadProjectInfo(project, 'csv');
                        setShowDownloadMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      📊 Descargar como CSV
                    </button>
                    <button
                      onClick={() => {
                        downloadProjectInfo(project, 'json');
                        setShowDownloadMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-b-md"
                    >
                      📋 Descargar como JSON
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // PropTypes para ProjectModal
  ProjectModal.propTypes = {
    project: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      titulo: PropTypes.string,
      description: PropTypes.string,
      descripcion: PropTypes.string,
      status: PropTypes.string,
      estado: PropTypes.string,
      date: PropTypes.string,
      fecha_inicio: PropTypes.string,
      deliveryDate: PropTypes.string,
      fecha_fin: PropTypes.string,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      presupuesto_estimado: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      total: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      presupuesto: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      tecnologias: PropTypes.string
    }).isRequired,
    onClose: PropTypes.func.isRequired
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Proyectos</h1>
          <p className="mt-1 text-sm text-gray-600">
            Gestiona y da seguimiento a todos tus proyectos
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
                Buscar proyecto
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por título o descripción..."
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
                <option value="nuevo">Nuevo</option>
                <option value="confirmado">Confirmado - Listo para Pago</option>
                <option value="pendiente">Pendiente</option>
                <option value="en_progreso">En Proceso</option>
                <option value="completado">Completado</option>
                <option value="pausado">Pausado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay proyectos</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filters.search || filters.estado 
              ? 'No se encontraron proyectos con los filtros aplicados.'
              : 'Aún no tienes proyectos asignados.'
            }
          </p>
        </div>
      )}

      {/* Project Modal */}
      {selectedProject && (
        <ProjectModal 
          project={selectedProject} 
          onClose={() => setSelectedProject(null)} 
        />
      )}
    </div>
  );
};

export default ClientProjects;