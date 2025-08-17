import { useState, useEffect } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../api/axios';
import logger from '../utils/logger';
import { useTranslation } from '../hooks/useTranslation';

function Portfolio() {
  const { t } = useTranslation();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/api/projects');
      
      if (response && response.data) {
        // Handle different response structures
        let projectsData = [];
        
        if (response.data.success && Array.isArray(response.data.data)) {
          projectsData = response.data.data;
        } else if (Array.isArray(response.data.projects)) {
          projectsData = response.data.projects;
        } else if (Array.isArray(response.data)) {
          projectsData = response.data;
        }
        
        setProjects(projectsData);
      } else {
        setProjects([]);
      }
    } catch (err) {
      logger.setContext('Portfolio').error('Error fetching projects:', err);
      setProjects([]);
      setError('Error al cargar proyectos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="mb-4">{error}</p>
          <button 
            onClick={fetchProjects}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-body bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative text-white py-20 lg:py-32 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{backgroundImage: "url('https://borderlesstechno.com/header.jpeg')"}}></div>
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-800/85 to-slate-700/80"></div>
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-gradient-to-br from-blue-200/20 to-cyan-200/20 rounded-full blur-sm animate-pulse" style={{animationDelay: '0s'}}></div>
          <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-gradient-to-br from-cyan-200/20 to-blue-200/20 rounded-full blur-sm animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-1/3 left-1/3 w-3 h-3 bg-gradient-to-br from-blue-200/15 to-cyan-200/15 rounded-full blur-lg animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-fadeIn">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
{t('portfolio.title')}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
              {t('portfolio.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="py-20 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {Array.isArray(projects) && projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {projects.map((project, index) => (
                <div key={project?.id || index} className="group bg-white dark:bg-slate-800/50 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden border border-gray-200 dark:border-slate-700/30">
                  {project?.imagen && (
                    <div className="relative h-64 overflow-hidden">
                      <img 
                        src={project.imagen} 
                        alt={project.nombre || 'Proyecto'}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=400&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  )}
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {project?.nombre || 'Sin título'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                      {project?.descripcion || 'Sin descripción disponible'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📂</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                No hay proyectos disponibles
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Los proyectos se mostrarán aquí cuando estén disponibles.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Portfolio;