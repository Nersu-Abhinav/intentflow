require("dotenv").config();
const express=require("express");
const cors=require("cors");
const path=require("path");
const {scorePurchaseOptions}=require("./financialEngine");
const {buildAuthorityEnvelope,enforceTransaction}=require("./policyEngine");
const {validateExtractedIntent}=require("./ai");
const store=require("./store");
const airwallex=require("./airwallex");

const app=express();
const frontendDir=path.join(__dirname,"..","frontend");
app.use(cors());
app.use(express.json());
app.use(express.static(frontendDir));

app.get("/api/health",(_req,res)=>res.json({success:true,service:"IntentFlow",status:"online",mode:"sandbox"}));

app.get("/api/airwallex/status",async(_req,res)=>{
  try{await airwallex.getAccessToken();res.json({success:true,authenticated:true,sandbox:true});}
  catch(error){res.status(502).json({success:false,authenticated:false,error:error.response?.data||error.message});}
});

app.get("/api/airwallex/balances",async(_req,res)=>{
  try{res.json({success:true,balances:await airwallex.getBalances()});}
  catch(error){res.status(502).json({success:false,error:error.response?.data||error.message});}
});

app.post("/api/agent/evaluate",(req,res)=>{
  try{
    const intent=validateExtractedIntent(req.body.intent);
    const policy={
      currentCash:Number(req.body.policy.currentCash),
      reserveFloor:Number(req.body.policy.reserveFloor),
      committedSpend:Number(req.body.policy.committedSpend||0),
      maxPurchaseAmount:Number(req.body.policy.maxPurchaseAmount),
      allowedCurrencies:req.body.policy.allowedCurrencies||[intent.currency],
      allowedMerchantCategoryCodes:req.body.policy.allowedMerchantCategoryCodes||[],
      allowedMerchantCountries:req.body.policy.allowedMerchantCountries||[],
      preference:req.body.policy.preference||intent.userIntent.preference
    };
    const analysis=scorePurchaseOptions({options:intent.options,policy});
    if(!analysis.selected){
      const decision=store.recordDecision({type:"PURCHASE_EVALUATION",outcome:"BLOCKED",reason:"No purchase option satisfies deterministic policy",analysis});
      return res.json({success:true,decision,analysis});
    }
    const authority=buildAuthorityEnvelope({option:analysis.selected,policy});
    const decision=store.recordDecision({
      type:"PURCHASE_EVALUATION",
      outcome:"APPROVED_FOR_AUTHORITY",
      selectedOption:analysis.selected,
      authority,
      explanation:analysis.selected.billingPeriod==="monthly"
        ?"Monthly billing preserves liquidity while satisfying the reserve policy."
        :"Annual billing is safe under the reserve policy and has lower equivalent annual cost."
    });
    return res.json({success:true,decision,analysis,authority});
  }catch(error){return res.status(400).json({success:false,error:error.issues||error.message});}
});

app.post("/api/policy/check-transaction",(req,res)=>{
  try{
    const result=enforceTransaction(req.body);
    const transaction=store.recordTransaction({...req.body.transaction,decision:result.allowed?"ALLOWED":"BLOCKED",reasons:result.reasons});
    return res.json({success:true,...result,transaction});
  }catch(error){return res.status(400).json({success:false,error:error.message});}
});

app.get("/api/audit/decisions",(_req,res)=>res.json({success:true,decisions:store.listDecisions()}));
app.get("/api/audit/transactions",(_req,res)=>res.json({success:true,transactions:store.listTransactions()}));
app.use((_req,res)=>res.sendFile("index.html",{root:frontendDir}));

const PORT=Number(process.env.PORT||3000);
app.listen(PORT,"0.0.0.0",()=>console.log("IntentFlow API online on port "+PORT));