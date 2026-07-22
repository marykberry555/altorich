"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  Copy,
  Crown,
  Mail,
  MessageCircle,
  Send,
  Share2,
  Users,
  Wallet
} from "lucide-react";
import type { ReferralActivityRow, ReferralDashboard, VipLevelConfig } from "@/lib/referral/types";
import { formatNaira } from "@/lib/domain";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ReferralPayoutPanel } from "@/components/referral/ReferralPayoutPanel";
import { ReferralProgressCard } from "@/components/financial/ReferralProgressCard";
import { buildReferralProgress } from "@/lib/financial-events/referral-progress";
import { VipLevelUpCelebration } from "@/components/referral/VipLevelUpCelebration";
import { VipLevelCardGrid } from "@/components/referral/VipLevelCardGrid";
import { VipProgressPanel } from "@/components/referral/VipProgressPanel";
import { OfficialSocialLinks } from "@/components/social/OfficialSocialLinks";
import { getVipDisplayTitle } from "@/lib/referral/vip-display";

type Props = {
  initialDashboard: ReferralDashboard;
  vipLevels: VipLevelConfig[];
};

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function formatJoinedDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function ReferralMemberCard({ row }: { row: ReferralActivityRow }) {
  const progress = buildReferralProgress(row, { emailVerified: row.verifiedAt != null });
  return <ReferralProgressCard referral={progress} />;
}

export function ReferralDashboardClient({ initialDashboard, vipLevels }: Props) {
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [levelUp, setLevelUp] = useState<{ label: string; level: number; commission: number; bonus: number } | null>(null);

  const shareText = encodeURIComponent(
    `Join me on Alto Rich — grow your wealth with a trusted platform. ${dashboard.inviteLink}`
  );
  const shareUrl = encodeURIComponent(dashboard.inviteLink);

  const copy = useCallback(async (value: string, kind: "code" | "link") => {
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  useEffect(() => {
    fetch("/api/notifications?limit=5")
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => [])
      .then((items: { title: string; metadata?: { event?: string; label?: string; level?: number; commission_percent?: number; milestone_bonus?: number }; read_at?: string | null }[]) => {
        const unread = items.find((n) => n.metadata?.event === "vip.level_up" && !n.read_at);
        if (unread?.metadata) {
          setLevelUp({
            label: String(unread.metadata.label ?? "New level"),
            level: Number(unread.metadata.level ?? 0),
            commission: Number(unread.metadata.commission_percent ?? 0),
            bonus: Number(unread.metadata.milestone_bonus ?? 0)
          });
        }
      });
  }, []);

  const currentTier = vipLevels.find((v) => v.level === dashboard.vipLevel) ?? vipLevels[0];
  const currentDisplayLabel = currentTier
    ? getVipDisplayTitle(currentTier.level, currentTier.label)
    : dashboard.vipLabel;

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(dashboard.inviteLink)}`;

  return (
    <div className="space-y-8">
      {levelUp ? (
        <VipLevelUpCelebration
          label={levelUp.label}
          level={levelUp.level}
          commissionPercent={levelUp.commission}
          milestoneBonus={levelUp.bonus}
          onClose={() => setLevelUp(null)}
        />
      ) : null}

      <header className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-gradient-to-br from-[var(--navy)] via-[var(--navy-mid)] to-[#0a1628] p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[var(--emerald)]/20 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">Referral programme</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Invite friends</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/80">
              Share your link. Earn when they invest.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
            <Crown className="text-[var(--gold-light)]" size={28} aria-hidden />
            <div>
              <p className="text-xs uppercase tracking-wide text-white/60">Your VIP level</p>
              <p className="text-lg font-bold">{currentDisplayLabel}</p>
              <p className="text-xs text-white/70">{dashboard.currentCommissionRate}% commission</p>
            </div>
          </div>
        </div>
      </header>

      <section aria-labelledby="your-network-heading">
        <Card variant="elevated" padding="lg">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Your Network</p>
              <h2 id="your-network-heading" className="mt-1 text-2xl font-bold text-[var(--heading)]">
                {dashboard.totalReferrals} {dashboard.totalReferrals === 1 ? "Referral" : "Referrals"}
              </h2>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--text-subtle)]">Verified Investors</p>
                <p className="mt-0.5 text-lg font-bold tabular-nums text-[var(--emerald)]">{dashboard.verifiedInvestors}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--text-subtle)]">Pending</p>
                <p className="mt-0.5 text-lg font-bold tabular-nums text-[var(--gold)]">{dashboard.pendingReferrals}</p>
              </div>
            </div>
          </div>

          <h3 className="mt-6 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-subtle)]">
            <Users size={14} aria-hidden />
            Who joined with your link
          </h3>

          {dashboard.recentReferrals.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--text-muted)]">No referrals yet — share your link to get started.</p>
          ) : (
            <ul className="mt-4 grid gap-3">
              {dashboard.recentReferrals.map((row) => (
                <li key={row.id}>
                  <ReferralMemberCard row={row} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card variant="elevated" className="lg:col-span-3">
          <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--heading)]">
            <Share2 size={18} className="text-[var(--emerald)]" />
            Share your referral
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--gray-50)] p-4 dark:bg-[var(--surface)]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-subtle)]">Referral code</p>
              <p className="mt-2 text-2xl font-bold tracking-widest text-[var(--heading)]">{dashboard.inviteCode}</p>
              <Button type="button" size="sm" variant="outline" className="mt-3 gap-2" onClick={() => copy(dashboard.inviteCode, "code")}>
                {copied === "code" ? <Check size={14} /> : <Copy size={14} />}
                {copied === "code" ? "Copied" : "Copy code"}
              </Button>
            </div>

            <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--gray-50)] p-4 dark:bg-[var(--surface)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrSrc} alt="Referral QR code" width={140} height={140} className="rounded-lg" />
              <p className="mt-2 text-xs text-[var(--text-muted)]">Scan to register</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-[var(--border)] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-subtle)]">Referral link</p>
            <p className="mt-2 break-all text-sm font-medium text-[var(--heading)]">{dashboard.inviteLink}</p>
            <Button type="button" size="md" className="mt-3 gap-2" onClick={() => copy(dashboard.inviteLink, "link")}>
              {copied === "link" ? <Check size={14} /> : <Copy size={14} />}
              {copied === "link" ? "Copied" : "Invite friends — copy link"}
            </Button>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <a
              href={`https://wa.me/?text=${shareText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--heading)] transition hover:bg-[var(--gray-50)]"
            >
              <MessageCircle size={14} /> WhatsApp
            </a>
            <a
              href={`https://t.me/share/url?url=${shareUrl}&text=${shareText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--heading)] transition hover:bg-[var(--gray-50)]"
            >
              <Send size={14} /> Telegram
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--heading)] transition hover:bg-[var(--gray-50)]"
            >
              <Share2 size={14} /> Facebook
            </a>
            <a
              href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--heading)] transition hover:bg-[var(--gray-50)]"
            >
              <XIcon className="h-3.5 w-3.5" /> X
            </a>
            <a
              href={`mailto:?subject=${encodeURIComponent("Join Alto Rich")}&body=${shareText}`}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--heading)] transition hover:bg-[var(--gray-50)]"
            >
              <Mail size={14} /> Email
            </a>
          </div>

          <div className="mt-6 border-t border-[var(--border)] pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-subtle)]">Follow us</p>
            <OfficialSocialLinks className="mt-3" size="sm" />
          </div>
        </Card>

        <Card variant="elevated" className="lg:col-span-2">
          <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--heading)]">
            <Wallet size={18} className="text-[var(--emerald)]" />
            Referral wallet
          </h2>

          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--text-muted)]">Available rewards</dt>
              <dd className="currency-ngn font-bold tabular-nums text-[var(--emerald)]">{formatNaira(dashboard.referralWalletBalance)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--text-muted)]">Minimum required</dt>
              <dd className="currency-ngn font-semibold tabular-nums">{formatNaira(dashboard.minPayoutThreshold)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--text-muted)]">Next settlement</dt>
              <dd className="text-right font-semibold text-[var(--heading)]">Monday 9:00 AM</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--text-muted)]">Withdrawal status</dt>
              <dd className="text-right font-semibold text-[var(--heading)]">
                {dashboard.canRequestPayout
                  ? "Open"
                  : dashboard.meetsPayoutThreshold
                    ? "Awaiting Monday"
                    : "Below minimum"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--text-muted)]">Lifetime rewards</dt>
              <dd className="currency-ngn font-semibold tabular-nums">{formatNaira(dashboard.lifetimeRewards)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--text-muted)]">Already paid</dt>
              <dd className="currency-ngn font-semibold tabular-nums">{formatNaira(dashboard.alreadyPaid)}</dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-[var(--border)] pt-3">
              <dt className="text-[var(--text-muted)]">Commission rate</dt>
              <dd className="font-bold text-[var(--heading)]">{dashboard.currentCommissionRate}%</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--text-muted)]">Investment generated</dt>
              <dd className="currency-ngn font-semibold tabular-nums">{formatNaira(dashboard.totalInvestmentGenerated)}</dd>
            </div>
          </dl>
        </Card>
      </div>

      <VipProgressPanel
        currentLevel={dashboard.vipLevel}
        currentLabel={currentDisplayLabel}
        currentCommission={dashboard.currentCommissionRate}
        verifiedCount={dashboard.verifiedInvestors}
        nextTier={dashboard.nextVipLevel}
      />

      <ReferralPayoutPanel dashboard={dashboard} onSuccess={() => window.location.reload()} />

      {dashboard.recentRewards.length > 0 ? (
        <Card variant="elevated">
          <h2 className="text-lg font-bold text-[var(--heading)]">Recent rewards</h2>
          <ul className="mt-4 divide-y divide-[var(--border)]">
            {dashboard.recentRewards.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium capitalize text-[var(--heading)]">{row.rewardType}</p>
                  <p className="text-xs text-[var(--text-subtle)]">{formatJoinedDate(row.createdAt)}</p>
                </div>
                <p className="currency-ngn font-bold tabular-nums text-[var(--emerald)]">+{formatNaira(row.amount)}</p>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div>
        <h2 className="text-lg font-bold text-[var(--heading)]">VIP levels</h2>
        <VipLevelCardGrid tiers={vipLevels} currentLevel={dashboard.vipLevel} className="mt-5" />
      </div>
    </div>
  );
}
