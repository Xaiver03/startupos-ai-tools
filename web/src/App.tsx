import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Message } from './components/ChatWindow';
import { ChatWindow } from './components/ChatWindow';

const SESSION_ID = `sess_${Date.now()}`;

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '你好！我是 SSOS AI 助手，可以帮你处理财务管理相关的事务。请问有什么可以帮你的？',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          session_id: SESSION_ID,
          history: messages
            .filter((m) => m.role !== 'system')
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();

      const assistantMsg: Message = {
        role: 'assistant',
        content: data.content || '收到你的消息。',
        timestamp: new Date().toISOString(),
        type: data.type,
        actions: data.suggested_actions,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: Message = {
        role: 'assistant',
        content: `抱歉，发生了错误: ${err instanceof Error ? err.message : '连接失败'}`,
        timestamp: new Date().toISOString(),
        type: 'error',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleActionClick = (action: string) => {
    setInput(action);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: 720, margin: '0 auto' }}>
      <header style={{
        padding: '16px',
        borderBottom: '1px solid #e5e7eb',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: 18,
        }}>
          S
        </div>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 600 }}>SSOS AI</h1>
          <p style={{ fontSize: 12, color: '#6b7280' }}>财务智能助手</p>
        </div>
      </header>

      <main style={{ flex: 1, overflow: 'hidden' }}>
        <ChatWindow
          messages={messages}
          loading={loading}
          onActionClick={handleActionClick}
          messagesEndRef={messagesEndRef}
        />
      </main>

      <footer style={{
        padding: '12px 16px',
        borderTop: '1px solid #e5e7eb',
        background: '#fff',
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入你的财务管理需求..."
            rows={1}
            style={{
              flex: 1,
              padding: '10px 14px',
              border: '1px solid #d1d5db',
              borderRadius: 12,
              fontSize: 14,
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{
              padding: '10px 20px',
              background: loading ? '#93c5fd' : '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {loading ? '...' : '发送'}
          </button>
        </div>
        <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8, textAlign: 'center' }}>
          SSOS AI — 智能中小企业财务管理系统
        </p>
      </footer>
    </div>
  );
}
