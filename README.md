# Katsaus.AI

React (Vite) + Firebase.

## Rakenne

- **frontend/** – React-sovellus (Vite)
- **functions/** – Firebase Cloud Functions (Node.js / TypeScript)
- **scraper/** – Scraper (Python)

## Asennus ja käynnistys

### Linux / macOS

```bash
npm install
cp frontend/.env.example frontend/.env
```

Frontendin paikallinen kehitys:

```bash
npm run dev
```

Jos haluat asentaa kaiken yhdellä komennolla, käytä rootin `npm run setup`-skriptiä.

Jos haluat ajaa sekä frontendin että Firebase-emulaattorit, käytä kahta terminaalia:

```bash
npm run functions:serve
```

ja toisessa terminaalissa:

```bash
npm run dev
```

### Windows

**PowerShell tai CMD:**

```bash
npm install
copy frontend\.env.example frontend\.env
```

Frontendin paikallinen kehitys:

```bash
npm run dev
```

**Git Bash:** jos `npm run dev` sammuu heti, käytä suoraan Viteä:

```bash
npm install
npx vite
```

### Build

```bash
cd frontend
npm run build
```

Koko projektin build:

```bash
npm run build:all
```

## Firebase Hosting + Functions CI/CD

Production deploy tapahtuu GitHub Actionsilla `main`-branchista. Workflow buildaa frontendin ja Functionsin, ja deployaa ne Firebaseen.

### Paikallinen build

```bash
npm run build:all
```

### Paikallinen deploy

```bash
npm run deploy
```

Tämä komento olettaa, että Firebase CLI on asennettu ja että olet kirjautunut sisään omalla Firebase-projektillasi.

### GitHub Secrets

Workflow tarvitsee nämä secretit:

- `FIREBASE_PROJECT_ID` - Firebase-projektin ID
- `FIREBASE_SERVICE_ACCOUNT_JSON` - service accountin JSON-avain, jolla on deploy-oikeudet projektiin
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_DATABASE_URL`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Lisäksi suositellaan (Functionsin täysiin integraatioihin):

- `ATLASSIAN_URL`
- `ATLASSIAN_USERNAME`
- `ATLASSIAN_API_TOKEN`
- `GEMINI_API_KEY`
- `GEMINI_MODEL` (esim. `gemini-2.0-flash`)
- `COPILOT_STUDIO_AGENT_URL`
- `COPILOT_STUDIO_API_KEY`
- `COPILOT_STUDIO_TIMEOUT_MS`

### CI-triggeri

- Push `main`-branchiin
- Manuaalinen ajo GitHub Actionsista

## Functions (Firebase)

```bash
cd functions
npm install
npm run build
npm test
```

Emulaattori (repojuuresta): `npm run functions:serve`.

Vaihtoehtoisesti `functions`-kansiosta:

```bash
cd functions
npm run serve
```

Komento käynnistää Functions-, Firestore- ja Auth-emulaattorit (vaatii Firebase CLI:n + `firebase init`).

Functions hoitaa nyt JYU-uutisten lisäksi myös Atlassian-uutisvirran sekä ulkoiset RSS-syötteet (YLE, BBC World News) ja yliopistokohtaiset lähteet (Aalto, Helsingin yliopisto, Tampereen yliopisto, Turun yliopisto, Oulun yliopisto, Itä-Suomen yliopisto, LUT-yliopisto, Åbo Akademi, Hanken, Lapin yliopisto, Vaasan yliopisto, Taideyliopisto).

Haetut tekstit tiivistetään ja luokitellaan valmiiksi määritettyihin kategorioihin ennen tallennusta Firestoreen (`uutiset` + `users/{uid}/news`).

### Testiorganisaatiot ja testikäyttäjät lokaalisti

Kun emulaattori on käynnissä, seedaa testidata:

```bash
curl -X POST "http://127.0.0.1:5001/demo-no-project/us-central1/seedTestTenants"
```

Tämä luo testiorganisaatiot (`organizations/org-alpha`, `organizations/org-beta`, `organizations/org-gamma`, `organizations/org-delta`) ja testikäyttäjät:

- `alpha.admin@example.com` / `Testi123!` (admin)
- `alpha.viewer@example.com` / `Testi123!` (ei admin)
- `beta.admin@example.com` / `Testi123!` (admin)
- `beta.viewer@example.com` / `Testi123!` (ei admin)
- `gamma.admin@example.com` / `Testi123!` (admin)
- `gamma.viewer@example.com` / `Testi123!` (ei admin)
- `delta.admin@example.com` / `Testi123!` (admin)
- `delta.viewer@example.com` / `Testi123!` (ei admin)

### Testitunnukset (myös omaan Firebase-testiprojektiin)

Jos ajat samat testitunnukset omaan Firebase-testiprojektiin, käytä näitä oletuksia:

- Organisaatio `org-alpha`
  - `alpha.admin@example.com` / `Testi123!`
  - `alpha.viewer@example.com` / `Testi123!`
- Organisaatio `org-beta`
  - `beta.admin@example.com` / `Testi123!`
  - `beta.viewer@example.com` / `Testi123!`
- Organisaatio `org-gamma`
  - `gamma.admin@example.com` / `Testi123!`
  - `gamma.viewer@example.com` / `Testi123!`
- Organisaatio `org-delta`
  - `delta.admin@example.com` / `Testi123!`
  - `delta.viewer@example.com` / `Testi123!`

Suositus: käytä näitä vain testauksessa ja vaihda salasanat ennen tuotantokäyttöä.

## Firebase / ympäristö

Frontend käyttää Firebasen client SDK:ta suoraan Firestoreen. Kun projekti on Firebase Consolessa: kopioi `frontend/.env.example` → `frontend/.env` ja täytä arvot.

### Missä agentin avaimet säilytetään

Copilot Studio / agentti-integraation avaimet pidetään palvelinpuolella, ei frontendissä.

1. Kopioi malli: `functions/.env.example` → `functions/.env.local`
2. Täytä vähintään:
	- `COPILOT_STUDIO_AGENT_URL`
	- `COPILOT_STUDIO_API_KEY`
3. Käynnistä emulaattorit uudelleen: `npm run functions:serve`

Huom: `functions/.env.local` on nyt gitignoressa, joten salaisuudet eivät päädy Git-repoon.

Repojuuressa on nyt myös [firebase.json](firebase.json), joka ohjaa Hostingin `frontend/dist`-hakemistoon ja Functionsin `functions`-kansioon.

Uutiset tallennetaan Firestoreen kokoelmaan `uutiset`. Kirjautunut käyttäjä saa ensin oman syötteensä polusta `users/{uid}/news`, sen jälkeen yhteisen `uutiset`-kokoelman, ja vasta sitten `/api/uutiset`-reitin sekä paikallisen `uutiset.json`-varasijan.

Kirjautuminen on tällä hetkellä sähköposti + salasana. Käyttäjän profiili tallennetaan polkuun `users/{uid}`, ja siellä säilytetään ainakin organisaatiokoodi sekä halutut scraperit.

Vain `isAdmin: true` käyttäjät voivat hallita sisältöä (admin-tila, muokkaus, poisto, pääaiheiden vaihto).

Kirjautuminen näytetään erillisellä auth-sivulla ennen varsinaista uutisnäkymää. Organisaatiokoodi valitaan rekisteröinnissä tai myöhemmin käyttäjäasetuksissa, ei sisäänkirjautumisessa.

Kirjautuneena käyttäjä voi vaihtaa näkyvät scraperit Headerin `Asetukset`-napista. Tallennus päivittää käyttäjän `desiredScrapers`-asetuksen ja synkkaa käyttäjäkohtaisen uutisnäkymän.

## Scraper

The scraper is still available for generating `uutiset.json` from Atlassian data.

Create a `.env` file based on `.env.example` before running it.

You can get an Atlassian API token from your Atlassian account here:

https://id.atlassian.com/manage-profile/security/api-tokens

You can get a Gemini API key from your Google account here:

https://makersuite.google.com/app/apikey

```bash
python scraper/main.py
```

If you don't want to use Gemini to summarize the text, use the `--no-gemini` flag:

```bash
python scraper/main.py --no-gemini
```

This fetches data from Atlassian, caches it in `atlassian_raw.json`, and saves the final processed results to `uutiset.json`.

The scraper is still under active development.

frontend/public/uutiset.json contains example data created with Gemini 3.5 Pro from the raw Atlassian data.

If you want to scrape Atlassian again, delete the atlassian_raw.json file and run the scraper again.