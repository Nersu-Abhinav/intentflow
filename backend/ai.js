const { z } = require("zod");

const PurchaseIntentSchema = z.object({
  merchantName: z.string().min(1),
  productName: z.string().min(1),
  currency: z.string().length(3),
  options: z.array(z.object({
    billingPeriod: z.enum(["monthly", "annual"]),
    monthlyPrice: z.number().nonnegative(),
    totalPrice: z.number().nonnegative(),
    description: z.string()
  })).min(1),
  userIntent: z.object({
    purpose: z.string().min(1),
    mustKeepCashAboveReserve: z.boolean(),
    preference: z.enum(["lowest_total_cost", "maximum_liquidity", "balanced"])
  })
});

function validateExtractedIntent(payload) {
  return PurchaseIntentSchema.parse(payload);
}

module.exports = { PurchaseIntentSchema, validateExtractedIntent };
