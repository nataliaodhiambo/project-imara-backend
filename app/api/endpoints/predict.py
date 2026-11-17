import joblib
import numpy as np
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/predict", tags=["ML Prediction"])

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
MODEL_PATH = BASE_DIR / "ml_models" / "random_forest_v1.pkl"

model_data = None
if MODEL_PATH.exists():
    model_data = joblib.load(MODEL_PATH)
    model = model_data['model']
    feature_cols = model_data['features']
else:
    model = None
    feature_cols = []

class AthleteTelemetryInput(BaseModel):
    athlete_name: str = Field(..., example="Player Alpha")
    features: dict = Field(
        ...,
        example={
            "acwr": 1.15, "atl": 450.0, "ctl28": 400.0, "ctl42": 390.0,
            "daily_load": 420.0, "monotony": 1.2, "strain": 500.0,
            "weekly_load": 2800.0, "fatigue": 3.0, "mood": 4.0,
            "readiness": 4.0, "sleep_duration": 7.5, "sleep_quality": 4.0,
            "soreness": 2.0, "stress": 2.0
        }
    )

@router.post("/")
def predict_injury_risk(payload: AthleteTelemetryInput):
    if model is None:
        raise HTTPException(status_code=500, detail="Model artifact not found.")
    
    try:
        input_vector = [payload.features.get(col, 0.0) for col in feature_cols]
        X_input = np.array([input_vector])
        
        probabilities = model.predict_proba(X_input)[0]
        predicted_class = int(model.predict(X_input)[0])
        risk_score = float(probabilities[2]) if len(probabilities) > 2 else float(probabilities[-1])
        
        if risk_score >= 0.80 or predicted_class == 2:
            tier = "High Risk (Red)"
        elif risk_score >= 0.40 or predicted_class == 1:
            tier = "Moderate Risk (Amber)"
        else:
            tier = "Low Risk (Green)"

        return {
            "status": "success",
            "athlete_name": payload.athlete_name,
            "predicted_risk_level": predicted_class,
            "risk_score": round(risk_score, 4),
            "risk_tier": tier,
            "class_probabilities": {str(i): round(float(p), 4) for i, p in enumerate(probabilities)}
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))