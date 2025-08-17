import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Card, Button, LoadingSpinner } from '../components';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import { 
  Globe, 
  MapPin, 
  Phone, 
  Mail, 
  Building,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Palette,
  Monitor,
  Sun,
  Moon,
  Shield,
  Key,
  Users,
  Lock
} from 'lucide-react';

const ConfigurationGeneralPage = ({ showNavigation = true }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  // Configuración General (datos reales desde BD)
  // generalConfig state removed - data is loaded directly into individual state variables
  
  // Configuración de Seguridad (datos reales desde BD)
  const [securityConfig, setSecurityConfig] = useState({
    password_min_length: 8,
    password_require_uppercase: true,
    password_require_lowercase: true,
    password_require_numbers: true,
    password_require_symbols: true,
    password_expiration_days: 90,
    password_history_count: 5,
    login_max_attempts: 5,
    login_lockout_minutes: 30,
    session_timeout_minutes: 60,
    session_max_concurrent: 3,
    two_factor_enabled: false,
    ip_whitelist: '',
    ip_blacklist: ''
  });

  // Company Information (de configuración general)
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    description: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    logo: '',
    timezone: 'America/Mexico_City',
    language: 'es',
    currency: 'MXN'
  });

  // Theme Settings (de configuración general)
  const [themeSettings, setThemeSettings] = useState({
    primaryColor: '#7c3aed',
    secondaryColor: '#06b6d4',
    theme: 'light',
    compactMode: false,
    animations: true
  });

  // Business Settings (de configuración general)
  const [businessSettings, setBusinessSettings] = useState({
    businessHours: {
      monday: { start: '09:00', end: '18:00', active: true },
      tuesday: { start: '09:00', end: '18:00', active: true },
      wednesday: { start: '09:00', end: '18:00', active: true },
      thursday: { start: '09:00', end: '18:00', active: true },
      friday: { start: '09:00', end: '18:00', active: true },
      saturday: { start: '10:00', end: '14:00', active: false },
      sunday: { start: '10:00', end: '14:00', active: false }
    },
    autoResponseEnabled: true,
    autoResponseMessage: 'Gracias por contactarnos. Responderemos pronto.',
    notificationsEnabled: true,
    emailNotifications: true,
    smsNotifications: false
  });

  useEffect(() => {
    if (user) {
      loadConfiguration();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadConfiguration = async () => {
    setLoading(true);
    try {
      // Cargar configuración general
      const generalResponse = await api.get('/api/configuration/general');
      const generalData = generalResponse.data || {};
      
      // Actualizar información de la empresa desde configuración general
      setCompanyInfo(prev => ({
        ...prev,
        name: generalData.COMPANY_NAME || 'BODERLESS TECHNO COMPANY',
        description: generalData.COMPANY_DESCRIPTION || 'Soluciones tecnológicas sin fronteras',
        email: generalData.COMPANY_EMAIL || 'contacto@boderless.com',
        phone: generalData.COMPANY_PHONE || '+52 555 123 4567',
        address: generalData.COMPANY_ADDRESS || 'Ciudad de México, México',
        website: generalData.COMPANY_WEBSITE || 'https://boderless.com',
        timezone: generalData.COMPANY_TIMEZONE || prev.timezone,
        language: generalData.COMPANY_LANGUAGE || prev.language,
        currency: generalData.COMPANY_CURRENCY || prev.currency
      }));
      
      // Actualizar configuración de tema
      setThemeSettings(prev => ({
        ...prev,
        primaryColor: generalData.THEME_PRIMARY_COLOR || prev.primaryColor,
        secondaryColor: generalData.THEME_SECONDARY_COLOR || prev.secondaryColor,
        theme: generalData.THEME_MODE || prev.theme,
        compactMode: generalData.THEME_COMPACT_MODE === 'true' || prev.compactMode,
        animations: generalData.THEME_ANIMATIONS !== 'false' && prev.animations
      }));
      
      // Cargar configuración de seguridad
      const securityResponse = await api.get('/api/configuration/security');
      const securityData = securityResponse.data || {};
      setSecurityConfig({
        password_min_length: securityData.password_min_length || 8,
        password_require_uppercase: !!securityData.password_require_uppercase,
        password_require_lowercase: !!securityData.password_require_lowercase,
        password_require_numbers: !!securityData.password_require_numbers,
        password_require_symbols: !!securityData.password_require_symbols,
        password_expiration_days: securityData.password_expiration_days || 90,
        password_history_count: securityData.password_history_count || 5,
        login_max_attempts: securityData.login_max_attempts || 5,
        login_lockout_minutes: securityData.login_lockout_minutes || 30,
        session_timeout_minutes: securityData.session_timeout_minutes || 60,
        session_max_concurrent: securityData.session_max_concurrent || 3,
        two_factor_enabled: !!securityData.two_factor_enabled,
        ip_whitelist: securityData.ip_whitelist || '',
        ip_blacklist: securityData.ip_blacklist || ''
      });
      
      // Actualizar configuración de notificaciones y horarios
      setBusinessSettings(prev => ({
        ...prev,
        autoResponseEnabled: generalData.AUTO_RESPONSE_ENABLED !== 'false',
        autoResponseMessage: generalData.AUTO_RESPONSE_MESSAGE || prev.autoResponseMessage,
        notificationsEnabled: generalData.NOTIFICATIONS_ENABLED !== 'false',
        emailNotifications: generalData.EMAIL_NOTIFICATIONS_ENABLED !== 'false',
        smsNotifications: generalData.SMS_NOTIFICATIONS_ENABLED === 'true'
      }));
      
      console.log('Configuración cargada:', { generalData, securityData });
      showMessage('Configuración cargada exitosamente', 'success');
    } catch (error) {
      console.error('Error loading configuration:', error);
      showMessage('Error al cargar la configuración', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    setSaving(true);
    try {
      // Guardar configuración general
      const generalConfigData = {
        // Company configuration
        COMPANY_NAME: companyInfo.name,
        COMPANY_DESCRIPTION: companyInfo.description,
        COMPANY_EMAIL: companyInfo.email,
        COMPANY_PHONE: companyInfo.phone,
        COMPANY_ADDRESS: companyInfo.address,
        COMPANY_WEBSITE: companyInfo.website,
        COMPANY_TIMEZONE: companyInfo.timezone,
        COMPANY_LANGUAGE: companyInfo.language,
        COMPANY_CURRENCY: companyInfo.currency,
        
        // Theme configuration
        THEME_MODE: themeSettings.theme,
        THEME_PRIMARY_COLOR: themeSettings.primaryColor,
        THEME_SECONDARY_COLOR: themeSettings.secondaryColor,
        THEME_COMPACT_MODE: themeSettings.compactMode.toString(),
        THEME_ANIMATIONS: themeSettings.animations.toString(),
        
        // Business configuration
        AUTO_RESPONSE_ENABLED: businessSettings.autoResponseEnabled.toString(),
        AUTO_RESPONSE_MESSAGE: businessSettings.autoResponseMessage,
        NOTIFICATIONS_ENABLED: businessSettings.notificationsEnabled.toString(),
        EMAIL_NOTIFICATIONS_ENABLED: businessSettings.emailNotifications.toString(),
        SMS_NOTIFICATIONS_ENABLED: businessSettings.smsNotifications.toString()
      };

      // Guardar configuración general
      await api.put('/api/configuration/general', generalConfigData);
      
      // Guardar configuración de seguridad
      await api.put('/api/configuration/security', securityConfig);
      
      showMessage('Configuración guardada exitosamente', 'success');
      console.log('Configuración guardada:', { generalConfigData, securityConfig });
    } catch (error) {
      console.error('Error saving configuration:', error);
      showMessage('Error al guardar la configuración. Verifique los datos.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const showMessage = (message, type) => {
    setSaveMessage(message);
    setMessageType(type);
    setTimeout(() => {
      setSaveMessage('');
      setMessageType('');
    }, 3000);
  };

  const handleCompanyInfoChange = (field, value) => {
    setCompanyInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleThemeChange = (field, value) => {
    setThemeSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBusinessSettingsChange = (field, value) => {
    setBusinessSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBusinessHoursChange = (day, field, value) => {
    setBusinessSettings(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours[day],
          [field]: value
        }
      }
    }));
  };

  const handleSecurityConfigChange = (field, value) => {
    setSecurityConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getThemeIcon = (theme) => {
    switch (theme) {
      case 'light': return <Sun className="w-4 h-4" />;
      case 'dark': return <Moon className="w-4 h-4" />;
      case 'auto': return <Monitor className="w-4 h-4" />;
      default: return <Sun className="w-4 h-4" />;
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
                ⚙️ Configuración General
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
                Administra la configuración básica del sistema, información de la empresa y preferencias generales
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={loadConfiguration}
                className="flex items-center gap-2"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Recargar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={saveConfiguration}
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
              {messageType === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              {saveMessage}
            </div>
          )}
        </div>

        <div className="space-y-8">
          {/* Company Information */}
          <Card variant="gradient" className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Building className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                Información de la Empresa
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre de la Empresa
                </label>
                <input
                  type="text"
                  value={companyInfo.name}
                  onChange={(e) => handleCompanyInfoChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email de Contacto
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="email"
                    value={companyInfo.email}
                    onChange={(e) => handleCompanyInfoChange('email', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Teléfono
                </label>
                <div className="relative">
                  <Phone className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="tel"
                    value={companyInfo.phone}
                    onChange={(e) => handleCompanyInfoChange('phone', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sitio Web
                </label>
                <div className="relative">
                  <Globe className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="url"
                    value={companyInfo.website}
                    onChange={(e) => handleCompanyInfoChange('website', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dirección
                </label>
                <div className="relative">
                  <MapPin className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    value={companyInfo.address}
                    onChange={(e) => handleCompanyInfoChange('address', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción de la Empresa
                </label>
                <textarea
                  rows={3}
                  value={companyInfo.description}
                  onChange={(e) => handleCompanyInfoChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>
          </Card>

          {/* Theme Settings */}
          <Card variant="gradient" className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Palette className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                Configuración de Tema
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Tema de la Interfaz
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'light', label: 'Claro', icon: 'sun' },
                    { value: 'dark', label: 'Oscuro', icon: 'moon' },
                    { value: 'auto', label: 'Automático', icon: 'monitor' }
                  ].map((option) => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="radio"
                        name="theme"
                        value={option.value}
                        checked={themeSettings.theme === option.value}
                        onChange={(e) => handleThemeChange('theme', e.target.value)}
                        className="mr-3"
                      />
                      <div className="flex items-center gap-2">
                        {getThemeIcon(option.value)}
                        <span className="text-gray-700 dark:text-gray-300">{option.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color Primario
                </label>
                <input
                  type="color"
                  value={themeSettings.primaryColor}
                  onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                  className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color Secundario
                </label>
                <input
                  type="color"
                  value={themeSettings.secondaryColor}
                  onChange={(e) => handleThemeChange('secondaryColor', e.target.value)}
                  className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg"
                />
              </div>

              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={themeSettings.compactMode}
                    onChange={(e) => handleThemeChange('compactMode', e.target.checked)}
                    className="mr-3"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Modo Compacto</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={themeSettings.animations}
                    onChange={(e) => handleThemeChange('animations', e.target.checked)}
                    className="mr-3"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Habilitar Animaciones</span>
                </label>
              </div>
            </div>
          </Card>

          {/* Regional Settings */}
          <Card variant="gradient" className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                Configuración Regional
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Zona Horaria
                </label>
                <select
                  value={companyInfo.timezone}
                  onChange={(e) => handleCompanyInfoChange('timezone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                >
                  <option value="America/Mexico_City">México (GMT-6)</option>
                  <option value="America/New_York">Nueva York (GMT-5)</option>
                  <option value="Europe/Madrid">Madrid (GMT+1)</option>
                  <option value="UTC">UTC (GMT+0)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Idioma
                </label>
                <select
                  value={companyInfo.language}
                  onChange={(e) => handleCompanyInfoChange('language', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Moneda
                </label>
                <select
                  value={companyInfo.currency}
                  onChange={(e) => handleCompanyInfoChange('currency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                >
                  <option value="MXN">Peso Mexicano (MXN)</option>
                  <option value="USD">Dólar Americano (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Business Hours */}
          <Card variant="gradient" className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-6 h-6 text-orange-600" />
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                Horarios de Atención
              </h2>
            </div>

            <div className="space-y-4">
              {Object.entries(businessSettings.businessHours).map(([day, hours]) => (
                <div key={day} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <div className="w-24">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={hours.active}
                        onChange={(e) => handleBusinessHoursChange(day, 'active', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                        {day === 'monday' ? 'Lunes' :
                         day === 'tuesday' ? 'Martes' :
                         day === 'wednesday' ? 'Miércoles' :
                         day === 'thursday' ? 'Jueves' :
                         day === 'friday' ? 'Viernes' :
                         day === 'saturday' ? 'Sábado' : 'Domingo'}
                      </span>
                    </label>
                  </div>
                  
                  {hours.active && (
                    <>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">De:</label>
                        <input
                          type="time"
                          value={hours.start}
                          onChange={(e) => handleBusinessHoursChange(day, 'start', e.target.value)}
                          className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-slate-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">A:</label>
                        <input
                          type="time"
                          value={hours.end}
                          onChange={(e) => handleBusinessHoursChange(day, 'end', e.target.value)}
                          className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-slate-600 dark:text-white"
                        />
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Notifications Settings */}
          <Card variant="gradient" className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                Configuración de Notificaciones
              </h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={businessSettings.notificationsEnabled}
                    onChange={(e) => handleBusinessSettingsChange('notificationsEnabled', e.target.checked)}
                    className="mr-3"
                  />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Habilitar Notificaciones del Sistema</span>
                </label>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={businessSettings.emailNotifications}
                    onChange={(e) => handleBusinessSettingsChange('emailNotifications', e.target.checked)}
                    className="mr-3"
                  />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Notificaciones por Email</span>
                </label>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={businessSettings.smsNotifications}
                    onChange={(e) => handleBusinessSettingsChange('smsNotifications', e.target.checked)}
                    className="mr-3"
                  />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Notificaciones por SMS</span>
                </label>
              </div>

              <div>
                <label className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    checked={businessSettings.autoResponseEnabled}
                    onChange={(e) => handleBusinessSettingsChange('autoResponseEnabled', e.target.checked)}
                    className="mr-3"
                  />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Respuesta Automática</span>
                </label>
                
                {businessSettings.autoResponseEnabled && (
                  <textarea
                    rows={3}
                    value={businessSettings.autoResponseMessage}
                    onChange={(e) => handleBusinessSettingsChange('autoResponseMessage', e.target.value)}
                    placeholder="Mensaje de respuesta automática..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                )}
              </div>
            </div>
          </Card>

          {/* Security Configuration */}
          <Card variant="gradient" className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-indigo-600" />
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                Configuración de Seguridad
              </h2>
            </div>

            <div className="space-y-6">
              {/* Password Policies */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">
                    Políticas de Contraseña
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Longitud Mínima
                    </label>
                    <input
                      type="number"
                      min="4"
                      max="50"
                      value={securityConfig.password_min_length}
                      onChange={(e) => handleSecurityConfigChange('password_min_length', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Días para Expiración
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="365"
                      value={securityConfig.password_expiration_days}
                      onChange={(e) => handleSecurityConfigChange('password_expiration_days', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Requisitos de Contraseña
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={securityConfig.password_require_uppercase}
                          onChange={(e) => handleSecurityConfigChange('password_require_uppercase', e.target.checked)}
                          className="mr-3"
                        />
                        <span className="text-gray-700 dark:text-gray-300">Requiere mayúsculas</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={securityConfig.password_require_lowercase}
                          onChange={(e) => handleSecurityConfigChange('password_require_lowercase', e.target.checked)}
                          className="mr-3"
                        />
                        <span className="text-gray-700 dark:text-gray-300">Requiere minúsculas</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={securityConfig.password_require_numbers}
                          onChange={(e) => handleSecurityConfigChange('password_require_numbers', e.target.checked)}
                          className="mr-3"
                        />
                        <span className="text-gray-700 dark:text-gray-300">Requiere números</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={securityConfig.password_require_symbols}
                          onChange={(e) => handleSecurityConfigChange('password_require_symbols', e.target.checked)}
                          className="mr-3"
                        />
                        <span className="text-gray-700 dark:text-gray-300">Requiere símbolos</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Session Configuration */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">
                    Configuración de Sesiones
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Timeout de Sesión (minutos)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="480"
                      value={securityConfig.session_timeout_minutes}
                      onChange={(e) => handleSecurityConfigChange('session_timeout_minutes', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sesiones Concurrentes Máximas
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={securityConfig.session_max_concurrent}
                      onChange={(e) => handleSecurityConfigChange('session_max_concurrent', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Intentos Máximos de Inicio de Sesión
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={securityConfig.login_max_attempts}
                      onChange={(e) => handleSecurityConfigChange('login_max_attempts', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Security */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Key className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">
                    Seguridad Adicional
                  </h3>
                </div>
                
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={securityConfig.two_factor_enabled}
                      onChange={(e) => handleSecurityConfigChange('two_factor_enabled', e.target.checked)}
                      className="mr-3"
                    />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Habilitar Autenticación de Dos Factores (2FA)</span>
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        IPs Permitidas (whitelist)
                      </label>
                      <textarea
                        rows={3}
                        value={securityConfig.ip_whitelist}
                        onChange={(e) => handleSecurityConfigChange('ip_whitelist', e.target.value)}
                        placeholder="192.168.1.1, 10.0.0.1"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        IPs Bloqueadas (blacklist)
                      </label>
                      <textarea
                        rows={3}
                        value={securityConfig.ip_blacklist}
                        onChange={(e) => handleSecurityConfigChange('ip_blacklist', e.target.value)}
                        placeholder="192.168.1.100, 10.0.0.100"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

ConfigurationGeneralPage.propTypes = {
  showNavigation: PropTypes.bool
};

export default ConfigurationGeneralPage;