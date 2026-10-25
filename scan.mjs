import { readFileSync } from "node:fs";

const registry = JSON.parse(readFileSync(new URL("../data/registry.json", import.meta.url)));

// DEMO scan: checks the user's phone against a mock registry of fictional sites.
// Deterministic, so the same phone always gives the same result. Swap this
// function for real checks (official opt-out APIs, manual lookups) later.
export function maskPhone(p) {
  const d = String(p).replace(/\D/g, "");
  return `+91 XXXXX XX${d.slice(-3)}`;
}

export function scan(user) {
  const seed = [...user.phone].reduce((a, c) => a + c.charCodeAt(0), 0);
  const found = registry.filter((_, i) => (seed + i * 7) % 3 !== 0);
  const hits = found.length >= 4 ? found : registry.slice(0, 5);
  return hits.map((r) => ({ ...r, status: "exposed", shown: maskPhone(user.phone) }));
}
