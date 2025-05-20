import { useEffect, useState } from 'react';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { useApi } from '../shared/api';
import { useAppContext } from '../context/AppContext';
import type { Page } from '../shared/types';

interface User {
  id: string;
  username: string;
  avatar: string;
  email: string;
}

interface SidebarProps {
  onPageChange?: (page: Page, params?: Record<string, any>) => void;
}

const Sidebar = ({ onPageChange }: SidebarProps) => {
  const { vscode, isAuthenticated, setPage, logout } = useAppContext();
  const { query } = useApi();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const fetchUser = async () => {
    try {
      const response = await query('/me');
      const userData = response.user || response;
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      if (isAuthenticated) {
        await fetchUser();
      }
      setIsLoading(false);
    };

    loadUserData();
  }, [isAuthenticated]);

  useEffect(() => {
    const messageHandler = async (event: MessageEvent) => {
      const message = event.data;

      switch (message.command) {
        case 'login-complete':
          await fetchUser();
          setIsLoading(false);
          break;
      }
    };

    window.addEventListener('message', messageHandler);
    return () => window.removeEventListener('message', messageHandler);
  }, []);

  const handleNavigate = (page: Page, params: Record<string, any> = {}) => {
    if (onPageChange) {
      onPageChange(page, params);
    } else if (setPage) {
      setPage(page);
    }
  };

  const handleExplore = () => {
    handleNavigate('explore');
  };

  const handleEditProfile = () => {
    handleNavigate('profile-form');
  };

  const handleViewMessages = () => {
    handleNavigate('messages');
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user || !isAuthenticated) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Welcome</h2>
        <p className="mb-6 text-[color:var(--vscode-descriptionForeground)]">
          Please log in to share your code snippets and chat with your peers.
        </p>
        <div className="mb-6">
          <p className="mb-4 text-xs">
            By logging in with Google, you agree to our terms and privacy
            policy.
          </p>
        </div>
        <Button
          onClick={() => {
            console.log('Logging in');
            vscode.postMessage({ type: 'login' });
          }}
        >
          Login with Google
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex flex-col items-center p-6">
        <img
          src={user.avatar}
          alt={user.username}
          className="w-32 h-32 rounded-full mb-4 border-2 border-[color:var(--vscode-button-background)]"
        />

        <h1 className="text-xl font-semibold mb-1">{user.username}</h1>
        <p className="text-sm text-[color:var(--vscode-descriptionForeground)] mb-6">
          {user.email}
        </p>

        <div className="w-full space-y-3">
          <Button onClick={handleEditProfile} className="w-full">
            Edit Profile
          </Button>
          <Button onClick={handleViewMessages} className="w-full">
            Messages
          </Button>
          <Button onClick={handleExplore} className="w-full">
            Explore
          </Button>
          <Button appearance="secondary" onClick={logout} className="w-full">
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
