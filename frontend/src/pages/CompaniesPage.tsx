// src/pages/CompaniesPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/api';
import { Search, Edit, Eye, X, Save, RefreshCw, PlusCircle } from 'lucide-react';
import { useLang, translations } from '../contexts/LangContext';

type Company = {
  id: number;
  name: string;
  email?: string | null;
  telefon?: string | null;
  adres?: string | null;
  gsm?: string | null;
  faks?: string | null;
  vergi_dairesi?: string | null;
  vergi_numarasi?: string | null;
  aktiflik_durumu?: boolean | null;
  yetkili_adi?: string | null;
  yetkili_soyadi?: string | null;
  yetkili_gsm?: string | null;
};

type ListResponse = {
  data: Company[];
  isSuccess: boolean;
  message: string | null;
  type: number;
};

type Envelope<T> = {
  data: T;
  isSuccess: boolean;
  message: string | null;
  type: number;
};

type CompanyCreatePayload = {
  name: string;
  adres?: string;
  telefon?: string;
  gsm?: string;
  faks?: string;
  vergi_dairesi?: string;
  vergi_numarasi?: string;
  email?: string;
  aktiflik_durumu?: boolean;
  yetkili_adi?: string;
  yetkili_soyadi?: string;
  yetkili_gsm?: string;
  // initial company user:
  username: string;
  password: string;
};

const CompaniesPage: React.FC = () => {
  const { user } = useAuth() as any;
  const { lang } = useLang();
  const t = (key: string) => translations[lang][key] || key;

  // Admin-only guard (UI side; backend still checks too)
  if (!user || user.user.role !== 'admin') {
    return null; // or <div className="p-6">Yetkisiz</div>
  }

  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filters, setFilters] = useState({ name: '', email: '', telefon: '' });

  // detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<Company | null>(null);

  // edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Company | null>(null);
  const [editForm, setEditForm] = useState<Partial<Company>>({});
  const [saving, setSaving] = useState(false);

  // create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CompanyCreatePayload>({
    name: '',
    email: '',
    telefon: '',
    adres: '',
    gsm: '',
    faks: '',
    vergi_dairesi: '',
    vergi_numarasi: '',
    aktiflik_durumu: true,
    yetkili_adi: '',
    yetkili_soyadi: '',
    yetkili_gsm: '',
    username: '',
    password: '',
  });
  const [creating, setCreating] = useState(false);

  // light inline notice
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchCompanies = async () => {
    setLoading(true);
    setNotice(null);
    try {
      const params: any = {};
      if (filters.name.trim()) params.name = filters.name.trim();
      if (filters.email.trim()) params.email = filters.email.trim();
      if (filters.telefon.trim()) params.telefon = filters.telefon.trim();

      const res = await apiClient.get<ListResponse>('/admin/list_companies', { params });
      if (res.data?.isSuccess) {
        setCompanies(res.data.data || []);
      } else {
        setNotice({ type: 'error', text: res.data?.message || 'Şirketler alınamadı' });
      }
    } catch (err) {
      console.error(err);
      setNotice({ type: 'error', text: 'Şirketler alınırken bir hata oluştu' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDetail = async (id: number) => {
    setDetailOpen(true);
    setDetail(null);
    try {
      // response_model=CompanyOut -> plain object
      const res = await apiClient.get<Company>(`/admin/companies/${id}`);
      setDetail(res.data as any);
    } catch (err) {
      console.error(err);
      setNotice({ type: 'error', text: 'Şirket detayı alınamadı' });
      setDetailOpen(false);
    }
  };

  const openEdit = async (c: Company) => {
    try {
      const res = await apiClient.get<Company>(`/admin/companies/${c.id}`);
      const full = res.data as any;
      setEditTarget(full);
      setEditForm({
        name: full.name,
        email: full.email,
        telefon: full.telefon,
        adres: full.adres,
        gsm: full.gsm,
        faks: full.faks,
        vergi_dairesi: full.vergi_dairesi,
        vergi_numarasi: full.vergi_numarasi,
        aktiflik_durumu: full.aktiflik_durumu,
        yetkili_adi: full.yetkili_adi,
        yetkili_soyadi: full.yetkili_soyadi,
        yetkili_gsm: full.yetkili_gsm,
      });
      setEditOpen(true);
    } catch (err) {
      console.error(err);
      setNotice({ type: 'error', text: 'Şirket detayı alınamadı' });
    }
  };

  const onSaveEdit = async () => {
    if (!editTarget) return;
    setSaving(true);
    setNotice(null);
    try {
      // send only changed fields
      const changed: Record<string, any> = {};
      Object.entries(editForm).forEach(([k, v]) => {
        if ((editTarget as any)[k] !== v) changed[k] = v;
      });

      const res = await apiClient.put<Envelope<Company>>(`/admin/companies/${editTarget.id}`, changed);
      if (res.data?.isSuccess) {
        setNotice({ type: 'success', text: 'Şirket güncellendi' });
        setEditOpen(false);
        setEditTarget(null);
        setEditForm({});
        await fetchCompanies();
      } else {
        setNotice({ type: 'error', text: res.data?.message || 'Güncelleme başarısız' });
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
      name: '',
      email: '',
      telefon: '',
      adres: '',
      gsm: '',
      faks: '',
      vergi_dairesi: '',
      vergi_numarasi: '',
      aktiflik_durumu: true,
      yetkili_adi: '',
      yetkili_soyadi: '',
      yetkili_gsm: '',
      username: '',
      password: '',
    });
    setCreateOpen(true);
  };

  const onCreate = async () => {
    // basic required fields
    if (!createForm.name.trim() || !createForm.username.trim() || !createForm.password.trim()) {
      setNotice({ type: 'error', text: 'Ad, kullanıcı adı ve şifre zorunludur.' });
      return;
    }
    setCreating(true);
    setNotice(null);
    try {
      // endpoint returns CompanyOut directly
      await apiClient.post<Company>('/admin/create_company', createForm);
      setNotice({ type: 'success', text: 'Şirket oluşturuldu' });
      setCreateOpen(false);
      await fetchCompanies();
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        'Şirket oluşturulurken hata oluştu';
      setNotice({ type: 'error', text: msg });
    } finally {
      setCreating(false);
    }
  };

  const rows = useMemo(() => companies, [companies]);

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t('Companies')}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCreate}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          >
            <PlusCircle className="w-4 h-4" /> {t('NewCompany')}
          </button>
          <button
            onClick={fetchCompanies}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100"
          >
            <RefreshCw className="w-4 h-4" /> {t('Refresh')}
          </button>
        </div>
      </div>

      {/* filters */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <FilterInput
          icon={<Search className="w-4 h-4 text-gray-500" />}
          placeholder={t('Search')}
          value={filters.name}
          onChange={(v) => setFilters((f) => ({ ...f, name: v }))}
        />
        <FilterInput
          icon={<Search className="w-4 h-4 text-gray-500" />}
          placeholder={t('Email')}
          value={filters.email}
          onChange={(v) => setFilters((f) => ({ ...f, email: v }))}
        />
        <FilterInput
          icon={<Search className="w-4 h-4 text-gray-500" />}
          placeholder={t('Phone')}
          value={filters.telefon}
          onChange={(v) => setFilters((f) => ({ ...f, telefon: v }))}
        />
      </div>

      <div className="mb-6">
        <button
          onClick={fetchCompanies}
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

      {/* table */}
      <div className="overflow-x-auto border rounded-2xl">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3">ID</th>
              <th className="text-left px-4 py-3">{t('CompanyName')}</th>
              <th className="text-left px-4 py-3">{t('Email')}</th>
              <th className="text-left px-4 py-3">{t('Phone')}</th>
              <th className="text-left px-4 py-3">{t('Status')}</th>
              <th className="text-right px-4 py-3">{t('Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-3">{c.id}</td>
                <td className="px-4 py-3">{c.name}</td>
                <td className="px-4 py-3">{c.email || '-'}</td>
                <td className="px-4 py-3">{c.telefon || '-'}</td>
                <td className="px-4 py-3">
                  {c.aktiflik_durumu ? (
                    <span className="inline-block rounded-full bg-green-100 text-green-700 px-2 py-0.5">{t('Active')}</span>
                  ) : (
                    <span className="inline-block rounded-full bg-red-100 text-red-700 px-2 py-0.5">{t('Passive')}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => openDetail(c.id)}
                      className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 bg-gray-100 hover:bg-gray-200"
                    >
                      <Eye className="w-4 h-4" /> {t('Details')}
                    </button>
                    <button
                      onClick={() => openEdit(c)}
                      className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100"
                    >
                      <Edit className="w-4 h-4" /> {t('Edit')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  {t('NoInfluencers')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* detail modal */}
      {detailOpen && (
        <Modal title="Şirket Detayı" onClose={() => setDetailOpen(false)}>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {detail ? (
              <>
                <Field label="ID" value={detail.id} />
                <Field label="Ad" value={detail.name} />
                <Field label="E-posta" value={detail.email} />
                <Field label="Telefon" value={detail.telefon} />
                <Field label="Adres" value={detail.adres} />
                <Field label="GSM" value={detail.gsm} />
                <Field label="Faks" value={detail.faks} />
                <Field label="Vergi Dairesi" value={detail.vergi_dairesi} />
                <Field label="Vergi No" value={detail.vergi_numarasi} />
                <Field label="Yetkili Adı" value={detail.yetkili_adi} />
                <Field label="Yetkili Soyadı" value={detail.yetkili_soyadi} />
                <Field label="Yetkili GSM" value={detail.yetkili_gsm} />
                <Field label="Durum" value={detail.aktiflik_durumu ? 'Aktif' : 'Pasif'} />
              </>
            ) : (
              <div>Yükleniyor…</div>
            )}
          </div>
        </Modal>
      )}

      {/* edit modal */}
      {editOpen && editTarget && (
        <Modal title="Şirket Düzenle" onClose={() => setEditOpen(false)}>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Ad" value={editForm.name ?? ''} onChange={(v) => setEditForm((f) => ({ ...f, name: v }))} />
            <Input label="E-posta" value={editForm.email ?? ''} onChange={(v) => setEditForm((f) => ({ ...f, email: v }))} />
            <Input label="Telefon" value={editForm.telefon ?? ''} onChange={(v) => setEditForm((f) => ({ ...f, telefon: v }))} />
            <Input label="GSM" value={editForm.gsm ?? ''} onChange={(v) => setEditForm((f) => ({ ...f, gsm: v }))} />
            <Input label="Faks" value={editForm.faks ?? ''} onChange={(v) => setEditForm((f) => ({ ...f, faks: v }))} />
            <Input label="Vergi Dairesi" value={editForm.vergi_dairesi ?? ''} onChange={(v) => setEditForm((f) => ({ ...f, vergi_dairesi: v }))} />
            <Input label="Vergi No" value={editForm.vergi_numarasi ?? ''} onChange={(v) => setEditForm((f) => ({ ...f, vergi_numarasi: v }))} />
            <Input label="Yetkili Adı" value={editForm.yetkili_adi ?? ''} onChange={(v) => setEditForm((f) => ({ ...f, yetkili_adi: v }))} />
            <Input label="Yetkili Soyadı" value={editForm.yetkili_soyadi ?? ''} onChange={(v) => setEditForm((f) => ({ ...f, yetkili_soyadi: v }))} />
            <Input label="Yetkili GSM" value={editForm.yetkili_gsm ?? ''} onChange={(v) => setEditForm((f) => ({ ...f, yetkili_gsm: v }))} />
            <TextArea label="Adres" value={editForm.adres ?? ''} onChange={(v) => setEditForm((f) => ({ ...f, adres: v }))} />
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Durum</label>
              <select
                value={(editForm.aktiflik_durumu ?? true) ? '1' : '0'}
                onChange={(e) => setEditForm((f) => ({ ...f, aktiflik_durumu: e.target.value === '1' }))}
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

      {/* create modal */}
      {createOpen && (
        <Modal title="Yeni Şirket" onClose={() => setCreateOpen(false)}>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Ad *" value={createForm.name} onChange={(v) => setCreateForm((f) => ({ ...f, name: v }))} />
            <Input label="E-posta" value={createForm.email || ''} onChange={(v) => setCreateForm((f) => ({ ...f, email: v }))} />
            <Input label="Telefon" value={createForm.telefon || ''} onChange={(v) => setCreateForm((f) => ({ ...f, telefon: v }))} />
            <Input label="GSM" value={createForm.gsm || ''} onChange={(v) => setCreateForm((f) => ({ ...f, gsm: v }))} />
            <Input label="Faks" value={createForm.faks || ''} onChange={(v) => setCreateForm((f) => ({ ...f, faks: v }))} />
            <Input label="Vergi Dairesi" value={createForm.vergi_dairesi || ''} onChange={(v) => setCreateForm((f) => ({ ...f, vergi_dairesi: v }))} />
            <Input label="Vergi No" value={createForm.vergi_numarasi || ''} onChange={(v) => setCreateForm((f) => ({ ...f, vergi_numarasi: v }))} />
            <Input label="Yetkili Adı" value={createForm.yetkili_adi || ''} onChange={(v) => setCreateForm((f) => ({ ...f, yetkili_adi: v }))} />
            <Input label="Yetkili Soyadı" value={createForm.yetkili_soyadi || ''} onChange={(v) => setCreateForm((f) => ({ ...f, yetkili_soyadi: v }))} />
            <Input label="Yetkili GSM" value={createForm.yetkili_gsm || ''} onChange={(v) => setCreateForm((f) => ({ ...f, yetkili_gsm: v }))} />
            <TextArea label="Adres" value={createForm.adres || ''} onChange={(v) => setCreateForm((f) => ({ ...f, adres: v }))} />
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Durum</label>
              <select
                value={(createForm.aktiflik_durumu ?? true) ? '1' : '0'}
                onChange={(e) => setCreateForm((f) => ({ ...f, aktiflik_durumu: e.target.value === '1' }))}
                className="rounded-xl border px-3 py-2"
              >
                <option value="1">Aktif</option>
                <option value="0">Pasif</option>
              </select>
            </div>

            <div className="md:col-span-2 mt-2 border-t pt-4">
              <div className="text-sm font-medium mb-2">İlk Şirket Kullanıcısı</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Kullanıcı Adı *" value={createForm.username} onChange={(v) => setCreateForm((f) => ({ ...f, username: v }))} />
                <Input label="Şifre *" value={createForm.password} onChange={(v) => setCreateForm((f) => ({ ...f, password: v }))} />
              </div>
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

const Input: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <label className="flex flex-col gap-1">
    <span className="text-sm text-gray-700">{label}</span>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border px-3 py-2 focus:outline-none focus:ring"
    />
  </label>
);

const TextArea: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <label className="flex flex-col gap-1 md:col-span-2">
    <span className="text-sm text-gray-700">{label}</span>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
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

export default CompaniesPage;
