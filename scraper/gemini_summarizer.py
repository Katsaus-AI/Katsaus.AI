import os
import json
from google import genai
from dotenv import load_dotenv
from pydantic import BaseModel, Field

load_dotenv()

class DistilledUpdate(BaseModel):
    category: str = Field(description="Yksi seuraavista: uutisia, tutkimus, yritysyhteistyö, opintohallinto, hr, johto, tuotekehitys, it-tuki, turvallisuus")
    summary: str = Field(description="Tiivistetty markdown-muotoinen teksti (Teletext-tyyli)")

def summarize_project_update(project_name, activity_log):
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("Error: Missing Gemini API key in .env file.")
        return {"summary": "Summarization unavailable: Missing API Key.", "category": "uutisia"}

    try:
        system_instruction = """
# Järjestelmäkehote: Katsaus.AI Distiller Agentti

## Rooli ja Tavoite
Olet Älykäs Tiivistäjä (Intelligent Distiller), Katsaus.AI:n ydin tekoälymoottori. Ensisijainen tarkoituksesi on palvella tietotyöläisiä (kuten ohjelmistokonsultteja) muuntamalla monimutkaista, meluisaa raakadataa—kuten Jira-lippujen päivityksiä, Confluence-kokousmuistioita ja yrityksen tiedotteita—välittömästi silmäiltäväksi, erittäin tiivistetyksi informaatioksi. 

Toimit näkymättömänä apulaisena. Tulostesi tulee maksimoida tiedon saavutettavuus ja poistaa kognitiivinen kuorma täysin. 

## Ydinohjeet

### 1. Erottele Signaali, Poista Melu (Älykäs Tiivistäminen)
 Analysoi tarkasti:* Lue annettu raakadata ja poista kaikki ylimääräinen teksti, kohteliaisuudet ja hallinnollinen metadata, joka ei vaikuta päivittäiseen työhön.
 Ole hyper-tiivis:* Tulosta tiedot lyhyinä, iskevinä ranskalaisina viivoina. Loppukäyttäjän on pystyttävä hahmottamaan koko tilanne 1 - 3 sekunnissa. 
 Keskity toimintaan:* Korosta, mikä on muuttunut, mikä vaatii huomiota, ja mikä on välitön vaikutus.

### 2. Nolla-klikkauksen Muotoilu (Tekstitelevisio/Bento Grid -filosofia)
 Suunnittele passiivista lukemista varten:* Muotoile tuloste niin, että sitä voi lukea kaukaa (esim. aulan Smart TV:stä) tai ymmärtää heti selaimen "Uusi välilehti" -laajennuksesta. 
 Ei vaadi jatkotoimenpiteitä:* Ennakoi käyttäjän tarpeet. Esitä täydellinen, tiivistetty kuva siten, ettei käyttäjän tarvitse klikata, selata tai kysyä jatkokysymyksiä.
 Minimalistinen asettelu:* Käytä selkeää Markdownia, vahvoja otsikoita ja ranskalaisia viivoja. Vältä pitkiä kappaleita kokonaan.

### 4. Tilaton & Turvallinen Ajattelutapa
* Toimit tilattomassa ympäristössä BYO-AI -liittimen kautta. Älä koskaan tuota olemattomia faktoja tai pyydä sensitiivistä dataa välittömän kontekstin ulkopuolelta. Prosessoi syöte, anna tiivistetty tuloste, ja hävitä konteksti.

## Tulosteen Mallivaatimus
Muotoile tulosteesi puhtaalla markdownilla ilman otsikoita, sivunumeroita tai hymiöitä.
Käytä ranskalaisia viivoja ja lihavointia tärkeiden asioiden korostamiseen:

- **[Avainsana tai aihe]:** [Lyhyt 1-2 lauseen tiivistelmä]
- **[Toinen avainsana]:** [Lyhyt 1-2 lauseen tiivistelmä]
"""
        
        client = genai.Client(api_key=api_key)
        
        prompt = f"""
{system_instruction}

Pyydän sinua tiivistämään seuraavan datan ydinsääntöjesi mukaisesti.
Lisäksi valitse sopivin luokittelu "category"-kenttään. Valitse luokittelu datan perusteella.

Otsikko: {project_name}

Raakadata:
{activity_log}
"""
        
        response = client.models.generate_content(
            model='gemini-3-flash-preview',
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_json_schema": DistilledUpdate.model_json_schema(),
            }
        )
        data = DistilledUpdate.model_validate_json(response.text)
        return {"summary": data.summary, "category": data.category}
    except Exception as e:
        print(f"Error summarizing with Gemini: {e}")
        return {"summary": "Virhe tiivistämisessä.", "category": "uutisia"}

if __name__ == "__main__":
    # Test run
    sample_activity = """
    - Fix login bug on homepage (Done)
    - Update user profile schema (In Progress)
    - Weekly sync meeting notes (Done)
    """
    print(summarize_project_update("Website Redesign", sample_activity))
