import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
import { RiskBadge, StatusBadge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../components/StateBlock';
import { Onboarding } from '../components/Onboarding';
import { useWorkspace } from '../context/WorkspaceContext';
import { api, queryString } from '../lib/api';
import { money, todayPlus } from '../lib/format';
import type { Risk, Vendor, VendorStatus } from '../lib/types';

const emptyVendor = {
  name: '',
  owner_email: '',
  category: '',
  status: 'reviewing' as VendorStatus,
  risk: 'medium' as Risk,
  annual_spend: 0,
  data_access: 'Business metadata only',
  next_review_date: todayPlus(90),
  notes: ''
};

export function VendorsPage() {
  const { currentOrg, loading: orgLoading } = useWorkspace();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filters, setFilters] = useState({ q: '', status: '', risk: '', sort: 'updated_at.desc' });
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const modalInitial = editing ?? emptyVendor;

  async function load() {
    if (!currentOrg) return;
    setLoading(true);
    setError('');
    try {
      setVendors(await api.vendors(currentOrg.id, queryString(filters)) as Vendor[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Vendors could not be loaded.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [currentOrg?.id, filters.status, filters.risk, filters.sort]);

  const spend = useMemo(() => vendors.reduce((sum, vendor) => sum + Number(vendor.annual_spend), 0), [vendors]);

  if (orgLoading) return <LoadingBlock label="Loading workspace..." />;
  if (!currentOrg) return <Onboarding />;

  return (
    <>
      <PageHeader title="Vendor register" eyebrow={`${vendors.length} vendors, ${money(spend)} reviewed`} action={<button className="btn-primary" onClick={() => setCreating(true)}><Plus size={18} /> Add vendor</button>} />
      <section className="panel mb-5 grid gap-3 p-4 md:grid-cols-[1fr_160px_160px_190px_auto]">
        <label className="relative"><Search className="absolute left-3 top-3 text-moss" size={16} /><input aria-label="Search vendor, category, owner" className="field pl-9" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} /></label>
        <select className="field" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">All statuses</option><option value="prospect">Prospect</option><option value="reviewing">Reviewing</option><option value="approved">Approved</option><option value="restricted">Restricted</option><option value="offboarded">Offboarded</option></select>
        <select className="field" value={filters.risk} onChange={(e) => setFilters({ ...filters, risk: e.target.value })}><option value="">All risks</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select>
        <select className="field" value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })}><option value="updated_at.desc">Recently updated</option><option value="name.asc">Name A-Z</option><option value="annual_spend.desc">Highest spend</option><option value="next_review_date.asc">Next review</option></select>
        <button className="btn-secondary" onClick={load}>Apply</button>
      </section>
      {success && <p className="mb-4 rounded-md bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">{success}</p>}
      {loading ? <LoadingBlock /> : error ? <ErrorBlock message={error} onRetry={load} /> : vendors.length === 0 ? <EmptyBlock title="No vendors match this view" body="Add your first vendor or adjust the current filters." /> : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase text-moss">
              <tr><th className="px-4 py-3">Vendor</th><th className="px-4 py-3">Owner</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Risk</th><th className="px-4 py-3">Spend</th><th className="px-4 py-3">Next review</th><th className="px-4 py-3">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {vendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3"><button className="text-left font-bold text-ink hover:text-signal" onClick={() => setEditing(vendor)}>{vendor.name}</button><p className="text-xs text-moss">{vendor.category}</p></td>
                  <td className="px-4 py-3 text-moss">{vendor.owner_email}</td>
                  <td className="px-4 py-3"><StatusBadge value={vendor.status} /></td>
                  <td className="px-4 py-3"><RiskBadge risk={vendor.risk} /></td>
                  <td className="px-4 py-3 font-semibold">{money(Number(vendor.annual_spend))}</td>
                  <td className="px-4 py-3 text-moss">{vendor.next_review_date}</td>
                  <td className="px-4 py-3"><button className="rounded-md p-2 text-red-700 hover:bg-red-50" aria-label={`Delete ${vendor.name}`} onClick={async () => { if (!confirm(`Delete ${vendor.name}?`)) return; await api.deleteVendor(currentOrg.id, vendor.id); setSuccess('Vendor deleted.'); load(); }}><Trash2 size={17} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {(creating || editing) && <VendorModal initial={modalInitial} saving={saving} onClose={() => { setCreating(false); setEditing(null); }} onSubmit={async (payload) => {
        setSaving(true);
        setError('');
        try {
          if (editing) await api.updateVendor(currentOrg.id, editing.id, payload);
          else await api.createVendor(currentOrg.id, payload);
          setSuccess(editing ? 'Vendor updated.' : 'Vendor created.');
          setCreating(false);
          setEditing(null);
          await load();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Vendor could not be saved.');
        } finally {
          setSaving(false);
        }
      }} />}
    </>
  );
}

function VendorModal({ initial, saving, onSubmit, onClose }: { initial: typeof emptyVendor; saving: boolean; onSubmit: (payload: typeof emptyVendor) => Promise<void>; onClose: () => void }) {
  const [form, setForm] = useState(initial);
  return (
    <Modal title={initial.name ? 'Edit vendor' : 'Add vendor'} onClose={onClose}>
      <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}>
        <div className="grid gap-4 md:grid-cols-2">
          <label><span className="label">Vendor name</span><input className="field mt-1" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label><span className="label">Business owner email</span><input className="field mt-1" type="email" required value={form.owner_email} onChange={(e) => setForm({ ...form, owner_email: e.target.value })} /></label>
          <label><span className="label">Category</span><input className="field mt-1" required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></label>
          <label><span className="label">Annual spend</span><input className="field mt-1" type="number" min="0" required value={form.annual_spend} onChange={(e) => setForm({ ...form, annual_spend: Number(e.target.value) })} /></label>
          <label><span className="label">Status</span><select className="field mt-1" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as VendorStatus })}><option value="prospect">Prospect</option><option value="reviewing">Reviewing</option><option value="approved">Approved</option><option value="restricted">Restricted</option><option value="offboarded">Offboarded</option></select></label>
          <label><span className="label">Risk</span><select className="field mt-1" value={form.risk} onChange={(e) => setForm({ ...form, risk: e.target.value as Risk })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></label>
          <label><span className="label">Next review</span><input className="field mt-1" type="date" required value={form.next_review_date} onChange={(e) => setForm({ ...form, next_review_date: e.target.value })} /></label>
          <label><span className="label">Data access</span><input className="field mt-1" required value={form.data_access} onChange={(e) => setForm({ ...form, data_access: e.target.value })} /></label>
        </div>
        <label><span className="label">Notes</span><textarea className="field mt-1 min-h-24" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
        <button className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save vendor'}</button>
      </form>
    </Modal>
  );
}
