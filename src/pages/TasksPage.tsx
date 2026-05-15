import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../components/StateBlock';
import { RiskBadge, StatusBadge } from '../components/Badge';
import { Onboarding } from '../components/Onboarding';
import { useWorkspace } from '../context/WorkspaceContext';
import { api } from '../lib/api';
import { todayPlus } from '../lib/format';
import type { Risk, Task, TaskStatus, Vendor } from '../lib/types';

export function TasksPage() {
  const { currentOrg, loading: orgLoading } = useWorkspace();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function load() {
    if (!currentOrg) return;
    setLoading(true);
    setError('');
    try {
      const [taskRows, vendorRows] = await Promise.all([
        api.tasks(currentOrg.id, status ? `?status=${status}` : '') as Promise<Task[]>,
        api.vendors(currentOrg.id) as Promise<Vendor[]>
      ]);
      setTasks(taskRows);
      setVendors(vendorRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tasks could not be loaded.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [currentOrg?.id, status]);

  if (orgLoading) return <LoadingBlock label="Loading workspace..." />;
  if (!currentOrg) return <Onboarding />;

  return (
    <>
      <PageHeader title="Remediation tasks" eyebrow="Track accountable follow-up from every assessment" action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={18} /> New task</button>} />
      <section className="mb-5 flex flex-wrap items-center gap-3">
        <select className="field max-w-xs" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All task statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="blocked">Blocked</option>
          <option value="done">Done</option>
        </select>
      </section>
      {success && <p className="mb-4 rounded-md bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">{success}</p>}
      {loading ? <LoadingBlock /> : error ? <ErrorBlock message={error} onRetry={load} /> : tasks.length === 0 ? <EmptyBlock title="No tasks in this view" body="Create remediation work and assign deadlines so reviewers can follow through." /> : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {tasks.map((task) => (
            <article className="panel p-5" key={task.id}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-bold">{task.title}</h3>
                <RiskBadge risk={task.priority} />
              </div>
              <p className="mt-2 text-sm text-moss">{task.description || 'No description provided.'}</p>
              <div className="mt-4 flex items-center gap-2">
                <StatusBadge value={task.status} />
                <span className="text-xs text-moss">Due {task.due_date}</span>
              </div>
              <p className="mt-3 text-xs font-semibold text-moss">{task.vendors?.name ?? 'No linked vendor'}</p>
            </article>
          ))}
        </div>
      )}
      {open && <TaskModal vendors={vendors} saving={saving} onClose={() => setOpen(false)} onSubmit={async (payload) => {
        if (!currentOrg) return;
        setSaving(true);
        setError('');
        try {
          await api.createTask(currentOrg.id, payload);
          setOpen(false);
          setSuccess('Task created.');
          await load();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Task could not be created.');
        } finally {
          setSaving(false);
        }
      }} />}
    </>
  );
}

function TaskModal({ vendors, saving, onSubmit, onClose }: { vendors: Vendor[]; saving: boolean; onSubmit: (payload: { vendor_id: string | null; title: string; description: string; status: TaskStatus; priority: Risk; due_date: string }) => Promise<void>; onClose: () => void }) {
  const [form, setForm] = useState({ vendor_id: vendors[0]?.id ?? null, title: '', description: '', status: 'open' as TaskStatus, priority: 'medium' as Risk, due_date: todayPlus(14) });
  return (
    <Modal title="Create remediation task" onClose={onClose}>
      <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}>
        <label><span className="label">Title</span><input className="field mt-1" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
        <label><span className="label">Description</span><textarea className="field mt-1 min-h-24" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
        <div className="grid gap-4 md:grid-cols-2">
          <label><span className="label">Vendor</span><select className="field mt-1" value={form.vendor_id ?? ''} onChange={(e) => setForm({ ...form, vendor_id: e.target.value })}><option value="">No vendor</option>{vendors.map((vendor) => <option value={vendor.id} key={vendor.id}>{vendor.name}</option>)}</select></label>
          <label><span className="label">Due date</span><input className="field mt-1" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></label>
          <label><span className="label">Status</span><select className="field mt-1" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}><option value="open">Open</option><option value="in_progress">In progress</option><option value="blocked">Blocked</option><option value="done">Done</option></select></label>
          <label><span className="label">Priority</span><select className="field mt-1" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Risk })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></label>
        </div>
        <button className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Create task'}</button>
      </form>
    </Modal>
  );
}
