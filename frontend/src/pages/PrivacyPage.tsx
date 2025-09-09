import React from "react";
import { useNavigate } from "react-router-dom";

const PrivacyPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 px-6 py-12">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-3xl font-bold text-slate-900">Gizlilik Politikası</h1>
        <p className="mt-3 text-slate-600">
          Gizliliğiniz bizim için önemlidir. Bu sayfa, Qubeagency hizmetlerini kullanırken verilerinizin nasıl toplandığını,
          saklandığını ve işlendiğini açıklar.
        </p>
        <div className="mt-6 space-y-4 text-slate-700">
          <p>• Toplanan veriler yalnızca hizmeti sunmak ve geliştirmek amacıyla kullanılır.</p>
          <p>• Verileriniz sözleşme kapsamında gerekli olduğunda sınırlı şekilde üçüncü taraflarla paylaşılabilir.</p>
          <p>• İstediğiniz zaman verilerinizin silinmesini talep edebilirsiniz.</p>
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

export default PrivacyPage;
