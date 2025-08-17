import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Card, Button } from '../components';
import ImageUpload from '../components/ImageUpload';
import api from '../api/axios';
import { 
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  ExternalLink,
  Code,
  Globe,
  Smartphone,
  Server,
  Database,
  Save,
  X,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

const ProjectsAdminPage = ({ showNavigation = true }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  
  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  // Modal para crear/editar
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    imagen: '',
    url: '',
    demo: '',
    tecnologias: [],
    categoria: 'web',
    estado: 'planificacion'
  });
  const [newTech, setNewTech] = useState('');

  const categories = [
    { id: 'all', label: 'Todas las categorías', icon: Globe },
    { id: 'web', label: 'Desarrollo Web', icon: Globe },
    { id: 'app', label: 'Aplicaciones', icon: Smartphone },
    { id: 'system', label: 'Sistemas', icon: Server },
    { id: 'api', label: 'APIs', icon: Database }
  ];

  const statusOptions = [
    { id: 'all', label: 'Todos los estados' },
    { id: 'planificacion', label: 'Planificación' },
    { id: 'desarrollo', label: 'Desarrollo' },
    { id: 'revision', label: 'Revisión' },
    { id: 'completado', label: 'Completado' },
    { id: 'mantenimiento', label: 'Mantenimiento' }
  ];

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/projects');
      if (response.data.success) {
        setProjects(response.data.data);
      } else {
        showMessage('Error al cargar los proyectos', 'error');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      showMessage('Error al conectar con el servidor', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateProject = () => {
    setEditingProject(null);
    setFormData({
      nombre: '',
      descripcion: '',
      imagen: '',
      url: '',
      demo: '',
      tecnologias: [],
      categoria: 'web',
      estado: 'planificacion'
    });
    setShowModal(true);
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setFormData({
      nombre: project.nombre || '',
      descripcion: project.descripcion || '',
      imagen: project.imagen || '',
      url: project.url || '',
      demo: project.demo || '',
      tecnologias: project.tecnologias || [],
      categoria: project.categoria || 'web',
      estado: project.estado || 'planificacion'
    });
    setShowModal(true);
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este proyecto?')) {
      return;
    }

    try {
      setSaving(true);
      await api.delete(`/api/projects/${id}`);
      await fetchProjects();
      showMessage('Proyecto eliminado exitosamente', 'success');
    } catch (error) {
      console.error('Error deleting project:', error);
      showMessage('Error al eliminar el proyecto', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProject = async () => {
    if (!formData.nombre || !formData.descripcion) {
      showMessage('Nombre y descripción son requeridos', 'error');
      return;
    }

    try {
      setSaving(true);
      
      if (editingProject) {
        await api.put(`/api/projects/${editingProject.id}`, formData);
        showMessage('Proyecto actualizado exitosamente', 'success');
      } else {
        await api.post('/api/projects', formData);
        showMessage('Proyecto creado exitosamente', 'success');
      }
      
      setShowModal(false);
      await fetchProjects();
    } catch (error) {
      console.error('Error saving project:', error);
      showMessage('Error al guardar el proyecto', 'error');
    } finally {
      setSaving(false);
    }
  };

  const addTechnology = () => {
    if (newTech.trim() && !formData.tecnologias.includes(newTech.trim())) {
      setFormData(prev => ({
        ...prev,
        tecnologias: [...prev.tecnologias, newTech.trim()]
      }));
      setNewTech('');
    }
  };

  const removeTechnology = (tech) => {
    setFormData(prev => ({
      ...prev,
      tecnologias: prev.tecnologias.filter(t => t !== tech)
    }));
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);
  };

  // Filtrar proyectos
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || project.categoria === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || project.estado === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getCategoryIcon = (categoria) => {
    const category = categories.find(cat => cat.id === categoria);
    const IconComponent = category?.icon || Globe;
    return <IconComponent className="w-5 h-5" />;
  };

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'planificacion':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200';
      case 'desarrollo':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      case 'revision':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200';
      case 'completado':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      case 'mantenimiento':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className={showNavigation ? "min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6" : "p-6"}>
        <div className={showNavigation ? "max-w-7xl mx-auto" : ""}>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
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
                🎨 Gestión de Proyectos
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
                Administra el portfolio de proyectos que se muestran en la página pública
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateProject}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nuevo Proyecto
            </Button>
          </div>

          {/* Message */}
          {message && (
            <div className={`mt-4 p-4 rounded-lg flex items-center gap-2 ${
              messageType === 'success' 
                ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
            }`}>
              {messageType === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              {message}
            </div>
          )}
        </div>

        {/* Filters */}
        <Card variant="gradient" className="p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar proyectos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white appearance-none"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            >
              {statusOptions.map(status => (
                <option key={status.id} value={status.id}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} variant="gradient" className="overflow-hidden">
              {/* Project Image */}
              <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
                {project.imagen ? (
                  <img
                    src={project.imagen}
                    alt={project.nombre}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=400&q=80';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Code className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.estado)}`}>
                    {project.estado}
                  </span>
                </div>
              </div>

              <div className="p-6">
                {/* Project Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(project.categoria)}
                    <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {project.categoria}
                    </span>
                  </div>
                </div>

                {/* Project Info */}
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2 line-clamp-1">
                  {project.nombre}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                  {project.descripcion}
                </p>

                {/* Technologies */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {project.tecnologias?.slice(0, 3).map((tech, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-violet-100 dark:bg-violet-900/20 text-violet-800 dark:text-violet-200 text-xs rounded-md"
                    >
                      {tech}
                    </span>
                  ))}
                  {project.tecnologias?.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-md">
                      +{project.tecnologias.length - 3}
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {project.demo && (
                      <a
                        href={project.demo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-500 hover:text-violet-600 transition-colors"
                        title="Ver Demo"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                    )}
                    {project.url && (
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-500 hover:text-violet-600 transition-colors"
                        title="Ver Código"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditProject(project)}
                      className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                      title="Eliminar"
                      disabled={saving}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <Card variant="gradient" className="p-12 text-center">
            <Code className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
              No se encontraron proyectos
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all'
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Comienza creando tu primer proyecto'
              }
            </p>
            {!searchTerm && selectedCategory === 'all' && selectedStatus === 'all' && (
              <Button
                variant="primary"
                onClick={handleCreateProject}
                className="flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Crear Primer Proyecto
              </Button>
            )}
          </Card>
        )}

        {/* Modal para Crear/Editar Proyecto */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    {editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Nombre */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nombre del Proyecto *
                    </label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                      placeholder="Ej: Landing Page Corporativa"
                    />
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Descripción *
                    </label>
                    <textarea
                      value={formData.descripcion}
                      onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                      placeholder="Describe el proyecto y sus características principales..."
                    />
                  </div>

                  {/* Imagen del Proyecto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Imagen del Proyecto
                    </label>
                    <ImageUpload
                      currentImage={formData.imagen}
                      onImageUploaded={(imageUrl) => setFormData(prev => ({ ...prev, imagen: imageUrl }))}
                      placeholder="Subir imagen del proyecto"
                    />
                  </div>

                  {/* URLs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        URL del Demo
                      </label>
                      <input
                        type="url"
                        value={formData.demo}
                        onChange={(e) => setFormData(prev => ({ ...prev, demo: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                        placeholder="https://demo.ejemplo.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      URL del Repositorio
                    </label>
                    <input
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                      placeholder="https://github.com/usuario/proyecto"
                    />
                  </div>

                  {/* Categoría y Estado */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Categoría
                      </label>
                      <select
                        value={formData.categoria}
                        onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                      >
                        <option value="web">Desarrollo Web</option>
                        <option value="app">Aplicaciones</option>
                        <option value="system">Sistemas</option>
                        <option value="api">APIs</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Estado
                      </label>
                      <select
                        value={formData.estado}
                        onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                      >
                        <option value="planificacion">Planificación</option>
                        <option value="desarrollo">Desarrollo</option>
                        <option value="revision">Revisión</option>
                        <option value="completado">Completado</option>
                        <option value="mantenimiento">Mantenimiento</option>
                      </select>
                    </div>
                  </div>

                  {/* Tecnologías */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tecnologías
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newTech}
                        onChange={(e) => setNewTech(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                        placeholder="Ej: React, Node.js, MongoDB..."
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={addTechnology}
                        className="px-4"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.tecnologias.map((tech, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-violet-100 dark:bg-violet-900/20 text-violet-800 dark:text-violet-200 text-sm rounded-full"
                        >
                          {tech}
                          <button
                            type="button"
                            onClick={() => removeTechnology(tech)}
                            className="ml-1 hover:text-violet-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
                  <Button
                    variant="secondary"
                    onClick={() => setShowModal(false)}
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSaveProject}
                    disabled={saving}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Guardando...' : editingProject ? 'Actualizar' : 'Crear Proyecto'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

ProjectsAdminPage.propTypes = {
  showNavigation: PropTypes.bool
};

export default ProjectsAdminPage;