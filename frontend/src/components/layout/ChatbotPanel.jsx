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
      
      <style>{`
        .markdown-body p {
          margin-bottom: 0.5rem;
          line-height: 1.5;
        }
        .markdown-body p:last-child {
          margin-bottom: 0;
        }
        .markdown-body .empty-p {
          height: 0.5rem;
          margin: 0;
        }
        .msg-bold {
          color: var(--color-accent-secondary);
          font-weight: 700;
        }
        .msg-code-block {
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid var(--color-border-default);
          border-radius: var(--radius-sm);
          padding: 0.625rem 0.875rem;
          margin: 0.5rem 0;
          font-family: Consolas, Monaco, monospace;
          font-size: 0.75rem;
          overflow-x: auto;
          position: relative;
          color: #c084fc;
        }
        .code-lang {
          position: absolute;
          top: 2px;
          right: 6px;
          font-size: 0.6rem;
          color: var(--color-text-muted);
          text-transform: uppercase;
          font-weight: 700;
        }
        .msg-inline-code {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid var(--color-border-default);
          padding: 0.125rem 0.25rem;
          border-radius: 4px;
          font-family: Consolas, Monaco, monospace;
          color: #f472b6;
          font-size: 0.75rem;
        }
      `}</style>
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

      <style>{`
        .chatbot-panel {
          height: 100vh;
          background: linear-gradient(180deg, var(--color-bg-secondary), var(--color-bg-primary));
          border-left: 1px solid var(--color-border-default);
          display: flex;
          flex-direction: column;
          animation: slideInRight 0.4s ease-out;
        }

        .chatbot-header {
          padding: 1rem 1rem;
          border-bottom: 1px solid var(--color-border-default);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .chatbot-header-left {
          display: flex;
          align-items: center;
          gap: 0.625rem;
        }

        .chatbot-avatar {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          background: var(--gradient-accent);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: var(--shadow-button);
        }

        .chatbot-title {
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--color-text-primary);
        }

        .chatbot-status {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.7rem;
          color: var(--color-success);
        }

        .chatbot-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--color-success);
          animation: pulse-glow 2s infinite;
        }

        .chatbot-clear-btn {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--color-border-default);
          background: transparent;
          color: var(--color-text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .chatbot-clear-btn:hover {
          background: var(--color-error-bg);
          border-color: var(--color-error);
          color: var(--color-error);
        }

        .chatbot-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
        }

        .chatbot-message {
          display: flex;
          gap: 0.5rem;
          align-items: flex-start;
        }

        .chatbot-message.user {
          flex-direction: row-reverse;
        }

        .chatbot-msg-avatar {
          width: 28px;
          height: 28px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .chatbot-msg-avatar.assistant {
          background: var(--color-accent-glow);
          color: var(--color-accent-primary);
        }

        .chatbot-msg-avatar.user {
          background: var(--color-bg-tertiary);
          color: var(--color-text-secondary);
        }

        .chatbot-msg-bubble {
          max-width: 85%;
          padding: 0.625rem 0.875rem;
          border-radius: var(--radius-md);
          font-size: 0.8125rem;
          line-height: 1.6;
        }

        .chatbot-msg-bubble.assistant {
          background: var(--color-bg-tertiary);
          color: var(--color-text-primary);
          border-bottom-left-radius: 4px;
        }

        .chatbot-msg-bubble.user {
          background: var(--color-accent-primary);
          color: white;
          border-bottom-right-radius: 4px;
        }

        .chatbot-typing {
          display: flex;
          gap: 4px;
          padding: 0.25rem 0;
        }

        .chatbot-input-area {
          padding: 0.875rem 1rem;
          border-top: 1px solid var(--color-border-default);
        }

        .chatbot-input-wrapper {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          background: var(--color-bg-tertiary);
          border: 1px solid var(--color-border-default);
          border-radius: var(--radius-md);
          padding: 0.375rem 0.5rem;
          transition: border-color 0.2s ease;
        }

        .chatbot-input-wrapper:focus-within {
          border-color: var(--color-accent-primary);
          box-shadow: 0 0 0 3px var(--color-accent-glow);
        }

        .chatbot-input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--color-text-primary);
          font-size: 0.8125rem;
          padding: 0.375rem 0.25rem;
          outline: none;
          font-family: inherit;
        }

        .chatbot-input::placeholder {
          color: var(--color-text-muted);
        }

        .chatbot-send-btn {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          background: var(--gradient-accent);
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .chatbot-send-btn:hover:not(:disabled) {
          box-shadow: var(--shadow-button);
          transform: scale(1.05);
        }

        .chatbot-send-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>
    </aside>
  );
}
