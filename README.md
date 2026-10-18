# <p align="center"><img src="frontend/public/logo-transparent.png" alt="Athlos Logo" width="220" /></p>

<h1 align="center">Athlos</h1>

<p align="center">
  <strong>Piattaforma Intelligente per l'Orientamento, la Valutazione e la Crescita nello Sport Giovanile</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Python_3.14+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Google_Gemini-8E75C2?style=for-the-badge&logo=googlebard&logoColor=white" alt="Google Gemini" />
  <img src="https://img.shields.io/badge/Resend-000000?style=for-the-badge&logo=resend&logoColor=white" alt="Resend" />
</p>

---

## 📌 Indice dei Contenuti

1. [La Visione di Athlos](#-la-visione-di-athlos)
2. [Cosa Risolve Athlos](#-cosa-risolve-athlos)
3. [Funzionalità Principali](#-funzionalità-principali)
   - [🏢 Per i Centri Sportivi (Club & Coach)](#-per-i-centri-sportivi-club--coach)
   - [👨‍👩‍👧‍👦 Per le Famiglie (Portale Genitori)](#-per-le-famiglie-portale-genitori)
   - [🤖 Motore di Orientamento AI](#-motore-di-orientamento-ai)
   - [📍 Geocoding & Discovery Territoriale](#-geocoding--discovery-territoriale)
4. [Architettura & Stack Tecnologico](#-architettura--stack-tecnologico)
5. [Struttura del Repository](#-struttura-del-repository)
6. [Guida all'Installazione & Avvio Rapido](#-guida-allinstallazione--avvio-rapido)
   - [Prerequisiti](#prerequisiti)
   - [Configurazione Variabili d'Ambiente (`.env`)](#configurazione-variabili-dambiente-env)
   - [Avvio Backend (FastAPI)](#avvio-backend-fastapi)
   - [Avvio Frontend (React / Vite)](#avvio-frontend-react--vite)
7. [API & Endpoints Principali](#-api--endpoints-principali)
8. [Roadmap Futura](#-roadmap-futura)

---

## 🌟 La Visione di Athlos

> *Ogni bambino possiede un talento naturale unico. Athlos lo scopre, lo valorizza e lo guida verso la disciplina sportiva ideale.*

Nell'ambito dello sport giovanile, la scelta della disciplina sportiva è troppo spesso condizionata dal caso, dalle mode temporanee o dalle pressioni esterne, portando ad alti tassi di abbandono precoce (**drop-out sportivo**) e frustrazione.

**Athlos** nasce per colmare il divario tra **istruttori, centri sportivi e famiglie**, trasformando la valutazione periodica delle abilità in un percorso scientifico, pedagogico ed entusiasmante. Unendo il parere umano dei coach sul campo con l'analisi avanzata dell'Intelligenza Artificiale, Athlos fornisce report di crescita costruttivi e suggerisce con accuratezza lo sport più affine alle attitudini motorie e caratteriali di ciascun ragazzo, ancorato alla reale offerta sportiva presente sul territorio.

---

## 🎯 Cosa Risolve Athlos

```
                                  IL CIRCUITO VIRTUOSO DI ATHLOS
       
    [ Istruttore / Coach ]                [ Famiglia / Genitore ]
       │                                     ▲
       │ Valutazione trimestrale             │ Report via email & portale
       │ (Abilità motorie, test, note)       │ "Club vicino a te" per nuovi corsi
       ▼                                     │
   ┌───────────────────────────────────────────────┐
   │             CORE ENGINE DI ATHLOS             │
   │  - Scheda Multi-Dimensionale di Valutazione   │
   │  - AI Sport Orientation (Google Gemini)       │
   │  - Matching Territoriale (OpenStreetMap/Geo)  │
   │  - Consegna Digitale Report (Resend Email)    │
   └───────────────────────────────────────────────┘
```

1. **Valutazione Oggettiva e Olistica**: Supera i giudizi frammentari fornendo metriche motorie (coordinazione, equilibrio, velocità, forza), attitudinali (spirito di squadra, resilienza, disciplina) e test fisici sul campo (salto in lungo da fermo, sprint 20m, sit & reach).
2. **Orientamento Pedagogico, non Medico**: L'IA non formula diagnosi o sentenze cliniche, ma offre una panoramica calda, incoraggiante e discorsiva che evidenzia i punti di forza e consiglia la disciplina sportiva più indicata.
3. **Radicamento Territoriale Reale**: I suggerimenti dell'IA non sono generici: l'algoritmo propone esclusivamente discipline effettivamente attive presso il centro sportivo o nei club limitrofi, facilitando l'iscrizione immediata della famiglia.
4. **Comunicazione Trasparente Scuola-Famiglia**: Invio automatico di una **Scorecard Digitale** trimestrale via email con design moderno ed elegante, comprensibile e motivante per genitori e ragazzi.

---

## 🚀 Funzionalità Principali

### 🏢 Per i Centri Sportivi (Club & Coach)
- **Gestione Anagrafica & Corsi**: Creazione e gestione dei corsi attivi (Calcio, Basket, Atletica, Nuoto, Tennis, Ginnastica, Arti Marziali, ecc.) con istruttore e orari associati.
- **Registro Atleti & Ricerca Veloce**: Monitoraggio atleti iscritti, matricola e ricerca istantanea tramite Codice Fiscale.
- **Scheda Valutazione Trimestrale Multi-Parametrica**:
  - **Competenze Motorie di Base**: Coordinazione oculo-manuale/podalica, equilibrio dinamico/statico, velocità di reazione/agilità, forza ed esplosività, resistenza organica.
  - **Competenze Attitudinali**: Spirito di squadra e cooperazione, disciplina e ascolto, resilienza di fronte all'errore, comprensione del gioco.
  - **Test Fisici sul Campo**: Broad Jump (salto in lungo), Sprint 20m, Sit & Reach (flessibilità).
  - **Diario Qualitativo del Coach**: Spazio dedicato alle osservazioni umane e pedagogiche dell'istruttore.
- **Generazione Istantanea & Invio Email**: Calcolo in tempo reale del profilo atletico, orientamento AI e invio con un click del report alla famiglia.

### 👨‍👩‍👧‍👦 Per le Famiglie (Portale Genitori)
- **Profilo Famiglia & Figli**: Gestione dei propri figli, anche per chi è alle prime armi e **non pratica ancora nessuno sport** ("In cerca del primo sport").
- **Discovery Geospaziale "Club Vicino a te"**: Mappa e lista dei centri sportivi limitrofi calcolati in base alla distanza chilometrica reale dalla residenza del genitore.
- **Archivio Valutazioni Trimestrali**: Storico completo dei progressi e delle schede dei figli, accessibili in qualsiasi momento da smartphone o desktop.

### 🤖 Motore di Orientamento AI
- Basato sull'integrazione con **Google Gemini (google-genai)**.
- Prompt pedagogico calibrato: analizza in modo armonico i voti, i risultati fisici e soprattutto il commento del coach.
- **Latenza Zero & Alta Affidabilità**: Timeout controllato a 5 secondi con **fallback algoritmico istantaneo**: se le API esterne sono lente o irraggiungibili, il sistema genera una panoramica discorsiva perfetta in meno di 1ms.

### 📍 Geocoding & Discovery Territoriale
- Integrazione completa con **OpenStreetMap (Nominatim & Photon)** per l'autocompletamento in tempo reale degli indirizzi e il recupero delle coordinate geografiche (latitudine/longitudine).
- Motore geodetico con formula dell'emisenoverso (**Haversine**) per calcolare con precisione i centri sportivi più vicini alla famiglia.

---

## 🛠️ Architettura & Stack Tecnologico

Athlos è strutturato secondo i pattern più moderni di **Clean Architecture** e sviluppo full-stack disaccoppiato:

| Livello | Tecnologie | Caratteristiche Chiave |
| :--- | :--- | :--- |
| **Backend API** | **FastAPI** (Python 3.14 / 3.11+) | Asincrono nativo, auto-documentazione OpenAPI / Swagger, altissime prestazioni. |
| **Database & ORM** | **PostgreSQL** + **SQLAlchemy 2.0 (AsyncPG)** | Query asincrone, migrazioni sicure con **Alembic**, integrazione relazionale rigorosa. |
| **Validazione & Schemi** | **Pydantic v2** & **Pydantic-Settings** | Type safety a runtime, parsing rigido e serializzazione automatica. |
| **Autenticazione & Sicurezza** | **OAuth2 Bearer JWT** + **Passlib (Bcrypt)** | Protezione password, sessioni stateless, ruoli utente (`CLUB`, `PARENT`, `COACH`). |
| **Frontend SPA** | **React 19**, **TypeScript**, **Vite** | Interfaccia moderna, componentistica modulare, tipizzazione completa end-to-end. |
| **Styling & UX** | **Tailwind CSS v4**, **Framer Motion**, **Lucide React** | Design system elegante, micro-animazioni fluide, layout responsive mobile-first. |
| **Intelligenza Artificiale** | **Google Gemini API** (`google-genai`) | Sintesi qualitativa pedagogica e raccomandazione sportiva contestuale. |
| **Transactional Email** | **Resend API** | Consegna immediata di email transazionali con template HTML modulare e responsive. |
| **Geoservices** | **OpenStreetMap Nominatim** | Risoluzione geografica indirizzi conforme agli standard aperti, privacy-friendly. |

---

## 📂 Struttura del Repository

```text
Athlos/
├── app/                              # Backend FastAPI
│   ├── api/                          # Controller e rotte HTTP (v1)
│   │   ├── v1/endpoints/
│   │   │   ├── auth.py               # Login, registrazione e gestione token
│   │   │   ├── club.py               # Profilo club, atleti e statistiche
│   │   │   ├── courses.py            # Gestione corsi e iscrizioni
│   │   │   ├── children.py           # Gestione anagrafica atleti/figli
│   │   │   ├── parents.py            # Profilo genitore e ricerca club limitrofi
│   │   │   ├── evaluations.py        # Creazione, calcolo AI e invio valutazioni
│   │   │   └── geo.py                # Autocomplete indirizzi OpenStreetMap
│   │   └── deps.py                   # Dependency injection (DB session, current user)
│   ├── core/                         # Configurazione globale, security JWT e database
│   ├── models/                       # Modelli relazionali SQLAlchemy (User, Club, Child, Evaluation...)
│   ├── schemas/                      # Schemi Pydantic per validazione input/output
│   ├── services/                     # Business Logic Layer
│   │   ├── ai_service.py             # Integrazione Google Gemini con Fallback
│   │   ├── email_service.py          # Costruzione template HTML e invio Resend
│   │   ├── evaluation_service.py     # Logica di calcolo e persistenza schede
│   │   └── geo_service.py            # Reverse geocoding e calcolo distanze
│   └── main.py                       # Application entrypoint e configurazione CORS
│
├── frontend/                         # Frontend React + TypeScript
│   ├── src/
│   │   ├── App.tsx                   # Auth gateway, navigazione e landing page
│   │   ├── ClubDashboard.tsx         # Cruscotto operativo per i Centri Sportivi
│   │   ├── ParentDashboard.tsx       # Portale famiglia e monitoraggio figli
│   │   ├── api.ts                    # Client HTTP tipizzato, gestione JWT e fallback OSM
│   │   └── index.css                 # Configurazione stili Tailwind CSS v4
│   ├── public/                       # Loghi vettoriali e asset grafici
│   └── vite.config.ts                # Configurazione bundling Vite
│
├── alembic/                          # Script di migrazione del database PostgreSQL
├── requirements.txt                  # Dipendenze Python
└── README.md                         # Questa documentazione
```

---

## ⚡ Guida all'Installazione & Avvio Rapido

### Prerequisiti
- **Python 3.11+** (pienamente testato e compatibile con **Python 3.14**)
- **Node.js 18+** e **npm**
- **PostgreSQL** in esecuzione locale o remota
- *(Opzionale per l'invio email reale)*: Account su [Resend](https://resend.com) con API Key
- *(Opzionale per Gemini AI live)*: Google Gemini API Key

---

### Configurazione Variabili d'Ambiente (`.env`)

Crea un file `.env` nella radice del progetto:

```ini
# Configurazione Database
DATABASE_URL=postgresql+asyncpg://postgres:tuapassword@localhost:5432/athlos_db

# Sicurezza JWT
SECRET_KEY=genera_una_stringa_segreta_molto_lunga_e_sicura
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Intelligenza Artificiale
GEMINI_API_KEY=tua_chiave_gemini_opzionale

# Servizio Email Transazionali (Resend)
RESEND_API_KEY=re_tua_api_key_resend
RESEND_FROM_EMAIL=Athlos <onboarding@resend.dev>

# Ambiente
ENVIRONMENT=development
```

Crea anche il file di configurazione per il frontend in `frontend/.env` (se necessario per personalizzare l'URL backend):
```ini
VITE_API_URL=http://localhost:8000
```

---

### Avvio Backend (FastAPI)

1. **Crea e attiva un ambiente virtuale Python**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate        # Su Linux/macOS
   # oppure: .\venv\Scripts\activate   # Su Windows
   ```

2. **Installa le dipendenze**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Applica le migrazioni del database**:
   ```bash
   alembic upgrade head
   ```

4. **Avvia il server di sviluppo**:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   *La documentazione interattiva Swagger è consultabile su: [http://localhost:8000/docs](http://localhost:8000/docs)*

---

### Avvio Frontend (React / Vite)

1. **Entra nella cartella del frontend e installa i pacchetti**:
   ```bash
   cd frontend
   npm install
   ```

2. **Avvia il server di sviluppo Vite**:
   ```bash
   npm run dev
   ```
   *L'applicazione web sarà accessibile all'indirizzo: [http://localhost:5173](http://localhost:5173)*

---

## 📡 API & Endpoints Principali

| Metodo | Endpoint | Descrizione |
| :--- | :--- | :--- |
| `POST` | `/auth/register` | Registrazione nuovo utente (Club o Genitore) |
| `POST` | `/auth/login` | Login con rilascio del token JWT Bearer |
| `GET` | `/club/me` | Dati del centro sportivo autenticato |
| `GET` | `/club/athletes` | Elenco di tutti gli atleti iscritti al centro |
| `GET` | `/courses` | Elenco corsi attivi e discipline del club |
| `POST` | `/courses` | Creazione di un nuovo corso sportivo |
| `GET` | `/parent/me` | Dati anagrafici e coordinate della famiglia |
| `GET` | `/parent/nearby-clubs` | Centri sportivi limitrofi ordinati per distanza |
| `POST` | `/child` | Aggiunta di un figlio al profilo genitore |
| `DELETE`| `/child/{id}` | Rimozione anagrafica figlio |
| `POST` | `/evaluations` | Creazione valutazione, orientamento AI e invio email |
| `GET` | `/geo/search` | Autocomplete indirizzi OpenStreetMap Nominatim |

---

## 🗺️ Roadmap Futura

- [ ] **Athlos Coach App**: Web app ottimizzata per tablet e smartphone per compilare le valutazioni a bordo campo durante gli allenamenti.
- [ ] **Analytics di Crescita Longitudinale**: Grafici radar comparativi dell'evoluzione trimestrale e annuale per visualizzare i progressi dell'atleta nel tempo.
- [ ] **Passaporto Sportivo Digitale**: Badge e certificazioni di abilità condivise tra centri sportivi in caso di cambio disciplina o trasferimento della famiglia.
- [ ] **Integrazione Calendario Gare e Prove Gratuite**: Possibilità per i genitori di prenotare una lezione di prova nei centri sportivi limitrofi direttamente dall'applicazione.

---

<p align="center">
  Sviluppato con passione per valorizzare il talento e il benessere dei giovani sportivi.<br />
  <strong>Athlos © 2026 - Tutti i diritti riservati.</strong>
</p>
