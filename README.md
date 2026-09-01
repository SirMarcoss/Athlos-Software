# Athlos 🏅

Benvenuti nel progetto **Athlos**! 
Athlos è una piattaforma sportiva innovativa che connette i genitori dei piccoli atleti (scuola elementare) con i Club sportivi locali.
La particolarità di Athlos è l'uso dell'**Intelligenza Artificiale**: al termine di ogni corso trimestrale, l'allenatore inserisce in pochi secondi i parametri fisici e attitudinali del bambino, e l'AI elabora un report personalizzato suggerendo lo sport più adatto per il trimestre successivo.

## 🚀 Architettura

* **Backend:** FastAPI (Python 3.14)
* **Database:** PostgreSQL 15
* **ORM:** SQLAlchemy 2.0 (con operazioni asincrone via Asyncpg)
* **Migrazioni:** Alembic
* **Validazione:** Pydantic V2
* **Sicurezza:** JWT Tokens (Autenticazione OAuth2)

## 🗄 Struttura del Database (Entity-Relationship)

Il backend è strutturato sui seguenti modelli relazionali principali:
1. `User`: L'utente base autenticato (gestione ruoli: Admin, Parent, Club).
2. `Parent`: Il profilo del genitore (contatti, dati anagrafici).
3. `Child`: L'atleta. Relazionato a 1 Parent.
4. `Club`: La società sportiva erogatrice dei corsi.
5. `Course`: Lo specifico corso sportivo (trimestrale) offerto dal Club.
6. `Evaluation`: Il cuore dell'app. Unisce Child e Course, e salva i punteggi (Agility, Teamwork, Discipline) calcolando lo sport consigliato dall'AI.

## ⚙️ Setup Locale

### 1. Avviare il Database con Docker
Assicurati di avere Docker installato e in esecuzione sul tuo Mac.
Dalla root del progetto, esegui:
```bash
docker-compose up -d
```
Questo scaricherà e avvierà un'istanza di PostgreSQL (nome container: `athlos_db`) esposta sulla porta `5432` locale.

### 2. Installare le Dipendenze
Attiva il tuo ambiente virtuale (`.venv`) e installa i pacchetti:
```bash
pip install -r requirements.txt
```

### 3. Eseguire le Migrazioni (Alembic)
Per sincronizzare le tabelle del database con i modelli Python, lancia i seguenti comandi:
```bash
alembic upgrade head
```

### 4. Lanciare il Server FastAPI
Per avviare il backend in modalità sviluppo:
```bash
fastapi dev app/main.py
```
L'API sarà disponibile all'indirizzo `http://127.0.0.1:8000`.
Puoi testare gli endpoint aprendo la **Swagger UI** su `http://127.0.0.1:8000/docs`.

---
*Progettato e sviluppato per facilitare l'accesso allo sport dei più piccoli con per i Club.*
