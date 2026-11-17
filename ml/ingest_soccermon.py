import os
import glob
import pandas as pd
import numpy as np
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data" / "soccermon"
OUTPUT_DIR = BASE_DIR / "ml" / "processed"

def load_and_melt_csv(file_path):
    """Transforms wide SoccerMon CSVs (Date as column, player IDs as columns) into long format."""
    df = pd.read_csv(file_path)
    metric_name = Path(file_path).stem  # e.g., 'acwr', 'fatigue', 'atl'
    
    # Identify the date column (could be 'Date', 'Fatigue Data', 'SleepDurH Data', etc.)
    date_col = df.columns[0]
    
    # Melt dataframe from wide to long format
    player_cols = [c for c in df.columns if c != date_col]
    df_melted = df.melt(
        id_vars=[date_col], 
        value_vars=player_cols, 
        var_name='player_name', 
        value_name=metric_name
    )
    
    # Standardize column names and timestamps
    df_melted = df_melted.rename(columns={date_col: 'timestamp'})
    df_melted['timestamp'] = pd.to_datetime(df_melted['timestamp'], dayfirst=True, errors='coerce')
    df_melted['player_name'] = df_melted['player_name'].astype(str).str.strip()
    df_melted[metric_name] = pd.to_numeric(df_melted[metric_name], errors='coerce')
    
    return df_melted.dropna(subset=['timestamp', 'player_name'])

def load_wellness_and_load_metrics():
    """Finds all metric CSVs, melts them, and merges them into a unified player-day matrix."""
    print(f"Scanning SoccerMon CSVs in: {DATA_DIR}")
    
    EXCLUDE_FILES = {'injury.csv', 'illness.csv', 'game-performance.csv'}
    all_csvs = list(DATA_DIR.rglob("*.csv"))
    feature_csvs = [f for f in all_csvs if f.name.lower() not in EXCLUDE_FILES]

    if not feature_csvs:
        raise FileNotFoundError(f"No feature CSVs found under {DATA_DIR}.")

    print(f"Found {len(feature_csvs)} wide-format feature CSVs. Melting and merging...")
    df_merged = None

    for file_path in feature_csvs:
        try:
            df_long = load_and_melt_csv(file_path)
            metric_name = Path(file_path).stem
            
            # Drop duplicates per player-day just in case
            df_long = df_long.drop_duplicates(subset=['player_name', 'timestamp'])
            
            if df_merged is None:
                df_merged = df_long[['player_name', 'timestamp', metric_name]]
            else:
                df_merged = pd.merge(
                    df_merged, 
                    df_long[['player_name', 'timestamp', metric_name]], 
                    on=['player_name', 'timestamp'], 
                    how='outer'
                )
        except Exception as e:
            print(f"Warning: Could not process {file_path.name}: {e}")

    print(f"Successfully merged features! Matrix shape: {df_merged.shape}")
    return df_merged

def process_injury_labels(df_base):
    """Parses injury.csv and maps reported injuries as target labels."""
    injury_files = list(DATA_DIR.rglob("injury.csv"))
    if not injury_files:
        print("Warning: injury.csv not found. Assigning default risk level 0.")
        df_base['injury_occurred'] = 0
        df_base['risk_level'] = 0
        return df_base

    injury_path = injury_files[0]
    print(f"Loading injury data from: {injury_path.relative_to(BASE_DIR)}")
    
    df_injury = pd.read_csv(injury_path)
    df_injury.columns = df_injury.columns.str.lower()
    df_injury['timestamp'] = pd.to_datetime(df_injury['timestamp'], dayfirst=True, errors='coerce')
    df_injury['player_name'] = df_injury['player_name'].astype(str).str.strip()
    df_injury['injury_occurred'] = 1

    # Merge injury events onto player-day base matrix
    df_final = pd.merge(
        df_base, 
        df_injury[['player_name', 'timestamp', 'injury_occurred']], 
        on=['player_name', 'timestamp'], 
        how='left'
    )
    df_final['injury_occurred'] = df_final['injury_occurred'].fillna(0).astype(int)

    # Classify Risk Levels (Target):
    # 0 = Low Risk
    # 1 = Moderate Risk (High ACWR > 1.3 or high fatigue)
    # 2 = High Risk / Active Injury Event
    acwr_col = df_final['acwr'] if 'acwr' in df_final.columns else pd.Series(0, index=df_final.index)
    fatigue_col = df_final['fatigue'] if 'fatigue' in df_final.columns else pd.Series(0, index=df_final.index)

    conditions = [
        (df_final['injury_occurred'] == 1),
        (acwr_col > 1.3) | (fatigue_col > 4)
    ]
    choices = [2, 1]
    df_final['risk_level'] = np.select(conditions, choices, default=0)

    return df_final

def run_ingestion():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    df_features = load_wellness_and_load_metrics()
    df_dataset = process_injury_labels(df_features)
    
    # Sort chronologically by player and fill missing numeric metrics with median/0
    df_dataset = df_dataset.sort_values(by=['player_name', 'timestamp']).reset_index(drop=True)
    
    output_path = OUTPUT_DIR / "player_day_dataset.csv"
    df_dataset.to_csv(output_path, index=False)
    
    print("\n--- INGESTION COMPLETE ---")
    print(f"Saved processed dataset to: {output_path}")
    print(f"Total Records: {len(df_dataset)}")
    print(f"Target Risk Level Distribution:\n{df_dataset['risk_level'].value_counts()}")

if __name__ == '__main__':
    run_ingestion()