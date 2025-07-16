const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3000 });

let players = {};

wss.on('connection', (ws) => {
  const id = Math.random().toString(36).substr(2, 9);
  players[id] = {
  x: 400,
  y: 300,
  username: "Guest",
  chat: "",
  sprite: "",
  room: "town"
  };

  players[id].ws = ws;

  ws.send(JSON.stringify({ type: "init", id }));

  ws.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch {
      return;
    }

    if (data.type === "room") {
    players[id].room = data.room;
    }

    if (data.type === "join") {
    players[id].username = data.username;
    players[id].room = data.room || "town";
    }

    if (data.type === "move") {
      players[id].x = data.x;
      players[id].y = data.y;
    }

    if (data.type === "chat") {
      players[id].chat = data.message;

      // Clear after 5 seconds
      setTimeout(() => {
        if (players[id]) {
          players[id].chat = "";
        }
      }, 5000);
    }
  });

  ws.on('close', () => {
    delete players[id];
  });
});

// Broadcast game state to all clients every 50ms (~20fps)
setInterval(() => {
  const state = JSON.stringify({ type: "state", players });

wss.clients.forEach((client) => {
  for (let pid in players) {
    if (players[pid].ws === client) {
      const room = players[pid].room;
      const roomPlayers = {};
      for (let otherId in players) {
        if (players[otherId].room === room) {
          roomPlayers[otherId] = players[otherId];
        }
      }
      client.send(JSON.stringify({ type: "state", players: roomPlayers }));
    }
  }
});

}, 50);

console.log("Dynamic Penguins server is working on port 3000.");
