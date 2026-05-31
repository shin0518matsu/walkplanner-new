import React, { useState, useEffect } from 'react';
import './GoalPanel.css';
import ActivityCalendar from './ActivityCalendar';

function getWeeklyDistance(activities) {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  let total = 0;
  Object.entries(activities).forEach(([date, data]) => {
    if (new Date(date) >= startOfWeek) total += data.distance;
  });
  return total;
}

function getMonthlyDistance(activities) {
  const month = new Date().toISOString().slice(0, 7);
  let total = 0;
  Object.entries(activities).forEach(([date, data]) => {
    if (date.startsWith(month)) total += data.distance;
  });
  return total;
}

export default function GoalPanel({ streak, activities, onClose }) {
  const [weeklyGoal, setWeeklyGoal] = useState(20);
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('walkplanner_weekly_goal');
    if (saved) setWeeklyGoal(Number(saved));
  }, []);

  function saveGoal() {
    const val = Number(inputVal);
    if (val > 0) {
      setWeeklyGoal(val);
      localStorage.setItem('walkplanner_weekly_goal', val);
    }
    setEditing(false);
  }

  const weeklyDist = getWeeklyDistance(activities);
  const monthlyDist = getMonthlyDistance(activities);
  const progress = Math.min(weeklyDist / weeklyGoal * 100, 100);

  const streakMsg = streak === 0 ? '今日から始めよう！💪'
    : streak < 3 ? `${streak}日連続！いい調子です🔥`
    : streak < 7 ? `${streak}日連続！素晴らしい！🌟`
    : streak < 30 ? `${streak}日連続！本物のアスリートです！🏆`
    : `${streak}日連続！驚異的です！🎯`;

  return (
    <div className="goal-overlay">
      <div className="goal-panel">
        <div className="goal-header">
          <div className="goal-title">📊 活動記録</div>
          <button className="goal-close" onClick={onClose}>✕</button>
        </div>
        <div className="goal-content">
          <div className="streak-section">
            <div className="streak-big">
              <span className="streak-fire">🔥</span>
              <span className="streak-num">{streak}</span>
              <span className="streak-label">日連続</span>
            </div>
            <p className="streak-msg">{streakMsg}</p>
          </div>
          <div className="goal-section">
            <div className="goal-section-header">
              <span className="goal-section-title">今週の目標</span>
              <button className="goal-edit-btn" onClick={() => { setEditing(true); setInputVal(weeklyGoal); }}>✏️ 変更</button>
            </div>
            {editing ? (
              <div className="goal-input-row">
                <input type="number" value={inputVal} onChange={e => setInputVal(e.target.value)} className="goal-input" placeholder="km" />
                <button className="goal-save-btn" onClick={saveGoal}>保存</button>
              </div>
            ) : (
              <>
                <div className="goal-progress-bar">
                  <div className="goal-progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <div className="goal-progress-text">
                  {weeklyDist.toFixed(1)}km / {weeklyGoal}km
                  {progress >= 100 && <span className="goal-achieved">🎉 達成！</span>}
                </div>
              </>
            )}
          </div>
          <div className="goal-section">
            <div className="goal-section-title">今月の合計</div>
            <div className="monthly-stat">{monthlyDist.toFixed(1)} km</div>
          </div>
          <div className="goal-section">
            <div className="goal-section-title">活動カレンダー</div>
            <ActivityCalendar activities={activities} />
          </div>
        </div>
      </div>
    </div>
  );
}
