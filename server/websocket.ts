import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import type { IncomingMessage } from 'http';
import url from 'url';

export interface ExecutionEvent {
  type: 'execution_started' | 'agent_started' | 'agent_completed' | 'execution_completed' | 'execution_failed' | 'log' | 'message';
  executionId: string;
  agentId?: string;
  agentName?: string;
  data?: any;
  timestamp: string;
}

interface ClientConnection {
  ws: WebSocket;
  executionId: string;
  userId: string;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ClientConnection[]> = new Map(); // executionId -> clients

  initialize(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws',
    });

    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      this.handleConnection(ws, req);
    });

    console.log('[WebSocket] Server initialized on /ws');
  }

  private handleConnection(ws: WebSocket, req: IncomingMessage) {
    // Parse query parameters for executionId and userId
    const query = url.parse(req.url || '', true).query;
    const executionId = query.executionId as string;
    const userId = query.userId as string;

    if (!executionId || !userId) {
      ws.close(1008, 'Missing executionId or userId');
      return;
    }

    // Add client to the execution room
    const connection: ClientConnection = { ws, executionId, userId };
    const existingClients = this.clients.get(executionId) || [];
    existingClients.push(connection);
    this.clients.set(executionId, existingClients);

    console.log(`[WebSocket] Client connected to execution ${executionId}`);

    // Send connection acknowledgment
    this.sendToClient(ws, {
      type: 'log' as const,
      executionId,
      data: { message: 'Connected to execution monitor', level: 'info' },
      timestamp: new Date().toISOString(),
    });

    // Handle client disconnection
    ws.on('close', () => {
      this.handleDisconnection(executionId, connection);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('[WebSocket] Error:', error);
    });

    // Handle incoming messages (for future use like pause/resume)
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('[WebSocket] Received message:', message);
        // Handle incoming messages if needed
      } catch (error) {
        console.error('[WebSocket] Failed to parse message:', error);
      }
    });
  }

  private handleDisconnection(executionId: string, connection: ClientConnection) {
    const clients = this.clients.get(executionId) || [];
    const updatedClients = clients.filter(c => c.ws !== connection.ws);
    
    if (updatedClients.length === 0) {
      this.clients.delete(executionId);
    } else {
      this.clients.set(executionId, updatedClients);
    }

    console.log(`[WebSocket] Client disconnected from execution ${executionId}`);
  }

  private sendToClient(ws: WebSocket, event: ExecutionEvent) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(event));
    }
  }

  /**
   * Broadcast an event to all clients watching a specific execution
   */
  broadcast(executionId: string, event: Omit<ExecutionEvent, 'executionId' | 'timestamp'>) {
    const clients = this.clients.get(executionId) || [];
    
    const fullEvent: ExecutionEvent = {
      ...event,
      executionId,
      timestamp: new Date().toISOString(),
    };

    console.log(`[WebSocket] Broadcasting to ${clients.length} clients:`, fullEvent.type);

    clients.forEach(client => {
      this.sendToClient(client.ws, fullEvent);
    });
  }

  /**
   * Emit execution started event
   */
  emitExecutionStarted(executionId: string, workflowName: string) {
    this.broadcast(executionId, {
      type: 'execution_started',
      data: { workflowName },
    });
  }

  /**
   * Emit agent started event
   */
  emitAgentStarted(executionId: string, agentId: string, agentName: string) {
    this.broadcast(executionId, {
      type: 'agent_started',
      agentId,
      agentName,
      data: { status: 'running' },
    });
  }

  /**
   * Emit agent completed event
   */
  emitAgentCompleted(executionId: string, agentId: string, agentName: string, result: any) {
    this.broadcast(executionId, {
      type: 'agent_completed',
      agentId,
      agentName,
      data: { status: 'completed', result },
    });
  }

  /**
   * Emit execution completed event
   */
  emitExecutionCompleted(executionId: string, output: any) {
    this.broadcast(executionId, {
      type: 'execution_completed',
      data: { status: 'completed', output },
    });
  }

  /**
   * Emit execution failed event
   */
  emitExecutionFailed(executionId: string, error: string) {
    this.broadcast(executionId, {
      type: 'execution_failed',
      data: { status: 'error', error },
    });
  }

  /**
   * Emit log message
   */
  emitLog(executionId: string, level: string, message: string, agentId?: string, agentName?: string) {
    this.broadcast(executionId, {
      type: 'log',
      agentId,
      agentName,
      data: { level, message },
    });
  }

  /**
   * Emit agent message
   */
  emitMessage(executionId: string, agentId: string, agentName: string, role: string, content: string) {
    this.broadcast(executionId, {
      type: 'message',
      agentId,
      agentName,
      data: { role, content },
    });
  }

  /**
   * Get number of connected clients for an execution
   */
  getClientCount(executionId: string): number {
    return (this.clients.get(executionId) || []).length;
  }
}

export const wsManager = new WebSocketManager();
