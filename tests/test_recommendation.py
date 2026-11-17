import pytest
from app.services.recommendation import recommend

NORMAL = {"band": "normal", "flags": []}
SUPPRESSED = {"band": "suppressed", "flags": ["HRV below personal baseline", "Sleep shorter than usual"]}
UNKNOWN = {"band": "unknown", "flags": []}


@pytest.mark.parametrize("readiness, acwr, band, drop, rule", [
    (NORMAL, 1.0, "red", False, "R1"),
    (NORMAL, 1.0, "low", True, "R2"),
    (NORMAL, 1.6, "low", False, "R3"),
    (SUPPRESSED, 1.4, "amber", False, "R4"),
    (SUPPRESSED, 1.0, "amber", False, "R5"),
    (NORMAL, 0.7, "low", False, "R6"),
    (NORMAL, 1.0, "low", False, "R7"),
])
def test_rules(readiness, acwr, band, drop, rule):
    assert recommend(readiness, acwr, band, drop)["rule"] == rule


def test_missing_readiness_lowers_confidence():
    out = recommend(UNKNOWN, 1.0, "low", False)
    assert out["rule"] == "R7" and out["confidence"] == "low"