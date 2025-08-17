import { useNavigate, useLocation } from 'react-router-dom';
import { FileText, Package, History, ChevronRight } from 'lucide-react';

const OrdersNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    {
      id: 'quotes',
      label: 'Cotizaciones',
      path: '/cotizaciones',
      icon: FileText,
      description: 'Gestionar solicitudes de cotización'
    },
    {
      id: 'orders',
      label: 'Pedidos',
      path: '/pedidos',
      icon: Package,
      description: 'Administrar proyectos y órdenes'
    },
    {
      id: 'history',
      label: 'Historial',
      path: '/historial',
      icon: History,
      description: 'Ver historial completo'
    }
  ];

  const currentPath = location.pathname;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            📊 Sección: Pedidos y Cotizaciones
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Navega entre los diferentes módulos de gestión de proyectos
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {navigationItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            
            return (
              <div key={item.id} className="flex items-center">
                <button
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? 'bg-violet-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-violet-100 dark:hover:bg-slate-600 hover:text-violet-700 dark:hover:text-violet-300'
                  }`}
                  title={item.description}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  )}
                </button>
                
                {index < navigationItems.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-gray-400 mx-2 hidden sm:block" />
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Current Section Indicator */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span>Estás en:</span>
          {navigationItems.map((item) => {
            if (currentPath === item.path) {
              const Icon = item.icon;
              return (
                <div key={item.id} className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-medium">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  <span className="text-gray-500">- {item.description}</span>
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
};

export default OrdersNavigation;