import React, { useState, useRef, useEffect } from 'react';
import './AICoach.css';

export default function AICoach({ apiUrl, activityMode, streak, distance, activities, onClose }) {
  const totalDays = Object.keys(activities || {}).length;
  const totalDist = Object.values(activities || {}).reduce((sum, a) => sum + a.distance, 0);

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: streak > 0
        ? `こんにちは！AIコーチです🏃\n${streak}日連続で頑張っていますね！これまでに${totalDays}日活動して、合計${totalDist.toFixed(1)}km達成しています！\n\n目標設定やアドバイスがあれば何でも聞いてください！`
        : 'こんにちは！AIコーチです🏃\nさあ、一緒に目標を達成しましょう！\n\n何でも聞いてください！'
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
          context: { activityMode, streak, distance, totalDays, totalDistance: totalDist.toFixed(1) },
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
          <div className="coach-title"><span>🤖</span><span>AIコーチ</span></div>
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
              <div className="coach-bubble coach-typing"><span /><span /><span /></div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="coach-input-area">
          <input
            type="text"
            value={input}
