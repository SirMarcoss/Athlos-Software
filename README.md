# <p align="center"><img src="frontend/public/logo-transparent.png" alt="Athlos Logo" width="220" /></p>

<h1 align="center">Athlos</h1>

<p align="center">
  <strong>Piattaforma Intelligente per l'Orientamento, la Valutazione, le Iscrizioni e la Crescita nello Sport Giovanile</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Python_3.13+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Stripe-635BFF?style=for-the-badge&logo=stripe&logoColor=white" alt="Stripe" />
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
   - [🛡️ Console Admin & Governance (Dual Pricing)](#-console-admin--governance-dual-pricing)
   - [💳 Pagamenti Stripe & Iscrizioni Online](#-pagamenti-stripe--iscrizioni-online)
   - [🤖 Motore di Orientamento AI](#-motore-di-orientamento-ai)
   - [📍 Geocoding, Google Places & Discovery Territoriale](#-geocoding-google-places--discovery-territoriale)
4. [Architettura & Stack Tecnologico](#-architettura--stack-tecnologico)
5. [Struttura del Repository](#-struttura-del-repository)
6. [Guida all'Installazione & Avvio Rapido](#-guida-allinstallazione--avvio-rapido)
   - [Prerequisiti](#prerequisiti)
   - [Configurazione Variabili d'Ambiente (`.env`)](#configurazione-variabili-dambiente-env)
   - [Avvio Database & Backend (FastAPI)](#avvio-database--backend-fastapi)
   - [Avvio Frontend (React / Vite)](#avvio-frontend-react--vite)
7. [API & Endpoints Principali](#-api--endpoints-principali)
8. [Roadmap Futura](#-roadmap-futura)

---

## 🌟 La Visione di Athlos

> *Ogni bambino possiede un talento naturale unico. Athlos lo scopre, lo valorizza e lo guida verso la disciplina sportiva ideale.*

Nell'ambito dello sport giovanile, la scelta della disciplina sportiva è troppo spesso condizionata dal caso, dalle mode temporanee o dalle pressioni esterne, portando ad alti tassi di abbandono precoce (**drop-out sportivo**) e frustrazione.

**Athlos** (`athlos.team`) nasce per colmare il divario tra **istruttori, centri sportivi e famiglie**, trasformando la valutazione periodica delle abilità in un percorso scientifico, pedagogico ed entusiasmante. Unendo il parere umano dei coach sul campo, l'analisi dell'Intelligenza Artificiale, la discovery geografica dei club vicini e le iscrizioni digitali con **Stripe**, Athlos accompagna il giovane atleta dalla prima prova fino alla scelta della disciplina più affine alle sue attitudini.

---

## 🎯 Cosa Risolve Athlos

```text
                                  IL CIRCUITO VIRTUOSO DI ATHLOS

    [ Admin Athlos ]                         [ Istruttore / Club ]
       │                                        │
       │ Configura corsi & Dual Pricing         │ Test motori + Scheda trimestrale
       ▼                                        ▼
   ┌────────────────────────────────────────────────────────────────────┐
   │                         CORE ENGINE DI ATHLOS                      │
   │  • Scheda Multi-Dimensionale & Upsert Trimestrale                  │
   │  • AI Sport Orientation (Google Gemini + vincolo geo 25 km)        │
   │  • Stripe Checkout, Webhook Idempotenti & Lock Anti-Overbooking    │
   │  • Matching Territoriale (ArcGIS Geo + Google Places + Haversine)  │
   │  • Consegna Digitale Report & OTP Sicurezza (Resend Email)         │
   └────────────────────────────────────────────────────────────────────┘
                                                │
                                                ▼
                                     [ Famiglia / Genitore ]
                                       • Scopre club e corsi nel raggio di 20 km
                                       • Iscrive il figlio e paga online con ricevuta
                                       • Consulta Passaporto AI & scorecard via email
```

1. **Valutazione Oggettiva e Olistica**: Supera i giudizi frammentari combinando competenze attitudinali su scala 0–10 (creatività, spirito di squadra, gestione delle emozioni e delle regole, leadership, lettura del gioco, motivazione/grinta), test fisici sul campo configurabili per corso e diario qualitativo del coach.
2. **Orientamento Pedagogico, non Medico**: L'IA non formula diagnosi cliniche, ma offre una panoramica calorosa, costruttiva e discorsiva evidenziando i punti di forza del bambino e il consiglio pratico per la famiglia.
3. **Radicamento Territoriale Reale**: L'algoritmo AI seleziona la disciplina consigliata esclusivamente tra i corsi reali attivi presso i centri sportivi entro **25 km** (formula di Haversine), permettendo alla famiglia di passare subito all'iscrizione.
4. **Governance Commerciale Centralizzata & Iscrizioni Sicure**: I corsi e le tariffe dual-pricing (quota concordata col Club e quota pubblica per il Genitore) sono gestiti centralmente dall'Admin, con checkout Stripe, protezione concorrenziale anti-overbooking, controllo automatico della fascia d'età (5–13 anni) e regola di iscrizione singola attiva per atleta.

---

## 🚀 Funzionalità Principali

### 🏢 Per i Centri Sportivi (Club & Coach)
- **Profilo Club Arricchito automaticamente**: Dati anagrafici geocodificati con arricchimento tramite **Google Places API (New)** (foto HD della struttura, orari di apertura, sito web, rating e recensioni).
- **Corsi Assegnati & Registro Atleti**: Visualizzazione dei corsi configurati da Athlos (tariffe in sola lettura), ricerca istantanea atleti tramite **Codice Fiscale**, iscrizione/disiscrizione dal corso e monitoraggio dei posti occupati.
- **Test Motori & Scheda Valutazione Trimestrale (Upsert Idempotente)**:
  - Registrazione dei test fisici personalizzati per corso e trimestre (`trimester_id`, es. `Q1_2026`).
  - Valutazione su **6 parametri attitudinali** (`creativity`, `teamwork`, `stress_management`, `leadership`, `game_reading`, `motivation`) + note qualitative dell'allenatore.
  - Aggiornamento pulito senza duplicati se la scheda dello stesso trimestre viene rivista e salvata nuovamente.
- **Invio Scorecard via Email**: Generazione del Passaporto AI e invio con un click alla famiglia del riepilogo HTML tramite Resend.
- **Registro Iscrizioni & Quote Club**: Visualizzazione delle quote nette di spettanza del centro sportivo (`club_amount_cents`), senza esposizione della fee Athlos.

### 👨‍👩‍👧‍👦 Per le Famiglie (Portale Genitori)
- **Profilo Famiglia, Figli & Passaggio Automatico Corso**: Gestione completa dei figli (incluso stato iniziale `"Nessuno"` per chi cerca il primo sport), visualizzazione del corso e del club a cui ciascun figlio è attualmente iscritto e supporto alla regola di **singola iscrizione attiva** (il cambio corso avviene al completamento del pagamento).
- **Discovery Geospaziale ("Club Vicino a te" & Catalogo Corsi)**: Ricerca dei club e dei corsi disponibili entro un raggio configurabile (default **20 km**) dalla residenza della famiglia, con distanza calcolata via Haversine, posti liberi in tempo reale, orari e galleria fotografica del club.
- **Archivio Valutazioni & Test Motori**: Consultazione continua delle pagelle trimestrali, dei risultati fisici e della raccomandazione AI.
- **Ricevute & Sistema Referral**: Storico pagamenti con ricevuta HTML/PDF stampabile e scaricabile, oltre al link di invito personale con `referral_code`.

### 🛡️ Console Admin & Governance (Dual Pricing)
- **Gestione Corsi & Tariffe Club**: Pannello Admin dedicato in `App.tsx` per creare, modificare o eliminare corsi assegnandoli a uno specifico club, impostando:
  - Fascia d'età (`min_age` / `max_age` tra 5 e 13 anni, con validazione `min_age <= max_age`).
  - Capienza massima (`max_participants`) e periodo di fatturazione (`trimestrale`, `mensile`, `annuale`, `quota_unica`).
  - **Dual Pricing**: `club_price_cents` (visibile solo a Club/Admin) e `parent_price_cents` (mostrato e addebitato al Genitore), con calcolo live del margine Athlos e vincolo `parent_price_cents >= club_price_cents`.
- **Controllo Utenti & Impersonation**: Elenco utenti attivi con filtri per ruolo, anteprima rapida delle viste Genitore/Club e token temporanei di impersonation (`POST /auth/impersonate/{user_id}`, 30 min, escluso verso altri Admin).

### 💳 Pagamenti Stripe & Iscrizioni Online
- **Stripe Checkout Asincrono**: Avvio sessione di pagamento tramite `stripe.checkout.Session.create_async` (`mode="payment"`, valuta `eur`, supporto Carte, Apple Pay e Google Pay).
- **Webhook Crittografici & Verifica al Ritorno**: Elaborazione server-to-server su `POST /payments/webhook` con verifica firma `Stripe-Signature` (`checkout.session.completed` e `checkout.session.expired` -> `FAILED`), affiancata dall'endpoint di riconciliazione `GET /payments/verify/{session_id}`.
- **Integrità & Anti-Overbooking**: Lock pessimistico SQL (`SELECT ... FOR UPDATE`) sul corso e sul record `Payment`, controllo preventivo di fascia d'età, verifica doppia iscrizione, conteggio delle sessioni `PENDING` attive e tutela dei record contabili `SUCCEEDED` nelle eliminazioni.

### 🤖 Motore di Orientamento AI
- Basato su **Google Gemini (`google-genai`)** eseguito in modalità asincrona nativa (`client.aio.models.generate_content`).
- Prompt pedagogico strutturato su 3 sezioni (`SPORT CONSIGLIATO`, `PANORAMICA ABILITÀ`, `CONSIGLIO PER LA FAMIGLIA`) che integra punteggi attitudinali, test motori e note del coach.
- **Alta Affidabilità con Fallback Istantaneo**: Timeout asincrono controllato a **15 secondi**; in caso di latenza o indisponibilità delle API esterne, subentra automaticamente `_generate_fallback_recommendation` senza bloccare il salvataggio della scheda.

### 📍 Geocoding, Google Places & Discovery Territoriale
- **Autocomplete Indirizzi**: Motore basato su **Esri ArcGIS World Geocoder** (`suggest` + `findAddressCandidates`) ottimizzato per indirizzi, numeri civici, CAP e sigle delle province italiane, sia backend (`/geo/autocomplete`) che client-side.
- **Google Places API (New)**: Recupero asincrono di sito web, valutazione media, numero recensioni, orari settimanali e fino a 4 foto CDN della struttura.
- **Motore Geodetico Haversine**: Calcolo diretto in SQL delle distanze chilometriche tra famiglia e centri sportivi.

---

## 🛠️ Architettura & Stack Tecnologico

Athlos è strutturato secondo un'architettura full-stack disaccoppiata a livelli (**Endpoints → Schemas → Services → Models**):

| Livello | Tecnologie | Caratteristiche Chiave |
| :--- | :--- | :--- |
| **Backend API** | **FastAPI** (Python 3.13 / 3.11+) | Asincrono nativo, auto-documentazione OpenAPI / Swagger, dependency injection per DB e ruoli (`RBAC`). |
| **Database & ORM** | **PostgreSQL** + **SQLAlchemy 2.0 (AsyncPG)** | Query asincrone, `column_property` SQL per `enrolled_count`, migrazioni versionate con **Alembic**. |
| **Validazione & Schemi** | **Pydantic v2** & **Pydantic-Settings** | Validatori cross-field, schemi separati per ruolo (`CourseParentResponse`, `CourseClubResponse`, `CourseAdminResponse`). |
| **Autenticazione & Sicurezza** | **OAuth2 Bearer JWT (`python-jose`)** + **Bcrypt** | Troncamento uniforme 72 byte, ruoli (`parent`, `club`, `admin`), soft-delete (`deleted_at`), reset password con **OTP a 6 cifre HMAC-SHA256** monouso e anti brute-force. |
| **Pagamenti** | **Stripe SDK (Async)** | Checkout Sessions, Webhook HMAC-SHA256, `PaymentStatusEnum` (`PENDING`, `SUCCEEDED`, `FAILED`, `REFUNDED`). |
| **Frontend SPA** | **React 19**, **TypeScript 6**, **Vite 8** | Interfaccia tipizzata end-to-end, client HTTP centralizzato (`api.ts`), SEO/OpenGraph per `athlos.team`. |
| **Styling & UX** | **Tailwind CSS v4**, **Framer Motion**, **Lucide React** | Design responsive, modali animate, stampa/export HTML delle ricevute. |
| **Intelligenza Artificiale** | **Google Gemini API** (`google-genai`) | Sintesi pedagogica asincrona con timeout 15s e fallback algoritmico locale. |
| **Transactional Email** | **Resend API** | Invio asincrono (`asyncio.to_thread`) di Scorecard HTML trimestrali ed email OTP sicurezza. |
| **Geoservices** | **ArcGIS World Geocoder** & **Google Places API** | Risoluzione indirizzi italiani e arricchimento schede dei centri sportivi. |

---

## 📂 Struttura del Repository

```text
AS_v2/
├── app/                                # Backend FastAPI
│   ├── api/
│   │   ├── v1/endpoints/
│   │   │   ├── auth.py                 # Register (parent/club), login, /me, reset password, users, impersonate
│   │   │   ├── club.py                 # CRUD profilo club, lista Admin (/club/), arricchimento Google Places
│   │   │   ├── courses.py              # Catalogo geo, CRUD Admin corsi/tariffe, gestione atleti iscritti
│   │   │   ├── children.py             # Anagrafica figli e lookup CF per i club
│   │   │   ├── parents.py              # Profilo genitore, referral, ricerca club entro 20 km
│   │   │   ├── evaluations.py          # Sessioni valutazione trimestrali, storico e invio email
│   │   │   ├── payments.py             # Stripe Checkout, Webhook, verifica sessione e registri pagamenti
│   │   │   └── geo.py                  # Autocomplete indirizzi italiani (/geo/autocomplete)
│   │   └── deps.py                     # Dependency injection (DB session, JWT optional/required, require_role)
│   ├── core/
│   │   ├── config.py                   # Settings Pydantic da .env (DB, JWT, AI, Resend, Stripe, Places)
│   │   ├── database.py                 # AsyncEngine PostgreSQL e SessionLocal
│   │   └── security.py                 # Bcrypt, JWT access token, OTP reset password HMAC-SHA256
│   ├── models/                         # Modelli SQLAlchemy (User, Club, Parent, Child, Course, CourseEnrollment, Payment, Evaluation, Sport)
│   ├── schemas/                        # Schemi Pydantic I/O con separazione Dual-Pricing per ruolo
│   ├── services/                       # Business Logic Layer (ai, child, club, course, email, evaluation, geo, parent, payment, places, user)
│   └── main.py                         # App entrypoint, mounting router e configurazione CORS
│
├── frontend/                           # Frontend React 19 + TypeScript + Vite
│   ├── src/
│   │   ├── App.tsx                     # Landing page, Auth gateway, recupero password e Console Admin
│   │   ├── ClubDashboard.tsx           # Cruscotto Club: corsi, atleti, test motori, schede AI e incassi
│   │   ├── ParentDashboard.tsx         # Portale Famiglia: figli, discovery 20 km, checkout Stripe e ricevute
│   │   ├── api.ts                      # Client HTTP tipizzato, gestione token JWT e helper pagamenti/geo
│   │   └── main.tsx / index.css        # Entrypoint React e stili Tailwind CSS v4
│   ├── public/                         # Loghi, favicon, sitemap.xml e robots.txt (athlos.team)
│   ├── index.html                      # Meta SEO, OpenGraph, Twitter Card e JSON-LD Schema.org
│   └── package.json / vite.config.ts
│
├── alembic/                            # Migrazioni PostgreSQL (inclusa e7f1a9b2c3d4 su payment_status_enum)
├── docker-compose.yml                  # Container PostgreSQL 15 Alpine locale (athlos_db)
├── requirements.txt                    # Dipendenze Python backend
├── test_geo_flow.py                    # Script manuale di test geocoding e filtro Haversine 20 km
└── README.md                           # Questa documentazione
```

---

## ⚡ Guida all'Installazione & Avvio Rapido

### Prerequisiti
- **Python 3.11+** (testato su **Python 3.13.5**)
- **Node.js 18+** e **npm**
- **PostgreSQL 15+** locale/remoto oppure **Docker Desktop** (tramite `docker-compose.yml`)
- **Account / API Keys**:
  - **Google Gemini API Key** (`GEMINI_API_KEY`, obbligatoria all'avvio)
  - *(Per pagamenti live)* **Stripe Secret Key & Webhook Secret** (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`)
  - *(Per email scorecard/OTP)* **Resend API Key** (`RESEND_API_KEY`)
  - *(Opzionale per foto/orari club)* **Google Places API Key** (`GOOGLE_PLACES_API_KEY`)

---

### Configurazione Variabili d'Ambiente (`.env`)

Crea un file `.env` nella radice del progetto:

```ini
# Database PostgreSQL (allineato di default a docker-compose.yml)
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/athlos_db

# Sicurezza JWT (SECRET_KEY minimo 32 caratteri con almeno 8 caratteri univoci)
SECRET_KEY=genera_una_stringa_segreta_lunga_e_casuale_almeno_32_caratteri
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# URL Frontend (usato per CORS e redirect success/cancel di Stripe Checkout)
FRONTEND_URL=http://localhost:5173

# Intelligenza Artificiale (obbligatoria per Pydantic Settings)
GEMINI_API_KEY=tua_chiave_gemini

# Email Transazionali (Resend) - EMAIL_FROM accetta anche l'alias RESEND_FROM_EMAIL
RESEND_API_KEY=re_tua_api_key_resend
EMAIL_FROM=Athlos <onboarding@resend.dev>

# Pagamenti Stripe (necessari per avviare checkout e verificare webhook)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Arricchimento Dati Centri Sportivi (opzionale)
GOOGLE_PLACES_API_KEY=
```

Crea (se necessario) il file `frontend/.env` per personalizzare l'URL del backend:
```ini
VITE_API_URL=http://localhost:8000
```

---

### Avvio Database & Backend (FastAPI)

1. **Avvia PostgreSQL con Docker Compose** *(se usi il DB locale del repository)*:
   ```bash
   docker compose up -d
   ```

2. **Crea e attiva l'ambiente virtuale Python**:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate        # Su Linux/macOS
   # oppure: .\.venv\Scripts\activate  # Su Windows
   ```

3. **Installa le dipendenze**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Applica le migrazioni del database**:
   ```bash
   alembic upgrade head
   ```

5. **Avvia il server di sviluppo**:
   ```bash
   uvicorn app.main:app --reload --port 8000
   # oppure: fastapi dev
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

3. **Build di produzione e verifica TypeScript/Lint**:
   ```bash
   npm run lint
   npm run build
   ```

---

## 📡 API & Endpoints Principali

Tutti i router in `app/main.py` sono montati direttamente sulla root del backend (`http://localhost:8000`):

| Area | Metodo | Endpoint | Accesso | Descrizione |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/auth/register` | Pubblico | Registrazione utente Genitore |
| **Auth** | `POST` | `/auth/register-club` | Pubblico | Registrazione account Centro Sportivo |
| **Auth** | `POST` | `/auth/login` | Pubblico | Login OAuth2 Password Flow con rilascio JWT Bearer |
| **Auth** | `GET` | `/auth/me` | Autenticato | Profilo utente autenticato |
| **Auth** | `POST` | `/auth/forgot-password` | Pubblico | Invio codice OTP a 6 cifre via email (anti-enumeration) |
| **Auth** | `POST` | `/auth/reset-password` | Pubblico | Verifica OTP e aggiornamento password |
| **Admin** | `GET` | `/auth/users` | `ADMIN` | Elenco completo utenti attivi |
| **Admin** | `POST` | `/auth/impersonate/{user_id}` | `ADMIN` | Emissione JWT temporaneo (30 min) per impersonation |
| **Club** | `GET` | `/club/` | `ADMIN` | Elenco di tutti i centri sportivi registrati |
| **Club** | `POST` / `GET` / `PATCH` / `DELETE` | `/club/me` *(creazione su `/club/`)* | `CLUB` | Gestione profilo del centro sportivo autenticato |
| **Club** | `POST` | `/club/me/enrich` | `CLUB` | Aggiornamento foto, orari, sito web e rating da Google Places |
| **Corsi** | `GET` | `/courses/` | Opzionale / `PARENT` | Catalogo corsi entro raggio geografico Haversine (default 20 km) |
| **Corsi** | `GET` | `/courses/my` | `CLUB` | Corsi assegnati al club (con `club_price_cents` come `price_cents`) |
| **Corsi** | `GET` / `POST` / `PATCH` / `DELETE` | `/courses/admin`, `/courses/`, `/courses/{course_id}` | `ADMIN` | Gestione centralizzata corsi e tariffe Dual-Pricing |
| **Corsi** | `GET` / `POST` / `DELETE` | `/courses/{course_id}/athletes` *(e `/{child_id}`)* | `CLUB` | Gestione atleti iscritti al corso |
| **Famiglia** | `POST` / `GET` / `PATCH` / `DELETE` | `/parent/`, `/parent/me` | `PARENT` | Gestione profilo genitore e geolocalizzazione |
| **Famiglia** | `GET` | `/parent/me/nearby-clubs` | `PARENT` | Centri sportivi entro 20 km ordinati per distanza |
| **Famiglia** | `GET` | `/parent/me/referral` | `PARENT` | Codice e link invito referral |
| **Figli** | `POST` / `GET` / `PATCH` / `DELETE` | `/child/`, `/child/{child_id}` | `PARENT` | CRUD figli con stato iscrizione attiva (`enrolled_course_id`) |
| **Figli** | `GET` | `/child/by-fiscal-code/{fiscal_code}` | `CLUB` / `ADMIN` | Lookup rapido atleta tramite Codice Fiscale |
| **Valutazioni** | `POST` | `/evaluations/course/{course_id}/child/{child_id}/session` | `CLUB` | Salvataggio/upsert sessione fisica + psicologica e generazione report AI |
| **Valutazioni** | `GET` | `/evaluations/child/{child_id}` *(e `/physical`)* | `PARENT` | Storico schede trimestrali e test fisici del figlio |
| **Valutazioni** | `GET` | `/evaluations/course/{course_id}` *(e `/physical`)* | `CLUB` | Storico schede e test fisici del corso |
| **Valutazioni** | `POST` | `/evaluations/{evaluation_id}/send-email` | `CLUB` | Invio scorecard trimestrale HTML via email al genitore |
| **Pagamenti** | `POST` | `/payments/checkout-session` | `PARENT` | Avvio sessione Stripe Checkout con lock anti-overbooking |
| **Pagamenti** | `GET` | `/payments/verify/{session_id}` | `PARENT` | Verifica esito Stripe al rientro e finalizzazione iscrizione |
| **Pagamenti** | `POST` | `/payments/webhook` | Stripe S2S | Ricezione webhook firmati Stripe (`completed` / `expired`) |
| **Pagamenti** | `GET` | `/payments/parent/me` | `PARENT` | Storico ricevute pagate dal genitore |
| **Pagamenti** | `GET` | `/payments/club/me` | `CLUB` | Registro incassi maturati dal club (quote club) |
| **Geo** | `GET` | `/geo/autocomplete` | Pubblico | Autocompletamento indirizzi italiani e coordinate |

---

## 🗺️ Roadmap Futura

- [ ] **Persistenza Server-Side dei Test Motori Personalizzati**: Spostare su PostgreSQL la definizione dei test motori per corso e le bozze settimanali attualmente salvate in `localStorage` nella dashboard Club.
- [ ] **Payout & Rimborsi Automatizzati (Stripe Connect / Admin Refunds)**: Gestione automatizzata dei trasferimenti verso i club e flusso completo di rimborso con aggiornamento iscrizione.
- [ ] **Analytics di Crescita Longitudinale & Wiki Sport**: Grafici comparativi dell'evoluzione trimestrale dell'atleta e integrazione completa della tabella `sports` per schede narrative multimediali.
- [ ] **Suite di Test Automatizzati (`pytest` & E2E)** e **Gestione Cancellazione Account GDPR (`DELETE /auth/me`)**.
- [ ] **Athlos Coach App & Prove Gratuite**: Interfaccia dedicata da bordo campo per tablet/smartphone e prenotazione di lezioni di prova nei club limitrofi.

---

<p align="center">
  Sviluppato con passione per valorizzare il talento e il benessere dei giovani sportivi.<br />
  <strong>Athlos © 2026 - Tutti i diritti riservati • Progettata e sviluppata da Marco Mazzone</strong>
</p>
