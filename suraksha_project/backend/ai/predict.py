import sys
import json
import joblib
import os
import numpy as np
import warnings
warnings.filterwarnings("ignore")


# ---------------------------------------------------------
# LOAD MODELS
# ---------------------------------------------------------
def load_models():
    """Safely load trained model + label encoder"""
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(base_dir, "risk_model.pkl")
        encoder_path = os.path.join(base_dir, "risk_label_encoder.pkl")

        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file missing: {model_path}")
        if not os.path.exists(encoder_path):
            raise FileNotFoundError(f"Label encoder missing: {encoder_path}")

        model = joblib.load(model_path)
        encoder = joblib.load(encoder_path)
        return model, encoder

    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": f"Model load error: {str(e)}",
            "type": "ModelLoadError"
        }), file=sys.stderr)
        sys.exit(1)


# ---------------------------------------------------------
# INPUT VALIDATION + NORMALIZATION
# ---------------------------------------------------------
def validate_inputs(data):
    """Extract and validate fields safely with fallbacks"""

    def get(keys, cast=float, default=0):
        for key in keys:
            if key in data and data[key] not in [None, ""]:
                try:
                    return cast(data[key])
                except:
                    continue
        return default

    attendance = get(['attendance', 'Attendance'], float)
    cgpa = get(['cgpa', 'CGPA'], float)
    financial_score = get(['financial_score', 'financialScore'], float)
    study_hours = get(['study_hours', 'studyHours'], float)
    backlogs = get(['previous_year_backlogs', 'previousYearBacklogs'], int)

    # Validate ranges
    checks = [
        (0 <= attendance <= 100, "Attendance must be 0–100"),
        (0 <= cgpa <= 10, "CGPA must be 0–10"),
        (0 <= financial_score <= 100, "Financial score must be 0–100"),
        (0 <= study_hours <= 24, "Study hours must be 0–24"),
        (backlogs >= 0, "Backlogs cannot be negative")
    ]

    for ok, msg in checks:
        if not ok:
            raise ValueError(msg)

    return attendance, cgpa, financial_score, study_hours, backlogs


# ---------------------------------------------------------
# RISK TIP ENGINE
# ---------------------------------------------------------
def get_tips(risk):
    """Return tips for high / medium / low risk"""
    r = str(risk).lower()

    if r == "high":
        return [
            "Attend at least 80% of classes.",
            "Meet mentor weekly.",
            "Increase study hours to 2+ hours/day.",
            "Join peer-study groups.",
            "Reduce stress and distractions."
        ]

    if r in ["medium", "moderate"]:
        return [
            "Improve attendance by 10%.",
            "Study 1 hour daily.",
            "Focus on weak subjects consistently.",
            "Submit assignments on time."
        ]

    # LOW RISK
    return [
        "Maintain consistency.",
        "Participate in academic activities.",
        "Maintain CGPA above 8.",
        "Continue effective study habits."
    ]


# ---------------------------------------------------------
# MODEL PREDICTION
# ---------------------------------------------------------
def predict_risk(model, encoder, attendance, cgpa, financial_score, study_hours, backlogs):
    try:
        x = np.array([[attendance, cgpa, financial_score, study_hours, backlogs]])
        pred = model.predict(x)
        return str(encoder.inverse_transform(pred)[0])
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": f"Prediction error: {str(e)}",
            "type": "PredictionError"
        }), file=sys.stderr)
        return None


# ---------------------------------------------------------
# MAIN EXECUTION
# ---------------------------------------------------------
def main():
    try:
        # Read JSON input from Node.js
        try:
            input_data = json.loads(sys.stdin.read())
        except:
            raise ValueError("Invalid JSON input received")

        # Validate & normalize
        attendance, cgpa, financial_score, study_hours, backlogs = validate_inputs(input_data)

        # Load model & encoder
        model, encoder = load_models()

        # Predict category
        risk = predict_risk(model, encoder, attendance, cgpa, financial_score, study_hours, backlogs)
        if not risk:
            raise RuntimeError("Prediction failed")

        # Compute risk score (0–10)
        score = min(10, max(0,
            (100 - attendance) * 0.05 +      # attendance (0–5 points)
            (10 - cgpa) * 0.6 +              # CGPA (0–6 points)
            backlogs * 0.5                   # backlogs (0–5 points)
        ))

        # Build response
        result = {
            "success": True,
            "risk": risk,
            "score": round(score, 1),
            "tips": get_tips(risk),
            "input_data": {
                "attendance": attendance,
                "cgpa": cgpa,
                "financial_score": financial_score,
                "study_hours": study_hours,
                "previous_year_backlogs": backlogs
            }
        }

        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e),
            "type": type(e).__name__
        }), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
