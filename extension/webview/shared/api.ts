export interface Profile {
  id: string;
  username: string;
  email: string;
  bio: string;
  avatar: string;
}

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  text: string;
  createdAt: number;
}

export interface Conversation {
  conversationId: string;
  username: string;
  avatar: string;
  userId: string;
  read: boolean;
  message: {
    text: string;
    created_at: string;
  } | null;
  created_at: string;
}

export interface FeedResponse {
  profiles: Profile[];
}

export interface ConversationsResponse {
  conversations: Conversation[];
}

export interface MessagesResponse {
  hasMore: boolean;
  messages: Message[];
}

import { useAppContext } from '../context/AppContext';

/**
 * React hook for API access
 */
export const useApi = () => {
  const { vscode, apiBaseUrl, accessToken, refreshToken, updateTokens } =
    useAppContext();

  /**
   * Make a GET request to the API
   */
  const query = async (path: string) => {
    if (!vscode) {
      throw new Error('VS Code API not available');
    }

    if (!apiBaseUrl) {
      throw new Error('API Base URL not available');
    }

    try {
      const r = await fetch(apiBaseUrl + path, {
        headers: {
          'access-token': accessToken || '',
          'refresh-token': refreshToken || '',
        },
      });

      if (r.status !== 200) {
        throw new Error(await r.text());
      }

      const _accessToken = r.headers.get('access-token');
      const _refreshToken = r.headers.get('refresh-token');

      if (_accessToken && _refreshToken) {
        updateTokens(_accessToken, _refreshToken);
      }

      return await r.json();
    } catch (err: any) {
      vscode.postMessage({
        type: 'onError',
        value: err.message,
      });
      throw err;
    }
  };

  /**
   * Make a POST or PUT request to the API
   */
  const mutation = async (
    path: string,
    body: any,
    { method }: { method: 'POST' | 'PUT' } = { method: 'POST' },
  ) => {
    if (!vscode) {
      throw new Error('VS Code API not available');
    }

    if (!apiBaseUrl) {
      throw new Error('API Base URL not available');
    }

    try {
      const r = await fetch(apiBaseUrl + path, {
        method,
        body: JSON.stringify(body),
        headers: {
          'content-type': 'application/json',
          'access-token': accessToken || '',
          'refresh-token': refreshToken || '',
        },
      });

      if (r.status !== 200) {
        throw new Error(await r.text());
      }

      const _accessToken = r.headers.get('access-token');
      const _refreshToken = r.headers.get('refresh-token');

      if (_accessToken && _refreshToken) {
        updateTokens(_accessToken, _refreshToken);
      }

      return await r.json();
    } catch (err: any) {
      vscode.postMessage({
        type: 'onError',
        value: err.message,
      });
      throw err;
    }
  };

  return { query, mutation };
};

/**
 * Legacy functions for backward compatibility
 * These will be deprecated in future versions
 */
export const query = async (path: string) => {
  const vscode = window.vscode;
  const apiBaseUrl = window.apiBaseUrl;
  const accessToken = window.accessToken;
  const refreshToken = window.refreshToken;

  if (!vscode) {
    throw new Error('VS Code API not available');
  }

  try {
    const r = await fetch(apiBaseUrl + path, {
      headers: {
        'access-token': accessToken || '',
        'refresh-token': refreshToken || '',
      },
    });

    if (r.status !== 200) {
      throw new Error(await r.text());
    }

    const _accessToken = r.headers.get('access-token');
    const _refreshToken = r.headers.get('refresh-token');

    if (_accessToken && _refreshToken) {
      window.accessToken = _accessToken;
      window.refreshToken = _refreshToken;

      vscode.postMessage({
        type: 'tokens',
        accessToken: _accessToken,
        refreshToken: _refreshToken,
      });
    }

    return await r.json();
  } catch (err: any) {
    vscode.postMessage({
      type: 'onError',
      value: err.message,
    });
    throw err;
  }
};

export const mutation = async (
  path: string,
  body: any,
  { method }: { method: 'POST' | 'PUT' } = { method: 'POST' },
) => {
  const vscode = window.vscode;
  const apiBaseUrl = window.apiBaseUrl;
  const accessToken = window.accessToken;
  const refreshToken = window.refreshToken;

  if (!vscode) {
    throw new Error('VS Code API not available');
  }

  try {
    const r = await fetch(apiBaseUrl + path, {
      method,
      body: JSON.stringify(body),
      headers: {
        'content-type': 'application/json',
        'access-token': accessToken || '',
        'refresh-token': refreshToken || '',
      },
    });

    if (r.status !== 200) {
      throw new Error(await r.text());
    }

    const _accessToken = r.headers.get('access-token');
    const _refreshToken = r.headers.get('refresh-token');

    if (_accessToken && _refreshToken) {
      window.accessToken = _accessToken;
      window.refreshToken = _refreshToken;

      vscode.postMessage({
        type: 'tokens',
        accessToken: _accessToken,
        refreshToken: _refreshToken,
      });
    }

    return await r.json();
  } catch (err: any) {
    vscode.postMessage({
      type: 'onError',
      value: err.message,
    });
    throw err;
  }
};
