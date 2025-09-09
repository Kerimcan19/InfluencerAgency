import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../services/api";
import { useLang, translations } from "../contexts/LangContext";
import { TrendingUp } from 'lucide-react';


const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { lang } = useLang();
  const t = (key: string) => translations[lang][key] || key;
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    // Trigger entry animation on mount
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setMessageType(null);

    if (!email) {
      setMessage(t("PleaseEnterEmail"));
      setMessageType("error");
      return;
    }

    setLoading(true);
    try {
      await apiClient.post("/forgot-password", { email });
      // Her zaman yerelleştirilmiş Türkçe metni göster
      setMessage(t("ResetLinkSentIfExists"));
      setMessageType("success");
    } catch (err: any) {
      setMessage(err.response?.data?.detail || t("ErrorSendingResetLink"));
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative flex flex-col items-center justify-center min-h-screen overflow-hidden bg-gradient-to-tl from-slate-900 via-slate-800 to-slate-900 px-6 py-12 transition-all duration-700 ease-out ${
      entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
    }`}>
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
        <h2 className="text-2xl mb-4 font-bold text-slate-900">{t("ForgotPasswordTitle")}</h2>
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
        <input
          type="email"
          placeholder={t("Email")}
          className="w-full mb-3 p-2 rounded-xl border border-slate-200 bg-white/80 placeholder-gray-400 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 sm:text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" className="w-full rounded-xl bg-gradient-to-tr from-purple-600 to-fuchsia-600 text-white px-4 py-3 text-sm font-semibold shadow-lg hover:from-purple-500 hover:to-fuchsia-500 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed" disabled={loading}>
          {loading ? t("Sending") : t("SendResetLink")}
        </button>
        <button
          type="button"
          className="w-full mt-2 bg-gray-100 text-gray-800 px-4 py-2 rounded-xl text-sm hover:bg-gray-200 transition-colors"
          onClick={() => navigate(-1)}
        >
          {t("Back")}
        </button>
      </form>
    </div>
  );
};

export default ForgotPasswordPage;

