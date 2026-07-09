"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";

export type Testimonial = {
  name: string;
  role: string;
  quote: string;
};

type Props = {
  items: Testimonial[];
};

export function TestimonialsMarquee({ items }: Props) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [paused, setPaused] = useState(false);

  const doubled = useMemo(() => [...items, ...items], [items]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let isDown = false;
    let startX = 0;
    let startScrollLeft = 0;

    function onPointerDown(e: PointerEvent) {
      if (!track) return;
      if (!(e.pointerType === "touch" || e.pointerType === "pen" || e.pointerType === "mouse")) return;
      isDown = true;
      startX = e.clientX;
      startScrollLeft = track.scrollLeft;
      setPaused(true);
      try {
        track.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }

    function onPointerMove(e: PointerEvent) {
      if (!track) return;
      if (!isDown) return;
      const delta = e.clientX - startX;
      track.scrollLeft = startScrollLeft - delta;
    }

    function onPointerUp() {
      isDown = false;
      setTimeout(() => setPaused(false), 900);
    }

    track.addEventListener("pointerdown", onPointerDown, { passive: true });
    track.addEventListener("pointermove", onPointerMove, { passive: true });
    track.addEventListener("pointerup", onPointerUp, { passive: true });
    track.addEventListener("pointercancel", onPointerUp, { passive: true });

    return () => {
      track.removeEventListener("pointerdown", onPointerDown);
      track.removeEventListener("pointermove", onPointerMove);
      track.removeEventListener("pointerup", onPointerUp);
      track.removeEventListener("pointercancel", onPointerUp);
    };
  }, []);

  return (
    <div
      className="ar-testimonials relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        className="ar-testimonials-scroll no-scrollbar overflow-x-auto scroll-smooth"
        aria-label="Testimonials"
      >
        <div className={`ar-testimonials-track ${paused ? "is-paused" : ""}`}>
          {doubled.map((t, idx) => (
            <Card key={`${t.name}-${idx}`} variant="elevated" className="ar-testimonials-card">
              <p className="text-sm leading-relaxed text-[var(--text-muted)]">&ldquo;{t.quote}&rdquo;</p>
              <p className="mt-4 font-semibold text-[var(--heading)]">{t.name}</p>
              <p className="text-xs text-[var(--text-subtle)]">{t.role}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

