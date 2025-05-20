import { useEffect } from 'react';
import Sidebar from './pages/Sidebar';
import Explore from './pages/Explore';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import Conversation from './pages/Conversation';
import ProfileForm from './pages/ProfileForm';
import LoadingSpinner from './components/LoadingSpinner';
import { AppProvider, useAppContext } from './context/AppContext';

declare global {
  interface Window {
    view?: string;
    refreshToken?: string;
    accessToken?: string;
    apiBaseUrl?: string;
    vscode?: {
      postMessage: (message: any) => void;
      getState: () => any;
      setState: (state: any) => void;
    };
  }
}

function AppContent() {
  const { page, setPage, viewParams, setViewParams, vscode } = useAppContext();

  useEffect(() => {
    // Set up message handler for view changes
    const messageHandler = (event: MessageEvent) => {
      const message = event.data;

      // Handle view changes
      if (message.command === 'changeView') {
        setPage(message.view);
        // Store any additional parameters
        const params: { [key: string]: any } = {};
        Object.keys(message).forEach((key) => {
          if (key !== 'command' && key !== 'view') {
            params[key] = message[key];
          }
        });
        setViewParams(params);
      }

      // Handle login complete
      if (message.command === 'login-complete') {
        // Change to profile view after login
        setPage('profile');
      }
    };

    window.addEventListener('message', messageHandler);
    return () => {
      window.removeEventListener('message', messageHandler);
    };
  }, [setPage, setViewParams]);

  // Handler for page changes from within components
  const handlePageChange = (
    newPage: string,
    params: Record<string, any> = {},
  ) => {
    setPage(newPage as any);
    setViewParams(params);
  };

  // Render the appropriate component based on the page
  const renderPage = () => {
    switch (page) {
      case 'loading':
        return <LoadingSpinner />;
      case 'explore':
        return <Explore vscode={vscode} onPageChange={handlePageChange} />;
      case 'profile':
        return <Profile vscode={vscode} onPageChange={handlePageChange} />;
      case 'messages':
        return <Messages vscode={vscode} onPageChange={handlePageChange} />;
      case 'conversation':
        return (
          <Conversation
            vscode={vscode}
            userId={viewParams.userId}
            onPageChange={handlePageChange}
          />
        );
      case 'profile-form':
        return <ProfileForm vscode={vscode} onPageChange={handlePageChange} />;
      case 'sidebar':
      default:
        return <Sidebar onPageChange={handlePageChange} />;
    }
  };

  return <div className="app">{renderPage()}</div>;
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
