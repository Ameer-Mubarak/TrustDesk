import { useEffect, useState } from 'react';
import { CalendarClock, CreditCard, Shield } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../components/StateBlock';
import { Onboarding } from '../components/Onboarding';
import { useWorkspace } from '../context/WorkspaceContext';
import { api } from '../lib/api';
import type { Dashboard } from '../lib/types';

export function BillingPage() {
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
      setError(err instanceof Error ? err.message : 'Subscription details could not be loaded.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [currentOrg?.id]);

  if (orgLoading) return <LoadingBlock label="Loading workspace..." />;
  if (!currentOrg) return <Onboarding />;
  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} onRetry={load} />;
  if (!dashboard) return <EmptyBlock title="No subscription record" body="Create a workspace subscription entry to enable billing controls." />;

  const sub = dashboard.subscription;

  return (
    <>
      <PageHeader title="Billing and subscription" eyebrow="Subscription-ready structure for commercial rollout" />
      <section className="grid gap-5 md:grid-cols-3">
        <article className="panel p-5">
          <CreditCard className="text-signal" />
          <p className="mt-4 text-sm font-semibold uppercase text-moss">Plan</p>
          <p className="mt-1 text-3xl font-black capitalize">{sub.plan}</p>
        </article>
        <article className="panel p-5">
          <Shield className="text-signal" />
          <p className="mt-4 text-sm font-semibold uppercase text-moss">Status</p>
          <p className="mt-1 text-3xl font-black capitalize">{sub.status}</p>
        </article>
        <article className="panel p-5">
          <CalendarClock className="text-signal" />
          <p className="mt-4 text-sm font-semibold uppercase text-moss">Renewal</p>
          <p className="mt-1 text-3xl font-black">{sub.renewal_date}</p>
        </article>
      </section>
      <section className="panel mt-6 p-5">
        <h2 className="text-lg font-bold">Seat allocation and commercial guardrails</h2>
        <p className="mt-3 text-sm text-moss">Active seats: {sub.seats}. This module is backend-ready for Stripe or ERP billing integration by syncing `subscriptions` plan, status, seats, and renewal date.</p>
      </section>
    </>
  );
}
