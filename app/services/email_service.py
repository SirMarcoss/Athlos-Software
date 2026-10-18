import resend
from app.core.config import settings


class EmailService:
    def __init__(self):
        # Inizializza la chiave API di Resend dai settings
        if settings.RESEND_API_KEY:
            resend.api_key = settings.RESEND_API_KEY

    def send_evaluation_email_to_parent(
            self,
            parent_email: str,
            parent_name: str,
            child_name: str,
            course_name: str,
            trimester_id: str,
            scores: dict[str, int],
            physical_summary: str,
            ai_recommendation: str,
            coach_notes: str | None
    ) -> bool:
        """
        Genera l'HTML della scheda e invia l'email tramite Resend.
        """
        if not settings.RESEND_API_KEY:
            print("[EmailService] RESEND_API_KEY non configurata, invio saltato (mock).")
            return False

        # TODO 1: Costruisci il template HTML (email responsive elegante)
        # Usa i colori Athlos: Blu #1E2046, Rosa/Magenta #E52B6D, Grigio chiaro #F8FAFC
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f8fc; margin: 0; padding: 20px; }}
            .card {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }}
            .header {{ background-color: #1E2046; color: #ffffff; padding: 30px; text-align: center; }}
            .logo {{ font-size: 26px; font-weight: 900; letter-spacing: -1px; }}
            .logo span {{ color: #E52B6D; }}
            .body-content {{ padding: 30px; color: #334155; }}
            .score-box {{ background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; margin: 15px 0; }}
            .ai-box {{ background-color: #fff1f5; border: 1px solid #fecdd3; border-radius: 12px; padding: 20px; margin: 20px 0; }}
            .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #94a3b8; }}
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="logo">ATHLOS<span>.</span></div>
              <p style="margin: 8px 0 0; opacity: 0.8; font-size: 14px;">Passaporto dello Sviluppo Sportivo</p>
            </div>
            <div class="body-content">
              <h2>Ciao {parent_name},</h2>
              <p>È disponibile la nuova scheda di sviluppo per <strong>{child_name}</strong> relativa al trimestre <strong>{trimester_id}</strong> (Corso: <em>{course_name}</em>).</p>

              <h3>📊 Valutazione Multidimensionale Coach (0-10)</h3>
              <div class="score-box">
                <p>🎨 Creatività & Iniziativa: <strong>{scores.get('creativity', '-')}</strong>/10</p>
                <p>🤝 Spirito di Squadra: <strong>{scores.get('teamwork', '-')}</strong>/10</p>
                <p>🧘 Gestione Stress & Regole: <strong>{scores.get('stress', '-')}</strong>/10</p>
                <p>⭐ Leadership & Influenza: <strong>{scores.get('leadership', '-')}</strong>/10</p>
                <p>🧠 Lettura di Gioco & Tattica: <strong>{scores.get('game_reading', '-')}</strong>/10</p>
                <p>🔥 Motivazione & Grinta: <strong>{scores.get('motivation', '-')}</strong>/10</p>
              </div>

              <h3>🏃 Test Motori Svolti</h3>
              <p style="font-size: 14px; color: #64748b;">{physical_summary}</p>

              <div class="ai-box">
                <h3 style="color: #E52B6D; margin-top: 0;">🤖 Il Verdetto Pedagogico Athlos AI</h3>
                <p style="font-style: italic; font-size: 14px; line-height: 1.6;">"{ai_recommendation}"</p>
              </div>

              {f"<p><strong>Note dell'allenatore:</strong> {coach_notes}</p>" if coach_notes else ""}
            </div>
            <div class="footer">
              Ricevi questa email perché sei registrato su Athlos con {parent_email}.
            </div>
          </div>
        </body>
        </html>
        """

        # TODO 2: Invia tramite Resend
        try:
            params: resend.Emails.SendParams = {
                "from": settings.EMAIL_FROM,
                "to": [parent_email],
                "subject": f"Scheda Trimestrale Athlos: {child_name} ({course_name})",
                "html": html_content,
            }
            email_response = resend.Emails.send(params)
            print(f"[EmailService] Email inviata con successo a {parent_email}. ID: {email_response}")
            return True
        except Exception as e:
            print(f"[EmailService] Errore nell'invio dell'email: {e}")
            return False