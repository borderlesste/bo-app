import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { TrendingUp, TrendingDown, DollarSign, Users, Calendar, Target } from 'lucide-react';
import axios from '../../api/axios';

const AdvancedStats = ({ stats, formatCurrency, className = '' }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [animatedValues, setAnimatedValues] = useState({});
  const [growthMetrics, setGrowthMetrics] = useState({});

  // Cargar datos históricos para cálculos de tendencias
  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        const [monthlyResponse, growthResponse] = await Promise.all([
          axios.get('/api/stats/monthly?months=2'),
          axios.get('/api/stats/growth?months=6')
        ]);

        if (monthlyResponse.data?.success) {
          const data = monthlyResponse.data.data;
          
          // Calcular métricas de crecimiento
          if (data.length >= 2) {
            const current = data[0];
            const previous = data[1];
            
            const revenueGrowth = previous.revenue > 0 
              ? ((current.revenue - previous.revenue) / previous.revenue * 100).toFixed(1)
              : 0;
            
            const clientGrowth = previous.newClients > 0
              ? ((current.newClients - previous.newClients) / previous.newClients * 100).toFixed(1)
              : 0;

            setGrowthMetrics({
              revenueGrowth: parseFloat(revenueGrowth),
              clientGrowth: parseFloat(clientGrowth),
              previousRevenue: previous.revenue,
              previousClients: previous.newClients
            });
          }
        }

        if (growthResponse.data?.success) {
          // Datos adicionales de crecimiento si es necesario
        }
      } catch (error) {
        console.error('Error loading historical data for AdvancedStats:', error);
        // Continuar con datos básicos
      }
    };

    fetchHistoricalData();
  }, []);

  // Animación de números
  useEffect(() => {
    const animateValue = (key, finalValue) => {
      let startValue = animatedValues[key] || 0;
      const duration = 1500;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = startValue + (finalValue - startValue) * easeOutQuart;
        
        setAnimatedValues(prev => ({ ...prev, [key]: Math.round(currentValue) }));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    };

    if (stats.totalClients !== undefined) {
      animateValue('totalClients', stats.totalClients);
      animateValue('activeProjects', stats.activeProjects || 0);
      animateValue('completedProjects', stats.completedProjects || 0);
      animateValue('monthlyRevenue', stats.monthlyRevenue || 0);
    }
  }, [stats, animatedValues]);

  const advancedMetrics = [
    {
      id: 'growth',
      title: 'Crecimiento',
      metrics: [
        {
          label: 'Nuevos Clientes',
          value: stats.newClientsThisMonth || 0,
          change: growthMetrics.clientGrowth !== undefined 
            ? `${growthMetrics.clientGrowth >= 0 ? '+' : ''}${growthMetrics.clientGrowth}% vs mes anterior`
            : `Total: ${stats.totalClients || 0}`,
          trend: growthMetrics.clientGrowth >= 0 ? 'up' : 'down',
          icon: Users,
          color: 'text-blue-600 dark:text-blue-400'
        },
        {
          label: 'Ingresos del Mes',
          value: formatCurrency(animatedValues.monthlyRevenue || 0),
          change: growthMetrics.revenueGrowth !== undefined 
            ? `${growthMetrics.revenueGrowth >= 0 ? '+' : ''}${growthMetrics.revenueGrowth}% vs mes anterior`
            : 'Sin datos previos',
          trend: growthMetrics.revenueGrowth >= 0 ? 'up' : 'down',
          icon: DollarSign,
          color: 'text-green-600 dark:text-green-400'
        }
      ]
    },
    {
      id: 'performance',
      title: 'Rendimiento',
      metrics: [
        {
          label: 'Tasa de Conversión',
          value: stats.totalClients > 0 ? ((stats.completedProjects / stats.totalClients) * 100).toFixed(1) + '%' : '0%',
          change: stats.pendingQuotes > 0 ? `${stats.pendingQuotes} pendientes` : 'Sin pendientes',
          trend: stats.completedProjects > stats.activeProjects ? 'up' : 'down',
          icon: Target,
          color: 'text-purple-600 dark:text-purple-400'
        },
        {
          label: 'Valor Promedio Proyecto',
          value: formatCurrency(stats.averageProjectValue || 0),
          change: stats.completedProjects > 0 ? `${stats.completedProjects} completados` : 'Sin datos',
          trend: 'up',
          icon: TrendingUp,
          color: 'text-orange-600 dark:text-orange-400'
        }
      ]
    },
    {
      id: 'efficiency',
      title: 'Eficiencia',
      metrics: [
        {
          label: 'Proyectos Activos',
          value: animatedValues.activeProjects || 0,
          change: `vs ${stats.completedProjects || 0} completados`,
          trend: stats.activeProjects > 0 ? 'up' : 'down',
          icon: Calendar,
          color: 'text-yellow-600 dark:text-yellow-400'
        },
        {
          label: 'Pagos Pendientes',
          value: formatCurrency(stats.pendingPayments || 0),
          change: stats.pendingPayments > 0 ? 'Requiere atención' : 'Todo al día',
          trend: stats.pendingPayments > 0 ? 'down' : 'up',
          icon: DollarSign,
          color: stats.pendingPayments > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
        }
      ]
    }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header con filtros de período */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Estadísticas Avanzadas
        </h2>
        <div className="flex space-x-2">
          {['week', 'month', 'quarter', 'year'].map(period => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                selectedPeriod === period
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {period === 'week' ? 'Semana' : period === 'month' ? 'Mes' : period === 'quarter' ? 'Trimestre' : 'Año'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de métricas avanzadas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {advancedMetrics.map(section => (
          <div
            key={section.id}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
              {section.title}
            </h3>
            
            <div className="space-y-4">
              {section.metrics.map((metric, idx) => {
                const Icon = metric.icon;
                const isPositiveTrend = metric.trend === 'up';
                
                return (
                  <div key={idx} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Icon className={`w-4 h-4 ${metric.color}`} />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {metric.label}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {metric.trend === 'up' ? (
                          <TrendingUp className="w-3 h-3 text-green-500" />
                        ) : metric.trend === 'down' ? (
                          <TrendingDown className="w-3 h-3 text-red-500" />
                        ) : null}
                      </div>
                    </div>
                    
                    <div className="flex items-baseline justify-between">
                      <span className={`text-2xl font-bold ${metric.color} group-hover:scale-105 transition-transform`}>
                        {metric.value}
                      </span>
                      <span className={`text-xs font-medium ${
                        isPositiveTrend ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {metric.change}
                      </span>
                    </div>
                    
                    {/* Barra de progreso visual */}
                    <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-1000 ${
                          isPositiveTrend ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ 
                          width: `${Math.min(Math.max((typeof metric.value === 'number' ? metric.value : parseInt(metric.value) || 0) / 100 * 100, 10), 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Resumen ejecutivo */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
          Resumen Ejecutivo
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {((stats.completedProjects / Math.max(stats.totalClients, 1)) * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Tasa de Éxito</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency((stats.monthlyRevenue || 0) / Math.max(stats.completedProjects, 1))}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Ingreso por Proyecto</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {stats.activeProjects + stats.completedProjects}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total de Proyectos</div>
          </div>
        </div>
      </div>
    </div>
  );
};

AdvancedStats.propTypes = {
  stats: PropTypes.object.isRequired,
  formatCurrency: PropTypes.func.isRequired,
  className: PropTypes.string
};

export default AdvancedStats;