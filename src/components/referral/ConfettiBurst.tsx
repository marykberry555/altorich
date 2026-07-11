"use client";

const COLORS = ["#10b981", "#d4a853", "#34d399", "#b8860b", "#6ee7b7"];

export function ConfettiBurst() {
  const pieces = Array.from({ length: 48 }, (_, i) => ({
    id: i,
    left: `${(i * 17) % 100}%`,
    delay: `${(i % 8) * 0.08}s`,
    color: COLORS[i % COLORS.length],
    rotate: `${(i * 47) % 360}deg`
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece absolute top-0 h-2 w-1.5 rounded-sm opacity-90"
          style={{
            left: p.left,
            backgroundColor: p.color,
            animationDelay: p.delay,
            transform: `rotate(${p.rotate})`
          }}
        />
      ))}
    </div>
  );
}
