# Data Removal · India (Sarvam AI hackathon project)

Find where your phone number is publicly listed, and request removal with your consent.

## Run it
1. Install Node.js 20+ (nodejs.org, LTS).
2. Put your key in `.env`:  `SARVAM_API_KEY=your_key_here`  (no quotes or spaces)
3. In this folder:
```
npm install
npm run hello     # optional: one test call to Sarvam
npm start         # starts the app
```
4. Open http://localhost:3000

## How it works (agents)
| Agent | File | Sarvam API |
|---|---|---|
| Scan | agents/scan.mjs | none (demo registry of fictional sites) |
| Content | agents/content.mjs | Chat (sarvam-105b-conversations) |
| Tracker | agents/tracker.mjs | none |
| Voice | agents/voice.mjs | Saaras STT, Chat, Bulbul TTS |
| Doc | agents/doc.mjs | Chat |

Flow: consent → scan → authorise listings → drafted removal requests → dashboard.

## Honest limits
- Scan uses a mock registry of fictional sites. No real scraping.
- Removal requests are drafted, not actually sent. The tracker flips pending → removed after a few seconds in demo mode.
- Data lives in memory and is lost on restart.
- Cannot remove data from banks, telcos, government or offline records.

## Next steps
Real opt-out email sending, PDF digitization with Sarvam Document Intelligence, database, OTP login, monthly re-scans.
