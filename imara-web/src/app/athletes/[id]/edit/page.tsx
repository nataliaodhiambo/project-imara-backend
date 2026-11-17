"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAthleteById, updateAthlete } from "@/lib/api";
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

export default function EditAthletePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [name, setName] = useState("");
  const [squadNumber, setSquadNumber] = useState("");
  const [position, setPosition] = useState(positions[0]);
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [status, setStatus] = useState<AthleteStatus>("ACTIVE");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getAthleteById(id).then((athlete) => {
      if (cancelled) return;
      if (!athlete) {
        setNotFound(true);
      } else {
        setName(athlete.name);
        setSquadNumber(String(athlete.squadNumber));
        setPosition(athlete.position);
        setAge(String(athlete.age));
        setHeight(String(athlete.height));
        setWeight(String(athlete.weight));
        setStatus(athlete.status);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Full name is required.");
      return;
    }

    setSubmitting(true);
    try {
      await updateAthlete(id, {
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
      setError("Could not update the athlete. Please try again.");
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-imara-grey">Loading athlete...</p>;
  }

  if (notFound) {
    return (
      <div>
        <p className="text-white">Athlete not found.</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-4 rounded-xl border border-imara-border px-5 py-2.5 text-sm font-medium text-white transition-colors hover:border-imara-grey"
        >
          Back to roster
        </button>
      </div>
    );
  }

  // Keeps the current position selectable even if it is not in the standard list.
  const positionOptions = positions.includes(position) ? positions : [position, ...positions];

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-white">Edit Athlete</h1>
      <p className="mt-1 text-sm text-imara-grey">Update the details for {name || "this athlete"}.</p>

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
              {positionOptions.map((p) => (
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
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}