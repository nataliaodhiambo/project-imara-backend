"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSession } from "@/lib/api";
import type { SessionType } from "@/lib/seedData";

const sessionTypes: SessionType[] = ["PHYSICAL", "TECHNICAL", "TACTICAL", "RECOVERY"];

const fieldClass =
  "w-full rounded-xl border border-imara-border bg-imara-card px-4 py-2.5 text-sm text-white placeholder:text-imara-grey focus:border-imara-pink focus:outline-none";
const labelClass = "mb-2 block text-xs font-medium uppercase tracking-wider text-imara-grey";

function todayLocal(): string {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

export default function NewSessionPage() {
  const router = useRouter();
  const [sessionName, setSessionName] = useState("");
  const [sessionType, setSessionType] = useState<SessionType>("PHYSICAL");
  const [date, setDate] = useState(todayLocal());
  const [durationMinutes, setDurationMinutes] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!sessionName.trim()) {
      setError("Session name is required.");
      return;
    }

    setSubmitting(true);
    try {
      await createSession({
        sessionName: sessionName.trim(),
        sessionType,
        date,
        durationMinutes: Number(durationMinutes),
        notes: notes.trim(),
      });
      router.push("/sessions");
    } catch (err) {
      console.error(err);
      setError("Could not save the session. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-white">New Session</h1>
      <p className="mt-1 text-sm text-imara-grey">Log a training session for the squad.</p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-xl border border-imara-border bg-imara-surface p-6"
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="sessionName" className={labelClass}>Session Name</label>
            <input
              id="sessionName"
              type="text"
              required
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="e.g. Finishing Drills"
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="sessionType" className={labelClass}>Session Type</label>
            <select
              id="sessionType"
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value as SessionType)}
              className={fieldClass}
            >
              {sessionTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="date" className={labelClass}>Date</label>
            <input
              id="date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="durationMinutes" className={labelClass}>Duration (minutes)</label>
            <input
              id="durationMinutes"
              type="number"
              required
              min={5}
              max={300}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              placeholder="e.g. 60"
              className={fieldClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="notes" className={labelClass}>Notes</label>
            <textarea
              id="notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What the session covered, who was involved, anything to follow up."
              className={fieldClass}
            />
          </div>
        </div>

        {error && <p className="mt-5 text-sm text-imara-pink">{error}</p>}

        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push("/sessions")}
            className="rounded-xl border border-imara-border px-6 py-2.5 text-sm font-medium text-white transition-colors hover:border-imara-grey"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-imara-pink px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save Session"}
          </button>
        </div>
      </form>
    </div>
  );
}