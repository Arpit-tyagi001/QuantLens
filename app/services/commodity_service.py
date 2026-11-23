from typing import List, Dict, Any
from app.repository import commodity_repository
from app.schemas.commodity_schema import (
    CommodityResponse,
    CommodityItem,
    MacroRatioItem,
    BullionConvertRequest,
    BullionConvertResponse,
    HistoryPoint,
)

TROY_OZ_TO_GRAMS = 31.1034768
GRAMS_PER_TOLA = 11.6638038
POUND_TO_KG = 0.45359237

# India statutory landed bullion factor:
# Post-July 2024 Union Budget: 6% basic customs duty + AIDC cess + 3% GST (~9.18% total landed duty)
INDIA_DOMESTIC_LANDED_FACTOR = 1.06 * 1.03


def get_processed_commodities() -> CommodityResponse:
    raw = commodity_repository.get_live_commodities()
    commodities_map = raw["commodities"]
    usdinr = float(commodities_map.get("usdinr", {}).get("price", 92.67))

    gold_raw = commodities_map["gold"]
    silver_raw = commodities_map["silver"]
    platinum_raw = commodities_map.get("platinum", {"price": 1289.6, "change_abs": 8.4, "change_pct": 0.65, "day_high": 1305.0, "day_low": 1275.0, "symbol": "PL=F"})
    crude_raw = commodities_map.get("crude_oil", {"price": 83.41, "change_abs": -0.85, "change_pct": -1.01, "day_high": 84.6, "day_low": 82.9, "symbol": "CL=F"})
    copper_raw = commodities_map.get("copper", {"price": 5.485, "change_abs": 0.045, "change_pct": 0.83, "day_high": 5.54, "day_low": 5.42, "symbol": "HG=F"})
    gas_raw = commodities_map.get("natural_gas", {"price": 3.748, "change_abs": 0.082, "change_pct": 2.23, "day_high": 3.81, "day_low": 3.66, "symbol": "NG=F"})

    # Precious Metals Landed Indian Formulas
    gold_usd = gold_raw["price"]
    gold_10g_24k = round(((gold_usd / TROY_OZ_TO_GRAMS) * usdinr) * 10 * INDIA_DOMESTIC_LANDED_FACTOR, 2)
    gold_10g_22k = round(gold_10g_24k * (22.0 / 24.0), 2)
    gold_10g_18k = round(gold_10g_24k * (18.0 / 24.0), 2)

    silver_usd = silver_raw["price"]
    silver_1kg = round(((silver_usd / TROY_OZ_TO_GRAMS) * usdinr) * 1000 * INDIA_DOMESTIC_LANDED_FACTOR, 2)
    silver_10g = round(silver_1kg / 100.0, 2)

    platinum_usd = platinum_raw["price"]
    platinum_10g = round(((platinum_usd / TROY_OZ_TO_GRAMS) * usdinr) * 10 * INDIA_DOMESTIC_LANDED_FACTOR, 2)

    crude_usd = crude_raw["price"]
    crude_inr_bbl = round(crude_usd * usdinr, 2)

    copper_usd_lb = copper_raw["price"]
    copper_inr_kg = round((copper_usd_lb / POUND_TO_KG) * usdinr, 2)

    gas_usd = gas_raw["price"]
    gas_inr = round(gas_usd * usdinr, 2)

    # Commodity Items
    gold_item = CommodityItem(
        symbol="GC=F",
        name="Gold (24K Bullion)",
        category="Precious Metals",
        price_usd=gold_raw["price"],
        change_usd=gold_raw["change_abs"],
        change_percent=gold_raw["change_pct"],
        currency="USD / INR",
        price_inr=gold_10g_24k,
        unit="per 10g (MCX / IBJA)",
        day_high=gold_raw["day_high"],
        day_low=gold_raw["day_low"],
    )

    silver_item = CommodityItem(
        symbol="SI=F",
        name="Silver (999 Fine)",
        category="Precious Metals",
        price_usd=silver_raw["price"],
        change_usd=silver_raw["change_abs"],
        change_percent=silver_raw["change_pct"],
        currency="USD / INR",
        price_inr=silver_1kg,
        unit="per 1 kg (MCX / IBJA)",
        day_high=silver_raw["day_high"],
        day_low=silver_raw["day_low"],
    )

    platinum_item = CommodityItem(
        symbol="PL=F",
        name="Platinum Spot",
        category="Precious Metals",
        price_usd=platinum_raw["price"],
        change_usd=platinum_raw["change_abs"],
        change_percent=platinum_raw["change_pct"],
        currency="USD / INR",
        price_inr=platinum_10g,
        unit="per 10g (Landed)",
        day_high=platinum_raw["day_high"],
        day_low=platinum_raw["day_low"],
    )

    crude_item = CommodityItem(
        symbol="CL=F",
        name="Crude Oil (WTI)",
        category="Energy",
        price_usd=crude_raw["price"],
        change_usd=crude_raw["change_abs"],
        change_percent=crude_raw["change_pct"],
        currency="USD / INR",
        price_inr=crude_inr_bbl,
        unit="per barrel (INR)",
        day_high=crude_raw["day_high"],
        day_low=crude_raw["day_low"],
    )

    copper_item = CommodityItem(
        symbol="HG=F",
        name="Copper High Grade",
        category="Industrial Metals",
        price_usd=copper_raw["price"],
        change_usd=copper_raw["change_abs"],
        change_percent=copper_raw["change_pct"],
        currency="USD / INR",
        price_inr=copper_inr_kg,
        unit="per kg (INR)",
        day_high=copper_raw["day_high"],
        day_low=copper_raw["day_low"],
    )

    gas_item = CommodityItem(
        symbol="NG=F",
        name="Natural Gas (Henry Hub)",
        category="Energy",
        price_usd=gas_raw["price"],
        change_usd=gas_raw["change_abs"],
        change_percent=gas_raw["change_pct"],
        currency="USD / INR",
        price_inr=gas_inr,
        unit="per MMBtu",
        day_high=gas_raw["day_high"],
        day_low=gas_raw["day_low"],
    )

    # Macro Ratios & Indicators
    gold_silver_ratio = round(gold_usd / max(silver_usd, 0.01), 2)
    gold_oil_ratio = round(gold_usd / max(crude_usd, 0.01), 2)
    copper_gold_ratio = round(((copper_usd_lb / POUND_TO_KG) * 1000) / max(gold_usd, 0.01), 2)

    ratios = [
        MacroRatioItem(
            id="gold_silver",
            name="Gold / Silver Ratio",
            value=gold_silver_ratio,
            unit="oz Ag / oz Au",
            signal="Silver Accumulation Zone" if gold_silver_ratio >= 80.0 else "Equilibrium",
            insight=f"Trading at {gold_silver_ratio}. Readings > 80 historically signal high probability of Silver outperforming Gold.",
            historical_benchmark=65.0,
        ),
        MacroRatioItem(
            id="gold_oil",
            name="Gold / Oil Ratio",
            value=gold_oil_ratio,
            unit="Barrels / oz Au",
            signal="Elevated Macro Uncertainty" if gold_oil_ratio > 30.0 else "Stable Macro Expansion",
            insight=f"One ounce of gold purchases {gold_oil_ratio} barrels of crude oil. Historical median is ~20-25 barrels.",
            historical_benchmark=24.0,
        ),
        MacroRatioItem(
            id="copper_gold",
            name="Copper / Gold Spread Index",
            value=copper_gold_ratio,
            unit="x1000 Index",
            signal="Steady Industrial Demand",
            insight="Dr. Copper vs Gold ratio benchmarks global manufacturing growth against safe-haven positioning.",
            historical_benchmark=3.5,
        ),
    ]

    all_commodities = [gold_item, silver_item, platinum_item, crude_item, copper_item, gas_item]

    # Clean up 30-day historical points
    history_30d = {}
    for key, pts in raw.get("history_30d", {}).items():
        history_30d[key] = [HistoryPoint(date=p["date"], price=p["price"]) for p in pts]

    return CommodityResponse(
        usd_inr_rate=usdinr,
        gold=gold_item,
        silver=silver_item,
        platinum=platinum_item,
        crude_oil=crude_item,
        copper=copper_item,
        natural_gas=gas_item,
        all_commodities=all_commodities,
        ratios=ratios,
        history_30d=history_30d,
        karat_rates_inr={
            "24K_10g": gold_10g_24k,
            "22K_10g": gold_10g_22k,
            "18K_10g": gold_10g_18k,
            "Silver_1kg": silver_1kg,
            "Silver_10g": silver_10g,
            "Platinum_10g": platinum_10g,
        },
        timestamp=raw.get("timestamp", ""),
        is_live=raw.get("is_live", True),
    )


def calculate_bullion_conversion(req: BullionConvertRequest) -> BullionConvertResponse:
    raw = commodity_repository.get_live_commodities()
    commodities_map = raw["commodities"]
    usdinr = float(commodities_map.get("usdinr", {}).get("price", 92.67))

    metal = req.metal.lower()
    grams = float(req.weight_grams)
    troy_oz = round(grams / TROY_OZ_TO_GRAMS, 4)
    tola = round(grams / GRAMS_PER_TOLA, 4)

    if metal == "silver":
        base_spot_usd_oz = float(commodities_map["silver"]["price"])
        purity = 0.999
        karat = 24
    elif metal == "platinum":
        base_spot_usd_oz = float(commodities_map.get("platinum", {}).get("price", 1289.60))
        purity = 0.999
        karat = 24
    else:  # gold
        base_spot_usd_oz = float(commodities_map["gold"]["price"])
        karat = req.karat if req.karat in (18, 22, 24) else 24
        purity = 0.999 if karat == 24 else (22.0 / 24.0) if karat == 22 else 0.75

    # Pure metal spot price in USD
    spot_usd = round(troy_oz * base_spot_usd_oz * purity, 2)
    spot_inr = round(spot_usd * usdinr, 2)

    # Statutory 6% Customs Duty + AIDC Cess (Post-July 2024 Budget)
    customs_inr = round(spot_inr * 0.06, 2)
    subtotal_inr = spot_inr + customs_inr

    # 3% GST
    gst_inr = round(subtotal_inr * 0.03, 2)
    total_landed_inr = round(subtotal_inr + gst_inr, 2)
    total_landed_usd = round(total_landed_inr / usdinr, 2)

    return BullionConvertResponse(
        metal=metal.capitalize(),
        weight_grams=grams,
        weight_tola=tola,
        weight_troy_oz=troy_oz,
        karat=karat,
        purity_pct=round(purity * 100.0, 1),
        spot_usd=spot_usd,
        spot_inr=spot_inr,
        customs_tariff_inr=customs_inr,
        gst_inr=gst_inr,
        total_landed_inr=total_landed_inr,
        total_landed_usd=total_landed_usd,
    )
