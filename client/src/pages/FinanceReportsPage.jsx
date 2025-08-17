import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Card, Button, Skeleton } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { getPayments, getOrders, getUsers, getQuotes } from '../api/axios';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  PieChart,
  Calendar,
  DollarSign,
  Users,
  Package,
  CreditCard,
  FileText,
  Download,
  RefreshCw,
  Filter,
  Eye,
  Activity,
  Target
} from 'lucide-react';

const FinanceReportsPage = ({ showNavigation = true }) => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');
  const [reportType, setReportType] = useState('overview');

  // Cargar datos desde las APIs
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, ordersRes, usersRes, quotesRes] = await Promise.all([
        getPayments(),
        getOrders(),
        getUsers(),
        getQuotes()
      ]);

      if (paymentsRes.data.success) {
        setPayments(paymentsRes.data.data);
      }
      if (ordersRes.data.success) {
        setOrders(ordersRes.data.data);
      }
      if (usersRes.data.success) {
        setClients(usersRes.data.data.filter(user => user.rol !== 'admin'));
      }
      if (quotesRes.data.success) {
        setQuotes(quotesRes.data.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Funciones de cálculo para el rango de tiempo
  const getDateRange = () => {
    const now = new Date();
    let startDate, previousStartDate;
    
    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);
        break;
      default:
        return { startDate: null, endDate: now, previousStartDate: null, previousEndDate: startDate };
    }
    
    return { startDate, endDate: now, previousStartDate, previousEndDate: startDate };
  };

  const filterByDateRange = (items, dateField = 'fecha_registro') => {
    const { startDate } = getDateRange();
    if (!startDate) return items;
    
    return items.filter(item => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= startDate;
    });
  };

  const filterByPreviousDateRange = (items, dateField = 'fecha_registro') => {
    const { previousStartDate, previousEndDate } = getDateRange();
    if (!previousStartDate) return items;
    
    return items.filter(item => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= previousStartDate && itemDate < previousEndDate;
    });
  };

  // Cálculos de reportes financieros
  const calculateFinancialMetrics = () => {
    const currentPayments = filterByDateRange(payments, 'fecha');
    const previousPayments = filterByPreviousDateRange(payments, 'fecha');
    
    const currentRevenue = currentPayments.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0);
    const previousRevenue = previousPayments.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0);
    const revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue * 100) : 100;

    const currentOrders = filterByDateRange(orders, 'fecha_creacion');
    const previousOrders = filterByPreviousDateRange(orders, 'fecha_creacion');
    const ordersGrowth = previousOrders.length > 0 ? ((currentOrders.length - previousOrders.length) / previousOrders.length * 100) : 100;

    const currentClients = filterByDateRange(clients);
    const previousClients = filterByPreviousDateRange(clients);
    const clientsGrowth = previousClients.length > 0 ? ((currentClients.length - previousClients.length) / previousClients.length * 100) : 100;

    const avgOrderValue = currentOrders.length > 0 ? currentRevenue / currentOrders.length : 0;
    const conversionRate = quotes.length > 0 ? (currentOrders.length / quotes.length * 100) : 0;

    return {
      currentRevenue,
      previousRevenue,
      revenueGrowth: Math.round(revenueGrowth * 100) / 100,
      currentOrders: currentOrders.length,
      ordersGrowth: Math.round(ordersGrowth * 100) / 100,
      currentClients: currentClients.length,
      clientsGrowth: Math.round(clientsGrowth * 100) / 100,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100
    };
  };

  // Análisis por método de pago
  const getPaymentMethodAnalysis = () => {
    const currentPayments = filterByDateRange(payments, 'fecha');
    const methodStats = {};
    
    currentPayments.forEach(payment => {
      const method = payment.metodo_pago || 'No especificado';
      if (!methodStats[method]) {
        methodStats[method] = { count: 0, total: 0 };
      }
      methodStats[method].count++;
      methodStats[method].total += parseFloat(payment.monto) || 0;
    });

    return Object.entries(methodStats)
      .map(([method, stats]) => ({
        method,
        count: stats.count,
        total: stats.total,
        percentage: currentPayments.length > 0 ? Math.round((stats.count / currentPayments.length) * 100) : 0
      }))
      .sort((a, b) => b.total - a.total);
  };

  // Top clientes por ingresos
  const getTopClientsByRevenue = () => {
    const currentPayments = filterByDateRange(payments, 'fecha');
    const clientStats = {};
    
    currentPayments.forEach(payment => {
      const clientName = payment.cliente_nombre || 'Cliente desconocido';
      if (!clientStats[clientName]) {
        clientStats[clientName] = { total: 0, payments: 0 };
      }
      clientStats[clientName].total += parseFloat(payment.monto) || 0;
      clientStats[clientName].payments++;
    });

    return Object.entries(clientStats)
      .map(([client, stats]) => ({
        client,
        total: stats.total,
        payments: stats.payments,
        avgPayment: stats.payments > 0 ? stats.total / stats.payments : 0
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  };

  // Análisis mensual (últimos 6 meses)
  const getMonthlyAnalysis = () => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthPayments = payments.filter(payment => {
        const paymentDate = new Date(payment.fecha);
        return paymentDate >= monthStart && paymentDate <= monthEnd;
      });
      
      const monthOrders = orders.filter(order => {
        const orderDate = new Date(order.fecha_creacion);
        return orderDate >= monthStart && orderDate <= monthEnd;
      });

      months.push({
        month: date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
        revenue: monthPayments.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0),
        orders: monthOrders.length,
        payments: monthPayments.length
      });
    }
    
    return months;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const exportReport = () => {
    const reportData = {
      metrics: calculateFinancialMetrics(),
      paymentMethods: getPaymentMethodAnalysis(),
      topClients: getTopClientsByRevenue(),
      monthlyAnalysis: getMonthlyAnalysis(),
      reportType,
      timeRange,
      generatedAt: new Date().toISOString(),
      generatedBy: user ? {
        nombre: user.nombre,
        rol: user.rol,
        email: user.email
      } : null
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `reporte_financiero_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const exportDetailedReport = () => {
    const metrics = calculateFinancialMetrics();
    const paymentMethods = getPaymentMethodAnalysis();
    const topClients = getTopClientsByRevenue();
    const monthlyData = getMonthlyAnalysis();

    // Create a detailed text report
    const reportContent = `
REPORTE FINANCIERO DETALLADO
============================
Generado: ${new Date().toLocaleString('es-ES')}${user ? `\nGenerado por: ${user.nombre} (${user.rol})` : ''}
Período: ${timeRange === 'week' ? 'Última semana' : timeRange === 'month' ? 'Último mes' : timeRange === 'quarter' ? 'Último trimestre' : 'Último año'}
Tipo de Reporte: ${reportType === 'overview' ? 'Resumen General' : reportType === 'revenue' ? 'Análisis de Ingresos' : reportType === 'clients' ? 'Análisis de Clientes' : reportType === 'payments' ? 'Métodos de Pago' : 'Tendencias'}

MÉTRICAS PRINCIPALES
====================
• Ingresos Actuales: ${formatCurrency(metrics.currentRevenue)}
• Crecimiento de Ingresos: ${metrics.revenueGrowth > 0 ? '+' : ''}${metrics.revenueGrowth}%
• Pedidos: ${metrics.currentOrders}
• Crecimiento de Pedidos: ${metrics.ordersGrowth > 0 ? '+' : ''}${metrics.ordersGrowth}%
• Nuevos Clientes: ${metrics.currentClients}
• Crecimiento de Clientes: ${metrics.clientsGrowth > 0 ? '+' : ''}${metrics.clientsGrowth}%
• Valor Promedio por Pedido: ${formatCurrency(metrics.avgOrderValue)}
• Tasa de Conversión: ${metrics.conversionRate}%

ANÁLISIS MENSUAL
================
${monthlyData.map(month => 
  `${month.month}: ${formatCurrency(month.revenue)} (${month.orders} pedidos, ${month.payments} pagos)`
).join('\n')}

MÉTODOS DE PAGO
===============
${paymentMethods.map((method, index) => 
  `${index + 1}. ${method.method}: ${formatCurrency(method.total)} (${method.count} transacciones, ${method.percentage}%)`
).join('\n')}

TOP 5 CLIENTES
==============
${topClients.map((client, index) => 
  `${index + 1}. ${client.client}: ${formatCurrency(client.total)} (${client.payments} pagos, promedio: ${formatCurrency(client.avgPayment)})`
).join('\n')}

RECOMENDACIONES
===============
• Método de pago más exitoso: ${paymentMethods[0]?.method || 'N/A'}
• Cliente más valioso: ${topClients[0]?.client || 'N/A'}
• Tendencia general: ${metrics.revenueGrowth > 0 ? 'Crecimiento positivo' : 'Requiere atención'}

---
Reporte generado automáticamente por Borderless Techno Company
    `.trim();

    const dataUri = 'data:text/plain;charset=utf-8,' + encodeURIComponent(reportContent);
    const exportFileDefaultName = `reporte_detallado_${new Date().toISOString().split('T')[0]}.txt`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const previewClientDetails = (client) => {
    // Create a detailed client information preview
    const clientDetails = `
DETALLES DEL CLIENTE
====================
Cliente: ${client.client}
Total de Ingresos: ${formatCurrency(client.total)}
Número de Pagos: ${client.payments}
Pago Promedio: ${formatCurrency(client.avgPayment)}

MÉTRICAS ADICIONALES
====================
• Contribución a ingresos totales: ${((client.total / calculateFinancialMetrics().currentRevenue) * 100).toFixed(2)}%
• Frecuencia de pago: ${(client.payments / metrics.currentOrders * 100).toFixed(1)}% de todos los pedidos
• Clasificación: ${client.total > metrics.avgOrderValue * 5 ? 'Cliente Premium' : client.total > metrics.avgOrderValue * 2 ? 'Cliente Valioso' : 'Cliente Regular'}

ANÁLISIS
========
${client.payments === 1 ? 
  'Cliente nuevo con un solo pago realizado.' : 
  `Cliente recurrente con ${client.payments} pagos realizados.`}

${client.avgPayment > metrics.avgOrderValue ? 
  'Este cliente genera pedidos por encima del promedio.' : 
  'Este cliente realiza pedidos dentro del rango promedio.'}

---
Vista previa generada automáticamente
    `.trim();

    // Show in alert for now (could be enhanced with a modal)
    alert(clientDetails);
  };

  if (loading) {
    return (
      <div className={showNavigation ? "min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6" : "p-6"}>
        <div className={showNavigation ? "max-w-7xl mx-auto" : ""}>
          <div className="mb-8">
            <Skeleton height="8" width="1/3" className="mb-4" />
            <Skeleton height="4" width="2/3" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

  const metrics = calculateFinancialMetrics();
  const paymentMethods = getPaymentMethodAnalysis();
  const topClients = getTopClientsByRevenue();
  const monthlyData = getMonthlyAnalysis();

  return (
    <div className={showNavigation ? "min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6" : ""}>
      <div className={showNavigation ? "max-w-7xl mx-auto" : ""}>        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-heading font-bold text-gray-800 dark:text-gray-100 mb-4">
                📈 Reportes Financieros
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
                Análisis detallado del rendimiento financiero y métricas de negocio
              </p>
              {user && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Reporte generado por: <span className="font-medium">{user.nombre}</span> | {user.rol}
                </p>
              )}
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
                onClick={exportReport}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar JSON
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={exportDetailedReport}
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Reporte Detallado
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

        {/* Report Type Filter */}
        <Card variant="gradient" className="mb-8">
          <div className="flex flex-wrap gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Tipo de reporte:
            </span>
            {[
              { key: 'overview', label: 'Resumen General' },
              { key: 'revenue', label: 'Análisis de Ingresos' },
              { key: 'clients', label: 'Análisis de Clientes' },
              { key: 'payments', label: 'Métodos de Pago' },
              { key: 'trends', label: 'Tendencias' }
            ].map((type) => (
              <Button
                key={type.key}
                variant={reportType === type.key ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setReportType(type.key)}
              >
                {type.label}
              </Button>
            ))}
          </div>
        </Card>

        {/* Main Financial Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="flex items-center justify-center mb-4">
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {formatCurrency(metrics.currentRevenue)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Ingresos</div>
            <div className="flex items-center justify-center gap-1 text-xs">
              {metrics.revenueGrowth > 0 ? (
                <TrendingUp className="w-3 h-3 text-green-500" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-500" />
              )}
              <span className={metrics.revenueGrowth > 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(metrics.revenueGrowth)}%
              </span>
            </div>
          </Card>

          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {metrics.currentOrders}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Pedidos</div>
            <div className="flex items-center justify-center gap-1 text-xs">
              {metrics.ordersGrowth > 0 ? (
                <TrendingUp className="w-3 h-3 text-green-500" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-500" />
              )}
              <span className={metrics.ordersGrowth > 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(metrics.ordersGrowth)}%
              </span>
            </div>
          </Card>

          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="flex items-center justify-center mb-4">
              <Target className="w-8 h-8 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {formatCurrency(metrics.avgOrderValue)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Valor Promedio</div>
            <div className="text-xs text-purple-600">
              por pedido
            </div>
          </Card>

          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="flex items-center justify-center mb-4">
              <Activity className="w-8 h-8 text-orange-600" />
            </div>
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {metrics.conversionRate}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Conversión</div>
            <div className="text-xs text-orange-600">
              cotización → pedido
            </div>
          </Card>
        </div>

        {/* Charts and Analysis */}
        {(reportType === 'overview' || reportType === 'revenue' || reportType === 'trends') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Trend */}
          <Card variant="gradient">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Evolución Mensual
              </h3>
            </div>
            <div className="space-y-4">
              {monthlyData.map((month) => (
                <div key={month.month} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-full text-sm font-bold">
                      {month.month}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-100">
                        {formatCurrency(month.revenue)}
                      </p>
                      <p className="text-xs text-gray-500">{month.orders} pedidos, {month.payments} pagos</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${Math.min(100, (month.revenue / Math.max(...monthlyData.map(m => m.revenue))) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Payment Methods */}
          <Card variant="gradient">
            <div className="flex items-center gap-2 mb-6">
              <PieChart className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Métodos de Pago
              </h3>
            </div>
            <div className="space-y-4">
              {paymentMethods.map((method, index) => {
                const colors = ['bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500'];
                const colorClass = colors[index % colors.length];
                
                return (
                  <div key={method.method} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${colorClass}`}></div>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-100">{method.method}</p>
                        <p className="text-xs text-gray-500">{method.count} transacciones</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{formatCurrency(method.total)}</p>
                      <p className="text-xs text-gray-500">{method.percentage}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
        )}

        {/* Top Clients */}
        {(reportType === 'overview' || reportType === 'clients') && (
        <Card variant="gradient" className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Top 5 Clientes por Ingresos
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {topClients.map((client, index) => (
              <div key={client.client} className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/20 text-purple-600 rounded-full text-lg font-bold mx-auto mb-3">
                  {index + 1}
                </div>
                <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-2 truncate" title={client.client}>
                  {client.client.length > 15 ? `${client.client.substring(0, 15)}...` : client.client}
                </h4>
                <p className="text-xl font-bold text-purple-600 mb-1">
                  {formatCurrency(client.total)}
                </p>
                <p className="text-xs text-gray-500">
                  {client.payments} pagos
                </p>
                <p className="text-xs text-gray-500">
                  Promedio: {formatCurrency(client.avgPayment)}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => previewClientDetails(client)}
                  className="mt-2 text-xs flex items-center gap-1 mx-auto"
                >
                  <Eye className="w-3 h-3" />
                  Ver detalles
                </Button>
              </div>
            ))}
          </div>
        </Card>
        )}

        {/* Summary Cards */}
        {(reportType === 'overview' || reportType === 'trends') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="gradient" className="text-center">
            <div className="flex items-center justify-center mb-4">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
              Rendimiento General
            </h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Ingresos:</span>
                <span className="font-medium">{formatCurrency(metrics.currentRevenue)}</span>
              </div>
              <div className="flex justify-between">
                <span>Pedidos:</span>
                <span className="font-medium">{metrics.currentOrders}</span>
              </div>
              <div className="flex justify-between">
                <span>Nuevos clientes:</span>
                <span className="font-medium">{metrics.currentClients}</span>
              </div>
            </div>
          </Card>

          <Card variant="gradient" className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Target className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
              Métricas Clave
            </h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Valor promedio:</span>
                <span className="font-medium">{formatCurrency(metrics.avgOrderValue)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tasa conversión:</span>
                <span className="font-medium">{metrics.conversionRate}%</span>
              </div>
              <div className="flex justify-between">
                <span>Métodos de pago:</span>
                <span className="font-medium">{paymentMethods.length}</span>
              </div>
            </div>
          </Card>

          <Card variant="gradient" className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Activity className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
              Tendencias
            </h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex justify-between items-center">
                <span>Ingresos:</span>
                <span className={`font-medium flex items-center gap-1 ${metrics.revenueGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.revenueGrowth > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(metrics.revenueGrowth)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Pedidos:</span>
                <span className={`font-medium flex items-center gap-1 ${metrics.ordersGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.ordersGrowth > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(metrics.ordersGrowth)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Clientes:</span>
                <span className={`font-medium flex items-center gap-1 ${metrics.clientsGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.clientsGrowth > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(metrics.clientsGrowth)}%
                </span>
              </div>
            </div>
          </Card>
        </div>
        )}

        {/* Payment Methods Detailed Analysis */}
        {reportType === 'payments' && (
          <div className="space-y-6">
            <Card variant="gradient">
              <div className="flex items-center gap-2 mb-6">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  Análisis Detallado de Métodos de Pago
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paymentMethods.map((method, index) => {
                  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
                  const colorClass = colors[index % colors.length];
                  
                  return (
                    <Card key={method.method} variant="glass" className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-6 h-6 rounded-full ${colorClass}`}></div>
                        <h4 className="font-medium text-gray-800 dark:text-gray-100">{method.method}</h4>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Total:</span>
                          <span className="font-bold text-green-600">{formatCurrency(method.total)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Transacciones:</span>
                          <span className="font-medium">{method.count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Participación:</span>
                          <span className="font-medium text-blue-600">{method.percentage}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Promedio:</span>
                          <span className="font-medium">{formatCurrency(method.total / method.count)}</span>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </Card>

            <Card variant="gradient">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  Recomendaciones de Métodos de Pago
                </h3>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Método más Popular</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {paymentMethods[0]?.method || 'N/A'} representa el {paymentMethods[0]?.percentage || 0}% de todas las transacciones.
                  </p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Mayor Volumen</h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {paymentMethods[0]?.method || 'N/A'} genera el mayor volumen de ingresos con {formatCurrency(paymentMethods[0]?.total || 0)}.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Revenue Analysis Detailed View */}
        {reportType === 'revenue' && (
          <div className="space-y-6">
            <Card variant="gradient">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  Análisis Detallado de Ingresos
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-800 dark:text-gray-100">Métricas Clave</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-400">Ingresos Actuales:</span>
                      <span className="font-bold text-green-600">{formatCurrency(metrics.currentRevenue)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-400">Ingresos Previos:</span>
                      <span className="font-medium">{formatCurrency(metrics.previousRevenue)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-400">Crecimiento:</span>
                      <span className={`font-bold ${metrics.revenueGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {metrics.revenueGrowth > 0 ? '+' : ''}{metrics.revenueGrowth}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-800 dark:text-gray-100">Distribución de Ingresos</h4>
                  <div className="space-y-3">
                    {monthlyData.slice(-3).map((month) => (
                      <div key={month.month} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <span className="text-gray-600 dark:text-gray-400">{month.month}:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{formatCurrency(month.revenue)}</span>
                          <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ 
                                width: `${Math.min(100, (month.revenue / Math.max(...monthlyData.map(m => m.revenue))) * 100)}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

FinanceReportsPage.propTypes = {
  showNavigation: PropTypes.bool
};

FinanceReportsPage.defaultProps = {
  showNavigation: true
};

export default FinanceReportsPage;