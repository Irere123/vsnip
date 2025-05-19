import { useEffect, useState } from 'react';
import Button from '../components/Button';
import BackBar from '../components/BackBar';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  type Conversation,
  type ConversationsResponse,
  query,
} from '../shared/api';
import type { Page } from '../shared/types';

interface MessagesProps {
  vscode: {
    postMessage: (message: any) => void;
    getState: () => any;
    setState: (state: any) => void;
  };
  onPageChange?: (page: Page, params?: Record<string, any>) => void;
}

const Messages = ({ vscode, onPageChange }: MessagesProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = (await query(
          '/conversations/100',
        )) as ConversationsResponse;
        setConversations(response.conversations);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        setConversations([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, []);

  const handleConversationClick = (userId: string) => {
    if (onPageChange) {
      onPageChange('conversation', { userId });
    } else {
      vscode.postMessage({
        type: 'changeView',
        view: 'conversation',
        userId,
      });
    }
  };

  const handleBack = () => {
    if (onPageChange) {
      onPageChange('profile');
    } else {
      vscode.postMessage({
        type: 'changeView',
        view: 'profile',
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    // If yesterday, show "Yesterday"
    else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    // Otherwise show date
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return <LoadingSpinner size="large" />;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">Messages</h1>
        <BackBar onBack={handleBack} />
      </div>

      {conversations.length === 0 ? (
        <div className="text-center py-6">
          <p className="mb-4">You don't have any conversations yet.</p>
          <Button
            onClick={() => {
              if (onPageChange) {
                onPageChange('explore');
              } else {
                vscode.postMessage({
                  type: 'changeView',
                  view: 'explore',
                });
              }
            }}
          >
            Explore Users
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conversation) => (
            <div
              key={conversation.conversationId}
              className={`p-3 cursor-pointer hover:bg-[color:var(--vscode-list-hoverBackground)] ${!conversation.read
                ? 'border-l-4 border-[color:var(--vscode-notificationLink-foreground)]'
                : ''
                } rounded-md`}
              onClick={() => handleConversationClick(conversation.userId)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleConversationClick(conversation.userId);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`Conversation with ${conversation.username}`}
            >
              <div className="flex items-center">
                <img
                  src={conversation.avatar}
                  alt={`${conversation.username}'s avatar`}
                  className="w-10 h-10 rounded-full mr-3"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-medium truncate">
                      {conversation.username}
                    </h3>
                    <span className="text-xs text-[color:var(--vscode-descriptionForeground)] ml-2 whitespace-nowrap">
                      {conversation.message
                        ? formatDate(conversation.message.created_at)
                        : formatDate(conversation.created_at)}
                    </span>
                  </div>
                  <p className="truncate text-sm text-[color:var(--vscode-descriptionForeground)]">
                    {conversation.message?.text || 'No messages yet'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Messages;
