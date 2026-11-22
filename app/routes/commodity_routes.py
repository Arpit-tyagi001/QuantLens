import logging
from fastapi import APIRouter, HTTPException
from app.controllers import commodity_controller
from app.schemas.commodity_schema import (
    CommodityResponse,
    BullionConvertRequest,
    BullionConvertResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/commodities", tags=["commodities"])


@router.get("/live", response_model=CommodityResponse)
def get_live_commodities_endpoint():
    try:
        return commodity_controller.handle_get_commodities()
    except Exception:
        logger.exception("Failed to retrieve live commodities")
        raise HTTPException(status_code=502, detail="Upstream commodity feed unavailable")


@router.post("/convert", response_model=BullionConvertResponse)
def convert_bullion_endpoint(request: BullionConvertRequest):
    try:
        return commodity_controller.handle_convert_bullion(request)
    except Exception:
        logger.exception("Failed to compute bullion conversion")
        raise HTTPException(status_code=500, detail="Conversion calculation error")
