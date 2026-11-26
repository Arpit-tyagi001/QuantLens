// src/services/api.js

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

/**
 * Sends a list of tickers to the FastAPI batch prediction endpoint.
 * @param {string[]} tickers - Array of stock ticker strings (e.g., ["AAPL", "MSFT"])
 * @returns {Promise<Array>} - Array of prediction result objects
 */
export async function fetchBatchPredictions(tickers) {
  const response = await fetch(`${API_BASE_URL}/predict/batch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tickers }),
  });

  if (!response.ok) {
    let message = `API error: ${response.status}`;
    try {
      const errBody = await response.json();
      if (typeof errBody?.detail === "string") {
        message = errBody.detail;
      } else if (Array.isArray(errBody?.detail) && errBody.detail[0]?.msg) {
        message = errBody.detail[0].msg;
      }
    } catch {
      // Ignore JSON parse errors on non-JSON error responses
    }
    throw new Error(message);
  }

  const data = await response.json();
  return Array.isArray(data?.batch_results) ? data.batch_results : [];
}

/**
 * Fetches real-time Gold, Silver, Platinum, Oil, Copper, and USD/INR commodity prices.
 */
export async function fetchLiveCommodities() {
  const response = await fetch(`${API_BASE_URL}/commodities/live`);
  if (!response.ok) {
    throw new Error(`Commodities API error: ${response.status}`);
  }
  return await response.json();
}

/**
 * Converts custom bullion weights (grams, tola, oz) with duty + GST breakdown.
 */
export async function convertBullion(conversionData) {
  const response = await fetch(`${API_BASE_URL}/commodities/convert`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(conversionData),
  });

  if (!response.ok) {
    throw new Error(`Bullion Conversion API error: ${response.status}`);
  }
  return await response.json();
}

/**
 * Fetches pre-configured landmark and active IPO presets.
 */
export async function fetchIPOPresets() {
  const response = await fetch(`${API_BASE_URL}/ipo/presets`);
  if (!response.ok) {
    throw new Error(`IPO Presets API error: ${response.status}`);
  }
  return await response.json();
}

/**
 * Computes expected listing gain and 1Y, 3Y, 5Y price projections.
 */
export async function predictIPOGain(ipoData) {
  const response = await fetch(`${API_BASE_URL}/ipo/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(ipoData),
  });

  if (!response.ok) {
    let message = `IPO Prediction API error: ${response.status}`;
    try {
      const errBody = await response.json();
      if (typeof errBody?.detail === "string") {
        message = errBody.detail;
      }
    } catch {
      // Ignore
    }
    throw new Error(message);
  }

  return await response.json();
}

/**
 * Fetches verified prediction track record and rolling win rate.
 */
export async function fetchPredictionLedger() {
  const response = await fetch(`${API_BASE_URL}/predict/ledger`);
  if (!response.ok) {
    throw new Error(`Ledger API error: ${response.status}`);
  }
  return await response.json();
}

/**
 * Searches for companies and tickers matching a query for autocomplete.
 * @param {string} query
 * @returns {Promise<Array>}
 */
export async function searchSuggestions(query = "") {
  try {
    const encoded = encodeURIComponent((query || "").trim());
    const response = await fetch(`${API_BASE_URL}/predict/search?q=${encoded}&limit=8`);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data?.suggestions) ? data.suggestions : [];
  } catch {
    return [];
  }
}
