import { useState, useEffect, useRef } from 'react';
import { Card, Button } from '../components';
import { getAdminConversations, getAdminConversationMessages, adminReplyMessage } from '../api/axios';
import { 
  Search, 
  MessageSquare, 
  User, 
  Calendar, 
  Send, 
  Reply,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Eye
} from 'lucide-react';

const AdminMessagesPage = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, [filter]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const params = filter === 'unread' ? { status: 'unread' } : {};
      const response = await getAdminConversations(params);
      
      if (response.data.success) {
        setConversations(response.data.data || []);
      } else {
        setConversations([]);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      setMessagesLoading(true);
      const response = await getAdminConversationMessages(conversationId);
      
      if (response.data.success) {
        setMessages(response.data.data || []);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
    setShowModal(true);
    fetchMessages(conversation.id);
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedConversation) return;

    try {
      const replyData = { contenido: replyMessage };
      const response = await adminReplyMessage(selectedConversation.id, replyData);
      
      if (response.data.success) {
        const newMsg = {
          id: response.data.data.id,
          contenido: replyMessage,
          user_id: 'admin',
          remitente_nombre: 'Administrador',
          remitente_rol: 'admin',
          created_at: new Date().toISOString(),
          leido: 1
        };
        
        setMessages([...messages, newMsg]);
        setReplyMessage('');
        
        // Actualizar la conversación en la lista
        setConversations(conversations.map(conv => 
          conv.id === selectedConversation.id 
            ? { ...conv, ultimo_mensaje: replyMessage, mensajes_no_leidos: 0 }
            : conv
        ));
        
        alert('Respuesta enviada exitosamente');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Error al enviar la respuesta');
    }
  };

  const filteredConversations = conversations.filter(conversation => {
    const statusMatch = filter === 'all' || 
      (filter === 'unread' && conversation.mensajes_no_leidos > 0) ||
      (filter === 'read' && conversation.mensajes_no_leidos === 0);
    
    const searchMatch = searchTerm === '' || 
      conversation.asunto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.cliente_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.cliente_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.ultimo_mensaje?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return statusMatch && searchMatch;
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

  // Calcular estadísticas
  const totalConversations = conversations.length;
  const unreadConversations = conversations.filter(c => c.mensajes_no_leidos > 0).length;
  const readConversations = conversations.filter(c => c.mensajes_no_leidos === 0).length;
  const totalUnreadMessages = conversations.reduce((sum, c) => sum + (c.mensajes_no_leidos || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-heading font-bold text-gray-800 dark:text-gray-100 mb-4">
                💬 Mensajes de Clientes
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
                Gestiona las conversaciones con clientes y responde a sus consultas de manera eficiente
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchConversations}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Actualizar
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {totalConversations}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Conversaciones</div>
          </Card>

          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {totalUnreadMessages}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Mensajes Sin Leer</div>
          </Card>

          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {readConversations}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Conversaciones Leídas</div>
          </Card>

          <Card variant="gradient" className="text-center group hover:scale-105 transition-transform">
            <div className="flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-red-600" />
            </div>
            <div className="text-3xl font-bold text-red-600 mb-2">
              {unreadConversations}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Con Mensajes Nuevos</div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card variant="gradient" className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por asunto, cliente o contenido..."
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
                Todas ({totalConversations})
              </Button>
              <Button
                variant={filter === 'unread' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                Con Mensajes Nuevos ({unreadConversations})
              </Button>
              <Button
                variant={filter === 'read' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('read')}
              >
                Leídas ({readConversations})
              </Button>
            </div>
          </div>
        </Card>

        {/* Conversations List */}
        <div className="grid gap-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando conversaciones...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <Card variant="gradient" className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <MessageSquare className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                No hay conversaciones
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {filter === 'all' ? 'No se han recibido mensajes de clientes aún' : `No hay conversaciones ${filter}`}
              </p>
            </Card>
          ) : (
            filteredConversations.map((conversation) => (
              <Card 
                key={conversation.id} 
                variant="gradient" 
                hover 
                className={`group cursor-pointer ${conversation.mensajes_no_leidos > 0 ? 'border-l-4 border-l-orange-500 bg-orange-50/50 dark:bg-orange-900/10' : 'border-l-4 border-l-green-500'}`}
                onClick={() => handleConversationSelect(conversation)}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                        <MessageSquare className="w-5 h-5 inline mr-2" />
                        {conversation.asunto}
                      </h3>
                      {conversation.mensajes_no_leidos > 0 && (
                        <span className="px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded-full">
                          {conversation.mensajes_no_leidos} nuevos
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <User className="w-4 h-4" />
                        <div>
                          <p className="text-xs text-gray-500">Cliente:</p>
                          <p className="font-medium">{conversation.cliente_nombre}</p>
                          <p className="text-sm text-gray-500">{conversation.cliente_email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <Calendar className="w-4 h-4" />
                        <div>
                          <p className="text-xs text-gray-500">Última actividad</p>
                          <p className="font-medium">{formatDate(conversation.ultima_actividad)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-gray-700 dark:text-gray-300 line-clamp-2">
                        <span className="text-sm text-gray-500">Último mensaje: </span>
                        {conversation.ultimo_mensaje}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:w-48">
                    <Button 
                      variant="primary" 
                      size="sm" 
                      className="w-full flex items-center justify-center gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConversationSelect(conversation);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                      Ver Conversación
                    </Button>
                    
                    <Button 
                      variant="success" 
                      size="sm" 
                      className="w-full flex items-center justify-center gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConversationSelect(conversation);
                      }}
                    >
                      <Reply className="w-4 h-4" />
                      Responder
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Conversation Modal */}
        {showModal && selectedConversation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                      {selectedConversation.asunto}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Conversación con {selectedConversation.cliente_nombre}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messagesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Cargando mensajes...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-gray-500">No hay mensajes en esta conversación</p>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.remitente_rol === 'admin' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.remitente_rol === 'admin'
                            ? 'bg-violet-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                        }`}
                      >
                        <div className="text-xs opacity-75 mb-1">
                          {message.remitente_nombre} - {formatDate(message.created_at)}
                        </div>
                        <p>{message.contenido}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Area */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-600">
                <div className="flex gap-3">
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Escribe tu respuesta..."
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-slate-700 dark:text-white resize-none"
                    rows={3}
                  />
                  <Button
                    variant="primary"
                    onClick={handleSendReply}
                    disabled={!replyMessage.trim()}
                    className="flex items-center gap-2 self-end"
                  >
                    <Send className="w-4 h-4" />
                    Enviar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMessagesPage;