import { useEffect, useState } from 'react';
import Button from '../components/Button';
import BackBar from '../components/BackBar';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  type Profile,
  type FeedResponse,
  query,
  mutation,
} from '../shared/api';
import type { CommonProps } from '../shared/types';

interface ExploreProps extends CommonProps { }

const Explore = ({ vscode, onPageChange }: ExploreProps) => {
  const [loadingState, setLoadingState] = useState<'init' | 'ready' | 'more'>(
    'init',
  );
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        // Attempt to fetch real profiles from the API
        const payload = (await query('/feed')) as FeedResponse;
        setProfiles(payload.profiles);
        console.log('profiles', payload.profiles);
      } catch (error) {
        // If the API call fails, use mock data for development
        console.error('Error fetching profiles:', error);
        setProfiles([]);
      } finally {
        setLoadingState('ready');
      }
    };

    fetchProfiles();
  }, []);

  const handleMessageUser = async (userId: string) => {
    try {
      await mutation('/conversation', { userId });

      if (onPageChange) {
        onPageChange('conversation', { userId });
      } else {
        vscode.postMessage({
          type: 'changeView',
          view: 'conversation',
          userId,
        });
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      vscode.postMessage({
        type: 'onError',
        value: 'Failed to start conversation. Please try again.',
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

  if (loadingState === 'init') {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Explore</h2>
        <BackBar onBack={handleBack} />
      </div>

      <div className="space-y-4">
        {profiles.map((profile) => (
          <div
            key={profile.id}
            className="user-card p-4 border border-[color:var(--vscode-input-border)] rounded-md"
          >
            <div className="flex items-center gap-4">
              <img
                src={profile.avatar}
                alt={`${profile.username}'s profile`}
                className="w-12 h-12 rounded-full"
                width="50"
                height="50"
              />
              <div className="flex-1">
                <p className="font-medium">{profile.username}</p>
                <p className="text-sm text-[color:var(--vscode-descriptionForeground)]">
                  {profile.bio || 'No bio provided'}
                </p>
              </div>
              <Button onClick={() => handleMessageUser(profile.id)}>
                Message
              </Button>
            </div>
          </div>
        ))}

        {profiles.length === 0 && (
          <div className="text-center py-8">
            <p>No profiles found. Connect with people in your community.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;
