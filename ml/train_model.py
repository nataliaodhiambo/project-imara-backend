import os
import joblib
import pandas as pd
import numpy as np
from pathlib import Path

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import StratifiedGroupKFold
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import classification_report, f1_score, confusion_matrix
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType

BASE_DIR = Path(__file__).resolve().parent.parent
DATASET_PATH = BASE_DIR / "ml" / "processed" / "player_day_dataset.csv"
MODEL_DIR = BASE_DIR / "ml_models"

def train_imara_model():
    print("Loading processed player-day dataset...")
    if not DATASET_PATH.exists():
        raise FileNotFoundError(f"Dataset not found at {DATASET_PATH}. Run ingest_soccermon.py first.")
    
    df = pd.read_csv(DATASET_PATH)
    
    df = df.dropna(subset=['risk_level', 'player_name', 'timestamp'])
    
    exclude_cols = {'player_name', 'timestamp', 'injury_occurred', 'risk_level'}
    feature_cols = [c for c in df.columns if c not in exclude_cols and pd.api.types.is_numeric_dtype(df[c])]
    
    print(f"Selected {len(feature_cols)} features for training: {feature_cols}")
    
    df[feature_cols] = df[feature_cols].fillna(df[feature_cols].median()).fillna(0)
    
    X = df[feature_cols].values
    y = df['risk_level'].values
    groups = df['player_name'].values
    
    sgkf = StratifiedGroupKFold(n_splits=5)
    
    best_f1 = 0.0
    best_model = None
    
    print("\nTraining Random Forest with StratifiedGroupKFold Cross-Validation...")
    for fold, (train_idx, val_idx) in enumerate(sgkf.split(X, y, groups=groups)):
        X_train, X_val = X[train_idx], X[val_idx]
        y_train, y_val = y[train_idx], y[val_idx]
        
        rf = RandomForestClassifier(
            n_estimators=300,
            max_depth=12,
            class_weight='balanced',
            random_state=42,
            n_jobs=-1
        )
        
        calibrated_model = CalibratedClassifierCV(estimator=rf, cv=3)
        calibrated_model.fit(X_train, y_train)
        
        y_pred = calibrated_model.predict(X_val)
        fold_f1 = f1_score(y_val, y_pred, average='weighted', zero_division=0)
        print(f"Fold {fold + 1} - Weighted F1 Score: {fold_f1:.4f}")
        
        if fold_f1 > best_f1:
            best_f1 = fold_f1
            best_model = calibrated_model

    print(f"\nBest Model Training Complete! Best Fold F1: {best_f1:.4f}")
    
    os.makedirs(MODEL_DIR, exist_ok=True)
    pkl_path = MODEL_DIR / "random_forest_v1.pkl"
    joblib.dump({'model': best_model, 'features': feature_cols}, pkl_path)
    print(f"Saved scikit-learn model to: {pkl_path}")
    
    try:
        initial_type = [('float_input', FloatTensorType([None, len(feature_cols)]))]
        base_estimator = best_model.estimator if hasattr(best_model, 'estimator') else best_model
        onnx_model = convert_sklearn(base_estimator, initial_types=initial_type)
        onnx_path = MODEL_DIR / "random_forest_v1.onnx"
        with open(onnx_path, "wb") as f:
            f.write(onnx_model.SerializeToString())
        print(f"Exported base model to ONNX: {onnx_path}")
    except Exception as e:
        print(f"Notice: ONNX export skipped/failed ({e}). Pickle model is fully operational for FastAPI inference.")

if __name__ == '__main__':
    train_imara_model()