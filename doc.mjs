import { chat } from "../lib/sarvam.mjs";

// Doc agent: reads a broker's reply / notice and extracts what matters as JSON.
// (Text input for the demo. PDF digitization via Sarvam Document Intelligence
// is the natural next step.)
export async function readDocument(text) {
  const system =
    "You extract facts from emails or notices about personal-data removal requests. " +
    'Reply with ONLY compact JSON: {"site": string|null, "outcome": "removed"|"pending"|"failed"|"info_needed", ' +
    '"summary": string (one sentence), "action_for_user": string|null}.';
  const raw = await chat(system, text.slice(0, 6000));
  const json = raw.match(/\{[\s\S]*\}/)?.[0];
  try { return JSON.parse(json); }
  catch { return { site: null, outcome: "info_needed", summary: raw.slice(0, 200), action_for_user: null }; }
}
