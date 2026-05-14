import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BarChart3, CreditCard, FileCheck2, ListChecks, LogOut, Settings, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';

const nav = [
  { to: '/app', label: 'Dashboard', icon: BarChart3 },
  { to: '/app/vendors', label: 'Vendors', icon: Users },
  { to: '/app/assessments', label: 'Assessments', icon: FileCheck2 },
  { to: '/app/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/app/billing', label: 'Billing', icon: CreditCard },
  { to: '/app/settings', label: 'Settings', icon: Settings }
];

export function AppLayout() {
  const { signOut, user } = useAuth();
  const { organizations, currentOrg, setCurrentOrgId, role } = useWorkspace();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-paper text-ink">
      <aside className="fixed hidden h-screen w-64 border-r border-stone-200 bg-[#edf0e7] px-4 py-5 lg:block">
        <Link to="/app" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-ink text-white"><ShieldCheck size={21} /></span>
          <span>
            <span className="block text-lg font-bold">TrustDesk</span>
            <span className="block text-xs font-semibold uppercase text-moss">Vendor risk ops</span>
          </span>
        </Link>
        <nav className="mt-8 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/app'}
                className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold ${isActive ? 'bg-white text-signal shadow-sm' : 'text-moss hover:bg-white/70 hover:text-ink'}`}
              >
                <Icon size={18} /> {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-stone-200 bg-paper/95 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 lg:hidden">
              <ShieldCheck />
              <span className="text-lg font-bold">TrustDesk</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <select className="field max-w-xs" value={currentOrg?.id ?? ''} onChange={(event) => setCurrentOrgId(event.target.value)}>
                {organizations.map((row) => <option key={row.organizations.id} value={row.organizations.id}>{row.organizations.name}</option>)}
              </select>
              <span className="status-pill bg-white text-moss">{role ?? 'member'}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-moss sm:inline">{user?.email}</span>
              <button className="btn-secondary" onClick={async () => { await signOut(); navigate('/'); }}>
                <LogOut size={16} /> Sign out
              </button>
            </div>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto lg:hidden">
            {nav.map((item) => <NavLink key={item.to} to={item.to} end={item.to === '/app'} className={({ isActive }) => `whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold ${isActive ? 'bg-ink text-white' : 'bg-white text-moss'}`}>{item.label}</NavLink>)}
          </nav>
        </header>
        <main className="px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
