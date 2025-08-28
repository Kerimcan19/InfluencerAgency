import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Filter, Plus, Eye, MoreHorizontal, Loader2 } from 'lucide-react';
import { getCampaigns, Campaign, mlinkGetCampaigns } from '../services/api';
import { useLang, translations } from '../contexts/LangContext';
import { apiClient } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface CampaignsPageProps {
  onAddToast: (message: string, type: 'success' | 'error' | 'warning') => void;
}
const toMlinkDate = (iso?: string) => {
  if (!iso) return undefined;
  const [y, m, d] = iso.split('-'); // "YYYY-MM-DD"
  if (!y || !m || !d) return undefined;
  return `${d}.${m}.${y}`;          // "DD.MM.YYYY"
};

export function CampaignsPage({ onAddToast }: CampaignsPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const { lang, setLang } = useLang();
  const t = (key: string) => translations[lang][key] || key;
  const { user } = useAuth() as any;
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [companies, setCompanies] = useState<Array<{ id: number; name: string }>>([]);

  const [createForm, setCreateForm] = useState({
        name: '',
        brief: '',
        brandingImage: '',
        brandCommissionRate: '',
        influencerCommissionRate: '',
        otherCostsRate: '',
        endDate: '',
        company_id: '', // we'll set this via the combobox
      });

      const openCreate = async () => {
      setCreateForm({
        name: '',
        brief: '',
        brandingImage: '',
        brandCommissionRate: '',
        influencerCommissionRate: '',
        otherCostsRate: '',
        endDate: '',
        company_id: '',
      });
      try {
        const r = await apiClient.get('/admin/list_companies');
        if (r.data?.isSuccess) {
          setCompanies((r.data.data || []).map((c: any) => ({ id: c.id, name: c.name })));
        }
      } catch {}
      setCreateOpen(true);
    };
    
    const submitCreate = async () => {
  if (!createForm.name || !createForm.endDate || !createForm.company_id) {
    onAddToast('Name, End Date ve Company zorunlu', 'warning');
    return;
  }
  setCreating(true);
  try {
    const payload = {
      name: createForm.name.trim(),
      brief: createForm.brief || '',
      brandingImage: createForm.brandingImage || '',
      brandCommissionRate: parseFloat(createForm.brandCommissionRate || '0'),
      influencerCommissionRate: parseFloat(createForm.influencerCommissionRate || '0'),
      otherCostsRate: parseFloat(createForm.otherCostsRate || '0'),
      endDate: createForm.endDate,            // "YYYY-MM-DD" (backend schema accepts datetime)
      company_id: Number(createForm.company_id),
    };

    const res = await apiClient.post('/admin/add-campaign', payload);
    if (res.data?.isSuccess) {
      onAddToast('Campaign created', 'success');
      setCreateOpen(false);
      await fetchCampaigns();
    } else {
      onAddToast(res.data?.message || 'Failed to create campaign', 'error');
    }
  } catch (e: any) {
    const msg = e?.response?.data?.detail || e?.message || 'Error while creating campaign';
    onAddToast(msg, 'error');
  } finally {
    setCreating(false);
  }
};


  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all'; 
    return matchesSearch && matchesStatus;
  });


  const handleViewDetails = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
  };

  const fetchCampaigns = async () => {
  setLoading(true);
  try {
    const response = await mlinkGetCampaigns({
        Name: name || undefined,
        StartDate: startDate || undefined,
        EndDate: endDate || undefined
      });;
    if (response.isSuccess) {
      setCampaigns(response.data);
    } else {
      alert(response.message || 'Kampanyalar alınamadı');
    }
  } catch (err) {
    alert('Hata oluştu: ' + err);
  } finally {
    setLoading(false);
  }
};

    useEffect(() => {
      fetchCampaigns();
    }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('Campaigns')}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('CampaignsTitle')}
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          {user?.role === 'admin' && (
            <button onClick={openCreate} className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors">
              <Plus className="h-4 w-4 mr-2" /> {t('NewCampaign')}
            </button>
          )}
          <div className="mb-4 flex justify-end">

          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder= {t('SearchCampaign')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border-gray-300 text-sm focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">{t('AllStatus')}</option>
              <option value="active">{t('Active')}</option>
              <option value="paused">{t('Paused')}</option>
              <option value="ended">{t('Ended')}</option>
            </select>
            
            <div className="flex rounded-lg border border-gray-300">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 text-sm rounded-l-lg ${
                  viewMode === 'grid' ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t('Grid')}
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 text-sm rounded-r-lg border-l border-gray-300 ${
                  viewMode === 'table' ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t('Table')}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 mb-6">
          <input
            type="text"
            placeholder={t('CampaignName')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-3 py-2 border rounded-md w-60"
          />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
          <button
            onClick={fetchCampaigns}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {t('Search')}
          </button>
        </div>
      {/* Campaigns List */}
      {loading && (
            <div className="bg-white rounded-lg shadow p-8 flex items-center gap-3 text-gray-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>{t('loading')}</span>
            </div>
          )}

      {selectedCampaign && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-lg p-6 relative">
              <button
                onClick={() => setSelectedCampaign(null)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
              <h2 className="text-xl font-bold text-gray-800 mb-2">{selectedCampaign.name}</h2>
              <p className="text-gray-600 mb-4">{selectedCampaign.brief}</p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-gray-500 text-sm">{t('BrandCommission')}:</span>
                  <div className="text-purple-700 font-semibold">{selectedCampaign.brandCommissionRate}%</div>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">{t('InfluencerCommission')}:</span>
                  <div className="text-green-600 font-semibold">{selectedCampaign.influencerCommissionRate}%</div>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">{t('OtherCosts')}:</span>
                  <div className="font-semibold">{selectedCampaign.otherCostsRate}%</div>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">{t('EndDate')}:</span>
                  <div className="font-semibold">{selectedCampaign.endDate}</div>
                </div>
              </div>

              <h3 className="text-md font-semibold mb-2 text-gray-700">{t('Products')}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {selectedCampaign.products.map((product, idx) => (
                  <div key={idx} className="border rounded-lg overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-2 text-sm text-gray-700">{product.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign, index) => (
            <div
              key={campaign.id}
              className="bg-white rounded-lg shadow hover:shadow-md transition-all duration-200 overflow-hidden animate-in fade-in-0 slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="aspect-w-16 aspect-h-9">
                <img
                src={campaign.brandingImage}
                className="w-full h-48 object-cover rounded-t-lg"
                alt={campaign.name}
              />
              </div>
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {campaign.name}
                  </h3>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t('BrandCommissionRate')}:</span>
                    <span className="font-medium text-purple-600">{campaign.brandCommissionRate}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t('InfluencerCommissionRate')}:</span>
                    <span className="font-medium text-green-600">{campaign.influencerCommissionRate}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t('OtherCostsRate')}:</span>
                    <span className="font-medium">{campaign.otherCostsRate}%</span>
                  </div>
                </div>
                
                <button
                  onClick={() => handleViewDetails(campaign)}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-purple-300 rounded-lg text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {t('ViewDetails')}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('Campaign')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('Status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('Commission')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('Performance')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('Revenue')}
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">{t('Actions')}</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCampaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                     <img
                      src={campaign.brandingImage}
                      className="w-full h-48 object-cover rounded-t-lg"
                      alt={campaign.name}
                    />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {campaign.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {campaign.endDate}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-medium">
                    {campaign.brandCommissionRate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    {campaign.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewDetails(campaign)}
                      className="text-purple-600 hover:text-purple-900"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {createOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-lg">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-lg font-semibold">{t('CreateCampaign')}</h2>
              <button onClick={() => setCreateOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl">✕</button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-sm">{t('Name')} *</span>
                <input
                  value={createForm.name}
                  onChange={(e) => setCreateForm(f => ({ ...f, name: e.target.value }))}
                  className="rounded-lg border px-3 py-2"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm">{t('Company')} *</span>
                <CompanySelect
                  items={companies} // [{ id, name }]
                  value={createForm.company_id ? Number(createForm.company_id) : null}
                  onChange={(id) => setCreateForm(f => ({ ...f, company_id: id ? String(id) : '' }))}
                  placeholder={t('SearchCompanyName')}
                />
              </label>

              <label className="flex flex-col gap-1 md:col-span-2">
                <span className="text-sm">{t('Brief')}</span>
                <textarea
                  rows={3}
                  value={createForm.brief}
                  onChange={(e) => setCreateForm(f => ({ ...f, brief: e.target.value }))}
                  className="rounded-lg border px-3 py-2"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm">{t('BrandingImageURL')}</span>
                <input
                  value={createForm.brandingImage}
                  onChange={(e) => setCreateForm(f => ({ ...f, brandingImage: e.target.value }))}
                  className="rounded-lg border px-3 py-2"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm">{t('EndDate')} *</span>
                <input
                  type="date"
                  value={createForm.endDate}
                  onChange={(e) => setCreateForm(f => ({ ...f, endDate: e.target.value }))}
                  className="rounded-lg border px-3 py-2"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm">{t('BrandCommissionRate')} (%)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={createForm.brandCommissionRate}
                  onChange={(e) => setCreateForm(f => ({ ...f, brandCommissionRate: e.target.value }))}
                  className="rounded-lg border px-3 py-2"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm">{t('InfluencerCommissionRate')} (%)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={createForm.influencerCommissionRate}
                  onChange={(e) => setCreateForm(f => ({ ...f, influencerCommissionRate: e.target.value }))}
                  className="rounded-lg border px-3 py-2"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm">{t('OtherCostsRate')} (%)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={createForm.otherCostsRate}
                  onChange={(e) => setCreateForm(f => ({ ...f, otherCostsRate: e.target.value }))}
                  className="rounded-lg border px-3 py-2"
                />
              </label>
            </div>

            <div className="px-5 py-4 border-t flex justify-end gap-3">
              <button
                onClick={() => setCreateOpen(false)}
                className="rounded-xl px-4 py-2 bg-gray-100 hover:bg-gray-200"
              >
                {t('Cancel')}
              </button>
              <button
                onClick={submitCreate}
                disabled={creating}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 bg-purple-600 text-white hover:opacity-90 disabled:opacity-60"
              >
                {creating ? t('Creating') + '…' : t('Create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
  <div className="text-center py-12 text-gray-500">
    {t('loading')}
  </div>
) : filteredCampaigns.length === 0 && (
  <div className="text-center py-12">
    <div className="text-gray-500 text-lg">{t('noCampaigns')}</div>
    <p className="text-sm text-gray-400 mt-2">
      {t('adjust')}
    </p>
  </div>
)}

    </div>
  );
}

function CompanySelect({
  items,
  value,
  onChange,
  placeholder = 'Select a company',
}: {
  items: { id: number; name: string }[];
  value: number | null;
  onChange: (id: number | null) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = useMemo(
    () => (value ? items.find(i => i.id === value) || null : null),
    [value, items]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(i => i.name.toLowerCase().includes(q));
  }, [items, query]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  useEffect(() => {
    if (!open) setQuery(selected ? selected.name : '');
  }, [selected, open]);

  const onPick = (id: number) => {
    onChange(id);
    const picked = items.find(i => i.id === id);
    setQuery(picked ? picked.name : '');
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
            if (!e.target.value) onChange(null);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="block w-full pr-9 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
        />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100"
          aria-label="Toggle"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" className="text-gray-500">
            <path d="M5 7l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.7" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-white shadow max-h-60 overflow-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">{t('NoResults')}</div>
          ) : (
            filtered.map((i) => (
              <button
                key={i.id}
                type="button"
                onClick={() => onPick(i.id)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                  selected?.id === i.id ? 'bg-gray-50' : ''
                }`}
              >
                <div className="font-medium text-gray-900">{i.name}</div>
                <div className="text-xs text-gray-500">ID: {i.id}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

