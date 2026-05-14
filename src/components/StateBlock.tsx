import { AlertTriangle, Inbox } from 'lucide-react';

export function LoadingBlock({ label = 'Loading operational data...' }: { label?: string }) {
  return <div className="panel p-6 text-sm text-moss">{label}</div>;
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="panel flex items-center justify-between gap-4 border-red-200 bg-red-50 p-5 text-red-900">
      <div className="flex items-center gap-3"><AlertTriangle size={20} /> <span className="text-sm font-semibold">{message}</span></div>
      {onRetry && <button className="btn-secondary" onClick={onRetry}>Retry</button>}
    </div>
  );
}

export function EmptyBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="panel flex flex-col items-center justify-center p-10 text-center">
      <Inbox className="text-moss" size={34} />
      <h3 className="mt-3 text-lg font-bold">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-moss">{body}</p>
    </div>
  );
}
