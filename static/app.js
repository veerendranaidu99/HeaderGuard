const $ = (id) => document.getElementById(id);
let latestResult = null;
let currentView = "scanner";

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { ...(options.body ? {"Content-Type":"application/json"} : {}), ...(options.headers || {}) }
  });
  const type = response.headers.get("content-type") || "";
  const data = type.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}
function showError(message) { $("errorBox").textContent = message; $("errorBox").hidden = false; }
function clearError() { $("errorBox").hidden = true; $("errorBox").textContent = ""; }
function showView(view) {
  currentView = view;
  document.querySelectorAll(".view").forEach(el => el.hidden = el.id !== `view-${view}`);
  document.querySelectorAll(".nav").forEach(el => el.classList.toggle("active", el.dataset.view === view));
  $("pageTitle").textContent = ({scanner:"Website Header Scanner", history:"Scan History", about:"Methodology"})[view];
  if (view === "history") loadHistory();
}
document.querySelectorAll(".nav").forEach(btn => btn.addEventListener("click", () => showView(btn.dataset.view)));

async function checkHealth() {
  try { await api("/api/health"); $("apiStatus").textContent = "Online"; }
  catch { $("apiStatus").textContent = "Unavailable"; }
}
function renderResult(result) {
  latestResult = result;
  $("emptyState").hidden = true;
  $("results").hidden = false;
  $("resultUrl").textContent = result.url;
  $("scoreValue").textContent = result.score;
  $("gradeBadge").textContent = result.grade;
  $("scoreBar").style.width = `${result.score}%`;
  $("scoreCaption").textContent = `Grade ${result.grade} · presence-based score`;
  $("presentValue").textContent = result.summary.present;
  $("missingValue").textContent = result.summary.missing;
  $("httpValue").textContent = result.status_code;
  $("timeValue").textContent = new Date(result.created_at).toLocaleString();
  $("notesText").textContent = result.notes.join(" ");
  renderFindings();
}
function renderFindings() {
  if (!latestResult) return;
  const filter = $("filterSelect").value;
  const findings = latestResult.findings.filter(f => filter === "all" || (filter === "present" ? f.present : !f.present));
  const host = $("findingsList");
  host.innerHTML = "";
  if (!findings.length) { host.innerHTML = '<div class="no-records">No findings match this filter.</div>'; return; }
  findings.forEach((f, index) => {
    const card = document.createElement("article");
    card.className = "finding";
    const head = document.createElement("div"); head.className = "finding-head"; head.tabIndex = 0; head.setAttribute("role","button"); head.setAttribute("aria-expanded","false");
    const icon = document.createElement("span"); icon.className = `finding-icon ${f.present ? "good":"bad"}`; icon.textContent = f.present ? "✓" : "!";
    const copy = document.createElement("div"); copy.style.flex = "1";
    const name = document.createElement("div"); name.className = "finding-name"; name.textContent = f.header;
    const desc = document.createElement("div"); desc.className = "finding-desc"; desc.textContent = f.description;
    copy.append(name, desc);
    const meta = document.createElement("div"); meta.className = "finding-meta";
    const tag = document.createElement("span"); tag.className = `tag ${f.present ? "" : "missing"}`; tag.textContent = f.status;
    const chev = document.createElement("span"); chev.className = "chevron"; chev.textContent = "⌄";
    meta.append(tag, chev); head.append(icon, copy, meta);
    const detail = document.createElement("div"); detail.className = "finding-detail"; detail.hidden = true;
    const severity = document.createElement("div"); severity.textContent = `Severity: ${f.severity}`;
    const purpose = document.createElement("p"); purpose.textContent = f.description;
    const recTitle = document.createElement("b"); recTitle.textContent = "Recommended action";
    const rec = document.createElement("p"); rec.textContent = f.recommendation;
    detail.append(severity, purpose, recTitle, rec);
    if (f.present) { const valueTitle = document.createElement("b"); valueTitle.textContent = "Observed value"; const value = document.createElement("code"); value.textContent = f.value; detail.append(valueTitle, value); }
    const toggle = () => { detail.hidden = !detail.hidden; head.setAttribute("aria-expanded", String(!detail.hidden)); chev.textContent = detail.hidden ? "⌄" : "⌃"; };
    head.addEventListener("click", toggle); head.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
    card.append(head, detail); host.append(card);
  });
}
$("scanBtn").addEventListener("click", async () => {
  clearError();
  const url = $("targetUrl").value.trim();
  if (!url) { showError("Enter an HTTPS website URL first."); $("targetUrl").focus(); return; }
  const button = $("scanBtn"); button.disabled = true; button.textContent = "Scanning…";
  try {
    const result = await api("/api/scan", {method:"POST", body:JSON.stringify({url})});
    renderResult(result);
  } catch (error) { showError(error.message); }
  finally { button.disabled = false; button.textContent = "▶  Scan website"; }
});
$("targetUrl").addEventListener("keydown", e => { if (e.key === "Enter") $("scanBtn").click(); });
$("filterSelect").addEventListener("change", renderFindings);
$("exportJson").addEventListener("click", () => { if (latestResult?.id) window.location.href = `/api/export/${latestResult.id}.json`; });
$("exportCsv").addEventListener("click", () => { if (latestResult?.id) window.location.href = `/api/export/${latestResult.id}.csv`; });

async function loadHistory() {
  const host = $("historyList"); host.innerHTML = '<div class="no-records">Loading history…</div>';
  try {
    const records = await api("/api/history");
    host.innerHTML = "";
    if (!records.length) { host.innerHTML = '<div class="no-records">No scans saved yet. Run a scan first.</div>'; return; }
    records.forEach(record => {
      const item = document.createElement("article"); item.className = "history-item";
      const score = document.createElement("div"); score.className = "history-score"; score.textContent = record.score;
      const info = document.createElement("div"); info.className = "history-info";
      const url = document.createElement("div"); url.className = "history-url"; url.textContent = record.url;
      const time = document.createElement("div"); time.className = "history-time"; time.textContent = `${new Date(record.created_at).toLocaleString()} · Grade ${record.grade} · HTTP ${record.status_code}`;
      info.append(url,time);
      const actions = document.createElement("div"); actions.className = "history-actions";
      const view = document.createElement("button"); view.className = "secondary"; view.textContent = "View report";
      view.addEventListener("click", async () => { try { const result = await api(`/api/history/${record.id}`); renderResult(result); showView("scanner"); } catch(e) { alert(e.message); } });
      const json = document.createElement("button"); json.className = "secondary"; json.textContent = "JSON";
      json.addEventListener("click", () => window.location.href = `/api/export/${record.id}.json`);
      actions.append(view,json); item.append(score,info,actions); host.append(item);
    });
  } catch (error) { host.innerHTML = ""; showError(error.message); }
}
$("clearHistory").addEventListener("click", async () => {
  if (!confirm("Delete all saved scan history? This cannot be undone.")) return;
  try { await api("/api/history", {method:"DELETE"}); await loadHistory(); }
  catch (error) { alert(error.message); }
});
checkHealth();
