import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

app.use(cors());
app.use(express.json());

// In-Memory Authoritative State for Real-Time Operations
export interface RealtimeChatMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'provider' | 'system';
  senderAvatar?: string;
  senderPhone?: string;
  type: 'text' | 'offer' | 'counter' | 'acceptance' | 'agreement_confirmed';
  text: string;
  price?: string;
  createdAt: string;
}

export interface RealtimeTrackingState {
  ticketId: string;
  providerLat: number;
  providerLng: number;
  userLat: number;
  userLng: number;
  speedKmh: number;
  etaMinutes: number;
  status: 'EN_ROUTE' | 'NEARBY' | 'ARRIVED' | 'IN_SERVICE' | 'COMPLETED';
  updatedAt: string;
  lastUpdatedBy: string;
}

// Store messages by ticketId / roomId
const chatStore = new Map<string, RealtimeChatMessage[]>();

// Store tracking by ticketId
const trackingStore = new Map<string, RealtimeTrackingState>();

// WebSocket Server attached to the same HTTP server on path /api/realtime
const wss = new WebSocketServer({ server, path: '/api/realtime' });

// Track client rooms: Set of WebSockets per roomId
const roomSubscribers = new Map<string, Set<WebSocket>>();
const clientRooms = new Map<WebSocket, Set<string>>();

function broadcastToRoom(roomId: string, data: any, senderWs?: WebSocket) {
  const subscribers = roomSubscribers.get(roomId);
  if (!subscribers) return;

  const payload = JSON.stringify(data);
  for (const client of subscribers) {
    if (client.readyState === WebSocket.OPEN && client !== senderWs) {
      try {
        client.send(payload);
      } catch (err) {
        console.error('WebSocket send error:', err);
      }
    }
  }
}

function broadcastToAllInRoom(roomId: string, data: any) {
  const subscribers = roomSubscribers.get(roomId);
  if (!subscribers) return;

  const payload = JSON.stringify(data);
  for (const client of subscribers) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(payload);
      } catch (err) {
        console.error('WebSocket broadcast error:', err);
      }
    }
  }
}

wss.on('connection', (ws: WebSocket) => {
  clientRooms.set(ws, new Set());

  ws.on('message', (messageRaw: string) => {
    try {
      const data = JSON.parse(messageRaw.toString());

      // 1. Join Room
      if (data.type === 'join') {
        const roomId = data.roomId;
        if (!roomId) return;

        if (!roomSubscribers.has(roomId)) {
          roomSubscribers.set(roomId, new Set());
        }
        roomSubscribers.get(roomId)!.add(ws);
        clientRooms.get(ws)!.add(roomId);

        // If this is a chat room (e.g. chat:123), send message history immediately
        if (roomId.startsWith('chat:')) {
          const ticketId = roomId.replace('chat:', '');
          const history = chatStore.get(ticketId) || [];
          ws.send(JSON.stringify({
            type: 'chat_history',
            ticketId,
            messages: history
          }));
        }

        // If this is a tracking room (e.g. tracking:123), send latest live coordinates
        if (roomId.startsWith('tracking:')) {
          const ticketId = roomId.replace('tracking:', '');
          const tracking = trackingStore.get(ticketId);
          if (tracking) {
            ws.send(JSON.stringify({
              type: 'tracking_state',
              ticketId,
              tracking
            }));
          }
        }

        // Notify room of presence update
        broadcastToRoom(roomId, {
          type: 'presence',
          roomId,
          activeCount: roomSubscribers.get(roomId)!.size,
          user: data.user
        });
      }

      // 2. Real Chat Message
      if (data.type === 'chat_message') {
        const { ticketId, message } = data;
        if (!ticketId || !message) return;

        const roomId = `chat:${ticketId}`;
        const newMsg: RealtimeChatMessage = {
          id: message.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          ticketId,
          senderId: message.senderId || 'user',
          senderName: message.senderName || 'Resident',
          senderRole: message.senderRole || 'customer',
          senderAvatar: message.senderAvatar,
          senderPhone: message.senderPhone,
          type: message.type || 'text',
          text: message.text || '',
          price: message.price,
          createdAt: new Date().toISOString()
        };

        const existing = chatStore.get(ticketId) || [];
        existing.push(newMsg);
        chatStore.set(ticketId, existing);

        // Broadcast to all clients in this chat room
        broadcastToAllInRoom(roomId, {
          type: 'chat_message',
          ticketId,
          message: newMsg
        });
      }

      // 3. Real Live Tracking Location Update (from GPS / provider movement)
      if (data.type === 'location_update') {
        const { ticketId, tracking } = data;
        if (!ticketId || !tracking) return;

        const roomId = `tracking:${ticketId}`;
        const updatedState: RealtimeTrackingState = {
          ticketId,
          providerLat: tracking.providerLat,
          providerLng: tracking.providerLng,
          userLat: tracking.userLat,
          userLng: tracking.userLng,
          speedKmh: tracking.speedKmh || 35,
          etaMinutes: tracking.etaMinutes || 10,
          status: tracking.status || 'EN_ROUTE',
          updatedAt: new Date().toISOString(),
          lastUpdatedBy: tracking.updatedBy || 'provider'
        };

        trackingStore.set(ticketId, updatedState);

        // Broadcast to all clients subscribed to this tracking room
        broadcastToAllInRoom(roomId, {
          type: 'tracking_update',
          ticketId,
          tracking: updatedState
        });
      }

      // 4. Ticket Status Update (Real-time synchronization across resident & provider)
      if (data.type === 'ticket_status') {
        const { ticketId, status, payload } = data;
        if (!ticketId) return;

        // Broadcast to chat room, tracking room, and global dispatch
        broadcastToAllInRoom(`chat:${ticketId}`, {
          type: 'ticket_status_changed',
          ticketId,
          status,
          payload
        });
        broadcastToAllInRoom(`tracking:${ticketId}`, {
          type: 'ticket_status_changed',
          ticketId,
          status,
          payload
        });
        broadcastToAllInRoom('global:services', {
          type: 'ticket_status_changed',
          ticketId,
          status,
          payload
        });
      }

    } catch (e) {
      console.error('WebSocket incoming message parse error:', e);
    }
  });

  ws.on('close', () => {
    const rooms = clientRooms.get(ws);
    if (rooms) {
      for (const roomId of rooms) {
        const subs = roomSubscribers.get(roomId);
        if (subs) {
          subs.delete(ws);
          if (subs.size === 0) {
            roomSubscribers.delete(roomId);
          } else {
            broadcastToRoom(roomId, {
              type: 'presence',
              roomId,
              activeCount: subs.size
            });
          }
        }
      }
    }
    clientRooms.delete(ws);
  });
});

// REST Endpoints for Chat & Tracking
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', realtime: true, activeConnections: wss.clients.size });
});

// Fetch chat messages for a ticket
app.get('/api/chat/:ticketId', (req, res) => {
  const { ticketId } = req.params;
  const messages = chatStore.get(ticketId) || [];
  res.json({ ticketId, messages });
});

// Post a chat message
app.post('/api/chat/:ticketId', (req, res) => {
  const { ticketId } = req.params;
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message payload required' });
  }

  const newMsg: RealtimeChatMessage = {
    id: message.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    ticketId,
    senderId: message.senderId || 'user',
    senderName: message.senderName || 'Resident',
    senderRole: message.senderRole || 'customer',
    senderAvatar: message.senderAvatar,
    senderPhone: message.senderPhone,
    type: message.type || 'text',
    text: message.text || '',
    price: message.price,
    createdAt: new Date().toISOString()
  };

  const existing = chatStore.get(ticketId) || [];
  existing.push(newMsg);
  chatStore.set(ticketId, existing);

  broadcastToAllInRoom(`chat:${ticketId}`, {
    type: 'chat_message',
    ticketId,
    message: newMsg
  });

  res.json({ success: true, message: newMsg });
});

// Fetch live tracking data for a ticket
app.get('/api/tracking/:ticketId', (req, res) => {
  const { ticketId } = req.params;
  const tracking = trackingStore.get(ticketId);
  if (!tracking) {
    return res.status(404).json({ error: 'No live tracking registered for this ticket' });
  }
  res.json({ ticketId, tracking });
});

// Post location update
app.post('/api/tracking/:ticketId', (req, res) => {
  const { ticketId } = req.params;
  const tracking = req.body;

  const updatedState: RealtimeTrackingState = {
    ticketId,
    providerLat: tracking.providerLat,
    providerLng: tracking.providerLng,
    userLat: tracking.userLat,
    userLng: tracking.userLng,
    speedKmh: tracking.speedKmh || 35,
    etaMinutes: tracking.etaMinutes || 10,
    status: tracking.status || 'EN_ROUTE',
    updatedAt: new Date().toISOString(),
    lastUpdatedBy: tracking.updatedBy || 'provider'
  };

  trackingStore.set(ticketId, updatedState);

  broadcastToAllInRoom(`tracking:${ticketId}`, {
    type: 'tracking_update',
    ticketId,
    tracking: updatedState
  });

  res.json({ success: true, tracking: updatedState });
});

// Setup Vite middleware in dev mode, static serve in prod
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Duyar Real-Time Full-Stack Server running on port ${PORT}`);
  });
}

startServer();
