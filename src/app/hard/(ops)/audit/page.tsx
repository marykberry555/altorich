import { getServiceRoleServices } from "@/lib/services";
import { DataTable, SectionHeading, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/design-system";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const services = await getServiceRoleServices();
  const auditLogs = services ? await services.audit.list({ limit: 100 }) : [];

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--emerald)]">System</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--heading)]">Audit log</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Immutable record of sensitive admin actions.</p>
      </header>

      <Card variant="elevated" padding="md">
        <SectionHeading title={`Recent entries (${auditLogs.length})`} />
        <DataTable>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-[var(--text-subtle)]">
                    No audit entries yet
                  </TableCell>
                </TableRow>
              ) : (
                auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">{log.action}</TableCell>
                    <TableCell className="text-[var(--text-muted)]">
                      {log.entity_type}
                      {log.entity_id ? ` · ${String(log.entity_id).slice(0, 8)}` : ""}
                    </TableCell>
                    <TableCell>{new Date(log.created_at).toLocaleString("en-NG")}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </DataTable>
      </Card>
    </div>
  );
}
