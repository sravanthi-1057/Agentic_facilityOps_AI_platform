import pytest
from app.services.anomaly_detector import anomaly_detector
from app.services.iot_simulator import simulator

def test_anomaly_detection_pipeline_and_accuracy():
    df = simulator.generate_timeseries(days=14)
    metrics = anomaly_detector.fit_and_evaluate(df)

    assert metrics["test_accuracy"] >= 0.85
    assert metrics["meets_85_target"] is True
    assert "confusion_matrix" in metrics

def test_anomaly_severity_and_explanation():
    df = simulator.generate_timeseries(days=7)
    anomalies = anomaly_detector.detect_anomalies(df)

    assert isinstance(anomalies, list)
    for a in anomalies:
        assert a["severity"] in ["Low", "Medium", "High", "Critical"]
        assert "description" in a
        assert "explanation" in a
        assert a["actual_consumption"] >= 0
