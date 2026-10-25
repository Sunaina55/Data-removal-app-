import { SarvamAIClient } from "sarvamai";

export const hasKey = () => Boolean(process.env.SARVAM_API_KEY);

let client;
export function getClient() {
  if (!hasKey()) {
    const e = new Error("SARVAM_API_KEY is empty. Add your key to .env and restart the server.");
    e.status = 400;
    throw e;
  }
  client ??= new SarvamAIClient({ apiSubscriptionKey: process.env.SARVAM_API_KEY });
  return client;
}

// One helper every agent uses for text generation.
export async function chat(system, user, { model = "sarvam-105b-conversations" } = {}) {
  const res = await getClient().chat.completions({
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  return res.choices[0].message.content;
}
