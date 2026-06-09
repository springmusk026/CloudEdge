// LiveCommentsDO — Real-time comment notifications + viewer count
// Uses WebSocket Hibernation for cost efficiency

import { DurableObject } from 'cloudflare:workers';

export class LiveCommentsDO extends DurableObject {
  private viewers: Set<WebSocket> = new Set();

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/websocket') {
      const pair = new WebSocketPair();
      this.ctx.acceptWebSocket(pair[1]);
      this.viewers.add(pair[1]);
      // Send current viewer count to new connection
      pair[1].send(JSON.stringify({ type: 'viewers', count: this.viewers.size }));
      // Broadcast updated count to all
      this.broadcast({ type: 'viewers', count: this.viewers.size });
      return new Response(null, { status: 101, webSocket: pair[0] });
    }

    if (url.pathname === '/broadcast' && request.method === 'POST') {
      const data = await request.json();
      this.broadcast(data as object);
      return new Response('ok');
    }

    return new Response('Not found', { status: 404 });
  }

  webSocketMessage(_ws: WebSocket, _message: string | ArrayBuffer) {
    // Clients don't send messages in this DO, they only receive
  }

  webSocketClose(ws: WebSocket) {
    this.viewers.delete(ws);
    this.broadcast({ type: 'viewers', count: this.viewers.size });
  }

  webSocketError(ws: WebSocket) { this.viewers.delete(ws); }

  private broadcast(msg: object) {
    const json = JSON.stringify(msg);
    for (const ws of this.viewers) { try { ws.send(json); } catch {} }
  }
}
