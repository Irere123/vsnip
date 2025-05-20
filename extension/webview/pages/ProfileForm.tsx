import { useEffect, useState } from 'react';
import Button from '../components/Button';
import TextField from '../components/TextField';
import LoadingSpinner from '../components/LoadingSpinner';
import { query, mutation } from '../shared/api';
import type { Page } from '../shared/types';

interface ProfileFormProps {
  vscode: {
    postMessage: (message: any) => void;
    getState: () => any;
    setState: (state: any) => void;
  };
  onPageChange?: (page: Page, params?: Record<string, any>) => void;
}

interface ProfileFormData {
  username: string;
  email: string;
  avatar: string;
}

const ProfileForm = ({ vscode, onPageChange }: ProfileFormProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    username: '',
    email: '',
    avatar: '',
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const resp = await query('/me');
        setFormData({
          username: resp.user.username,
          email: resp.user.email,
          avatar: resp.user.avatar,
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    setIsSaving(true);

    try {
      await mutation('/user', formData, { method: 'PUT' });

      vscode.postMessage({
        type: 'onInfo',
        value: 'Profile updated successfully!',
      });

      if (onPageChange) {
        onPageChange('profile');
      } else {
        vscode.postMessage({
          type: 'changeView',
          view: 'profile',
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      vscode.postMessage({
        type: 'onError',
        value: 'Failed to update profile. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (onPageChange) {
      onPageChange('profile');
    } else {
      vscode.postMessage({
        type: 'changeView',
        view: 'profile',
      });
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-6">Edit Profile</h1>

      <div className="space-y-6">
        <div>
          <label className="block mb-2 font-medium">Username</label>
          <TextField
            value={formData.username}
            onChange={(value) => handleInputChange('username', value)}
            placeholder="Enter username"
            ariaLabel="Username"
            className="w-full"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">Email</label>
          <TextField
            value={formData.email}
            onChange={(value) => handleInputChange('email', value)}
            placeholder="Enter email"
            ariaLabel="Email"
            className="w-full"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">Avatar URL</label>
          <TextField
            value={formData.avatar}
            onChange={(value) => handleInputChange('avatar', value)}
            placeholder="Enter avatar URL"
            ariaLabel="Avatar URL"
            className="w-full"
          />
        </div>

        {formData.avatar && (
          <div className="flex justify-center my-4">
            <img
              src={formData.avatar}
              alt="Avatar preview"
              className="w-24 h-24 rounded-full border-2 border-[color:var(--vscode-button-background)]"
            />
          </div>
        )}

        <div className="flex flex-grow space-x-3 pt-4">
          <Button onClick={handleSubmit} disabled={isSaving} className="flex-1">
            {isSaving ? 'Saving...' : 'Save Profile'}
          </Button>
          <Button
            appearance="secondary"
            onClick={handleCancel}
            disabled={isSaving}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;
