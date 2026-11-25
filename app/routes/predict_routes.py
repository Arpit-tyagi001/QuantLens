import logging
from fastapi import APIRouter, HTTPException
from app.controllers import predict_controller
from app.schemas.predict_schema import PredictRequest, BatchPredictRequest

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/predict")
def predict(request: PredictRequest):
    try:
        return predict_controller.handle_predict(request)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception:
        logger.exception("Prediction failed for ticker %s", request.ticker)
        raise HTTPException(
            status_code=502,
            detail="Upstream market data or prediction error.",
        )


@router.post("/predict/batch")
def predict_batch_endpoint(request: BatchPredictRequest):
    return predict_controller.handle_batch_predict(request)


@router.get("/predict/ledger")
def get_prediction_ledger_endpoint():
    try:
        return predict_controller.handle_get_ledger()
    except Exception as e:
        logger.exception("Failed to fetch prediction ledger")
        raise HTTPException(status_code=500, detail="Failed to fetch prediction ledger.")
