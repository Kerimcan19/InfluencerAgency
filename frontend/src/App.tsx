import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { ReportsPage } from './pages/ReportsPage';
import { GenerateLinkPage } from './pages/GenerateLinkPage';
import { Toast } from './components/Toast';
import { useToast } from './hooks/useToast';
import { useAuth } from './contexts/AuthContext';
import CompaniesPage from './pages/CompaniesPage';
import InfluencersPage from './pages/InfluencersPage';
import ResetPasswordPage from "./pages/ResetPasswordPage";
import { SettingsPage } from './pages/SettingsPage';



export type Page = 'dashboard' | 'campaigns' | 'reports' | 'generate-link' | 'companies' | 'influencers' | 'settings';

const rolePages: Record<string, Page[]> = {
  admin: ['dashboard', 'campaigns', 'reports', 'generate-link', 'companies', 'influencers', 'settings'],
  company: ['dashboard', 'campaigns', 'reports', 'generate-link', 'settings'],
  influencer: ['campaigns', 'reports', 'settings'],
};

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toasts, addToast, removeToast } = useToast();
  const { token, login, logout } = useAuth();
  const { user } = useAuth();
  const role = user?.user?.role;
  const allowedPages = role ? rolePages[role] : [];

    useEffect(() => {
    if (token && user) {
      if (role === 'influencer') {
        setCurrentPage('reports');
      } else {
        setCurrentPage('dashboard');
      }
    }
  }, [token, user, role]);

  const handleLogin = (token: string) => {
    login(token);
    addToast('Welcome back! Successfully logged in.', 'success');
  };

  const handleLogout = () => {
    logout();
    setCurrentPage('dashboard');
    addToast('Successfully logged out.', 'success');
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/reset-password"
          element={<ResetPasswordPage />}
        />
        <Route
          path="*"
          element={
            !token ? (
              <>
                <LoginPage onLogin={handleLogin} />
                <Toast toasts={toasts} onRemove={removeToast} />
              </>
            ) : (
              <div className="min-h-screen bg-gray-50">
                <Sidebar
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                  isOpen={sidebarOpen}
                  onToggle={() => setSidebarOpen(!sidebarOpen)}
                  onLogout={handleLogout}
                  allowedPages={allowedPages}
                />
                <div className="lg:pl-64">
                  <main className="py-6">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                      {allowedPages.includes(currentPage) ? (
                        (() => {
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
                            case 'settings':
                              return <SettingsPage onAddToast={addToast} />;
                            default:
                              return <DashboardPage onAddToast={addToast} />;
                          }
                        })()
                      ) : (
                        <div className="text-center py-12 text-red-500">Not authorized</div>
                      )}
                    </div>
                  </main>
                </div>
                <Toast toasts={toasts} onRemove={removeToast} />
              </div>
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;