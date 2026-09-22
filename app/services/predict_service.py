import joblib
import pandas as pd

model = joblib.load("ml/saved_models/model.joblib")
scaler = joblib.load("ml/saved_models/scaler.joblib")

#function for predicting direction of stocks
def predict_direction(input_df: pd.DataFrame):
    # the dataframe from the repository already has our 14 features lined up
    input_scaled = scaler.transform(input_df)
    
    prediction = model.predict(input_scaled)[0]
    probability = model.predict_proba(input_scaled)[0][1]

    return {
        "direction": "up" if prediction == 1 else "down",
        "confidence": round(float(probability), 4) 
    }