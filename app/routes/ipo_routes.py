import logging
from typing import List
from fastapi import APIRouter, HTTPException
from app.controllers import ipo_controller
from app.schemas.ipo_schema import IPOPredictRequest, IPOPredictResponse, PresetIPO

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ipo", tags=["ipo"])


@router.get("/presets", response_model=List[PresetIPO])
def get_presets_endpoint():
    return ipo_controller.handle_get_presets()


@router.post("/predict", response_model=IPOPredictResponse)
def predict_ipo_endpoint(request: IPOPredictRequest):
    try:
        return ipo_controller.handle_predict_ipo(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        logger.exception("Failed to calculate IPO listing and price prediction")
        raise HTTPException(status_code=500, detail="Internal prediction error")
