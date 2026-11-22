from app.services import commodity_service
from app.schemas.commodity_schema import BullionConvertRequest


def handle_get_commodities():
    return commodity_service.get_processed_commodities()


def handle_convert_bullion(request: BullionConvertRequest):
    return commodity_service.calculate_bullion_conversion(request)
