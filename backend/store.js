const decisions = [];
const transactions = [];

function recordDecision(decision) {
  const entry = { id: decisions.length + 1, createdAt: new Date().toISOString(), ...decision };
  decisions.unshift(entry);
  return entry;
}

function recordTransaction(transaction) {
  const entry = { id: transactions.length + 1, createdAt: new Date().toISOString(), ...transaction };
  transactions.unshift(entry);
  return entry;
}

module.exports = {
  recordDecision,
  recordTransaction,
  listDecisions: () => decisions,
  listTransactions: () => transactions
};
