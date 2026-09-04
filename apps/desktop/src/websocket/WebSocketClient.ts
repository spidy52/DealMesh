export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private listeners: Map<string, Array<(data: any) => void>> = new Map();
  private isConnected = false;
  private reconnectTimeout: any = null;
  private retryDelay = 1000;

  constructor(url: string = 'ws://127.0.0.1:8000/ws') {
    this.url = url;
    this.connect();
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.retryDelay = 1000;
        this.emit('connection.state', { connected: true });
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type) {
            this.emit(message.type, message.data || message);
          }
        } catch (e) {}
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.emit('connection.state', { connected: false });
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.isConnected = false;
        this.emit('connection.state', { connected: false });
      };
    } catch (e) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      this.retryDelay = Math.min(this.retryDelay * 1.5, 30000);
      this.connect();
    }, this.retryDelay);
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);

    return () => {
      const list = this.listeners.get(event);
      if (list) {
        this.listeners.set(
          event,
          list.filter((cb) => cb !== callback)
        );
      }
    };
  }

  emit(event: string, data: any) {
    const list = this.listeners.get(event);
    if (list) {
      list.forEach((cb) => cb(data));
    }
    const allList = this.listeners.get('*');
    if (allList) {
      allList.forEach((cb) => cb({ event, data }));
    }
  }

  send(type: string, data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    }
  }
}

export const wsClient = new WebSocketClient();
