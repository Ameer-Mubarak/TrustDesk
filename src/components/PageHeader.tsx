export function PageHeader({ title, eyebrow, action }: { title: string; eyebrow: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="label">{eyebrow}</p>
        <h1 className="mt-1 text-3xl font-bold text-ink">{title}</h1>
      </div>
      {action}
    </div>
  );
}
