# Katsaus.AI

React (Vite) + Firebase.

## Rakenne

- **frontend/** – React-sovellus (Vite)
- **functions/** – Firebase Cloud Functions (Node.js / TypeScript)
- **scraper/** – Scraper (Python)

## Asennus ja käynnistys

### Linux / macOS

```bash
cd frontend
npm install
npm run dev
```

### Windows

**PowerShell tai CMD:**

```bash
cd frontend
npm install
npm run dev
```

**Git Bash:** jos `npm run dev` sammuu heti, käytä suoraan Viteä:

```bash
cd frontend
npm install
npx vite
```

### Build

```bash
cd frontend
npm run build
```

## Functions (Firebase)

```bash
cd functions
npm install
npm run build
npm test
```

Emulaattori: `npm run serve` (vaatii Firebase CLI + `firebase init`).

## Firebase / ympäristö

API-avaimia ei ole vielä konfiguroitu. Kun projekti on Firebase Consolessa: kopioidaan `frontend/.env.example` → `frontend/.env` ja täytetään arvot.

## Scraper

Make sure you create a .env file like the .env.example file. 

I'll move it to the scraper folder at some point, too lazy atm.

You can get atlassian api token from your atlassian account, here:

https://id.atlassian.com/manage-profile/security/api-tokens

You can get gemini api key from your google account, here:

https://makersuite.google.com/app/apikey

```bash
python scraper/main.py
```

If you don't want to use Gemini to summarize the text, use the `--no-gemini` flag: 

```bash
python scraper/main.py --no-gemini
```

This will fetch data from Atlassian, cache it in `atlassian_raw.json`, and then save the final processed results (including the Jira/Confluence updates) to `uutiset.json`.

Still working on the scraper, main problem at the moment are gemini credits. 

frontend/public/uutiset.json contains example data created with gemini 3.5 pro from the raw atlassian data. 

If you want to scrape atlassian again, delete the atlassian_raw.json file and run the scraper again.