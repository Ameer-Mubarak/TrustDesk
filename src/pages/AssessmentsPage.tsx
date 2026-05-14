import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../components/StateBlock';
import { StatusBadge } from '../components/Badge';
import { Onboarding } from '../components/Onboarding';
import { useWorkspace } from '../context/WorkspaceContext';
import { api } from '../lib/api';
import { todayPlus } from '../lib/format';
import type { Assessment, AssessmentStatus, Vendor } from '../lib/types';

export function AssessmentsPage() {
  const { currentOrg, loading: orgLoading } = useWorkspace();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [open, setOpen] = useState(false);

  async function load() {
    if (!currentOrg) return;
    setLoading(true);
    setError('');
    try {
      const [assessmentRows, vendorRows] = await Promise.all([
        api.assessments(currentOrg.id) as Promise<Assessment[]>,
        api.vendors(currentOrg.id) as Promise<Vendor[]>
      ]);
      setAssessments(assessmentRows);
      setVendors(vendorRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Assessments could not be loaded.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [currentOrg?.id]);

  if (orgLoading) return <LoadingBlock label="Loading workspace..." />;
  if (!currentOrg) return <Onboarding />;

  return (
    <>
      <PageHeader title="Assessments" eyebrow="Control maturity and vendor review approvals" action={<button className="btn-primary" disabled={vendors.length === 0} onClick={() => setOpen(true)}><Plus size={18} /> New assessment</button>} />
      {success && <p className="mb-4 rounded-md bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">{success}</p>}
      {loading ? <LoadingBlock /> : error ? <ErrorBlock message={error} onRetry={load} /> : assessments.length === 0 ? <EmptyBlock title="No assessments recorded" body="Create an assessment to track scoring and approval status by vendor." /> : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase text-moss">
              <tr><th className="px-4 py-3">Assessment</th><th className="px-4 py-3">Vendor</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Score</th><th className="px-4 py-3">Due date</th></tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {assessments.map((assessment) => (
                <tr key={assessment.id}>
                  <td className="px-4 py-3 font-semibold">{assessment.name}</td>
                  <td className="px-4 py-3 text-moss">{assessment.vendors?.name ?? '-'}</td>
                  <td className="px-4 py-3"><StatusBadge value={assessment.status} /></td>
                  <td className="px-4 py-3 font-semibold">{assessment.score}%</td>
                  <td className="px-4 py-3 text-moss">{assessment.due_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {open && <AssessmentModal vendors={vendors} saving={saving} onClose={() => setOpen(false)} onSubmit={async (payload) => {
        if (!currentOrg) return;
        setSaving(true);
        setError('');
        try {
          await api.createAssessment(currentOrg.id, payload);
          setOpen(false);
          setSuccess('Assessment created.');
          await load();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Assessment could not be created.');
        } finally {
          setSaving(false);
        }
      }} />}
    </>
  );
}

function AssessmentModal({ vendors, saving, onSubmit, onClose }: { vendors: Vendor[]; saving: boolean; onSubmit: (payload: { vendor_id: string; name: string; status: AssessmentStatus; due_date: string; score: number }) => Promise<void>; onClose: () => void }) {
  const [form, setForm] = useState({ vendor_id: vendors[0]?.id ?? '', name: '', status: 'draft' as AssessmentStatus, due_date: todayPlus(30), score: 70 });
  return (
    <Modal title="Create assessment" onClose={onClose}>
      {vendors.length === 0 && <p className="mb-4 rounded-md bg-amber-50 p-3 text-sm font-semibold text-amber-900">Add at least one vendor before creating an assessment.</p>}
      <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}>
        <label><span className="label">Vendor</span><select className="field mt-1" required value={form.vendor_id} onChange={(e) => setForm({ ...form, vendor_id: e.target.value })}>{vendors.map((vendor) => <option value={vendor.id} key={vendor.id}>{vendor.name}</option>)}</select></label>
        <label><span className="label">Assessment name</span><input className="field mt-1" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <div className="grid gap-4 md:grid-cols-3">
          <label><span className="label">Status</span><select className="field mt-1" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AssessmentStatus })}><option value="draft">Draft</option><option value="in_review">In review</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></label>
          <label><span className="label">Due date</span><input className="field mt-1" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></label>
          <label><span className="label">Score</span><input className="field mt-1" type="number" min="0" max="100" value={form.score} onChange={(e) => setForm({ ...form, score: Number(e.target.value) })} /></label>
        </div>
        <button className="btn-primary" disabled={saving || vendors.length === 0}>{saving ? 'Saving...' : 'Create assessment'}</button>
      </form>
    </Modal>
  );
}
