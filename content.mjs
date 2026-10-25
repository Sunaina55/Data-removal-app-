import { chat } from "../lib/sarvam.mjs";

// Content agent: writes a removal request under India's DPDP Act 2023.
export async function draftRemoval(user, listing, language = "English") {
  const system =
    "You write short, polite, legally-grounded data erasure requests for Indian users. " +
    "Cite the Digital Personal Data Protection Act, 2023 (right to erasure and withdrawal of consent). " +
    "Output only the email: a Subject line, then the body. No commentary. Under 150 words.";
  const prompt =
    `Write the email in ${language}.\n` +
    `Sender name: ${user.name}\nSender email: ${user.email}\n` +
    `Phone number to remove (masked in this prompt): ${user.maskedPhone}\n` +
    `Website: ${listing.site} (${listing.category})\n` +
    `Ask them to delete the listing, confirm in writing, and not re-list the data.`;
  return chat(system, prompt);
}
