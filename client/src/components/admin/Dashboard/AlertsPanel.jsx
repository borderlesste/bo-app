import PropTypes from 'prop-types';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const AlertsPanel = ({ alerts, className = '' }) => {
  if (!alerts || alerts.length === 0) return null;

  const getAlertIcon = (type) => {
    switch (type) {
      case 'danger':
        return <AlertTriangle className="h-5 w-5" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5" />;
      case 'info':
        return <Info className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getAlertClasses = (type) => {
    switch (type) {
      case 'danger':
        return {
          container: 'bg-red-50 border-red-200',
          icon: 'text-red-600',
          title: 'text-red-800',
          message: 'text-red-700',
          button: 'text-red-600 hover:text-red-800'
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200',
          icon: 'text-yellow-600',
          title: 'text-yellow-800',
          message: 'text-yellow-700',
          button: 'text-yellow-600 hover:text-yellow-800'
        };
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200',
          icon: 'text-blue-600',
          title: 'text-blue-800',
          message: 'text-blue-700',
          button: 'text-blue-600 hover:text-blue-800'
        };
      default:
        return {
          container: 'bg-gray-50 border-gray-200',
          icon: 'text-gray-600',
          title: 'text-gray-800',
          message: 'text-gray-700',
          button: 'text-gray-600 hover:text-gray-800'
        };
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Alertas Importantes ({alerts.length})
      </h2>
      
      {alerts.map((alert, index) => {
        const classes = getAlertClasses(alert.type);
        
        return (
          <div
            key={index}
            className={`p-4 rounded-lg border ${classes.container} transition-all hover:shadow-md`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className={classes.icon}>
                  {getAlertIcon(alert.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-medium ${classes.title}`}>
                    {alert.title}
                  </h3>
                  
                  <p className={`mt-1 text-sm ${classes.message}`}>
                    {alert.message}
                  </p>
                  
                  {alert.amount && (
                    <p className={`mt-2 text-sm font-semibold ${classes.title}`}>
                      Monto: {formatAmount(alert.amount)}
                    </p>
                  )}
                  
                  {alert.action && (
                    <button 
                      className={`mt-3 text-sm font-medium ${classes.button} hover:underline focus:outline-none`}
                      onClick={() => {
                        // Aquí puedes agregar la navegación o acción correspondiente
                        console.log(`Acción: ${alert.action}`);
                      }}
                    >
                      {alert.action} →
                    </button>
                  )}
                </div>
              </div>
              
              <button
                className={`${classes.button} hover:bg-white hover:bg-opacity-50 p-1 rounded-md transition-colors`}
                onClick={() => {
                  // Aquí puedes agregar la funcionalidad para descartar la alerta
                  console.log('Descartar alerta');
                }}
                title="Descartar alerta"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {/* Indicador de urgencia */}
            {alert.type === 'danger' && (
              <div className="mt-3 flex items-center space-x-2">
                <div className="flex-1 bg-red-200 rounded-full h-1">
                  <div className="bg-red-600 h-1 rounded-full w-full animate-pulse"></div>
                </div>
                <span className="text-xs text-red-600 font-medium">URGENTE</span>
              </div>
            )}
          </div>
        );
      })}
      
      {alerts.length > 3 && (
        <button className="w-full text-center py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          Ver todas las alertas ({alerts.length})
        </button>
      )}
    </div>
  );
};

AlertsPanel.propTypes = {
  alerts: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.oneOf(['danger', 'warning', 'info']).isRequired,
      title: PropTypes.string.isRequired,
      message: PropTypes.string.isRequired,
      amount: PropTypes.number,
      action: PropTypes.string
    })
  ),
  className: PropTypes.string
};

export default AlertsPanel;