const map = L.map('map').setView([0, 0], 2); // Default view

// Use Mapbox Tiles instead of OpenStreetMap
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYXJ5YW4wODkyMCIsImEiOiJjbTg1anByMjMwcnZyMmxxdHRmN3lnN3puIn0.u8w2raCKTu1b6bLeL79hEA', {
  attribution: '© Mapbox',
  id: 'mapbox/streets-v11',
  tileSize: 512,
  zoomOffset: -1,
}).addTo(map);

const socket = new WebSocket('https://locationwebapp.onrender.com/');

socket.onopen = () => console.log('WebSocket connected');

let markers = new Map(); // Store markers for each user
const userId = Math.random().toString(36).substring(2, 10); // Unique ID for each user
let username = null; // Store the user's name

socket.onmessage = async (event) => {
  try {
      const locations = JSON.parse(event.data); // Receive all users' locations
      console.log('Received locations:', locations);

      locations.forEach(({ name, latitude, longitude }) => {
          const key = latitude + longitude;
          
          if (!markers.has(key)) {
              // Create a new marker if it doesn't exist
              const marker = L.marker([latitude, longitude]).addTo(map)
                  .bindPopup(`<b>${name}</b>`).openPopup();
              markers.set(key, marker);
          } else {
              // Update marker position
              markers.get(key).setLatLng([latitude, longitude]).bindPopup(`<b>${name}</b>`);
          }
      });

      if (locations.length > 0) {
          // Center map to the last received location
          map.setView([locations[locations.length - 1].latitude, locations[locations.length - 1].longitude], 13);
      }
  } catch (error) {
      console.error('Error processing WebSocket message:', error);
  }
};


socket.onerror = (error) => console.error('WebSocket error:', error);
socket.onclose = () => console.log('WebSocket connection closed');

const shareBtn = document.getElementById('share-btn');
let isSharing = false;
let watchId = null;

shareBtn.addEventListener('click', () => {
  if (!isSharing) {
    if (!username) {
      username = prompt("Enter your name:") || "Anonymous"; // Ask for name only once
    }

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('Fetched location:', latitude, longitude);
        socket.send(JSON.stringify({ id: userId, name: username, latitude, longitude }));
      },
      (error) => console.error('Error fetching location:', error),
      { enableHighAccuracy: true }
    );
    shareBtn.textContent = 'Stop Sharing';
  } else {
    navigator.geolocation.clearWatch(watchId);
    shareBtn.textContent = 'Start Sharing';
  }
  isSharing = !isSharing;
});
