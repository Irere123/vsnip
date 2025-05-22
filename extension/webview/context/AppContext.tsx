import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react';
import type { Page } from '../shared/types';
import { webSocketManager } from '../shared/websocket';
import { query } from '../shared/api';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AppContextType {
  vscode: any;
  apiBaseUrl: string;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  updateTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  page: Page;
  setPage: (page: Page) => void;
  viewParams: Record<string, any>;
  setViewParams: (params: Record<string, any>) => void;
  userProfile: UserProfile | null;
  isLoadingProfile: boolean;
  refreshUserProfile: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const getVsCodeApi = () => {
  const vscode = window.vscode;
  if (!vscode) {
    console.error('VS Code API not available');
    // Provide fallback for development environments
    return {
      postMessage: (message: any) => console.log('VS Code message:', message),
      getState: () => ({}),
      setState: () => {},
    };
  }

  return vscode;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [vscode] = useState(getVsCodeApi());
  const defaultState = vscode.getState() || {};

  const [accessToken, setAccessToken] = useState<string | null>(
    window.accessToken || null,
  );
  const [refreshToken, setRefreshToken] = useState<string | null>(
    window.refreshToken || null,
  );
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(window.apiBaseUrl || '');
  const [page, setPage] = useState<Page>(defaultState.page || 'sidebar');
  const [viewParams, setViewParams] = useState<Record<string, any>>(
    defaultState.params || {},
  );
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(false);

  const isAuthenticated = useMemo(
    () => !!accessToken && !!refreshToken,
    [accessToken, refreshToken],
  );

  const stableSetPage = useCallback((newPage: Page) => {
    setPage(newPage);
  }, []);

  const stableSetViewParams = useCallback((params: Record<string, any>) => {
    setViewParams(params);
  }, []);

  const refreshUserProfile = useCallback(async () => {
    if (!accessToken || !refreshToken) {
      setUserProfile(null);
      return;
    }
    setIsLoadingProfile(true);
    try {
      const response = await query('/auth/me');
      if (response?.user) {
        setUserProfile(response.user);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserProfile(null);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [accessToken, refreshToken]);

  useEffect(() => {
    const state = { page, params: viewParams };
    vscode.setState(state);
  }, [page, viewParams, vscode]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshUserProfile();
    }
  }, [isAuthenticated, refreshUserProfile]);

  useEffect(() => {
    if (accessToken && refreshToken && apiBaseUrl) {
      webSocketManager.connect(apiBaseUrl, accessToken, refreshToken);
    } else if (!accessToken || !refreshToken) {
      webSocketManager.disconnect();
    }
    // Cleanup on unmount or when dependencies change causing disconnect
    return () => {
      if (!accessToken || !refreshToken) {
        webSocketManager.disconnect();
      }
    };
  }, [accessToken, refreshToken, apiBaseUrl, isAuthenticated]);

  const updateTokens = useCallback(
    (newAccessToken: string, newRefreshToken: string) => {
      setAccessToken(newAccessToken);
      setRefreshToken(newRefreshToken);
      window.accessToken = newAccessToken;
      window.refreshToken = newRefreshToken;
      vscode.postMessage({
        type: 'tokens',
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    },
    [vscode],
  );

  const logout = useCallback(() => {
    setAccessToken(null);
    setRefreshToken(null);
    window.accessToken = undefined;
    window.refreshToken = undefined;
    stableSetPage('sidebar');
    stableSetViewParams({});
    setUserProfile(null);
    webSocketManager.disconnect();
    vscode.postMessage({ type: 'logout' });
  }, [vscode, stableSetPage, stableSetViewParams]);

  useEffect(() => {
    vscode.postMessage({ type: 'send-tokens' });
    const messageHandler = (event: MessageEvent) => {
      const message = event.data;
      if (
        message.command === 'init-tokens' ||
        message.command === 'tokens-updated'
      ) {
        if (message.payload) {
          updateTokens(
            message.payload.accessToken || '',
            message.payload.refreshToken || '',
          );
          if (message.payload.apiBaseUrl) {
            setApiBaseUrl(message.payload.apiBaseUrl);
          }
        }
      } else if (message.command === 'login-complete') {
        if (message.payload) {
          updateTokens(
            message.payload.accessToken || '',
            message.payload.refreshToken || '',
          );
          refreshUserProfile(); // Refresh profile on login
          stableSetPage('profile'); // Navigate to profile page
        }
      } else if (message.command === 'logout-complete') {
        logout();
      }
    };
    window.addEventListener('message', messageHandler);
    return () => window.removeEventListener('message', messageHandler);
  }, [vscode, updateTokens, logout, refreshUserProfile, stableSetPage]);

  const contextValue = useMemo(
    () => ({
      vscode,
      apiBaseUrl,
      accessToken,
      refreshToken,
      isAuthenticated,
      updateTokens,
      logout,
      page,
      setPage: stableSetPage,
      viewParams,
      setViewParams: stableSetViewParams,
      userProfile,
      isLoadingProfile,
      refreshUserProfile,
    }),
    [
      vscode,
      apiBaseUrl,
      accessToken,
      refreshToken,
      isAuthenticated,
      updateTokens,
      logout,
      page,
      stableSetPage,
      viewParams,
      stableSetViewParams,
      userProfile,
      isLoadingProfile,
      refreshUserProfile,
    ],
  );

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
