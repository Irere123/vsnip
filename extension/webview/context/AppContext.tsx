import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import type { Page } from '../shared/types';

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
}

// Create context with undefined initial value
const AppContext = createContext<AppContextType | undefined>(undefined);

// Function to safely acquire VS Code API only once
const getVsCodeApi = () => {
  // @ts-ignore
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
  // Get VS Code API only once when the component mounts
  const [vscode] = useState(getVsCodeApi());

  // Default state from vscode if available
  const defaultState = vscode.getState() || {};

  // State for tokens and API URL
  const [accessToken, setAccessToken] = useState<string | null>(
    window.accessToken || null,
  );
  const [refreshToken, setRefreshToken] = useState<string | null>(
    window.refreshToken || null,
  );
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(window.apiBaseUrl || '');

  // State for navigation
  const [page, setPage] = useState<Page>(defaultState.page || 'sidebar');
  const [viewParams, setViewParams] = useState<Record<string, any>>(
    defaultState.params || {},
  );

  // Save state to extension storage when it changes
  useEffect(() => {
    const state = { page, params: viewParams };
    vscode.setState(state);
  }, [page, viewParams]);

  // Request tokens from extension on mount
  useEffect(() => {
    vscode.postMessage({ type: 'send-tokens' });

    const messageHandler = (event: MessageEvent) => {
      const message = event.data;

      console.log('message', message);

      if (
        message.command === 'init-tokens' ||
        message.command === 'tokens-updated'
      ) {
        if (message.payload) {
          setAccessToken(message.payload.accessToken || null);
          setRefreshToken(message.payload.refreshToken || null);
          if (message.payload.apiBaseUrl) {
            setApiBaseUrl(message.payload.apiBaseUrl);
          }
        }
      }

      if (message.command === 'login-complete') {
        if (message.payload) {
          setAccessToken(message.payload.accessToken || null);
          setRefreshToken(message.payload.refreshToken || null);
        }
      }

      if (message.command === 'logout-complete') {
        setAccessToken(null);
        setRefreshToken(null);
        setPage('sidebar');
        setViewParams({});
      }
    };

    window.addEventListener('message', messageHandler);
    return () => window.removeEventListener('message', messageHandler);
  }, []);

  const updateTokens = (newAccessToken: string, newRefreshToken: string) => {
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);

    window.accessToken = newAccessToken;
    window.refreshToken = newRefreshToken;

    vscode.postMessage({
      type: 'tokens',
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  };

  const logout = () => {
    setAccessToken(null);
    setRefreshToken(null);

    window.accessToken = undefined;
    window.refreshToken = undefined;

    setPage('sidebar');
    setViewParams({});

    vscode.postMessage({
      type: 'logout',
    });
  };

  return (
    <AppContext.Provider
      value={{
        vscode,
        apiBaseUrl,
        accessToken,
        refreshToken,
        isAuthenticated: !!accessToken,
        updateTokens,
        logout,
        page,
        setPage,
        viewParams,
        setViewParams,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
