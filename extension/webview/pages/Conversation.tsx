import { useEffect, useState, useRef, useMemo } from 'react';
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
import { type WebSocketMessage, useWebSocket } from '../shared/websocket';
import type { Page } from '../shared/types';
import { useAppContext } from '../context/AppContext';

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
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { subscribe, setActiveChatUser } = useWebSocket();
  const { userProfile } = useAppContext();

  // Group messages by sender and time proximity for better display
  const messageGroups = useMemo(() => {
    const groups: Message[][] = [];
    if (!messages || messages.length === 0) {
      return groups;
    }

    messages.forEach((message) => {
      if (groups.length === 0) {
        groups.push([message]);
        return;
      }

      const lastGroup = groups[groups.length - 1];
      const lastMessage = lastGroup[lastGroup.length - 1];

      // Group messages if from same sender and within 2 minutes
      if (
        message.senderId === lastMessage.senderId &&
        Math.abs(message.createdAt - lastMessage.createdAt) < 120000
      ) {
        lastGroup.push(message);
      } else {
        groups.push([message]);
      }
    });

    return groups;
  }, [messages]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch messages from API with the correct endpoint format
        const response = (await query(
          `/messages/${userId}/`,
        )) as MessagesResponse;

        // Sort messages by timestamp (newest last to display them in chronological order)
        const sortedMessages = response.messages.sort((a, b) => {
          if (a.createdAt < b.createdAt) {
            return -1;
          }
          if (a.createdAt > b.createdAt) {
            return 1;
          }
          return 0;
        });

        setMessages(sortedMessages);

        // Fetch user info for the conversation header
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

    // Notify server that this chat is being viewed
    setActiveChatUser(userId || null);

    // Subscribe to WebSocket messages
    const unsubscribe = subscribe((wsMessage: WebSocketMessage) => {
      if (
        wsMessage.type === 'new-message' &&
        wsMessage.message &&
        userProfile?.id
      ) {
        if (
          userId &&
          ((wsMessage.message.senderId === userId &&
            wsMessage.message.recipientId === userProfile.id) ||
            (wsMessage.message.senderId === userProfile.id &&
              wsMessage.message.recipientId === userId))
        ) {
          setMessages((prevMessages) => [...prevMessages, wsMessage.message]);
        }
      }
    });

    return () => {
      unsubscribe();
      setActiveChatUser(null);
    };
  }, [userId, subscribe, setActiveChatUser, userProfile]);

  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    };

    scrollToBottom();

    const timeoutId = setTimeout(scrollToBottom, 100);

    return () => clearTimeout(timeoutId);
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !userId || !userProfile?.id) return;

    const tempMessageId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      id: tempMessageId,
      senderId: userProfile.id,
      recipientId: userId,
      text: newMessage,
      createdAt: Date.now(),
    };

    setMessages((prevMessages) => [...prevMessages, tempMessage]);
    setNewMessage('');

    try {
      const response = await mutation('/message', {
        recipientId: userId,
        text: newMessage,
      });

      if (response?.id) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === tempMessageId ? { ...response } : msg,
          ),
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
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

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return <LoadingSpinner />;
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

  if (!userProfile) {
    return (
      <div className="p-4">
        <Card>
          <p>User profile not available. Please try again.</p>
          <Button onClick={handleBack} className="mt-4">
            Back to Messages
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center mb-4  py-2 justify-between sticky top-0 z-20 bg-[color:var(--vscode-editor-background)]">
        <BackBar onBack={handleBack} className="mr-2" />
        {recipientInfo && (
          <div className="flex items-center">
            <img
              src={recipientInfo.avatar}
              alt={`${recipientInfo.username}'s avatar`}
              className="w-8 h-8 rounded-full mr-2"
            />
          </div>
        )}
      </div>

      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto mb-4 space-y-4 pr-1"
      >
        {messageGroups.length === 0 && (
          <div className="flex items-center justify-center h-full text-[color:var(--vscode-descriptionForeground)]">
            <p>No messages yet. Start a conversation!</p>
          </div>
        )}

        {messageGroups.map((group, groupIndex) => {
          const isCurrentUser =
            userProfile.id && group[0].senderId === userProfile.id;

          return (
            <div
              key={`group-${groupIndex}`}
              className={`flex flex-col ${isCurrentUser ? 'items-start' : 'items-end'} mb-4`}
            >
              <div
                className={`max-w-[75%] rounded-lg overflow-hidden ${
                  isCurrentUser
                    ? 'bg-[color:var(--vscode-button-background)]'
                    : 'bg-[color:var(--vscode-editor-inactiveSelectionBackground)]'
                }`}
              >
                {group.map((message, messageIndex) => (
                  <div
                    key={message.id}
                    className={`px-4 py-2 ${messageIndex !== group.length - 1 ? 'pb-1' : ''}`}
                  >
                    <p
                      className={`mb-1 ${
                        isCurrentUser
                          ? 'text-[color:var(--vscode-editor-foreground)]'
                          : 'text-[color:var(--vscode-button-foreground)]'
                      }`}
                    >
                      {message.text}
                    </p>

                    {messageIndex === group.length - 1 && (
                      <div
                        className={`text-xs ${
                          isCurrentUser
                            ? 'text-[color:var(--vscode-descriptionForeground)]'
                            : 'text-[color:var(--vscode-button-foreground)] opacity-70'
                        } text-right`}
                      >
                        {formatTime(message.createdAt)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <input
        type="text"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="Type a message..."
        className="flex-1 p-2 border border-[color:var(--vscode-input-border)] bg-[color:var(--vscode-input-background)] text-[color:var(--vscode-input-foreground)] rounded-l-md focus:outline-none sticky bottom-0 z-20"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
          }
        }}
      />
    </div>
  );
};

export default Conversation;
