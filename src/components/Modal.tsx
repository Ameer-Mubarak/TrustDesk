import { X } from 'lucide-react';

export function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-ink/40 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-auto rounded-lg bg-paper shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button className="rounded-md p-2 hover:bg-stone-200" onClick={onClose} aria-label="Close modal"><X size={20} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
