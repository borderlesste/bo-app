import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components';
import StatsCards from '../components/dashboard/StatsCards';
import AdvancedStats from '../components/dashboard/AdvancedStats';
import ChartsSection from '../components/dashboard/ChartsSection';
import RecentActivity from '../components/dashboard/RecentActivity';
import TopClients from '../components/dashboard/TopClients';
import QuickActions from '../components/dashboard/QuickActions';
import PendingPaymentsAlert from '../components/dashboard/PendingPaymentsAlert';
import Button from '../components/Button';
import { AlertCircle } from "lucide-react";
import { getAdminStats, getRecentActivity, getTopClients } from '../api/axios';

const AdminDashboardNew = () => {
  const [stats, setStats] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [topClients, setTopClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('month');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [statsRes, activityRes, clientsRes] = await Promise.all([
          getAdminStats(),
          getRecentActivity(),
          getTopClients()
        ]);

        if (statsRes.data.success) {
          setStats(statsRes.data.data);
        }

        if (activityRes.data.success) {
          setRecentActivity(activityRes.data.data);
        }

        if (clientsRes.data.success) {
          setTopClients(clientsRes.data.data);
        }
        
      } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
        setError('Error al cargar los datos del dashboard');
        setStats({});
        setRecentActivity([]);
        setTopClients([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [timeRange]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return `Hace ${diffHours}h`;
    } else {
      const diffDays = Math.ceil(diffHours / 24);
      return `Hace ${diffDays}d`;
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'new_payment': return '=�';
      case 'new_quote': return '=�';
      case 'project_completed': return '';
      case 'overdue_payment': return '�';
      case 'new_client': return '=d';
      default: return '=�';
    }
  };

  const getActivityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-500 bg-red-50/50 dark:bg-red-900/10';
      case 'high': return 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10';
      default: return 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10';
    }
  };

  const handleQuickAction = (actionId) => {
    switch (actionId) {
      case 'new_client':
        console.log('Nueva acci�n de cliente');
        break;
      case 'new_order':
        console.log('Nueva acci�n de pedido');
        break;
      case 'new_payment':
        console.log('Nueva acci�n de pago');
        break;
      case 'view_reports':
        console.log('Ver reportes');
        break;
      default:
        console.log('Acci�n r�pida:', actionId);
    }
  };

  const handleViewPayments = () => {
    console.log('Ver pagos pendientes');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="mb-8">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white/10 border border-white/20 rounded-2xl p-6">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Error al cargar datos</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="primary">
              Reintentar
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-heading font-bold text-gray-800 dark:text-gray-100 mb-4">
                Dashboard Administrativo
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Vista moderna del panel de administración con métricas actualizadas
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant={timeRange === 'week' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange('week')}
              >
                Esta semana
              </Button>
              <Button
                variant={timeRange === 'month' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange('month')}
              >
                Este mes
              </Button>
              <Button
                variant={timeRange === 'year' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange('year')}
              >
                Este año
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards stats={stats} formatCurrency={formatCurrency} />

        {/* Advanced Statistics */}
        <AdvancedStats 
          stats={stats} 
          formatCurrency={formatCurrency}
          className="mb-8"
        />

        {/* Charts Section */}
        <ChartsSection 
          stats={stats}
          recentActivity={recentActivity}
          topClients={topClients}
          formatCurrency={formatCurrency}
          className="mb-8"
        />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <RecentActivity 
              recentActivity={recentActivity}
              formatDate={formatDate}
              getActivityIcon={getActivityIcon}
              getActivityColor={getActivityColor}
            />
          </div>

          {/* Top Clients */}
          <div>
            <TopClients 
              topClients={topClients}
              formatCurrency={formatCurrency}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <QuickActions onActionClick={handleQuickAction} />

        {/* Pending Payments Alert */}
        <PendingPaymentsAlert 
          stats={stats}
          formatCurrency={formatCurrency}
          onViewPayments={handleViewPayments}
        />
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboardNew;