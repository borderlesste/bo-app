import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, DollarSign, BarChart3, FileText, Settings, MessageSquare, Download } from 'lucide-react';
import PropTypes from 'prop-types';
import Card from '../Card';
import Button from '../Button';

const QuickActions = ({ onActionClick, showToast }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);

  const handleAction = async (actionId) => {
    setLoading(actionId);
    
    try {
      switch (actionId) {
        case 'new_quote':
          navigate('/quotes');
          showToast?.('Navegando a Nueva Cotización', 'success');
          break;
          
        case 'add_client':
          navigate('/clients');
          showToast?.('Navegando a Gestión de Clientes', 'success');
          break;
          
        case 'register_payment':
          navigate('/payments');
          showToast?.('Navegando a Registro de Pagos', 'success');
          break;
          
        case 'view_reports':
          navigate('/reports');
          showToast?.('Navegando a Reportes', 'success');
          break;
          
        case 'new_project':
          navigate('/projects');
          showToast?.('Navegando a Proyectos', 'success');
          break;
          
        case 'messages':
          navigate('/messages');
          showToast?.('Navegando a Mensajes', 'success');
          break;
          
        case 'settings':
          navigate('/settings');
          showToast?.('Navegando a Configuración', 'success');
          break;
          
        case 'export_data':
          // Función de exportación de datos
          await exportDashboardData();
          showToast?.('Datos exportados exitosamente', 'success');
          break;
          
        default:
          if (onActionClick) {
            onActionClick(actionId);
          } else {
            showToast?.('Función no implementada', 'warning');
          }
      }
    } catch (error) {
      showToast?.(`Error: ${error.message}`, 'error');
    } finally {
      setLoading(null);
    }
  };

  const exportDashboardData = async () => {
    // Simular exportación de datos
    return new Promise((resolve) => {
      setTimeout(() => {
        const data = {
          exported_at: new Date().toISOString(),
          dashboard_stats: 'Datos del dashboard exportados',
          format: 'JSON'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        resolve();
      }, 1000);
    });
  };

  const actions = [
    {
      id: 'new_quote',
      icon: FileText,
      label: 'Nueva Cotización',
      variant: 'primary',
      description: 'Crear una nueva cotización para cliente'
    },
    {
      id: 'add_client',
      icon: Users,
      label: 'Agregar Cliente',
      variant: 'secondary',
      description: 'Añadir un nuevo cliente al sistema'
    },
    {
      id: 'register_payment',
      icon: DollarSign,
      label: 'Registrar Pago',
      variant: 'accent',
      description: 'Registrar un nuevo pago recibido'
    },
    {
      id: 'view_reports',
      icon: BarChart3,
      label: 'Ver Reportes',
      variant: 'ghost',
      description: 'Acceder a reportes y análisis'
    },
    {
      id: 'new_project',
      icon: Plus,
      label: 'Nuevo Proyecto',
      variant: 'primary',
      description: 'Iniciar un nuevo proyecto'
    },
    {
      id: 'messages',
      icon: MessageSquare,
      label: 'Mensajes',
      variant: 'secondary',
      description: 'Ver mensajes y comunicaciones'
    },
    {
      id: 'settings',
      icon: Settings,
      label: 'Configuración',
      variant: 'ghost',
      description: 'Ajustar configuraciones del sistema'
    },
    {
      id: 'export_data',
      icon: Download,
      label: 'Exportar Datos',
      variant: 'accent',
      description: 'Descargar datos del dashboard'
    }
  ];

  return (
    <div className="mt-8">
      <Card variant="gradient">
        <h2 className="text-xl font-semibold text-ghost-800 dark:text-ghost-100 mb-6">
          Acciones Rápidas
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action) => {
            const IconComponent = action.icon;
            const isLoading = loading === action.id;
            
            return (
              <Button 
                key={action.id}
                variant={action.variant} 
                className={`h-24 flex flex-col items-center justify-center gap-2 relative transition-all duration-200 hover:scale-105 ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
                onClick={() => handleAction(action.id)}
                disabled={isLoading}
                title={action.description}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current"></div>
                ) : (
                  <IconComponent className="h-6 w-6" />
                )}
                <span className="text-sm font-medium">{action.label}</span>
                {action.description && (
                  <span className="text-xs opacity-75 text-center px-1">
                    {action.description}
                  </span>
                )}
              </Button>
            );
          })}
        </div>
        
        {/* Información adicional */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
            💡 <strong>Tip:</strong> Usa estas acciones rápidas para navegar eficientemente por el sistema. 
            Las acciones marcadas con 🚀 incluyen funcionalidades avanzadas.
          </p>
        </div>
      </Card>
    </div>
  );
};

QuickActions.propTypes = {
  onActionClick: PropTypes.func,
  showToast: PropTypes.func
};

export default QuickActions;