# Data Removal India — Sarvam AI

A Node.js web app that helps people find where their phone number is publicly listed and request its removal, with their consent under India's DPDP Act 2023. It uses Sarvam AI for writing removal requests, an Indian-language voice assistant, and reading website replies. Status is tracked on a simple privacy dashboard.

## Important limitations

- The scan does *not* search the real internet. It checks the user's number against a demo registry of 8 fictional sites in `data/registry.json`.
- The app drafts removal emails but does *not* send them. Review each draft and send it from your own email client.
- In demo mode, pending requests turn to "removed" after a few seconds to show the full flow. This is simulated, not a real response from any website. Real sites usually take 7–14 days.
- Data is kept in memory only and is lost when the server restarts.
- The app can only request removal from public listings. Banks, telecom operators, government and offline records are out of scope.
- It does not make legal determinations. Review all drafts and verify applicable law and company procedures.
- Sarvam API calls may use credits. Keep your key private and never commit `.env` to GitHub.

## What it does

1. **Consent and account:** name, phone, email, and an explicit consent tick.
2. **Scan:** finds exposed demo listings. The phone number is shown masked, like `+91 XXXXX XX123`.
3. **Authorise:** the user selects listings and a language for the requests.
4. **Draft:** AI writes a removal email per listing, citing the DPDP Act.
5. **Dashboard:** tracked, removed, pending and failed counts with a progress bar.
6. **Voice assistant:** speak in an Indian language and hear the reply back.
7. **Document reader:** paste a website's email or SMS and the app updates your tracker.

## Project structure

```
data-removal-app/
├── package.json
├── server.mjs            # Express server and API routes
├── hello-sarvam.mjs      # one test call to Sarvam
├── .env                  # your key (never share)
├── .gitignore
├── lib/sarvam.mjs        # Sarvam client and chat helper
├── agents/
│   ├── scan.mjs          # demo scan
│   ├── content.mjs       # removal email drafting
│   ├── tracker.mjs       # request status
│   ├── voice.mjs         # speech in, speech out
│   └── doc.mjs           # reads pasted notices
├── data/registry.json    # fictional demo sites
└── public/               # web interface (index.html, style.css, app.js)
```

## Sarvam APIs used

| API | Model | Used for |
|---|---|---|
| Chat Completions | `sarvam-105b-conversations` | Removal emails, assistant replies, reading notices |
| Speech to Text | `saaras:v3` | Understanding the user's voice |
| Text to Speech | `bulbul:v3` | Speaking replies back |

## 1. Open in VS Code

Put all files in one folder with the structure above and open it with *File → Open Folder*. Then open *Terminal → New Terminal*.

## 2. Install Node.js

Install the LTS version from nodejs.org (version 20 or newer). Check it with:

```bash
node -v
```

## 3. Configure your API key

Open `.env` and add your key from the Sarvam dashboard, with no quotes or spaces:

```
SARVAM_API_KEY=your_key_here
```

The app loads `.env` automatically. If you change the key, stop the server and start it again.

## 4. Install and run

Run these one at a time:

```bash
npm install
npm run hello
npm start
```

- `npm run hello` makes one test call to Sarvam and prints a reply. It confirms your key works.
- `npm start` starts the app.

Then open **http://localhost:3000** in your browser.

Do *not* use VS Code's "Go Live" button. The app needs its own Node server, and Live Server causes a "405" error.

## 5. Try the demo

1. Enter any name and a 10-digit phone number, tick consent, and click Create Account.
2. Wait for the scan, select listings, and click Authorise Removal.
3. Watch the dashboard update. Open a drafted request to read the email.
4. Hold the microphone button and speak (needs your key and browser microphone permission).
5. Paste a sample reply, for example "We have removed your number from QuickLookup Demo", into the document reader.

## Troubleshooting

- **Request failed (405):** you opened the page through Live Server. Use http://localhost:3000.
- **SARVAM_API_KEY is empty:** check `.env` is named exactly `.env` (not `.env.txt`), the key is saved, and the server was restarted.
- **Cannot find module:** a file is in the wrong folder. Compare with the structure above.
- **EADDRINUSE:** port 3000 is busy. Close other terminals running the app.
- **npm is not recognized:** Node.js is not installed, or the terminal needs reopening.
- **Voice agent error:** allow microphone access in the browser. If Sarvam rejects the audio format, note the error message.
- **Authentication or 403 errors:** check the key was copied without extra spaces and is a valid Model API key.
- **429 errors:** check credits and rate limits on your Sarvam account.
- Run `npm install` and `npm start` as separate commands. Typing `npm install npm start` installs wrong packages.

## Next steps

- Real opt-out integrations and email sending
- PDF reading with Sarvam Document Intelligence
- A database, OTP login and monthly re-scans

## Official references

- Sarvam docs: https://docs.sarvam.ai/api/getting-started/welcome
- Quickstart: https://docs.sarvam.ai/api/getting-started/quickstart
- SDKs: https://docs.sarvam.ai/api/getting-started/sdks
