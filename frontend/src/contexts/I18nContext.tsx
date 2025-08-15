import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Lang = 'en' | 'tr';

export const texts = {
  en: {
    Campaigns: 'Campaigns',
    CampaignsTitle: 'Manage your affiliate marketing campaigns and track performance',
    newCampaign: 'New Campaign',
    SearchCampaign: 'Search campaigns...',
    allStatus: 'All Status',
    active: 'Active',
    paused: 'Paused',
    ended: 'Ended',
    grid: 'Grid',
    table: 'Table',
    CampaignName: 'Campaign Name',
    startDate: 'Start Date',
    endDate: 'End Date',
    searchBtn: 'Search',
    viewDetails: 'View Details',
    brandCommissionRate: 'Brand Commission Rate',
    influencerCommissionRate: 'Influencer Commission Rate',
    otherCostsRates: 'Other Cost Rates',
    products: 'Products',
    brandCommission: 'Brand Commission',
    influencerCommission: 'Influencer Commission',
    otherCosts: 'Other Costs',
    endDateLabel: 'End Date',
    loading: 'Loading campaigns...',
    noCampaigns: 'No campaigns found',
    adjust: 'Try adjusting your search or filter criteria',
    tableCampaign: 'Campaign',
    tableStatus: 'Status',
    tableCommission: 'Commission',
    tablePerformance: 'Performance',
    tableRevenue: 'Revenue',
    actions: 'Actions',
    fetchFail: 'Failed to fetch campaigns.',
    error: 'Error occurred: '
  },
  tr: {
    Campaigns: 'Kampanyalar',
    CampaignsTitle: 'Kampanyalarınızı yönetin ve performansı takip edin',
    newCampaign: 'Yeni Kampanya',
    SearchCampaign: 'Kampanya ara...',
    allStatus: 'Tüm Durumlar',
    active: 'Aktif',
    paused: 'Duraklatıldı',
    ended: 'Bitti',
    grid: 'Izgara',
    table: 'Tablo',
    CampaignName: 'Kampanya Adı',
    startDate: 'Başlangıç Tarihi',
    endDate: 'Bitiş Tarihi',
    searchBtn: 'Ara',
    viewDetails: 'Detayları Gör',
    brandCommissionRate: 'Marka Komisyon Oranı',
    influencerCommissionRate: 'Influencer Komisyon Oranı',
    otherCostsRates: 'Diğer Masraf Oranları',
    products: 'Ürünler',
    brandCommission: 'Marka Komisyon',
    influencerCommission: 'Influencer Komisyon',
    otherCosts: 'Diğer Masraflar',
    endDateLabel: 'Bitiş Tarihi',
    loading: 'Kampanyalar yükleniyor...',
    noCampaigns: 'Kampanya bulunamadı',
    adjust: 'Arama veya filtreleri değiştirmeyi deneyin',
    tableCampaign: 'Kampanya',
    tableStatus: 'Durum',
    tableCommission: 'Komisyon',
    tablePerformance: 'Performans',
    tableRevenue: 'Gelir',
    actions: 'İşlemler',
    fetchFail: 'Kampanyalar alınamadı.',
    error: 'Hata oluştu: '
  }
} as const;

type I18nContextType = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: keyof typeof texts['en']) => string;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Lang>('en');
  const t = (key: keyof typeof texts['en']) => texts[lang][key];
  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
};
