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
            agility_score: int,
            teamwork_score: int,
            discipline_score: int,
            coach_notes: str | None = None
    ) -> str:
        """
        Analisi pedagogico-motoria avanzata basata sulle fasi sensibili dello sviluppo
        (modello auxologico infantile 5-13 anni).
        """
        prompt = f"""
        RUOLO E COMPETENZA:
        Sei un Direttore Tecnico Nazionale della Preparazione Atletica Giovanile e Pedagogista dello Sport Infantile (esperto in auxologia e schemi motori di base per la fascia 5-13 anni, linee guida CONI e OMS).

        SCHEDA ATLETA IN VALUTAZIONE:
        - Nome: {child_name} | Età: {child_age} anni
        - Disciplina praticata nell'ultimo trimestre: {current_sport}
        - Bagaglio motorio / Skills pregresse: {', '.join(skills) if skills else 'Generale di base'}
        - Parametri di Performance e Attitudinali (scala 0-10):
          * Coordinazione Oculomanuale / Dinamica Generale (Agilità): {agility_score}/10
          * Intelligenza Relazionale / Cooperazione (Teamwork): {teamwork_score}/10
          * Capacità Attrattiva / Autoregolazione (Disciplina): {discipline_score}/10
        - Report Clinico / Osservazioni dell'Istruttore: "{coach_notes or 'Profilo nella norma, nessun vincolo posturale segnalato'}"

        CRITERI DI ANALISI (Chain of Thought):
        1. FASE SENSIBILE: Identifica la finestra di sviluppo motorio adatta ai suoi {child_age} anni (apprendimento rapido della coordinazione per 6-8 anni, consolidamento capacità condizionali per 9-11 anni).
        2. COMPENSAZIONE: Se lo score di agilità o disciplina è basso, consiglia una disciplina che rinforzi il gap; se è alto, una disciplina che massimizzi il talento emergente.
        3. DIVERSIFICAZIONE MULTI-SPORT: Evita la specializzazione precoce; privilegia il transfer motorio positivo rispetto al precedente sport ({current_sport}).

        VINCOLO STRUTTURALE DI OUTPUT (MANDATORIO):
        L'output deve essere un giudizio sintetico, scientifico ed estremamente motivante per i genitori.
        LUNGHEZZA MASSIMA: TASSATIVAMENTE ENTRO 240 CARATTERI (inclusi spazi), per vincoli di archiviazione su database.

        FORMATO RIGIDO:
        [Nome Sport]: [Diagnosi dell'obiettivo motorio e valore pedagogico in una sola frase d'impatto].

        Esempi di qualità richiesta:
        Judo: Ideale a {child_age} anni per canalizzare l'energia, potenziando equilibrio posturale e rispetto delle regole attraverso il contatto controllato.
        Pallacanestro: Perfetto per stimolare la visione periferica e la reattività cinestetica, valorizzando la coordinazione in un contesto di cooperazione rapida.
        """

        response = await self.client.aio.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )

        recommendation = response.text.strip()

        # Garanzia di sicurezza: tronchiamo a 255 caratteri per non far crashare PostgreSQL
        if len(recommendation) > 255:
            recommendation = recommendation[:252] + "..."

        return recommendation