import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../services/api";
import { useLang, translations } from "../contexts/LangContext";

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { lang } = useLang();
  const t = (key: string) => translations[lang][key] || key;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!email) {
      setMessage(t("PleaseEnterEmail"));
      return;
    }

    setLoading(true);
    try {
      const { data } = await apiClient.post("/forgot-password", { email });
      setMessage(data?.detail || t("ResetLinkSentIfExists"));
    } catch (err: any) {
      setMessage(err.response?.data?.detail || t("ErrorSendingResetLink"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <form className="bg-white p-8 rounded shadow-md w-full max-w-md" onSubmit={handleSubmit}>
        <h2 className="text-2xl mb-4 font-bold">{t("ForgotPasswordTitle")}</h2>
        {message && <div className="mb-4 text-blue-600">{message}</div>}
        <input
          type="email"
          placeholder={t("Email")}
          className="w-full mb-3 p-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded" disabled={loading}>
          {loading ? t("Sending") : t("SendResetLink")}
        </button>
        <button
          type="button"
          className="w-full mt-2 bg-gray-100 text-gray-800 py-2 rounded"
          onClick={() => navigate(-1)}
        >
          {t("Back")}
        </button>
      </form>
    </div>
  );
};

export default ForgotPasswordPage;
