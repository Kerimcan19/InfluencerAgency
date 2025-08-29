import React, { useEffect, useState } from 'react';
import { Download, Filter, TrendingUp, Users, MousePointer } from 'lucide-react';
import { ReportsResponse, Report, mlinkGetReports } from '../services/api';
import { apiClient } from '../services/api';
import { useLang, translations } from '../contexts/LangContext';
import { useAuth } from '../contexts/AuthContext';

interface ReportsPageProps {
  onAddToast: (message: string, type: 'success' | 'error' | 'warning') => void;
}

export function ReportsPage({ onAddToast }: ReportsPageProps) {
  const [dateRange, setDateRange] = useState('30days');
  const [selectedInfluencer, setSelectedInfluencer] = useState('all');
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const token = localStorage.getItem("token");
  const [reportsResponse, setReportsResponse] = useState<ReportsResponse | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const { lang } = useLang();
  const { user } = useAuth(); // Use useAuth for user/role
  const t = (key: string) => translations[lang][key] || key;

  function getDateRangeParams(range: string) {
      const today = new Date();
      let start = new Date();
      switch (range) {
        case '7days':
          start.setDate(today.getDate() - 7);
          break;
        case '30days':
          start.setDate(today.getDate() - 30);
          break;
        case '90days':
          start.setDate(today.getDate() - 90);
          break;
        case 'custom':
          return {
            StartDate: '01.07.2025',  // optional future support
            EndDate: '31.07.2025',
          };
        default:
          start.setDate(today.getDate() - 30);
      }

      const format = (date: Date) =>
      date.toLocaleDateString('tr-TR');  // This already returns DD.MM.YYYY

      return {
        StartDate: format(start),
        EndDate: format(today),
      };
    }

useEffect(() => {
  const fetchReports = async () => {
    setLoading(true);
    try {
      const params: any = {
        ...getDateRangeParams(dateRange),
      };
      if (selectedInfluencer !== 'all') {
        // MLink casing
        params.InfluencerID = selectedInfluencer;
      }

      // mlinkGetReports already returns { data, isSuccess, message, type }
      const payload = await mlinkGetReports(params);

      if (payload.isSuccess) {
        setReportsResponse(payload);
        setInfluencers(payload.data || []);
      } else {
        onAddToast(payload.message || 'Raporlar alınamadı', 'error');
      }
    } catch (error) {
      console.error('API error:', error);
      onAddToast('Raporlar alınırken bir hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  fetchReports();
}, [selectedInfluencer, dateRange]);




const handleExportCSV = async () => {
  try {
    const params: any = { ...getDateRangeParams(dateRange) };
    if (selectedInfluencer !== 'all') params.influencer_id = selectedInfluencer;

    const res = await apiClient.get('/Affiliate/GetReport', {
      params,
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'affiliate-report.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    onAddToast('CSV indirildi.', 'success');
  } catch (err) {
    console.error('CSV export error:', err);
    onAddToast('CSV indirilemedi.', 'error');
  }
};



  // Aggregate influencer stats (sum per influencer, not per report)
  const influencerAggregates = React.useMemo(() => {
    const map = new Map<string, any>();
    for (const r of influencers) {
      const key = r.influencer_id;
      if (!map.has(key)) {
        map.set(key, {
          influencer_id: r.influencer_id,
          influencerName: r.influencerName,
          totalClicks: 0,
          totalSales: 0,
          influencerCommissionAmount: 0,
        });
      }
      const agg = map.get(key);
      agg.totalClicks += Number(r.totalClicks) || 0;
      agg.totalSales += Number(r.totalSales) || 0;
      agg.influencerCommissionAmount += Number(r.influencerCommissionAmount) || 0;
    }
    return Array.from(map.values());
  }, [influencers]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('PerformanceReports')}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('AnalyzePerformance')}
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            {t('ExportCSV')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('DateRange')}
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
            >
              <option value="7days">{t('Last7Days')}</option>
              <option value="30days">{t('Last30Days')}</option>
              <option value="90days">{t('Last90Days')}</option>
              <option value="custom">{t('CustomRange')}</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('Influencer')}
            </label>
            <select
              value={selectedInfluencer}
              onChange={(e) => setSelectedInfluencer(e.target.value)}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
            >
              <option value="all">{t('AllInfluencers')}</option>
              {loading ? (
                <option disabled>{t('Loading')}...</option>
                ) : (
                  influencers.map((report: any) => (
                    <option key={report.influencer_id} value={report.influencer_id}>
                      {report.influencerName}
                    </option>
                  ))
                )}

            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => onAddToast('Filters applied successfully', 'success')}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-4 w-4 mr-2" />
              {t('ApplyFilters')}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-50">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('ActiveInfluencers')}</p>
              <p className="text-2xl font-bold text-gray-900">
                {reportsResponse?.activeInfluencers ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-50">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('TotalInfluencerCommission')}</p>
              <p className="text-2xl font-bold text-gray-900">
                ₺{Number(reportsResponse?.totalInfluencerCommission ?? 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>


      {/* Performance Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{t('InfluencerReports')}</h3>
          <p className="text-sm text-gray-500">{t('DetailedListOfInfluencerReports')}</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed divide-y divide-gray-200">

            <colgroup>
              <col style={{ width: '20%' }} />  {/* Influencer */}
              <col style={{ width: '28%' }} />  {/* Campaign */}
              <col style={{ width: '10%' }} />  {/* Clicks */}
              <col style={{ width: '10%' }} />  {/* Sales */}
              <col style={{ width: '12%' }} />  {/* Conv. Rate */}
              <col style={{ width: '12%' }} />  {/* Commission */}
              <col style={{ width: '8%'  }} />  {/* Actions */}
            </colgroup>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left  text-xs font-medium text-gray-500 uppercase">{t('Influencer')}</th>
                <th className="px-6 py-3 text-left  text-xs font-medium text-gray-500 uppercase">{t('Campaign')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('Clicks')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('Sales')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('ConvRate')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('InfluencerCommission')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('Actions')}</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {influencers.map((r: any) => {
                const conv =
                  r.totalClicks > 0 ? ((r.totalSales / r.totalClicks) * 100).toFixed(2) + '%' : '0.00%';

                return (
                  <tr key={`${r.influencer_id}-${r.campaignId}`} className="hover:bg-gray-50">
                    {/* Influencer (left, with avatar showing first 2 letters) */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-red-500 flex items-center justify-center text-white font-bold uppercase">
                          {r.influencerName
                            ? r.influencerName.slice(0, 2)
                            : '??'}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">
                            {r.influencerName ?? `#${r.influencer_id}`}
                          </div>
                        </div>
                      </div>
                    </td>


                    {/* Campaign (left, blue pill) */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold tracking-tight">
                        {r.campaignName ?? `#${r.campaignId}`}
                      </span>
                    </td>

                    {/* Clicks (RIGHT) */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-sm font-semibold tracking-tight tabular-nums">
                        {r.totalClicks.toLocaleString()}
                      </span>
                    </td>

                    {/* Sales (RIGHT) */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-sm font-semibold tracking-tight tabular-nums">
                        {r.totalSales.toLocaleString()}
                      </span>
                    </td>

                    {/* Conv. Rate (RIGHT, purple) */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold tracking-tight">
                        {conv}
                      </span>
                    </td>

                    {/* Commission (RIGHT, green) */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-sm font-semibold tracking-tight tabular-nums">
                        ₺{Number(r.influencerCommissionAmount ?? 0).toLocaleString()}
                      </span>
                    </td>

                    {/* Actions (RIGHT) */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => { setSelectedReport(r); setDetailsOpen(true); }}
                        className="px-3 py-1.5 rounded-full text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-medium"
                      >
                        {t('Details')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
           {detailsOpen && selectedReport && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              {/* overlay */}
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setDetailsOpen(false)}
              ></div>

              {/* card */}
              <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl ring-1 ring-black/5 overflow-hidden">
                {/* header */}
                <div className="p-8 border-b-2 border-gray-300 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-14 w-14 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold uppercase">
                      {(selectedReport.influencerName ?? "??").slice(0, 2)}
                    </div>
                    <div className="ml-4">
                      <div className="text-lg font-semibold text-gray-900">
                        {selectedReport.influencerName ?? `#${selectedReport.influencer_id}`}
                      </div>
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold tracking-tight">
                          {selectedReport.campaignName ?? `#${selectedReport.campaignId}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setDetailsOpen(false)}
                    className="px-3.5 py-2 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 text-gray-700"
                  >
                    {t('Close')}
                  </button>
                </div>

                {/* body */}
                <div className="p-8 space-y-8">
                  {/* quick stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="rounded-xl border border-gray-300 bg-white shadow-sm px-5 py-4 text-center">
                      <div className="text-sm font-semibold text-gray-600">{t('Clicks')}</div>
                      <div className="mt-2 text-2xl font-bold text-gray-900 tabular-nums">
                        {Number(selectedReport.totalClicks ?? 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="rounded-xl border border-gray-300 bg-white shadow-sm px-5 py-4 text-center">
                      <div className="text-sm font-semibold text-gray-600">{t('Sales')}</div>
                      <div className="mt-2 text-2xl font-bold text-gray-900 tabular-nums">
                        {Number(selectedReport.totalSales ?? 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="rounded-xl border border-gray-300 bg-white shadow-sm px-5 py-4 text-center">
                      <div className="text-sm font-semibold text-gray-600">{t('ConvRate')}</div>
                      <div className="mt-2 text-2xl font-bold text-purple-700">
                        {(
                          Number(selectedReport.totalClicks) > 0
                            ? (Number(selectedReport.totalSales ?? 0) / Number(selectedReport.totalClicks)) * 100
                            : 0
                        ).toFixed(2)}%
                      </div>
                    </div>
                    <div className="rounded-xl border border-gray-300 bg-white shadow-sm px-5 py-4 text-center">
                      <div className="text-sm font-semibold text-gray-600">{t('Commission')}</div>
                      <div className="mt-2 text-2xl font-bold text-green-700 tabular-nums">
                        ₺{Number(selectedReport.influencerCommissionAmount ?? 0).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* amounts & rates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* commission breakdown */}
                    <div className="rounded-xl border border-gray-300 bg-white shadow-sm p-5">
                      <div className="text-center text-base font-bold text-gray-800 mb-4">
                        {t('CommissionBreakdown')}
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">{t('Brand')}</span>
                          <span className="tabular-nums">
                            ₺{Number(selectedReport.brandCommissionAmount ?? 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">{t('Influencer')}</span>
                          <span className="tabular-nums">
                            ₺{Number(selectedReport.influencerCommissionAmount ?? 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">{t('Mimeda')}</span>
                          <span className="tabular-nums">
                            ₺{Number(selectedReport.mimedaCommissionAmount ?? 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">{t('Agency')}</span>
                          <span className="tabular-nums">
                            ₺{Number(selectedReport.agencyCommissionAmount ?? 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* rates */}
                    <div className="rounded-xl border border-gray-300 bg-white shadow-sm p-5">
                      <div className="text-center text-base font-bold text-gray-800 mb-4">
                        {t('Rates')}
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">{t('Brand')}</span>
                          <span className="tabular-nums">{Number(selectedReport.brandCommissionRate ?? 0)}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">{t('Influencer')}</span>
                          <span className="tabular-nums">{Number(selectedReport.influencerCommissionRate ?? 0)}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">{t('Other')}</span>
                          <span className="tabular-nums">{Number(selectedReport.otherCostsRate ?? 0)}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">{t('Mimeda')}</span>
                          <span className="tabular-nums">{Number(selectedReport.mimedaCommissionRate ?? 0)}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">{t('Agency')}</span>
                          <span className="tabular-nums">{Number(selectedReport.agencyCommissionRate ?? 0)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* footer with separator and underlined date */}
                <div className="border-t-2 border-gray-300 px-8 py-6">
                  <div className="text-center">
                    <span className="text-sm font-medium text-gray-700 underline">
                      {selectedReport.createdAt
                        ? `${t('ReportCreatedOn')} ${new Date(selectedReport.createdAt).toLocaleDateString("tr-TR")}`
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}



        </div>
      </div>

      {/* Performance Insights */}
      {user?.user?.role === 'admin' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('PerformanceInsights')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Top Performers */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">{t('TopPerformers')}</h4>
              {[...influencerAggregates]
                .filter(i => i.totalClicks > 0)
                .sort((a, b) => (b.totalSales / b.totalClicks) - (a.totalSales / a.totalClicks))
                .slice(0, 3)
                .map((inf, index) => (
                  <div key={inf.influencer_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium">{inf.influencerName}</span>
                    </div>
                    <span className="text-sm text-green-600 font-medium">
                      {(inf.totalSales / inf.totalClicks * 100).toFixed(2)}%
                    </span>
                  </div>
                ))}
            </div>

            {/* Revenue Leaders */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">{t('RevenueLeaders')}</h4>
              {[...influencerAggregates]
                .sort((a, b) => b.influencerCommissionAmount - a.influencerCommissionAmount)
                .slice(0, 3)
                .map((inf, index) => (
                  <div key={inf.influencer_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        index === 0 ? 'bg-green-500' :
                        index === 1 ? 'bg-blue-500' : 'bg-purple-500'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium">{inf.influencerName}</span>
                    </div>
                    <span className="text-sm text-green-600 font-medium">
                      ₺{inf.influencerCommissionAmount.toLocaleString()}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}