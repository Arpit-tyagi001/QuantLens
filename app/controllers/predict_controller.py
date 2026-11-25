from app.services import predict_service  # imports the service layer


def handle_predict(request):
    # Extract the string from incoming json request (eg RELIANCE.NS)
    ticker_symbol = request.ticker

    # Pass the string directly to the service layer
    # Service layer handles talking to the repository and making the prediction
    result = predict_service.predict_direction(ticker_symbol)

    # Return the JSON response to the user
    return result


def handle_batch_predict(request):
    ticker_list = request.tickers
    results = predict_service.predict_batch(ticker_list)
    return {"batch_results": results}


def handle_get_ledger():
    return predict_service.get_prediction_ledger()
