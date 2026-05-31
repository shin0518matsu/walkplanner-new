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

  function saveGoal()
