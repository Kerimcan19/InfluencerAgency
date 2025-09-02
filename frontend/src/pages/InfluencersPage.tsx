// src/pages/InfluencersPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/api';
import { Search, Edit, Eye, X, Save, RefreshCw, Shield, PlusCircle } from 'lucide-react';
import { useLang, translations } from '../contexts/LangContext';

type Influencer = {
  id: number;
  username: string;
  display_name?: string | null;
  email?: string | null;
  phone?: string | null;
  profile_image?: string | null;
  active?: boolean | null;
  user_id?: number | null;
  mlink_id?: string | null;
};

type Envelope<T> = {
  data: T;
  isSuccess: boolean;
  message: string | null;
  type: number;
};

type InfluencerCreatePayload = {
  username: string;
  display_name: string;
  email: string;         // required
  phone?: string;
  profile_image?: string;
  active?: boolean;      // default true
};


const InfluencersPage: React.FC = () => {
  const { user } = useAuth() as any;
  const { lang } = useLang();
  const t = (key: string) => translations[lang][key] || key;

  // admin-only UI guard
  if (!user || user.user.role !== 'admin') return null;

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Influencer[]>([]);
  const [filters, setFilters] = useState({ name: '' });

  // detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<Influencer | null>(null);

  // edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Influencer | null>(null);
  const [editForm, setEditForm] = useState<Partial<Influencer>>({});
  const [saving, setSaving] = useState(false);

  // create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<InfluencerCreatePayload>({
    username: '',
    display_name: '',
    email: '',
    phone: '',
    profile_image: '',
    active: true,
  });


  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchList = async () => {
    setLoading(true);
    setNotice(null);
    try {
      const params: any = {};
      if (filters.name.trim()) params.name = filters.name.trim();
      const res = await apiClient.get<Influencer[]>('/admin/list_influencers', { params });
      // endpoint returns a plain array (not an envelope)
      setRows(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      console.error(err);
      setNotice({ type: 'error', text: 'Influencerlar alınırken hata oluştu' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDetail = async (id: number) => {
    setDetailOpen(true);
    setDetail(null);
    try {
      const res = await apiClient.get(`/admin/influencers/${id}`);
      // handle both shapes (envelope or direct)
      const payload = (res as any).data;
      const data = payload?.data ?? payload;
      setDetail(data as Influencer);
    } catch (err) {
      console.error(err);
      setNotice({ type: 'error', text: 'Influencer detayı alınamadı' });
      setDetailOpen(false);
    }
  };

  const openEdit = async (i: Influencer) => {
    try {
      const res = await apiClient.get(`/admin/influencers/${i.id}`);
      const payload = (res as any).data;
      const full = (payload?.data ?? payload) as Influencer;
      setEditTarget(full);
      setEditForm({
        display_name: full.display_name ?? '',
        email: full.email ?? '',
        phone: full.phone ?? '',
        profile_image: full.profile_image ?? '',
        active: full.active ?? true,
      });
      setEditOpen(true);
    } catch (err) {
      console.error(err);
      setNotice({ type: 'error', text: 'Influencer detayı alınamadı' });
    }
  };

  const onSaveEdit = async () => {
    if (!editTarget) return;
    setSaving(true);
    setNotice(null);
    try {
      // only send changed fields
      const changed: Record<string, any> = {};
      Object.entries(editForm).forEach(([k, v]) => {
        if ((editTarget as any)[k] !== v) changed[k] = v;
      });

      const res = await apiClient.put<Envelope<Influencer> | Influencer>(
        `/admin/influencers/${editTarget.id}`,
        changed
      );
      const payload: any = (res as any).data;
      const ok = payload?.isSuccess !== false; // if envelope missing, treat as ok
      if (ok) {
        setNotice({ type: 'success', text: 'Influencer güncellendi' });
        setEditOpen(false);
        setEditTarget(null);
        setEditForm({});
        await fetchList();
      } else {
        setNotice({ type: 'error', text: payload?.message || 'Güncelleme başarısız' });
      }
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.detail || 'Güncelleme sırasında hata oluştu';
      setNotice({ type: 'error', text: msg });
    } finally {
      setSaving(false);
    }
  };
  const onOpenCreate = () => {
    setCreateForm({
      username: '',
      display_name: '',
      email: '',
      phone: '',
      profile_image: '',
      active: true,
    });
    setCreateOpen(true);
  };

  const onCreate = async () => {
    if (!createForm.username.trim() || !createForm.display_name.trim() || !createForm.email.trim()) {
      setNotice({ type: 'error', text: 'Kullanıcı adı, görünen ad ve e-posta zorunludur.' });
      return;
    }
    setCreating(true);
    setNotice(null);
    try {
      const res = await apiClient.post('/admin/add-influencer', createForm);
      const payload: any = (res as any).data;
      const resetUrl = payload?.data?.resetUrl as string | undefined;

      setNotice({
        type: 'success',
        text: resetUrl ? 'Influencer oluşturuldu. Şifre sıfırlama linki kopyalandı.' : 'Influencer oluşturuldu.',
      });

      if (resetUrl && navigator?.clipboard) {
        try { await navigator.clipboard.writeText(resetUrl); } catch {}
      }

      setCreateOpen(false);
      await fetchList();
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.detail || err?.response?.data?.message || 'Influencer oluşturulurken hata oluştu';
      setNotice({ type: 'error', text: msg });
    } finally {
      setCreating(false);
    }
  };


  const onResetPassword = async (id: number) => {
    setSaving(true);
    try {
      const res = await apiClient.put(`/admin/influencers/${id}`, { resetPassword: true });
      const payload: any = (res as any).data;
      const data = payload?.data ?? {};
      const resetUrl = data.resetUrl as string | undefined;
      setNotice({
        type: 'success',
        text: resetUrl ? 'Şifre sıfırlama bağlantısı oluşturuldu.' : 'Şifre sıfırlama talebi gönderildi.',
      });
      // optionally copy to clipboard:
      if (resetUrl && navigator?.clipboard) {
        try { await navigator.clipboard.writeText(resetUrl); } catch {}
      }
    } catch (err) {
      console.error(err);
      setNotice({ type: 'error', text: 'Şifre sıfırlama işlemi başarısız' });
    } finally {
      setSaving(false);
    }
  };

  const data = useMemo(() => rows, [rows]);

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('Influencers')}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCreate}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          >
            <PlusCircle className="w-4 h-4" /> {t('NewInfluencer')}
          </button>
          <button
            onClick={fetchList}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100"
          >
            <RefreshCw className="w-4 h-4" /> {t('Refresh')}
          </button>
        </div>
      </div>


      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <FilterInput
          icon={<Search className="w-4 h-4 text-gray-500" />}
          placeholder={t('FilterByUsername')}
          value={filters.name}
          onChange={(v) => setFilters((f) => ({ ...f, name: v }))}
        />
      </div>

      <div className="mb-6">
        <button
          onClick={fetchList}
          disabled={loading}
          className="rounded-xl bg-black text-white px-4 py-2 hover:opacity-90 disabled:opacity-60"
        >
          {loading ? t('loading') : t('Filter')}
        </button>
      </div>

      {notice && (
        <div
          className={`mb-4 rounded-xl px-4 py-3 ${
            notice.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {notice.text}
        </div>
      )}

      <div className="overflow-x-auto border rounded-2xl">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3">ID</th>
              <th className="text-left px-4 py-3">Kullanıcı Adı</th>
              <th className="text-left px-4 py-3">Görünen Ad</th>
              <th className="text-left px-4 py-3">E-posta</th>
              <th className="text-left px-4 py-3">Durum</th>
              <th className="text-right px-4 py-3">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {data.map((i) => (
              <tr key={i.id} className="border-t">
                <td className="px-4 py-3">{i.id}</td>
                <td className="px-4 py-3">{i.username}</td>
                <td className="px-4 py-3">{i.display_name || '-'}</td>
                <td className="px-4 py-3">{i.email || '-'}</td>
                <td className="px-4 py-3">
                  {i.active ? (
                    <span className="inline-block rounded-full bg-green-100 text-green-700 px-2 py-0.5">Aktif</span>
                  ) : (
                    <span className="inline-block rounded-full bg-red-100 text-red-700 px-2 py-0.5">Pasif</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => openDetail(i.id)}
                      className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 bg-gray-100 hover:bg-gray-200"
                    >
                      <Eye className="w-4 h-4" /> Görüntüle
                    </button>
                    <button
                      onClick={() => openEdit(i)}
                      className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100"
                    >
                      <Edit className="w-4 h-4" /> Düzenle
                    </button>
                    <button
                      onClick={() => onResetPassword(i.id)}
                      className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100"
                    >
                      <Shield className="w-4 h-4" /> Şifre Sıfırla
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {data.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  Kayıt bulunamadı
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* detail modal */}
      {detailOpen && (
        <Modal title="Influencer Detayı" onClose={() => setDetailOpen(false)}>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {detail ? (
              <>
                <Field label="ID" value={detail.id} />
                <Field label="Kullanıcı Adı" value={detail.username} />
                <Field label="Görünen Ad" value={detail.display_name} />
                <Field label="E-posta" value={detail.email} />
                <Field label="Telefon" value={detail.phone} />
                <Field label="Profil Görseli" value={detail.profile_image} />
                <Field label="Durum" value={detail.active ? 'Aktif' : 'Pasif'} />
                <Field label="MLink ID" value={detail.mlink_id} />
                <Field label="User ID" value={detail.user_id} />
              </>
            ) : (
              <div>Yükleniyor…</div>
            )}
          </div>
        </Modal>
      )}

      {/* edit modal */}
      {editOpen && editTarget && (
        <Modal title="Influencer Düzenle" onClose={() => setEditOpen(false)}>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <ReadOnly label="Kullanıcı Adı" value={editTarget.username} />
            <Input label="Görünen Ad" value={editForm.display_name as string} onChange={(v) => setEditForm((f) => ({ ...f, display_name: v }))} />
            <Input label="E-posta" value={editForm.email as string} onChange={(v) => setEditForm((f) => ({ ...f, email: v }))} />
            <Input label="Telefon" value={editForm.phone as string} onChange={(v) => setEditForm((f) => ({ ...f, phone: v }))} />
            <Input label="Profil Görseli URL" value={editForm.profile_image as string} onChange={(v) => setEditForm((f) => ({ ...f, profile_image: v }))} />
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Durum</label>
              <select
                value={(editForm.active ?? true) ? '1' : '0'}
                onChange={(e) => setEditForm((f) => ({ ...f, active: e.target.value === '1' }))}
                className="rounded-xl border px-3 py-2"
              >
                <option value="1">Aktif</option>
                <option value="0">Pasif</option>
              </select>
            </div>
          </div>

          <div className="px-5 py-4 border-t flex justify-end gap-3">
            <button onClick={() => setEditOpen(false)} className="rounded-xl px-4 py-2 bg-gray-100 hover:bg-gray-200">
              İptal
            </button>
            <button
              onClick={onSaveEdit}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 bg-black text-white hover:opacity-90 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
          </div>
        </Modal>
      )}
      {createOpen && (
        <Modal title="Yeni Influencer" onClose={() => setCreateOpen(false)}>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Kullanıcı Adı *" value={createForm.username} onChange={(v) => setCreateForm((f) => ({ ...f, username: v }))} />
            <Input label="Görünen Ad *" value={createForm.display_name} onChange={(v) => setCreateForm((f) => ({ ...f, display_name: v }))} />
            <Input label="E-posta *" value={createForm.email} onChange={(v) => setCreateForm((f) => ({ ...f, email: v }))} />
            <Input label="Telefon" value={createForm.phone || ''} onChange={(v) => setCreateForm((f) => ({ ...f, phone: v }))} />
            <Input label="Profil Görseli URL" value={createForm.profile_image || ''} onChange={(v) => setCreateForm((f) => ({ ...f, profile_image: v }))} />
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Durum</label>
              <select
                value={(createForm.active ?? true) ? '1' : '0'}
                onChange={(e) => setCreateForm((f) => ({ ...f, active: e.target.value === '1' }))}
                className="rounded-xl border px-3 py-2"
              >
                <option value="1">Aktif</option>
                <option value="0">Pasif</option>
              </select>
            </div>
          </div>

          <div className="px-5 py-4 border-t flex justify-end gap-3">
            <button onClick={() => setCreateOpen(false)} className="rounded-xl px-4 py-2 bg-gray-100 hover:bg-gray-200">
              İptal
            </button>
            <button
              onClick={onCreate}
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 bg-emerald-600 text-white hover:opacity-90 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {creating ? 'Oluşturuluyor…' : 'Oluştur'}
            </button>
          </div>
        </Modal>
      )}

    </div>
  );
};

const FilterInput: React.FC<{
  icon: React.ReactNode;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
}> = ({ icon, value, placeholder, onChange }) => (
  <div className="flex items-center gap-2">
    {icon}
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring"
    />
  </div>
);

const Field: React.FC<{ label: string; value: any }> = ({ label, value }) => (
  <div>
    <div className="text-xs text-gray-500 mb-1">{label}</div>
    <div className="text-sm break-words">{value ?? '-'}</div>
  </div>
);

const ReadOnly: React.FC<{ label: string; value: any }> = ({ label, value }) => (
  <label className="flex flex-col gap-1">
    <span className="text-sm text-gray-700">{label}</span>
    <div className="rounded-xl border px-3 py-2 bg-gray-50">{value ?? '-'}</div>
  </label>
);

const Input: React.FC<{ label: string; value: any; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <label className="flex flex-col gap-1">
    <span className="text-sm text-gray-700">{label}</span>
    <input
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border px-3 py-2 focus:outline-none focus:ring"
    />
  </label>
);

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
    <div className="w-full max-w-2xl rounded-2xl bg-white shadow-lg">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
          <X className="w-5 h-5" />
        </button>
      </div>
      {children}
    </div>
  </div>
);

export default InfluencersPage;
