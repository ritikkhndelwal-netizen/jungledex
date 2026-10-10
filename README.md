# JungleDex 🌿

**Turn real-world nature discoveries into collectible cards.** JungleDex is a mobile-first hackathon MVP that helps people go outside, photograph something interesting, learn about it with an open-weight AI model, and keep/share a themed discovery card.

## What's included

- React + Vite + TypeScript frontend
- Node.js + Express API
- Configurable Google Generative Language API model adapter (intended for a hosted Gemma vision model; verify model availability and image-input support for your account)
- Optional browser GPS and Open-Meteo current weather
- Three visual themes: Nature Explorer, Enchanted Explorer, Cosmic Field Lab
- Local collection storage and PNG card export
- Safety-oriented prompt that avoids unsupported rarity claims and encourages respectful wildlife observation

## Requirements

- Node.js 20+
- A Google AI API key with access to the configured model for image input

## Run locally

```bash
npm install
cp server/.env.example server/.env
# Edit server/.env and add your API key
npm run dev
```

On Windows PowerShell, copy the example file with:

```powershell
Copy-Item server/.env.example server/.env
```

Frontend: `http://localhost:5173`  
API health: `http://localhost:8787/api/health`

Without `GOOGLE_API_KEY`, the app still loads and the UI can be previewed, but image identification returns a helpful configuration error.

## Environment variables

| Variable | Purpose |
|---|---|
| `PORT` | API port (Render supplies this automatically) |
| `CLIENT_ORIGIN` | Allowed frontend origin; comma-separated origins are supported |
| `GOOGLE_API_KEY` | Secret API key, server-side only |
| `GOOGLE_MODEL` | Model ID; default `gemma-3-4b-it`, confirm access and image support before use |
| `VITE_API_URL` | Frontend API base URL; default `http://localhost:8787` |

## Render deployment

Create two services from this repository:

### 1. Static site (frontend)
- Root directory: `client`
- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Environment variable: `VITE_API_URL=https://YOUR-API-SERVICE.onrender.com`

### 2. Web service (API)
- Root directory: `server`
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Environment variables: `GOOGLE_API_KEY`, `GOOGLE_MODEL`, `CLIENT_ORIGIN=https://YOUR-FRONTEND.onrender.com`

For a monorepo, Render's root-directory/workspace behavior can vary by service configuration. If workspace installation cannot resolve packages from the repository root, set the service root to the repository root and use `npm install` / `npm run build -w client` for the static site, and `npm install` / `npm run build -w server` plus `npm run start -w server` for the API. Update the API start script to run the compiled `server/dist/index.js` from the root if deploying with root context.

## Open AI and responsible use

The intended AI path is a hosted **open-weight Gemma model**, subject to confirming that the exact model is available through the chosen endpoint and accepts image inputs. Do not silently substitute a proprietary Gemini model if the submission claims Gemma. Document the exact model ID, terms, and provider used in the final submission. If hosted Gemma is unavailable, evaluate an inference provider that explicitly supports the selected open-weight vision model.

AI outputs are suggestions, not verified scientific identifications. The current MVP does not independently validate species, habitat, conservation status, or ecological rarity. GPS is optional. Exact coordinates can be sensitive; users should choose whether to share location details. The local collection is stored in browser storage and may be lost if browser data is cleared.

## Planned next steps

1. Verify hosted Gemma vision access and test representative plant, bird, and insect images.
2. Add server-side rate limiting, image content validation, and production logging.
3. Add actual nearby nature locations and species observations using appropriately licensed data sources.
4. Add optional coarse location display and strip EXIF metadata from exported images.
5. Improve offline collection access and build an outdoor demo for the DEV challenge.
