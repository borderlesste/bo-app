import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Card, Button, Skeleton } from '../components';
import { getEmailCampaigns, createEmailCampaign, sendEmailCampaign } from '../api/axios';
import { 
  Search, 
  Filter, 
  Plus, 
  Mail, 
  Calendar, 
  Send, 
  Eye,
  Edit,
  Trash2,
  Download,
  RefreshCw,
  Users,
  Target,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Zap,
  Globe,
  Smartphone
} from 'lucide-react';

const CommunicationEmailMarketingPage = ({ showNavigation = true }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    nombre: '',
    asunto: '',
    contenido: '',
    audiencia: 'todos',
    fecha_programada: '',
    tipo: 'promocional'
  });

  // Cargar datos desde las APIs
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const campaignsRes = await getEmailCampaigns();

      if (campaignsRes.data.success) {
        setCampaigns(campaignsRes.data.data || []);
      } else {
        setCampaigns([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };


  const handleSendCampaign = async (campaignId) => {
    try {
      const campaign = campaigns.find(c => c.id === campaignId);
      if (!campaign) return;

      await sendEmailCampaign(campaignId);
      
      setCampaigns(campaigns.map(camp => 
        camp.id === campaignId ? { 
          ...camp, 
          estado: 'enviada',
          fecha_envio: new Date().toISOString()
        } : camp
      ));

      alert(`Campaña "${campaign.nombre}" enviada exitosamente`);
    } catch (error) {
      console.error('Error sending campaign:', error);
      alert('Error al enviar la campaña');
    }
  };

  const handleCreateCampaign = async () => {
    try {
      const response = await createEmailCampaign(newCampaign);
      
      if (response.data.success) {
        setCampaigns([...campaigns, response.data.data]);
        setNewCampaign({
          nombre: '',
          asunto: '',
          contenido: '',
          audiencia: 'todos',
          fecha_programada: '',
          tipo: 'promocional'
        });
        setShowCreateModal(false);
        alert('Campaña creada exitosamente');
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Error al crear la campaña');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'enviada': return <CheckCircle className="w-4 h-4" />;
      case 'programada': return <Clock className="w-4 h-4" />;
      case 'borrador': return <Edit className="w-4 h-4" />;
      case 'pausada': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'enviada': return 'bg-green-500 text-white';
      case 'programada': return 'bg-blue-500 text-white';
      case 'borrador': return 'bg-gray-500 text-white';
      case 'pausada': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'promocional': return <Target className="w-4 h-4" />;
      case 'bienvenida': return <Users className="w-4 h-4" />;
      case 'seguimiento': return <Mail className="w-4 h-4" />;
      case 'reactivacion': return <Zap className="w-4 h-4" />;
      default: return <Mail className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'promocional': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20';
      case 'bienvenida': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'seguimiento': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'reactivacion': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const statusMatch = filter === 'all' || campaign.estado === filter;
    const typeMatch = statusFilter === 'all' || campaign.tipo === statusFilter;
    const searchMatch = searchTerm === '' || 
      campaign.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.asunto?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return statusMatch && typeMatch && searchMatch;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'No especificada';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportCampaigns = () => {
    const dataStr = JSON.stringify(filteredCampaigns, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `campanas_email_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Calcular estadísticas
  const totalCampaigns = campaigns.length;
  const sentCampaigns = campaigns.filter(c => c.estado === 'enviada').length;
  const scheduledCampaigns = campaigns.filter(c => c.estado === 'programada').length;
  const draftCampaigns = campaigns.filter(c => c.estado === 'borrador').length;

  // Métricas agregadas
  const totalSent = campaigns.reduce((sum, c) => sum + (c.metricas?.enviados || 0), 0);
  const totalOpened = campaigns.reduce((sum, c) => sum + (c.metricas?.abiertos || 0), 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + (c.metricas?.clicks || 0), 0);
  const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
  const clickRate = totalSent > 0 ? Math.round((totalClicks / totalSent) * 100) : 0;

  if (loading) {
    return (
      <div className={showNavigation ? "min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6" : "p-6"}>
        <div className={showNavigation ? "max-w-7xl mx-auto" : ""}>
          <div className="mb-8">
            <Skeleton height="8" width="1/3" className="mb-4" />
            <Skeleton height="4" width="2/3" />
          </div>
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
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

  return (
    <div className={showNavigation ? "min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6" : ""}>
      <div className={showNavigation ? "max-w-7xl mx-auto" : ""}>        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-heading font-bold text-gray-800 dark:text-gray-100 mb-4">
                📧 Email Marketing
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
                Crea y gestiona campañas de email marketing para mantener conectados a tus clientes
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
                onClick={exportCampaigns}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nueva Campaña
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {totalCampaigns}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Campañas</div>
          </Card>

          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {sentCampaigns}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Enviadas</div>
          </Card>

          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="flex items-center justify-center mb-4">
              <Globe className="w-8 h-8 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {totalSent.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Emails Enviados</div>
          </Card>

          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="flex items-center justify-center mb-4">
              <Eye className="w-8 h-8 text-orange-600" />
            </div>
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {openRate}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Tasa de Apertura</div>
          </Card>

          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="flex items-center justify-center mb-4">
              <Smartphone className="w-8 h-8 text-red-600" />
            </div>
            <div className="text-3xl font-bold text-red-600 mb-2">
              {clickRate}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Tasa de Clicks</div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card variant="gradient" className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o asunto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant={filter === 'all' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                Todas ({totalCampaigns})
              </Button>
              <Button
                variant={filter === 'enviada' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('enviada')}
              >
                Enviadas ({sentCampaigns})
              </Button>
              <Button
                variant={filter === 'programada' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('programada')}
              >
                Programadas ({scheduledCampaigns})
              </Button>
              <Button
                variant={filter === 'borrador' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('borrador')}
              >
                Borradores ({draftCampaigns})
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Tipo:
            </span>
            <Button
              variant={statusFilter === 'all' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              Todos
            </Button>
            <Button
              variant={statusFilter === 'promocional' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('promocional')}
            >
              Promocional
            </Button>
            <Button
              variant={statusFilter === 'bienvenida' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('bienvenida')}
            >
              Bienvenida
            </Button>
            <Button
              variant={statusFilter === 'seguimiento' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('seguimiento')}
            >
              Seguimiento
            </Button>
          </div>
        </Card>

        {/* Campaigns List */}
        <div className="grid gap-6">
          {filteredCampaigns.map((campaign) => (
            <Card key={campaign.id} variant="gradient" hover className="group">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                      <Mail className="w-5 h-5 inline mr-2" />
                      {campaign.nombre}
                    </h3>
                    <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.estado)}`}>
                      {getStatusIcon(campaign.estado)}
                      {campaign.estado}
                    </span>
                    <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(campaign.tipo)}`}>
                      {getTypeIcon(campaign.tipo)}
                      {campaign.tipo}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-2">
                      {campaign.asunto}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300 line-clamp-2">
                      {campaign.contenido}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <Users className="w-4 h-4" />
                      <div>
                        <p className="text-xs text-gray-500">Destinatarios</p>
                        <p className="font-medium">{campaign.destinatarios}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <Calendar className="w-4 h-4" />
                      <div>
                        <p className="text-xs text-gray-500">Creada</p>
                        <p className="font-medium">{formatDate(campaign.fecha_creacion)}</p>
                      </div>
                    </div>
                    {campaign.fecha_envio && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <Send className="w-4 h-4" />
                        <div>
                          <p className="text-xs text-gray-500">Enviada</p>
                          <p className="font-medium">{formatDate(campaign.fecha_envio)}</p>
                        </div>
                      </div>
                    )}
                    {campaign.fecha_programada && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <Clock className="w-4 h-4" />
                        <div>
                          <p className="text-xs text-gray-500">Programada</p>
                          <p className="font-medium">{formatDate(campaign.fecha_programada)}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {campaign.estado === 'enviada' && campaign.metricas && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-600">{campaign.metricas.abiertos}</p>
                        <p className="text-xs text-gray-500">Abiertos</p>
                        <p className="text-xs text-green-600">{Math.round((campaign.metricas.abiertos / campaign.metricas.enviados) * 100)}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-blue-600">{campaign.metricas.clicks}</p>
                        <p className="text-xs text-gray-500">Clicks</p>
                        <p className="text-xs text-blue-600">{Math.round((campaign.metricas.clicks / campaign.metricas.enviados) * 100)}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-purple-600">{campaign.metricas.conversiones}</p>
                        <p className="text-xs text-gray-500">Conversiones</p>
                        <p className="text-xs text-purple-600">{Math.round((campaign.metricas.conversiones / campaign.metricas.enviados) * 100)}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-orange-600">{campaign.metricas.enviados}</p>
                        <p className="text-xs text-gray-500">Total Enviados</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row xl:flex-col gap-3 xl:w-48">
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => {
                      setSelectedCampaign(campaign);
                      setShowModal(true);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                    Ver Detalles
                  </Button>
                  
                  {campaign.estado === 'borrador' && (
                    <Button 
                      variant="success" 
                      size="sm" 
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => handleSendCampaign(campaign.id)}
                    >
                      <Send className="w-4 h-4" />
                      Enviar
                    </Button>
                  )}
                  
                  {campaign.estado !== 'enviada' && (
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </Button>
                  )}
                  
                  <Button 
                    variant="danger" 
                    size="sm" 
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredCampaigns.length === 0 && (
          <Card variant="gradient" className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Mail className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No hay campañas
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === 'all' ? 'No se han creado campañas aún' : `No hay campañas ${filter}`}
            </p>
          </Card>
        )}

        {/* Campaign Details Modal */}
        {showModal && selectedCampaign && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    {selectedCampaign.nombre}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="flex gap-3 mb-4">
                    <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedCampaign.estado)}`}>
                      {getStatusIcon(selectedCampaign.estado)}
                      {selectedCampaign.estado}
                    </span>
                    <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(selectedCampaign.tipo)}`}>
                      {getTypeIcon(selectedCampaign.tipo)}
                      {selectedCampaign.tipo}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Asunto
                    </label>
                    <p className="text-gray-900 dark:text-gray-100 text-lg font-medium">{selectedCampaign.asunto}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Contenido
                    </label>
                    <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                      <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                        {selectedCampaign.contenido}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Audiencia
                      </label>
                      <p className="text-gray-900 dark:text-gray-100">{selectedCampaign.audiencia}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Destinatarios
                      </label>
                      <p className="text-gray-900 dark:text-gray-100">{selectedCampaign.destinatarios}</p>
                    </div>
                  </div>

                  {selectedCampaign.estado === 'enviada' && selectedCampaign.metricas && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Métricas de Rendimiento
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{selectedCampaign.metricas.enviados}</p>
                          <p className="text-sm text-gray-500">Enviados</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{selectedCampaign.metricas.abiertos}</p>
                          <p className="text-sm text-gray-500">Abiertos</p>
                          <p className="text-xs text-green-600">{Math.round((selectedCampaign.metricas.abiertos / selectedCampaign.metricas.enviados) * 100)}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">{selectedCampaign.metricas.clicks}</p>
                          <p className="text-sm text-gray-500">Clicks</p>
                          <p className="text-xs text-purple-600">{Math.round((selectedCampaign.metricas.clicks / selectedCampaign.metricas.enviados) * 100)}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-orange-600">{selectedCampaign.metricas.conversiones}</p>
                          <p className="text-sm text-gray-500">Conversiones</p>
                          <p className="text-xs text-orange-600">{Math.round((selectedCampaign.metricas.conversiones / selectedCampaign.metricas.enviados) * 100)}%</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t">
                    {selectedCampaign.estado === 'borrador' && (
                      <Button 
                        variant="success" 
                        className="flex items-center gap-2"
                        onClick={() => {
                          handleSendCampaign(selectedCampaign.id);
                          setShowModal(false);
                        }}
                      >
                        <Send className="w-4 h-4" />
                        Enviar Campaña
                      </Button>
                    )}
                    {selectedCampaign.estado !== 'enviada' && (
                      <Button 
                        variant="secondary" 
                        className="flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Editar Campaña
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      onClick={() => setShowModal(false)}
                    >
                      Cerrar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Campaign Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    Nueva Campaña
                  </h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nombre de la Campaña:
                    </label>
                    <input
                      type="text"
                      value={newCampaign.nombre}
                      onChange={(e) => setNewCampaign({...newCampaign, nombre: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                      placeholder="Nombre descriptivo de la campaña"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Asunto del Email:
                    </label>
                    <input
                      type="text"
                      value={newCampaign.asunto}
                      onChange={(e) => setNewCampaign({...newCampaign, asunto: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                      placeholder="Asunto que verán los destinatarios"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tipo de Campaña:
                      </label>
                      <select
                        value={newCampaign.tipo}
                        onChange={(e) => setNewCampaign({...newCampaign, tipo: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                      >
                        <option value="promocional">Promocional</option>
                        <option value="bienvenida">Bienvenida</option>
                        <option value="seguimiento">Seguimiento</option>
                        <option value="reactivacion">Reactivación</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Audiencia:
                      </label>
                      <select
                        value={newCampaign.audiencia}
                        onChange={(e) => setNewCampaign({...newCampaign, audiencia: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                      >
                        <option value="todos">Todos los clientes</option>
                        <option value="nuevos_clientes">Nuevos clientes</option>
                        <option value="clientes_activos">Clientes activos</option>
                        <option value="inactivos">Clientes inactivos</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fecha Programada (opcional):
                    </label>
                    <input
                      type="datetime-local"
                      value={newCampaign.fecha_programada}
                      onChange={(e) => setNewCampaign({...newCampaign, fecha_programada: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Contenido del Email:
                    </label>
                    <textarea
                      value={newCampaign.contenido}
                      onChange={(e) => setNewCampaign({...newCampaign, contenido: e.target.value})}
                      rows={10}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                      placeholder="Escribe el contenido de tu email aquí..."
                    />
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    <Button 
                      variant="primary" 
                      className="flex items-center gap-2"
                      onClick={handleCreateCampaign}
                      disabled={!newCampaign.nombre || !newCampaign.asunto || !newCampaign.contenido}
                    >
                      <Plus className="w-4 h-4" />
                      Crear Campaña
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => setShowCreateModal(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

CommunicationEmailMarketingPage.propTypes = {
  showNavigation: PropTypes.bool
};

export default CommunicationEmailMarketingPage;