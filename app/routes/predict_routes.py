from fastapi import APIRouter
from app.controllers import predict_controller
from app.schemas.predict_schema import PredictRequest, BatchPredictRequest

router = APIRouter()

@router.post("/predict")
def predict(request: PredictRequest):
    return predict_controller.handle_predict(request)

@router.post("/predict/batch")
def predict_batch_endpoint(request: BatchPredictRequest):
    return predict_controller.handle_batch_predict(request)