import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link2, Copy, Check, Users, Target } from 'lucide-react';
import {getCampaigns, generateTrackingLink } from '../services/api'; 
import type { Campaign } from '../services/api';
import { apiClient } from '../services/api';

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
  const campaignId = parseInt(selectedCampaign, 10);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const response = await getCampaigns(); // No filters for now
        if (response.isSuccess) {
          setCampaigns(response.data);
        } else {
          onAddToast(response.message || 'Failed to load campaigns', 'error');
        }
      } catch (err) {
        onAddToast('Error loading campaigns', 'error');
      }
    };
    fetchCampaigns();
  }, []);

  useEffect(() => {
      let mounted = true;
      (async () => {
        try {
          const res = await apiClient.get<InfluencerLite[]>('/admin/list_influencers');
          if (mounted) setInfluencers(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
          onAddToast('Influencer listesi alınamadı', 'error');
        }
      })();
      return () => { mounted = false; };
    }, []);
  
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

 const handleGenerateLink = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!influencerId || !influencerName || !selectedCampaign) {
      onAddToast('Please fill in all required fields', 'warning');
      return;
    }

    setIsGenerating(true);
    try {
      const campaignId = parseInt(selectedCampaign);
      const response = await generateTrackingLink(influencerId, influencerName, campaignId);
      
      if (response.isSuccess && response.data?.url) {
        setGeneratedLink(response.data.url);
        onAddToast('Tracking link generated successfully!', 'success');
      } else {
        onAddToast(response.message || 'Failed to generate link', 'error');
      }
    } catch (err) {
      onAddToast('Error generating link', 'error');
    }
    setIsGenerating(false);
  };


  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      onAddToast('Link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      onAddToast('Failed to copy link. Please try again.', 'error');
    }
  };

  const handleReset = () => {
    setSelectedInfluencerId(null);
    setInfluencerId('');
    setInfluencerName('');
    setSelectedCampaign('');
    setGeneratedLink('');
    setCopied(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
          <Link2 className="h-6 w-6 text-purple-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Generate Tracking Link</h1>
        <p className="mt-2 text-sm text-gray-600">
          Create custom tracking links for your influencer campaigns
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleGenerateLink} className="space-y-6">
          {/* Influencer (searchable, single box) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Influencer <span className="text-red-500">*</span>
            </label>
            <InfluencerSelect
              items={influencers}
              value={selectedInfluencerId}
              onChange={setSelectedInfluencerId}
              placeholder="İsim veya kullanıcı adı yazın"
            />
            {!!influencerId && (
              <p className="mt-2 text-xs text-gray-600">
                Seçilen: <strong>{influencerName}</strong> (ID: {influencerId})
              </p>
            )}
          </div>



          {/* Campaign Selection */}
          <div>
            <label htmlFor="campaign" className="block text-sm font-medium text-gray-700 mb-2">
              Campaign <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                id="campaign"
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                required
              >
                <option value="">Select a campaign</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id.toString()}>
                    {campaign.name} ({campaign.influencerCommissionRate}% commission)
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Choose the campaign this link will track
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={isGenerating}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" />
                  Generate Link
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Generated Link */}
      {generatedLink && (
        <div className="bg-white rounded-lg shadow p-6 animate-in fade-in-0 slide-in-from-bottom-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated Tracking Link</h3>
          
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
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Link Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="font-medium text-blue-900">Influencer</div>
                <div className="text-blue-700">{influencerName}</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="font-medium text-purple-900">Campaign</div>
                <div className="text-purple-700">
                  {selectedCampaignObj?.name}
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="font-medium text-green-900">Commission</div>
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
                    <strong>Next steps:</strong> Share this tracking link with {influencerName}. 
                    All clicks and conversions will be automatically tracked and attributed to their performance.
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
function InfluencerSelect({
  items,
  value,
  onChange,
  placeholder = 'Bir influencer seçin',
}: {
  items: InfluencerLite[];
  value: number | null;
  onChange: (id: number | null) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

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

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // when value changes externally, reflect label in the input (when closed)
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
            // if user clears the field manually, clear selection
            if (!e.target.value) onChange(null);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="block w-full pl-10 pr-9 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
        />
        {/* caret */}
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
            <div className="px-3 py-2 text-sm text-gray-500">Sonuç yok</div>
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
