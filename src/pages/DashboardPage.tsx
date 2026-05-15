import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, ClipboardCheck, DollarSign, Users } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../components/StateBlock';
import { Onboarding } from '../components/Onboarding';
import { useWorkspace } from '../context/WorkspaceContext';
import { api } from '../lib/api';
import { money, title } from '../lib/format';
import type { Dashboard } from '../lib/types';
import React from 'react';

export function DashboardPage() {
  const { currentOrg, loading: orgLoading } = useWorkspace();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    if (!currentOrg) return;
    setLoading(true);
    setError('');
    try {
      setDashboard(await api.dashboard(currentOrg.id) as Dashboard);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dashboard could not be loaded.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [currentOrg?.id]);

  if (orgLoading) return <LoadingBlock label="Loading workspace..." />;
  if (!currentOrg) return <Onboarding />;
  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} onRetry={load} />;
  if (!dashboard) return <EmptyBlock title="No reporting data yet" body="Create vendors and assessments to populate TrustDesk analytics." />;

  const metrics = [
    ['Vendors under governance', dashboard.metrics.vendors, Users],
    ['Critical vendors', dashboard.metrics.criticalVendors, AlertTriangle],
    ['Open tasks', dashboard.metrics.openTasks, ClipboardCheck],
    ['Assessment score', `${dashboard.metrics.averageScore}%`, Activity],
    ['Annual spend reviewed', money(dashboard.metrics.annualSpend), DollarSign]
  ];

  return (
    <>
      <PageHeader title="Risk operations dashboard" eyebrow={currentOrg.name} />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map(([label, value, Icon]) => (
          <article className="panel p-5" key={String(label)}>
            {React.createElement(Icon as React.ComponentType<{ className?: string; size?: number }>, { className: "text-signal", size: 21 })}
            <p className="mt-4 text-2xl font-black">{value as string}</p>
            <p className="mt-1 text-sm font-semibold text-moss">{label as string}</p>
          </article>
        ))}
      </section>
      <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="panel p-5">
          <h2 className="text-lg font-bold">Risk distribution</h2>
          <div className="mt-5 grid gap-3">
            {dashboard.riskBreakdown.map((item) => (
              <div key={item.risk}>
                <div className="mb-1 flex justify-between text-sm font-semibold"><span>{title(item.risk)}</span><span>{item.count}</span></div>
                <div className="h-3 rounded-full bg-stone-100"><div className="h-3 rounded-full bg-signal" style={{ width: `${dashboard.metrics.vendors ? (item.count / dashboard.metrics.vendors) * 100 : 0}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel p-5">
          <h2 className="text-lg font-bold">Activity history</h2>
          <div className="mt-4 divide-y divide-stone-200">
            {dashboard.activity.length === 0 ? <p className="py-6 text-sm text-moss">No activity has been recorded yet.</p> : dashboard.activity.map((event) => (
              <div className="py-3" key={event.id}>
                <p className="text-sm font-semibold">{title(event.entity_type)} {event.action}</p>
                <p className="text-xs text-moss">{new Date(event.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
