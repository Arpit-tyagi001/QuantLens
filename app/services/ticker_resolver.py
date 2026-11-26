"""
Smart Ticker Resolver.

Translates company names, colloquial aliases, and brand names into their
corresponding market ticker symbols (e.g. "Google" -> "GOOGL", "Reliance" -> "RELIANCE.NS").
Uses an instant in-memory lookup table for high-frequency global & Indian assets,
falling back to Yahoo Finance's live search API with an in-memory TTL cache.
"""

import json
import logging
import re
import urllib.parse
import urllib.request
from typing import Optional
from cachetools import TTLCache

logger = logging.getLogger(__name__)

# Valid ticker regex: 1-15 chars, alphanumeric with allowed symbols (., -, ^, =)
TICKER_PATTERN = re.compile(r"^[A-Z0-9.\-^=]{1,15}$")

# Valid characters for search queries and company names (no control chars or code injection punctuation)
VALID_QUERY_PATTERN = re.compile(r"^[A-Za-z0-9\s.\-^=&']{1,50}$")

# In-memory TTL cache for resolved queries (holds 500 items for 24 hours)
_RESOLVER_CACHE = TTLCache(maxsize=500, ttl=86400)

# Static dictionary for instantaneous resolution of major global & Indian assets
STATIC_ALIASES = {
    # US Tech & Global Mega-Caps
    "google": "GOOGL",
    "goog": "GOOG",
    "googl": "GOOGL",
    "alphabet": "GOOGL",
    "apple": "AAPL",
    "aapl": "AAPL",
    "microsoft": "MSFT",
    "msft": "MSFT",
    "amazon": "AMZN",
    "amzn": "AMZN",
    "nvidia": "NVDA",
    "nvda": "NVDA",
    "tesla": "TSLA",
    "tsla": "TSLA",
    "meta": "META",
    "facebook": "META",
    "netflix": "NFLX",
    "nflx": "NFLX",
    "amd": "AMD",
    "advanced micro devices": "AMD",
    "intel": "INTC",
    "intc": "INTC",
    "broadcom": "AVGO",
    "qualcomm": "QCOM",
    "tsmc": "TSM",
    "taiwan semiconductor": "TSM",
    "asml": "ASML",
    "oracle": "ORCL",
    "adobe": "ADBE",
    "salesforce": "CRM",
    "palantir": "PLTR",
    "uber": "UBER",
    "airbnb": "ABNB",
    "spotify": "SPOT",
    "berkshire": "BRK-B",
    "berkshire hathaway": "BRK-B",
    "jpmorgan": "JPM",
    "jp morgan": "JPM",
    "chase": "JPM",
    "visa": "V",
    "mastercard": "MA",
    "walmart": "WMT",
    "costco": "COST",
    "exxon": "XOM",
    "exxonmobil": "XOM",
    "chevron": "CVX",
    "coca cola": "KO",
    "coke": "KO",
    "pepsi": "PEP",
    "pepsico": "PEP",
    "disney": "DIS",
    "walt disney": "DIS",
    "boeing": "BA",
    "goldman": "GS",
    "goldman sachs": "GS",
    "morgan stanley": "MS",
    
    # Major Indices & Cryptos
    "sp500": "^GSPC",
    "s&p 500": "^GSPC",
    "spx": "^GSPC",
    "nasdaq": "^IXIC",
    "nasdaq 100": "^NDX",
    "dow": "^DJI",
    "dow jones": "^DJI",
    "bitcoin": "BTC-USD",
    "btc": "BTC-USD",
    "ethereum": "ETH-USD",
    "eth": "ETH-USD",

    # Major Indian Equities & Indices (NSE default)
    "reliance": "RELIANCE.NS",
    "reliance industries": "RELIANCE.NS",
    "ril": "RELIANCE.NS",
    "tcs": "TCS.NS",
    "tata consultancy services": "TCS.NS",
    "hdfc": "HDFCBANK.NS",
    "hdfc bank": "HDFCBANK.NS",
    "infosys": "INFY.NS",
    "infy": "INFY.NS",
    "icici": "ICICIBANK.NS",
    "icici bank": "ICICIBANK.NS",
    "state bank of india": "SBIN.NS",
    "sbi": "SBIN.NS",
    "sbin": "SBIN.NS",
    "bharti airtel": "BHARTIARTL.NS",
    "airtel": "BHARTIARTL.NS",
    "itc": "ITC.NS",
    "hindustan unilever": "HINDUNILVR.NS",
    "hul": "HINDUNILVR.NS",
    "l&t": "LT.NS",
    "larsen and toubro": "LT.NS",
    "larsen & toubro": "LT.NS",
    "tata motors": "TATAMOTORS.NS",
    "tata steel": "TATASTEEL.NS",
    "maruti": "MARUTI.NS",
    "maruti suzuki": "MARUTI.NS",
    "mahindra": "M&M.NS",
    "m&m": "M&M.NS",
    "kotak": "KOTAKBANK.NS",
    "kotak bank": "KOTAKBANK.NS",
    "kotak mahindra": "KOTAKBANK.NS",
    "axis": "AXISBANK.NS",
    "axis bank": "AXISBANK.NS",
    "bajaj finance": "BAJFINANCE.NS",
    "wipro": "WIPRO.NS",
    "hcl": "HCLTECH.NS",
    "hcl tech": "HCLTECH.NS",
    "adani enterprises": "ADANIENT.NS",
    "adani ports": "ADANIPORTS.NS",
    "zomato": "ZOMATO.NS",
    "swiggy": "SWIGGY.NS",
    "paytm": "PAYTM.NS",
    "ola electric": "OLAELEC.NS",
    "jio financial": "JIOFIN.NS",
    "jio": "JIOFIN.NS",
    "nifty": "^NSEI",
    "nifty 50": "^NSEI",
    "bank nifty": "^NSEBANK",
    "banknifty": "^NSEBANK",
    "sensex": "^BSESN",
}


def _clean_query(name: str) -> str:
    """Normalize input query for alias lookup."""
    return re.sub(r"\s+", " ", name.strip().lower())


def _search_yahoo_finance(query: str) -> Optional[str]:
    """
    Fallback: Query Yahoo Finance Search API for company symbol.
    Prefers EQUITY, ETF, or INDEX quote types.
    """
    encoded = urllib.parse.quote(query)
    url = f"https://query2.finance.yahoo.com/v1/finance/search?q={encoded}&quotesCount=5&newsCount=0"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    )
    
    try:
        with urllib.request.urlopen(req, timeout=3.0) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            quotes = data.get("quotes", [])
            if not quotes:
                return None
            
            # Prioritize equity quotes
            preferred_types = {"EQUITY", "ETF", "INDEX", "MUTUALFUND", "CRYPTOCURRENCY"}
            for quote in quotes:
                symbol = quote.get("symbol", "").strip().upper()
                qtype = quote.get("quoteType", "")
                if symbol and qtype in preferred_types and TICKER_PATTERN.match(symbol):
                    return symbol
            
            # If no typed match, pick first valid symbol
            for quote in quotes:
                symbol = quote.get("symbol", "").strip().upper()
                if symbol and TICKER_PATTERN.match(symbol):
                    return symbol
                    
    except Exception as exc:
        logger.warning(f"Yahoo Finance search failed for {query!r}: {exc}")
        
    return None


def resolve_ticker(query: str) -> str:
    """
    Resolves a ticker symbol or company name into a standard market ticker.
    
    Resolution hierarchy:
    1. Check basic query format / character whitelist.
    2. Check if the query is already cached.
    3. Check static alias lookup dictionary.
    4. Check if query is an explicit uppercase ticker symbol (e.g. 'NVDA', 'RELIANCE.NS', 'AAPL').
    5. Query live Yahoo Finance search API (fallback for international/unlisted aliases).
    6. Fallback: return cleaned uppercase query if it satisfies ticker pattern,
       otherwise raise ValueError.
    """
    if not query or not isinstance(query, str):
        raise ValueError("Invalid ticker query: empty or non-string input.")

    raw = query.strip()
    if not raw or not VALID_QUERY_PATTERN.match(raw):
        raise ValueError(f"Invalid characters or format for ticker/company query: {query!r}")

    norm = _clean_query(raw)
    upper = raw.upper()

    # 1. Cache hit
    if norm in _RESOLVER_CACHE:
        return _RESOLVER_CACHE[norm]

    # 2. Static Alias Dictionary Hit (e.g. "Google", "reliance", "apple", "tcs")
    if norm in STATIC_ALIASES:
        resolved = STATIC_ALIASES[norm]
        _RESOLVER_CACHE[norm] = resolved
        return resolved

    # 3. Explicit uppercase ticker format with no spaces (e.g. AAPL, NVDA, RELIANCE.NS, ^GSPC, BTC-USD, FAKE, ERR)
    if TICKER_PATTERN.match(upper) and not any(c.isspace() for c in raw):
        # If it was entered with dots/dashes/carets or strictly uppercase, trust as ticker
        if raw.isupper() or any(char in raw for char in ".-^="):
            _RESOLVER_CACHE[norm] = upper
            return upper

    # 4. Live Yahoo Finance Search API for company names or international equities
    live_symbol = _search_yahoo_finance(raw)
    if live_symbol:
        _RESOLVER_CACHE[norm] = live_symbol
        return live_symbol

    # 5. Final fallback: If uppercase raw matches TICKER_PATTERN and has no whitespace
    if TICKER_PATTERN.match(upper) and not any(c.isspace() for c in raw):
        _RESOLVER_CACHE[norm] = upper
        return upper

    raise ValueError(f"Could not resolve company name or ticker for {query!r}")


# Curated catalog of institutional assets for autocomplete & discoverability
POPULAR_ASSETS = [
    {"symbol": "NVDA", "name": "NVIDIA Corporation", "exchange": "NASDAQ", "category": "Semiconductors"},
    {"symbol": "AAPL", "name": "Apple Inc.", "exchange": "NASDAQ", "category": "Consumer Tech"},
    {"symbol": "GOOGL", "name": "Alphabet Inc. (Google)", "exchange": "NASDAQ", "category": "Internet & AI"},
    {"symbol": "MSFT", "name": "Microsoft Corporation", "exchange": "NASDAQ", "category": "Enterprise Software"},
    {"symbol": "AMZN", "name": "Amazon.com Inc.", "exchange": "NASDAQ", "category": "E-Commerce & Cloud"},
    {"symbol": "TSLA", "name": "Tesla Inc.", "exchange": "NASDAQ", "category": "Clean Energy & Auto"},
    {"symbol": "META", "name": "Meta Platforms Inc.", "exchange": "NASDAQ", "category": "Social Media & AI"},
    {"symbol": "RELIANCE.NS", "name": "Reliance Industries Ltd.", "exchange": "NSE", "category": "Energy & Telecom"},
    {"symbol": "TCS.NS", "name": "Tata Consultancy Services", "exchange": "NSE", "category": "IT Services"},
    {"symbol": "HDFCBANK.NS", "name": "HDFC Bank Ltd.", "exchange": "NSE", "category": "Banking"},
    {"symbol": "INFY.NS", "name": "Infosys Ltd.", "exchange": "NSE", "category": "IT Services"},
    {"symbol": "TATAMOTORS.NS", "name": "Tata Motors Ltd.", "exchange": "NSE", "category": "Automotive"},
    {"symbol": "ICICIBANK.NS", "name": "ICICI Bank Ltd.", "exchange": "NSE", "category": "Banking"},
    {"symbol": "SBIN.NS", "name": "State Bank of India", "exchange": "NSE", "category": "Banking"},
    {"symbol": "BHARTIARTL.NS", "name": "Bharti Airtel Ltd.", "exchange": "NSE", "category": "Telecom"},
    {"symbol": "ZOMATO.NS", "name": "Zomato Ltd.", "exchange": "NSE", "category": "Tech & Delivery"},
    {"symbol": "SWIGGY.NS", "name": "Swiggy Ltd.", "exchange": "NSE", "category": "Tech & Delivery"},
    {"symbol": "PLTR", "name": "Palantir Technologies", "exchange": "NYSE", "category": "AI & Big Data"},
    {"symbol": "AMD", "name": "Advanced Micro Devices", "exchange": "NASDAQ", "category": "Semiconductors"},
    {"symbol": "BTC-USD", "name": "Bitcoin USD", "exchange": "CRYPTO", "category": "Digital Asset"},
    {"symbol": "ETH-USD", "name": "Ethereum USD", "exchange": "CRYPTO", "category": "Digital Asset"},
    {"symbol": "^NSEI", "name": "Nifty 50 Index", "exchange": "NSE", "category": "Index"},
    {"symbol": "^GSPC", "name": "S&P 500 Index", "exchange": "US", "category": "Index"},
    {"symbol": "^IXIC", "name": "Nasdaq Composite", "exchange": "NASDAQ", "category": "Index"},
]


def search_suggestions(query: str = "", limit: int = 8) -> list:
    """Return top asset and company suggestions matching query for UI autocomplete."""
    if not query or not query.strip():
        return POPULAR_ASSETS[:limit]

    q = query.strip().lower()
    results = []
    seen = set()

    # 1. Exact or prefix symbol match in popular catalogue
    for asset in POPULAR_ASSETS:
        sym = asset["symbol"].lower()
        if sym.startswith(q) or sym.replace(".ns", "").startswith(q):
            results.append(asset)
            seen.add(asset["symbol"])

    # 2. Substring or name match in popular catalogue
    for asset in POPULAR_ASSETS:
        if asset["symbol"] in seen:
            continue
        if q in asset["name"].lower() or q in asset["category"].lower():
            results.append(asset)
            seen.add(asset["symbol"])

    # 3. Match from static aliases
    for alias, symbol in STATIC_ALIASES.items():
        if len(results) >= limit:
            break
        if symbol in seen:
            continue
        if alias.startswith(q) or q in alias:
            exch = "NSE" if symbol.endswith(".NS") else "CRYPTO" if "USD" in symbol else "US"
            results.append({
                "symbol": symbol,
                "name": alias.title(),
                "exchange": exch,
                "category": "Equity",
            })
            seen.add(symbol)

    return results[:limit]

