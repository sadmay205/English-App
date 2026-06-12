import './ChatbotPanel.css';
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Trash2, Loader } from 'lucide-react';
import useChatStore from '../../store/useChatStore';
import { toast } from 'sonner';

// Lightweight Markdown + code renderer for premium AI Tutor responses
function MarkdownContent({ content }) {
  const parts = content.split(/(```[\s\S]*?```)/g);
  
  return (
    <div className="markdown-body">
      {parts.map((part, idx) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const code = part.slice(3, -3).trim();
          const lines = code.split('\n');
          let displayCode = code;
          let lang = '';
          if (lines[0] && lines[0].length < 15 && !lines[0].includes(' ') && !lines[0].includes('(')) {
            lang = lines[0];
            displayCode = lines.slice(1).join('\n');
          }
          return (
            <pre key={idx} className="msg-code-block animate-fade-in">
              {lang && <span className="code-lang">{lang}</span>}
              <code>{displayCode}</code>
            </pre>
          );
        }

        const lines = part.split('\n');
        return lines.map((line, lIdx) => {
          const boldParts = line.split(/(\*\*.*?\*\*)/g);
          const renderedLine = boldParts.map((bp, bpIdx) => {
            if (bp.startsWith('**') && bp.endsWith('**')) {
              return <strong key={bpIdx} className="msg-bold">{bp.slice(2, -2)}</strong>;
            }
            
            const codeParts = bp.split(/(`.*?`)/g);
            return codeParts.map((cp, cpIdx) => {
              if (cp.startsWith('`') && cp.endsWith('`')) {
                return <code key={cpIdx} className="msg-inline-code">{cp.slice(1, -1)}</code>;
              }
              return cp;
            });
          });

          return (
            <p key={lIdx} className={line.trim() === '' ? 'empty-p' : ''}>
              {renderedLine}
            </p>
          );
        });
      })}
      
    </div>
  );
}

export default function ChatbotPanel() {
  const { messages, sendMessage, clearChat, isLoading } = useChatStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const currentInput = input.trim();
    setInput('');
    await sendMessage(currentInput);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    clearChat();
    toast.success('Đã xóa lịch sử trò chuyện!');
  };

  return (
    <aside className="chatbot-panel">
      {/* Header */}
      <div className="chatbot-header">
        <div className="chatbot-header-left">
          <div className="chatbot-avatar">
            <Sparkles size={18} />
          </div>
          <div>
            <h2 className="chatbot-title">AI Tutor</h2>
            <span className="chatbot-status">
              <span className="chatbot-status-dot" />
              Online
            </span>
          </div>
        </div>
        <button onClick={handleClearChat} className="chatbot-clear-btn" title="Xóa lịch sử">
          <Trash2 size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="chatbot-messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`chatbot-message ${msg.role === 'user' ? 'user' : 'assistant'} animate-fade-in`}
          >
            <div className={`chatbot-msg-avatar ${msg.role}`}>
              {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
            </div>
            <div className={`chatbot-msg-bubble ${msg.role}`}>
              <MarkdownContent content={msg.content} />
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="chatbot-message assistant animate-fade-in">
            <div className="chatbot-msg-avatar assistant">
              <Bot size={14} />
            </div>
            <div className="chatbot-msg-bubble assistant">
              <div className="chatbot-typing">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chatbot-input-area">
        <div className="chatbot-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={isLoading ? "AI đang trả lời..." : "Hỏi về tiếng Anh..."}
            className="chatbot-input"
            id="chatbot-input"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="chatbot-send-btn"
            id="chatbot-send"
          >
            <Send size={16} />
          </button>
        </div>
      </div>


    </aside>
  );
}
