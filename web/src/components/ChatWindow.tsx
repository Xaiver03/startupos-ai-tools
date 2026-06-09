import React from 'react';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  type?: string;
  actions?: string[];
}

interface ChatWindowProps {
  messages: Message[];
  loading: boolean;
  onActionClick: (action: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export function ChatWindow({ messages, loading, onActionClick, messagesEndRef }: ChatWindowProps) {
  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}>
      {messages.map((msg, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
          }}
        >
          <div
            style={{
              maxWidth: '85%',
              padding: '10px 14px',
              borderRadius: 12,
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                : msg.type === 'error'
                  ? '#fef2f2'
                  : '#f3f4f6',
              color: msg.role === 'user' ? '#fff' : msg.type === 'error' ? '#991b1b' : '#1f2937',
              fontSize: 14,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              borderBottomRightRadius: msg.role === 'user' ? 4 : 12,
              borderBottomLeftRadius: msg.role === 'user' ? 12 : 4,
            }}
          >
            {msg.content}
          </div>

          {msg.actions && msg.actions.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              {msg.actions.map((action, j) => (
                <button
                  key={j}
                  onClick={() => onActionClick(action)}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 16,
                    background: '#fff',
                    fontSize: 12,
                    color: '#374151',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f3f4f6';
                    e.currentTarget.style.borderColor = '#9ca3af';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }}
                >
                  {action}
                </button>
              ))}
            </div>
          )}

          <span style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>
            {new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      ))}

      {loading && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '0 4px' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#93c5fd',
                  animation: 'pulse 1.4s ease-in-out infinite',
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
          <style>{`
            @keyframes pulse {
              0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
              40% { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
