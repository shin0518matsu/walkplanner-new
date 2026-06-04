import React, { useState, useCallback, useEffect } from 'react';
import MapView from './components/MapView';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AdBanner from './components/AdBanner';
import AICoach from './components/AICoach';
import GoalPanel from './components/GoalPanel';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function getToday() {
  return new Date().toISOString().split('T')[0];
}

export default function App() {
  const [waypoints, setWaypoints] = useState([]);
  const [distance, setDistance] = useState(0);
  const [mode, setMode] = useState('click');
  const [activityMode, setActivityMode] = useState('walking');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [routeAnalysis, setRouteAnalysis] = useState(null);
  const [mapCenter, setMapCenter] = useState([35.663, 138.568]);
  const [status, setStatus] = useState('地図をクリックしてルートを作成してください');
  const [conditions, setConditions] = useState([]);
  const [streak, setStreak] = useState(0);
  const [activities, setActivities] = useState({});
  const [showCoach, setShowCoach] = useState(false);
  const [showGoal, setShowGoal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const center = [pos.coords.latitude, pos.coords.longitude];
          setMapCenter(center);
          if (window.__walkplanner_setCenter) window.__walkplanner_setCenter(center);
        },
        () => {}
      );
    }
  }, []);

  useEffect(() => {
    const savedActivities = JSON.parse(localStorage.getItem('walkplanner_activities') || '{}');
    setActivities(savedActivities);
    const saved = JSON.parse(localStorage.getItem('walkplanner_streak') || '{"count":0,"lastDate":""}');
    const today = getToday();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split('T')[0];
    if (saved.lastDate === today || saved.lastDate === yStr) {
      setStreak(saved.count);
    } else {
      setStreak(0);
    }
  }, []);

  const recordActivity = useCallback((km) => {
    const today = getToday();
    const savedActivities = JSON.parse(localStorage.getItem('walkplanner_activities') || '{}');
    savedActivities[today] = { distance: km, mode: 'walking' };
    localStorage.setItem('walkplanner_activities', JSON.stringify(savedActivities));
    setActivities({ ...savedActivities });
    const saved = JSON.parse(localStorage.getItem('walkplanner_streak') || '{"count":0,"lastDate":""}');
    if (saved.lastDate === today) return;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split('T')[0];
    const newCount = saved.lastDate === yStr ? saved.count + 1 : 1;
    localStorage.setItem('walkplanner_streak', JSON.stringify({ count: newCount, lastDate: today }));
    setStreak(newCount);
  }, []);

  const handleWaypointsChange = useCallback((newWaypoints, newDistance) => {
    setWaypoints(newWaypoints);
    setDistance(newDistance);
    if (newWaypoints.length === 0) {
      setStatus('地図をクリックしてルートを作成してください');
      setRouteAnalysis(null);
    } else if (newWaypoints.length === 1) {
      setStatus('出発地を設定しました。次のポイントを追加してください');
    } else {
      setStatus(`${newDistance.toFixed(2)}km`);
    }
  }, []);

  const handleMapCenterChange = useCallback((center) => {
    setMapCenter(center);
  }, []);

  const fetchSuggestions = useCallback(async () => {
    setLoadingSuggestions(true);
    setSuggestions([]);
    try {
      const res = await fetch(`${API_URL}/api/suggest-courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: mapCenter[0], lng: mapCenter[1], conditions, activityMode }),
      });
      const data = await res.json();
      if (data.courses) setSuggestions(data.courses);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [mapCenter, conditions, activityMode]);
const handleSuggestionSelect = useCallback(async (course) => {
  if (!course.highlights || course.highlights.length === 0) return;
  const geocoded = [];
  for (const h of course.highlights) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(h + ' ' + (mapCenter[0].toFixed(2) + ',' + mapCenter[1].toFixed(2)))}&format=json&limit=1&accept-language=ja`);
      const data = await res.json();
      if (data[0]) geocoded.push([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
    } catch (e) {}
  }
  if (geocoded.length > 0 && window.__walkplanner_addPoints) {
    window.__walkplanner_addPoints(geocoded);
  }
}, [mapCenter]);
  const fetchRouteAnalysis = useCallback(async () => {
    if (distance < 0.1) return;
    try {
      const res = await fetch(`${API_URL}/api/analyze-route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ distance: distance.toFixed(2), points: waypoints.length, activityMode }),
      });
      const data = await res.json();
      setRouteAnalysis(data);
      if (distance > 0.5) recordActivity(distance);
    } catch (e) {
      console.error(e);
    }
  }, [distance, waypoints.length, activityMode, recordActivity]);

  const speed = activityMode === 'running' ? 10 : 4;
  const calPerKm = activityMode === 'running' ? 80 : 60;

  return (
    <div className="app">
      <Header
        streak={streak}
        activityMode={activityMode}
        setActivityMode={setActivityMode}
        onCoachOpen={() => setShowCoach(true)}
        onGoalOpen={() => setShowGoal(true)}
      />
      <AdBanner slot="top" />
      <div className="main-layout">
        <Sidebar
          mode={mode}
          setMode={setMode}
          waypoints={waypoints}
          distance={distance}
          speed={speed}
          calPerKm={calPerKm}
          suggestions={suggestions}
          loadingSuggestions={loadingSuggestions}
          routeAnalysis={routeAnalysis}
          conditions={conditions}
          setConditions={setConditions}
          activityMode={activityMode}
          onFetchSuggestions={fetchSuggestions}
onSuggestionSelect={handleSuggestionSelect}
          onFetchAnalysis={fetchRouteAnalysis}
          onClear={() => handleWaypointsChange([], 0)}
          apiUrl={API_URL}
        />
        <div className="map-container">
          <MapView
            mode={mode}
            onWaypointsChange={handleWaypointsChange}
            onMapCenterChange={handleMapCenterChange}
          />
          <div className="status-bar">
            <span className="status-dot" />
            <span>{status}</span>
          </div>
        </div>
      </div>
      <AdBanner slot="bottom" />
      {showCoach && (
        <AICoach
          apiUrl={API_URL}
          activityMode={activityMode}
          streak={streak}
          distance={distance}
          activities={activities}
          onClose={() => setShowCoach(false)}
        />
      )}
      {showGoal && (
        <GoalPanel
          streak={streak}
          activities={activities}
          onClose={() => setShowGoal(false)}
        />
      )}
    </div>
  );
}
