import { Download, FileText } from "lucide-react";
import { EXPORT_CATALOG } from "@/lib/admin-ops/exports";
import { Button } from "@/components/ui/Button";

export function ExportCenterPanel() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {EXPORT_CATALOG.map((item) => (
        <article key={item.id} className="rounded-xl border border-white/10 bg-zinc-900/80 p-5">
          <div className="flex items-start gap-3">
            <FileText size={18} className="shrink-0 text-emerald-400" aria-hidden />
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-white">{item.label}</h3>
              <p className="mt-1 text-sm text-zinc-400">{item.description}</p>
              <p className="mt-2 text-[10px] uppercase tracking-wider text-zinc-500">
                Formats: {item.formats.join(", ").toUpperCase()}
              </p>
            </div>
          </div>
          <div className="mt-4">
            {item.available && item.href ? (
              <a href={item.href} download>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Download size={14} /> Download CSV
                </Button>
              </a>
            ) : (
              <Button size="sm" variant="outline" disabled className="gap-1.5">
                <Download size={14} /> Coming soon
              </Button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
