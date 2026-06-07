import { createServer } from 'http';
import { WebSocketServer } from 'ws';

const PORT = process.env.PORT || 3001;
const wss = new WebSocketServer({ port: PORT });

// 房间表: roomId → Set<WebSocket>
const rooms = new Map();

function getRoom(roomId) {
  if (!rooms.has(roomId)) rooms.set(roomId, new Set());
  return rooms.get(roomId);
}

function broadcast(roomId, sender, msg) {
  const room = getRoom(roomId);
  for (const ws of room) {
    if (ws !== sender && ws.readyState === 1) {
      ws.send(JSON.stringify(msg));
    }
  }
}

wss.on('connection', (ws) => {
  let currentRoom = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {
      case 'join': {
        currentRoom = msg.room;
        const room = getRoom(currentRoom);
        room.add(ws);
        // 通知房间内其他用户
        broadcast(currentRoom, ws, { type: 'peer-joined' });
        break;
      }
      case 'offer':
      case 'answer':
      case 'ice-candidate': {
        if (currentRoom) broadcast(currentRoom, ws, msg);
        break;
      }
    }
  });

  ws.on('close', () => {
    if (currentRoom) {
      const room = getRoom(currentRoom);
      room.delete(ws);
      if (room.size === 0) rooms.delete(currentRoom);
      else broadcast(currentRoom, null, { type: 'peer-left' });
    }
  });
});

console.log(`Signaling server running on port ${PORT}`);
