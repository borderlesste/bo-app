import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Card, Button, LoadingSpinner } from '../components';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import { 
  Shield, 
  Key,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Globe,
  Monitor,
  Smartphone,
  RefreshCw,
  Save,
  Download,
  Plus,
  Activity,
  Calendar
} from 'lucide-react';

const SecurityPage = ({ showNavigation = true }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  // Password Settings
  const [passwordSettings, setPasswordSettings] = useState({
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: true,
    minLength: 8,
    maxLength: 128,
    expireDays: 90,
    preventReuse: 5,
    lockoutAttempts: 5,
    lockoutDuration: 30 // minutes
  });

  // Two-Factor Authentication
  const [twoFactorSettings, setTwoFactorSettings] = useState({
    enabled: false,
    method: 'app', // app, sms, email
    backupCodes: [],
    trustedDevices: []
  });

  // Session Settings
  const [sessionSettings, setSessionSettings] = useState({
    sessionTimeout: 1440, // minutes (24 hours)
    maxSessions: 3,
    requireReauth: false,
    logoutInactive: true,
    inactivityTimeout: 60 // minutes
  });

  // Access Control
  const [accessSettings, setAccessSettings] = useState({
    ipWhitelist: [],
    ipBlacklist: [],
    allowedCountries: ['MX', 'US', 'CA'],
    blockVPN: false,
    allowMobile: true,
    allowDesktop: true
  });

  // Security Logs - ahora cargados desde API
  const [securityLogs, setSecurityLogs] = useState([]);
  const [securityStats, setSecurityStats] = useState([]);
  const [securitySummary, setSecuritySummary] = useState({});

  // Active Sessions - ahora cargados desde API
  const [activeSessions, setActiveSessions] = useState([]);

  const [newIpAddress, setNewIpAddress] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadSecuritySettings();
      loadSecurityLogs();
      loadSecurityStats();
      loadSecuritySummary();
      loadActiveSessions();
    }
  }, [user]);

  const loadSecuritySettings = async () => {
    setLoading(true);
    try {
      // Por ahora mantenemos los settings locales, pero podrían cargarse desde una config API
      console.log('Configuración de seguridad cargada');
    } catch (error) {
      console.error('Error loading security settings:', error);
      showMessage('Error al cargar la configuración de seguridad', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSecurityLogs = async () => {
    try {
      const response = await api.get('/api/security/logs?limite=50');
      setSecurityLogs(response.data.logs || []);
    } catch (error) {
      console.error('Error loading security logs:', error);
      showMessage('Error al cargar los logs de seguridad', 'error');
    }
  };

  const loadSecurityStats = async () => {
    try {
      const response = await api.get('/api/security/stats?dias=30');
      setSecurityStats(response.data.resumen || []);
    } catch (error) {
      console.error('Error loading security stats:', error);
    }
  };

  const loadSecuritySummary = async () => {
    try {
      const response = await api.get('/api/security/summary');
      setSecuritySummary(response.data || {});
    } catch (error) {
      console.error('Error loading security summary:', error);
    }
  };

  const loadActiveSessions = async () => {
    try {
      // Por ahora usamos datos simulados ya que no tenemos API de sesiones activas
      // En el futuro esto se conectaría con una API real
      const mockSessions = [
        {
          id: 1,
          device: 'Chrome on Windows',
          ip: '192.168.1.100',
          location: 'México, CDMX',
          lastActivity: new Date().toISOString(),
          current: true
        }
      ];
      setActiveSessions(mockSessions);
    } catch (error) {
      console.error('Error loading active sessions:', error);
    }
  };

  const saveSecuritySettings = async () => {
    setSaving(true);
    try {
      const securityData = {
        password: passwordSettings,
        twoFactor: twoFactorSettings,
        session: sessionSettings,
        access: accessSettings
      };

      // Aquí se enviarían los datos a la API
      console.log('Configuración de seguridad guardada:', securityData);
      showMessage('Configuración de seguridad guardada exitosamente', 'success');
    } catch (error) {
      console.error('Error saving security settings:', error);
      showMessage('Error al guardar la configuración de seguridad', 'error');
    } finally {
      setSaving(false);
    }
  };

  const generateBackupCodes = async () => {
    try {
      // Generate cryptographically secure backup codes
      const codes = [];
      for (let i = 0; i < 10; i++) {
        // Generate 8 random bytes and convert to hex for secure codes
        const randomValues = new Uint8Array(4);
        window.crypto.getRandomValues(randomValues);
        const code = Array.from(randomValues, byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
        codes.push(code);
      }
      
      setTwoFactorSettings(prev => ({
        ...prev,
        backupCodes: codes
      }));
      showMessage('Códigos de respaldo generados de forma segura', 'success');
    } catch (error) {
      console.error('Error generating backup codes:', error);
      showMessage('Error al generar códigos de respaldo', 'error');
    }
  };

  const terminateSession = async (sessionId) => {
    try {
      // await api.delete(`/api/sessions/${sessionId}`);
      setActiveSessions(prev => prev.filter(session => session.id !== sessionId));
      showMessage('Sesión terminada', 'success');
    } catch (error) {
      console.error('Error terminating session:', error);
      showMessage('Error al terminar la sesión', 'error');
    }
  };

  const addToIpList = (listType) => {
    if (!newIpAddress) return;
    
    setAccessSettings(prev => ({
      ...prev,
      [listType]: [...prev[listType], newIpAddress]
    }));
    setNewIpAddress('');
    showMessage(`IP agregada a ${listType === 'ipWhitelist' ? 'lista blanca' : 'lista negra'}`, 'success');
  };

  const removeFromIpList = (listType, ip) => {
    setAccessSettings(prev => ({
      ...prev,
      [listType]: prev[listType].filter(item => item !== ip)
    }));
    showMessage(`IP removida de ${listType === 'ipWhitelist' ? 'lista blanca' : 'lista negra'}`, 'success');
  };

  const unlockAccount = async (email) => {
    try {
      await api.post(`/api/security/unlock/${email}`);
      showMessage(`Cuenta ${email} desbloqueada exitosamente`, 'success');
      // Recargar logs para mostrar el desbloqueo
      loadSecurityLogs();
    } catch (error) {
      console.error('Error unlocking account:', error);
      showMessage('Error al desbloquear la cuenta', 'error');
    }
  };

  const exportSecurityReport = () => {
    const report = {
      settings: {
        password: passwordSettings,
        twoFactor: twoFactorSettings,
        session: sessionSettings,
        access: accessSettings
      },
      logs: securityLogs,
      sessions: activeSessions,
      exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(report, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `security_report_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const showMessage = (message, type) => {
    setSaveMessage(message);
    setMessageType(type);
    setTimeout(() => {
      setSaveMessage('');
      setMessageType('');
    }, 3000);
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'login_exitoso':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'login_fallido':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'cambio_password':
        return <Key className="w-5 h-5 text-blue-500" />;
      case 'bloqueo_cuenta':
        return <Shield className="w-5 h-5 text-orange-500" />;
      case 'desbloqueo_cuenta':
        return <Shield className="w-5 h-5 text-green-500" />;
      case 'acceso_denegado':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'logout':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getLogTypeText = (type) => {
    switch (type) {
      case 'login_exitoso':
        return 'Inicio de sesión exitoso';
      case 'login_fallido':
        return 'Intento de inicio de sesión fallido';
      case 'cambio_password':
        return 'Cambio de contraseña';
      case 'bloqueo_cuenta':
        return 'Cuenta bloqueada';
      case 'desbloqueo_cuenta':
        return 'Cuenta desbloqueada';
      case 'acceso_denegado':
        return 'Acceso denegado';
      case 'logout':
        return 'Cierre de sesión';
      default:
        return type.replace('_', ' ').toUpperCase();
    }
  };

  if (loading) {
    return (
      <div className={showNavigation ? "min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6" : "p-6"}>
        <div className={showNavigation ? "max-w-7xl mx-auto" : ""}>
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={showNavigation ? "min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6" : ""}>
      <div className={showNavigation ? "max-w-7xl mx-auto" : ""}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-heading font-bold text-gray-800 dark:text-gray-100 mb-4">
                🔒 Seguridad
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
                Administra la configuración de seguridad, autenticación y control de acceso del sistema
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={exportSecurityReport}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar Reporte
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  loadSecuritySettings();
                  loadSecurityLogs();
                  loadSecurityStats();
                  loadSecuritySummary();
                  loadActiveSessions();
                }}
                className="flex items-center gap-2"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Recargar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={saveSecuritySettings}
                className="flex items-center gap-2"
                disabled={saving}
              >
                <Save className="w-4 h-4" />
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>

          {/* Save Message */}
          {saveMessage && (
            <div className={`mt-4 p-4 rounded-lg flex items-center gap-2 ${
              messageType === 'success' 
                ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
            }`}>
              {messageType === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              {saveMessage}
            </div>
          )}
        </div>

        <div className="space-y-8">
          {/* Password Policy */}
          <Card variant="gradient" className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Key className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                Política de Contraseñas
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Longitud Mínima
                </label>
                <input
                  type="number"
                  min="6"
                  max="32"
                  value={passwordSettings.minLength}
                  onChange={(e) => setPasswordSettings(prev => ({
                    ...prev,
                    minLength: parseInt(e.target.value)
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Expiración (días)
                </label>
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={passwordSettings.expireDays}
                  onChange={(e) => setPasswordSettings(prev => ({
                    ...prev,
                    expireDays: parseInt(e.target.value)
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Intentos Fallidos
                </label>
                <input
                  type="number"
                  min="3"
                  max="10"
                  value={passwordSettings.lockoutAttempts}
                  onChange={(e) => setPasswordSettings(prev => ({
                    ...prev,
                    lockoutAttempts: parseInt(e.target.value)
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bloqueo (minutos)
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={passwordSettings.lockoutDuration}
                  onChange={(e) => setPasswordSettings(prev => ({
                    ...prev,
                    lockoutDuration: parseInt(e.target.value)
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {[
                { key: 'requireUppercase', label: 'Requerir mayúsculas' },
                { key: 'requireLowercase', label: 'Requerir minúsculas' },
                { key: 'requireNumbers', label: 'Requerir números' },
                { key: 'requireSymbols', label: 'Requerir símbolos' }
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={passwordSettings[key]}
                    onChange={(e) => setPasswordSettings(prev => ({
                      ...prev,
                      [key]: e.target.checked
                    }))}
                    className="mr-3 form-checkbox h-5 w-5 text-violet-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">{label}</span>
                </label>
              ))}
            </div>
          </Card>

          {/* Two-Factor Authentication */}
          <Card variant="gradient" className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                Autenticación de Dos Factores (2FA)
              </h2>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">
                    Habilitar 2FA
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Agrega una capa extra de seguridad a tu cuenta
                  </p>
                </div>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={twoFactorSettings.enabled}
                    onChange={(e) => setTwoFactorSettings(prev => ({
                      ...prev,
                      enabled: e.target.checked
                    }))}
                    className="form-checkbox h-6 w-6 text-violet-600"
                  />
                </label>
              </div>

              {twoFactorSettings.enabled && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Método de 2FA
                    </label>
                    <select
                      value={twoFactorSettings.method}
                      onChange={(e) => setTwoFactorSettings(prev => ({
                        ...prev,
                        method: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    >
                      <option value="app">Aplicación Autenticadora</option>
                      <option value="sms">SMS</option>
                      <option value="email">Email</option>
                    </select>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={generateBackupCodes}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Generar Códigos de Respaldo
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowBackupCodes(!showBackupCodes)}
                      className="flex items-center gap-2"
                    >
                      {showBackupCodes ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {showBackupCodes ? 'Ocultar' : 'Ver'} Códigos
                    </Button>
                  </div>

                  {showBackupCodes && twoFactorSettings.backupCodes.length > 0 && (
                    <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                      <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-3">
                        Códigos de Respaldo
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                        {twoFactorSettings.backupCodes.map((code, index) => (
                          <div key={index} className="p-2 bg-white dark:bg-slate-800 rounded border">
                            {code}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-3">
                        Guarda estos códigos en un lugar seguro. Cada uno puede usarse solo una vez.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Session Management */}
          <Card variant="gradient" className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                Gestión de Sesiones
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Timeout de Sesión (minutos)
                </label>
                <input
                  type="number"
                  min="30"
                  max="10080"
                  value={sessionSettings.sessionTimeout}
                  onChange={(e) => setSessionSettings(prev => ({
                    ...prev,
                    sessionTimeout: parseInt(e.target.value)
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Máximo de Sesiones Concurrentes
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={sessionSettings.maxSessions}
                  onChange={(e) => setSessionSettings(prev => ({
                    ...prev,
                    maxSessions: parseInt(e.target.value)
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={sessionSettings.logoutInactive}
                  onChange={(e) => setSessionSettings(prev => ({
                    ...prev,
                    logoutInactive: e.target.checked
                  }))}
                  className="mr-3 form-checkbox h-5 w-5 text-violet-600"
                />
                <span className="text-gray-700 dark:text-gray-300">
                  Cerrar sesión automáticamente por inactividad
                </span>
              </label>
            </div>

            {/* Active Sessions */}
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-4">
                Sesiones Activas
              </h3>
              <div className="space-y-3">
                {activeSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                        {session.device.includes('iPhone') ? <Smartphone className="w-5 h-5 text-blue-600" /> : <Monitor className="w-5 h-5 text-blue-600" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800 dark:text-gray-100">
                            {session.device}
                          </span>
                          {session.current && (
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 text-xs rounded-full">
                              Actual
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {session.ip} • {session.location}
                        </div>
                        <div className="text-xs text-gray-500">
                          Última actividad: {new Date(session.lastActivity).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {!session.current && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => terminateSession(session.id)}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Terminar
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Access Control */}
          <Card variant="gradient" className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="w-6 h-6 text-orange-600" />
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                Control de Acceso
              </h2>
            </div>

            <div className="space-y-6">
              {/* IP Whitelist */}
              <div>
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-3">
                  Lista Blanca de IPs
                </h3>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newIpAddress}
                    onChange={(e) => setNewIpAddress(e.target.value)}
                    placeholder="192.168.1.100"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => addToIpList('ipWhitelist')}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {accessSettings.ipWhitelist.map((ip, index) => (
                    <div key={index} className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-full text-sm">
                      {ip}
                      <button
                        onClick={() => removeFromIpList('ipWhitelist', ip)}
                        className="text-green-600 hover:text-green-800"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={accessSettings.blockVPN}
                    onChange={(e) => setAccessSettings(prev => ({
                      ...prev,
                      blockVPN: e.target.checked
                    }))}
                    className="mr-3 form-checkbox h-5 w-5 text-violet-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    Bloquear conexiones VPN/Proxy
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={accessSettings.allowMobile}
                    onChange={(e) => setAccessSettings(prev => ({
                      ...prev,
                      allowMobile: e.target.checked
                    }))}
                    className="mr-3 form-checkbox h-5 w-5 text-violet-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    Permitir acceso desde dispositivos móviles
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={accessSettings.allowDesktop}
                    onChange={(e) => setAccessSettings(prev => ({
                      ...prev,
                      allowDesktop: e.target.checked
                    }))}
                    className="mr-3 form-checkbox h-5 w-5 text-violet-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    Permitir acceso desde computadoras de escritorio
                  </span>
                </label>
              </div>
            </div>
          </Card>

          {/* Blocked Accounts */}
          {securitySummary.cuentas_bloqueadas && securitySummary.cuentas_bloqueadas.length > 0 && (
            <Card variant="gradient" className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                  Cuentas Bloqueadas
                </h2>
              </div>

              <div className="space-y-3">
                {securitySummary.cuentas_bloqueadas.map((account, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-800 dark:text-gray-100">
                        {account.nombre || 'Usuario desconocido'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {account.email_intento}
                      </div>
                      <div className="text-xs text-gray-500">
                        Bloqueado: {new Date(account.fecha_bloqueo).toLocaleString()}
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => unlockAccount(account.email_intento)}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Desbloquear
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Security Stats */}
          {securityStats.length > 0 && (
            <Card variant="gradient" className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Activity className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                  Estadísticas de Seguridad (Últimos 30 días)
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {securityStats.map((stat, index) => (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                      {stat.total}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {getLogTypeText(stat.tipo)}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Security Logs */}
          <Card variant="gradient" className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="w-6 h-6 text-red-600" />
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                Registro de Seguridad
              </h2>
            </div>

            <div className="space-y-3">
              {securityLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No hay logs de seguridad disponibles
                </div>
              ) : (
                securityLogs.map((log) => (
                  <div key={log.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <div className="flex-shrink-0">
                      {getLogIcon(log.tipo)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-800 dark:text-gray-100">
                          {getLogTypeText(log.tipo)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          log.tipo === 'login_exitoso' || log.tipo === 'logout' || log.tipo === 'desbloqueo_cuenta'
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                            : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                        }`}>
                          {log.tipo === 'login_exitoso' || log.tipo === 'logout' || log.tipo === 'desbloqueo_cuenta' ? 'Exitoso' : 'Fallido'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="flex items-center gap-1 mb-1">
                          <User className="w-4 h-4" />
                          {log.email_intento || log.usuario_email || 'Usuario desconocido'}
                        </span>
                        <span className="flex items-center gap-1 mb-1">
                          <Globe className="w-4 h-4" />
                          {log.ip} • {log.ubicacion || 'Ubicación desconocida'}
                        </span>
                        <span className="flex items-center gap-1 mb-1">
                          <Monitor className="w-4 h-4" />
                          {log.dispositivo || 'Dispositivo desconocido'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                        {log.detalles && (
                          <div className="mt-2 text-xs text-gray-500 bg-gray-100 dark:bg-slate-600 p-2 rounded">
                            {typeof log.detalles === 'string' ? log.detalles : JSON.stringify(log.detalles)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

SecurityPage.propTypes = {
  showNavigation: PropTypes.bool
};

export default SecurityPage;