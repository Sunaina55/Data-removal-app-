import express from "express";
import { hasKey } from "./lib/sarvam.mjs";
import { scan, maskPhone } from "./agents/scan.mjs";
import { draftRemoval } from "./agents/content.mjs";
import { createUser, getUser, createRequest, setStatus, dashboard } from "./agents/tracker.mjs";
import { voiceTurn } from "./agents/voice.mjs";
import { readDocument } from "./agents/doc.mjs";

const app = express();
app.use(express.json({ limit: "15mb" }));
app.use(express.static(new URL("./public", import.meta.url).pathname));

const wrap = (fn) => (req, res) => fn(req, res).catch((e) => {
  console.error(e.message);
  res.status(e.status || 500).json({ error: e.message });
});

app.get("/api/health", (_, res) => res.json({ ok: true, sarvamKeySet: hasKey() }));

// 1. Onboarding + explicit consent (DPDP Act)
app.post("/api/register", wrap(async (req, res) => {
  const { name, phone, email, consent } = req.body;
  if (!consent) return res.status(400).json({ error: "Consent is required to continue." });
  if (!name || !/^\+?\d[\d\s-]{8,}$/.test(phone || "")) return res.status(400).json({ error: "Enter a valid name and phone number." });
  const user = createUser({ name, phone, email: email || "", maskedPhone: maskPhone(phone) });
  res.json({ userId: user.id, maskedPhone: user.maskedPhone });
}));

// 2. Scan agent
app.post("/api/scan", wrap(async (req, res) => {
  const user = getUser(req.body.userId);
  user.listings = scan(user);
  res.json({ listings: user.listings.map(({ shown, ...l }) => ({ ...l, shown })) });
}));

// 3. Content agent drafts + tracker agent records, only for listings the user authorised
app.post("/api/requests", wrap(async (req, res) => {
  const { userId, listingIds = [], language = "English" } = req.body;
  const user = getUser(userId);
  const chosen = user.listings.filter((l) => listingIds.includes(l.id));
  if (!chosen.length) return res.status(400).json({ error: "Select at least one listing to authorise." });
  const out = [];
  for (const l of chosen) {
    if (user.requests.some((r) => r.listingId === l.id)) continue;
    const draft = await draftRemoval(user, l, language);
    out.push(createRequest(user, l, draft, language));
  }
  res.json({ created: out.length, drafts: out.map((r) => ({ site: r.site, method: r.method, optOut: r.optOut, emailDraft: r.emailDraft })) });
}));

// 4. Privacy dashboard
app.get("/api/dashboard/:userId", wrap(async (req, res) => res.json(dashboard(getUser(req.params.userId)))));

// 5. Voice agent
app.post("/api/voice", wrap(async (req, res) => {
  const user = getUser(req.body.userId);
  const d = dashboard(user);
  const summary = `${d.tracked} requests tracked, ${d.removed} removed, ${d.pending} pending.`;
  res.json(await voiceTurn({ audioBase64: req.body.audioBase64, mimeType: req.body.mimeType, summary }));
}));

// 6. Doc agent: read a broker's reply and update the tracker
app.post("/api/doc", wrap(async (req, res) => {
  const user = getUser(req.body.userId);
  if (!req.body.text?.trim()) return res.status(400).json({ error: "Paste the text of the notice or email." });
  const result = await readDocument(req.body.text);
  let updated = null;
  if (result.site && ["removed", "pending", "failed"].includes(result.outcome)) {
    updated = setStatus(user, result.site, result.outcome);
  }
  res.json({ result, trackerUpdated: Boolean(updated) });
}));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Data Removal app running at http://localhost:${port}`);
  if (!hasKey()) console.log("Note: SARVAM_API_KEY is empty. Scan and dashboard work; AI features need the key in .env.");
});
