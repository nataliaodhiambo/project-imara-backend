"use client";

import { useEffect, useState } from "react";
import { getRecommendation, logDecision, Recommendation } from "@/lib/api";

const BAND_STYLE: Record<string, string> = {
  low: "text-imara-green border-imara-green",
  amber: "text-imara-amber border-imara-amber",
  red: "text-red-500 border-red-500",
};

const shell = "rounded-xl border border-imara-border bg-imara-surface p-6";

export default function RecommendationCard({ athleteId }: { athleteId: number }) {
  const [rec, setRec] = useState<Recommendation | null>(null);
  const [decided, setDecided] = useState<string | null>(null);

  useEffect(() => {
    getRecommendation(athleteId).then(setRec);
  }, [athleteId]);

  if (!rec) {
    return <div className={`${shell} text-imara-grey`}>Loading recommendation…</div>;
  }

  if (rec.status !== "ok") {
    return (
      <div className={shell}>
        <p className="text-xs uppercase tracking-widest text-imara-grey">Training recommendation</p>
        <p className="mt-2 text-sm text-imara-grey">
          {rec.status === "no_inference"
            ? "No model output yet for this athlete."
            : "Recommendation service unavailable."}
        </p>
      </div>
    );
  }

  const decide = async (decision: "accepted" | "overridden") => {
    const ok = await logDecision(athleteId, {
      rule: rec.rule!,
      action: rec.action!,
      decision,
    });
    if (ok) setDecided(decision);
  };

  return (
    <div className={shell}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-widest text-imara-grey">Training recommendation</p>
        <div className="flex gap-2">
          {rec.source === "demo" && (
            <span className="rounded-full border border-imara-border px-3 py-1 text-xs text-imara-grey">
              Demo data
            </span>
          )}
          {rec.confidence === "low" && (
            <span className="rounded-full border border-imara-amber px-3 py-1 text-xs text-imara-amber">
              Low confidence
            </span>
          )}
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${
              BAND_STYLE[rec.risk_band ?? "low"]
            }`}
          >
            Risk: {rec.risk_band}
          </span>
        </div>
      </div>

      <p className="mt-4 text-xl font-bold text-white">{rec.action}</p>

      <ul className="mt-4 space-y-1 text-sm text-imara-grey">
        {rec.reasons?.map((r) => (
          <li key={r}>• {r}</li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between">
        <span className="text-xs text-imara-greyDim">Rule {rec.rule}</span>
        {decided ? (
          <span className="text-sm text-imara-pink">Logged: {decided}</span>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => decide("accepted")}
              className="rounded-lg bg-imara-pink px-4 py-2 text-sm font-semibold text-white"
            >
              Accept
            </button>
            <button
              onClick={() => decide("overridden")}
              className="rounded-lg border border-imara-pink px-4 py-2 text-sm font-semibold text-imara-pink"
            >
              Override
            </button>
          </div>
        )}
      </div>
    </div>
  );
}