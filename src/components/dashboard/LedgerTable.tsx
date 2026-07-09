"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/domain";
import {
  DataTable,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/design-system";

export type LedgerRow = {
  id: string;
  type: string;
  amount: number;
  reason: string;
  created_at: string;
  status: string;
  reference?: string | null;
};

type Props = {
  rows: LedgerRow[];
  compact?: boolean;
};

export function LedgerTable({ rows, compact }: Props) {
  const [selected, setSelected] = useState<LedgerRow | null>(null);

  return (
    <>
      <DataTable>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              {!compact ? <TableHead>Date</TableHead> : null}
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} className="cursor-pointer" onClick={() => setSelected(row)}>
                <TableCell className="font-medium capitalize">{row.reason.replace(/_/g, " ")}</TableCell>
                <TableCell
                  className={cnAmount(row.type)}
                >
                  {row.type === "credit" ? "+" : "−"}
                  {formatNaira(row.amount)}
                </TableCell>
                {!compact ? (
                  <TableCell className="text-[var(--text-muted)]">
                    {new Date(row.created_at).toLocaleString("en-NG")}
                  </TableCell>
                ) : null}
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataTable>

      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-lg)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-[var(--heading)]">Transaction details</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-[var(--text-subtle)]">Type</dt>
                <dd className="mt-0.5 capitalize">{selected.reason.replace(/_/g, " ")}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-subtle)]">Amount</dt>
                <dd className={cn("mt-0.5 text-lg font-semibold tabular-nums", cnAmount(selected.type))}>
                  {selected.type === "credit" ? "+" : "−"}
                  {formatNaira(selected.amount)}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--text-subtle)]">Status</dt>
                <dd className="mt-1">
                  <StatusBadge status={selected.status} />
                </dd>
              </div>
              <div>
                <dt className="text-[var(--text-subtle)]">Date</dt>
                <dd className="mt-0.5">{new Date(selected.created_at).toLocaleString("en-NG")}</dd>
              </div>
            </dl>
            <button type="button" className="button mt-6 w-full" onClick={() => setSelected(null)}>
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function cnAmount(type: string) {
  return type === "credit" ? "text-right font-medium text-[var(--emerald)]" : "text-right font-medium text-[var(--text)]";
}
