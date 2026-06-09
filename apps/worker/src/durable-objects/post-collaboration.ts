// PostCollaborationDO — WebSocket-based multiplayer editing presence
// Ref: https://developers.cloudflare.com/durable-objects/best-practices/websockets/
// Uses WebSocket Hibernation API for cost efficiency

import { DurableObject } from 'cloudflare:workers';

interface Session { userId: string; name: string; cursor?: { line: number; ch: number }; section?: string }

export class PostCollaborationDO extends DurableObject {
  private sessions: Map<WebSocket, Session> = new Map();

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/websocket') {
      const pair = new WebSocketPair();
      const [client, server] = [pair[0], pair[1]];
      const userId = url.searchParams.get('userId') || 'anonymous';
      const name = url.searchParams.get('name') || 'Anonymous';

      this.ctx.acceptWebSocket(server);
      this.sessions.set(server, { userId, name });

      // Broadcast presence update
      this.broadcast({ type: 'presence', users: this.getActiveUsers() });
      return new Response(null, { status: 101, webSocket: client });
    }

    if (url.pathname === '/save' && request.method === 'POST') {
      const { content, userId } = await request.json() as { content: string; userId: string };
      await this.ctx.storage.put('lastContent', content);
      await this.ctx.storage.put('lastSaveBy', userId);
      await this.ctx.storage.put('lastSaveAt', new Date().toISOString());
      this.broadcast({ type: 'saved', userId, at: new Date().toISOString() });
      return new Response('ok');
    }

    return new Response('Not found', { status: 404 });
  }

  webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    try {
      const data = JSON.parse(message as string);
      const session = this.sessions.get(ws);
      if (!session) return;

      switch (data.type) {
        case 'cursor':
          session.cursor = data.cursor;
          session.section = data.section;
          this.broadcast({ type: 'cursor', userId: session.userId, name: session.name, cursor: data.cursor, section: data.section }, ws);
          break;
        case 'edit':
          this.broadcast({ type: 'edit', userId: session.userId, ops: data.ops }, ws);
          break;
      }
    } catch {}
  }

  webSocketClose(ws: WebSocket) {
    this.sessions.delete(ws);
    this.broadcast({ type: 'presence', users: this.getActiveUsers() });
  }

  webSocketError(ws: WebSocket) { this.sessions.delete(ws); }

  private broadcast(msg: object, exclude?: WebSocket) {
    const json = JSON.stringify(msg);
    for (const [ws] of this.sessions) {
      if (ws !== exclude) { try { ws.send(json); } catch {} }
    }
  }

  private getActiveUsers() {
    return [...this.sessions.values()].map(s => ({ userId: s.userId, name: s.name, cursor: s.cursor, section: s.section }));
  }
}
