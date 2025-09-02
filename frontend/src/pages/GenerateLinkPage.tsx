import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link2, Copy, Check, Users, Target } from 'lucide-react';
import { getCampaigns, generateTrackingLink } from '../services/api';
import type { Campaign } from '../services/api';
import { apiClient } from '../services/api';
import { useLang, translations, tWithVars } from '../contexts/LangContext';
import { useAuth } from '../contexts/AuthContext';

interface GenerateLinkPageProps {
  onAddToast: (message: string, type: 'success' | 'error' | 'warning') => void;
}

type InfluencerLite = {
  id: number;
  username: string;
  display_name?: string | null;
  email?: string | null;
  active?: boolean | null;
};

export function GenerateLinkPage({ onAddToast }: GenerateLinkPageProps) {
  const [influencerId, setInfluencerId] = useState('');
  const [influencerName, setInfluencerName] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const selectedCampaignObj = campaigns.find(c => c.id.toString() === selectedCampaign);
  const [influencers, setInfluencers] = useState<InfluencerLite[]>([]);
  const [selectedInfluencerId, setSelectedInfluencerId] = useState<number | null>(null);
  const [influencerLoading, setInfluencerLoading] = useState(false);
  const { lang } = useLang();
  const t = (key: string) => translations[lang][key] || key;
  const { user } = useAuth();
  const isInfluencer = user?.user?.role === 'influencer';

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const response = await getCampaigns();
        if (response.isSuccess) {
          setCampaigns(response.data);
        } else {
          onAddToast(t('FailedToLoadCampaigns'), 'error');
        }
      } catch (err) {
        onAddToast(t('FailedToLoadCampaigns'), 'error');
      }
    };
    fetchCampaigns();
  }, []);

  // Fetch influencers based on campaign selection and user role
  useEffect(() => {
    if (isInfluencer) return; // Don't fetch for influencer users
    let mounted = true;
    (async () => {
      try {
        setInfluencerLoading(true);
        const res = await apiClient.get('/list-influencers', { params: { campaign_id: selectedCampaign } });
        if (mounted && res.data?.isSuccess) {
          setInfluencers(res.data.data || []);
        } else if (mounted) {
          setInfluencers([]);
        }
      } catch {
        if (mounted) {
          setInfluencers([]);
          onAddToast(t('FailedToLoadInfluencers'), 'error');
        }
      } finally {
        setInfluencerLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [selectedCampaign, isInfluencer, onAddToast]); // Re-run when campaign changes or on mount

  useEffect(() => {
    if (!selectedInfluencerId) {
      setInfluencerId('');
      setInfluencerName('');
      return;
    }
    const inf = influencers.find(i => i.id === selectedInfluencerId);
    setInfluencerId(inf ? String(inf.id) : '');
    setInfluencerName(inf ? (inf.display_name || inf.username || '') : '');
  }, [selectedInfluencerId, influencers]);

  const handleGenerateLink = async () => {
    try {
      setIsGenerating(true);
      // For influencers, use their own ID and name
      const payload = isInfluencer 
        ? {
            influencerID: user.user.id.toString(),
            influencerName: user.user.display_name || user.user.username || 'Influencer',
            campaignID: Number(selectedCampaign)
          }
        : {
            influencerID: selectedInfluencerId,
            influencerName: influencers.find(inf => inf.id == selectedInfluencerId)?.display_name || '',
            campaignID: Number(selectedCampaign)
          };

      const response = await apiClient.put('/mlink/generate-link', payload);

      // Fixed: Check for data.url property instead of isSuccess only
      if (response.data?.isSuccess && response.data?.data?.url) {
        setGeneratedLink(response.data.data.url);
        onAddToast(response.data.message || t('LinkGenerated'), 'success');
      } else if (response.data?.isSuccess && typeof response.data?.url === 'string') {
        // Handle direct URL in response structure
        setGeneratedLink(response.data.url);
        onAddToast(response.data.message || t('LinkGenerated'), 'success');
      } else {
        onAddToast(response.data?.message || t('FailedToGenerateLink'), 'error');
      }
    } catch (err: any) {
      console.error("Link generation error:", err);
      onAddToast(err?.response?.data?.message || t('FailedToGenerateLink'), 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      onAddToast(t('LinkCopied'), 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      onAddToast(t('FailedToCopy'), 'error');
    }
  };

  const handleReset = () => {
    setSelectedInfluencerId(null);
    setInfluencerId('');
    setInfluencerName('');
    setSelectedCampaign('');
    setGeneratedLink('');
    setCopied(false);
    setInfluencers([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
          <Link2 className="h-6 w-6 text-purple-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{t('GenerateTrackingLink')}</h1>
        <p className="mt-2 text-sm text-gray-600">
          {t('CreateTrackingLinks')}
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">{t('ChooseTheCampaignThisLinkWillTrack')}</h3>
          <p className="text-sm text-gray-500">{t('SelectCampaign')}</p>
        </div>

        {/* Campaign selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div>
            <select
              value={selectedCampaign}
              onChange={e => setSelectedCampaign(e.target.value)}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-200"
            >
              <option value="">{t('SelectCampaign')}</option>
              {campaigns.map(campaign => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Only show influencer selection for admin/company users */}
        {!isInfluencer && (
          <>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">{t('SelectInfluencer')}</h3>
              <p className="text-sm text-gray-500">
                {selectedCampaign
                  ? influencers.length === 0
                    ? t('NoInfluencersForCampaign')
                    : t('SelectInfluencer')
                  : t('SelectCampaignFirst')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div>
                <select
                  value={selectedInfluencerId}
                  onChange={e => setSelectedInfluencerId(e.target.value)}
                  disabled={!selectedCampaign || influencerLoading}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-200 disabled:opacity-50"
                >
                  <option value="">{t('SelectInfluencer')}</option>
                  {influencers.map(inf => (
                    <option key={inf.id} value={inf.id}>
                      {inf.display_name || inf.username}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex justify-end">
          <button
            onClick={handleGenerateLink}
            disabled={!selectedCampaign || isGenerating || (!isInfluencer && !selectedInfluencerId)}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {isGenerating ? t('Generating') : t('GenerateLink')}
          </button>
        </div>
      </div>

      {/* Generated Link */}
      {generatedLink && (
        <div className="bg-white rounded-lg shadow p-6 animate-in fade-in-0 slide-in-from-bottom-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('LinkGenerated')}</h3>
          <div className="space-y-4">
            {/* Link Display */}
            <div className="p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <code className="text-sm text-gray-800 break-all flex-1 mr-4">
                  {generatedLink}
                </code>
                <button
                  onClick={handleCopyLink}
                  className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    copied
                      ? 'bg-green-100 text-green-800'
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      {t('LinkCopied')}
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      {t('Copy')}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Link Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="font-medium text-blue-900">{t('Influencer')}</div>
                <div className="text-blue-700">{influencerName}</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="font-medium text-purple-900">{t('Campaign')}</div>
                <div className="text-purple-700">
                  {selectedCampaignObj?.name}
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="font-medium text-green-900">{t('InfluencerCommission')}</div>
                <div className="text-green-700">
                  {selectedCampaignObj?.influencerCommissionRate}%
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="p-4 bg-amber-50 border-l-4 border-amber-400">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-amber-700">
                    <strong>{t('NextSteps')}:</strong>{" "}
                    {tWithVars(t('ShareTrackingLink'), { influencerName })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// InfluencerSelect component
function InfluencerSelect({
  items,
  value,
  onChange,
  placeholder = '',
}: {
  items: InfluencerLite[];
  value: number | null;
  onChange: (id: number | null) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { lang } = useLang();
  const t = (key: string) => translations[lang][key] || key;

  const format = (i: InfluencerLite) =>
    (i.display_name || i.username) + (i.display_name ? ` (@${i.username})` : '');

  const selected = useMemo(
    () => (value ? items.find(i => i.id === value) || null : null),
    [value, items]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(i => {
      const name = (i.display_name || '').toLowerCase();
      const uname = (i.username || '').toLowerCase();
      return name.includes(q) || uname.includes(q);
    });
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
    if (!open) setQuery(selected ? format(selected) : '');
  }, [selected, open]);

  const onPick = (id: number) => {
    onChange(id);
    const picked = items.find(i => i.id === id);
    setQuery(picked ? format(picked) : '');
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
            if (!e.target.value) onChange(null);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder || t('SelectInfluencer')}
          className="block w-full pl-10 pr-9 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
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
            <div className="px-3 py-2 text-sm text-gray-500">{t('noResults')}</div>
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
                <div className="font-medium text-gray-900">{i.display_name || i.username}</div>
                <div className="text-xs text-gray-500">@{i.username}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
