from pydantic import BaseModel
from typing import Optional


class CommodityItem(BaseModel):
    symbol: str
    name: str
    price_usd: float
    change_usd: float
    change_percent: float
    currency: str
    price_inr: float
    unit: str
    day_high: float
    day_low: float


class CommodityResponse(BaseModel):
    usd_inr_rate: float
    gold: CommodityItem
    silver: CommodityItem
    timestamp: str
