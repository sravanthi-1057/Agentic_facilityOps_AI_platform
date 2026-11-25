import sys
from pathlib import Path

# Add backend to sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.services.iot_simulator import simulator
from app.services.anomaly_detector import anomaly_detector
from app.config import settings

def main():
    print("Generating 35 days of realistic smart building IoT energy telemetry...")
    csv_path = settings.DATA_DIR / "energy_data.csv"
    df = simulator.export_csv(csv_path, days=35)
    print(f"Generated {len(df)} records saved to {csv_path}")

    print("Evaluating Isolation Forest Anomaly Detection on held-out test split (80/20)...")
    eval_metrics = anomaly_detector.fit_and_evaluate(df)
    
    print("\n================ ANOMALY EVALUATION RESULTS ================")
    print(f"Test Accuracy:      {eval_metrics['test_accuracy_pct']}%")
    print(f"Test Precision:     {eval_metrics['test_precision']}")
    print(f"Test Recall:        {eval_metrics['test_recall']}")
    print(f"Test F1-Score:      {eval_metrics['test_f1_score']}")
    print(f"Confusion Matrix:   {eval_metrics['confusion_matrix']}")
    print(f"Meets 85% Target:   {eval_metrics['meets_85_target']}")
    print("============================================================\n")

if __name__ == "__main__":
    main()
