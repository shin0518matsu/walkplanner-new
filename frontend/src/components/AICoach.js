import React, { useState, useRef, useEffect } from 'react';
import './AICoach.css';

export default function AICoach({ apiUrl, activityMode, streak, distance, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `こんにちは！AIコーチです🏃\n${streak > 0 ? `${streak}日連続で頑張っていますね！すばらしい！` : 'さあ、一緒に目標を達成しましょう！'}\n\n目標設定やアドバイスが必要なことがあれば何でも聞いてください！`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${apiUrl}/api/coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          context: { activityMode, streak, distance },
          history: messages,
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'エラーが発生しました。もう一度試してください。' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="coach-overlay">
      <div className="coach-panel">
        <div className="coach-header">
          <div className="coach-title">
            <span>🤖</span>
            <span>AIコーチ</span>
          </div>
          <button className="coach-close" onClick={onClose}>✕</button>
        </div>
        <div className="coach-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`coach-msg coach-msg--${msg.role}`}>
              <div className="coach-bubble">{msg.content}</div>
            </div>
          ))}
          {loading && (
            <div className="coach-msg coach-msg--assistant">
              <div className="coach-bubble coach-typing">
                <span /><span /><span />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="coach-input-area">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="メッセージを入力..."
            disabled={loading}
          />
          <button onClick={sendMessage} disabled={loading || !input.trim()}>送信</button>
        </div>
      </div>
    </div>
  );
}
