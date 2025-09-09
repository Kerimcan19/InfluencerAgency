import React from "react";
import { useNavigate } from "react-router-dom";

const TermsPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 px-6 py-12">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-3xl font-bold text-slate-900">Kullanım Şartları</h1>
        <p className="mt-3 text-slate-600">
          Bu sayfa, Qubeagency hizmetlerinin kullanımına ilişkin şart ve koşulları açıklar.
        </p>
        <div className="mt-6 space-y-4 text-slate-700">
          <p>• Platformu kullanmanız, ilgili tüm politika ve yönergeleri kabul ettiğiniz anlamına gelir.</p>
          <p>• Haksız kullanım, spam veya kötüye kullanım tespit edildiğinde hesap askıya alınabilir.</p>
          <p>• Şartlar zaman zaman güncellenebilir; değişiklikler yayınlandıktan sonra geçerlidir.</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="mt-8 rounded-xl bg-gray-100 text-gray-800 px-4 py-2 text-sm hover:bg-gray-200 transition-colors"
        >
          Geri Dön
        </button>
      </div>
    </div>
  );
};

export default TermsPage;
