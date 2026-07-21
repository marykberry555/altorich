"use client";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function AdminConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  destructive,
  onConfirm,
  onCancel
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="admin-confirm-title">
      <button type="button" className="absolute inset-0 bg-black/70" onClick={onCancel} aria-label="Close dialog" />
      <div className="relative w-full max-w-md rounded-xl border border-white/10 bg-zinc-900 p-5 shadow-2xl">
        <h2 id="admin-confirm-title" className="text-lg font-semibold text-white">
          {title}
        </h2>
        {description ? <p className="mt-2 text-sm text-zinc-400">{description}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={
              destructive
                ? "rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
                : "rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
