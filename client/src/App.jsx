
// src/App.jsx

import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ToastProvider } from './hooks/useToast';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import { ClientDataProvider } from './contexts/ClientDataContext';

import Header from './components/Header';
import ToastContainer from './components/ToastContainer';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Lazy load public pages
const Home = lazy(() => import('./pages/Home'));
const Services = lazy(() => import('./pages/Services'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));

// Lazy load auth pages
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Profile = lazy(() => import('./pages/Profile'));

// Lazy load usuario pages
const ClientLayout = lazy(() => import('./components/layout/ClientLayout'));
const ClientDashboard = lazy(() => import('./pages/client/ClientDashboard'));
const ClientProjects = lazy(() => import('./pages/client/ClientProjects'));
const ClientPayments = lazy(() => import('./pages/client/ClientPayments'));
const ClientQuotations = lazy(() => import('./pages/client/ClientQuotations'));
const ClientInvoices = lazy(() => import('./pages/client/ClientInvoices'));
const ClientMessages = lazy(() => import('./pages/client/ClientMessages'));
const ClientProfile = lazy(() => import('./pages/client/ClientProfile'));
const ClientRequestForm = lazy(() => import('./pages/client/ClientRequestForm'));

// Legacy client pages (to be removed)
const QuotesPage = lazy(() => import('./pages/QuotesPage'));
const PedidosPage = lazy(() => import('./pages/PedidosPage')); // Archivo renombrado de OrdersPage.jsx a PedidosPage.jsx
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const PaymentsPage = lazy(() => import('./pages/PaymentsPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));

// Lazy load admin pages
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ProjectsAdminPage = lazy(() => import('./pages/ProjectsAdminPage'));
const ClientsAdminPage = lazy(() => import('./pages/ClientsAdminPage'));
const ClientsNewPage = lazy(() => import('./pages/ClientsNewPage'));
const ClientsStatsPage = lazy(() => import('./pages/ClientsStatsPage'));
const QuotationsAdminPage = lazy(() => import('./pages/QuotationsAdminPage'));
const InvoicesAdminPage = lazy(() => import('./pages/InvoicesAdminPage'));
const FinancePaymentsPage = lazy(() => import('./pages/FinancePaymentsPage'));
const FinanceReportsPage = lazy(() => import('./pages/FinanceReportsPage'));
const FinanceInvoicesPage = lazy(() => import('./pages/FinanceInvoicesPage'));
const CommunicationNotificationsPage = lazy(() => import('./pages/CommunicationNotificationsPage'));
const CommunicationMessagesPage = lazy(() => import('./pages/CommunicationMessagesPage'));
const CommunicationEmailMarketingPage = lazy(() => import('./pages/CommunicationEmailMarketingPage'));

// Lazy load components
const RequestForm = lazy(() => import('./components/RequestForm'));

// Lazy load payment pages
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const PaymentCancel = lazy(() => import('./pages/PaymentCancel'));

// Loading fallback component
const PageLoader = () => (
  <LoadingSpinner 
    size="lg" 
    message="Cargando página..." 
    className="min-h-[400px]"
  />
);

function App() {
  const location = useLocation();
  const isDashboard = location.pathname.includes('/admin') || location.pathname.includes('/client');

  return (
    <AuthProvider>
      <LanguageProvider>
        <ToastProvider>
          <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-grow pt-20">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/servicios" element={<Services />} />
                <Route path="/portafolio" element={<Portfolio />} />
                <Route path="/nosotros" element={<About />} />
                <Route path="/contacto" element={<Contact />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
          
          {/* Payment return routes */}
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/cancel" element={<PaymentCancel />} />
          
          <Route
            path="/solicitud"
            element={
              <ProtectedRoute>
                <RequestForm />
              </ProtectedRoute>
            }
          />
          {/* New Client Portal Routes */}
          <Route
            path="/client"
            element={
              <ProtectedRoute clientOnly={true}>
                <ClientDataProvider>
                  <ClientLayout />
                </ClientDataProvider>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/client/dashboard" replace />} />
            <Route path="dashboard" element={<ClientDashboard />} />
            <Route path="projects" element={<ClientProjects />} />
            <Route path="payments" element={<ClientPayments />} />
            <Route path="quotations" element={<ClientQuotations />} />
            <Route path="invoices" element={<ClientInvoices />} />
            <Route path="messages" element={<ClientMessages />} />
            <Route path="profile" element={<ClientProfile />} />
            <Route path="nueva-solicitud" element={<ClientRequestForm />} />
          </Route>

          {/* Legacy client route - redirect to new portal */}
          <Route
            path="/panel-cliente"
            element={<Navigate to="/client/dashboard" replace />}
          />
          <Route
            path="/admin"
            element={<Navigate to="/admin/dashboard" replace />}
          />
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cotizaciones"
            element={
              <ProtectedRoute adminOnly={true}>
                <QuotesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pedidos"
            element={
              <ProtectedRoute adminOnly={true}>
                <PedidosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/historial"
            element={
              <ProtectedRoute adminOnly={true}>
                <HistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ver-clientes"
            element={
              <ProtectedRoute adminOnly={true}>
                <ClientsAdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/nuevo-cliente"
            element={
              <ProtectedRoute adminOnly={true}>
                <ClientsNewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/estadisticas-clientes"
            element={
              <ProtectedRoute adminOnly={true}>
                <ClientsStatsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pagos-finanzas"
            element={
              <ProtectedRoute adminOnly={true}>
                <FinancePaymentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reportes-finanzas"
            element={
              <ProtectedRoute adminOnly={true}>
                <FinanceReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/facturas-finanzas"
            element={
              <ProtectedRoute adminOnly={true}>
                <FinanceInvoicesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notificaciones-comm"
            element={
              <ProtectedRoute adminOnly={true}>
                <CommunicationNotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mensajes-comm"
            element={
              <ProtectedRoute adminOnly={true}>
                <CommunicationMessagesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/emails-comm"
            element={
              <ProtectedRoute adminOnly={true}>
                <CommunicationEmailMarketingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/proyectos-admin"
            element={
              <ProtectedRoute adminOnly={true}>
                <ProjectsAdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pagos"
            element={
              <ProtectedRoute>
                <PaymentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notificaciones"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/clientes"
            element={
              <ProtectedRoute adminOnly={true}>
                <ClientsAdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/cotizaciones"
            element={
              <ProtectedRoute adminOnly={true}>
                <QuotationsAdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/facturas"
            element={
              <ProtectedRoute adminOnly={true}>
                <InvoicesAdminPage />
              </ProtectedRoute>
            }
          />
        </Routes>
            </Suspense>
          </main>
          {!isDashboard && <Footer />}
          <ToastContainer />
          </div>
        </ToastProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
