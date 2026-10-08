function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function annualizeMonthly(monthly, months = 12) {
  return roundMoney(Number(monthly) * Number(months));
}

function calculateOptionImpact({ currentCash, reserveFloor, committedSpend = 0, oneTimeCost = 0, recurringMonthlyCost = 0 }) {
  const cash = Number(currentCash);
  const committed = Number(committedSpend);
  const oneTime = Number(oneTimeCost);
  const monthly = Number(recurringMonthlyCost);
  const postPurchaseCash = roundMoney(cash - oneTime);
  const monthlyFreeCash = roundMoney(postPurchaseCash - monthly - committed);
  const reserveHeadroom = roundMoney(postPurchaseCash - Number(reserveFloor));
  return {
    postPurchaseCash,
    monthlyFreeCash,
    reserveHeadroom,
    reserveBreached: postPurchaseCash < Number(reserveFloor),
    annualRecurringCost: annualizeMonthly(monthly)
  };
}

function scorePurchaseOptions({ options, policy }) {
  const evaluated = options.map((option) => {
    const impact = calculateOptionImpact({
      currentCash: policy.currentCash,
      reserveFloor: policy.reserveFloor,
      committedSpend: policy.committedSpend,
      oneTimeCost: option.billingPeriod === "annual" ? option.totalPrice : 0,
      recurringMonthlyCost: option.billingPeriod === "monthly" ? option.monthlyPrice : 0
    });

    const policyViolations = [];

    if (impact.reserveBreached) policyViolations.push("MINIMUM_CASH_RESERVE_BREACH");

    const exposure = Number(option.billingPeriod === "annual" ? option.totalPrice : option.monthlyPrice);
    if (exposure > Number(policy.maxPurchaseAmount)) policyViolations.push("MAX_PURCHASE_AMOUNT_BREACH");

    const safe = policyViolations.length === 0;
    return {
      ...option,
      annualEquivalent: option.billingPeriod === "annual" ? roundMoney(option.totalPrice) : annualizeMonthly(option.monthlyPrice),
      impact,
      safe,
      policyViolations
    };
  });

  const safeOptions = evaluated.filter((item) => item.safe);
  const selected = safeOptions.sort((a, b) => {
    if (policy.preference === "maximum_liquidity") return b.impact.reserveHeadroom - a.impact.reserveHeadroom;
    if (policy.preference === "balanced") return (b.impact.reserveHeadroom - b.annualEquivalent * 0.02) - (a.impact.reserveHeadroom - a.annualEquivalent * 0.02);
    return a.annualEquivalent - b.annualEquivalent;
  })[0] || null;

  return { evaluated, selected };
}

module.exports = { roundMoney, annualizeMonthly, calculateOptionImpact, scorePurchaseOptions };
