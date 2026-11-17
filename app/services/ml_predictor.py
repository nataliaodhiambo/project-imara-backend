import logging
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path

import joblib

from app.models import AthleteBaseline, FeatureWindow5Min

logger = logging.getLogger(__name__)

MODEL_PATH = Path(__file__).resolve().parents[2] / "ml_models" / "random_forest_v1.pkl"

# Column order the trained model expects
FEATURE_COLUMNS = (
    "avg_heart_rate",
    "max_heart_rate",
    "avg_hrv_ms",
    "avg_speed_m_s",
    "max_speed_m_s",
    "total_distance_m",
    "hsr_distance_m",
    "hrv_deviation_pct",
    "hsr_deviation_pct",
)

HIGH_RISK_THRESHOLD = 0.7
MODERATE_RISK_THRESHOLD = 0.4


@dataclass
class RiskPrediction:
    score: float
    level: str
    reasons: list[str] = field(default_factory=list)


def risk_level_for(score: float) -> str:
    if score >= HIGH_RISK_THRESHOLD:
        return "high"
    if score >= MODERATE_RISK_THRESHOLD:
        return "moderate"
    return "low"


def _clamp(value: float) -> float:
    return max(0.0, min(1.0, value))


class RiskPredictor:
    """Uses the trained Random Forest when available, otherwise a baseline-driven rule model."""

    def __init__(self, model_path: Path = MODEL_PATH):
        self.model = None
        if model_path.is_file() and model_path.stat().st_size > 0:
            # joblib uses pickle: only load model artifacts from this trusted local directory
            self.model = joblib.load(model_path)
            logger.info("Loaded risk model from %s", model_path)
        else:
            logger.warning("No trained model at %s; using rule-based risk scoring", model_path)

    @property
    def source(self) -> str:
        return "model" if self.model is not None else "rules"

    def predict(
        self, window: FeatureWindow5Min, baseline: AthleteBaseline | None, hr_max: float
    ) -> RiskPrediction:
        rule = self._rule_based(window, baseline, hr_max)
        if self.model is None:
            return rule

        vector = [[getattr(window, col) or 0.0 for col in FEATURE_COLUMNS]]
        score = round(float(self.model.predict_proba(vector)[0][1]), 3)
        # Rule reasons still explain *why* a model score is elevated
        return RiskPrediction(score=score, level=risk_level_for(score), reasons=rule.reasons)

    @staticmethod
    def _rule_based(
        window: FeatureWindow5Min, baseline: AthleteBaseline | None, hr_max: float
    ) -> RiskPrediction:
        reasons: list[str] = []
        hrv_component = 0.0
        hsr_component = 0.0

        if baseline is not None:
            if window.hrv_deviation_pct is not None:
                hrv_component = _clamp(-window.hrv_deviation_pct / 30)  # 30% drop saturates
            hrv_floor = float(baseline.hrv_threshold_lower)
            if window.avg_hrv_ms < hrv_floor:
                hrv_component = max(hrv_component, 0.8)
                reasons.append(f"HRV {window.avg_hrv_ms:.1f} ms below threshold {hrv_floor:.1f} ms")

            if window.hsr_deviation_pct is not None:
                hsr_component = _clamp(window.hsr_deviation_pct / 50)  # 50% spike saturates
            hsr_ceiling = float(baseline.hsr_threshold_upper)
            if window.hsr_distance_m > hsr_ceiling:
                hsr_component = max(hsr_component, 0.8)
                reasons.append(f"HSR {window.hsr_distance_m:.0f} m above threshold {hsr_ceiling:.0f} m")

        hr_component = _clamp((window.max_heart_rate / hr_max - 0.85) / 0.15)
        if hr_component >= 0.5:
            reasons.append(f"Max HR {window.max_heart_rate} bpm at {window.max_heart_rate / hr_max:.0%} of HRmax")

        score = round(0.5 * hrv_component + 0.4 * hsr_component + 0.1 * hr_component, 3)
        return RiskPrediction(score=score, level=risk_level_for(score), reasons=reasons)


@lru_cache
def get_predictor() -> RiskPredictor:
    return RiskPredictor()
