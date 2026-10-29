// Duyar Production Real-Time Client
// Manages real-time WebSockets on /api/realtime with automated fallback and room subscriptions

import { supabase } from './supabase';

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

type ChatListener = (messages: RealtimeChatMessage[]) => void;
type TrackingListener = (tracking: RealtimeTrackingState) => void;
type ConnectionListener = (connected: boolean) => void;

class RealtimeClient {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private reconnectTimer: any = null;
  private subscribedRooms = new Set<string>();

  private chatListeners = new Map<string, Set<ChatListener>>();
  private trackingListeners = new Map<string, Set<TrackingListener>>();
  private connectionListeners = new Set<ConnectionListener>();

  // Cached in-memory store
  private chatCache = new Map<string, RealtimeChatMessage[]>();
  private trackingCache = new Map<string, RealtimeTrackingState>();

  constructor() {
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  private getWsUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/api/realtime`;
  }

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const url = this.getWsUrl();
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.notifyConnection(true);
        // Resubscribe to all previously subscribed rooms
        for (const roomId of this.subscribedRooms) {
          this.sendRaw({ type: 'join', roomId });
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleIncoming(data);
        } catch (e) {
          console.debug('Failed to parse realtime payload:', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.notifyConnection(false);
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.isConnected = false;
        this.notifyConnection(false);
      };
    } catch (e) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 2500);
  }

  private notifyConnection(connected: boolean) {
    for (const listener of this.connectionListeners) {
      try {
        listener(connected);
      } catch (err) {
        console.error('Error in connection listener:', err);
      }
    }
  }

  private sendRaw(data: any): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    }
    return false;
  }

  private handleIncoming(data: any) {
    // 1. Initial chat history on join
    if (data.type === 'chat_history') {
      const { ticketId, messages } = data;
      this.chatCache.set(ticketId, messages || []);
      this.notifyChat(ticketId);
    }

    // 2. New chat message received
    if (data.type === 'chat_message') {
      const { ticketId, message } = data;
      const list = this.chatCache.get(ticketId) || [];
      // avoid duplicates by ID
      if (!list.some(m => m.id === message.id)) {
        list.push(message);
        this.chatCache.set(ticketId, list);
      }
      this.notifyChat(ticketId);
    }

    // 3. Initial tracking state on join
    if (data.type === 'tracking_state' || data.type === 'tracking_update') {
      const { ticketId, tracking } = data;
      if (tracking) {
        this.trackingCache.set(ticketId, tracking);
        this.notifyTracking(ticketId, tracking);
      }
    }
  }

  private notifyChat(ticketId: string) {
    const listeners = this.chatListeners.get(ticketId);
    if (!listeners) return;
    const msgs = this.chatCache.get(ticketId) || [];
    for (const cb of listeners) {
      try {
        cb([...msgs]);
      } catch (e) {
        console.error('Chat listener error:', e);
      }
    }
  }

  private notifyTracking(ticketId: string, state: RealtimeTrackingState) {
    const listeners = this.trackingListeners.get(ticketId);
    if (!listeners) return;
    for (const cb of listeners) {
      try {
        cb(state);
      } catch (e) {
        console.error('Tracking listener error:', e);
      }
    }
  }

  // PUBLIC APIs
  public subscribeChat(ticketId: string, listener: ChatListener): () => void {
    const roomId = `chat:${ticketId}`;
    this.subscribedRooms.add(roomId);

    if (!this.chatListeners.has(ticketId)) {
      this.chatListeners.set(ticketId, new Set());
    }
    this.chatListeners.get(ticketId)!.add(listener);

    // Initial cache sync
    if (this.chatCache.has(ticketId)) {
      listener([...(this.chatCache.get(ticketId) || [])]);
    } else {
      // First check remote Supabase chat table if available
      if (supabase) {
        Promise.resolve(
          supabase
            .from('chat_messages')
            .select('*')
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: true })
        )
          .then(({ data }: any) => {
            if (data && data.length > 0) {
              const msgs: RealtimeChatMessage[] = data.map((d: any) => ({
                id: d.id,
                ticketId: d.ticket_id,
                senderId: d.sender_id,
                senderName: d.sender_name,
                senderRole: d.sender_role,
                senderAvatar: d.sender_avatar,
                senderPhone: d.sender_phone,
                type: d.type,
                text: d.text,
                price: d.price,
                createdAt: d.created_at
              }));
              this.chatCache.set(ticketId, msgs);
              listener([...msgs]);
            }
          })
          .catch(() => {});
      }

      // Also fetch via REST immediately in case WS is still connecting
      fetch(`/api/chat/${encodeURIComponent(ticketId)}`)
        .then(res => res.json())
        .then(data => {
          if (data?.messages) {
            this.chatCache.set(ticketId, data.messages);
            listener([...data.messages]);
          }
        })
        .catch(() => {});
    }

    if (this.isConnected) {
      this.sendRaw({ type: 'join', roomId });
    }

    return () => {
      const set = this.chatListeners.get(ticketId);
      if (set) {
        set.delete(listener);
        if (set.size === 0) {
          this.chatListeners.delete(ticketId);
          this.subscribedRooms.delete(roomId);
        }
      }
    };
  }

  public async sendChatMessage(ticketId: string, message: Partial<RealtimeChatMessage>): Promise<void> {
    const roomId = `chat:${ticketId}`;
    const payload = {
      type: 'chat_message',
      ticketId,
      message: {
        id: message.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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
      }
    };

    // Save directly to Supabase table
    if (supabase) {
      Promise.resolve(
        supabase.from('chat_messages').insert({
          id: payload.message.id,
          ticket_id: payload.message.ticketId,
          sender_id: payload.message.senderId,
          sender_name: payload.message.senderName,
          sender_role: payload.message.senderRole,
          sender_avatar: payload.message.senderAvatar || null,
          sender_phone: payload.message.senderPhone || null,
          type: payload.message.type,
          text: payload.message.text,
          price: payload.message.price || null,
          created_at: payload.message.createdAt
        })
      ).catch(() => {});
    }

    const sentWs = this.sendRaw(payload);
    if (!sentWs) {
      // Fallback to REST API
      try {
        await fetch(`/api/chat/${encodeURIComponent(ticketId)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: payload.message })
        });
      } catch (err) {
        console.error('Failed to send chat via REST fallback:', err);
      }
    }
  }

  public subscribeTracking(ticketId: string, listener: TrackingListener): () => void {
    const roomId = `tracking:${ticketId}`;
    this.subscribedRooms.add(roomId);

    if (!this.trackingListeners.has(ticketId)) {
      this.trackingListeners.set(ticketId, new Set());
    }
    this.trackingListeners.get(ticketId)!.add(listener);

    // Initial cache sync or REST fetch
    if (this.trackingCache.has(ticketId)) {
      listener(this.trackingCache.get(ticketId)!);
    } else {
      fetch(`/api/tracking/${encodeURIComponent(ticketId)}`)
        .then(res => res.json())
        .then(data => {
          if (data?.tracking) {
            this.trackingCache.set(ticketId, data.tracking);
            listener(data.tracking);
          }
        })
        .catch(() => {});
    }

    if (this.isConnected) {
      this.sendRaw({ type: 'join', roomId });
    }

    return () => {
      const set = this.trackingListeners.get(ticketId);
      if (set) {
        set.delete(listener);
        if (set.size === 0) {
          this.trackingListeners.delete(ticketId);
          this.subscribedRooms.delete(roomId);
        }
      }
    };
  }

  public async broadcastLocation(ticketId: string, tracking: Partial<RealtimeTrackingState>): Promise<void> {
    const payload = {
      type: 'location_update',
      ticketId,
      tracking
    };

    // Save live GPS telemetry directly to Supabase
    if (supabase && tracking.providerLat && tracking.providerLng) {
      Promise.resolve(
        supabase.from('live_tracking_telemetry').upsert({
          ticket_id: ticketId,
          provider_lat: tracking.providerLat,
          provider_lng: tracking.providerLng,
          user_lat: tracking.userLat || 23.7937,
          user_lng: tracking.userLng || 90.4066,
          speed_kmh: tracking.speedKmh ?? 35.0,
          eta_minutes: tracking.etaMinutes ?? 12,
          status: tracking.status || 'EN_ROUTE',
          last_updated_by: tracking.lastUpdatedBy || 'provider',
          updated_at: new Date().toISOString()
        })
      ).catch(() => {});
    }

    const sentWs = this.sendRaw(payload);
    if (!sentWs) {
      try {
        await fetch(`/api/tracking/${encodeURIComponent(ticketId)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tracking)
        });
      } catch (err) {
        console.error('Failed to post location via REST fallback:', err);
      }
    }
  }

  public broadcastTicketStatus(ticketId: string, status: string, payload?: any) {
    this.sendRaw({
      type: 'ticket_status',
      ticketId,
      status,
      payload
    });
  }

  public onConnectionChange(listener: ConnectionListener): () => void {
    this.connectionListeners.add(listener);
    listener(this.isConnected);
    return () => {
      this.connectionListeners.delete(listener);
    };
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }
}

export const realtimeClient = new RealtimeClient();
