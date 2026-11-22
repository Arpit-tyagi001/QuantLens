from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class CommodityItem(BaseModel):
    symbol: str
    name: str
    category: str = "Precious Metals"
    price_usd: float
    change_usd: float
    change_percent: float
    currency: str
    price_inr: float
    unit: str
    day_high: float
    day_low: float


class HistoryPoint(BaseModel):
    date: str
    price: float


class MacroRatioItem(BaseModel):
    id: str
    name: str
    value: float
    unit: str
    signal: str
    insight: str
    historical_benchmark: float


class CommodityResponse(BaseModel):
    usd_inr_rate: float
    gold: CommodityItem
    silver: CommodityItem
    platinum: Optional[CommodityItem] = None
    crude_oil: Optional[CommodityItem] = None
    copper: Optional[CommodityItem] = None
    natural_gas: Optional[CommodityItem] = None
    all_commodities: Optional[List[CommodityItem]] = None
    ratios: Optional[List[MacroRatioItem]] = None
    history_30d: Optional[Dict[str, List[HistoryPoint]]] = None
    karat_rates_inr: Optional[Dict[str, float]] = None
    timestamp: str


class BullionConvertRequest(BaseModel):
    metal: str = Field(default="gold")  # 'gold', 'silver', 'platinum'
    weight_grams: float = Field(..., gt=0)
    karat: int = Field(default=24)  # 24, 22, 18


class BullionConvertResponse(BaseModel):
    metal: str
    weight_grams: float
    weight_tola: float
    weight_troy_oz: float
    karat: int
    purity_pct: float
    spot_usd: float
    spot_inr: float
    customs_tariff_inr: float
    gst_inr: float
    total_landed_inr: float
    total_landed_usd: float
