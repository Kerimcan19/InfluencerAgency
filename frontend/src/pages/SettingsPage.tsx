import React, { useState, useEffect } from 'react';
import { Save, User, AtSign, Phone, Globe, Instagram, Youtube } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/api';
import { useLang, translations } from '../contexts/LangContext';

interface SettingsPageProps {
  onAddToast: (message: string, type: 'success' | 'error' | 'warning') => void;
}

export function SettingsPage({ onAddToast }: SettingsPageProps) {
  const { user, refreshUser } = useAuth();
  const { lang } = useLang();
  const t = (key: string) => translations[lang][key] || key;
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    display_name: '',
    email: '',
    phone: '',
    profile_image: '',
    instagram_url: '',
    tiktok_url: '',
    youtube_url: '',
  });
  
  // Pre-populate form when user data is loaded
  useEffect(() => {
    if (user?.info) {
      setFormData({
        display_name: user.info.display_name || '',
        email: user.info.email || '',
        phone: user.info.phone || '',
        profile_image: user.info.profile_image || '',
        instagram_url: user.info.instagram_url || '',
        tiktok_url: user.info.tiktok_url || '',
        youtube_url: user.info.youtube_url || '',
      });
    }
  }, [user]);
  
  // Non-influencer users should be redirected or shown a different UI
  if (user && user.user && user.user.role !== 'influencer') {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-semibold text-gray-700 mb-2">{t('SettingsNotAvailable')}</h1>
        <p className="text-gray-500">{t('AdminContactInfo')}</p>
      </div>
    );
  }
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const response = await apiClient.patch('/update-influencer-profile', formData);
      
      if (response.data && response.data.isSuccess) {
        onAddToast(t('ProfileUpdated'), 'success');
        // Refresh user data to get updated info
        refreshUser();
      } else {
        onAddToast(response.data?.message || t('UpdateFailed'), 'error');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      onAddToast(t('UpdateFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };
  
  // Show loading state while user data is being fetched
  if (!user) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-200 h-10 w-10"></div>
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('ProfileSettings')}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {t('UpdateYourProfile')}
        </p>
      </div>
      
      {/* Profile Form */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-400">
        <div className="px-6 py-4 border-b border-gray-400">
          <h3 className="text-lg font-semibold text-gray-900">{t('YourProfile')}</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info Section */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-700">{t('BasicInfo')}</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Display Name */}
              <div>
                <label htmlFor="display_name" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('DisplayName')}
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="display_name"
                    id="display_name"
                    value={formData.display_name}
                    onChange={handleChange}
                    className="block w-full pl-10 py-2.5 rounded-lg border border-gray-400 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    placeholder={t('YourDisplayName')}
                  />
                </div>
              </div>
              
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('Email')}
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <AtSign className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-10 py-2.5 rounded-lg border border-gray-400 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    placeholder={t('YourEmail')}
                  />
                </div>
              </div>
              
              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('Phone')}
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="phone"
                    id="phone"
                    value={formData.phone || ''}
                    onChange={handleChange}
                    className="block w-full pl-10 py-2.5 rounded-lg border border-gray-400 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    placeholder={t('YourPhone')}
                  />
                </div>
              </div>
              
              {/* Profile Image URL */}
              <div>
                <label htmlFor="profile_image" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('ProfileImageURL')}
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="profile_image"
                    id="profile_image"
                    value={formData.profile_image || ''}
                    onChange={handleChange}
                    className="block w-full pl-10 py-2.5 rounded-lg border border-gray-400 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    placeholder={t('ImageURLPlaceholder')}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Social Media Section */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h4 className="text-md font-medium text-gray-700">{t('SocialMedia')}</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Instagram URL */}
              <div>
                <label htmlFor="instagram_url" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('Instagram')}
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Instagram className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="instagram_url"
                    id="instagram_url"
                    value={formData.instagram_url || ''}
                    onChange={handleChange}
                    className="block w-full pl-10 py-2.5 rounded-lg border border-gray-400 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    placeholder="https://instagram.com/username"
                  />
                </div>
              </div>
              
              {/* TikTok URL */}
              <div>
                <label htmlFor="tiktok_url" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('TikTok')}
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg 
                      viewBox="0 0 24 24" 
                      className="h-4 w-4 text-gray-400"
                      fill="currentColor"
                    >
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    name="tiktok_url"
                    id="tiktok_url"
                    value={formData.tiktok_url || ''}
                    onChange={handleChange}
                    className="block w-full pl-10 py-2.5 rounded-lg border border-gray-400 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    placeholder="https://tiktok.com/@username"
                  />
                </div>
              </div>
              
              {/* YouTube URL */}
              <div>
                <label htmlFor="youtube_url" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('YouTube')}
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Youtube className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="youtube_url"
                    id="youtube_url"
                    value={formData.youtube_url || ''}
                    onChange={handleChange}
                    className="block w-full pl-10 py-2.5 rounded-lg border border-gray-400 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    placeholder="https://youtube.com/c/channelname"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="pt-5 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className={`inline-flex items-center px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
                saving ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? t('Saving') : t('SaveProfile')}
            </button>
          </div>
        </form>
      </div>
      
      {/* Profile Preview */}
      {formData.profile_image && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-gray-400">
          <div className="px-6 py-4 border-b-2 border-gray-400">
            <h3 className="text-lg font-semibold text-gray-900">{t('ProfilePreview')}</h3>
          </div>
          <div className="p-6 flex flex-col items-center">
            <div className="w-36 h-36 rounded-full overflow-hidden mb-4 border-2 border-purple-400 shadow-md">
              <img 
                src={formData.profile_image} 
                alt={formData.display_name} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Replace broken image with placeholder
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Image+Error';
                }}
              />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{formData.display_name}</h3>
            <p className="text-sm text-gray-500 mb-3">{formData.email}</p>
            
            <div className="flex space-x-3 mt-2">
              {formData.instagram_url && (
                <a 
                  href={formData.instagram_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-pink-600 hover:text-pink-700"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {formData.tiktok_url && (
                <a 
                  href={formData.tiktok_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-black hover:text-gray-800"
                  aria-label="TikTok"
                >
                  <svg 
                    viewBox="0 0 24 24" 
                    className="h-5 w-5"
                    fill="currentColor"
                  >
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                  </svg>
                </a>
              )}
              {formData.youtube_url && (
                <a 
                  href={formData.youtube_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-red-600 hover:text-red-700"
                  aria-label="YouTube"
                >
                  <Youtube className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}