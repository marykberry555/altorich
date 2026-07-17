"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { LiveActivityCard } from "@/components/social/LiveActivityCard";
import { isSupabaseConfigured } from "@/lib/env";
import { isLiveActivityPath } from "@/lib/route-zones";
import { LIVE_ACTIVITY_CONFIG } from "@/lib/social/live-activity-config";
import { randomInRange } from "@/lib/social/live-activity-format";
import { loadLiveActivities, pickNextActivity } from "@/lib/social/live-activity-provider";
import {
  getSeenActivityIds,
  incrementShownCount,
  markActivitySeen,
  sessionLimitReached
} from "@/lib/social/live-activity-session";
import type { LiveActivity } from "@/lib/social/live-activity-types";
import { cn } from "@/lib/utils";

type Phase = "idle" | "entering" | "visible" | "leaving";

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

async function isSignedIn(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return Boolean(data.session?.user);
  } catch {
    return false;
  }
}

/**
 * Public-only Live Activity feed.
 * Never mounts on auth/member/admin routes, and never after login.
 */
export function LiveActivityFeed({ className }: { className?: string }) {
  const pathname = usePathname() ?? "/";
  const enabledPath = isLiveActivityPath(pathname);

  const [mounted, setMounted] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [activity, setActivity] = useState<LiveActivity | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [nowMs, setNowMs] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const poolRef = useRef<LiveActivity[]>([]);
  const timersRef = useRef<number[]>([]);
  const stoppedRef = useRef(false);
  const phaseRef = useRef<Phase>("idle");
  const showNextRef = useRef<() => void>(() => undefined);

  const clearTimers = useCallback(() => {
    for (const id of timersRef.current) window.clearTimeout(id);
    timersRef.current = [];
  }, []);

  const schedule = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
  }, []);

  const setPhaseSafe = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const hideThenContinue = useCallback(
    (delayBeforeNext: number) => {
      const animMs = prefersReducedMotion() ? 160 : LIVE_ACTIVITY_CONFIG.animationDurationMs;
      setPhaseSafe("leaving");
      schedule(() => {
        setActivity(null);
        setPhaseSafe("idle");
        if (stoppedRef.current || sessionLimitReached()) return;
        schedule(() => showNextRef.current(), delayBeforeNext);
      }, animMs);
    },
    [schedule, setPhaseSafe]
  );

  const showNext = useCallback(() => {
    void (async () => {
      if (stoppedRef.current || sessionLimitReached()) return;
      if (phaseRef.current !== "idle") return;

      if (poolRef.current.length === 0) {
        poolRef.current = await loadLiveActivities();
      }

      const next = pickNextActivity(poolRef.current, getSeenActivityIds());
      if (!next) {
        stoppedRef.current = true;
        return;
      }

      markActivitySeen(next.id);
      incrementShownCount();
      setNowMs(Date.now());
      setActivity(next);
      setPhaseSafe("entering");

      schedule(() => setPhaseSafe("visible"), prefersReducedMotion() ? 0 : 40);

      const displayMs = randomInRange(
        LIVE_ACTIVITY_CONFIG.displayDurationMs.min,
        LIVE_ACTIVITY_CONFIG.displayDurationMs.max
      );
      const gapMs = randomInRange(
        LIVE_ACTIVITY_CONFIG.subsequentDelayMs.min,
        LIVE_ACTIVITY_CONFIG.subsequentDelayMs.max
      );

      schedule(() => hideThenContinue(gapMs), displayMs);
    })();
  }, [hideThenContinue, schedule, setPhaseSafe]);

  showNextRef.current = showNext;

  const dismiss = useCallback(() => {
    if (!activity || phaseRef.current === "idle" || phaseRef.current === "leaving") return;
    clearTimers();
    const gapMs = randomInRange(
      LIVE_ACTIVITY_CONFIG.subsequentDelayMs.min,
      LIVE_ACTIVITY_CONFIG.subsequentDelayMs.max
    );
    hideThenContinue(gapMs);
  }, [activity, clearTimers, hideThenContinue]);

  useEffect(() => {
    setMounted(true);
    setReducedMotion(prefersReducedMotion());
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onMotion);
    return () => mq.removeEventListener("change", onMotion);
  }, []);

  useEffect(() => {
    if (!mounted || !enabledPath) {
      setAllowed(false);
      clearTimers();
      setActivity(null);
      setPhaseSafe("idle");
      return;
    }

    let cancelled = false;
    stoppedRef.current = false;

    void (async () => {
      if (sessionLimitReached()) {
        if (!cancelled) setAllowed(false);
        return;
      }
      const signedIn = await isSignedIn();
      if (cancelled) return;
      if (signedIn) {
        setAllowed(false);
        return;
      }
      setAllowed(true);
      poolRef.current = await loadLiveActivities();
      if (cancelled || stoppedRef.current) return;

      const firstDelay = randomInRange(
        LIVE_ACTIVITY_CONFIG.firstDelayMs.min,
        LIVE_ACTIVITY_CONFIG.firstDelayMs.max
      );
      schedule(() => showNextRef.current(), firstDelay);
    })();

    return () => {
      cancelled = true;
      clearTimers();
    };
  }, [mounted, enabledPath, pathname, clearTimers, schedule, setPhaseSafe]);

  useEffect(() => {
    if (!allowed || !isSupabaseConfigured()) return;
    let unsub: (() => void) | undefined;
    void (async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session?.user) {
            stoppedRef.current = true;
            clearTimers();
            setAllowed(false);
            setActivity(null);
            setPhaseSafe("idle");
          }
        });
        unsub = () => data.subscription.unsubscribe();
      } catch {
        // ignore
      }
    })();
    return () => unsub?.();
  }, [allowed, clearTimers, setPhaseSafe]);

  if (!mounted || !allowed || !activity) return null;

  const visible = phase === "entering" || phase === "visible";

  return (
    <div
      className={cn(
        "pointer-events-none fixed z-[80]",
        "bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2",
        "sm:bottom-6 sm:left-6 sm:right-auto sm:translate-x-0",
        className
      )}
    >
      <LiveActivityCard
        activity={activity}
        visible={visible}
        reducedMotion={reducedMotion}
        onDismiss={dismiss}
        nowMs={nowMs}
      />
    </div>
  );
}
