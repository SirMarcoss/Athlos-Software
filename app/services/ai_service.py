from google import genai
from app.core.config import settings

class AIService:
    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)

    async def generate_sport_recommendation(
            self,
            child_name: str,
            child_age: int,
            current_sport: str,
            skills: list[str],
            physical_summary: str,
            creativity_score: int,
            teamwork_score: int,
            stress_management_score: int,
            available_sports: list[str],
            coach_notes: str | None = None
    ) -> str:
        """
        Analisi pedagogico-motoria avanzata basata sulle fasi sensibili dello sviluppo
        (modello auxologico infantile 5-13 anni), limitata agli sport effettivamente disponibili nei dintorni.
        """
        prompt = f"""
        RUOLO E COMPETENZA:
        Sei un Direttore Tecnico Nazionale della Preparazione Atletica Giovanile e Pedagogista dello Sport Infantile (esperto in auxologia e schemi motori di base per la fascia 5-13 anni, linee guida CONI e OMS).

        SCHEDA ATLETA IN VALUTAZIONE:
        - Nome: {child_name} | Età: {child_age} anni
        - Disciplina praticata nell'ultimo trimestre: {current_sport}
        - Bagaglio motorio / Skills pregresse: {', '.join(skills) if skills else 'Generale di base'}
        - Sintesi Test Fisici: {physical_summary}
        - Parametri Attitudinali/Psicologici (scala 0-10):
          * Creatività e Iniziativa: {creativity_score}/10
          * Intelligenza Relazionale / Cooperazione (Teamwork): {teamwork_score}/10
          * Gestione dello Stress e delle Regole: {stress_management_score}/10
        - Report Clinico / Osservazioni dell'Istruttore: "{coach_notes or 'Profilo nella norma, nessun vincolo posturale segnalato'}"

        VINCOLO DISPONIBILITA' SPORT (CRITICO):
        L'algoritmo DEVE restituire come sport consigliato ESCLUSIVAMENTE uno o più sport presi da questa esatta lista di sport attualmente disponibili nei club limitrofi:
        [{', '.join(available_sports) if available_sports else 'Nessuno sport disponibile in zona, suggerire attività motoria di base a casa'}]
        Non inventare e non suggerire MAI sport al di fuori di questa lista.

        CRITERI DI ANALISI (Chain of Thought):
        1. FASE SENSIBILE: Identifica la finestra di sviluppo motorio adatta ai suoi {child_age} anni.
        2. COMPENSAZIONE: In base ai test fisici e ai punteggi di stress/gruppo, trova lo sport (tra quelli disponibili) che rinforzi il gap o massimizzi il talento emergente.
        3. DIVERSIFICAZIONE MULTI-SPORT: Privilegia il transfer motorio positivo rispetto al precedente sport ({current_sport}).

        FORMATO DI RISPOSTA RICHIESTO:
        Organizza la risposta in modo chiaro, autorevole e ben formattato per la famiglia con questi 3 punti:
        1. 🏅 SPORT CONSIGLIATO: [Nome dello sport raccomandato (DEVE essere preso dalla lista delle disponibilità)]
        2. 🎯 OBIETTIVO MOTORIO: [Spiegazione auxologica e biomeccanica: quali schemi motori o attitudini andrà a sviluppare]
        3. 💡 CONSIGLIO PER I GENITORI: [Un suggerimento pedagogico pratico e incoraggiante per supportare il bambino in questa fase, chiarendo che queste sono osservazioni qualificate e non diagnosi mediche]
        """

        response = await self.client.aio.models.generate_content(
            model='gemini-3.7-flash',
            contents=prompt
        )

        return response.text.strip()