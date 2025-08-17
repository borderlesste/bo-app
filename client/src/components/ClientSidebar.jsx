import { useState } from 'react';
import PropTypes from 'prop-types';

const ClientSidebar = ({ isOpen, onToggle, onOptionSelect }) => {
  const [activeSection, setActiveSection] = useState('dashboard');

  // Enlaces para clientes organizados por secciones
  const clientSections = [
    {
      id: 'dashboard',
      title: 'Mi Panel',
      icon: '📊',
      links: [
        { action: 'dashboard', label: 'Dashboard', icon: '📊' },
        { action: 'profile', label: 'Mi Perfil', icon: '👤' },
      ]
    },
    {
      id: 'projects',
      title: 'Mis Proyectos',
      icon: '📋',
      links: [
        { action: 'quotes', label: 'Mis Cotizaciones', icon: '📋' },
        { action: 'orders', label: 'Mis Pedidos', icon: '📦' },
        { action: 'new-request', label: 'Nueva Solicitud', icon: '➕' },
      ]
    },
    {
      id: 'financial',
      title: 'Finanzas',
      icon: '💰',
      links: [
        { action: 'payments', label: 'Mis Pagos', icon: '💰' },
        { action: 'invoices', label: 'Facturas', icon: '🧾' },
      ]
    },
    {
      id: 'communication',
      title: 'Comunicación',
      icon: '💬',
      links: [
        { action: 'notifications', label: 'Notificaciones', icon: '🔔' },
        { action: 'messages', label: 'Mensajes', icon: '💬' },
        { action: 'support', label: 'Soporte', icon: '🆘' },
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
        block
      `}>
        {/* Header del sidebar */}
        <div className="flex items-center justify-between p-6 border-b border-white/20 dark:border-slate-700/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Mi Panel</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Panel de Cliente</p>
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
        <nav className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {clientSections.map(section => (
              <div key={section.id}>
                {/* Título de sección */}
                <button
                  onClick={() => setActiveSection(activeSection === section.id ? '' : section.id)}
                  className="flex items-center justify-between w-full text-left p-3 rounded-lg
                           bg-white/20 dark:bg-slate-700/20 hover:bg-white/30 dark:hover:bg-slate-700/30
                           transition-colors duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{section.icon}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{section.title}</span>
                  </div>
                  <svg 
                    className={`w-4 h-4 text-gray-600 dark:text-gray-400 transform transition-transform ${
                      activeSection === section.id ? 'rotate-180' : ''
                    }`} 
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Enlaces de la sección */}
                {activeSection === section.id && (
                  <div className="mt-2 ml-6 space-y-1">
                    {section.links.map(link => (
                      <button
                        key={link.action}
                        onClick={() => {
                          if (onOptionSelect) {
                            onOptionSelect(link.action);
                          }
                          if (window.innerWidth < 1024) {
                            onToggle();
                          }
                        }}
                        className="flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-slate-700/20 w-full text-left"
                      >
                        <span className="mr-3">{link.icon}</span>
                        {link.label}
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
              Cliente Dashboard v2.0
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

ClientSidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  onOptionSelect: PropTypes.func,
};

export default ClientSidebar;
