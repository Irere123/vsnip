import { useEffect, useState, useRef } from 'react';
import Button from '../components/Button';
import Card from '../components/Card';
import BackBar from '../components/BackBar';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  type Message,
  type MessagesResponse,
  query,
  mutation,
} from '../shared/api';
import { webSocketManager, type WebSocketMessage } from '../shared/websocket';
import type { Page } from '../shared/types';

interface ConversationProps {
  vscode: {
    postMessage: (message: any) => void;
    getState: () => any;
    setState: (state: any) => void;
  };
  userId?: string;
  onPageChange?: (page: Page, params?: Record<string, any>) => void;
}

const Conversation = ({ vscode, userId, onPageChange }: ConversationProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [recipientInfo, setRecipientInfo] = useState<{
    id: string;
    username: string;
    avatar: string;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = (await query(
          `/messages/${userId}`,
        )) as MessagesResponse;
        setMessages(response.messages);

        const userInfo = await query(`/user/${userId}`);
        setRecipientInfo({
          id: userInfo.id,
          username: userInfo.username,
          avatar: userInfo.avatar,
        });
      } catch (error) {
        console.error('Error fetching messages:', error);

        setMessages([]);

        setRecipientInfo(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();

    // Make sure WebSocket is connected
    initializeWebSocket();

    // Subscribe to WebSocket messages
    const unsubscribe = webSocketManager.subscribe(
      (wsMessage: WebSocketMessage) => {
        if (wsMessage.type === 'new-message' && wsMessage.message) {
          // Only add messages relevant to this conversation
          if (
            (wsMessage.message.senderId === userId &&
              wsMessage.message.recipientId === '1') ||
            (wsMessage.message.senderId === '1' &&
              wsMessage.message.recipientId === userId)
          ) {
            setMessages((prevMessages) => [...prevMessages, wsMessage.message]);
          }
        }
      },
    );

    return () => {
      // Unsubscribe when component unmounts
      unsubscribe();
    };
  }, [userId]);

  // Initialize WebSocket connection
  const initializeWebSocket = () => {
    // @ts-ignore - These are set in the global scope by the HTML template
    if (window.apiBaseUrl && window.accessToken) {
      // @ts-ignore
      webSocketManager.connect(window.apiBaseUrl, window.accessToken);
    } else {
      console.warn(
        'Cannot initialize WebSocket: missing apiBaseUrl or accessToken',
      );
    }
  };

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !userId) return;

    const tempMessageId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      id: tempMessageId,
      senderId: '1', // Current user ID
      recipientId: userId,
      text: newMessage,
      createdAt: Date.now(),
    };

    // Add message to UI immediately
    setMessages((prevMessages) => [...prevMessages, tempMessage]);
    setNewMessage('');

    try {
      // Send message to API
      const response = await mutation('/message', {
        recipientId: userId,
        text: newMessage,
      });

      // Replace temp message with actual message from API if needed
      if (response?.id) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === tempMessageId ? { ...response } : msg,
          ),
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Could handle error by marking the message as failed
    }
  };

  const handleBack = () => {
    if (onPageChange) {
      onPageChange('messages');
    } else {
      vscode.postMessage({
        type: 'changeView',
        view: 'messages',
      });
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="large" />;
  }

  if (!userId) {
    return (
      <div className="p-4">
        <Card>
          <p>No conversation selected.</p>
          <Button onClick={handleBack} className="mt-4">
            Back to Messages
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center mb-4 justify-between">
        <BackBar onBack={handleBack} className="mr-2" />
        {recipientInfo && (
          <div className="flex items-center">
            <img
              src={recipientInfo.avatar}
              alt={`${recipientInfo.username}'s avatar`}
              className="w-8 h-8 rounded-full mr-2"
            />
            <h2 className="text-lg font-medium">{recipientInfo.username}</h2>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto gap-4">
        {messages.map((message) => {
          const isCurrentUser = message.senderId !== recipientInfo?.id;

          return (
            <div
              key={message.id}
              className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] px-4 py-2 rounded-lg ${
                  isCurrentUser
                    ? 'bg-[color:var(--vscode-button-background)] text-[color:var(--vscode-input-foreground)]'
                    : 'bg-[color:var(--vscode-editor-inactiveSelectionBackground)] text-[color:var(--vscode-editor-foreground)]'
                }`}
              >
                <p>{message.text}</p>
                <span className="text-xs opacity-70 block text-right">
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 p-2 border border-[color:var(--vscode-input-border)] bg-[color:var(--vscode-input-background)] text-[color:var(--vscode-input-foreground)] rounded-l-md focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
      </div>
    </div>
  );
};

export default Conversation;
