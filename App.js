import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Wind, Droplets, Thermometer, Eye, Gauge, Search, LocateFixed, Monitor, Moon, SunDim } from 'lucide-react';

const WeatherApp = () => {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tempUnit, setTempUnit] = useState('C');
  // Add theme state with localStorage persistence
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('weatherTheme');
    return savedTheme || 'light';
  });

  const API_KEY = 'cbe289c7861d4dc9197c15bc4eea2455';
  const BASE_URL = 'https://api.openweathermap.org/data/2.5';

  // Toggle theme function
  const toggleTheme = () => {
    setTheme(prev => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('weatherTheme', newTheme);
      return newTheme;
    });
  };

  // Apply theme class to body on mount and theme change
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Convert temperature based on selected unit
  const convertTemp = (temp) => {
    if (tempUnit === 'F') {
      return Math.round((temp * 9) / 5 + 32);
    }
    return Math.round(temp);
  };

  // Helper function to fetch weather data
  const fetchWeatherData = async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Weather data not found');
    return response.json();
  };

  // Process current weather data
  const processCurrentWeather = (data) => ({
    location: `${data.name}, ${data.sys.country}`,
    temperature: data.main.temp,
    condition: data.weather[0].main,
    humidity: data.main.humidity,
    windSpeed: Math.round(data.wind.speed * 3.6),
    pressure: data.main.pressure,
    visibility: data.visibility ? Math.round(data.visibility / 1000) : 10,
    feelsLike: data.main.feels_like,
    iconCode: data.weather[0].icon,
    coordinates: {
      lat: data.coord.lat,
      lon: data.coord.lon
    }
  });

  // Fetch current weather
  const fetchCurrentWeather = async (city) => {
    const data = await fetchWeatherData(
      `${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric`
    );
    return processCurrentWeather(data);
  };

  // Fetch weather by coordinates
  const fetchWeatherByCoords = async (lat, lon) => {
    const data = await fetchWeatherData(
      `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );
    return processCurrentWeather(data);
  };

  // Fetch 5-day forecast
  const fetchForecast = async (lat, lon) => {
    const data = await fetchWeatherData(
      `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );
    
    // Process forecast data to get daily forecasts
    const dailyForecasts = [];
    const today = new Date().toDateString();
    
    for (let i = 0; i < data.list.length; i += 8) {
      if (dailyForecasts.length >= 5) break;
      
      const item = data.list[i];
      const date = new Date(item.dt * 1000);
      
      dailyForecasts.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        high: item.main.temp_max,
        low: item.main.temp_min,
        condition: item.weather[0].main,
        icon: item.weather[0].icon
      });
    }
    
    return dailyForecasts;
  };

  // Get weather icon
  const getWeatherIcon = (condition, iconCode, size = 'md') => {
    const sizes = {
      sm: 'w-6 h-6',
      md: 'w-10 h-10',
      lg: 'w-20 h-20',
      xl: 'w-24 h-24'
    };
    
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    
    return (
      <div className="relative">
        <img 
          src={iconUrl} 
          alt={condition} 
          className={`${sizes[size]} drop-shadow-md`} 
        />
        {condition === 'Rain' && (
          <div className="absolute inset-0 bg-blue-400/20 rounded-full animate-pulse"></div>
        )}
      </div>
    );
  };

  // Handle search
  const handleSearch = async () => {
    if (!location.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const weatherData = await fetchCurrentWeather(location);
      const forecastData = await fetchForecast(
        weatherData.coordinates.lat, 
        weatherData.coordinates.lon
      );
      
      setWeather(weatherData);
      setForecast(forecastData);
    } catch (err) {
      setError(err.message || 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    setLoading(true);
    setError('');

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const weatherData = await fetchWeatherByCoords(latitude, longitude);
            const forecastData = await fetchForecast(latitude, longitude);
            setWeather(weatherData);
            setForecast(forecastData);
            
          } catch (err) {
            setError(err.message || 'Failed to get location weather');
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          setError('Location access denied. Please enable permissions or search by city name.');
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation not supported by your browser');
      setLoading(false);
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Dynamic background based on time and theme
  const getBackgroundClass = () => {
    if (theme === 'dark') {
      return 'from-gray-900 via-blue-900 to-indigo-900';
    }
    
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 18) {
      return 'from-sky-300 via-blue-400 to-cyan-300';
    }
    return 'from-indigo-800 via-blue-800 to-slate-800';
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getBackgroundClass()} p-4 transition-colors duration-1000`}>
      <div className="max-w-4xl mx-auto">
        {/* Header with theme toggle */}
        <div className="text-center mb-8 pt-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Cloud className="w-10 h-10 text-white/90 dark:text-white/90" />
            <h1 className="text-4xl font-bold text-white drop-shadow-md">Weather Forecast</h1>
            
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="ml-4 p-2 rounded-full bg-white/20 dark:bg-gray-700 hover:bg-white/30 dark:hover:bg-gray-600 transition-colors"
              aria-label="Toggle dark mode"
            >
              {theme === 'light' ? (
                <Moon className="w-6 h-6 text-white" />
              ) : (
                <SunDim className="w-6 h-6 text-yellow-300" />
              )}
            </button>
          </div>
          <p className="text-blue-100/90 dark:text-blue-200/80">Real-time weather & forecasts</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="flex gap-2 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-600 dark:text-blue-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter city name..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border-0 focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-500 outline-none shadow-lg text-gray-900"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-5 py-3 bg-white text-blue-600 rounded-xl font-medium hover:bg-blue-50 disabled:opacity-50 transition-all shadow-lg flex items-center dark:bg-gray-700 dark:text-blue-300 dark:hover:bg-gray-600"
            >
              <Search className="w-5 h-5 mr-1" /> 
              {loading ? 'Searching...' : 'Search'}
            </button>
            <button
              onClick={getCurrentLocation}
              disabled={loading}
              className="px-4 py-3 bg-blue-700 text-white rounded-xl hover:bg-blue-800 disabled:opacity-50 transition-all shadow-lg flex items-center dark:bg-blue-800 dark:hover:bg-blue-900"
              title="Use current location"
            >
              <LocateFixed className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100/90 border border-red-300 text-red-700 px-4 py-3 rounded-xl mb-6 max-w-xl mx-auto text-center shadow-lg dark:bg-red-900/30 dark:border-red-700 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center text-white mb-6 py-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            <p className="mt-4 text-lg">Loading weather data...</p>
          </div>
        )}

        {/* Current Weather */}
        {weather && (
          <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-6 mb-6 text-white shadow-xl border border-white/10 dark:bg-gray-800/60 dark:border-gray-700/50">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="text-center md:text-left mb-6 md:mb-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold mb-2">{weather.location}</h2>
                  <button 
                    onClick={() => setTempUnit(tempUnit === 'C' ? 'F' : 'C')}
                    className="text-sm bg-white/20 px-2 py-1 rounded-lg hover:bg-white/30 transition-colors dark:bg-gray-700/70 dark:hover:bg-gray-600/80"
                  >
                    °{tempUnit}
                  </button>
                </div>
                
                <div className="flex items-center justify-center md:justify-start gap-4 mt-4">
                  <div className="relative">
                    {getWeatherIcon(weather.condition, weather.iconCode, 'xl')}
                  </div>
                  <div>
                    <p className="text-6xl font-bold drop-shadow-md">
                      {convertTemp(weather.temperature)}°
                    </p>
                    <p className="text-xl opacity-90 mt-1">{weather.condition}</p>
                    <p className="text-md opacity-80 mt-1">
                      Feels like {convertTemp(weather.feelsLike)}°
                    </p>
                  </div>
                </div>
              </div>

              {/* Weather Details */}
              <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                <div className="bg-white/10 rounded-xl p-3 flex items-center gap-3 dark:bg-gray-700/50">
                  <Droplets className="w-6 h-6 text-blue-200" />
                  <div>
                    <p className="text-xs opacity-80">Humidity</p>
                    <p className="font-medium">{weather.humidity}%</p>
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-3 flex items-center gap-3 dark:bg-gray-700/50">
                  <Wind className="w-6 h-6 text-blue-200" />
                  <div>
                    <p className="text-xs opacity-80">Wind</p>
                    <p className="font-medium">{weather.windSpeed} km/h</p>
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-3 flex items-center gap-3 dark:bg-gray-700/50">
                  <Gauge className="w-6 h-6 text-blue-200" />
                  <div>
                    <p className="text-xs opacity-80">Pressure</p>
                    <p className="font-medium">{weather.pressure} hPa</p>
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-3 flex items-center gap-3 dark:bg-gray-700/50">
                  <Eye className="w-6 h-6 text-blue-200" />
                  <div>
                    <p className="text-xs opacity-80">Visibility</p>
                    <p className="font-medium">{weather.visibility} km</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5-Day Forecast */}
        {forecast.length > 0 && (
          <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/10 dark:bg-gray-800/60 dark:border-gray-700/50">
            <h3 className="text-xl font-bold text-white mb-4">5-Day Forecast</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {forecast.map((day, index) => (
                <div 
                  key={index} 
                  className="bg-white/10 rounded-xl p-4 text-center text-white transition-transform hover:scale-[1.03] dark:bg-gray-700/50"
                >
                  <p className="font-medium">{day.day}</p>
                  <p className="text-sm opacity-80 mb-2">{day.date}</p>
                  <div className="flex justify-center my-3">
                    {getWeatherIcon(day.condition, day.icon, 'lg')}
                  </div>
                  <p className="text-sm opacity-90 mb-3">{day.condition}</p>
                  <div className="flex justify-center gap-4">
                    <div>
                      <p className="text-xs opacity-80">High</p>
                      <p className="font-bold">{convertTemp(day.high)}°</p>
                    </div>
                    <div>
                      <p className="text-xs opacity-80">Low</p>
                      <p className="opacity-90">{convertTemp(day.low)}°</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default WeatherApp;