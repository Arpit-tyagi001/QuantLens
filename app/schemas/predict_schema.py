import re
from typing import List
from pydantic import BaseModel, Field, field_validator

TICKER_PATTERN = re.compile(r"^[A-Z0-9.\-^=]{1,15}$")


def _normalize_ticker(value: str) -> str:
    """Trim, uppercase, and validate a stock ticker symbol."""
    cleaned = value.strip().upper()
    if not TICKER_PATTERN.match(cleaned):
        raise ValueError(f"Invalid ticker format: {value!r}")
    return cleaned


class PredictRequest(BaseModel):
    ticker: str

    @field_validator("ticker")
    @classmethod
    def validate_ticker(cls, v: str) -> str:
        return _normalize_ticker(v)


class BatchPredictRequest(BaseModel):
    tickers: List[str] = Field(..., min_length=1, max_length=20)

    @field_validator("tickers")
    @classmethod
    def validate_tickers(cls, values: List[str]) -> List[str]:
        seen = set()
        normalized = []
        for item in values:
            ticker = _normalize_ticker(item)
            if ticker not in seen:
                seen.add(ticker)
                normalized.append(ticker)
        return normalized
