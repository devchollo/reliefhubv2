import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useSocket } from '../context/SocketContext';
import {
  Send, ArrowLeft, Info, MessageCircle, Package
} from 'lucide-react';
import api from '../config/api';

const Chat = () => {
  const { requestId } = useParams();
  const { user } = useAuth();
  const { error } = useNotification();
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();
  
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    fetchChat();
  }, [requestId]);

  useEffect(() => {
    if (chat && socket && isConnected) {
      socket.emit('chat:join', chat._id);
      socket.on('chat:message', handleNewMessage);
      socket.on('chat:typing', handleTyping);
      socket.on('chat:messagesRead', handleMessagesRead);

      return () => {
        socket.emit('chat:leave', chat._id);
        socket.off('chat:message', handleNewMessage);
        socket.off('chat:typing', handleTyping);
        socket.off('chat:messagesRead', handleMessagesRead);
      };
    }
  }, [chat, socket, isConnected]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (chat && messages.length > 0) {
      markAsRead();
    }
  }, [chat, messages]);

  const fetchChat = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/chats/request/${requestId}`);
      const chatData = response.data.data;
      setChat(chatData);
      setMessages(chatData.messages || []);
      
      const other = chatData.requester._id === user._id 
        ? chatData.volunteer 
        : chatData.requester;
      setOtherUser(other);
    } catch (err) {
      console.error('Error fetching chat:', err);
      error('Failed to load chat');
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (data) => {
    if (data.chatId === chat._id) {
      setMessages(prev => [...prev, data.message]);
    }
  };

  const handleTyping = (data) => {
    if (data.userId !== user._id) {
      setTyping(data.isTyping);
      if (data.isTyping) {
        setTimeout(() => setTyping(false), 3000);
      }
    }
  };

  const handleMessagesRead = (data) => {
    if (data.chatId === chat._id && data.readBy !== user._id) {
      setMessages(prev => prev.map(msg => ({
        ...msg,
        isRead: msg.sender._id === user._id ? true : msg.isRead
      })));
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      if (socket && isConnected) {
        socket.emit('chat:message', {
          chatId: chat._id,
          content
        });
      } else {
        const response = await api.post(`/chats/${chat._id}/messages`, { content });
        if (response.data.success) {
          setMessages(prev => [...prev, response.data.data]);
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
      error('Failed to send message');
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  const handleTypingIndicator = () => {
    if (socket && isConnected) {
      socket.emit('chat:typing', {
        chatId: chat._id,
        isTyping: true
      });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('chat:typing', {
          chatId: chat._id,
          isTyping: false
        });
      }, 1000);
    }
  };

  const markAsRead = async () => {
    try {
      if (socket && isConnected) {
        socket.emit('chat:read', { chatId: chat._id });
      } else {
        await api.put(`/chats/${chat._id}/read`);
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Chat not available</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div
            className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition"
            onClick={() => navigate(`/profile/${otherUser._id}`)}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
              {otherUser.profileImage ? (
                <img src={otherUser.profileImage} alt={otherUser.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                otherUser.name.charAt(0)
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{otherUser.name}</p>
              <p className="text-xs text-gray-500">
                {isConnected ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate(`/`)}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
          title="View Request"
        >
          <Info className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Request Info Banner */}
      <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <Package className="w-5 h-5 text-blue-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">{chat.request.title}</p>
            <p className="text-xs text-blue-600 capitalize">
              {chat.request.type} • {chat.request.status}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No messages yet</p>
              <p className="text-sm text-gray-500 mt-1">Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((message, idx) => {
            const isOwn = message.sender._id === user._id;
            const showAvatar = idx === 0 || messages[idx - 1].sender._id !== message.sender._id;
            
            return (
              <div
                key={message._id || idx}
                className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
              >
                {showAvatar && !isOwn && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {message.sender.profileImage ? (
                      <img src={message.sender.profileImage} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      message.sender.name.charAt(0)
                    )}
                  </div>
                )}
                {!showAvatar && !isOwn && <div className="w-8"></div>}
                
                <div className={`max-w-[70%]`}>
                  <div
                    className={`px-4 py-2 rounded-2xl ${
                      isOwn
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="break-words">{message.content}</p>
                  </div>
                  <div className={`flex items-center gap-2 mt-1 text-xs text-gray-500 ${isOwn ? 'justify-end' : ''}`}>
                    <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isOwn && message.isRead && (
                      <span className="text-blue-600">✓✓</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {typing && (
          <div className="flex items-end gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
              {otherUser.name.charAt(0)}
            </div>
            <div className="bg-white border border-gray-200 px-4 py-2 rounded-2xl">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t px-4 py-3">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTypingIndicator();
            }}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
