import React, { useState, useRef, useEffect } from 'react';

const ChatAI = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '¡Hola! 👋 Soy tu asistente musical. Puedo ayudarte con:\n\n• **Progresiones de acordes** para cualquier estilo\n• **Círculos armónicos** y modulaciones\n• **Teoría musical** explicada de forma sencilla\n• **Sugerencias de canciones** similares\n\n¿En qué puedo ayudarte?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Quick suggestion chips
  const suggestions = [
    '¿Qué acordes tiene la tonalidad de G?',
    'Dame una progresión para adoración',
    '¿Cómo modular de G a A?',
    'Explica el círculo de quintas'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const url = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api/ai/chat` : `/api/ai/chat`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })) })
      });

      const data = await res.json();
      
      if (data.response) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, hubo un error al procesar tu solicitud.' }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error de conexión con el asistente. Verifica tu conexión a internet.' }]);
    }
    setLoading(false);
  };

  const handleSuggestionClick = (text) => {
    setInput(text);
    inputRef.current?.focus();
  };

  const formatMessage = (content) => {
    // Basic markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded text-primary text-sm font-mono">$1</code>')
      .replace(/^• /gm, '<span class="text-primary mr-1">•</span> ')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="w-full max-w-4xl mx-auto h-[calc(100vh-220px)] md:h-[70vh] flex flex-col bg-[#121212] border border-white/10 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl animate-fade-in relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
      
      {/* Header */}
      <div className="p-4 md:p-5 border-b border-white/5 flex items-center space-x-3 bg-white/[0.02] flex-shrink-0 relative z-10">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center shadow-lg flex-shrink-0">
          <svg className="w-5 h-5 md:w-6 md:h-6 text-black" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H14A7,7 0 0,1 21,14H22A1,1 0 0,1 23,15V18A1,1 0 0,1 22,19H21V20A2,2 0 0,1 19,22H5A2,2 0 0,1 3,20V19H2A1,1 0 0,1 1,18V15A1,1 0 0,1 2,14H3A7,7 0 0,1 10,7H11V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2M7.5,13A2.5,2.5 0 0,0 5,15.5A2.5,2.5 0 0,0 7.5,18A2.5,2.5 0 0,0 10,15.5A2.5,2.5 0 0,0 7.5,13M16.5,13A2.5,2.5 0 0,0 14,15.5A2.5,2.5 0 0,0 16.5,18A2.5,2.5 0 0,0 19,15.5A2.5,2.5 0 0,0 16.5,13Z" />
          </svg>
        </div>
        <div className="min-w-0">
          <h2 className="text-base md:text-xl font-bold text-white tracking-wide truncate">Asistente Musical IA</h2>
          <p className="text-[10px] text-primary font-bold uppercase tracking-widest">GI Setlist · En línea</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-primary text-black rounded-br-sm shadow-lg' : 'bg-white/5 border border-white/10 text-gray-200 rounded-bl-sm'}`}>
              <div 
                className={`whitespace-pre-wrap font-medium leading-relaxed text-sm ${msg.role === 'user' ? 'text-black font-bold' : ''}`}
                dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
              />
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-sm px-5 py-3.5 flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />

        {/* Suggestion chips (show only if 1 message = initial) */}
        {messages.length === 1 && !loading && (
          <div className="flex flex-wrap gap-2 pt-2 animate-fade-in">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(s)}
                className="text-xs font-medium text-gray-400 bg-white/5 border border-white/10 px-3 py-2 rounded-xl hover:bg-white/10 hover:text-white transition-all active:scale-95"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 md:p-4 border-t border-white/5 bg-white/[0.02] flex-shrink-0">
        <div className="relative flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu pregunta..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 md:py-3.5 pl-4 pr-4 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-all font-medium"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-primary text-black flex items-center justify-center disabled:opacity-30 hover:bg-primary-hover transition-all active:scale-95 flex-shrink-0"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatAI;
