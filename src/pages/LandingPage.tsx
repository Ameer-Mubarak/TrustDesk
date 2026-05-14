import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ShieldCheck, TrendingUp } from 'lucide-react';

export function LandingPage() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <section className="relative overflow-hidden border-b border-stone-200 bg-[linear-gradient(135deg,#f7f4ed_0%,#e4ecd9_48%,#f1d7c6_100%)]">
        <div className="mx-auto grid min-h-[88vh] max-w-7xl gap-10 px-5 py-8 md:grid-cols-[1fr_0.9fr] md:items-center lg:px-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/70 px-3 py-1 text-sm font-semibold text-moss">
              <ShieldCheck size={16} /> Enterprise vendor risk operations
            </div>
            <h1 className="mt-6 max-w-3xl text-5xl font-black leading-tight md:text-7xl">TrustDesk</h1>
            <p className="mt-5 max-w-2xl text-xl leading-8 text-[#33443c]">
              Turn vendor reviews, evidence collection, remediation tasks, and audit history into a governed workflow your security and procurement teams can run every week.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth" className="btn-primary">Start verified workspace <ArrowRight size={18} /></Link>
              <a href="#workflow" className="btn-secondary">View workflow</a>
            </div>
          </div>
          <div className="panel overflow-hidden bg-white/80">
            <div className="border-b border-stone-200 p-5">
              <p className="label">Live risk command view</p>
              <h2 className="mt-1 text-2xl font-bold">Critical vendor exposure</h2>
            </div>
            <div className="grid gap-4 p-5">
              {[
                ['Restricted data processors', '8 vendors', 'high'],
                ['Open remediation tasks', '31 tasks', 'critical'],
                ['Average assessment score', '82%', 'medium']
              ].map(([label, value, tone]) => (
                <div className="rounded-md border border-stone-200 bg-paper p-4" key={label}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-moss">{label}</span>
                    <span className={`status-pill ${tone === 'critical' ? 'bg-red-100 text-red-900' : tone === 'high' ? 'bg-orange-100 text-orange-900' : 'bg-amber-100 text-amber-900'}`}>{tone}</span>
                  </div>
                  <p className="mt-2 text-3xl font-black">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section id="workflow" className="mx-auto grid max-w-7xl gap-4 px-5 py-12 md:grid-cols-3 lg:px-8">
        {[
          ['Centralize vendor intake', 'Procurement and security work from the same vendor record, spend profile, owner, access level, and review cadence.', ShieldCheck],
          ['Drive remediation', 'Assessment findings become accountable tasks with due dates, priorities, assignees, and audit history.', CheckCircle2],
          ['Report operational ROI', 'Dashboards expose risk mix, open work, vendor spend under review, and control maturity.', TrendingUp]
        ].map(([title, body, Icon]) => (
          <article className="panel p-6" key={String(title)}>
            <Icon className="text-signal" />
            <h3 className="mt-4 text-lg font-bold">{title as string}</h3>
            <p className="mt-2 text-sm leading-6 text-moss">{body as string}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
