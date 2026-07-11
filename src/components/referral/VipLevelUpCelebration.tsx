"use client";

import { useEffect } from "react";
import { Award, CheckCircle2, X } from "lucide-react";
import { formatNaira } from "@/lib/domain";
import { Button } from "@/components/ui/Button";
import { ConfettiBurst } from "@/components/referral/ConfettiBurst";

type Props = {
  label: string;
  level: number;
  commissionPercent: number;
  milestoneBonus: number;
  onClose: () => void;
};

export function VipLevelUpCelebration({ label, level, commissionPercent, milestoneBonus, onClose }: Props) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
      <ConfettiBurst />
      <div className="relative w-full max-w-md animate-fade-up overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-raised)] shadow-[var(--shadow-lg)]">
        <div className="bg-gradient-to-br from-[var(--navy)] to-[var(--emerald)] px-6 py-8 text-center text-white">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/15 ring-2 ring-white/30">
            <Award size={32} aria-hidden />
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Level up</p>
          <h2 className="mt-2 text-2xl font-bold">{label}</h2>
          <p className="mt-2 text-sm text-white/80">VIP level {level} unlocked</p>
        </div>

        <div className="space-y-3 px-6 py-6 text-sm">
          <div className="flex items-center gap-2 text-[var(--heading)]">
            <CheckCircle2 size={16} className="text-[var(--emerald)]" />
            Commission increased to <strong>{commissionPercent}%</strong>
          </div>
          {milestoneBonus > 0 ? (
            <div className="flex items-center gap-2 text-[var(--heading)]">
              <CheckCircle2 size={16} className="text-[var(--emerald)]" />
              Milestone bonus <strong className="currency-ngn">{formatNaira(milestoneBonus)}</strong> credited
            </div>
          ) : null}
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <CheckCircle2 size={16} className="text-[var(--emerald)]" />
            Badge unlocked on your profile
          </div>
        </div>

        <div className="border-t border-[var(--border)] px-6 py-4">
          <Button type="button" className="w-full" onClick={onClose}>
            Continue
          </Button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-2 text-white/80 hover:bg-white/10"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
