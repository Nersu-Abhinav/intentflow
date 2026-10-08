const axios = require("axios");
const crypto = require("crypto");

const config = {
  baseUrl: process.env.AIRWALLEX_BASE_URL || "https://api.sandbox.airwallex.com",
  clientId: process.env.AIRWALLEX_CLIENT_ID,
  apiKey: process.env.AIRWALLEX_API_KEY,
  accountId: process.env.AIRWALLEX_ACCOUNT_ID
};

let tokenCache = { token: null, expiresAt: 0 };

async function getAccessToken() {
  if (!config.clientId || !config.apiKey) throw new Error("Airwallex credentials are not configured");
  if (tokenCache.token && Date.now() < tokenCache.expiresAt - 60000) return tokenCache.token;

  const response = await axios.post(
    config.baseUrl + "/api/v1/authentication/login",
    {},
    { headers: { "x-client-id": config.clientId, "x-api-key": config.apiKey }, timeout: 15000 }
  );

  tokenCache = { token: response.data.token, expiresAt: new Date(response.data.expires_at).getTime() };
  return tokenCache.token;
}

async function request(method, path, data) {
  const token = await getAccessToken();
  const response = await axios({
    method,
    url: config.baseUrl + path,
    data,
    timeout: 15000,
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
      "x-request-id": crypto.randomUUID()
    }
  });
  return response.data;
}

const getBalances = () => request("GET", "/api/v1/balances/current");
const createCardholder = (payload) => request("POST", "/api/v1/issuing/cardholders/create", payload);
const createCard = (payload) => request("POST", "/api/v1/issuing/cards/create", payload);
const updateCard = (cardId, payload) => request("POST", "/api/v1/issuing/cards/" + cardId + "/update", payload);
const getCardLimits = (cardId) => request("GET", "/api/v1/issuing/cards/" + cardId + "/limits");
const simulateTransaction = (payload) => request("POST", "/api/v1/simulation/issuing/create", payload);
const captureTransaction = (lifecycleId, payload = {}) => request("POST", "/api/v1/simulation/issuing/card_transaction_lifecycles/" + lifecycleId + "/capture", payload);
const reverseTransaction = (lifecycleId, payload = {}) => request("POST", "/api/v1/simulation/issuing/card_transaction_lifecycles/" + lifecycleId + "/reverse", payload);
const refundTransaction = (payload) => request("POST", "/api/v1/simulation/issuing/refund", payload);

module.exports = { getAccessToken, getBalances, createCardholder, createCard, updateCard, getCardLimits, simulateTransaction, captureTransaction, reverseTransaction, refundTransaction, accountId: config.accountId };
