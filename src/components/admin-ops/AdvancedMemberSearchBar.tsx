"use client";

import { Filter, Search } from "lucide-react";
import type { MemberSearchFilters } from "@/lib/admin-ops/types";

type Props = {
  filters: MemberSearchFilters;
  onChange: (next: MemberSearchFilters) => void;
  onSearch: () => void;
};

export function AdvancedMemberSearchBar({ filters, onChange, onSearch }: Props) {
  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-zinc-900/80 p-4">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" aria-hidden />
        <input
          type="search"
          value={filters.q ?? ""}
          onChange={(e) => onChange({ ...filters, q: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          placeholder="Search name, email, phone, referral code, member ID…"
          className="w-full rounded-lg border border-white/10 bg-black/30 py-2.5 pl-9 pr-3 text-sm text-white"
          aria-label="Search members"
        />
      </div>

      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          <Filter size={12} /> Advanced filters
        </summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs text-zinc-500">
            Status
            <select
              value={filters.status ?? ""}
              onChange={(e) => onChange({ ...filters, status: e.target.value || undefined })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-sm text-white"
            >
              <option value="">Any</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="disabled">Disabled</option>
            </select>
          </label>
          <label className="text-xs text-zinc-500">
            KYC
            <select
              value={filters.kycStatus ?? ""}
              onChange={(e) => onChange({ ...filters, kycStatus: e.target.value || undefined })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-sm text-white"
            >
              <option value="">Any</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="requires_update">Requires update</option>
            </select>
          </label>
          <label className="text-xs text-zinc-500">
            Email verified
            <select
              value={filters.emailVerified ?? ""}
              onChange={(e) =>
                onChange({
                  ...filters,
                  emailVerified: (e.target.value as "yes" | "no" | "") || undefined
                })
              }
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-sm text-white"
            >
              <option value="">Any</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
          <label className="text-xs text-zinc-500">
            Member ID
            <input
              value={filters.memberId ?? ""}
              onChange={(e) => onChange({ ...filters, memberId: e.target.value || undefined })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-sm text-white font-mono"
            />
          </label>
          <label className="text-xs text-zinc-500">
            Referral code
            <input
              value={filters.inviteCode ?? ""}
              onChange={(e) => onChange({ ...filters, inviteCode: e.target.value || undefined })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-sm text-white"
            />
          </label>
          <label className="text-xs text-zinc-500">
            Registered from
            <input
              type="date"
              value={filters.registeredFrom?.slice(0, 10) ?? ""}
              onChange={(e) => onChange({ ...filters, registeredFrom: e.target.value || undefined })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-sm text-white"
            />
          </label>
          <label className="text-xs text-zinc-500">
            Registered to
            <input
              type="date"
              value={filters.registeredTo?.slice(0, 10) ?? ""}
              onChange={(e) => onChange({ ...filters, registeredTo: e.target.value || undefined })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-sm text-white"
            />
          </label>
          <label className="text-xs text-zinc-500">
            State / office
            <input
              value={filters.locationState ?? ""}
              onChange={(e) => onChange({ ...filters, locationState: e.target.value || undefined })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-sm text-white"
            />
          </label>
        </div>
      </details>

      <button
        type="button"
        onClick={onSearch}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
      >
        Apply filters
      </button>
    </div>
  );
}
