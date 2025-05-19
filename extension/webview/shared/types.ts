// Common types for the application
export type Page =
  | 'sidebar'
  | 'profile'
  | 'explore'
  | 'messages'
  | 'conversation'
  | 'profile-form'
  | 'loading';

// Legacy CommonProps - will be deprecated in favor of using the AppContext
export interface CommonProps {
  vscode: {
    postMessage: (message: any) => void;
    getState: () => any;
    setState: (state: any) => void;
  };
  onPageChange?: (page: Page, params?: any) => void;
}
