from app.services import predict_service #imports the service layer 
from app.repository import stock_repository

def handle_predict(request):
    #extract the string from incoming json request(eg RELIANCE.NS)
    ticker_symbol = request.ticker
    
    # pass the string directly to the service layer 
    #now service layer will now handle talking to the repository amd making the prediction
    result = predict_service.predict_direction(ticker_symbol)

    #return the JSON response to the user
    return result

def handle_batch_predict(request):
    ticker_list = request.tickers
    results = predict_service.predict_batch(ticker_list)
    return {"batch_results": results}