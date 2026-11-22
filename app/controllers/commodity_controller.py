from app.services import commodity_service


def handle_get_commodities():
    return commodity_service.get_processed_commodities()
