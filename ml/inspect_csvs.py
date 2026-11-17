import glob
from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data" / "soccermon"

def inspect_files():
    print(f"Scanning directory: {DATA_DIR}")
    csvs = list(DATA_DIR.rglob("*.csv"))
    print(f"Total CSVs found: {len(csvs)}\n")
    
    for path in csvs:
        print(f"--- File: {path.relative_to(DATA_DIR)} ---")
        try:
            df = pd.read_csv(path, nrows=2)
            print("Columns:", df.columns.tolist())
            print("Head:\n", df.head(1), "\n")
        except Exception as e:
            print(f"Could not read {path.name}: {e}\n")

if __name__ == '__main__':
    inspect_files()