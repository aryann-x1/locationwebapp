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
      if (data.id && data.latitude && data.longitude) {
        clients.set(data.id, { latitude: data.latitude, longitude: data.longitude });

        // Broadcast all locations to all clients
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
    clients.forEach((value, key) => {
      if (ws === key) clients.delete(key);
    });

    // Notify all clients of updated list
    const locations = Array.from(clients.values());
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
