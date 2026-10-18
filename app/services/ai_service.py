import asyncio
from google import genai
from app.core.config import settings

class AIService:
    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)

    def _generate_fallback_recommendation(
            self,
            child_name: str,
            child_age: int,
            current_sport: str,
            creativity_score: int,
            teamwork_score: int,
            stress_management_score: int,
            motivation_score: int,
            coach_notes: str | None,
            physical_summary: str,
            available_sports: list[str]
    ) -> str:
        """Motore pedagogico rapido senza gergo medico, focalizzato su abilità e note coach."""
        pool = [s for s in available_sports if s.lower() != current_sport.lower()] or available_sports or ["Polisportiva"]
        
        notes_str = f" A tal proposito, l'allenatore ha evidenziato: \"{coach_notes}\"." if coach_notes else ""
        phys_str = f" Nei test atletici ({physical_summary}), {child_name} ha mostrato buona reattività ed energia." if physical_summary and physical_summary != "Nessun dato fisico inserito" else ""

        if teamwork_score >= 8 and any(k in s.lower() for s in pool for k in ["basket", "calcio", "pallavolo"]):
            chosen = next(s for s in pool if any(k in s.lower() for k in ["basket", "calcio", "pallavolo"]))
            overview = (
                f"Durante questo trimestre, {child_name} ({child_age} anni) ha mostrato una naturale predisposizione alle dinamiche di squadra e alla socializzazione (spirito di squadra {teamwork_score}/10) con una motivazione costante ({motivation_score}/10). "
                f"Comunica con facilità con i compagni e vive ogni esercizio con entusiasmo positivo.{notes_str}{phys_str}"
            )
            tip = f"Continuate a sostenere il valore dell'intesa e del divertimento coi compagni: per {child_name} lo sport è innanzitutto un'esperienza sociale ricca e stimolante."
        elif creativity_score >= 8 and any(k in s.lower() for s in pool for k in ["ginnastica", "artistica", "danza"]):
            chosen = next(s for s in pool if any(k in s.lower() for k in ["ginnastica", "artistica", "danza"]))
            overview = (
                f"{child_name} brilla per fantasia motoria, inventiva e senso dell'equilibrio (creatività {creativity_score}/10). "
                f"Mostra curiosità verso nuovi movimenti e affronta gli esercizi con vivacità espressiva.{notes_str}{phys_str}"
            )
            tip = f"Incoraggiate la sua creatività lasciando spazio alla libera sperimentazione, festeggiando i progressi senza mai puntare sulla perfezione del gesto."
        elif stress_management_score <= 6 and any(k in s.lower() for s in pool for k in ["judo", "marziali"]):
            chosen = next(s for s in pool if any(k in s.lower() for k in ["judo", "marziali"]))
            overview = (
                f"{child_name} esprime grande determinazione e generosità in campo (grinta {motivation_score}/10), vivendo le attività con forte coinvolgimento emotivo (gestione emozioni {stress_management_score}/10). "
                f"Un contesto orientato alla disciplina e al rispetto dei tempi aiuterà a valorizzare al meglio tutta questa carica.{notes_str}{phys_str}"
            )
            tip = f"Aiutatelo a vivere ogni piccolo imprevisto come una normale tappa di apprendimento: la serenità condivisa a casa è la migliore alleata della sua sicurezza in palestra."
        else:
            chosen = pool[0]
            overview = (
                f"{child_name} ha completato un trimestre molto costruttivo, dimostrando impegno e continuità nell'attività sportiva. "
                f"I parametri attitudinali confermano motivazione ({motivation_score}/10) e voglia di mettersi in gioco.{notes_str}{phys_str}"
            )
            tip = f"Accompagnate con entusiasmo la sua passione per lo sport, incoraggiando sempre la curiosità e il divertimento attivo."

        return (
            f"SPORT CONSIGLIATO: {chosen}\n\n"
            f"PANORAMICA ABILITÀ:\n{overview}\n\n"
            f"CONSIGLIO PER LA FAMIGLIA:\n{tip}"
        )

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
            leadership_score: int,
            game_reading_score: int,
            motivation_score: int,
            available_sports: list[str],
            coach_notes: str | None = None
    ) -> str:
        """
        Genera una panoramica discorsiva e un suggerimento sportivo calibrato sulle abilità del bambino,
        sui test fisici e sul commento dell'allenatore, senza gergo medico o auxologico.
        """
        prompt = f"""
        Sei l'assistente sportivo di Athlos. Scrivi una relazione trimestrale elegante, calorosa, chiara e incoraggiante per i genitori di un giovane atleta.

        SCHEDA ATLETA:
        - Nome: {child_name} | Età: {child_age} anni
        - Disciplina praticata nell'ultimo trimestre: {current_sport}
        - Note e commento specifico dell'allenatore: {coach_notes or 'Nessun commento particolare registrato'}
        - Sintesi Test Motori svolti: {physical_summary}
        - Parametri attitudinali (scala 1-10):
          * Creatività e Iniziativa: {creativity_score}/10
          * Spirito di Squadra e Relazione: {teamwork_score}/10
          * Gestione di Emozioni e Regole: {stress_management_score}/10
          * Leadership e Guida dei compagni: {leadership_score}/10
          * Lettura del Gioco e Tattica: {game_reading_score}/10
          * Coinvolgimento, Motivazione e Grinta: {motivation_score}/10

        DISCIPLINE SPORTIVE DISPONIBILI NELLE STRUTTURE VICINE (VINCOLO ASSOLUTO):
        [{', '.join(available_sports)}]
        Lo sport consigliato DEVE essere scelto obbligatoriamente da questo elenco. Non proporre sport al di fuori di questo gruppo.

        REGOLE FONDAMENTALI DI CONTENUTO E STILE (SEGUI CON ATTENZIONE):
        - NON usare alcun linguaggio medico, clinico o auxologico (NON menzionare auxologia, biomeccanica, catene cinetiche, landing mechanics, CONI, OMS o simili).
        - Non usare formule tipo "questo documento non costituisce diagnosi medica".
        - Offri una panoramica discorsiva approfondita, fluida e scorrevole sulle abilità emerse, commentando sia i punteggi attitudinali, sia i test motori, sia attentamente il commento del coach.
        - Concludi con un consiglio pratico e caloroso per i genitori per accompagnare la crescita del figlio.
        - Non usare cancelletti markdown (come ### o #) né linee decorative (---). Scrivi in prosa elegante.

        STRUTTURA OBBLIGATORIA (usa esattamente questi 3 titoli in maiuscolo):

        SPORT CONSIGLIATO: [Scrivi solo il nome dello sport consigliato scelto dall'elenco delle disponibilità]

        PANORAMICA ABILITÀ:
        [Scrivi qui la panoramica discorsiva approfondita (2-3 paragrafi ben strutturati), raccontando le abilità, la motivazione, il modo di relazionarsi con gli altri e cosa emerge dai test fisici e dalle note del coach.]

        CONSIGLIO PER LA FAMIGLIA:
        [Scrivi qui il consiglio pratico e incoraggiante per i genitori su come sostenere la passione sportiva del bambino.]
        """

        try:
            response = await asyncio.wait_for(
                self.client.aio.models.generate_content(
                    model='gemini-3.8-flash',
                    contents=prompt
                ),
                timeout=5.0
            )
            if response and response.text:
                return response.text.strip()
        except Exception as e:
            print(f"[AIService] Chiamata Gemini lenta o fallita ({e}). Utilizzo motore pedagogico locale rapido.")

        return self._generate_fallback_recommendation(
            child_name=child_name,
            child_age=child_age,
            current_sport=current_sport,
            creativity_score=creativity_score,
            teamwork_score=teamwork_score,
            stress_management_score=stress_management_score,
            motivation_score=motivation_score,
            coach_notes=coach_notes,
            physical_summary=physical_summary,
            available_sports=available_sports
        )