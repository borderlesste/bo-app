import { useState, useEffect } from 'react';
import { Skeleton, DashboardLayout } from '../components';
import StatsCards from '../components/dashboard/StatsCards';
import AdvancedStats from '../components/dashboard/AdvancedStats';
import ChartsSection from '../components/dashboard/ChartsSection';
import RecentActivity from '../components/dashboard/RecentActivity';
import TopClients from '../components/dashboard/TopClients';
import QuickActions from '../components/dashboard/QuickActions';
import PendingPaymentsAlert from '../components/dashboard/PendingPaymentsAlert';
import Button from '../components/Button';
import { 
  Users, 
  Package, 
  CreditCard, 
  Settings,
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Shield,
} from "lucide-react";
import {
  createUser,
  updateUser,
  deleteUser,
  getUsers,
  getPedidos,
  getPayments,
  createPedido,
  updatePedido,
  deletePedido,
  createAdminPayment,
  updateAdminPayment,
  deletePayment,
  updateConfig,
  getAdminStats,
  getRecentActivity,
  getTopClients,
  getChartsData,
  getFinancialSummary
} from '../api/axios';
import UserModal from '../components/UserModal';
import PedidoModal from '../components/CreatePedidoModal';
import PaymentModal from '../components/PaymentModal';
import ChangePasswordModal from '../components/ChangePasswordModal';
import QuotesPage from './QuotesPage';
import PedidosPage from './PedidosPage';
import HistoryPage from './HistoryPage';
import ClientsViewPage from './ClientsViewPage';
import ClientsNewPage from './ClientsNewPage';
import ClientsStatsPage from './ClientsStatsPage';
import FinancePaymentsPage from './FinancePaymentsPage';
import FinanceReportsPage from './FinanceReportsPage';
import FinanceInvoicesPage from './FinanceInvoicesPage';
import CommunicationNotificationsPage from './CommunicationNotificationsPage';
import CommunicationMessagesPage from './CommunicationMessagesPage';
import CommunicationEmailMarketingPage from './CommunicationEmailMarketingPage';
import ConfigurationGeneralPage from './ConfigurationGeneralPage';
import IntegrationsPage from './IntegrationsPage';
import SecurityPage from './SecurityPage';
import ProjectsAdminPage from './ProjectsAdminPage';

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [topClients, setTopClients] = useState([]);
  const [chartsData, setChartsData] = useState({});
  const [financialSummary, setFinancialSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [error, setError] = useState(null);

  // CRUD Data States
  const [usuarios, setUsuarios] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [pagos, setPagos] = useState([]);

  // Modal States
  const [isUserModalOpen, setUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isPedidoModalOpen, setPedidoModalOpen] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isChangePasswordModalOpen, setChangePasswordModalOpen] = useState(false);

  // Config States
  const [paypalusuarioId, setPaypalusuarioId] = useState('');
  const [paypalSecretKey, setPaypalSecretKey] = useState('');
  const [configMessage, setConfigMessage] = useState('');

  // Manejar la selección del sidebar
  const handleSidebarOptionSelect = (optionId) => {
    // Si es una opción del Panel Principal, cambiar a la pestaña correspondiente
    if (['dashboard', 'overview', 'analytics', 'quick-stats'].includes(optionId)) {
      setActiveTab(optionId);
    }
    // Si es una opción de Pedidos y Cotizaciones, cambiar a la pestaña correspondiente
    if (['cotizaciones', 'pedidos', 'historial'].includes(optionId)) {
      setActiveTab(optionId);
    }
    // Si es una opción de Gestión de Usuarios, cambiar a la pestaña correspondiente
    if (['ver-usuarios', 'nuevo-usuario', 'estadisticas-usuarios'].includes(optionId)) {
      setActiveTab(optionId);
    }
    // Si es una opción de Finanzas, cambiar a la pestaña correspondiente
    if (['pagos-finanzas', 'reportes-finanzas', 'facturas-finanzas'].includes(optionId)) {
      setActiveTab(optionId);
    }
    // Si es una opción de Comunicaciones, cambiar a la pestaña correspondiente
    if (['notificaciones-comm', 'mensajes-comm', 'emails-comm'].includes(optionId)) {
      setActiveTab(optionId);
    }
    // Si es una opción de Gestión de Contenido, cambiar a la pestaña correspondiente
    if (['proyectos-admin'].includes(optionId)) {
      setActiveTab(optionId);
    }
    // Si es una opción de Configuración, cambiar a la pestaña correspondiente
    if (['configuracion-general', 'integraciones', 'seguridad'].includes(optionId)) {
      setActiveTab(optionId);
    }
  };

  // Cargar datos reales del servidor
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [statsRes, activityRes, clientsRes, chartsRes, financialRes, usersRes, pedidosRes, pagosRes] = await Promise.all([
          getAdminStats(),
          getRecentActivity(),
          getTopClients(),
          getChartsData(timeRange),
          getFinancialSummary(),
          getUsers(),
          getPedidos(),
          getPayments()
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

        if (chartsRes.data.success) {
          setChartsData(chartsRes.data.data);
        }

        if (financialRes.data.success) {
          setFinancialSummary(financialRes.data.data);
        }

        if (usersRes.data) {
          setUsuarios(usersRes.data);
        }

        if (pedidosRes.data) {
          setPedidos(pedidosRes.data);
        }

        if (pagosRes.data) {
          setPagos(pagosRes.data);
        }
        
      } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
        setError('Error al cargar los datos del dashboard');
        // Establecer valores por defecto en caso de error
        setStats({});
        setRecentActivity([]);
        setTopClients([]);
        setChartsData({});
        setFinancialSummary({});
        setUsuarios([]);
        setPedidos([]);
        setPagos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [timeRange]);

  // Función para refrescar todos los datos
  const fetchAllData = async () => {
    try {
      // Fetch all necessary data for the admin dashboard
      const [usersResponse, pedidosResponse, pagosResponse] = await Promise.all([
        getUsers(),
        getPedidos(),
        getPayments()
      ]);
      
      if (usersResponse.data) {
        setUsuarios(usersResponse.data);
      }
      
      if (pedidosResponse.data) {
        setPedidos(pedidosResponse.data);
      }
      
      if (pagosResponse.data) {
        setPagos(pagosResponse.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Error al cargar los datos');
    }
  };

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
      case 'new_payment': return '💰';
      case 'new_quote': return '📋';
      case 'project_completed': return '✅';
      case 'overdue_payment': return '⚠️';
      case 'new_client': return '👤';
      default: return '📢';
    }
  };

  const getActivityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-500 bg-red-50/50 dark:bg-red-900/10';
      case 'high': return 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10';
      default: return 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10';
    }
  };

  // Config Handlers
  const handleSaveConfig = async () => {
    try {
      const payload = {
        PAYPAL_CLIENT_ID: paypalusuarioId,
        PAYPAL_SECRET_KEY: paypalSecretKey,
      };
      if (!payload.PAYPAL_SECRET_KEY) {
        delete payload.PAYPAL_SECRET_KEY;
      }
      
      await updateConfig(payload);
      setConfigMessage('¡Configuración de PayPal guardada con éxito!');
      setPaypalSecretKey('');
      setTimeout(() => setConfigMessage(''), 3000);
    } catch (error) {
      console.error("Error al guardar la configuración:", error);
      setConfigMessage('Error al guardar. Verifique la consola.');
      setTimeout(() => setConfigMessage(''), 3000);
    }
  };

  // User Handlers
  const handleOpenUserModal = (user = null) => {
    setSelectedUser(user);
    setUserModalOpen(true);
  };
  const handleCloseUserModal = () => {
    setSelectedUser(null);
    setUserModalOpen(false);
  };
  const handleSaveUser = async (userData) => {
    try {
      if (selectedUser) {
        await updateUser(selectedUser.id, userData);
      } else {
        await createUser(userData);
      }
      await fetchAllData();
    } catch (error) {
      console.error("Error al guardar el usuario:", error);
      throw error;
    }
  };
  const handleDeleteUser = async (userId) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este usuario?")) {
      try {
        await deleteUser(userId);
        await fetchAllData();
      } catch (error) {
        console.error("Error al eliminar el usuario:", error);
        setError("No se pudo eliminar el usuario.");
      }
    }
  };

  // Pedido Handlers
  const handleOpenPedidoModal = (pedido = null) => {
    setSelectedPedido(pedido);
    setPedidoModalOpen(true);
  };
  const handleClosePedidoModal = () => {
    setSelectedPedido(null);
    setPedidoModalOpen(false);
  };
  const handleSavePedido = async (pedidoData) => {
    try {
      if (selectedPedido) {
        await updatePedido(selectedPedido.id, pedidoData);
      } else {
        await createPedido(pedidoData);
      }
      await fetchAllData();
    } catch (error) {
      console.error("Error al guardar el pedido:", error);
      throw error;
    }
  };
  const handleDeletePedido = async (pedidoId) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este pedido?")) {
      try {
        await deletePedido(pedidoId);
        await fetchAllData();
      } catch (error) {
        console.error("Error al eliminar el pedido:", error);
        setError("No se pudo eliminar el pedido.");
      }
    }
  };

  // Payment Handlers
  const handleOpenPaymentModal = (payment = null) => {
    setSelectedPayment(payment);
    setPaymentModalOpen(true);
  };
  const handleClosePaymentModal = () => {
    setSelectedPayment(null);
    setPaymentModalOpen(false);
  };
  const handleSavePayment = async (paymentData) => {
    try {
      if (selectedPayment) {
        await updateAdminPayment(selectedPayment.id, paymentData);
      } else {
        await createAdminPayment(paymentData);
      }
      await fetchAllData();
    } catch (error) {
      console.error("Error al guardar el pago:", error);
      throw error;
    }
  };
  const handleDeletePayment = async (paymentId) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este pago?")) {
      try {
        await deletePayment(paymentId);
        await fetchAllData();
      } catch (error) {
        console.error("Error al eliminar el pago:", error);
        setError("No se pudo eliminar el pago.");
      }
    }
  };

  // Change Password Handlers
  const handleOpenChangePasswordModal = () => {
    setChangePasswordModalOpen(true);
  };
  const handleCloseChangePasswordModal = () => {
    setChangePasswordModalOpen(false);
  };

  // Utility functions
  const getStatusIcon = (estado) => {
    if (typeof estado !== 'string') return <AlertCircle className="w-4 h-4 text-gray-500" />;
    switch (estado.toLowerCase()) {
      case "completado": case "pagado": case "activo": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "en_proceso": return <Clock className="w-4 h-4 text-blue-500" />;
      case "pendiente": case "nuevo": return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case "pendiente de verificación": return <Mail className="w-4 h-4 text-orange-500" />;
      case "vencido": case "inactivo": return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (estado) => {
    if (typeof estado !== 'string') return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    switch (estado.toLowerCase()) {
      case "completado": case "pagado": case "activo": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "en_proceso": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "pendiente": case "nuevo": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "pendiente de verificación": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "vencido": case "inactivo": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getPriorityColor = (prioridad) => {
    if (typeof prioridad !== 'string') return "bg-gray-500";
    switch (prioridad.toLowerCase()) {
      case "alta": return "bg-red-500";
      case "normal": return "bg-yellow-500";
      case "baja": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const filterData = (data, searchFields) => {
    return data.filter(item => {
      if (!item) return false;
      const matchesSearch = searchFields.some(field => 
        String(item[field] || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      const statusMatches = filterStatus === "todos" || (item.estado && item.estado === filterStatus);
      return matchesSearch && statusMatches;
    });
  };

  const handleAddClick = () => {
    switch (activeTab) {
      case 'usuarios':
        handleOpenUserModal();
        break;
      case 'pedidos':
        handleOpenPedidoModal();
        break;
      case 'pagos':
        handleOpenPaymentModal();
        break;
      default:
        break;
    }
  };

  // Handlers para acciones rápidas
  const handleQuickAction = (actionId) => {
    switch (actionId) {
      case 'new_user':
        setActiveTab('usuarios');
        handleOpenUserModal();
        break;
      case 'new_pedido':
        setActiveTab('pedidos');
        handleOpenPedidoModal();
        break;
      case 'new_payment':
        setActiveTab('pagos');
        handleOpenPaymentModal();
        break;
      case 'view_reports':
        setActiveTab('dashboard');
        break;
      default:
        console.log('Acción rápida:', actionId);
    }
  };

  const handleViewPayments = () => {
    setActiveTab('pagos');
    setFilterStatus('pendiente');
  };

  // Calculated values for AdminPanel dashboard
  const completedPedidosCount = pedidos.filter(p => p.estado?.toLowerCase() === 'completado').length;
  const totalIncome = pagos.reduce((sum, p) => 
    p.estado?.toLowerCase() === 'pagado' ? sum + parseFloat(p.monto || 0) : sum, 
    0
  );
  const pendingPedidosCount = pedidos.filter(p => p.estado?.toLowerCase() === 'pendiente').length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Skeleton height="8" width="1/3" className="mb-4" />
            <Skeleton height="4" width="2/3" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white/10 border border-white/20 rounded-2xl p-6 animate-pulse">
                <Skeleton height="8" width="1/2" className="mb-2" />
                <Skeleton height="4" width="3/4" />
              </div>
            ))}
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
    <DashboardLayout onSidebarOptionSelect={handleSidebarOptionSelect}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-heading font-bold text-gray-800 dark:text-gray-100 mb-4">
                Panel de Administración
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                {activeTab === 'dashboard' 
                  ? 'Vista general de tu negocio y actividades recientes'
                  : `Gestiona ${activeTab} desde un panel centralizado`
                }
              </p>
            </div>
            {activeTab === 'dashboard' && (
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
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 bg-white dark:bg-slate-800 rounded-lg p-2 shadow-lg">
          {[
            { id: "dashboard", label: "Dashboard Principal", icon: BarChart3 }, 
            //{ id: "clientes", label: "Clientes (CRUD)", icon: Users },
            { id: "pagos", label: "Pagos", icon: CreditCard },
            { id: "configuracion", label: "Configuración (Legacy)", icon: Settings }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 rounded-md font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-violet-600 text-white shadow-lg"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters for CRUD tabs */}
        {activeTab !== "dashboard" && activeTab !== "configuracion" && (
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)} 
                className="px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              >
                <option value="todos">Todos</option>
                {activeTab === 'usuarios' && (
                  <>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </>
                )}
                {activeTab === 'pedidos' && (
                  <>
                    <option value="pendiente">Pendiente</option>
                    <option value="en_proceso">En Progreso</option>
                    <option value="completado">Completado</option>
                  </>
                )}
                {activeTab === 'pagos' && (
                  <>
                    <option value="pagado">Pagado</option>
                    <option value="pendiente de verificación">Pendiente de Verificación</option>
                    <option value="vencido">Vencido</option>
                    <option value="pendiente">Pendiente</option>
                  </>
                )}
              </select>
            </div>
            <button 
              onClick={handleAddClick} 
              className="flex items-center justify-center px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar {activeTab.slice(0, -1)}
            </button>
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === "dashboard" && (
          <>
            {/* Stats Cards */}
            <StatsCards stats={stats} formatCurrency={formatCurrency} />

            {/* Advanced Statistics */}
            <AdvancedStats 
              stats={stats} 
              financialSummary={financialSummary}
              formatCurrency={formatCurrency}
              className="mb-8"
            />

            {/* Charts Section */}
            <ChartsSection 
              stats={stats}
              chartsData={chartsData}
              recentActivity={recentActivity}
              topClients={topClients}
              formatCurrency={formatCurrency}
              className="mb-8"
            />

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
          </>
        )}

        {/* Overview Tab - Resumen General */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Clientes Totales</p>
                    <p className="text-3xl font-bold">{stats.totalClients || 0}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-200" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Proyectos Activos</p>
                    <p className="text-3xl font-bold">{stats.activeProjects || 0}</p>
                  </div>
                  <Package className="w-8 h-8 text-green-200" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Ingresos del Mes</p>
                    <p className="text-3xl font-bold">{formatCurrency(stats.monthlyRevenue || 0)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-purple-200" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Pagos Pendientes</p>
                    <p className="text-3xl font-bold">{stats.pendingPayments || 0}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-orange-200" />
                </div>
              </div>
            </div>
            
            {/* Recent Activity Summary */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Actividad Reciente</h3>
              <div className="space-y-3">
                {recentActivity.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{getActivityIcon(activity.type)}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white">{activity.message}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(activity.date)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab - Análisis Detallado */}
        {activeTab === "analytics" && (
          <div className="space-y-8">
            <ChartsSection 
              stats={stats}
              chartsData={chartsData}
              recentActivity={recentActivity}
              topClients={topClients}
              formatCurrency={formatCurrency}
              className="mb-8"
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Rendimiento por Período</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Esta Semana</span>
                    <span className="font-semibold text-green-600">+12%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Este Mes</span>
                    <span className="font-semibold text-blue-600">+8%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Este Año</span>
                    <span className="font-semibold text-purple-600">+25%</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Métricas de Conversión</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Cotizaciones a pedidos</span>
                    <span className="font-semibold text-green-600">68%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Retención de Clientes</span>
                    <span className="font-semibold text-blue-600">85%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Satisfacción</span>
                    <span className="font-semibold text-purple-600">94%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats Tab - Estadísticas Rápidas */}
        {activeTab === "quick-stats" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">{stats.totalClients || 0}</div>
                <div className="text-gray-600 dark:text-gray-400">Clientes Registrados</div>
                <div className="text-sm text-green-600 mt-1">+{stats.newClientsThisMonth || 0} este mes</div>
              </div>
              
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">{stats.completedProjects || 0}</div>
                <div className="text-gray-600 dark:text-gray-400">Proyectos Completados</div>
                <div className="text-sm text-blue-600 mt-1">{stats.activeProjects || 0} activos</div>
              </div>
              
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">{formatCurrency(stats.averageProjectValue || 0)}</div>
                <div className="text-gray-600 dark:text-gray-400">Valor Promedio</div>
                <div className="text-sm text-orange-600 mt-1">{stats.pendingQuotes || 0} cotizaciones</div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Resumen Ejecutivo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-white mb-3">Ingresos</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Mensual:</span>
                      <span className="font-semibold">{formatCurrency(stats.monthlyRevenue || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Pendiente:</span>
                      <span className="font-semibold text-orange-600">{formatCurrency((stats.pendingPayments || 0) * 1000)}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-white mb-3">Proyectos</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">En progreso:</span>
                      <span className="font-semibold">{stats.activeProjects || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Completados:</span>
                      <span className="font-semibold text-green-600">{stats.completedProjects || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard básico del AdminPanel */}
        {activeTab === "dashboard_basico" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border-l-4 border-violet-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Usuarios</p>
                    <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{usuarios.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-violet-500" />
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Pedidos Completados</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{completedPedidosCount}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Ingresos Totales</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">${totalIncome.toLocaleString()}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Pedidos Pendientes</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{pendingPedidosCount}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-orange-500" />
                </div>
              </div>
            </div>
        )}

        {/* CRUD Tables */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
          {activeTab === "usuarios" && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usuario</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contacto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rol</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Registro</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filterData(usuarios, ['nombre', 'email']).map((usuario) => (
                    <tr key={usuario.id} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                      <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-violet-400 to-purple-400 flex items-center justify-center text-white font-medium">
                              {usuario.nombre?.charAt(0)}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{usuario.nombre}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">ID: {usuario.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white flex items-center">
                            <Mail className="w-4 h-4 mr-2 text-gray-400" />
                            {usuario.email}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                            {usuario.telefono}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {getStatusIcon(usuario.estado)}
                            <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(usuario.estado)}`}>
                              {usuario.estado}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{usuario.rol}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(usuario.fecha_registro).toLocaleDateString()}
                          </div>
                        </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button onClick={() => handleOpenUserModal(usuario)} className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteUser(usuario.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "pedidos" && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prioridad</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filterData(pedidos, ['cliente_nombre', 'descripcion']).map((pedido) => (
                    <tr key={pedido.id} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                      <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{pedido.cliente_nombre}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">{pedido.descripcion}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {getStatusIcon(pedido.estado)}
                            <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(pedido.estado)}`}>
                              {pedido.estado}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${getPriorityColor(pedido.prioridad)}`}></div>
                            <span className="text-sm text-gray-600 dark:text-gray-300">{pedido.prioridad}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">${pedido.valor?.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(pedido.fecha_creacion).toLocaleDateString()}
                          </div>
                        </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button onClick={() => handleOpenPedidoModal(pedido)} className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeletePedido(pedido.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "pagos" && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referencia</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filterData(pagos, ['cliente_nombre', 'concepto']).map((pago) => (
                    <tr key={pago.id} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                      <td className="px-6 py-4">{pago.cliente_nombre}</td>
                      <td className="px-6 py-4">{pago.concepto}</td>
                      <td className="px-6 py-4">${pago.monto?.toLocaleString()}</td>
                      <td className="px-6 py-4">{pago.metodo}</td>
                      <td className="px-6 py-4">{pago.referencia_transferencia}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {getStatusIcon(pago.estado)}
                          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(pago.estado)}`}>{pago.estado}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{new Date(pago.fecha_pago).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button onClick={() => handleOpenPaymentModal(pago)} className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeletePayment(pago.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "configuracion" && (
            <div className="p-6">
              <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700 mb-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Configuración del Panel
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ajusta las preferencias y la seguridad de tu panel.</p>
              </div>
              
              <div className="space-y-8 max-w-4xl mx-auto">
                {/* Sección Perfil */}
                <div className="p-6 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4">
                    <Users className="w-5 h-5 mr-2" />
                    Perfil de Administrador
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                      <input type="text" defaultValue="Admin" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                      <input type="email" defaultValue="admin@example.com" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white" />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors">Guardar Cambios</button>
                  </div>
                </div>
                
                {/* Sección Seguridad */}
                <div className="p-6 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4">
                    <Shield className="w-5 h-5 mr-2" />
                    Seguridad
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Cambiar Contraseña</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Se recomienda cambiar la contraseña periódicamente.</p>
                      </div>
                      <button onClick={handleOpenChangePasswordModal} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">Cambiar</button>
                    </div>
                    <div className="flex items-center justify-between">
                       <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Autenticación de Dos Factores (2FA)</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Añade una capa extra de seguridad a tu cuenta.</p>
                      </div>
                       <button className="w-12 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center transition-colors p-1">
                        <span className="w-4 h-4 rounded-full bg-white transform transition-transform"></span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sección Pasarelas de Pago */}
                <div className="p-6 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Pasarelas de Pago
                  </h3>
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-800 dark:text-gray-200">Credenciales de PayPal</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
                      Estas credenciales se usarán para procesar pagos reales. Trátelas con cuidado.
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Client ID</label>
                      <input 
                        type="text" 
                        value={paypalusuarioId}
                        onChange={(e) => setPaypalusuarioId(e.target.value)}
                        placeholder="Su Client ID de PayPal"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Secret Key</label>
                      <input 
                        type="password"
                        value={paypalSecretKey}
                        onChange={(e) => setPaypalSecretKey(e.target.value)}
                        placeholder="Ingrese una nueva Secret Key para actualizar"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white" 
                      />
                       <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        La clave secreta no se muestra por seguridad. Deje el campo en blanco para no cambiarla.
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end items-center gap-4">
                    {configMessage && <p className="text-sm text-green-600 dark:text-green-400">{configMessage}</p>}
                    <button onClick={handleSaveConfig} className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors">Guardar Configuración de PayPal</button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Cotizaciones Tab */}
          {activeTab === "cotizaciones" && (
            <div>
              <QuotesPage showNavigation={false} />
            </div>
          )}

          {/* pedidos Tab */}
          {activeTab === "pedidos" && (
            <div>
              <PedidosPage showNavigation={false} />
            </div>
          )}

          {/* Historial Tab */}
          {activeTab === "historial" && (
            <div>
              <HistoryPage showNavigation={false} />
            </div>
          )}

          {/* Ver Usuarios Tab */}
          {activeTab === "ver-usuarios" && (
            <div>
              <ClientsViewPage showNavigation={false} />
            </div>
          )}

          {/* Nuevo Usuario Tab */}
          {activeTab === "nuevo-usuario" && (
            <div>
              <ClientsNewPage showNavigation={false} />
            </div>
          )}

          {/* Estadísticas Usuarios Tab */}
          {activeTab === "estadisticas-usuarios" && (
            <div>
              <ClientsStatsPage showNavigation={false} />
            </div>
          )}

          {/* Finance Payments Tab */}
          {activeTab === "pagos-finanzas" && (
            <div>
              <FinancePaymentsPage showNavigation={false} />
            </div>
          )}

          {/* Finance Reports Tab */}
          {activeTab === "reportes-finanzas" && (
            <div>
              <FinanceReportsPage showNavigation={false} />
            </div>
          )}

          {/* Finance Invoices Tab */}
          {activeTab === "facturas-finanzas" && (
            <div>
              <FinanceInvoicesPage showNavigation={false} />
            </div>
          )}

          {/* Communication Notifications Tab */}
          {activeTab === "notificaciones-comm" && (
            <div>
              <CommunicationNotificationsPage showNavigation={false} />
            </div>
          )}

          {/* Communication Messages Tab */}
          {activeTab === "mensajes-comm" && (
            <div>
              <CommunicationMessagesPage showNavigation={false} />
            </div>
          )}

          {/* Communication Email Marketing Tab */}
          {activeTab === "emails-comm" && (
            <div>
              <CommunicationEmailMarketingPage showNavigation={false} />
            </div>
          )}

          {/* Configuration General Tab */}
          {activeTab === "configuracion-general" && (
            <div>
              <ConfigurationGeneralPage showNavigation={false} />
            </div>
          )}

          {/* Integrations Tab */}
          {activeTab === "integraciones" && (
            <div>
              <IntegrationsPage showNavigation={false} />
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "seguridad" && (
            <div>
              <SecurityPage showNavigation={false} />
            </div>
          )}

          {/* Projects Admin Tab */}
          {activeTab === "proyectos-admin" && (
            <div>
              <ProjectsAdminPage showNavigation={false} />
            </div>
          )}
        </div>

        {/* Modals */}
        <UserModal isOpen={isUserModalOpen} onClose={handleCloseUserModal} onSave={handleSaveUser} user={selectedUser} />
        <PedidoModal isOpen={isPedidoModalOpen} onClose={handleClosePedidoModal} onSave={handleSavePedido} pedido={selectedPedido} clients={usuarios} />
        <PaymentModal isOpen={isPaymentModalOpen} onClose={handleClosePaymentModal} onSave={handleSavePayment} payment={selectedPayment} usuarios={usuarios} />
        <ChangePasswordModal isOpen={isChangePasswordModalOpen} onClose={handleCloseChangePasswordModal} />
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;