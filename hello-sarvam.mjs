import { SarvamAIClient } from "sarvamai";

const apiKey = process.env.SARVAM_API_KEY;
if (!apiKey) {
  console.error("SARVAM_API_KEY is empty. Add your key to .env and run: npm start");
  process.exit(1);
}

const client = new SarvamAIClient({ apiSubscriptionKey: apiKey });

const response = await client.chat.completions({
  model: "sarvam-105b-conversations",
  messages: [{ role: "user", content: "Say hello in Hindi and English, in one short line." }],
});

console.log(response.choices[0].message.content);
