/**
 * WebSocket utilities for real-time communication using ReconnectingWebSocket
 */
import type { Message } from './api';
import { useAppContext } from '../context/AppContext';
import { useEffect, useState, useCallback } from 'react';

export type WebSocketMessage =
  | { type: 'new-message'; message: Message }
  | { type: 'unfriend'; userId: string }
  | { type: 'message-open'; userId: string | null };

/**
 * A simple implementation of a reconnecting WebSocket
 * This class provides automatic reconnection with backoff
 */
class ReconnectingWebSocket {
  private url = '';
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectInterval = 1000;
  private reconnectDecay = 1.5;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private forceClosed = false;

  // Event callbacks
  private onOpenCallbacks: (() => void)[] = [];
  private onCloseCallbacks: (() => void)[] = [];
  private onErrorCallbacks: ((event: Event) => void)[] = [];
  private onMessageCallbacks: ((event: MessageEvent) => void)[] = [];

  /**
   * Connect to the WebSocket server
   */
  connect(url: string): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return;
    }

    this.url = url;
    this.forceClosed = false;
    this.createWebSocket();
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    this.forceClosed = true;

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.reconnectAttempts = 0;
  }

  /**
   * Send data through the WebSocket
   */
  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(data);
    } else {
      console.error('WebSocket is not connected. Cannot send data.');
    }
  }

  /**
   * Register a callback for open event
   */
  onOpen(callback: () => void): void {
    this.onOpenCallbacks.push(callback);
  }

  /**
   * Register a callback for close event
   */
  onClose(callback: () => void): void {
    this.onCloseCallbacks.push(callback);
  }

  /**
   * Register a callback for error event
   */
  onError(callback: (event: Event) => void): void {
    this.onErrorCallbacks.push(callback);
  }

  /**
   * Register a callback for message event
   */
  onMessage(callback: (event: MessageEvent) => void): void {
    this.onMessageCallbacks.push(callback);
  }

  /**
   * Create a new WebSocket instance and set up event listeners
   */
  private createWebSocket(): void {
    try {
      this.socket = new WebSocket(this.url);

      this.socket.addEventListener('open', () => {
        console.log('WebSocket connection established');
        this.reconnectAttempts = 0;
        this.onOpenCallbacks.forEach((callback) => callback());
      });

      this.socket.addEventListener('close', () => {
        console.log('WebSocket connection closed');
        this.onCloseCallbacks.forEach((callback) => callback());

        if (!this.forceClosed) {
          this.reconnect();
        }
      });

      this.socket.addEventListener('error', (event) => {
        console.error('WebSocket error:', event);
        this.onErrorCallbacks.forEach((callback) => callback(event));
      });

      this.socket.addEventListener('message', (event) => {
        this.onMessageCallbacks.forEach((callback) => callback(event));
      });
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      this.reconnect();
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private reconnect(): void {
    if (this.reconnectTimer || this.forceClosed) {
      return;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;

      // Calculate the delay with exponential backoff
      const delay =
        this.reconnectInterval *
        Math.pow(this.reconnectDecay, this.reconnectAttempts - 1);
      console.log(
        `Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
      );

      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        this.createWebSocket();
      }, delay);
    } else {
      console.error(
        `Maximum reconnection attempts (${this.maxReconnectAttempts}) reached. Giving up.`,
      );
    }
  }
}

/**
 * WebSocket manager for handling API communication
 */
class WebSocketManager {
  private webSocket: ReconnectingWebSocket | null = null;
  private messageHandlers: ((message: WebSocketMessage) => void)[] = [];
  private isConnected = false;
  private currentChatUserId: string | null = null;

  constructor() {
    this.handleMessage = this.handleMessage.bind(this);
  }

  /**
   * Connect to the WebSocket server
   */
  connect(apiBaseUrl: string, accessToken: string, refreshToken: string): void {
    // Create a new websocket if it doesn't exist
    if (!this.webSocket) {
      this.webSocket = new ReconnectingWebSocket();

      // Set up message handler
      this.webSocket.onMessage(this.handleMessage);

      // Log connection events
      this.webSocket.onOpen(() => {
        console.log('WebSocket connected successfully');
        this.isConnected = true;

        // If there was an active chat when connection was established, notify server
        if (this.currentChatUserId) {
          this.setActiveChatUser(this.currentChatUserId);
        }
      });

      this.webSocket.onClose(() => {
        console.log('WebSocket disconnected');
        this.isConnected = false;
      });

      this.webSocket.onError((error) => {
        console.error('WebSocket error:', error);
      });
    }

    // Convert HTTP URL to WebSocket URL
    const wsBaseUrl = apiBaseUrl.replace(/^http/, 'ws');
    const url = `${wsBaseUrl}/ws?accessToken=${accessToken}&refreshToken=${refreshToken}`;

    // Connect to the WebSocket server
    this.webSocket.connect(url);
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    if (this.webSocket) {
      // Clear active chat user
      this.setActiveChatUser(null);
      this.webSocket.disconnect();
      this.isConnected = false;
    }
  }

  /**
   * Subscribe to WebSocket messages
   */
  subscribe(handler: (message: WebSocketMessage) => void): () => void {
    this.messageHandlers.push(handler);

    // Return an unsubscribe function
    return () => {
      this.messageHandlers = this.messageHandlers.filter((h) => h !== handler);
    };
  }

  /**
   * Set the user ID of the currently open chat
   * This notifies the server that the user is actively viewing messages from this user
   */
  setActiveChatUser(userId: string | null): void {
    this.currentChatUserId = userId;

    if (this.webSocket && this.isConnected) {
      this.webSocket.send(JSON.stringify({ type: 'message-open', userId }));
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data) as WebSocketMessage;
      this.messageHandlers.forEach((handler) => handler(data));
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }
}

// Export a singleton instance
export const webSocketManager = new WebSocketManager();

/**
 * React hook for using WebSocket
 */
export const useWebSocket = () => {
  const { apiBaseUrl, accessToken, refreshToken, isAuthenticated } =
    useAppContext();
  const [isConnected, setIsConnected] = useState(false);

  // Initialize WebSocket connection when component mounts
  useEffect(() => {
    if (apiBaseUrl && accessToken && refreshToken && isAuthenticated) {
      console.log('Initializing WebSocket connection from hook');
      webSocketManager.connect(apiBaseUrl, accessToken, refreshToken);
      setIsConnected(true);

      // Clean up WebSocket connection when component unmounts
      return () => {
        webSocketManager.disconnect();
        setIsConnected(false);
      };
    }
  }, [apiBaseUrl, accessToken, refreshToken, isAuthenticated]);

  // Subscribe to WebSocket messages
  const subscribe = useCallback(
    (handler: (message: WebSocketMessage) => void) => {
      return webSocketManager.subscribe(handler);
    },
    [], // webSocketManager is stable, so no dependencies needed for subscribe
  );

  // Set active chat user
  const setActiveChatUser = useCallback(
    (userId: string | null) => {
      webSocketManager.setActiveChatUser(userId);
    },
    [], // webSocketManager is stable
  );

  return {
    subscribe,
    isConnected,
    setActiveChatUser,
  };
};
