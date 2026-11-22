from app.repository import commodity_repository
from app.schemas.commodity_schema import CommodityResponse, CommodityItem

TROY_OZ_TO_GRAMS = 31.1034768
# India landed bullion factor: ~15% basic customs duty + AIDC cess + 3% GST (~18.45% total tax & landed costs)
INDIA_DOMESTIC_LANDED_FACTOR = 1.15 * 1.03


def get_processed_commodities() -> CommodityResponse:
    raw = commodity_repository.get_live_commodities()
    usdinr = raw["usdinr"]["price"]

    gold_raw = raw["gold"]
    silver_raw = raw["silver"]

    # Calculate Gold 24K per 10 grams in INR (landed Indian MCX / IBJA benchmark)
    gold_usd = gold_raw["price"]
    gold_per_gram_inr = (gold_usd / TROY_OZ_TO_GRAMS) * usdinr
    gold_10g_inr = round(gold_per_gram_inr * 10 * INDIA_DOMESTIC_LANDED_FACTOR, 2)

    # Calculate Silver per 1 kg in INR (landed Indian MCX / IBJA benchmark)
    silver_usd = silver_raw["price"]
    silver_per_gram_inr = (silver_usd / TROY_OZ_TO_GRAMS) * usdinr
    silver_1kg_inr = round(silver_per_gram_inr * 1000 * INDIA_DOMESTIC_LANDED_FACTOR, 2)

    return CommodityResponse(
        usd_inr_rate=usdinr,
        timestamp=raw.get("timestamp", ""),
        gold=CommodityItem(
            symbol="GC=F",
            name="Gold (24K Bullion)",
            price_usd=gold_raw["price"],
            change_usd=gold_raw["change_abs"],
            change_percent=gold_raw["change_pct"],
            currency="USD / INR",
            price_inr=gold_10g_inr,
            unit="per 10 grams (MCX/IBJA)",
            day_high=gold_raw["day_high"],
            day_low=gold_raw["day_low"],
        ),
        silver=CommodityItem(
            symbol="SI=F",
            name="Silver (999 Fine)",
            price_usd=silver_raw["price"],
            change_usd=silver_raw["change_abs"],
            change_percent=silver_raw["change_pct"],
            currency="USD / INR",
            price_inr=silver_1kg_inr,
            unit="per 1 kilogram (MCX/IBJA)",
            day_high=silver_raw["day_high"],
            day_low=silver_raw["day_low"],
        ),
    )
