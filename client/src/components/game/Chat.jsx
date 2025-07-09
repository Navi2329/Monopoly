import React, { useState, useRef, useEffect } from 'react';

const Chat = ({ messages, onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      const scrollContainer = messagesContainerRef.current;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const isOwnMessage = (sender) => {
    return sender === 'You' || sender === 'GODWILDBEAST';
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/40 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-white/10 bg-gradient-to-r from-slate-800/30 to-slate-700/30 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"/>
            </svg>
            <span className="text-sm font-medium text-white/90">Chat</span>
          </div>
          <div className="flex items-center gap-1">
            <button className="text-white/40 hover:text-white/70 transition-colors duration-200 p-1 rounded-md hover:bg-white/5">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" clipRule="evenodd" />
              </svg>
            </button>
            <button className="text-white/40 hover:text-white/70 transition-colors duration-200 p-1 rounded-md hover:bg-white/5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12l4-4m-4 4l4 4"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto custom-scrollbar"
        style={{ 
          minHeight: 0,
          scrollBehavior: 'smooth'
        }}
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white/40 text-xs px-4">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <span className="font-medium">No messages yet</span>
            <span className="text-white/30 mt-1">Start a conversation!</span>
          </div>
        ) : (
          <div className="p-3">
            <div className="space-y-3">
              {messages.map((msg, index) => {
                const isOwn = isOwnMessage(msg.sender);
                const isGameMessage = msg.sender === 'Game';
                
                return (
                  <div
                    key={msg.id}
                    className="message-bubble"
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animationFillMode: 'both'
                    }}
                  >
                    {isGameMessage ? (
                      // System/Game messages - centered
                      <div className="flex justify-center">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm max-w-[85%] text-center">
                          {msg.text}
                        </div>
                      </div>
                    ) : (
                      // User messages - bubble style
                      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} chat-message-wrapper`}>
                        <div className={`flex flex-col max-w-[80%] ${isOwn ? 'items-end' : 'items-start'}`}>
                          {/* Sender name (only for others) */}
                          {!isOwn && (
                            <div className="text-xs text-blue-300 mb-1.5 px-2 font-medium">
                              {msg.sender}
                            </div>
                          )}
                          
                          {/* Message bubble container */}
                          <div className="relative chat-bubble-container">
                            <div
                              className={`
                                chat-bubble-padding shadow-lg backdrop-blur-sm
                                ${isOwn 
                                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-[20px] rounded-br-[8px]' 
                                  : 'bg-white/12 text-white/95 border border-white/20 rounded-[20px] rounded-bl-[8px]'
                                }
                              `}
                              style={{
                                minWidth: '80px',
                                maxWidth: '100%'
                              }}
                            >
                              {/* Message text */}
                              <div className="chat-message-text chat-bubble-text break-words">
                                {msg.text}
                              </div>
                              
                              {/* Timestamp */}
                              <div 
                                className={`
                                  text-xs mt-2 opacity-70
                                  ${isOwn ? 'text-blue-100' : 'text-white/60'}
                                `}
                                style={{ fontSize: '11px' }}
                              >
                                {msg.time}
                              </div>
                            </div>
                            
                            {/* Message tail */}
                            <div 
                              className={`
                                absolute bottom-1 w-0 h-0 
                                ${isOwn 
                                  ? 'right-0 border-l-[10px] border-l-blue-600 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent translate-x-[3px]' 
                                  : 'left-0 border-r-[10px] border-r-white/12 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent -translate-x-[3px]'
                                }
                              `}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Message Input */}
      <div className="px-3 py-3 border-t border-white/10 bg-gradient-to-r from-slate-800/20 to-slate-700/20 flex-shrink-0">
        <form onSubmit={handleSubmit} className="w-full">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={disabled ? "Join game to chat..." : "Type a message..."}
                disabled={disabled}
                className={`w-full bg-white/8 backdrop-blur-sm text-white/90 px-4 py-3 rounded-full text-sm border border-white/10 hover:border-white/20 focus:border-blue-400/50 focus:outline-none transition-all duration-200 placeholder-white/40 focus:bg-white/12 resize-none ${
                  disabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                maxLength={500}
                style={{ minHeight: '44px' }}
              />
            </div>
            <button
              type="submit"
              className={`
                w-11 h-11 rounded-full transition-all duration-200 flex items-center justify-center flex-shrink-0
                ${message.trim() && !disabled
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95' 
                  : 'bg-white/8 text-white/30 cursor-not-allowed'
                }
              `}
              disabled={!message.trim() || disabled}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;
