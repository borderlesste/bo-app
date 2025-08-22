import { useState } from 'react';
import { DashboardLayout } from '../components';
import ClientStatsPanel from '../components/dashboard/ClientStatsPanel';
import NotificationsPage from './NotificationsPage';
import QuotesList from '../components/QuotesList';
import ordersList from '../components/ordersList';
import ProfileSection from '../components/ProfileSection';
import PaymentsList from '../components/PaymentsList';

// Importar otros componentes cuando estén disponibles
// import MessagesPage from './MessagesPage';
// import SupportPage from './SupportPage';

const ClientDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');

  // Función para formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  // Función para manejar la navegación interna
  // Función para manejar la navegación interna
  const handleSectionChange = (section) => {
    setActiveSection(section);
  };
  // Renderizar contenido basado en la sección activa
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div>
            <ClientStatsPanel formatCurrency={formatCurrency} />
          </div>
        );
      
      case 'profile':
        return (
          <div>
            <ProfileSection />
          </div>
        );

      case 'quotes':
        return (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Mis Cotizaciones</h2>
              <p className="text-gray-600 dark:text-gray-300">Gestiona y revisa tus cotizaciones</p>
            </div>
            <QuotesList />
          </div>
        );

      case 'orders':
        return (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Mis orders</h2>
              <p className="text-gray-600 dark:text-gray-300">Gestiona y revisa tus orders</p>
            </div>
            <ordersList />
          </div>
        );

      case 'new-request':
        return (
          <div>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Nueva Solicitud</h2>
              <p className="text-gray-600 dark:text-gray-300">Formulario de nueva solicitud en desarrollo...</p>
            </div>
          </div>
        );

      case 'payments':
        return (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Mis Pagos</h2>
              <p className="text-gray-600 dark:text-gray-300">Historial y gestión de pagos</p>
            </div>
            <PaymentsList />
          </div>
        );

      case 'invoices':
        return (
          <div>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Facturas</h2>
              <p className="text-gray-600 dark:text-gray-300">Lista de facturas en desarrollo...</p>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                  <span className="mr-3">🔔</span>
                  Notificaciones
                </h2>
              </div>
              <div className="p-6">
                <NotificationsPage />
              </div>
            </div>
          </div>
        );

      case 'messages':
        return (
          <div>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="mr-3">💬</span>
                Mensajes
              </h2>
              <p className="text-gray-600 dark:text-gray-300">Sistema de mensajes en desarrollo...</p>
            </div>
          </div>
        );

      case 'support':
        return (
          <div>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="mr-3">🆘</span>
                Soporte
              </h2>
              <p className="text-gray-600 dark:text-gray-300">Centro de soporte en desarrollo...</p>
            </div>
          </div>
        );

      default:
        return (
          <div>
            <ClientStatsPanel formatCurrency={formatCurrency} />
          </div>
        );
    }
  };

  return (
    <DashboardLayout onSidebarOptionSelect={handleSectionChange}>
      {renderContent()}
    </DashboardLayout>
  );
};

export default ClientDashboard;