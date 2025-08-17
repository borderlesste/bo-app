import { useState, useEffect, useRef } from 'react';
import { getClientConversations, getClientConversationMessages, sendClientMessage, startClientConversation } from '../../api/axios';

const ClientMessages = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const messagesEndRef = useRef(null);

  // 👉 Formato de tiempo corregido
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return "Ayer";
    } else {
      return date.toLocaleDateString();
    }
  };

  // 👉 Cargar conversaciones
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const response = await getClientConversations();
        setConversations(response.data?.data || []);
        if (response.data?.data?.length > 0 && !selectedConversation) {
         // setSelectedConversation(response.data.data[0]);
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
        setConversations([]);
      }
    };

    loadConversations();
  }, [selectedConversation]);

  // 👉 Cargar mensajes de la conversación seleccionada
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedConversation) return;
      setLoading(true);
      try {
        const response = await getClientConversationMessages(selectedConversation.id);
        setMessages(response.data?.data || []);
      } catch (error) {
        console.error('Error loading messages:', error);
        setMessages([]);
      }
      setLoading(false);
    };

    loadMessages();
  }, [selectedConversation]);

  // 👉 Scroll automático cuando llegan mensajes nuevos
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // 👉 Enviar mensaje
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await sendClientMessage(selectedConversation.id, {
        contenido: newMessage
      });

      setMessages([...messages, response.data.data]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // 👉 Crear nueva conversación (corregido: antes usabas startClientConversation ❌)
  const startNewConversation = async (subject) => {
    try {
      const response = await startClientConversation({
        asunto: subject,
        contenido: 'Nueva conversación iniciada'
      });

      const newConv = response.data.data;
      setConversations(prev => [newConv, ...prev]);
      setSelectedConversation(newConv);
      setShowNewConversation(false);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  return (
    <div className="flex h-[calc(100vh-200px)] bg-white rounded-lg shadow">
      {/* Sidebar de conversaciones */}
      <div className="w-1/3 border-r flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-bold">Conversaciones</h2>
          <button 
            onClick={() => setShowNewConversation(true)} 
            className="text-blue-600 hover:text-blue-800"
          >
            +
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {(conversations || []).map((conv, index) => {
            // Defensive programming: ensure conv is an object with required properties
            if (!conv || typeof conv !== 'object') {
              console.warn('Invalid conversation object:', conv);
              return null;
            }
            
            const conversationId = conv.id || `temp-${index}`;
            const subject = conv.asunto || conv.subject || 'Sin asunto';
            const lastMessage = conv.ultimo_mensaje?.contenido || conv.lastMessage || 'Sin mensajes';
            const updateTime = conv.updated_at || conv.date || new Date().toISOString();
            
            return (
              <div
                key={conversationId}
                onClick={() => setSelectedConversation(conv)}
                className={`p-4 cursor-pointer border-b hover:bg-gray-50 ${
                  selectedConversation?.id === conversationId ? 'bg-blue-50' : ''
                }`}
              >
                <div className="font-medium">{subject}</div>
                <div className="text-sm text-gray-600 truncate">
                  {lastMessage}
                </div>
                <div className="text-xs text-gray-400">
                  {formatMessageTime(updateTime)}
                </div>
              </div>
            );
          }).filter(Boolean)}
        </div>
      </div>

      {/* Área de mensajes */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <div className="p-4 border-b">
              <h3 className="font-bold">{selectedConversation.asunto}</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <p>Cargando mensajes...</p>
              ) : (
                (messages || []).map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.user_id === selectedConversation.user_id
                        ? 'justify-end'
                        : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.user_id === selectedConversation.user_id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200'
                      }`}
                    >
                      <p>{msg.contenido}</p>
                      <span className="text-xs opacity-75">
                        {formatMessageTime(msg.created_at)}
                      </span>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-4 border-t flex">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 border rounded-lg px-4 py-2 mr-2"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Enviar
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Selecciona una conversación
          </div>
        )}
      </div>

      {/* Modal nueva conversación */}
      {showNewConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="font-bold mb-4">Nueva Conversación</h3>
            <input
              type="text"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="Asunto"
              className="w-full border rounded-lg px-4 py-2 mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowNewConversation(false)}
                className="px-4 py-2 border rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={() => startNewConversation(newSubject)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientMessages;