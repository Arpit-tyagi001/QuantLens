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
