from app.services import ipo_service


def handle_predict_ipo(request):
    return ipo_service.calculate_ipo_prediction(request)


def handle_get_presets():
    return ipo_service.get_all_presets()
