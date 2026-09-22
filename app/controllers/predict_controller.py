from app.services import predict_service #imports the service layer 
from app.repository import stock_repository

def handle_predict(request_data):
    # grab the fully prepared 14-feature dataframe
    features_df = stock_repository.get_latest_features(request_data.ticker)
    
    # pass the dataframe directly to the service layer without ** unpacking
    result = predict_service.predict_direction(features_df)
    
    return result