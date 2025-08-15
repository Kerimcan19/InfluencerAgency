import React from 'react';
import { 
  BarChart3, 
  Target, 
  FileText, 
  Link2, 
  LogOut, 
  Menu, 
  X,
  TrendingUp, 
  Building2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: 'dashboard' | 'campaigns' | 'reports' | 'generate-link' | 'companies' | 'influencers') => void;
  isOpen: boolean;
  onToggle: () => void;
  onLogout: () => void;
}
const navigation = [
  { name: 'Dashboard', id: 'dashboard', icon: BarChart3 },
  { name: 'Campaigns', id: 'campaigns', icon: Target },
  { name: 'Reports', id: 'reports', icon: FileText },
  { name: 'Generate Link', id: 'generate-link', icon: Link2 },
  { name: 'Şirketler', id: 'companies', icon: Building2, requiresAdmin: true },
  { name: 'Influencerlar', id: 'influencers', icon: TrendingUp, requiresAdmin: true },
];



export function Sidebar({ currentPage, onPageChange, isOpen, onToggle, onLogout }: SidebarProps) {
  const { user } = useAuth();
  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 z-50 p-4">
        <button
          onClick={onToggle}
          className="rounded-md bg-slate-800 p-2 text-white hover:bg-slate-700 transition-colors"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-gray-600 bg-opacity-75"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-800 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center px-6 bg-slate-900">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-purple-600 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Qubeagency</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.filter(item => !item.requiresAdmin || user?.role === 'admin').map(item =>  {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    onPageChange(item.id as any);
                    onToggle();
                  }}
                  className={`
                    group flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors
                    ${isActive
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }
                  `}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="px-4 pb-6">
            <button
              onClick={onLogout}
              className="group flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
}