import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Card, Button, Skeleton } from '../components';
import { getUsers, getOrders, getPayments } from '../api/axios';
import { 
  Users, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  DollarSign,
  Package,
  Building,
  Download,
  RefreshCw
} from 'lucide-react';

const ClientsStatsPage = ({ showNavigation = true }) => {
  const [clients, setClients] = useState([]);
  const [orders, setorders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');

  // Cargar datos desde las APIs
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [usersRes, ordersRes, paymentsRes] = await Promise.all([
        getUsers(),
        getOrders(),
        getPayments()
      ]);

      if (usersRes.data.success) {
        const clientUsers = usersRes.data.data.filter(user => user.rol !== 'admin');
        setClients(clientUsers);
      }
      if (ordersRes.data.success) {
        setorders(ordersRes.data.data);
      }
      if (paymentsRes.data.success) {
        setPayments(paymentsRes.data.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Funciones de cálculo de estadísticas
  const getDateRange = () => {
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        return { startDate: null, endDate: now };
    }
    
    return { startDate, endDate: now };
  };

  const filterByDateRange = (items, dateField = 'fecha_registro') => {
    const { startDate } = getDateRange();
    if (!startDate) return items;
    
    return items.filter(item => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= startDate;
    });
  };

  const calculateClientStats = () => {
    const filteredClients = filterByDateRange(clients);
    const activeClients = clients.filter(c => c.estado === 'activo').length;
    const newClients = filteredClients.length;
    const totalClients = clients.length;
    
    // Cálculo de crecimiento
    const previousPeriodClients = totalClients - newClients;
    const growthRate = previousPeriodClients > 0 ? 
      ((newClients - previousPeriodClients) / previousPeriodClients * 100) : 100;

    return {
      total: totalClients,
      active: activeClients,
      new: newClients,
      growthRate: Math.round(growthRate * 100) / 100,
      retentionRate: totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 0
    };
  };

  const calculateorderstats = () => {
    const clientorders = orders.filter(order => {
      const orderClient = clients.find(c => c.id === order.usuario_id || c.name === order.cliente_nombre);
      return orderClient;
    });

    const ordersPerClient = clients.map(client => {
      const clientorderCount = clientorders.filter(order => 
        order.usuario_id === client.id || order.cliente_nombre === client.nombre
      ).length;
      return {
        client: client.nombre || client.username,
        orders: clientorderCount,
        email: client.email
      };
    }).sort((a, b) => b.orders - a.orders);

    const averageordersPerClient = clients.length > 0 ? 
      Math.round((clientorders.length / clients.length) * 100) / 100 : 0;

    return {
      totalorders: clientorders.length,
      averagePerClient: averageordersPerClient,
      topClients: ordersPerClient.slice(0, 5)
    };
  };

  const calculatePaymentStats = () => {
    const clientPayments = payments.filter(payment => {
      const paymentClient = clients.find(c => c.id === payment.usuario_id || c.name === payment.cliente_nombre);
      return paymentClient;
    });

    const totalRevenue = clientPayments.reduce((sum, payment) => sum + (parseFloat(payment.monto) || 0), 0);
    const averageRevenuePerClient = clients.length > 0 ? totalRevenue / clients.length : 0;

    const revenuePerClient = clients.map(client => {
      const clientRevenue = clientPayments
        .filter(payment => payment.usuario_id === client.id || payment.cliente_nombre === client.nombre)
        .reduce((sum, payment) => sum + (parseFloat(payment.monto) || 0), 0);
      
      return {
        client: client.nombre || client.username,
        revenue: clientRevenue,
        email: client.email
      };
    }).sort((a, b) => b.revenue - a.revenue);

    return {
      totalRevenue,
      averagePerClient: Math.round(averageRevenuePerClient * 100) / 100,
      topClients: revenuePerClient.slice(0, 5)
    };
  };

  const getClientDistribution = () => {
    const statusDistribution = {
      'Activo': clients.filter(c => c.estado === 'activo').length,
      'Inactivo': clients.filter(c => c.estado === 'inactivo').length,
      'Bloqueado': clients.filter(c => c.estado === 'bloqueado').length
    };

    const companyDistribution = clients.reduce((acc, client) => {
      const company = client.empresa || 'Sin empresa';
      acc[company] = (acc[company] || 0) + 1;
      return acc;
    }, {});

    return { statusDistribution, companyDistribution };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };


  const exportStats = () => {
    const statsData = {
      clients: calculateClientStats(),
      orders: calculateorderstats(),
      payments: calculatePaymentStats(),
      distribution: getClientDistribution(),
      exportDate: new Date().toISOString(),
      timeRange
    };

    const dataStr = JSON.stringify(statsData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `estadisticas_clientes_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (loading) {
    return (
      <div className={showNavigation ? "min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6" : "p-6"}>
        <div className={showNavigation ? "max-w-7xl mx-auto" : ""}>
          <div className="mb-8">
            <Skeleton height="8" width="1/3" className="mb-4" />
            <Skeleton height="4" width="2/3" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} variant="gradient" className="animate-pulse">
                <Skeleton height="6" width="1/4" className="mb-4" />
                <Skeleton height="4" width="full" className="mb-2" />
                <Skeleton height="4" width="3/4" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const clientStats = calculateClientStats();
  const orderstats = calculateorderstats();
  const paymentStats = calculatePaymentStats();
  const { statusDistribution, companyDistribution } = getClientDistribution();

  return (
    <div className={showNavigation ? "min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6" : ""}>
      <div className={showNavigation ? "max-w-7xl mx-auto" : ""}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-heading font-bold text-gray-800 dark:text-gray-100 mb-4">
                📊 Estadísticas de Clientes
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
                Análisis detallado del comportamiento y métricas de tus clientes
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchAllData}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Actualizar
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={exportStats}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar
              </Button>
            </div>
          </div>
        </div>

        {/* Time Range Filter */}
        <Card variant="gradient" className="mb-8">
          <div className="flex flex-wrap gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Período de análisis:
            </span>
            {['week', 'month', 'quarter', 'year'].map((period) => (
              <Button
                key={period}
                variant={timeRange === period ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange(period)}
              >
                {period === 'week' && 'Última semana'}
                {period === 'month' && 'Último mes'}
                {period === 'quarter' && 'Último trimestre'}
                {period === 'year' && 'Último año'}
              </Button>
            ))}
          </div>
        </Card>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {clientStats.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Clientes</div>
            <div className="flex items-center justify-center gap-1 text-xs">
              {clientStats.growthRate > 0 ? (
                <TrendingUp className="w-3 h-3 text-green-500" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-500" />
              )}
              <span className={clientStats.growthRate > 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(clientStats.growthRate)}%
              </span>
            </div>
          </Card>

          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="flex items-center justify-center mb-4">
              <Activity className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {clientStats.active}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Clientes Activos</div>
            <div className="text-xs text-green-600">
              {clientStats.retentionRate}% retención
            </div>
          </Card>

          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {orderstats.averagePerClient}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">orders/Cliente</div>
            <div className="text-xs text-purple-600">
              {orderstats.totalorders} total
            </div>
          </Card>

          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="flex items-center justify-center mb-4">
              <DollarSign className="w-8 h-8 text-orange-600" />
            </div>
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {formatCurrency(paymentStats.averagePerClient)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Ingreso/Cliente</div>
            <div className="text-xs text-orange-600">
              {formatCurrency(paymentStats.totalRevenue)} total
            </div>
          </Card>
        </div>

        {/* Distribution Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card variant="gradient">
            <div className="flex items-center gap-2 mb-6">
              <PieChart className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Distribución por Estado
              </h3>
            </div>
            <div className="space-y-4">
              {Object.entries(statusDistribution).map(([status, count]) => {
                const percentage = clientStats.total > 0 ? Math.round((count / clientStats.total) * 100) : 0;
                const colorClass = status === 'Activo' ? 'bg-green-500' : 
                                 status === 'Bloqueado' ? 'bg-yellow-500' : 'bg-red-500';
                
                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${colorClass}`}></div>
                      <span className="text-gray-700 dark:text-gray-300">{status}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-400">{count}</span>
                      <span className="text-xs text-gray-500">({percentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card variant="gradient">
            <div className="flex items-center gap-2 mb-6">
              <Building className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Top Empresas
              </h3>
            </div>
            <div className="space-y-4">
              {Object.entries(companyDistribution)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([company, count]) => {
                  const percentage = clientStats.total > 0 ? Math.round((count / clientStats.total) * 100) : 0;
                  
                  return (
                    <div key={company} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300 truncate">
                          {company.length > 20 ? `${company.substring(0, 20)}...` : company}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 dark:text-gray-400">{count}</span>
                        <span className="text-xs text-gray-500">({percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>
        </div>

        {/* Top Clients Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card variant="gradient">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Top Clientes por orders
              </h3>
            </div>
            <div className="space-y-3">
              {orderstats.topClients.map((client, index) => (
                <div key={client.client} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-full text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-100">{client.client}</p>
                      <p className="text-xs text-gray-500">{client.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{client.orders}</p>
                    <p className="text-xs text-gray-500">orders</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card variant="gradient">
            <div className="flex items-center gap-2 mb-6">
              <DollarSign className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Top Clientes por Ingresos
              </h3>
            </div>
            <div className="space-y-3">
              {paymentStats.topClients.map((client, index) => (
                <div key={client.client} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-orange-100 dark:bg-orange-900/20 text-orange-600 rounded-full text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-100">{client.client}</p>
                      <p className="text-xs text-gray-500">{client.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-orange-600">{formatCurrency(client.revenue)}</p>
                    <p className="text-xs text-gray-500">ingresos</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

ClientsStatsPage.propTypes = {
  showNavigation: PropTypes.bool
};

export default ClientsStatsPage;