const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = (n) => String(n).padStart(2, "0");
let userId = null, listings = [], pollTimer = null;

async function api(path, body) {
  const res = await fetch(path, body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : undefined);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
const show = (id) => { ["s1", "s2", "s3", "s4"].forEach((s) => $(s).classList.toggle("hidden", s !== id)); window.scrollTo(0, 0); };
const busy = (btn, on, label) => { btn.disabled = on; if (label) btn.textContent = label; };

api("/api/health").then((h) => { $("keyState").textContent = h.sarvamKeySet ? "SARVAM KEY: SET" : "SARVAM KEY: MISSING"; }).catch(() => {});

// Step 1: consent + account, then step 2: animated scan
$("btnRegister").onclick = async () => {
  $("e1").textContent = "";
  const btn = $("btnRegister"); busy(btn, true);
  try {
    const r = await api("/api/register", { name: $("name").value.trim(), phone: $("phone").value.trim(), email: $("email").value.trim(), consent: $("consent").checked });
    userId = r.userId;
    show("s2");
    await runScan();
  } catch (e) { $("e1").textContent = e.message; show("s1"); }
  busy(btn, false);
};

async function runScan() {
  const tiles = Array.from({ length: 6 }, (_, i) => `<div class="tile" id="t${i}">PUBLIC LISTING ${pad(i + 1)}</div>`).join("");
  $("scanGrid").innerHTML = tiles;
  const data = api("/api/scan", { userId });
  for (let i = 0; i < 6; i++) {
    $("t" + i).classList.add("active");
    $("scanFoot").innerHTML = `<span>SEARCHING FOR YOUR PHONE NUMBER</span><span>${pad(i + 1)} / 06</span>`;
    await new Promise((r) => setTimeout(r, 450));
  }
  listings = (await data).listings;
  $("found").innerHTML = listings.map((l) => `
    <label class="item" style="letter-spacing:0;color:inherit">
      <input type="checkbox" value="${esc(l.id)}" checked>
      <div><b>${esc(l.site)}</b><small>${esc(l.category)} · ${esc(l.shown)}</small><small>Removal via ${esc(l.method)} · ~${esc(l.eta)}</small></div>
      <span class="warn">⚠</span>
    </label>`).join("");
  show("s3");
}

// Step 3: authorise -> content agent drafts -> dashboard
$("btnAuthorise").onclick = async () => {
  $("e3").textContent = "";
  const ids = [...document.querySelectorAll("#found input:checked")].map((i) => i.value);
  const btn = $("btnAuthorise"); busy(btn, true, "DRAFTING REQUESTS…");
  try {
    const r = await api("/api/requests", { userId, listingIds: ids, language: $("lang").value });
    $("drafts").innerHTML = r.drafts.map((d) => `<details><summary>${esc(d.site)} · ${esc(d.method === "email" ? "email to " + d.optOut : "form: " + d.optOut)}</summary><pre>${esc(d.emailDraft)}</pre></details>`).join("");
    show("s4");
    await refresh();
    clearInterval(pollTimer);
    pollTimer = setInterval(refresh, 3000);
  } catch (e) { $("e3").textContent = e.message; }
  busy(btn, false, "AUTHORISE REMOVAL");
};

async function refresh() {
  const d = await api("/api/dashboard/" + userId);
  $("nTracked").textContent = pad(d.tracked); $("nRemoved").textContent = pad(d.removed);
  $("nPending").textContent = pad(d.pending); $("nFailed").textContent = pad(d.failed);
  const t = d.tracked || 1;
  $("barRemoved").style.width = (d.removed / t) * 100 + "%";
  $("barPending").style.width = (d.pending / t) * 100 + "%";
  $("reqList").innerHTML = d.requests.map((r) => `<div class="row"><span>${esc(r.site)}</span><span class="pill ${esc(r.status)}">${esc(r.status.toUpperCase())}</span></div>`).join("");
}

// Voice agent: hold the button, speak, release
let rec, chunks = [];
const mic = $("btnMic");
async function startRec() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    rec = new MediaRecorder(stream); chunks = [];
    rec.ondataavailable = (e) => chunks.push(e.data);
    rec.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunks, { type: rec.mimeType });
      const b64 = await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result.split(",")[1]); fr.readAsDataURL(blob); });
      mic.textContent = "THINKING…";
      try {
        const r = await api("/api/voice", { userId, audioBase64: b64, mimeType: blob.type.split(";")[0] });
        $("voiceOut").classList.remove("hidden");
        $("voiceOut").textContent = `You: ${r.transcript}\n\nAssistant: ${r.reply}`;
        if (r.audioBase64) { $("player").src = "data:audio/wav;base64," + r.audioBase64; $("player").classList.remove("hidden"); $("player").play().catch(() => {}); }
      } catch (e) { $("e4").textContent = e.message; }
      mic.textContent = "🎙 HOLD TO SPEAK";
    };
    rec.start(); mic.textContent = "● LISTENING… RELEASE TO SEND";
  } catch { $("e4").textContent = "Microphone access was blocked. Allow it in your browser and try again."; }
}
const stopRec = () => { if (rec && rec.state === "recording") rec.stop(); };
mic.onpointerdown = startRec; mic.onpointerup = stopRec; mic.onpointerleave = stopRec;

// Doc agent
$("btnDoc").onclick = async () => {
  $("e4").textContent = "";
  const btn = $("btnDoc"); busy(btn, true, "READING…");
  try {
    const r = await api("/api/doc", { userId, text: $("docText").value });
    $("docOut").classList.remove("hidden");
    $("docOut").textContent = JSON.stringify(r.result, null, 2) + (r.trackerUpdated ? "\n\n✓ Tracker updated" : "");
    await refresh();
  } catch (e) { $("e4").textContent = e.message; }
  busy(btn, false, "READ DOCUMENT");
};
