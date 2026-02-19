import React, { useState, useEffect, useCallback } from 'react';
import './WeatherPanel.css';

const DEFAULT_LOCATION = { lat: 40.7128, lon: -74.006, name: 'New York' };

const WEATHER_CODES = {
  0: { icon: '☀️', label: 'Clear sky' },
  1: { icon: '🌤️', label: 'Mainly clear' },
  2: { icon: '⛅', label: 'Partly cloudy' },
  3: { icon: '☁️', label: 'Overcast' },
  45: { icon: '🌫️', label: 'Fog' },
  48: { icon: '🌫️', label: 'Depositing rime fog' },
  51: { icon: '🌦️', label: 'Light drizzle' },
  53: { icon: '🌦️', label: 'Moderate drizzle' },
  55: { icon: '🌧️', label: 'Dense drizzle' },
  61: { icon: '🌦️', label: 'Slight rain' },
  63: { icon: '🌧️', label: 'Moderate rain' },
  65: { icon: '🌧️', label: 'Heavy rain' },
  71: { icon: '🌨️', label: 'Slight snow' },
  73: { icon: '🌨️', label: 'Moderate snow' },
  75: { icon: '❄️', label: 'Heavy snow' },
  77: { icon: '🌨️', label: 'Snow grains' },
  80: { icon: '🌦️', label: 'Slight rain showers' },
  81: { icon: '🌧️', label: 'Moderate rain showers' },
  82: { icon: '🌧️', label: 'Violent rain showers' },
  85: { icon: '🌨️', label: 'Slight snow showers' },
  86: { icon: '❄️', label: 'Heavy snow showers' },
  95: { icon: '⛈️', label: 'Thunderstorm' },
  96: { icon: '⛈️', label: 'Thunderstorm with hail' },
  99: { icon: '⛈️', label: 'Heavy thunderstorm' },
};

const getWeatherInfo = (code) => WEATHER_CODES[code] || { icon: '❓', label: 'Unknown' };

const SAVED_LOCATIONS = [
  { name: 'New York', lat: 40.7128, lon: -74.006 },
  { name: 'Newark, CA', lat: 37.5297, lon: -122.0402 },
  { name: 'London', lat: 51.5074, lon: -0.1278 },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
  { name: 'Paris', lat: 48.8566, lon: 2.3522 },
  { name: 'Sydney', lat: -33.8688, lon: 151.2093 },
  { name: 'Berlin', lat: 52.5200, lon: 13.4050 },
  { name: 'Singapore', lat: 1.3521, lon: 103.8198 },
  { name: 'Dubai', lat: 25.2048, lon: 55.2708 },
  { name: 'Los Angeles', lat: 34.0522, lon: -118.2437 },
  { name: 'Toronto', lat: 43.6532, lon: -79.3832 },
];

export default function WeatherPanel({ isOpen, onClose }) {
  const [location, setLocation] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mc-weather-location');
      return saved ? JSON.parse(saved) : DEFAULT_LOCATION;
    }
    return DEFAULT_LOCATION;
  });
  
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [unit, setUnit] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mc-weather-unit') || 'celsius';
    }
    return 'celsius';
  });

  // Save location to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mc-weather-location', JSON.stringify(location));
    }
  }, [location]);

  // Save unit preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mc-weather-unit', unit);
    }
  }, [unit]);

  const fetchWeather = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch current weather and forecast
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&temperature_unit=${unit}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch weather');
      
      const data = await response.json();
      
      setWeather({
        temp: Math.round(data.current.temperature_2m),
        feelsLike: Math.round(data.current.apparent_temperature),
        humidity: data.current.relative_humidity_2m,
        windSpeed: data.current.wind_speed_10m,
        code: data.current.weather_code,
      });
      
      // Process 5-day forecast
      const dailyForecast = data.daily.time.slice(0, 5).map((time, i) => ({
        date: new Date(time),
        maxTemp: Math.round(data.daily.temperature_2m_max[i]),
        minTemp: Math.round(data.daily.temperature_2m_min[i]),
        code: data.daily.weather_code[i],
      }));
      
      setForecast(dailyForecast);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [location, unit]);

  // Fetch weather on mount and when location/unit changes
  useEffect(() => {
    if (isOpen) {
      fetchWeather();
    }
  }, [isOpen, fetchWeather]);

  // Auto-refresh every 10 minutes
  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isOpen, fetchWeather]);

  const handleLocationSelect = (loc) => {
    setLocation(loc);
    setShowLocationPicker(false);
  };

  const toggleUnit = () => {
    setUnit(prev => prev === 'celsius' ? 'fahrenheit' : 'celsius');
  };

  const formatDay = (date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!isOpen) return null;

  return (
    <div className="weather-panel-overlay" onClick={onClose}>
      <div className="weather-panel" onClick={e => e.stopPropagation()}>
        <div className="weather-panel-header">
          <h3>🌤️ Weather</h3>
          <div className="header-actions">
            <button 
              className="unit-toggle"
              onClick={toggleUnit}
              title="Toggle unit"
            >
              °{unit === 'celsius' ? 'C' : 'F'}
            </button>
            <button 
              className="refresh-btn"
              onClick={fetchWeather}
              disabled={loading}
              title="Refresh"
            >
              {loading ? '⏳' : '🔄'}
            </button>
            <button 
              className="location-btn"
              onClick={() => setShowLocationPicker(true)}
              title="Change location"
            >
              📍
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {showLocationPicker ? (
          <div className="location-picker">
            <h4>Select Location</h4>
            <div className="location-grid">
              {SAVED_LOCATIONS.map((loc) => (
                <button
                  key={loc.name}
                  className={`location-item ${location.name === loc.name ? 'active' : ''}`}
                  onClick={() => handleLocationSelect(loc)}
                >
                  <span className="location-name">{loc.name}</span>
                </button>
              ))}
            </div>
            <button className="back-btn" onClick={() => setShowLocationPicker(false)}>
              ← Back to Weather
            </button>
          </div>
        ) : (
          <>
            {error ? (
              <div className="weather-error">
                <span className="error-icon">⚠️</span>
                <p>{error}</p>
                <button onClick={fetchWeather}>Try Again</button>
              </div>
            ) : (
              <>
                <div className="location-name-display">
                  📍 {location.name}
                  {lastUpdated && (
                    <span className="last-updated">
                      Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>

                {weather && (
                  <div className="current-weather">
                    <div className="weather-main">
                      <span className="weather-icon-large">
                        {getWeatherInfo(weather.code).icon}
                      </span>
                      <div className="weather-temp-section">
                        <span className="temperature">{weather.temp}°</span>
                        <span className="weather-label">
                          {getWeatherInfo(weather.code).label}
                        </span>
                      </div>
                    </div>
                    
                    <div className="weather-details">
                      <div className="detail-item">
                        <span className="detail-icon">🌡️</span>
                        <span className="detail-value">Feels like {weather.feelsLike}°</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">💧</span>
                        <span className="detail-value">{weather.humidity}% humidity</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">💨</span>
                        <span className="detail-value">{weather.windSpeed} km/h wind</span>
                      </div>
                    </div>
                  </div>
                )}

                {forecast.length > 0 && (
                  <div className="forecast-section">
                    <h4>5-Day Forecast</h4>
                    <div className="forecast-list">
                      {forecast.map((day, i) => (
                        <div key={i} className="forecast-item">
                          <div className="forecast-day">
                            <span className="day-name">{formatDay(day.date)}</span>
                            <span className="day-date">{formatDate(day.date)}</span>
                          </div>
                          <span className="forecast-icon">
                            {getWeatherInfo(day.code).icon}
                          </span>
                          <div className="forecast-temps">
                            <span className="temp-high">{day.maxTemp}°</span>
                            <span className="temp-low">{day.minTemp}°</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="weather-footer">
                  <p>Data provided by Open-Meteo</p>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
