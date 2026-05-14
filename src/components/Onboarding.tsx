import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { api } from '../lib/api';
import { useWorkspace } from '../context/WorkspaceContext';

export function Onboarding() {
  const { refresh } = useWorkspace();
  const [form, setForm] = useState({ name: '', slug: '', domain: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const updateName = (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64);
    setForm((current) => ({ ...current, name, slug }));
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper p-4">
      <form
        className="panel w-full max-w-xl p-7"
        onSubmit={async (event) => {
          event.preventDefault();
          setSaving(true);
          setError('');
          try {
            await api.createOrganization(form);
            await refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Workspace could not be created.');
          } finally {
            setSaving(false);
          }
        }}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-ink text-white"><Building2 /></div>
        <h1 className="mt-5 text-2xl font-bold">Create your risk workspace</h1>
        <p className="mt-2 text-sm text-moss">This workspace becomes the tenant boundary for vendors, assessments, tasks, members, audit events, and billing.</p>
        <div className="mt-6 grid gap-4">
          <label><span className="label">Company name</span><input className="field mt-1" required value={form.name} onChange={(e) => updateName(e.target.value)} /></label>
          <label><span className="label">Workspace slug</span><input className="field mt-1" required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></label>
          <label><span className="label">Company domain</span><input className="field mt-1" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} /></label>
        </div>
        {error && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-900">{error}</p>}
        <button className="btn-primary mt-6 w-full" disabled={saving}>{saving ? 'Creating workspace...' : 'Create workspace'}</button>
      </form>
    </main>
  );
}
