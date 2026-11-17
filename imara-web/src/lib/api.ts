export type Recommendation = {
  status: "ok" | "no_inference" | "unavailable";
  source?: string;
  risk_band?: "low" | "amber" | "red";
  risk_probability?: number;
  acwr?: number;
  perf_drop?: boolean;
  readiness_band?: "normal" | "suppressed" | "unknown";
  rule?: string;
  action?: string;
  reasons?: string[];
  confidence?: "high" | "low";
};

export async function getRecommendation(id: number): Promise<Recommendation> {
  try {
    const res = await fetch(`${API_BASE}/athletes/${id}/recommendation`);
    if (!res.ok) return { status: "unavailable" };
    return await res.json();
  } catch {
    return { status: "unavailable" };
  }
}

export async function logDecision(
  id: number,
  body: { rule: string; action: string; decision: "accepted" | "overridden"; note?: string }
) {
  const res = await fetch(`${API_BASE}/athletes/${id}/recommendation/decision`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.ok;
}