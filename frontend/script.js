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

// WebSocket message handling
// Function to generate a random color for each user
function getUserColor(userId) {
  const colors = ['red', 'blue', 'green', 'orange', 'purple', 'yellow', 'pink'];
  const index = Math.abs(userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colors.length;
  return colors[index];
}

// Function to create a custom marker icon
function createCustomIcon(color) {
  return L.icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
}

socket.onmessage = async (event) => {
  try {
    const locations = JSON.parse(event.data);
    console.log('Received locations:', locations);

    locations.forEach(({ id, name, latitude, longitude }) => {
      const userColor = getUserColor(id); // Assign a unique color based on userId
      const customIcon = createCustomIcon(userColor); // Create a colored marker

      if (!markers.has(id)) {
        const marker = L.marker([latitude, longitude], { icon: customIcon }).addTo(map);
        marker.bindPopup(`<b>${name}</b>`).openPopup(); // Show name on the marker
        markers.set(id, marker);
      } else {
        markers.get(id).setLatLng([latitude, longitude]);
      }
    });

    if (locations.length > 0) {
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
    const userName = prompt("Enter your name:") || "Anonymous"; // Prompt for user name
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('Fetched location:', latitude, longitude);
        socket.send(JSON.stringify({ id: userId, name: userName, latitude, longitude, active: true }));
      },
      (error) => console.error('Error fetching location:', error),
      { enableHighAccuracy: true }
    );
    shareBtn.textContent = 'Stop Sharing';
  } else {
    navigator.geolocation.clearWatch(watchId);
    socket.send(JSON.stringify({ id: userId, active: false })); // Notify server to remove user

    if (markers.has(userId)) {
      map.removeLayer(markers.get(userId)); // Remove marker
      markers.delete(userId);
    }
    shareBtn.textContent = 'Start Sharing';
  }
  isSharing = !isSharing;
});



