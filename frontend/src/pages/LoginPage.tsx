import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, Eye, EyeOff } from 'lucide-react';
import { login } from '../services/api';
import { useLang, translations } from '../contexts/LangContext';

interface LoginPageProps {
  onLogin: (token: string) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
  const { lang } = useLang();
  const t = (key: string) => translations[lang][key] || key;
  const [entered, setEntered] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setMessageType(null);
    setIsLoading(true);
    
    try {
      const response = await login({ username, password });
      if (response.isSuccess && response.data?.accessToken) {
        localStorage.setItem('token', response.data.accessToken);
        onLogin(response.data.accessToken);
        // Ensure immediate navigation after login
        navigate('/app');
      } else {
        setMessage(response.message || t('LoginFailed') || 'Giriş başarısız.');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Bir hata oluştu: ' + (error as any));
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden bg-gradient-to-tl from-slate-900 via-slate-800 to-slate-900 px-6 py-12">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 bg-purple-300/40 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 bg-fuchsia-300/40 rounded-full blur-3xl" />

      {/* Brand */}
      <div className="flex items-center justify-center space-x-3 mb-8">
        <div className="flex items-center justify-center w-12 h-12 bg-purple-600 rounded-xl shadow-md">
          <TrendingUp className="h-7 w-7 text-white" />
        </div>
        <span className="text-3xl font-bold text-white">Qubeagency</span>
      </div>

      <div className="w-full max-w-sm">
        <div
          className={`bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl rounded-2xl p-8 transition-all duration-700 ease-out ${
            entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                {t('WelcomeBack')}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {t('SignInDashboard')}
              </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {message && (
              <div
                className={`text-sm px-3 py-2 rounded border ${
                  messageType === 'success'
                    ? 'bg-green-50 text-green-700 border-green-100'
                    : 'bg-red-50 text-red-700 border-red-100'
                }`}
              >
                {message}
              </div>
            )}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  {t('Username')}
                </label>
                <div className="mt-1">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full appearance-none rounded-xl border border-slate-200 bg-white/80 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 sm:text-sm"
                    placeholder={t('Username')}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  {t('Password')}
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full appearance-none rounded-xl border border-slate-200 bg-white/80 px-3 py-2 pr-10 placeholder-gray-400 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 sm:text-sm"
                    placeholder={t('Password')}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    {t('RememberMe')}
                  </label>
                </div>

                <div className="text-sm">
                  <Link to="/forgot-password" className="font-medium text-purple-600 hover:text-purple-500">
                    {t('ForgotPassword')}
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative flex w-full justify-center rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:from-purple-500 hover:to-fuchsia-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{t('SigningIn')}</span>
                    </div>
                  ) : (
                    t('SignIn')
                  )}
                </button>
                <button
                  type="button"
                  className="mt-2 w-full rounded-xl bg-gray-100 text-gray-800 px-4 py-2 text-sm hover:bg-gray-200 transition-colors"
                  onClick={() => navigate(-1)}
                >
                  {t('Back')}
                </button>
              </div>
            </form>
        </div>
      </div>
    </div>
  );
}