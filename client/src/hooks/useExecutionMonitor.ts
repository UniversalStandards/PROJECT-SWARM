import { useEffect, useRef, useState, useCallback } from 'react';

export interface ExecutionEvent {
  type: 'execution_started' | 'agent_started' | 'agent_completed' | 'execution_completed' | 'execution_failed' | 'log' | 'message';
  executionId: string;
  agentId?: string;
  agentName?: string;
  data?: any;
  timestamp: string;
}

export interface ExecutionStatus {
  status: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';
  events: ExecutionEvent[];
  logs: Array<{ level: string; message: string; agentId?: string; agentName?: string; timestamp: string }>;
  messages: Array<{ agentId: string; agentName: string; role: string; content: string; timestamp: string }>;
  currentAgent?: { id: string; name: string };
  error?: string;
}

interface UseExecutionMonitorOptions {
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

/**
 * Hook for monitoring workflow execution in real-time via WebSocket
 */
export function useExecutionMonitor(
  executionId: string | null,
  userId: string | null,
  options: UseExecutionMonitorOptions = {}
) {
  const {
    autoConnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const [status, setStatus] = useState<ExecutionStatus>({
    status: 'idle',
    events: [],
    logs: [],
    messages: [],
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!executionId || !userId) {
      console.warn('[useExecutionMonitor] Missing executionId or userId');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('[useExecutionMonitor] Already connected');
      return;
    }

    setStatus(prev => ({ ...prev, status: 'connecting' }));

    // Determine WebSocket URL based on current location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws?executionId=${executionId}&userId=${userId}`;

    console.log('[useExecutionMonitor] Connecting to:', wsUrl);

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[useExecutionMonitor] Connected');
        setStatus(prev => ({ ...prev, status: 'connected', error: undefined }));
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const executionEvent: ExecutionEvent = JSON.parse(event.data);
          console.log('[useExecutionMonitor] Event received:', executionEvent.type);

          setStatus(prev => {
            const newEvents = [...prev.events, executionEvent];
            const updates: Partial<ExecutionStatus> = { events: newEvents };

            // Handle different event types
            switch (executionEvent.type) {
              case 'log':
                updates.logs = [
                  ...prev.logs,
                  {
                    level: executionEvent.data?.level || 'info',
                    message: executionEvent.data?.message || '',
                    agentId: executionEvent.agentId,
                    agentName: executionEvent.agentName,
                    timestamp: executionEvent.timestamp,
                  },
                ];
                break;

              case 'message':
                updates.messages = [
                  ...prev.messages,
                  {
                    agentId: executionEvent.agentId!,
                    agentName: executionEvent.agentName!,
                    role: executionEvent.data?.role || 'assistant',
                    content: executionEvent.data?.content || '',
                    timestamp: executionEvent.timestamp,
                  },
                ];
                break;

              case 'agent_started':
                updates.currentAgent = {
                  id: executionEvent.agentId!,
                  name: executionEvent.agentName!,
                };
                break;

              case 'agent_completed':
                updates.currentAgent = undefined;
                break;

              case 'execution_completed':
              case 'execution_failed':
                updates.currentAgent = undefined;
                break;
            }

            return { ...prev, ...updates };
          });
        } catch (error) {
          console.error('[useExecutionMonitor] Failed to parse event:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[useExecutionMonitor] WebSocket error:', error);
        setStatus(prev => ({
          ...prev,
          status: 'error',
          error: 'WebSocket connection error',
        }));
      };

      ws.onclose = () => {
        console.log('[useExecutionMonitor] Disconnected');
        setStatus(prev => ({ ...prev, status: 'disconnected' }));
        wsRef.current = null;

        // Attempt to reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(
            `[useExecutionMonitor] Reconnecting in ${reconnectInterval}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
          );
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else {
          console.log('[useExecutionMonitor] Max reconnection attempts reached');
          setStatus(prev => ({
            ...prev,
            status: 'error',
            error: 'Max reconnection attempts reached',
          }));
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[useExecutionMonitor] Failed to create WebSocket:', error);
      setStatus(prev => ({
        ...prev,
        status: 'error',
        error: 'Failed to create WebSocket connection',
      }));
    }
  }, [executionId, userId, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setStatus(prev => ({ ...prev, status: 'disconnected' }));
  }, []);

  // Auto-connect when executionId and userId are available
  useEffect(() => {
    if (autoConnect && executionId && userId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [executionId, userId, autoConnect, connect, disconnect]);

  return {
    status,
    connect,
    disconnect,
    isConnected: status.status === 'connected',
    isConnecting: status.status === 'connecting',
    isDisconnected: status.status === 'disconnected',
    hasError: status.status === 'error',
  };
}
