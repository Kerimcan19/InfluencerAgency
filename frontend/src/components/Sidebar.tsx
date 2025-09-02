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
  Building2,
  Settings
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLang, translations } from '../contexts/LangContext';
import { Page } from '../App';

interface SidebarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  isOpen: boolean;
  onToggle: () => void;
  onLogout: () => void;
  allowedPages: Page[];
}
const navigation = [
  { name: 'Dashboard', id: 'dashboard', icon: BarChart3 },
  { name: 'Campaigns', id: 'campaigns', icon: Target },
  { name: 'Reports', id: 'reports', icon: FileText },
  { name: 'GenerateLink', id: 'generate-link', icon: Link2 },
  { name: 'Companies', id: 'companies', icon: Building2, requiresAdmin: true },
  { name: 'Influencers', id: 'influencers', icon: TrendingUp, requiresAdmin: true },
  { name: 'Settings', id: 'settings', icon: Settings },
];

export function Sidebar({ currentPage, onPageChange, isOpen, onToggle, onLogout, allowedPages }: SidebarProps) {
  const { user } = useAuth();
  const { lang, setLang } = useLang();
  const t = (key: string) => translations[lang][key] || key;
  const visibleLinks = navigation.filter(item => allowedPages.includes(item.id as Page));
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
            {visibleLinks.map(item => {
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
                  {t(item.name)}
                </button>
              );
            })}
          </nav>

          {/* Language Switcher */}
          <div className="px-4 pb-2">
            <button
              onClick={() => setLang(lang === 'en' ? 'tr' : 'en')}
              className="w-full rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border border-slate-700 mb-2"
            >
              {lang === 'en' ? t('Turkish') : t('English')}
            </button>
          </div>

          {/* Logout */}
          <div className="px-4 pb-6">
            <button
              onClick={onLogout}
              className="group flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              {t('Logout')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}