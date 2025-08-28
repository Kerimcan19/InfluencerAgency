import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, MousePointer, DollarSign, Link2, RefreshCw } from 'lucide-react';
import { PerformanceChart } from '../components/PerformanceChart';
import { StatsCard } from '../components/StatsCard';
import { getDashboardActivity, getDashboardSummary, DashboardSummaryResponse, Report, getReports, ActivityOut } from '../services/api';
import type { ChartPoint } from '../components/PerformanceChart';
import { useLang, translations } from '../contexts/LangContext';

interface DashboardPageProps {
  onAddToast: (message: string, type: 'success' | 'error' | 'warning') => void;
}

//const mockStats = [
  //{ title: 'Active Campaigns', value: '24', change: '+12%', icon: TrendingUp, color: 'text-teal-600 bg-teal-50' },
 // { title: 'Total Clicks', value: '45.2K', change: '+8.1%', icon: MousePointer, color: 'text-purple-600 bg-purple-50' },
//  { title: 'Total Sales', value: '$128.4K', change: '+23.5%', icon: DollarSign, color: 'text-green-600 bg-green-50' },
//  { title: 'Commission', value: '$12.8K', change: '+18.2%', icon: Users, color: 'text-blue-600 bg-blue-50' },
//];

export function DashboardPage({ onAddToast }: DashboardPageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardSummaryResponse | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityOut[]>([]);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [chartTotals, setChartTotals] = useState({ sales: 0, clicks: 0, conv: 0 });
  const [selectedRange, setSelectedRange] = useState("Last 30 days");
  const { lang } = useLang();
  const t = (key: string) => translations[lang][key] || key;

  const rangeToDays = (label: string) =>
    label.includes("7") ? 7 : label.includes("90") ? 90 : 30;

  const fmt = (d: Date) =>
    String(d.getDate()).padStart(2, '0') + '.' +
    String(d.getMonth() + 1).padStart(2, '0') + '.' +
    d.getFullYear();

  const buildChartForRange = async (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));

    const reportsRes = await getReports(undefined, fmt(start), fmt(end));
    const rows: Report[] = reportsRes.data || [];

    const toKey = (iso: string) => iso.slice(0, 10);
    const byDay = new Map<string, { sales: number; clicks: number }>();

    for (const r of rows) {
      const key = toKey(r.createdAt);
      const prev = byDay.get(key) || { sales: 0, clicks: 0 };
      byDay.set(key, {
        sales: prev.sales + (Number(r.totalSales) || 0),
        clicks: prev.clicks + (Number(r.totalClicks) || 0),
      });
    }

    const result: ChartPoint[] = [];
    // last 7 days shown; change 6→days-1 if you want the full range shown
    const showDays = 7;
    for (let i = showDays - 1; i >= 0; i--) {
      const d = new Date(end);
      d.setDate(end.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const w = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
      const v = byDay.get(key) || { sales: 0, clicks: 0 };
      result.push({ day: w, sales: v.sales, clicks: v.clicks });
    }

    setChartData(result);

    const totalSalesSum = result.reduce((sum, d) => sum + d.sales, 0);
    const totalClicksSum = result.reduce((sum, d) => sum + d.clicks, 0);
    const conversionRate = totalClicksSum
      ? Number(((totalSalesSum / totalClicksSum) * 100).toFixed(1))
      : 0;
    setChartTotals({ sales: totalSalesSum, clicks: totalClicksSum, conv: conversionRate });
  };
  const fetchDashboardData = async () => {
    try {
      const [summary, activity] = await Promise.all([
        getDashboardSummary(),
        getDashboardActivity(),
      ]);
      setStats(summary);
      setRecentActivity(activity);
    } catch (e) {
      onAddToast('Failed to load dashboard data', 'error');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchDashboardData();
      await buildChartForRange(rangeToDays(selectedRange));
      setIsLoading(false);
    };
    loadData();
  }, []); // keep empty; initial mount  


  useEffect(() => {
    buildChartForRange(rangeToDays(selectedRange));
  }, [selectedRange]);


  const handleRefresh = async () => {
    setIsRefreshing(true);
    setIsLoading(true);
    await Promise.all([
      fetchDashboardData(),
      buildChartForRange(rangeToDays(selectedRange)),
    ]);
    setIsRefreshing(false);
    setIsLoading(false);
  };

  const handleQuickLink = () => {
    onAddToast(t('RedirectingToLinkGenerator'), 'success');
    window.location.assign("/generate-link");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <div className="h-4 bg-gray-200 rounded w-24 mb-4 animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-12 animate-pulse"></div>
            </div>
          ))}
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="h-6 bg-gray-200 rounded w-32 mb-6 animate-pulse"></div>
          <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('DashboardOverview')}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('DashboardDesc')}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {t('Refresh')}
          </button>

        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats && [
          {
            title: t('ActiveCampaigns'),
            value: stats.activeCampaigns.toString(),
            change: '',
            icon: TrendingUp,
            color: 'text-teal-600 bg-teal-50',
          },
          {
            title: t('TotalClicks'),
            value: stats.totalClicks.toLocaleString(),
            change: '',
            icon: MousePointer,
            color: 'text-purple-600 bg-purple-50',
          },
          {
            title: t('TotalSales'),
            value: `${stats.totalSales.toLocaleString()}`,
            change: '',
            icon: DollarSign,
            color: 'text-blue-600 bg-blue-50',
          },
          {
            title: t('TotalCompanyCommission'),
            value: `$${stats.totalCommission.toLocaleString()}`,
            change: '',
            icon: DollarSign,
            color: 'text-green-600 bg-green-50',
          }
        ].map((stat, index) => (
          <StatsCard key={stat.title} stat={stat} delay={index * 100} />
        ))}
      </div>


      {/* Performance Chart */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{t('SalesPerformance')}</h3>
              <p className="text-sm text-gray-500">
                {t('Last30Days')} {t('PerformanceOverview')}
              </p>
            </div>
            <select
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value)}
              className="rounded-lg border-gray-300 text-sm"
            >
              <option>{t('Last30Days')}</option>
              <option>{t('Last7Days')}</option>
              <option>{t('Last90Days')}</option>
            </select>
          </div>
          <PerformanceChart data={chartData} totals={chartTotals} />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('RecentActivity')}</h3>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.label}</p>
                    <p className="text-xs text-gray-500">{activity.type}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(activity.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}