from pydantic import BaseModel
from typing import List

class PredictRequest(BaseModel):
    ticker: str

class BatchPredictRequest(BaseModel):
    tickers: List[str]