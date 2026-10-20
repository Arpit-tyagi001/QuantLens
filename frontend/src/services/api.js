// src/services/api.js

const API_BASE_URL = "https://quantlens-backend-irqe.onrender.com";

/**
 * Sends a list of tickers to the FastAPI batch prediction endpoint.
 * @param {string[]} tickers - Array of stock ticker strings (e.g., ["AAPL", "MSFT"])
 * @returns {Promise<Array>} - Array of prediction result objects
 */
export async function fetchBatchPredictions(tickers) {
  try {
    const response = await fetch(`${API_BASE_URL}/predict/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tickers }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.batch_results;
  } catch (error) {
    console.error("Failed to fetch predictions:", error);
    return [];
  }
}