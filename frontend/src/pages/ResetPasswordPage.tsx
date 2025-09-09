import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { apiClient } from "../services/api";
import { useLang, translations } from "../contexts/LangContext";
import { TrendingUp, Eye, EyeOff } from 'lucide-react';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);
  const [loading, setLoading] = useState(false);
  const { lang } = useLang();
  const t = (key: string) => translations[lang][key] || key;
  const [entered, setEntered] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setMessageType(null);

    if (!newPassword || !confirmPassword) {
      setMessage(t("PleaseFillAllFields"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage(t("PasswordsDoNotMatch"));
      return;
    }
    setLoading(true);
    try {
      await apiClient.post("/reset-password", {
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setMessage(t("PasswordResetSuccess"));
      setMessageType("success");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err: any) {
      setMessage(err.response?.data?.detail || t("ErrorResettingPassword"));
      setMessageType("error");
    } finally {
      setLoading(false);
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

      <form
        className={`bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl w-full max-w-md rounded-2xl p-8 transform transition-all duration-700 ease-out ${
          entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        }`}
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl mb-4 font-bold text-slate-900">{t("ResetPasswordTitle")}</h2>
        {message && (
          <div
            className={`mb-4 text-sm px-3 py-2 rounded border ${
              messageType === 'success'
                ? 'bg-green-50 text-green-700 border-green-100'
                : 'bg-red-50 text-red-700 border-red-100'
            }`}
          >
            {message}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                placeholder={t("NewPassword")}
                className="w-full p-2 pr-10 rounded-xl border border-slate-200 bg-white/80 placeholder-gray-400 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 sm:text-sm"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                onClick={() => setShowNewPassword((v) => !v)}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>
          <div>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder={t("ConfirmPassword")}
                className="w-full p-2 pr-10 rounded-xl border border-slate-200 bg-white/80 placeholder-gray-400 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 sm:text-sm"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                onClick={() => setShowConfirmPassword((v) => !v)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </div>
        <button
          type="submit"
          className="mt-6 w-full rounded-xl bg-gradient-to-tr from-purple-600 to-fuchsia-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:from-purple-500 hover:to-fuchsia-500 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? t("Resetting") : t("ResetPassword")}
        </button>

        <button
          type="button"
          className="mt-2 w-full rounded-xl bg-gray-100 text-gray-800 px-4 py-2 text-sm hover:bg-gray-200 transition-colors"
          onClick={() => navigate(-1)}
        >
          {t("Back")}
        </button>
      </form>
    </div>
  );
};

export default ResetPasswordPage;