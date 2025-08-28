import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/api';
import { useLang, translations } from '../contexts/LangContext';

interface SettingsPageProps {
  onAddToast: (message: string, type: 'success' | 'error' | 'warning') => void;
}

export function SettingsPage({ onAddToast }: SettingsPageProps) {
  const { user } = useAuth();
  const { lang } = useLang();
  const t = (key: string) => translations[lang][key] || key;

  const [form, setForm] = useState({
    display_name: user?.user?.display_name || '',
    email: user?.user?.email || '',
    phone: user?.user?.phone || '',
    password: '',
    confirmPassword: '',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password && form.password !== form.confirmPassword) {
      onAddToast('Passwords do not match', 'warning');
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        display_name: form.display_name,
        email: form.email,
        phone: form.phone,
      };
      if (form.password) payload.password = form.password;
      // Adjust endpoint as needed
      const res = await apiClient.post('/users/update-profile', payload);
      if (res.data?.isSuccess) {
        onAddToast('Profile updated successfully', 'success');
      } else {
        onAddToast(res.data?.message || 'Update failed', 'error');
      }
    } catch (err: any) {
      onAddToast(err?.message || 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('Settings')}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('UpdateProfile')}
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-lg shadow p-6 max-w-xl space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('DisplayName')}</label>
          <input
            name="display_name"
            value={form.display_name}
            onChange={handleChange}
            className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('Email')}</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('Phone')}</label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('NewPassword')}</label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('ConfirmPassword')}</label>
          <input
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors disabled:opacity-60"
          >
            {saving ? t('Saving') : t('SaveChanges')}
          </button>
        </div>
      </form>
    </div>
  );
}