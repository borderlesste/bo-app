import React from 'react';
import { 
  Target, 
  Clock, 
  Users, 
  TrendingUp, 
  DollarSign, 
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const MetricsOverview = ({ metrics, className = '' }) => {
  if (!metrics) return null;

  const metricCards = [
    {
      title: 'Tasa de Conversión',
      value: `${metrics.conversion_rate?.toFixed(1) || 0}%`,
      subtitle: `${metrics.quotes_approved || 0} de ${metrics.total_quotes || 0} cotizaciones`,
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      good: metrics.conversion_rate >= 20
    },
    {
      title: 'Tiempo de Respuesta',
      value: `${metrics.avg_response_time?.toFixed(1) || 0} días`,
      subtitle: 'Promedio de respuesta',
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      good: metrics.avg_response_time <= 3
    },
    {
      title: 'Retención de Clientes',
      value: `${metrics.retention_rate?.toFixed(1) || 0}%`,
      subtitle: `${metrics.returning_clients || 0} clientes recurrentes`,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      good: metrics.retention_rate >= 30
    },
    {
      title: 'Eficiencia de Cobro',
      value: `${metrics.collection_efficiency?.toFixed(1) || 0}%`,
      subtitle: 'Facturas cobradas vs emitidas',
      icon: DollarSign,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      good: metrics.collection_efficiency >= 80
    }
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Métricas de Rendimiento</h2>
          <p className="text-gray-600 text-sm mt-1">Indicadores clave del negocio</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span>Últimos {metrics.period || 30} días</span>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metricCards.map((metric, index) => (
          <div key={index} className="relative overflow-hidden">
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">{metric.title}</p>
                  <p className="text-xl font-bold text-gray-900">{metric.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{metric.subtitle}</p>
                </div>
                <div className={`${metric.bgColor} p-3 rounded-lg relative`}>
                  <metric.icon className={`h-5 w-5 ${metric.color}`} />
                  {metric.good ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500 absolute -top-1 -right-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500 absolute -top-1 -right-1" />
                  )}
                </div>
              </div>
              
              {/* Barra de progreso */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Objetivo</span>
                  <span>{metric.title === 'Tasa de Conversión' ? '25%' : 
                         metric.title === 'Tiempo de Respuesta' ? '2 días' :
                         metric.title === 'Retención de Clientes' ? '40%' : '90%'}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      metric.good ? 'bg-green-500' : 'bg-yellow-500'
                    }`}
                    style={{ 
                      width: `${Math.min(100, (
                        metric.title === 'Tasa de Conversión' ? (metrics.conversion_rate / 25) * 100 :
                        metric.title === 'Tiempo de Respuesta' ? Math.max(0, (5 - metrics.avg_response_time) / 5 * 100) :
                        metric.title === 'Retención de Clientes' ? (metrics.retention_rate / 40) * 100 :
                        (metrics.collection_efficiency / 90) * 100
                      ))}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Métricas adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Valor Promedio</h4>
          <p className="text-2xl font-bold text-blue-900">
            {formatCurrency(metrics.avg_quote_value || 0)}
          </p>
          <p className="text-xs text-blue-600">Por cotización</p>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-purple-800 mb-2">Carga de Trabajo</h4>
          <p className="text-2xl font-bold text-purple-900">
            {metrics.workload_per_staff?.toFixed(1) || 0}
          </p>
          <p className="text-xs text-purple-600">Proyectos por empleado</p>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-green-800 mb-2">Proyectos Activos</h4>
          <p className="text-2xl font-bold text-green-900">
            {metrics.active_workload || 0}
          </p>
          <p className="text-xs text-green-600">En desarrollo</p>
        </div>
      </div>

      {/* Resumen de leads */}
      {(metrics.direct_leads || metrics.referral_leads) && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-800 mb-3">Fuentes de Leads</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">{metrics.direct_leads || 0}</p>
              <p className="text-xs text-gray-600">Leads Directos</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">{metrics.referral_leads || 0}</p>
              <p className="text-xs text-gray-600">Referencias</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetricsOverview;