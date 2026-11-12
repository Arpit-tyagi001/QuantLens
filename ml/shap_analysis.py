import joblib
import numpy as np
import shap
import matplotlib.pyplot as plt
import yfinance as yf
import pandas as pd

from ml.features import build_features, FEATURE_COLS

# 1. Load the unified production pipeline
pipeline = joblib.load("ml/saved_models/pipeline.joblib")
scaler = pipeline.named_steps["scaler"]
calibrated_model = pipeline.named_steps["model"]

print("Fetching data and screening features...")
data = yf.download("RELIANCE.NS", period="2y", progress=False)
if isinstance(data.columns, pd.MultiIndex):
    data.columns = data.columns.get_level_values(0)

# 2. Build features using the centralized feature engine
processed = build_features(data)
X = processed[FEATURE_COLS]
X_scaled = scaler.transform(X)

# 3. Compute mean SHAP values across calibrated fold estimators
print("Calculating SHAP values (this takes a few seconds)...")
shap_matrices = []
for cal_clf in calibrated_model.calibrated_classifiers_:
    explainer = shap.TreeExplainer(cal_clf.estimator)
    shap_matrices.append(explainer.shap_values(X_scaled))

mean_shap_values = np.mean(shap_matrices, axis=0)

# 4. Generate the Visual Report
print("Generating plot...")
shap.summary_plot(mean_shap_values, X, plot_type="bar", show=False)
plt.title("QuantLens Feature Importance (SHAP)")
plt.tight_layout()
plt.show()
