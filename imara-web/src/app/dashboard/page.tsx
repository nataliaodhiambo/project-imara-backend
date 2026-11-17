"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { getAthletes, deleteAthlete } from "@/lib/api";
import type { Athlete, AthleteStatus } from "@/lib/seedData";

const statusStyles: Record<AthleteStatus, string> = {
  ACTIVE: "border-imara-pink text-imara-pink",
  INJURED: "border-[#FFB300] text-[#FFB300]",
  RESTING: "border-imara-grey text-imara-grey",
};

export default function DashboardPage() {
  const router = useRouter();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAthletes().then((data) => {
      if (!cancelled) {
        setAthletes(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(athlete: Athlete) {
    const confirmed = window.confirm(`Delete ${athlete.name} from the roster?`);
    if (!confirmed) return;
    setDeletingId(athlete.id);
    await deleteAthlete(athlete.id);
    setAthletes((prev) => prev.filter((a) => a.id !== athlete.id));
    setDeletingId(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Athlete Roster</h1>
          <p className="mt-1 text-sm text-imara-grey">
            {loading ? "Loading squad..." : `${athletes.length} athletes in the squad`}
          </p>
        </div>
        <button
          onClick={() => router.push("/athletes/new")}
          className="flex items-center gap-2 rounded-xl bg-imara-pink px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <Plus size={16} />
          Add Athlete
        </button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-imara-border bg-imara-surface">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-imara-border text-xs uppercase tracking-wider text-imara-grey">
              <th className="px-5 py-4 font-medium">Squad No.</th>
              <th className="px-5 py-4 font-medium">Name</th>
              <th className="px-5 py-4 font-medium">Position</th>
              <th className="px-5 py-4 font-medium">Status</th>
              <th className="px-5 py-4 font-medium">Age</th>
              <th className="px-5 py-4 font-medium">Weight (kg)</th>
              <th className="px-5 py-4 font-medium">Height (cm)</th>
              <th className="px-5 py-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && athletes.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-imara-grey">
                  No athletes yet. Use Add Athlete to create the first one.
                </td>
              </tr>
            )}
            {athletes.map((athlete) => (
              <tr
                key={athlete.id}
                className="border-b border-imara-border last:border-b-0 hover:bg-imara-card"
              >
                <td className="px-5 py-4 font-semibold text-white">{athlete.squadNumber}</td>
                <td className="px-5 py-4">
                  <button
                    onClick={() => router.push(`/athletes/${athlete.id}`)}
                    className="font-medium text-white hover:underline"
                  >
                    {athlete.name}
                  </button>
                </td>
                <td className="px-5 py-4 text-imara-grey">{athlete.position}</td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[athlete.status]}`}
                  >
                    {athlete.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-imara-grey">{athlete.age}</td>
                <td className="px-5 py-4 text-imara-grey">{athlete.weight}</td>
                <td className="px-5 py-4 text-imara-grey">{athlete.height}</td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => router.push(`/athletes/${athlete.id}/edit`)}
                      className="flex items-center gap-1.5 rounded-lg border border-imara-border px-3 py-1.5 text-xs font-medium text-white transition-colors hover:border-imara-pink hover:text-imara-pink"
                    >
                      <Pencil size={13} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(athlete)}
                      disabled={deletingId === athlete.id}
                      className="flex items-center gap-1.5 rounded-lg border border-imara-border px-3 py-1.5 text-xs font-medium text-imara-grey transition-colors hover:border-imara-pink hover:text-imara-pink disabled:opacity-50"
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}