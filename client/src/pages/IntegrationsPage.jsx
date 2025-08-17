import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Card, Button, LoadingSpinner } from '../components';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import { 
  CreditCard,
  Webhook,
  Key,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2
} from 'lucide-react';

const IntegrationsPage = ({ showNavigation = true }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  // Integraciones reales desde API
  const [integrations, setIntegrations] = useState([]);

  // Estado para webhooks reales
  const [webhooks, setWebhooks] = useState([]);
  const [showWebhookForm, setShowWebhookForm] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    nombre: '',
    url: '',
    eventos: [],
    activo: true
  });
  const [newIntegration, setNewIntegration] = useState({
    tipo: 'payment',
    proveedor: '',
    nombre: '',
    descripcion: '',
    enabled: true,
    configuracion: {}
  });

  const [showCreateForm, setShowCreateForm] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadIntegrations();
      loadWebhooks();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadIntegrations = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/integrations');
      const integrationsData = response.data || [];
      
      setIntegrations(integrationsData);
      console.log('Integraciones cargadas:', integrationsData);
    } catch (error) {
      console.error('Error loading integrations:', error);
      showMessage('Error al cargar las integraciones', 'error');
    } finally {
      setLoading(false);
    }
  };

  const syncIntegrations = async () => {
    try {
      const response = await api.post('/api/integrations/sync');
      showMessage(response.data.message, 'success');
      await loadIntegrations(); // Recargar después de sincronizar
    } catch (error) {
      console.error('Error syncing integrations:', error);
      showMessage('Error al sincronizar integraciones', 'error');
    }
  };

  const updateIntegrationData = async (integrationId, data) => {
    setSaving(true);
    try {
      const response = await api.put(`/api/integrations/${integrationId}`, data);
      showMessage(response.data.message, 'success');
      await loadIntegrations(); // Recargar para mostrar cambios
    } catch (error) {
      console.error('Error updating integration:', error);
      showMessage('Error al actualizar la integración', 'error');
    } finally {
      setSaving(false);
    }
  };

  const createIntegration = async () => {
    setSaving(true);
    try {
      const response = await api.post('/api/integrations', newIntegration);
      showMessage(response.data.message, 'success');
      setShowCreateForm(false);
      setNewIntegration({
        tipo: 'payment',
        proveedor: '',
        nombre: '',
        descripcion: '',
        enabled: true,
        configuracion: {}
      });
      await loadIntegrations();
    } catch (error) {
      console.error('Error creating integration:', error);
      showMessage('Error al crear la integración', 'error');
    } finally {
      setSaving(false);
    }
  };

  const testIntegrationConnection = async (integrationId, integrationName) => {
    try {
      const response = await api.post(`/api/integrations/${integrationId}/test`);
      showMessage(response.data.message, response.data.result.success ? 'success' : 'error');
      await loadIntegrations(); // Recargar para actualizar status
    } catch (error) {
      console.error(`Error testing ${integrationName}:`, error);
      showMessage(`Error al probar conexión con ${integrationName}`, 'error');
    }
  };

  const loadWebhooks = async () => {
    try {
      const response = await api.get('/api/integrations/webhooks');
      setWebhooks(response.data || []);
    } catch (error) {
      console.error('Error loading webhooks:', error);
      // No mostrar error para webhooks ya que puede ser que no estén implementados aún
    }
  };

  const createWebhook = async () => {
    setSaving(true);
    try {
      const response = await api.post('/api/integrations/webhooks', newWebhook);
      showMessage(response.data.message, 'success');
      setShowWebhookForm(false);
      setNewWebhook({
        nombre: '',
        url: '',
        eventos: [],
        activo: true
      });
      await loadWebhooks();
    } catch (error) {
      console.error('Error creating webhook:', error);
      showMessage('Error al crear webhook', 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteWebhook = async (webhookId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este webhook?')) {
      try {
        await api.delete(`/api/integrations/webhooks/${webhookId}`);
        showMessage('Webhook eliminado exitosamente', 'success');
        await loadWebhooks();
      } catch (error) {
        console.error('Error deleting webhook:', error);
        showMessage('Error al eliminar webhook', 'error');
      }
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'disconnected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'connected':
        return 'Conectado';
      case 'disconnected':
        return 'Desconectado';
      case 'error':
        return 'Error';
      default:
        return 'Desconocido';
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
                🔌 Integraciones
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
                Conecta tu sistema con servicios externos para automatizar procesos y mejorar la funcionalidad
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={syncIntegrations}
                className="flex items-center gap-2"
                disabled={loading || saving}
              >
                <RefreshCw className={`w-4 h-4 ${loading || saving ? 'animate-spin' : ''}`} />
                Sincronizar
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={loadIntegrations}
                className="flex items-center gap-2"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Recargar
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
          {/* Integrations List */}
          <Card variant="gradient" className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-green-600" />
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                  Integraciones Configuradas
                </h2>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nueva Integración
              </Button>
            </div>

            <div className="space-y-4">
              {integrations.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Key className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No hay integraciones configuradas</p>
                  <p className="text-sm">Haz clic en Sincronizar para detectar integraciones automáticamente</p>
                </div>
              ) : (
                integrations.map((integration) => (
                  <div key={integration.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          integration.tipo === 'payment' ? 'bg-green-100 dark:bg-green-900/20' :
                          integration.tipo === 'email' ? 'bg-blue-100 dark:bg-blue-900/20' :
                          integration.tipo === 'crm' ? 'bg-purple-100 dark:bg-purple-900/20' :
                          'bg-gray-100 dark:bg-gray-900/20'
                        }`}>
                          {integration.tipo === 'payment' ? '💰' :
                           integration.tipo === 'email' ? '📧' :
                           integration.tipo === 'crm' ? '👥' : '🔌'}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                            {integration.nombre}
                          </h3>
                          <div className="flex items-center gap-2 text-sm">
                            {getStatusIcon(integration.status)}
                            <span className="text-gray-600 dark:text-gray-300">
                              {getStatusText(integration.status)}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs">
                              {integration.tipo}
                            </span>
                          </div>
                          {integration.descripcion && (
                            <p className="text-xs text-gray-500 mt-1">{integration.descripcion}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => testIntegrationConnection(integration.id, integration.nombre)}
                          disabled={saving}
                        >
                          Probar
                        </Button>
                        <Button
                          variant={integration.enabled ? "primary" : "outline"}
                          size="sm"
                          onClick={() => updateIntegrationData(integration.id, { 
                            enabled: !integration.enabled 
                          })}
                          disabled={saving}
                        >
                          {integration.enabled ? 'Activo' : 'Inactivo'}
                        </Button>
                      </div>
                    </div>

                    {integration.enabled && integration.configuracion && (
                      <div className="mt-4 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Configuración
                        </h4>
                        <div className="text-xs font-mono text-gray-600 dark:text-gray-400">
                          {typeof integration.configuracion === 'string' 
                            ? integration.configuracion 
                            : JSON.stringify(JSON.parse(integration.configuracion), null, 2)
                          }
                        </div>
                      </div>
                    )}

                    {integration.ultima_sincronizacion && (
                      <div className="mt-2 text-xs text-gray-500">
                        Última sincronización: {new Date(integration.ultima_sincronizacion).toLocaleString()}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Create New Integration Form */}
          {showCreateForm && (
            <Card variant="gradient" className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Plus className="w-6 h-6 text-green-600" />
                  <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                    Nueva Integración
                  </h2>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowCreateForm(false)}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo
                  </label>
                  <select
                    value={newIntegration.tipo}
                    onChange={(e) => setNewIntegration(prev => ({ ...prev, tipo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  >
                    <option value="payment">Payment</option>
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="crm">CRM</option>
                    <option value="analytics">Analytics</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Proveedor
                  </label>
                  <input
                    type="text"
                    value={newIntegration.proveedor}
                    onChange={(e) => setNewIntegration(prev => ({ ...prev, proveedor: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    placeholder="Ej: Stripe, Mailchimp, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={newIntegration.nombre}
                    onChange={(e) => setNewIntegration(prev => ({ ...prev, nombre: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    placeholder="Nombre descriptivo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descripción
                  </label>
                  <input
                    type="text"
                    value={newIntegration.descripcion}
                    onChange={(e) => setNewIntegration(prev => ({ ...prev, descripcion: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    placeholder="Descripción de la integración"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="primary"
                  onClick={createIntegration}
                  disabled={saving || !newIntegration.proveedor || !newIntegration.nombre}
                >
                  {saving ? 'Creando...' : 'Crear Integración'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancelar
                </Button>
              </div>
            </Card>
          )}

          {/* Webhooks */}
          <Card variant="gradient" className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Webhook className="w-6 h-6 text-orange-600" />
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                  Webhooks
                </h2>
              </div>
              <Button 
                variant="primary" 
                size="sm" 
                className="flex items-center gap-2"
                onClick={() => setShowWebhookForm(true)}
              >
                <Plus className="w-4 h-4" />
                Nuevo Webhook
              </Button>
            </div>

            <div className="space-y-4">
              {webhooks.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Webhook className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No hay webhooks configurados</p>
                  <p className="text-sm">Los webhooks permiten recibir notificaciones automáticas de eventos</p>
                </div>
              ) : (
                webhooks.map((webhook) => (
                  <div key={webhook.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-800 dark:text-gray-100">{webhook.nombre || webhook.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            webhook.activo || webhook.active 
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                              : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                          }`}>
                            {webhook.activo || webhook.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">{webhook.url}</p>
                        <p className="text-xs text-gray-500">
                          Eventos: {webhook.eventos ? webhook.eventos.join(', ') : (webhook.events ? webhook.events.join(', ') : 'No especificados')}
                        </p>
                        {(webhook.ultimo_disparado || webhook.lastTriggered) && (
                          <p className="text-xs text-gray-500">
                            Último disparado: {new Date(webhook.ultimo_disparado || webhook.lastTriggered).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="danger" 
                          size="sm"
                          onClick={() => deleteWebhook(webhook.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Create New Webhook Form */}
          {showWebhookForm && (
            <Card variant="gradient" className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Plus className="w-6 h-6 text-orange-600" />
                  <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                    Nuevo Webhook
                  </h2>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowWebhookForm(false)}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={newWebhook.nombre}
                    onChange={(e) => setNewWebhook(prev => ({ ...prev, nombre: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    placeholder="Nombre descriptivo del webhook"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    URL
                  </label>
                  <input
                    type="url"
                    value={newWebhook.url}
                    onChange={(e) => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    placeholder="https://ejemplo.com/webhook"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Eventos (separados por comas)
                  </label>
                  <input
                    type="text"
                    value={newWebhook.eventos.join(', ')}
                    onChange={(e) => setNewWebhook(prev => ({ 
                      ...prev, 
                      eventos: e.target.value.split(',').map(event => event.trim()).filter(event => event) 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    placeholder="order.created, payment.completed, user.registered"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="primary"
                  onClick={createWebhook}
                  disabled={saving || !newWebhook.nombre || !newWebhook.url}
                >
                  {saving ? 'Creando...' : 'Crear Webhook'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowWebhookForm(false)}
                >
                  Cancelar
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

IntegrationsPage.propTypes = {
  showNavigation: PropTypes.bool
};

export default IntegrationsPage;