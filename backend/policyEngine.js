function buildAuthorityEnvelope({option,policy}){
  return{
    status:"ACTIVE",
    amount:{maxTransactionAmount:Number(option.billingPeriod==="monthly"?option.monthlyPrice:option.totalPrice),currency:option.currency,cadence:option.billingPeriod},
    merchant:{categoryCodes:policy.allowedMerchantCategoryCodes||[],countries:policy.allowedMerchantCountries||[]},
    allowedCurrencies:policy.allowedCurrencies||[option.currency],
    expiresAt:policy.authorityExpiresAt||null,
    purpose:option.description||"Business purchase"
  };
}
function enforceTransaction({transaction={},authority={}}){
  const reasons=[];
  const currencies=Array.isArray(authority.allowedCurrencies)?authority.allowedCurrencies:[];
  const categoryCodes=Array.isArray(authority.merchant?.categoryCodes)?authority.merchant.categoryCodes:[];
  const countries=Array.isArray(authority.merchant?.countries)?authority.merchant.countries:[];
  if(authority.status!=="ACTIVE")reasons.push("AUTHORITY_NOT_ACTIVE");
  if(!currencies.includes(transaction.currency))reasons.push("CURRENCY_NOT_ALLOWED");
  if(Number(transaction.amount)>Number(authority.amount?.maxTransactionAmount??0))reasons.push("AMOUNT_LIMIT_EXCEEDED");
  if(categoryCodes.length&&!categoryCodes.includes(String(transaction.merchantCategoryCode)))reasons.push("MERCHANT_CATEGORY_NOT_ALLOWED");
  if(countries.length&&!countries.includes(String(transaction.merchantCountry)))reasons.push("MERCHANT_COUNTRY_NOT_ALLOWED");
  return{allowed:reasons.length===0,reasons};
}
module.exports={buildAuthorityEnvelope,enforceTransaction};