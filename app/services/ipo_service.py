from typing import List, Dict, Any
from app.schemas.ipo_schema import (
    IPOPredictRequest,
    IPOPredictResponse,
    LongTermScenario,
    PresetIPO,
)

PRESET_IPOS: List[PresetIPO] = [
    PresetIPO(
        id="waaree",
        company_name="Waaree Energies Ltd",
        sector="Solar / Clean Energy",
        issue_price=1503.0,
        lot_size=9,
        gmp=1450.0,
        subscription_qib=215.0,
        subscription_nii=62.4,
        subscription_retail=10.7,
        pe_ratio=28.2,
        industry_pe=38.5,
        annual_growth_rate=28.0,
        market_sentiment="Bullish",
    ),
    PresetIPO(
        id="premier",
        company_name="Premier Energies Ltd",
        sector="Renewable Tech",
        issue_price=450.0,
        lot_size=33,
        gmp=420.0,
        subscription_qib=216.0,
        subscription_nii=50.0,
        subscription_retail=7.6,
        pe_ratio=22.4,
        industry_pe=34.0,
        annual_growth_rate=24.0,
        market_sentiment="Bullish",
    ),
    PresetIPO(
        id="tata-tech",
        company_name="Tata Technologies Ltd",
        sector="Engineering R&D / ER&D",
        issue_price=500.0,
        lot_size=30,
        gmp=475.0,
        subscription_qib=203.4,
        subscription_nii=62.1,
        subscription_retail=16.5,
        pe_ratio=32.5,
        industry_pe=55.0,
        annual_growth_rate=20.0,
        market_sentiment="Bullish",
    ),
    PresetIPO(
        id="swiggy",
        company_name="Swiggy Ltd",
        sector="Quick Commerce & Food Tech",
        issue_price=390.0,
        lot_size=38,
        gmp=25.0,
        subscription_qib=6.02,
        subscription_nii=0.41,
        subscription_retail=1.14,
        pe_ratio=65.0,
        industry_pe=58.0,
        annual_growth_rate=25.0,
        market_sentiment="Neutral",
    ),
    PresetIPO(
        id="hyundai",
        company_name="Hyundai Motor India Ltd",
        sector="Automotive OEM",
        issue_price=1960.0,
        lot_size=7,
        gmp=-20.0,
        subscription_qib=6.97,
        subscription_nii=0.60,
        subscription_retail=0.50,
        pe_ratio=26.3,
        industry_pe=24.5,
        annual_growth_rate=12.0,
        market_sentiment="Neutral",
    ),
]


def get_all_presets() -> List[PresetIPO]:
    return PRESET_IPOS


def calculate_ipo_prediction(req: IPOPredictRequest) -> IPOPredictResponse:
    # 1. Weighted total subscription rate
    total_subscription = (0.50 * req.subscription_qib) + (0.15 * req.subscription_nii) + (0.35 * req.subscription_retail)

    # 2. Market sentiment multiplier
    sentiment = req.market_sentiment.capitalize()
    if sentiment == "Bullish":
        sentiment_factor = 1.06
    elif sentiment == "Bearish":
        sentiment_factor = 0.82
    else:
        sentiment_factor = 1.00

    # 3. Valuation factor (P/E relative to peer benchmark)
    pe = req.pe_ratio or 25.0
    ind_pe = req.industry_pe or 30.0
    val_ratio = pe / max(ind_pe, 1.0)
    if val_ratio < 0.85:
        valuation_status = "Discount to Industry (Attractive Room)"
        val_factor = 1.05
    elif val_ratio > 1.25:
        valuation_status = "Premium to Industry (Richly Valued)"
        val_factor = 0.92
    else:
        valuation_status = "Fairly Valued vs Sector"
        val_factor = 1.00

    # 4. Institutional demand buffer
    if req.subscription_qib >= 50.0:
        demand_factor = 1.05
        confidence = "High (Heavy QIB Anchor)"
    elif req.subscription_qib >= 5.0:
        demand_factor = 1.00
        confidence = "Moderate"
    else:
        demand_factor = 0.88
        confidence = "Low (Subdued Institutional Demand)"

    # 5. Adjusted GMP and Expected Listing Price
    if req.gmp >= 0:
        adjusted_gmp = req.gmp * sentiment_factor * val_factor * demand_factor
    else:
        # Negative GMP discount
        adjusted_gmp = req.gmp * (1.10 if sentiment == "Bearish" else 1.00)

    expected_listing_price = round(max(1.0, req.issue_price + adjusted_gmp), 2)
    expected_gain_inr = round(expected_listing_price - req.issue_price, 2)
    expected_gain_pct = round((expected_gain_inr / req.issue_price) * 100.0, 2)
    gain_per_lot = round(expected_gain_inr * req.lot_size, 2)

    # Allotment probability for retail
    retail_prob = round(min(100.0, 100.0 / max(req.subscription_retail, 1.0)), 2)

    # 6. Listing Signal
    if expected_gain_pct >= 40.0:
        signal = "Strong Bumper Listing"
    elif expected_gain_pct >= 15.0:
        signal = "Moderate Listing Gain"
    elif expected_gain_pct >= 0.0:
        signal = "Par / Moderate Spread"
    else:
        signal = "Discount Risk Warning"

    # 7. Long-Term Multi-Year Price Trajectory (1Y, 3Y, 5Y)
    annual_growth = (req.annual_growth_rate or 18.0) / 100.0
    bull_growth = annual_growth + 0.06
    bear_growth = max(0.02, annual_growth - 0.08)

    horizons = [1, 3, 5]
    projections: List[LongTermScenario] = []

    for t in horizons:
        base_price = round(expected_listing_price * ((1.0 + annual_growth) ** t), 2)
        bull_price = round(expected_listing_price * ((1.0 + bull_growth) ** t), 2)
        bear_price = round(expected_listing_price * ((1.0 + bear_growth) ** t), 2)

        base_total_gain_pct = round(((base_price - req.issue_price) / req.issue_price) * 100.0, 2)
        base_cagr = round((((base_price / req.issue_price) ** (1.0 / t)) - 1.0) * 100.0, 2)

        projections.append(
            LongTermScenario(
                year=t,
                bear_price=bear_price,
                base_price=base_price,
                bull_price=bull_price,
                base_cagr_pct=base_cagr,
                base_total_gain_pct=base_total_gain_pct,
            )
        )

    return IPOPredictResponse(
        company_name=req.company_name,
        issue_price=req.issue_price,
        gmp=req.gmp,
        lot_size=req.lot_size,
        expected_listing_price=expected_listing_price,
        expected_listing_gain_pct=expected_gain_pct,
        expected_listing_gain_inr=expected_gain_inr,
        gain_per_lot_inr=gain_per_lot,
        allotment_probability_retail_pct=retail_prob,
        total_subscription_weighted=round(total_subscription, 2),
        listing_signal=signal,
        signal_confidence=confidence,
        valuation_status=valuation_status,
        long_term_projections=projections,
        key_metrics={
            "sector": req.sector or "Equity",
            "qib_oversubscription": f"{req.subscription_qib}x",
            "retail_oversubscription": f"{req.subscription_retail}x",
            "annual_growth_benchmark": f"{round(annual_growth * 100, 1)}%",
            "sentiment": sentiment,
        },
    )
