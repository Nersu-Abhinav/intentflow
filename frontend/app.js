const $ = (s) => document.querySelector(s);
const timeline = $("#timeline");
const toast = $("#toast");

function notify(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(window.__toast);
  window.__toast = setTimeout(() => toast.classList.remove("show"), 2800);
}

function addEvent(title, detail, ok = false) {
  const el = document.createElement("div");
  el.className = "event";
  el.innerHTML = '<i class="' + (ok ? "ok" : "") + '"></i><div><b>' + title + '</b><small>' + detail + '</small></div><time>NOW</time>';
  timeline.prepend(el);
}

async function api(path, options = {}) {
  const res = await fetch(path, { headers: {"Content-Type":"application/json"}, ...options });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || data.error || "Request failed");
  return data;
}

async function refresh() {
  try {
    const data = await api("/api/airwallex/balances");
    const list = data.balances?.balances || data.balances?.items || [];
    const usd = list.find(x => x.currency === "USD");
    const value = usd?.available_balance ?? usd?.availableBalance ?? usd?.balance;
    if (typeof value === "number") $("#cash").textContent = new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(value);
    addEvent("Financial state refreshed", "Live sandbox balance reconciled", true);
    notify("Airwallex balance refreshed");
  } catch (e) {
    addEvent("Sandbox balance unavailable", "Demo state retained until credentials are configured");
    notify("Using demo financial state");
  }
}

async function check(amount) {
  const data = await api("/api/policy/check-transaction", {
    method:"POST",
    body:JSON.stringify({
      authority:{status:"ACTIVE",allowedCurrencies:["USD"],amount:{maxTransactionAmount:1200},merchant:{categoryCodes:["7372"],countries:[]}},
      transaction:{amount,currency:"USD",merchantCategoryCode:"7372",merchantCountry:"US"}
    })
  });
  if (data.allowed) {
    addEvent("Payment allowed", "$" + amount.toLocaleString() + " fits the authority envelope", true);
    notify("AUTHORIZED · $"+amount.toLocaleString()+" within policy");
  } else {
    addEvent("Payment blocked", "$" + amount.toLocaleString() + " exceeds the authority boundary");
    notify("BLOCKED · " + data.reasons.join(", "));
  }
}

$("#allow").addEventListener("click", () => check(1000).catch(e => notify(e.message)));
$("#block").addEventListener("click", () => check(1500).catch(e => notify(e.message)));
$("#refresh").addEventListener("click", refresh);
