const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.static('../frontend'));

let clients = new Map(); // Store user locations

wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.id) {
        if (data.active === false) {
          clients.delete(data.id); // Remove user from server's list
        } else if (data.latitude && data.longitude && data.name) {
          clients.set(data.id, { id: data.id, name: data.name, latitude: data.latitude, longitude: data.longitude });
        }
  
        // Broadcast updated list of locations
        const locations = Array.from(clients.values());
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(locations));
          }
        });
      }
    } catch (err) {
      console.error('Error parsing message:', err);
    }
  });
  
  


  ws.on('close', () => {
    console.log('Client disconnected');

    // Find and remove the disconnected client
    for (let [key, value] of clients.entries()) {
      if (ws === key) {
        clients.delete(key);
        break;
      }
    }

    // Notify all clients of updated list
    const locations = Array.from(clients.entries()).map(([id, info]) => ({
      id,
      latitude: info.latitude,
      longitude: info.longitude,
      name: info.name,
    }));

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(locations));
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
