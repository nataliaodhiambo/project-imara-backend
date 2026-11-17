"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAthlete } from "@/lib/api";
import type { AthleteStatus } from "@/lib/seedData";

const positions = [
  "Goalkeeper",
  "Centre Back",
  "Left Back",
  "Right Back",
  "Defensive Midfielder",
  "Central Midfielder",
  "Attacking Midfielder",
  "Left Winger",
  "Right Winger",
  "Striker",
];

const statuses: AthleteStatus[] = ["ACTIVE", "INJURED", "RESTING"];

const fieldClass =
  "w-full rounded-xl border border-imara-border bg-imara-card px-4 py-2.5 text-sm text-white placeholder:text-imara-grey focus:border-imara-pink focus:outline-none";
const labelClass = "mb-2 block text-xs font-medium uppercase tracking-wider text-imara-grey";

export default function NewAthletePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [squadNumber, setSquadNumber] = useState("");
  const [position, setPosition] = useState(positions[0]);
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [status, setStatus] = useState<AthleteStatus>("ACTIVE");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Full name is required.");
      return;
    }

    setSubmitting(true);
    try {
      await createAthlete({
        name: name.trim(),
        squadNumber: Number(squadNumber),
        position,
        status,
        age: Number(age),
        weight: Number(weight),
        height: Number(height),
      });
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Could not save the athlete. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-white">Add Athlete</h1>
      <p className="mt-1 text-sm text-imara-grey">Enter the details for the new squad member.</p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-xl border border-imara-border bg-imara-surface p-6"
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="name" className={labelClass}>Full Name</label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jordan Mills"
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="squadNumber" className={labelClass}>Squad Number</label>
            <input
              id="squadNumber"
              type="number"
              required
              min={1}
              max={99}
              value={squadNumber}
              onChange={(e) => setSquadNumber(e.target.value)}
              placeholder="1 to 99"
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="position" className={labelClass}>Position</label>
            <select
              id="position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className={fieldClass}
            >
              {positions.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="age" className={labelClass}>Age</label>
            <input
              id="age"
              type="number"
              required
              min={15}
              max={50}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Years"
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="status" className={labelClass}>Status</label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as AthleteStatus)}
              className={fieldClass}
            >
              {statuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="height" className={labelClass}>Height (cm)</label>
            <input
              id="height"
              type="number"
              required
              min={140}
              max={220}
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="e.g. 182"
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="weight" className={labelClass}>Weight (kg)</label>
            <input
              id="weight"
              type="number"
              required
              min={40}
              max={150}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g. 78"
              className={fieldClass}
            />
          </div>
        </div>

        {error && <p className="mt-5 text-sm text-imara-pink">{error}</p>}

        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="rounded-xl border border-imara-border px-6 py-2.5 text-sm font-medium text-white transition-colors hover:border-imara-grey"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-imara-pink px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save Athlete"}
          </button>
        </div>
      </form>
    </div>
  );
}