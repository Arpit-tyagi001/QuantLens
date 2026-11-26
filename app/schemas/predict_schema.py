import re
from typing import List
from pydantic import BaseModel, Field, field_validator
from app.services.ticker_resolver import resolve_ticker, TICKER_PATTERN


def _normalize_ticker(value: str) -> str:
    """Resolve company name/alias or validate stock ticker symbol."""
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"Invalid ticker format: {value!r}")
    try:
        resolved = resolve_ticker(value)
        return resolved
    except Exception as e:
        raise ValueError(f"Unable to resolve ticker or company name for {value!r}: {e}")


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
