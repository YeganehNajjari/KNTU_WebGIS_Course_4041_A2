// Made by Yegane Najari
// WebGIS Assignment 2

// ========== CONFIGURATION ==========
// Replace these with your actual API keys for local testing
const GEOCODING_API_KEY = 'YOUR_MAPQUEST_API_KEY'; // <-- Replace locally
const WEATHER_API_KEY = 'YOUR_OPENWEATHERMAP_API_KEY'; // <-- Replace locally

// ========== MAP INITIALIZATION ==========
const map = new ol.Map({
  target: 'map',
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM(),
    }),
  ],
  view: new ol.View({
    center: ol.proj.fromLonLat([51.389, 35.6892]), // Tehran as default
    zoom: 5,
  }),
});

// ========== SEARCH & GEOCODING ==========
const searchBtn = document.getElementById('search-btn');
const searchInput = document.getElementById('search-input');

searchBtn.addEventListener('click', async () => {
  const query = searchInput.value.trim();
  if (!query) return alert('Please enter a location.');
  await geocodeAndZoom(query);
});

searchInput.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter') {
    searchBtn.click();
  }
});

async function geocodeAndZoom(query) {
  const url = `https://www.mapquestapi.com/geocoding/v1/address?key=${GEOCODING_API_KEY}&location=${encodeURIComponent(query)}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Geocoding failed.');
    const data = await response.json();
    const loc = data.results[0]?.locations[0]?.latLng;
    if (!loc) throw new Error('Location not found.');
    const coords = ol.proj.fromLonLat([loc.lng, loc.lat]);
    map.getView().animate({ center: coords, zoom: 12, duration: 1200 });
    addMarker([loc.lng, loc.lat]);
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

// ========== MARKER LAYER ==========
let markerLayer = null;
function addMarker(lonlat) {
  if (markerLayer) map.removeLayer(markerLayer);
  markerLayer = new ol.layer.Vector({
    source: new ol.source.Vector({
      features: [
        new ol.Feature({
          geometry: new ol.geom.Point(ol.proj.fromLonLat(lonlat)),
        }),
      ],
    }),
    style: new ol.style.Style({
      image: new ol.style.Icon({
        src: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
        scale: 0.07,
      }),
    }),
  });
  map.addLayer(markerLayer);
}

// ========== WEATHER DATA ON MAP CLICK ==========
map.on('singleclick', async function (evt) {
  const coord = ol.proj.toLonLat(evt.coordinate);
  await fetchAndShowWeather(coord[1], coord[0]);
});

async function fetchAndShowWeather(lat, lon) {
  const weatherDiv = document.getElementById('weather-info');
  weatherDiv.classList.remove('hidden');
  weatherDiv.innerHTML = 'Loading weather...';
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Weather fetch failed.');
    const data = await response.json();
    weatherDiv.innerHTML = `
      <strong>Weather at [${lat.toFixed(4)}, ${lon.toFixed(4)}]</strong><br>
      <b>${data.name || 'Unknown location'}</b><br>
      <span>${data.weather[0].main} (${data.weather[0].description})</span><br>
      <span>Temperature: ${data.main.temp} °C</span><br>
      <span>Humidity: ${data.main.humidity}%</span><br>
      <span>Wind: ${data.wind.speed} m/s</span>
    `;
  } catch (err) {
    weatherDiv.innerHTML = 'Error: ' + err.message;
  }
}
