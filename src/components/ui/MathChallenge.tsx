"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import { randomMathDigit } from "@/lib/math-challenge";
import { useMemo, useState } from "react";

export function useMathChallenge() {
  const challenge = useMemo(() => {
    const a = randomMathDigit();
    const b = randomMathDigit();
    return { a, b, sum: a + b };
  }, []);

  const [answer, setAnswer] = useState("");

  const parsed = Number.parseInt(answer, 10);
  const solved = Number.isFinite(parsed) && parsed === challenge.sum;

  return { challenge, answer, setAnswer, solved };
}

type Props = {
  challenge: { a: number; b: number };
  answer: string;
  onAnswerChange: (value: string) => void;
  className?: string;
};

export function MathChallenge({ challenge, answer, onAnswerChange, className }: Props) {
  const inputId = useId();

  const prompt = `What is ${challenge.a} + ${challenge.b}?`;

  return (
    <label className={cn("grid gap-1.5", className)} htmlFor={inputId}>
      <span className="text-sm font-medium text-[var(--text-muted)]">{prompt}</span>
      <input
        id={inputId}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={answer}
        onChange={(e) => onAnswerChange(e.target.value.replace(/\D/g, "").slice(0, 2))}
        className="h-11 w-24 rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface-raised)] px-3 text-center text-sm text-[var(--text)] focus:border-[var(--emerald-mid)] focus:outline-none focus:ring-2 focus:ring-[var(--emerald-soft)]"
        aria-label={prompt}
        placeholder="Answer"
      />
    </label>
  );
}
