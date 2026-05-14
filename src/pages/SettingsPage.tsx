import { useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../components/StateBlock';
import { Modal } from '../components/Modal';
import { Onboarding } from '../components/Onboarding';
import { useWorkspace } from '../context/WorkspaceContext';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';

type Member = { user_id: string; role: string; created_at: string; profiles?: { full_name?: string; title?: string } };

export function SettingsPage() {
  const { currentOrg, loading: orgLoading } = useWorkspace();
  const [members, setMembers] = useState<Member[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profile, setProfile] = useState({ full_name: '', title: '' });

  async function load() {
    if (!currentOrg) return;
    setLoading(true);
    setError('');
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (userId) {
        const { data } = await supabase.from('profiles').select('full_name, title').eq('id', userId).single();
        if (data) setProfile(data);
      }
      setMembers(await api.members(currentOrg.id) as Member[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Settings data could not be loaded.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [currentOrg?.id]);

  if (orgLoading) return <LoadingBlock label="Loading workspace..." />;
  if (!currentOrg) return <Onboarding />;

  return (
    <>
      <PageHeader title="Settings and team" eyebrow="Manage profile and workspace membership" action={<button className="btn-primary" onClick={() => setOpen(true)}><UserPlus size={18} /> Invite member</button>} />
      {success && <p className="mb-4 rounded-md bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">{success}</p>}
      {loading ? <LoadingBlock /> : error ? <ErrorBlock message={error} onRetry={load} /> : (
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="panel p-5">
            <h2 className="text-lg font-bold">My profile</h2>
            <form className="mt-4 grid gap-4" onSubmit={async (event) => {
              event.preventDefault();
              setSaving(true);
              setError('');
              try {
                const { data: sessionData } = await supabase.auth.getSession();
                const userId = sessionData.session?.user.id;
                if (!userId) throw new Error('Session not found.');
                const { error: profileError } = await supabase.from('profiles').update(profile).eq('id', userId);
                if (profileError) throw profileError;
                setSuccess('Profile updated.');
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Profile update failed.');
              } finally {
                setSaving(false);
              }
            }}>
              <label><span className="label">Full name</span><input className="field mt-1" required value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} /></label>
              <label><span className="label">Title</span><input className="field mt-1" value={profile.title} onChange={(e) => setProfile({ ...profile, title: e.target.value })} /></label>
              <button className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save profile'}</button>
            </form>
          </section>
          <section className="panel p-5">
            <h2 className="text-lg font-bold">Workspace members</h2>
            {members.length === 0 ? <div className="mt-4"><EmptyBlock title="No members available" body="Invite members to start collaborative vendor governance." /></div> : (
              <div className="mt-4 divide-y divide-stone-200">
                {members.map((member) => (
                  <div key={member.user_id} className="py-3">
                    <p className="font-semibold">{member.profiles?.full_name ?? member.user_id}</p>
                    <p className="text-xs text-moss">{member.profiles?.title || 'No title'} · {member.role}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
      {open && <InviteModal saving={saving} onClose={() => setOpen(false)} onSubmit={async (payload) => {
        if (!currentOrg) return;
        setSaving(true);
        setError('');
        try {
          await api.invite(currentOrg.id, payload);
          setOpen(false);
          setSuccess('Invite recorded. Send your onboarding email from your identity provider.');
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Invite failed.');
        } finally {
          setSaving(false);
        }
      }} />}
    </>
  );
}

function InviteModal({ saving, onSubmit, onClose }: { saving: boolean; onSubmit: (payload: { email: string; role: 'admin' | 'analyst' | 'viewer' }) => Promise<void>; onClose: () => void }) {
  const [form, setForm] = useState({ email: '', role: 'analyst' as 'admin' | 'analyst' | 'viewer' });
  return (
    <Modal title="Invite workspace member" onClose={onClose}>
      <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}>
        <label><span className="label">Email address</span><input className="field mt-1" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label><span className="label">Role</span><select className="field mt-1" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as 'admin' | 'analyst' | 'viewer' })}><option value="admin">Admin</option><option value="analyst">Analyst</option><option value="viewer">Viewer</option></select></label>
        <button className="btn-primary" disabled={saving}>{saving ? 'Sending...' : 'Create invite'}</button>
      </form>
    </Modal>
  );
}
