import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AdminSidebar from './AdminSidebar';
import ClientSidebar from './ClientSidebar';
import PropTypes from 'prop-types';

const DashboardLayout = ({ children, onSidebarOptionSelect }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Solo mostrar el layout de dashboard si el usuario está autenticado
  if (!user) {
    return children;
  }

  const isAdmin = user.rol === 'admin';

  // Función para determinar la opción activa basada en la ruta actual
  const getActiveOption = () => {
    const path = location.pathname;
    switch (path) {
      case '/cotizaciones': return 'cotizaciones';
      case '/pedidos': return 'pedidos';
      case '/historial': return 'historial';
      case '/ver-clientes': return 'ver-clientes';
      case '/nuevo-cliente': return 'nuevo-cliente';
      case '/estadisticas-clientes': return 'estadisticas-clientes';
      case '/pagos-finanzas': return 'pagos-finanzas';
      case '/reportes-finanzas': return 'reportes-finanzas';
      case '/facturas-finanzas': return 'facturas-finanzas';
      case '/notificaciones-comm': return 'notificaciones-comm';
      case '/mensajes-comm': return 'mensajes-comm';
      case '/emails-comm': return 'emails-comm';
      case '/proyectos-admin': return 'proyectos-admin';
      case '/configuracion-general': return 'configuracion-general';
      case '/integraciones': return 'integraciones';
      case '/seguridad': return 'seguridad';
      case '/admin/dashboard': return ''; // No marcar ninguna opción específica
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 pt-20">
      <div className="flex">
        {/* Sidebar */}
        {isAdmin ? (
          <AdminSidebar 
            isOpen={sidebarOpen} 
            onToggle={toggleSidebar}
            onOptionSelect={onSidebarOptionSelect || (() => {})} // Usar la función pasada como prop
            activeOption={getActiveOption()} // Opción activa basada en la ruta actual
          />
        ) : (
          <ClientSidebar 
            isOpen={sidebarOpen} 
            onToggle={toggleSidebar} 
            onOptionSelect={onSidebarOptionSelect}
          />
        )}

        {/* Contenido principal */}
        <main className={`flex-1 transition-all duration-300 ${!isAdmin ? 'lg:ml-80' : 'lg:ml-0'}`}>
          {/* Botón hamburguesa para móvil */}
          <div className="lg:hidden fixed top-20 left-4 z-30">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg backdrop-blur-xl bg-white/30 dark:bg-slate-800/30 
                       border border-white/20 dark:border-slate-700/30 shadow-lg
                       hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors"
              aria-label="Abrir menú de navegación"
            >
              <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Contenido centrado con margen amplio */}
          <div className="min-h-screen">
            <div className="mx-auto px-12 py-6" style={{maxWidth: '1200px'}}>
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

DashboardLayout.propTypes = {
  children: PropTypes.node.isRequired,
  onSidebarOptionSelect: PropTypes.func,
};

export default DashboardLayout;
