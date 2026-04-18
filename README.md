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

## Firebase Hosting CI/CD (staattinen uutis-JSON)

Production deploy tapahtuu GitHub Actionsilla `main`-branchista. Workflow generoi `uutiset.json`-datan scraperilla, buildaa frontendin ja deployaa vain Hostingin Firebaseen.

### Paikallinen build

```bash
npm run build:all
```

Staattisen uutis-JSON:n generointi ja synkkaus frontendiin:

```bash
npm run news:deps
npm run news:prepare
```

Ennen tuotantodeployta varmista, että `frontend/.env` sisältää oikean Firebase Web App -konfiguraation (ei demo-arvoja) ja että:

```env
VITE_USE_FIREBASE_EMULATORS=false
```

Voit tarkistaa tämän erikseen:

```bash
npm run deploy:check
```

Nopeampi versio ilman Gemini-tiivistystä:

```bash
npm run news:prepare:fast
```

### Paikallinen deploy

```bash
npm run deploy
```

Tämä komento ajaa staattisen putken: scraper -> `frontend/public/uutiset.json` -> frontend build -> Firebase Hosting deploy.

Jos haluat edelleen yrittää Functions + Hosting deployta (vaatii Blaze-planin):

```bash
npm run deploy:full
```

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

Lisäksi suositellaan (scraperin täysiin integraatioihin):

- `ATLASSIAN_URL`
- `ATLASSIAN_USERNAME`
- `ATLASSIAN_API_TOKEN`
- `GEMINI_API_KEY`
- `GEMINI_MODEL` (esim. `gemini-2.0-flash`)

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

Functions-osuutta käytetään tässä setupissa ensisijaisesti emulaattoreihin ja kehitystestaamiseen.

## Firebase / ympäristö

Frontend käyttää Firebasen client SDK:ta suoraan Firestoreen. Kun projekti on Firebase Consolessa: kopioi `frontend/.env.example` → `frontend/.env` ja täytä arvot.

Jos kirjautuminen antaa virheen `auth/configuration-not-found`, mene Firebase Consolessa kohtaan Authentication -> Sign-in method ja ota käyttöön ainakin `Email/Password`. Tarkista samalla, että `frontend/.env` käyttää saman projektin oikeita arvoja.

### Missä agentin avaimet säilytetään

Copilot Studio / agentti-integraation avaimet pidetään palvelinpuolella, ei frontendissä.

1. Kopioi malli: `functions/.env.example` → `functions/.env.local`
2. Täytä vähintään:
	- `COPILOT_STUDIO_AGENT_URL`
	- `COPILOT_STUDIO_API_KEY`
3. Käynnistä emulaattorit uudelleen: `npm run functions:serve`

Huom: `functions/.env.local` on nyt gitignoressa, joten salaisuudet eivät päädy Git-repoon.

Repojuuressa on nyt myös [firebase.json](firebase.json), joka ohjaa Hostingin `frontend/dist`-hakemistoon (sekä sisältää Functionsin konfiguraation kehitystä varten).

Uutisten yhteinen lähde julkaistaan tiedostona `frontend/public/uutiset.json`, josta se päätyy Hostingiin polkuun `/uutiset.json`.

Sovellus lukee uutiset ensisijaisesti tästä yhteisestä `/uutiset.json`-tiedostosta kaikille käyttäjille. Firestore ja `/api/uutiset` jäävät varareiteiksi, jos niitä käytetään erikseen.

Kirjautuminen on sähköposti + salasana. Käyttäjät rekisteröityvät itse, eikä sovelluksessa käytetä kiinteitä testitunnuksia oletuksena.

Käyttäjän profiili tallennetaan polkuun `users/{uid}`, ja siellä säilytetään ainakin organisaatiokoodi sekä halutut scraperit.

Kaikilla kirjautuneilla käyttäjillä on oikeus hallita sisältöä (admin-tila, muokkaus, poisto, pääaiheiden vaihto).

Kirjautuminen näytetään erillisellä auth-sivulla ennen varsinaista uutisnäkymää. Organisaatiokoodi valitaan rekisteröinnissä tai myöhemmin käyttäjäasetuksissa, ei sisäänkirjautumisessa.

Kirjautuneena käyttäjä voi vaihtaa näkyvät scraperit Headerin `Asetukset`-napista. Tallennus päivittää käyttäjän `desiredScrapers`-asetuksen. Jos scraperia ei ole valittu, sen kategoria ja uutiset piilotetaan näkymästä.

## Scraper

Scraper on ensisijainen uutisputki ja generoi yhteisen `uutiset.json`-tiedoston.

Se kerää dataa lähteistä:

- JYU uutiset
- Atlassian (Jira + Confluence)
- ulkoiset RSS-syötteet (YLE, BBC ja yliopistokohtaiset lähteet)

Atlassian-lähteistä tulevat jutut julkaistaan omalla `atlassian`-kategoriallaan, joten ne näkyvät vain silloin kun käyttäjä on valinnut kyseisen scraperin asetuksista.

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

Tämä hakee datan kaikista konfiguroiduista lähteistä, käyttää Atlassian-cachelle tiedostoa `atlassian_raw.json` ja tallentaa lopputuloksen tiedostoon `uutiset.json`.

The scraper is still under active development.

`frontend/public/uutiset.json` sisältää julkaistavan uutisdatan, jota frontend näyttää kaikille käyttäjille.

Jos haluat hakea Atlassian-datan varmasti uudelleen API:sta, poista `atlassian_raw.json` ja aja scraper uudelleen.