from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class IPOPredictRequest(BaseModel):
    company_name: str = Field(default="Upcoming IPO", max_length=100)
    issue_price: float = Field(..., gt=0, description="Issue price per share in INR")
    lot_size: int = Field(default=1, gt=0, description="Shares per lot")
    gmp: float = Field(default=0.0, description="Grey market premium in INR")
    subscription_qib: float = Field(default=5.0, ge=0)
    subscription_nii: float = Field(default=3.0, ge=0)
    subscription_retail: float = Field(default=2.0, ge=0)
    pe_ratio: Optional[float] = Field(default=28.0, ge=0)
    industry_pe: Optional[float] = Field(default=32.0, ge=0)
    market_sentiment: str = Field(default="Bullish", description="Bullish, Neutral, or Bearish")
    sector: Optional[str] = Field(default="Technology")
    annual_growth_rate: Optional[float] = Field(default=18.0, description="Estimated annual growth %")


class LongTermScenario(BaseModel):
    year: int
    bear_price: float
    base_price: float
    bull_price: float
    base_cagr_pct: float
    base_total_gain_pct: float


class PresetIPO(BaseModel):
    id: str
    company_name: str
    sector: str
    issue_price: float
    lot_size: int
    gmp: float
    subscription_qib: float
    subscription_nii: float
    subscription_retail: float
    pe_ratio: float
    industry_pe: float
    annual_growth_rate: float
    market_sentiment: str


class IPOPredictResponse(BaseModel):
    company_name: str
    issue_price: float
    gmp: float
    lot_size: int
    expected_listing_price: float
    expected_listing_gain_pct: float
    expected_listing_gain_inr: float
    gain_per_lot_inr: float
    allotment_probability_retail_pct: float
    total_subscription_weighted: float
    listing_signal: str
    signal_confidence: str
    valuation_status: str
    long_term_projections: List[LongTermScenario]
    key_metrics: Dict[str, Any]
