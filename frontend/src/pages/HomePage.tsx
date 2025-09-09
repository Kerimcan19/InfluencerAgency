import React from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp } from "lucide-react";

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 scroll-smooth">
      {/* Nav */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-purple-600 rounded-lg shadow-sm">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800">Qubeagency</span>
          </div>
          <nav className="flex items-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="ml-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow hover:from-purple-500 hover:to-fuchsia-500 transition-all"
            >
              Giriş Yap
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 bg-purple-300/40 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 bg-fuchsia-300/40 rounded-full blur-3xl" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">
                Affiliate kampanyalarınızı akıllı şekilde yönetin
              </h1>
              <p className="mt-4 text-lg text-slate-600">
                Performansı artırın, bağlantıları otomatikleştirin ve gerçek zamanlı içgörülerle ROI’nizi maksimize edin.
              </p>
              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => navigate('/login')}
                  className="rounded-xl bg-slate-900 text-white px-5 py-3 text-sm font-semibold shadow hover:bg-slate-800 transition-colors"
                >
                  Hemen Başla
                </button>
                
              </div>
              <div className="mt-8 flex items-center gap-6 text-slate-500 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  Gerçek zamanlı raporlar
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full" />
                  Otomatik link yönetimi
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-xl shadow-xl p-6">
                <div className="h-64 md:h-80 bg-gradient-to-br from-purple-600/10 to-fuchsia-600/10 rounded-xl border border-slate-100 flex items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center shadow-md mb-4">
                      <TrendingUp className="h-7 w-7 text-white" />
                    </div>
                    <p className="text-slate-700 font-semibold">Akıllı Performans Panosu</p>
                    <p className="text-slate-500 text-sm mt-1">Kârlılığı artıran içgörüler</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      

      {/* How It Works */}
      <section id="how" className="py-14 md:py-20 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-xs font-semibold text-slate-500">Adım 1</div>
              <h3 className="mt-1 font-semibold text-slate-900">Hesabını Oluştur</h3>
              <p className="mt-2 text-sm text-slate-600">Kampanya hedeflerini belirleyip marka/rol seçimini yap.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-xs font-semibold text-slate-500">Adım 2</div>
              <h3 className="mt-1 font-semibold text-slate-900">Linklerini Üret</h3>
              <p className="mt-2 text-sm text-slate-600">Affiliate linklerini otomatik oluştur ve paylaş.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-xs font-semibold text-slate-500">Adım 3</div>
              <h3 className="mt-1 font-semibold text-slate-900">Performansı Ölç</h3>
              <p className="mt-2 text-sm text-slate-600">Gerçek zamanlı raporlarla geliri ve ROI’yi takip et.</p>
            </div>
          </div>
        </div>
      </section>

      

      {/* Features */}
      <section id="features" className="py-14 md:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-slate-900">Gerçek Zamanlı Analitik</h3>
              <p className="mt-2 text-sm text-slate-600">Kampanyalarınızı anlık verilerle takip edin, hızlı karar verin.</p>
            </div>
            <div className="rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-slate-900">Otomatik Link Yönetimi</h3>
              <p className="mt-2 text-sm text-slate-600">Affiliate linklerinizi otomatik oluşturun ve yönetin.</p>
            </div>
            <div className="rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-slate-900">Gelişmiş Raporlama</h3>
              <p className="mt-2 text-sm text-slate-600">Performans ve ROI’yi ölçen detaylı raporlar.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="border-t border-slate-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-slate-500 text-sm">© {new Date().getFullYear()} Qubeagency. Tüm hakları saklıdır.</div>
          <div className="flex items-center gap-4 text-sm">
            <button
              onClick={() => navigate('/login')}
              className="rounded-lg border border-slate-300 px-3 py-2 text-slate-700 hover:bg-white"
            >
              Giriş Yap
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
