import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { ReportsPage } from './pages/ReportsPage';
import { GenerateLinkPage } from './pages/GenerateLinkPage';
import { Toast } from './components/Toast';
import { useToast } from './hooks/useToast';
import { useAuth } from './contexts/AuthContext';
import  CompaniesPage  from './pages/CompaniesPage';
import InfluencersPage from './pages/InfluencersPage';

type Page = 'dashboard' | 'campaigns' | 'reports' | 'generate-link' | 'companies' | 'influencers';


function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toasts, addToast, removeToast } = useToast();
  const { token, login, logout } = useAuth();

  const handleLogin = (token: string) => {
    login(token); // stores token in localStorage
    addToast('Welcome back! Successfully logged in.', 'success');
  };

  const handleLogout = () => {
    logout(); // clears token
    setCurrentPage('dashboard');
    addToast('Successfully logged out.', 'success');
  };

  if (!token) {
    return (
      <>
        <LoginPage onLogin={handleLogin} />
        <Toast toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onAddToast={addToast} />;
      case 'campaigns':
        return <CampaignsPage onAddToast={addToast} />;
      case 'reports':
        return <ReportsPage onAddToast={addToast} />;
      case 'generate-link':
        return <GenerateLinkPage onAddToast={addToast} />;
      case 'companies':
        return <CompaniesPage />;
      case 'influencers':
        return <InfluencersPage />;
      default:
        return <DashboardPage onAddToast={addToast} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onLogout={handleLogout}
      />

      <div className="lg:pl-64">
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {renderPage()}
          </div>
        </main>
      </div>

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default App;
