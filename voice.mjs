import { getClient, chat } from "../lib/sarvam.mjs";

// Voice agent: speech in -> Saaras (STT) -> Sarvam chat -> Bulbul (TTS) -> speech out.
const TTS_LANGS = new Set(["bn-IN","en-IN","gu-IN","hi-IN","kn-IN","ml-IN","mr-IN","od-IN","pa-IN","ta-IN","te-IN"]);

export async function voiceTurn({ audioBase64, mimeType, summary }) {
  const client = getClient();

  const stt = await client.speechToText.transcribe({
    file: { data: Buffer.from(audioBase64, "base64"), filename: "speech.webm", contentType: mimeType || "audio/webm" },
    model: "saaras:v3",
    mode: "transcribe",
  });
  const transcript = stt.transcript;
  const lang = TTS_LANGS.has(stt.language_code) ? stt.language_code : "en-IN";

  const system =
    "You are a friendly privacy assistant inside a data-removal app for Indian users. " +
    "Reply in the same language the user spoke, in 1-3 short sentences, plain spoken style, no markdown. " +
    "Never promise full erasure; we only request removal from public listings. " +
    `Current dashboard: ${summary}`;
  const reply = await chat(system, transcript);

  const tts = await client.textToSpeech.convert({
    text: reply.slice(0, 1500), language_code: lang, model: "bulbul:v3", speaker: "anushka",
  });
  return { transcript, reply, language: lang, audioBase64: tts.audios?.[0] ?? null };
}
