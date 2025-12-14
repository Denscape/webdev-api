const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_API = 'https://geocoding-api.open-meteo.com/v1/search';

const POPULAR_CITIES = [
    { name: 'London', lat: 51.5074, lon: -0.1278, country: 'UK' },
    { name: 'New York', lat: 40.7128, lon: -74.0060, country: 'USA' },
    { name: 'Tokyo', lat: 35.6762, lon: 139.6503, country: 'Japan' },
    { name: 'Paris', lat: 48.8566, lon: 2.3522, country: 'France' },
    { name: 'Sydney', lat: -33.8688, lon: 151.2093, country: 'Australia' },
    { name: 'Dubai', lat: 25.2048, lon: 55.2708, country: 'UAE' },
    { name: 'Singapore', lat: 1.3521, lon: 103.8198, country: 'Singapore' },
    { name: 'Los Angeles', lat: 34.0522, lon: -118.2437, country: 'USA' },
    { name: 'Hong Kong', lat: 22.3193, lon: 114.1694, country: 'China' },
    { name: 'Manila', lat: 14.5995, lon: 120.9842, country: 'Philippines' }
];

let currentCity = '';
let forecastData = [];

document.addEventListener('DOMContentLoaded', () => {
    console.log('App loaded!');
    setupEventListeners();
    loadPopularCities();
});

function setupEventListeners() {
    document.getElementById('citySearch').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchWeather();
    });
}

async function fetchWeather(lat, lon) {
    try {
        showLoading();
        const url = `${WEATHER_API}?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;
        console.log('Fetching weather...');

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('Weather data received');
        hideLoading();
        return data;
    } catch (error) {
        hideLoading();
        showError(`Failed to load weather: ${error.message}`);
        console.error('Weather API Error:', error);
        return null;
    }
}

async function searchCity(cityName) {
    try {
        const url = `${GEOCODING_API}?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        if (data.results && data.results.length > 0) {
            return data.results[0];
        }
        return null;
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
}

async function searchWeather() {
    const cityInput = document.getElementById('citySearch').value.trim();
    if (!cityInput) {
        showError('Please enter a city name');
        return;
    }

    hideError();

    const cityData = await searchCity(cityInput);
    if (!cityData) {
        showError('City not found. Try another name.');
        return;
    }

    currentCity = cityData;
    const weather = await fetchWeather(cityData.latitude, cityData.longitude);

    if (weather) {
        displayCurrentWeather(weather, cityData);
        loadForecast(cityData.latitude, cityData.longitude);
    }
}

function getWeatherDescription(code) {
    const weather = {
        0: { desc: 'Clear sky', icon: '☀️' },
        1: { desc: 'Mainly clear', icon: '🌤️' },
        2: { desc: 'Partly cloudy', icon: '⛅' },
        3: { desc: 'Overcast', icon: '☁️' },
        45: { desc: 'Foggy', icon: '🌫️' },
        48: { desc: 'Foggy', icon: '🌫️' },
        51: { desc: 'Light drizzle', icon: '🌦️' },
        53: { desc: 'Drizzle', icon: '🌦️' },
        55: { desc: 'Heavy drizzle', icon: '🌧️' },
        61: { desc: 'Light rain', icon: '🌧️' },
        63: { desc: 'Rain', icon: '🌧️' },
        65: { desc: 'Heavy rain', icon: '⛈️' },
        71: { desc: 'Light snow', icon: '🌨️' },
        73: { desc: 'Snow', icon: '❄️' },
        75: { desc: 'Heavy snow', icon: '❄️' },
        80: { desc: 'Rain showers', icon: '🌦️' },
        95: { desc: 'Thunderstorm', icon: '⛈️' }
    };
    return weather[code] || { desc: 'Unknown', icon: '🌡️' };
}

function displayCurrentWeather(data, cityData) {
    const container = document.getElementById('currentWeatherContainer');
    const current = data.current_weather;
    const weatherInfo = getWeatherDescription(current.weathercode);

    container.innerHTML = `
        <div class="card weather-card">
            <div class="card-body text-center">
                <h2 class="city-name">${cityData.name}, ${cityData.country}</h2>
                <div class="weather-icon">${weatherInfo.icon}</div>
                <div class="temperature">${Math.round(current.temperature)}°C</div>
                <p class="lead">${weatherInfo.desc}</p>
                
                <div class="row mt-4">
                    <div class="col-md-12">
                        <div class="weather-detail">
                            <i class="bi bi-wind"></i>
                            <span>Wind: ${current.windspeed} km/h</span>
                        </div>
                    </div>
                    <div class="col-md-12">
                        <div class="weather-detail">
                            <i class="bi bi-compass"></i>
                            <span>Direction: ${current.winddirection}°</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function loadForecast(lat, lon) {
    const data = await fetchWeather(lat, lon);

    if (data && data.daily) {
        forecastData = data.daily;
        displayForecast();
    }
}

function displayForecast() {
    const container = document.getElementById('forecastContainer');

    if (!forecastData || !forecastData.time) {
        container.innerHTML = '<div class="col-12"><p class="text-center text-muted">Search for a city to see the forecast</p></div>';
        return;
    }

    container.innerHTML = forecastData.time.slice(0, 7).map((day, index) => {
        const date = new Date(day);
        const weatherInfo = getWeatherDescription(forecastData.weathercode[index]);

        return `
            <div class="col-md-4 col-lg-2">
                <div class="card weather-card">
                    <div class="card-body text-center">
                        <h6>${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</h6>
                        <div style="font-size: 3rem;">${weatherInfo.icon}</div>
                        <div class="h4 text-primary">${Math.round(forecastData.temperature_2m_max[index])}°C</div>
                        <small>${weatherInfo.desc}</small>
                        <div class="mt-2">
                            <small class="text-muted">
                                Low: ${Math.round(forecastData.temperature_2m_min[index])}°C
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function loadPopularCities() {
    const container = document.getElementById('citiesContainer');
    container.innerHTML = '<div class="col-12"><p class="text-center">Loading popular cities...</p></div>';

    const citiesData = [];

    for (const city of POPULAR_CITIES) {
        const data = await fetchWeather(city.lat, city.lon);
        if (data) {
            citiesData.push({ ...city, weather: data });
        }
    }

    displayCities(citiesData);
}

function displayCities(cities) {
    const container = document.getElementById('citiesContainer');

    if (cities.length === 0) {
        container.innerHTML = '<div class="col-12"><p class="text-center text-muted">No city data available</p></div>';
        return;
    }

    container.innerHTML = cities.map(city => {
        const current = city.weather.current_weather;
        const weatherInfo = getWeatherDescription(current.weathercode);

        return `
            <div class="col-md-6 col-lg-4">
                <div class="card weather-card" onclick="quickSearch('${city.name}')">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h5 class="mb-0">${city.name}</h5>
                                <small class="text-muted">${city.country}</small>
                            </div>
                            <div style="font-size: 3rem;">${weatherInfo.icon}</div>
                        </div>
                        <div class="mt-2">
                            <h3 class="text-primary mb-0">${Math.round(current.temperature)}°C</h3>
                            <small>${weatherInfo.desc}</small>
                        </div>
                        <div class="mt-2">
                            <small class="text-muted">
                                <i class="bi bi-wind"></i> ${current.windspeed} km/h
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function showLoading() {
    document.getElementById('loadingSpinner').classList.remove('d-none');
}

function hideLoading() {
    document.getElementById('loadingSpinner').classList.add('d-none');
}

function showError(message) {
    const alert = document.getElementById('errorAlert');
    document.getElementById('errorMessage').textContent = message;
    alert.classList.remove('d-none');
}

function hideError() {
    document.getElementById('errorAlert').classList.add('d-none');
}