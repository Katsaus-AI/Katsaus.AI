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
