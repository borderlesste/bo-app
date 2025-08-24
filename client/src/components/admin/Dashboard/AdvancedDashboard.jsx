import { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  FileText, 
  AlertTriangle,
  BarChart3,
  Calendar,
  Target,
  Activity
} from 'lucide-react';
import StatsCard from './StatsCard';
import ChartCard from './ChartCard';
import AlertsPanel from './AlertsPanel';
import MetricsOverview from './MetricsOverview';
import { adminDashboardAPI } from '../../../services/api';

const AdvancedDashboard = () => {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [trends, setTrends] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [advancedMetrics, setAdvancedMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [
        statsRes,
        chartsRes,
        trendsRes,
        alertsRes,
        metricsRes
      ] = await Promise.all([
        adminDashboardAPI.getStats(),
        adminDashboardAPI.getCharts(),
        adminDashboardAPI.getTrends(),
        adminDashboardAPI.getAlerts(),
        adminDashboardAPI.getAdvancedMetrics({ period })
      ]);

      setStats(statsRes.data);
      setCharts(chartsRes.data);
      setTrends(trendsRes.data);
      setAlerts(alertsRes.data);
      setAdvancedMetrics(metricsRes.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow h-32"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Análisis completo del negocio y métricas clave</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="7">Últimos 7 días</option>
              <option value="30">Últimos 30 días</option>
              <option value="90">Últimos 90 días</option>
            </select>
            <button
              onClick={loadDashboardData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2 text-sm"
            >
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Actualizar</span>
              <span className="sm:hidden">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {alerts.length > 0 && (
        <AlertsPanel alerts={alerts} className="mb-6 sm:mb-8" />
      )}

      {/* Indicadores Críticos */}
      {(trends?.critical_metrics && Object.keys(trends.critical_metrics).length > 0) && (
        <div className="mb-6 sm:mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <h3 className="text-lg font-semibold text-red-800">Métricas que Requieren Atención</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {trends?.critical_metrics?.low_conversion && (
              <div className="bg-white p-3 rounded-lg border border-red-200">
                <p className="text-sm font-medium text-red-800">Conversión Baja</p>
                <p className="text-xs text-red-600">Tasa actual: {advancedMetrics?.conversion_rate?.toFixed(1) || 0}%</p>
              </div>
            )}
            {trends?.critical_metrics?.slow_response && (
              <div className="bg-white p-3 rounded-lg border border-red-200">
                <p className="text-sm font-medium text-red-800">Respuesta Lenta</p>
                <p className="text-xs text-red-600">Tiempo actual: {advancedMetrics?.avg_response_time?.toFixed(1) || 0} días</p>
              </div>
            )}
            {trends?.critical_metrics?.low_retention && (
              <div className="bg-white p-3 rounded-lg border border-red-200">
                <p className="text-sm font-medium text-red-800">Retención Baja</p>
                <p className="text-xs text-red-600">Tasa actual: {advancedMetrics?.retention_rate?.toFixed(1) || 0}%</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <StatsCard
          title="Ingresos del Mes"
          value={formatCurrency(stats?.monthlyRevenue || 0)}
          change={trends?.growth?.revenue || 0}
          icon={DollarSign}
          color="green"
        />
        <StatsCard
          title="Clientes Activos"
          value={stats?.totalClients || 0}
          change={trends?.growth?.clients || 0}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Proyectos Activos"
          value={stats?.activeProjects || 0}
          change={((stats?.activeProjects || 0) / Math.max(stats?.completedProjects || 1, 1) * 100) - 100}
          icon={BarChart3}
          color="purple"
        />
        <StatsCard
          title="Cotizaciones Pendientes"
          value={stats?.pendingQuotes || 0}
          change={trends?.growth?.quotes || 0}
          icon={FileText}
          color="orange"
        />
      </div>

      {/* Métricas Avanzadas */}
      {advancedMetrics && (
        <MetricsOverview metrics={advancedMetrics} className="mb-6 sm:mb-8" />
      )}

      {/* Gráficos y Análisis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <ChartCard
          title="Ingresos por Mes"
          data={charts?.revenue || []}
          type="line"
          color="#10B981"
        />
        <ChartCard
          title="Crecimiento de Clientes"
          data={charts?.clientGrowth || []}
          type="bar"
          color="#3B82F6"
        />
      </div>

      {/* Distribuciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <ChartCard
          title="Estados de Proyectos"
          data={charts?.projectsDistribution || []}
          type="doughnut"
          color="#8B5CF6"
        />
        <ChartCard
          title="Categorías de Proyectos"
          data={charts?.categoryDistribution || []}
          type="pie"
          color="#F59E0B"
        />
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Servicios Más Cotizados</h3>
          <div className="space-y-3">
            {charts?.topServices?.slice(0, 5).map((service, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{service.name}</p>
                  <p className="text-sm text-gray-600">{service.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{service.quotesCount} cotizaciones</p>
                  <p className="text-sm text-gray-600">{formatCurrency(service.avgPrice)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resumen Financiero */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2 text-green-600" />
            Eficiencia de Conversión
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tasa de Conversión</span>
              <span className="font-semibold text-green-600">
                {advancedMetrics?.conversion_rate?.toFixed(1) || 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Retención de Clientes</span>
              <span className="font-semibold text-blue-600">
                {advancedMetrics?.retention_rate?.toFixed(1) || 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Eficiencia de Cobro</span>
              <span className="font-semibold text-purple-600">
                {advancedMetrics?.collection_efficiency?.toFixed(1) || 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
            Tiempos de Respuesta
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tiempo Promedio</span>
              <span className="font-semibold">
                {advancedMetrics?.avg_response_time?.toFixed(1) || 0} días
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Valor Promedio Cotización</span>
              <span className="font-semibold">
                {formatCurrency(advancedMetrics?.avg_quote_value || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Carga por Empleado</span>
              <span className="font-semibold">
                {advancedMetrics?.workload_per_staff?.toFixed(1) || 0} proyectos
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            {(trends?.growth?.clients >= 0 && trends?.growth?.revenue >= 0 && trends?.growth?.pedidos >= 0) ? (
              <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
            ) : (
              <TrendingDown className="h-5 w-5 mr-2 text-red-600" />
            )}
            Tendencias del Período
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <span className="text-gray-600">Nuevos Clientes</span>
                {trends?.growth?.clients < 0 && (
                  <TrendingDown className="h-4 w-4 ml-1 text-red-500" />
                )}
              </div>
              <span className={`font-semibold ${trends?.growth?.clients >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(trends?.growth?.clients || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <span className="text-gray-600">Ingresos</span>
                {trends?.growth?.revenue < 0 && (
                  <TrendingDown className="h-4 w-4 ml-1 text-red-500" />
                )}
              </div>
              <span className={`font-semibold ${trends?.growth?.revenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(trends?.growth?.revenue || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <span className="text-gray-600">Nuevos Pedidos</span>
                {trends?.growth?.pedidos < 0 && (
                  <TrendingDown className="h-4 w-4 ml-1 text-red-500" />
                )}
              </div>
              <span className={`font-semibold ${trends?.growth?.pedidos >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(trends?.growth?.pedidos || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedDashboard;