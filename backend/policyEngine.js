function buildAuthorityEnvelope({ option, policy }) {
  const maxTransactionAmount = option.billingPeriod === "monthly" ? Number(option.monthlyPrice) : Number(option.totalPrice);
  return {
    status: "ACTIVE",
    amount: { maxTransactionAmount, currency: option.currency, cadence: option.billingPeriod },
    merchant: {
      categoryCodes: policy.allowedMerchantCategoryCodes || [],
      countries: policy.allowedMerchantCountries || []
    },
    allowedCurrencies: policy.allowedCurrencies || [option.currency],
    expiresAt: policy.authorityExpiresAt || null,
    purpose: option.description || "Business purchase"
  };
}

function enforceTransaction({ transaction, authority }) {
  const reasons = [];
  if (authority.status !== "ACTIVE") reasons.push("AUTHORITY_NOT_ACTIVE");
  if (!authority.allowedCurrencies.includes(transaction.currency)) reasons.push("CURRENCY_NOT_ALLOWED");
  if (Number(transaction.amount) > Number(authority.amount.maxTransactionAmount)) reasons.push("AMOUNT_LIMIT_EXCEEDED");
  if (authority.merchant.categoryCodes.length && !authority.merchant.categoryCodes.includes(String(transaction.merchantCategoryCode))) reasons.push("MERCHANT_CATEGORY_NOT_ALLOWED");
  if (authority.merchant.countries.length && !authority.merchant.countries.includes(String(transaction.merchantCountry))) reasons.push("MERCHANT_COUNTRY_NOT_ALLOWED");
  return { allowed: reasons.length === 0, reasons };
}

module.exports = { buildAuthorityEnvelope, enforceTransaction };
