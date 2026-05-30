import React from 'react';
import './Header.css';

export default function Header({ streak, activityMode, setActivityMode, onCoachOpen }) {
  return (
    <header className="header">
      <div className="header-logo">
        <div className="logo-icon">{activityMode === 'running' ? '🏃' : '🚶'}</div>
        <div>
          <h1>WalkPlanner</h1>
          <p>ウォーキング・ランニングルートプランナー</p>
        </div>
      </div>
      <div className="header-center">
        <div className="mode-switcher">
          <button
            className={`mode-btn ${activityMode === 'walking' ? 'active' : ''}`}
            onClick={() => setActivityMode('walking')}
          >🚶 ウォーキング</button>
          <button
            className={`mode-btn ${activityMode === 'running' ? 'active' : ''}`}
            onClick={() => setActivityMode('running')}
          >🏃 ランニング</button>
        </div>
      </div>
      <div className="header-right">
        {streak > 0 && (
          <div className="streak-badge">
            🔥 {streak}日連続
          </div>
        )}
        <button className="coach-btn" onClick={onCoachOpen}>
          🤖 AIコーチ
        </button>
      </div>
    </header>
  );
}
