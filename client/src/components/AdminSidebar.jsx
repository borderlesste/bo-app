import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';

const AdminSidebar = ({ isOpen, onToggle, onOptionSelect, activeOption }) => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-expandir la sección correspondiente basada en la ruta actual
  useEffect(() => {
    const path = location.pathname;
    if (['/cotizaciones', '/pedidos', '/historial'].includes(path)) {
      setActiveSection('orders');
    } else if (path === '/admin/dashboard') {
      setActiveSection('clients'); // Expandir "Gestión de Clientes" por defecto en AdminDashboard
    }
  }, [location.pathname]);

  // Enlaces administrativos organizados por secciones siguiendo mejores prácticas
  const adminSections = [
    {
      id: 'dashboard',
      title: 'Panel Principal',
      icon: '📊',
      //isAlwaysOpen: true, // Panel principal siempre visible
      links: [
       // { id: 'dashboard', label: 'Dashboard', icon: '📈', route: '/admin/dashboard' },
        { id: 'overview', label: 'Resumen General', icon: '📋' },
        { id: 'analytics', label: 'Análisis Avanzado', icon: '📊' },
        { id: 'quick-stats', label: 'Estadísticas Rápidas', icon: '⚡' },
      ]
    },
    {
      id: 'orders',
      title: 'Pedidos & Cotizaciones',
      icon: '📦',
      links: [
        { id: 'cotizaciones', label: 'Cotizaciones', icon: '📝' },
        { id: 'pedidos', label: 'Pedidos', icon: '📦' },
        { id: 'historial', label: 'Historial', icon: '📚' },
      ]
    },
    {
      id: 'clients',
      title: 'Clientes',
      icon: '👥',
      links: [
        { id: 'ver-clientes', label: 'Listar Clientes', icon: '👥' },
        { id: 'nuevo-cliente', label: 'Nuevo Cliente', icon: '➕' },
        { id: 'estadisticas-clientes', label: 'Estadísticas', icon: '📈' },
      ]
    },
    {
      id: 'financial',
      title: 'Finanzas',
      icon: '💰',
      links: [
        { id: 'pagos-finanzas', label: 'Gestión de Pagos', icon: '💳' },
        { id: 'reportes-finanzas', label: 'Reportes Financieros', icon: '📊' },
        { id: 'facturas-finanzas', label: 'Facturación', icon: '🧾' },
      ]
    },
    {
      id: 'communication',
      title: 'Comunicación',
      icon: '💬',
      links: [
        { id: 'notificaciones-comm', label: 'Notificaciones', icon: '🔔' },
        { id: 'mensajes-comm', label: 'Mensajes', icon: '💬' },
        { id: 'emails-comm', label: 'Email Marketing', icon: '📧' },
      ]
    },
    {
      id: 'content',
      title: 'Contenido',
      icon: '🎨',
      links: [
        { id: 'proyectos-admin', label: 'Portfolio', icon: '🖼️' },
      ]
    },
     {
      id: 'settings',
      title: 'Configuración',
      icon: '⚙️',
      links: [
        { id: 'configuracion-general', label: 'General', icon: '🛠️' },
        { id: 'integraciones', label: 'Integraciones', icon: '🔌' },
        { id: 'seguridad', label: 'Seguridad', icon: '🔒' },
      ]
    }
  ];

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-20 left-0 z-40 h-[calc(100vh-5rem)] w-80 
        backdrop-blur-xl bg-white/30 dark:bg-slate-800/30 
        border-r border-white/20 dark:border-slate-700/30 
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto lg:h-[calc(100vh-5rem)]
      `}>
        {/* Header del sidebar */}
        <div className="flex items-center justify-between p-6 border-b border-white/20 dark:border-slate-700/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Admin Panel</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Panel de Control</p>
            </div>
          </div>
          
          {/* Botón cerrar móvil */}
          <button
            onClick={onToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-white/20 dark:hover:bg-slate-700/20 transition-colors"
            aria-label="Cerrar menú de navegación"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {adminSections.map(section => (
              <div key={section.id} className="mb-4">
                {/* Título de sección con mejor diseño */}
                <button
                  onClick={() => {
                    if (section.isAlwaysOpen) return; // No permitir cerrar el panel principal
                    setActiveSection(activeSection === section.id ? '' : section.id);
                  }}
                  className={`flex items-center justify-between w-full text-left p-3 rounded-xl
                           ${section.isAlwaysOpen 
                             ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30' 
                             : 'bg-white/10 dark:bg-slate-700/20 hover:bg-white/20 dark:hover:bg-slate-700/30'
                           }
                           transition-all duration-200 group`}
                  disabled={section.isAlwaysOpen}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{section.icon}</span>
                    <span className={`font-semibold ${
                      section.isAlwaysOpen 
                        ? 'text-blue-900 dark:text-blue-100' 
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {section.title}
                    </span>
                  </div>
                  {!section.isAlwaysOpen && (
                    <svg 
                      className={`w-4 h-4 text-gray-600 dark:text-gray-400 transform transition-transform duration-200 ${
                        activeSection === section.id ? 'rotate-180' : ''
                      }`} 
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>

                {/* Enlaces de la sección - Mostrar siempre si es alwaysOpen, o si está activa */}
                {(section.isAlwaysOpen || activeSection === section.id) && (
                  <div className="mt-2 space-y-1">
                    {section.links.map(link => (
                      <button
                        key={link.id}
                        onClick={() => {
                          // Si el enlace tiene una ruta, navegar a ella
                          if (link.route) {
                            navigate(link.route);
                          } else if (onOptionSelect) {
                            // Mantener la funcionalidad existente para otros enlaces
                            onOptionSelect(link.id, link.label, section.title);
                          }
                          
                          // Cerrar sidebar en móvil
                          if (window.innerWidth < 1024) {
                            onToggle();
                          }
                        }}
                        className={`flex items-center w-full px-4 py-3 ml-2 rounded-lg text-sm font-medium transition-all duration-200 group ${
                          activeOption === link.id
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-[1.02]' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-slate-700/30 hover:translate-x-1'
                        }`}
                      >
                        <span className="mr-3 text-base">{link.icon}</span>
                        <span className="flex-1 text-left">{link.label}</span>
                        {activeOption === link.id && (
                          <div className="w-2 h-2 rounded-full bg-white/80 animate-pulse"></div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* Footer del sidebar */}
        <div className="p-6 border-t border-white/20 dark:border-slate-700/30">
          <div className="text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Admin Dashboard v2.0
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

AdminSidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  onOptionSelect: PropTypes.func,
  activeOption: PropTypes.string,
};

export default AdminSidebar;
