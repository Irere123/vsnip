import type { Message } from './api';
import { useAppContext } from '../context/AppContext';
import { useEffect, useCallback } from 'react';
import ReconnectingWebSocket from 'reconnecting-websocket';

export type WebSocketMessage =
  | { type: 'new-message'; message: Message }
  | { type: 'unfriend'; userId: string }
  | { type: 'message-open'; userId: string | null };

/**
 * WebSocket manager for handling API communication
 */
class WebSocketManager {
  private webSocket: ReconnectingWebSocket | null = null;
  private messageHandlers: ((message: WebSocketMessage) => void)[] = [];
  private isConnected = false;
  private currentChatUserId: string | null = null;
  private currentUrl = ''; // Store the URL to avoid reconnecting to the same URL unnecessarily

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  constructor() {
    this.handleMessage = this.handleMessage.bind(this);
    this.handleOpen = this.handleOpen.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleError = this.handleError.bind(this);
  }

  /**
   * Connect to the WebSocket server
   */
  connect(apiBaseUrl: string, accessToken: string, refreshToken: string): void {
    // Convert HTTP URL to WebSocket URL
    const wsBaseUrl = apiBaseUrl.replace(/^http/, 'ws');
    const url = `${wsBaseUrl}/ws?accessToken=${accessToken}&refreshToken=${refreshToken}`;

    // Avoid reconnecting if already connected to the same URL or if WebSocket is connecting/open
    if (
      this.webSocket &&
      this.currentUrl === url &&
      (this.webSocket.readyState === ReconnectingWebSocket.CONNECTING ||
        this.webSocket.readyState === ReconnectingWebSocket.OPEN)
    ) {
      console.log('WebSocket already connecting or open to the same URL.');
      return;
    }

    // If a WebSocket instance exists, close it before creating a new one
    if (this.webSocket) {
      this.webSocket.close();
      // Remove old listeners
      this.webSocket.removeEventListener('open', this.handleOpen);
      this.webSocket.removeEventListener('close', this.handleClose);
      this.webSocket.removeEventListener('error', this.handleError);
      this.webSocket.removeEventListener('message', this.handleMessage);
    }

    this.currentUrl = url;
    console.log('Attempting to connect WebSocket to:', url);
    this.webSocket = new ReconnectingWebSocket(url, [], {
      maxReconnectionDelay: 10000, // Default is 10000
      minReconnectionDelay: 1000 + Math.random() * 4000, // Default is 1000, add jitter
      reconnectionDelayGrowFactor: 1.3, // Default is 1.3
      minUptime: 5000, // Default is 5000, time in ms that connection must be stable to reset attempts
      connectionTimeout: 4000, // Default is 4000
      maxRetries: Number.POSITIVE_INFINITY, // Changed from Infinity
      // maxEnqueuedMessages: Infinity, // Default is Infinity
      // binaryType: 'blob' // or 'arraybuffer'
    });

    // Set up event listeners
    this.webSocket.addEventListener('open', this.handleOpen);
    this.webSocket.addEventListener('close', this.handleClose);
    this.webSocket.addEventListener('error', this.handleError);
    this.webSocket.addEventListener('message', this.handleMessage);
  }

  private handleOpen(): void {
    console.log('WebSocket connected successfully');
    this.isConnected = true;
    // If there was an active chat when connection was established, notify server
    if (this.currentChatUserId) {
      this.setActiveChatUser(this.currentChatUserId);
    }
  }

  private handleClose(): void {
    console.log('WebSocket disconnected');
    this.isConnected = false;
  }

  private handleError(event: any): void {
    console.error('WebSocket error:', event);
    // The library handles reconnection, so we mainly log here.
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    if (this.webSocket) {
      console.log('Disconnecting WebSocket.');
      this.setActiveChatUser(null);
      this.webSocket.close();
      this.currentUrl = '';
    }
  }

  subscribe(handler: (message: WebSocketMessage) => void): () => void {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter((h) => h !== handler);
    };
  }

  setActiveChatUser(userId: string | null): void {
    this.currentChatUserId = userId;
    if (
      this.webSocket &&
      this.webSocket.readyState === ReconnectingWebSocket.OPEN
    ) {
      try {
        this.webSocket.send(JSON.stringify({ type: 'message-open', userId }));
      } catch (error) {
        console.error('Failed to send active chat user status:', error);
      }
    }
  }

  /**
   * Send a message through the WebSocket.
   * The message should be a string, typically a JSON string.
   */
  send(data: string): void {
    if (
      this.webSocket &&
      this.webSocket.readyState === ReconnectingWebSocket.OPEN
    ) {
      this.webSocket.send(data);
    } else {
      console.warn(
        'WebSocket not open. Message not sent immediately, but reconnecting-websocket will queue it if configured (default is 0). For this app, we might want to handle this case, e.g., by queuing manually or notifying user.',
      );
      // reconnecting-websocket (by default) does not queue messages if send() is called while closed.
      // If we want to ensure messages are sent after reconnection, we might need to queue them in WebSocketManager.
      // However, for many use cases (like sending 'message-open'), it's fine if it's only sent when connected.
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(event: MessageEvent): void {
    try {
      if (typeof event.data === 'string') {
        const data = JSON.parse(event.data) as WebSocketMessage;
        this.messageHandlers.forEach((handler) => handler(data));
      } else {
        console.warn('Received non-string WebSocket message:', event.data);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }
}

// Export a singleton instance
export const webSocketManager = new WebSocketManager();

export const useWebSocket = () => {
  const { apiBaseUrl, accessToken, refreshToken, isAuthenticated } =
    useAppContext();

  useEffect(() => {
    let isMounted = true;
    const attemptConnect = () => {
      if (
        isMounted &&
        isAuthenticated &&
        apiBaseUrl &&
        accessToken &&
        refreshToken
      ) {
        console.log('useWebSocket: Attempting to connect WebSocket.');
        webSocketManager.connect(apiBaseUrl, accessToken, refreshToken);
      } else {
        console.log(
          'useWebSocket: Conditions not met for WebSocket connection, disconnecting.',
        );
        webSocketManager.disconnect();
      }
    };

    attemptConnect();

    return () => {
      isMounted = false;
      console.log('useWebSocket: Cleaning up. Disconnecting WebSocket.');
      webSocketManager.disconnect();
    };
  }, [apiBaseUrl, accessToken, refreshToken, isAuthenticated]);

  const subscribe = useCallback(
    (handler: (message: WebSocketMessage) => void) => {
      return webSocketManager.subscribe(handler);
    },
    [], // webSocketManager is stable, so no dependencies needed for subscribe
  );

  const setActiveChatUser = useCallback((userId: string | null) => {
    webSocketManager.setActiveChatUser(userId);
  }, []);

  const sendMessage = useCallback((message: Record<string, unknown>) => {
    try {
      const messageString = JSON.stringify(message);
      webSocketManager.send(messageString);
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
    }
  }, []);

  // Note: isConnected state here might not be perfectly in sync with the actual WebSocket state
  // without a more direct feedback mechanism from webSocketManager.
  // For a more reactive `isConnected` status in the hook, `webSocketManager` would need to
  // provide a way to subscribe to its internal connection status changes.
  // For now, this hook primarily manages the lifecycle and provides an interface.
  // Components can use the subscribe method to react to actual messages.
  // The `webSocketManager.isConnected` could be exposed via a getter if needed,
  // but making the hook's `isConnected` state reliably reactive requires more plumbing.

  return {
    subscribe,
    setActiveChatUser,
    sendMessage,
  };
};
