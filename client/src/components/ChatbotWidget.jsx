import React, { useState, useRef, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { sendChatMessageAPI, getChatHistoryAPI, getConversationAPI } from '../api/mlApi';
import { X, Send, Loader2, Bot, Menu, Plus, Clock, MessageSquare } from 'lucide-react';

const ChatbotWidgetInner = () => {
  const { user } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to the bottom of the messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Fetch history when menu opens
  useEffect(() => {
    if (isMenuOpen && user?.id) {
      const fetchHistory = async () => {
        try {
          setIsLoadingHistory(true);
          const history = await getChatHistoryAPI(user.id);
          setChatHistory(history);
        } catch (error) {
          console.error("Failed to load history", error);
        } finally {
          setIsLoadingHistory(false);
        }
      };
      fetchHistory();
    }
  }, [isMenuOpen, user]);

  // Initial greeting when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'greeting',
          sender: 'bot',
          text: `Hello ${user?.name || 'Farmer'}! How can AgriSense help you today?`,
        },
      ]);
    }
  }, [isOpen, messages.length, user]);

  // Do not render if the user is not authenticated (chat history is keyed by user id)
  if (!user || !user.id) {
    return null;
  }

  const startNewChat = () => {
    setMessages([
      {
        id: 'greeting',
        sender: 'bot',
        text: `Hello ${user?.name || 'Farmer'}! How can AgriSense help you today?`,
      },
    ]);
    setConversationId(null);
    setIsMenuOpen(false);
  };

  const loadPreviousChat = async (id) => {
    try {
      setIsMenuOpen(false);
      setMessages([]);
      setIsLoading(true);
      const data = await getConversationAPI(id);
      
      const formatted = data.messages.map((m, idx) => ({
        id: `hist-${idx}`,
        sender: m.role === 'human' ? 'user' : 'bot',
        text: m.content
      }));
      
      setMessages(formatted);
      setConversationId(id);
    } catch (error) {
      console.error("Failed to load conversation", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMessage = { id: Date.now().toString(), sender: 'user', text: inputText };
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const data = await sendChatMessageAPI(user.id, userMessage.text, conversationId);
      
      // Update conversation ID for continuity
      if (data.conversation_id) {
        setConversationId(data.conversation_id);
      }

      const botMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: data.response,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: "I'm sorry, I couldn't connect to the AgriSense network. Please try again later.",
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[350px] sm:w-[400px] h-[500px] max-h-[80vh] flex flex-col bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl overflow-hidden border border-green-100 transition-all duration-300 transform origin-bottom-right relative">
          
          {/* Sidebar Menu */}
          <div className={`absolute top-0 left-0 h-full w-[75%] bg-white shadow-2xl z-20 transform transition-transform duration-300 ease-in-out flex flex-col ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="bg-green-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-semibold">Chat Options</h3>
              <button onClick={() => setIsMenuOpen(false)} className="p-1 hover:bg-white/20 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-4 flex-1">
              <button 
                onClick={startNewChat}
                className="flex items-center gap-3 w-full p-3 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl transition-colors font-medium"
              >
                <Plus size={20} />
                <span>New Chat</span>
              </button>
              
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Previous Chats</h4>
                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                  {isLoadingHistory ? (
                    <div className="flex justify-center p-4"><Loader2 className="animate-spin text-green-500" /></div>
                  ) : chatHistory.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-2">No previous chats</p>
                  ) : (
                    chatHistory.map((chat) => (
                      <button 
                        key={chat.conversation_id}
                        onClick={() => loadPreviousChat(chat.conversation_id)}
                        className={`flex items-center gap-3 w-full p-3 hover:bg-gray-50 rounded-xl transition-colors text-left ${conversationId === chat.conversation_id ? 'bg-green-50 border border-green-100' : ''}`}
                      >
                        <MessageSquare size={18} className={conversationId === chat.conversation_id ? "text-green-600" : "text-gray-400"} />
                        <div className="flex-1 overflow-hidden">
                          <p className={`text-sm font-medium truncate ${conversationId === chat.conversation_id ? 'text-green-700' : 'text-gray-700'}`}>{chat.title}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(chat.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Overlay to close menu */}
          {isMenuOpen && (
            <div 
              className="absolute inset-0 bg-black/20 z-10 transition-opacity" 
              onClick={() => setIsMenuOpen(false)}
            />
          )}

          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 flex justify-between items-center text-white shadow-md z-10">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsMenuOpen(true)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Menu size={20} />
              </button>
              <div className="bg-white/20 p-2 rounded-full hidden sm:block">
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg leading-tight">AgriSense AI</h3>
                <p className="text-xs text-green-100 hidden sm:block">Your Personal Farm Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-3 shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-green-600 text-white rounded-tr-sm'
                      : msg.isError
                      ? 'bg-red-50 text-red-600 border border-red-100 rounded-tl-sm'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {/* Render markdown bold simply if needed, or just standard text */}
                    {msg.text.split('\\n').map((line, i) => (
                      <React.Fragment key={i}>
                        {line.replace(/\*/g, '')}
                        <br />
                      </React.Fragment>
                    ))}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm p-3 shadow-sm flex items-center gap-2">
                  <Loader2 size={16} className="text-green-500 animate-spin" />
                  <span className="text-xs text-gray-500">AgriSense is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-100">
            <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder="Ask about crops, weather, or fertilizers..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 resize-none h-[44px] min-h-[44px] max-h-[120px] transition-all"
                rows="1"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="bg-green-600 text-white p-3 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex-shrink-0"
              >
                <Send size={18} className={inputText.trim() && !isLoading ? 'translate-x-0.5 -translate-y-0.5 transition-transform' : ''} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${
          isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
        } transition-all duration-300 w-20 h-20 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-center hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:-translate-y-1 overflow-hidden border-4 border-green-500 z-50`}
      >
        <img 
          src="/chatbot-icon.png" 
          alt="Chat" 
          className="w-full h-full object-cover p-1"
          onError={(e) => {
            // Fallback if image not found
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'block';
          }}
        />
        <div style={{ display: 'none' }} className="text-green-600">
          <Bot size={32} />
        </div>
      </button>
    </div>
  );
};

// Remount per signed-in user so conversations never leak between accounts on a shared browser.
const ChatbotWidget = () => {
  const { user } = useContext(AuthContext);
  return <ChatbotWidgetInner key={user?.id || 'anonymous'} />;
};

export default ChatbotWidget;
