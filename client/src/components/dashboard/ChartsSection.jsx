import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { BarChart3, PieChart, TrendingUp, Download, Calendar } from 'lucide-react';
import axios from '../../api/axios';

const ChartsSection = ({ stats, recentActivity, formatCurrency }) => {
  const [selectedChart, setSelectedChart] = useState('revenue');
  const [chartData, setChartData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        setLoading(true);
        
        // Obtener datos históricos mensuales (últimos 6 meses)
        const monthlyResponse = await axios.get('/api/stats/monthly?months=6');
        const growthResponse = await axios.get('/api/stats/growth?months=6');
        
        if (monthlyResponse.data.success && growthResponse.data.success) {
          const monthlyData = monthlyResponse.data.data;
          const growthData = growthResponse.data.data;
          
          // Formatear datos para los gráficos
          const revenueData = monthlyData.map(item => ({
            month: item.monthName,
            revenue: item.revenue,
            clients: item.newClients,
            projects: item.activeProjects
          }));
          
          const clientsGrowthData = growthData.map(item => ({
            month: item.monthName,
            accumulated: item.accumulatedClients,
            newClients: item.newClients
          }));
          
          setChartData({
            revenue: revenueData,
            projectsStatus: [
              { name: 'Completados', value: stats.completedProjects || 0, color: '#10B981' },
              { name: 'Activos', value: stats.activeProjects || 0, color: '#3B82F6' },
              { name: 'Pendientes', value: stats.pendingQuotes || 0, color: '#F59E0B' }
            ],
            clientsGrowth: clientsGrowthData
          });
        } else {
          throw new Error('Error al obtener datos históricos');
        }
      } catch (error) {
        console.error('Error fetching historical data:', error);
        setError('Error al cargar datos históricos');
        setChartData({});
      } finally {
        setLoading(false);
      }
    };


    fetchHistoricalData();
  }, [stats]);

  const chartOptions = [
    { id: 'revenue', label: 'Ingresos', icon: TrendingUp },
    { id: 'projects', label: 'Proyectos', icon: PieChart },
    { id: 'clients', label: 'Clientes', icon: BarChart3 }
  ];

  const exportChart = () => {
    // Simular exportación de datos
    const data = {
      stats,
      chartData,
      exportDate: new Date().toISOString(),
      type: selectedChart
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estadisticas-${selectedChart}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <BarChart3 className="w-6 h-6 mr-2 text-blue-600" />
            Análisis Visual
          </h2>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">Cargando datos históricos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <BarChart3 className="w-6 h-6 mr-2 text-blue-600" />
          Análisis Visual
          {error && (
            <span className="ml-2 text-xs text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 px-2 py-1 rounded">
              Datos históricos limitados
            </span>
          )}
        </h2>
        <button
          onClick={exportChart}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar Datos
        </button>
      </div>

      {/* Chart selector */}
      <div className="flex space-x-2 mb-6">
        {chartOptions.map(option => {
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              onClick={() => setSelectedChart(option.id)}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedChart === option.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {option.label}
            </button>
          );
        })}
      </div>

      {/* Charts container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {selectedChart === 'revenue' && 'Evolución de Ingresos (6 meses)'}
            {selectedChart === 'projects' && 'Distribución de Proyectos'}
            {selectedChart === 'clients' && 'Crecimiento Acumulado de Clientes'}
          </h3>
          
          <div className="flex justify-center">
            {selectedChart === 'revenue' && chartData.revenue && (
              <SVGChart type="line" data={chartData.revenue} width={400} height={250} />
            )}
            {selectedChart === 'projects' && chartData.projectsStatus && (
              <PieChartSVG data={chartData.projectsStatus} width={300} height={250} />
            )}
            {selectedChart === 'clients' && chartData.clientsGrowth && (
              <SVGChart type="line" data={chartData.clientsGrowth.map(item => ({
                month: item.month,
                revenue: item.accumulated,
                clients: item.newClients
              }))} width={400} height={250} />
            )}
          </div>
        </div>

        {/* Insights panel */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
            Insights Clave
          </h3>
          
          <div className="space-y-4">
            {selectedChart === 'revenue' && (
              <>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="font-semibold text-green-800 dark:text-green-400">
                    Ingresos del Mes
                  </div>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-300">
                    {formatCurrency(stats.monthlyRevenue || 0)}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-400">
                    Promedio mensual en los últimos 6 meses
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="font-semibold text-blue-800 dark:text-blue-400">
                    Proyección Anual
                  </div>
                  <div className="text-xl font-bold text-blue-900 dark:text-blue-300">
                    {formatCurrency((stats.monthlyRevenue || 0) * 12)}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-400">
                    Basado en ingresos actuales
                  </div>
                </div>
              </>
            )}

            {selectedChart === 'projects' && (
              <>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="font-semibold text-purple-800 dark:text-purple-400">
                    Tasa de Finalización
                  </div>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-300">
                    {stats.completedProjects > 0 ? 
                      ((stats.completedProjects / (stats.completedProjects + stats.activeProjects)) * 100).toFixed(1) + '%'
                      : '0%'
                    }
                  </div>
                  <div className="text-sm text-purple-700 dark:text-purple-400">
                    Proyectos completados vs total
                  </div>
                </div>
                
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="font-semibold text-orange-800 dark:text-orange-400">
                    En Pipeline
                  </div>
                  <div className="text-xl font-bold text-orange-900 dark:text-orange-300">
                    {(stats.activeProjects || 0) + (stats.pendingQuotes || 0)}
                  </div>
                  <div className="text-sm text-orange-700 dark:text-orange-400">
                    Proyectos activos + cotizaciones
                  </div>
                </div>
              </>
            )}

            {selectedChart === 'clients' && (
              <>
                <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
                  <div className="font-semibold text-cyan-800 dark:text-cyan-400">
                    Crecimiento de Clientes
                  </div>
                  <div className="text-2xl font-bold text-cyan-900 dark:text-cyan-300">
                    +{stats.newClientsThisMonth || 0}
                  </div>
                  <div className="text-sm text-cyan-700 dark:text-cyan-400">
                    Nuevos este mes
                  </div>
                </div>
                
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  <div className="font-semibold text-indigo-800 dark:text-indigo-400">
                    Total Acumulado
                  </div>
                  <div className="text-xl font-bold text-indigo-900 dark:text-indigo-300">
                    {stats.totalClients || 0}
                  </div>
                  <div className="text-sm text-indigo-700 dark:text-indigo-400">
                    Clientes registrados
                  </div>
                </div>
              </>
            )}

            {/* Recent activity preview */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Actividad Reciente
              </h4>
              {recentActivity?.slice(0, 3).map((activity, index) => (
                <div key={index} className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  • {activity.message}
                </div>
              )) || (
                <div className="text-sm text-gray-500 dark:text-gray-500">
                  No hay actividad reciente
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente SVG Chart
const SVGChart = ({ type, data, width, height }) => {
  if (!data || data.length === 0) return <div>No hay datos disponibles</div>;
  
  const maxValue = Math.max(...data.map(d => d.revenue || d.clients || 0));
  
  // Si maxValue es 0 o no es un número válido, mostrar mensaje
  if (maxValue === 0 || !isFinite(maxValue)) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="text-gray-500 dark:text-gray-400">No hay datos para mostrar</div>
      </div>
    );
  }
  
  const chartHeight = height - 60;
  const chartWidth = width - 60;
  
  return (
    <svg width={width} height={height} className="overflow-visible">
      {/* Ejes */}
      <line x1={40} y1={20} x2={40} y2={chartHeight + 20} stroke="currentColor" strokeOpacity={0.3} />
      <line x1={40} y1={chartHeight + 20} x2={chartWidth + 40} y2={chartHeight + 20} stroke="currentColor" strokeOpacity={0.3} />
      
      {type === 'line' ? (
        <>
          {/* Línea */}
          <polyline
            fill="none"
            stroke="#3B82F6"
            strokeWidth="3"
            points={data.map((d, i) => {
              const xPos = data.length > 1 ? 40 + (i * (chartWidth / (data.length - 1))) : 40 + chartWidth / 2;
              const yPos = 20 + chartHeight - ((d.revenue || 0) / maxValue) * chartHeight;
              return `${xPos},${yPos}`;
            }).join(' ')}
          />
          {/* Puntos */}
          {data.map((d, i) => {
            const xPos = data.length > 1 ? 40 + (i * (chartWidth / (data.length - 1))) : 40 + chartWidth / 2;
            const yPos = 20 + chartHeight - ((d.revenue || 0) / maxValue) * chartHeight;
            return (
              <circle
                key={i}
                cx={xPos}
                cy={yPos}
                r="4"
                fill="#3B82F6"
              />
            );
          })}
        </>
      ) : (
        /* Barras */
        data.map((d, i) => {
          const barWidth = (chartWidth / data.length) - 20;
          const barHeight = ((d.revenue || 0) / maxValue) * chartHeight;
          return (
            <rect
              key={i}
              x={40 + i * (chartWidth / data.length) + 10}
              y={20 + chartHeight - barHeight}
              width={barWidth}
              height={barHeight}
              fill="#3B82F6"
              opacity={0.8}
            />
          );
        })
      )}
      
      {/* Labels */}
      {data.map((d, i) => {
        const xPos = data.length > 1 ? 40 + (i * (chartWidth / (data.length - 1))) : 40 + chartWidth / 2;
        return (
          <text
            key={i}
            x={xPos}
            y={height - 10}
            textAnchor="middle"
            fontSize="12"
            fill="currentColor"
            opacity={0.7}
          >
            {d.month}
          </text>
        );
      })}
    </svg>
  );
};

SVGChart.propTypes = {
  type: PropTypes.string.isRequired,
  data: PropTypes.array.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired
};

// Componente Pie Chart
const PieChartSVG = ({ data, width, height }) => {
  if (!data || data.length === 0) return <div>No hay datos disponibles</div>;
  
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  // Si el total es 0, mostrar mensaje en lugar de renderizar SVG inválido
  if (total === 0) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="text-gray-500 dark:text-gray-400">No hay datos para mostrar</div>
      </div>
    );
  }
  
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 20;
  
  let currentAngle = 0;
  
  return (
    <svg width={width} height={height}>
      {data.map((item, index) => {
        const sliceAngle = (item.value / total) * 2 * Math.PI;
        const startAngle = currentAngle;
        const endAngle = currentAngle + sliceAngle;
        
        const x1 = centerX + radius * Math.cos(startAngle);
        const y1 = centerY + radius * Math.sin(startAngle);
        const x2 = centerX + radius * Math.cos(endAngle);
        const y2 = centerY + radius * Math.sin(endAngle);
        
        const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
        
        const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
        
        currentAngle = endAngle;
        
        return (
          <path
            key={index}
            d={pathData}
            fill={item.color}
            opacity={0.8}
            stroke="white"
            strokeWidth="2"
          />
        );
      })}
    </svg>
  );
};

PieChartSVG.propTypes = {
  data: PropTypes.array.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired
};

ChartsSection.propTypes = {
  stats: PropTypes.object.isRequired,
  recentActivity: PropTypes.array,
  formatCurrency: PropTypes.func.isRequired
};

export default ChartsSection;