import { useEffect, useState } from 'react';
import Button from '../components/Button';
import ExploreIcon from '../components/ExploreIcon';
import LoadingSpinner from '../components/LoadingSpinner';
import { query } from '../shared/api';
import type { Page } from '../shared/types';

interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  createdAt: string;
  updatedAt: string;
}

interface ProfileProps {
  vscode: {
    postMessage: (message: any) => void;
    getState: () => any;
    setState: (state: any) => void;
  };
  onPageChange?: (page: Page, params?: Record<string, any>) => void;
}

const Profile = ({ vscode, onPageChange }: ProfileProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const resp = await query('/me');
        setUser(resp.user);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleEditProfile = () => {
    if (onPageChange) {
      onPageChange('profile-form');
    } else {
      vscode.postMessage({
        type: 'changeView',
        view: 'profile-form',
      });
    }
  };

  const handleViewMessages = () => {
    if (onPageChange) {
      onPageChange('messages');
    } else {
      vscode.postMessage({
        type: 'changeView',
        view: 'messages',
      });
    }
  };

  const handleExplore = () => {
    if (onPageChange) {
      onPageChange('explore');
    } else {
      vscode.postMessage({
        type: 'explore',
      });
    }
  };

  const handleLogout = () => {
    vscode.postMessage({
      type: 'logout',
    });
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <div className="p-4">
        <div className="text-center py-6">
          <p className="mb-4">Unable to load profile. Please try again.</p>
          <Button onClick={() => window.location.reload()}>Refresh</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <ExploreIcon onClick={handleExplore} />
        <button type='button' onClick={() => {
          setIsFullScreen(!isFullScreen)
          vscode.postMessage({
            type: "full-screen"
          })
        }}>{!isFullScreen ? "Fullscreen" : "Minimize"}</button>
      </div>

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
          <Button
            appearance="secondary"
            onClick={handleLogout}
            className="w-full"
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
