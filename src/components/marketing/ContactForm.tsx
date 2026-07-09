"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { MathChallenge, useMathChallenge } from "@/components/ui/MathChallenge";

export function ContactForm() {
  const math = useMathChallenge();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState("");

  const formReady =
    math.solved && name.trim() && email.trim() && subject.trim() && message.trim().length >= 10;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!formReady) return;

    setLoading(true);
    setError("");
    setStatus("idle");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
          mathA: math.challenge.a,
          mathB: math.challenge.b,
          mathAnswer: Number.parseInt(math.answer, 10)
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not send message.");
        setStatus("error");
        return;
      }
      setStatus("success");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      math.setAnswer("");
    } catch {
      setError("Network error. Please try again.");
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card variant="elevated" className="w-full max-w-2xl">
      <form onSubmit={handleSubmit} className="grid gap-4">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-[var(--text-muted)]">Message</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={5}
            className="w-full rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface-raised)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:border-[var(--emerald-mid)] focus:outline-none focus:ring-2 focus:ring-[var(--emerald-soft)]"
          />
        </label>

        <MathChallenge
          challenge={math.challenge}
          answer={math.answer}
          onAnswerChange={math.setAnswer}
        />

        {error ? <p className="text-xs text-red-600">{error}</p> : null}
        {status === "success" ? (
          <p className="text-sm text-[var(--emerald)]">Message sent. We will reply to your email shortly.</p>
        ) : null}

        <div className="flex justify-center">
          <Button type="submit" disabled={loading || !formReady} className="w-full sm:w-auto">
            {loading ? "Sending…" : "Send message"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
