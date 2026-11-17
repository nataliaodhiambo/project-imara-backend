from typing import Optional

ACWR_LOW = 0.8
ACWR_HIGH = 1.3
ACWR_SPIKE = 1.5


def recommend(readiness: dict, acwr: Optional[float], risk_band: str, perf_drop: bool) -> dict:
    suppressed = readiness.get("band") == "suppressed"
    readiness_known = readiness.get("band") in ("normal", "suppressed")

    reasons = list(readiness.get("flags", []))
    if acwr is not None and acwr > ACWR_HIGH:
        reasons.append(f"ACWR {acwr:.2f} above 1.3")
    if acwr is not None and acwr < ACWR_LOW:
        reasons.append(f"ACWR {acwr:.2f} below 0.8")
    if perf_drop:
        reasons.append("Output below personal baseline despite high heart rate strain")
    if risk_band in ("amber", "red"):
        reasons.append(f"Injury risk band: {risk_band}")

    # Rules run in priority order: the first match wins.
    if risk_band == "red":
        rule, action = "R1", "Remove from high-intensity drills; recovery work"
    elif perf_drop:
        rule, action = "R2", "Shorten remaining volume; extend rest intervals"
    elif acwr is not None and acwr > ACWR_SPIKE:
        rule, action = "R3", "Cap high-speed running volume; reduce session load"
    elif suppressed and acwr is not None and acwr > ACWR_HIGH:
        rule, action = "R4", "Switch to technical or low-load tactical work; no sprint drills"
    elif suppressed:
        rule, action = "R5", "Keep session type; cap high-speed running volume"
    elif acwr is not None and acwr < ACWR_LOW:
        rule, action = "R6", "Load can increase progressively"
    else:
        rule, action = "R7", "Proceed with planned session"

    confidence = "high" if readiness_known else "low"
    if not readiness_known:
        reasons.append("No usable overnight data; readiness not factored in")
    return {"rule": rule, "action": action, "reasons": reasons, "confidence": confidence}