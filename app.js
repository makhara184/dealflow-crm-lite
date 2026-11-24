const STAGES = ["New Lead", "Follow-Up", "Negotiation", "Closed Won"];
const STORAGE_KEY = "dealflow_crm_deals";

let deals = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || [
  { id: 1, title: "Enterprise Fleet Renewal", owner: "R. Sharma", value: 14500, stage: "Negotiation" },
  { id: 2, title: "Q4 Distribution Partner", owner: "M. Patel", value: 8200, stage: "Follow-Up" },
  { id: 3, title: "Retail Store Onboarding", owner: "A. Verma", value: 5400, stage: "Closed Won" },
];

const boardEl = document.getElementById("board");
const kpiRow = document.getElementById("kpiRow");
const searchInput = document.getElementById("searchInput");

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(deals));
}

function formatMoney(n) {
  return "$" + Number(n || 0).toLocaleString();
}

function render() {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = deals.filter(
    (d) => d.title.toLowerCase().includes(query) || d.owner.toLowerCase().includes(query)
  );

  const totalPipeline = filtered.reduce((s, d) => s + Number(d.value), 0);
  const wonDeals = filtered.filter((d) => d.stage === "Closed Won");
  const wonValue = wonDeals.reduce((s, d) => s + Number(d.value), 0);
  const winRate = filtered.length ? Math.round((wonDeals.length / filtered.length) * 100) : 0;

  kpiRow.innerHTML = `
    <div class="kpi"><span>Total Active Deals</span><strong>${filtered.length}</strong></div>
    <div class="kpi"><span>Pipeline Value</span><strong>${formatMoney(totalPipeline)}</strong></div>
    <div class="kpi"><span>Closed Won Revenue</span><strong>${formatMoney(wonValue)}</strong></div>
    <div class="kpi"><span>Win Rate</span><strong>${winRate}%</strong></div>
  `;

  boardEl.innerHTML = "";
  STAGES.forEach((stage, stageIdx) => {
    const col = document.createElement("div");
    col.className = "col";
    const items = filtered.filter((d) => d.stage === stage);
    const colSum = items.reduce((s, d) => s + Number(d.value), 0);
    col.innerHTML = `<div class="col-head"><span>${stage} (${items.length})</span><span>${formatMoney(colSum)}</span></div>`;

    items.forEach((deal) => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <h3></h3>
        <div class="meta"></div>
        <div class="val">${formatMoney(deal.value)}</div>
        <div class="card-actions"></div>
      `;
      card.querySelector("h3").textContent = deal.title;
      card.querySelector(".meta").textContent = `Contact: ${deal.owner}`;
      const actions = card.querySelector(".card-actions");

      if (stageIdx > 0) {
        const back = document.createElement("button");
        back.className = "chip-btn";
        back.textContent = "← Prev";
        back.onclick = () => { deal.stage = STAGES[stageIdx - 1]; save(); render(); };
        actions.appendChild(back);
      }
      if (stageIdx < STAGES.length - 1) {
        const next = document.createElement("button");
        next.className = "chip-btn";
        next.textContent = "Advance →";
        next.onclick = () => { deal.stage = STAGES[stageIdx + 1]; save(); render(); };
        actions.appendChild(next);
      }
      const del = document.createElement("button");
      del.className = "chip-btn danger";
      del.textContent = "Delete";
      del.onclick = () => { deals = deals.filter((x) => x.id !== deal.id); save(); render(); };
      actions.appendChild(del);

      col.appendChild(card);
    });

    boardEl.appendChild(col);
  });
}

document.getElementById("dealForm").addEventListener("submit", (e) => {
  e.preventDefault();
  deals.push({
    id: Date.now(),
    title: document.getElementById("dealTitle").value.trim(),
    owner: document.getElementById("dealOwner").value.trim(),
    value: Number(document.getElementById("dealValue").value),
    stage: document.getElementById("dealStage").value,
  });
  save();
  e.target.reset();
  render();
});

document.getElementById("exportCsvBtn").addEventListener("click", () => {
  const rows = [["Title", "Contact", "Value", "Stage"], ...deals.map((d) => [d.title, d.owner, d.value, d.stage])];
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "dealflow-pipeline.csv";
  a.click();
});

searchInput.addEventListener("input", render);
render();
