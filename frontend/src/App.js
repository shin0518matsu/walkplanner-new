import React, { useState, useCallback, useEffect } from 'react';
import MapView from './components/MapView';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AdBanner from './components/AdBanner';
import AICoach from './components/AICoach';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function getToday() {
  return new Date().toISOString().split('T')[0];
}

export default function App() {
  const [waypoints, setWaypoints] = useState([]);
  const [distance, setDistance] = useState(0);
  const [roadDistance, setRoadDistance] = useState(null);
  const [mode, setMode] = useState('click');
  const [activityMode, setActivityMode] = useState('walking'); // 'walking' | 'running'
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [routeAnalysis, setRouteAnalysis] = useState(null);
  const [mapCenter, setMapCenter] = useState([35.663, 138.568]);
  const [status, setStatus] = useState('地図をクリックしてルートを作成してください');
  const [conditions, setConditions] = useState([]);
  const [streak, setStreak] = useState(0);
  const [showCoach, setShowCoach] = useState(false);

  // ストリーク読み込み
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('walkplanner_streak') || '{"count":0,"lastDate":""}');
    const today = getToday();
    if (saved.lastDate === today) {
      setStreak(saved.count);
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().split('T')[0];
      if (saved.lastDate === yStr) {
        setStreak(saved.count);
      } else if (saved.lastDate !== today) {
        setStreak(0);
      }
    }
  }, []);

  const recordActivity = useCallback(() => {
    const today = getToday();
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
    setRoadDistance(null);
    if (newWaypoints.length === 0) {
      setStatus('地図をクリックしてルートを作成してください');
      setRouteAnalysis(null);
    } else if (newWaypoints.length === 1) {
      setStatus('出発地を設定しました。次のポイントを追加してください');
    } else {
      setStatus(`${newDistance.toFixed(2)}km のルートが設定されています`);
    }
  }, []);

  const handleMapCenterChange = useCallback((center) => {
    setMapCenter(center);
  }, []);

  const fetchRoadDistance = useCallback(async () => {
    if (waypoints.length < 2) return;
    try {
      const coords = waypoints.map(w => `${w.lng},${w.lat}`).join('|');
      const url = `https://router.project-osrm.org/route/v1/foot/${coords}?overview=false`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.routes && data.routes[0]) {
        const meters = data.routes[0].distance;
        setRoadDistance(meters / 1000);
        setStatus(`道路距離: ${(meters / 1000).toFixed(2)}km`);
        recordActivity();
      }
    } catch (e) {
      console.error(e);
    }
  }, [waypoints, recordActivity]);

  const fetchSuggestions = useCallback(async () => {
    setLoadingSuggestions(true);
    setSuggestions([]);
    try {
      const res = await fetch(`${API_URL}/api/suggest-courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: mapCenter[0],
          lng: mapCenter[1],
          conditions,
          activityMode,
        }),
      });
      const data = await res.json();
      if (data.courses) setSuggestions(data.courses);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [mapCenter, conditions, activityMode]);

  const fetchRouteAnalysis = useCallback(async () => {
    if (distance < 0.1) return;
    try {
      const res = await fetch(`${API_URL}/api/analyze-route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          distance: (roadDistance || distance).toFixed(2),
          points: waypoints.length,
          activityMode,
        }),
      });
      const data = await res.json();
      setRouteAnalysis(data);
    } catch (e) {
      console.error(e);
    }
  }, [distance, roadDistance, waypoints.length, activityMode]);

  const speed = activityMode === 'running' ? 10 : 4;
  const calPerKm = activityMode === 'running' ? 80 : 60;
  const displayDist = roadDistance || distance;

  return (
    <div className="app">
      <Header
        streak={streak}
        activityMode={activityMode}
        setActivityMode={setActivityMode}
        onCoachOpen={() => setShowCoach(true)}
      />
      <AdBanner slot="top" />
      <div className="main-layout">
        <Sidebar
          mode={mode}
          setMode={setMode}
          waypoints={waypoints}
          distance={displayDist}
          roadDistance={roadDistance}
          speed={speed}
          calPerKm={calPerKm}
          suggestions={suggestions}
          loadingSuggestions={loadingSuggestions}
          routeAnalysis={routeAnalysis}
          conditions={conditions}
          setConditions={setConditions}
          activityMode={activityMode}
          onFetchSuggestions={fetchSuggestions}
          onFetchAnalysis={fetchRouteAnalysis}
          onFetchRoadDistance={fetchRoadDistance}
          onClear={() => { handleWaypointsChange([], 0); setRoadDistance(null); }}
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
          distance={displayDist}
          onClose={() => setShowCoach(false)}
        />
      )}
    </div>
  );
}
