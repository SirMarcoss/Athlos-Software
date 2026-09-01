from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
#from app.api.v1.endpoints import auth


app = FastAPI(
    title='Atlhos API',
    version="0.1.0"
)

#Semantic versioning: 0 -> not in production project (instable project)
#                     1 -> first version that works
#                     0: no patch realized


@app.get("/") # the function right below is in charge of handling requests that go to: the path (/)
async def root(): #async function
    return {"message": "Tutto ok"}

# @(decorator) tells FastAPI that the function below corresponds to the path / with an operation get


# --- 2. LISTA DELLE ORIGINI AMMESSE (Frontend / Client) ---
origins = [
    "http://localhost:3000",  # React classico
    "http://localhost:5173",  # Vite / React moderno
    "*",                      # Ammette tutte le origini per sviluppo locale
]


# --- 3. AGGANCIO DEL MIDDLEWARE ALL'APP ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # Passa la lista delle origini definita sopra
    allow_credentials=True,      # Consente l'invio di cookie e header Authorization
    allow_methods=["*"],         # Consente tutti i verbi HTTP (GET, POST, PUT, DELETE, OPTIONS)
    allow_headers=["*"],         # Consente tutti gli header (es. Content-Type, Authorization)
)

# GET: to read a data
# POST: to create a data
# PUT: to update a data
# DELETE: to delete a data
