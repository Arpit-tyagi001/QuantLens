from fastapi import APIRouter
from app.controllers import predict_controller
from app.schemas.predict_schema import PredictRequest

router = APIRouter()

@router.post("/predict")
def predict(request: PredictRequest):
    return predict_controller.handle_predict(request)
