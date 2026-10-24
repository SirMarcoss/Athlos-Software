import os
import resend
from dotenv import load_dotenv
from app.core.config import settings


class EmailService:
    def __init__(self):
        # Ricarica dinamica del file .env nel caso sia stato modificato a runtime
        load_dotenv(override=True)
        self.api_key = settings.RESEND_API_KEY or os.getenv("RESEND_API_KEY", "")
        if self.api_key:
            resend.api_key = self.api_key

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
        if not self.api_key:
            raise ValueError(
                "Chiave RESEND_API_KEY non configurata o non trovata nel file .env. "
                "Assicurati di aver inserito RESEND_API_KEY=re_... nel file .env e riavvia il server."
            )

        # Parsing strutturato dell'analisi AI
        import re

        def _clean_text(t: str) -> str:
            if not t:
                return ""
            t = re.sub(r"#{1,6}\s*", "", t)
            t = re.sub(r"---", "", t)
            t = re.sub(r"\*\*(.*?)\*\*", r"<strong>\1</strong>", t)
            t = re.sub(r"\*(.*?)\*", r"\1", t)
            t = re.sub(r"^\s*[0-9]\.\s*", "", t, flags=re.MULTILINE)
            return t.strip()

        cleaned_ai = (ai_recommendation or "").strip().strip('"').strip("'")
        
        sport_name = "Attività Consigliata"
        sport_match = re.search(r"(?:SPORT CONSIGLIATO|Sport consigliato)[:\s*]+([^\n\r]+)", cleaned_ai, re.IGNORECASE)
        if sport_match:
            sport_name = _clean_text(sport_match.group(1).split("*(")[0].split("---")[0])

        overview_match = re.search(r"(?:PANORAMICA ABILIT[AÀ]|OBIETTIVO MOTORIO)[:\s*]+(.*?)(?=(?:CONSIGLIO PER (?:I GENITORI|LA FAMIGLIA)|### 3\.|$))", cleaned_ai, re.IGNORECASE | re.DOTALL)
        overview_text = overview_match.group(1).replace("---", "").strip() if overview_match else cleaned_ai
        overview_text = _clean_text(overview_text)

        tip_match = re.search(r"(?:CONSIGLIO PER (?:I GENITORI|LA FAMIGLIA))[:\s*]+(.*)$", cleaned_ai, re.IGNORECASE | re.DOTALL)
        tip_text = _clean_text(tip_match.group(1).replace("---", "").strip()) if tip_match else ""

        # Formatta i paragrafi della panoramica
        overview_paragraphs = "".join([
            f'<p style="margin: 0 0 12px 0; font-size: 14px; line-height: 1.65; color: #334155;">{p.strip()}</p>'
            for p in overview_text.split("\n\n") if p.strip()
        ]) or f'<p style="margin: 0; font-size: 14px; line-height: 1.6; color: #334155;">{overview_text}</p>'

        tip_html = f"""
        <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 14px; padding: 18px 20px; margin-top: 16px;">
          <h4 style="margin: 0 0 8px 0; font-size: 13px; font-weight: 800; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px;">
            💡 Un Consiglio per la Famiglia
          </h4>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #78350f;">
            {tip_text}
          </p>
        </div>
        """ if tip_text else ""

        coach_notes_html = f"""
        <div style="background-color: #1E2046; border-radius: 14px; padding: 18px 20px; margin-top: 20px; color: #ffffff;">
          <h4 style="margin: 0 0 6px 0; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #E52B6D;">
            📣 Commento dell'Allenatore
          </h4>
          <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #e2e8f0; font-style: italic;">
            "{coach_notes}"
          </p>
        </div>
        """ if coach_notes else ""

        # Template HTML responsive Athlos
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Scheda di Sviluppo Sportivo - Athlos</title>
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px 12px; }}
            .card {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(30, 32, 70, 0.08); border: 1px solid #e2e8f0; }}
            .header {{ background-color: #1E2046; color: #ffffff; padding: 32px 24px; text-align: center; }}
            .logo {{ font-size: 28px; font-weight: 900; letter-spacing: -1px; }}
            .logo span {{ color: #E52B6D; }}
            .body-content {{ padding: 32px 28px; color: #1E2046; }}
            .score-grid {{ display: table; width: 100%; border-collapse: separate; border-spacing: 8px; margin: 16px 0 24px 0; }}
            .score-row {{ display: table-row; }}
            .score-cell {{ display: table-cell; width: 50%; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px; vertical-align: middle; }}
            .footer {{ text-align: center; padding: 24px; font-size: 12px; color: #94a3b8; background-color: #f8fafc; border-top: 1px solid #e2e8f0; }}
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="logo">ATHLOS<span>.</span></div>
              <p style="margin: 8px 0 0; opacity: 0.85; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                Passaporto dello Sviluppo Sportivo
              </p>
            </div>

            <div class="body-content">
              <h2 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 900; color: #1E2046;">
                Ciao {parent_name},
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.5; color: #475569;">
                Ecco il riepilogo trimestrale di <strong>{child_name}</strong> per il periodo <strong>{trimester_id}</strong> (Corso: <em>{course_name}</em>).
              </p>

              <!-- GRIGLIA PUNTEGGI ATTITUDINALI -->
              <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b;">
                📊 Valutazione Attitudinale Coach (scala 1-10)
              </h3>
              
              <div class="score-grid">
                <div class="score-row">
                  <div class="score-cell">
                    <span style="font-size: 11px; font-weight: 700; color: #64748b; display: block; text-transform: uppercase;">Creatività</span>
                    <strong style="font-size: 18px; color: #E52B6D;">{scores.get('creativity', '-')}</strong><span style="font-size: 12px; color: #94a3b8;">/10</span>
                  </div>
                  <div class="score-cell">
                    <span style="font-size: 11px; font-weight: 700; color: #64748b; display: block; text-transform: uppercase;">Spirito di Squadra</span>
                    <strong style="font-size: 18px; color: #0284c7;">{scores.get('teamwork', '-')}</strong><span style="font-size: 12px; color: #94a3b8;">/10</span>
                  </div>
                </div>
                <div class="score-row">
                  <div class="score-cell">
                    <span style="font-size: 11px; font-weight: 700; color: #64748b; display: block; text-transform: uppercase;">Gestione Emozioni & Regole</span>
                    <strong style="font-size: 18px; color: #d97706;">{scores.get('stress', '-')}</strong><span style="font-size: 12px; color: #94a3b8;">/10</span>
                  </div>
                  <div class="score-cell">
                    <span style="font-size: 11px; font-weight: 700; color: #64748b; display: block; text-transform: uppercase;">Leadership & Guida</span>
                    <strong style="font-size: 18px; color: #7c3aed;">{scores.get('leadership', '-')}</strong><span style="font-size: 12px; color: #94a3b8;">/10</span>
                  </div>
                </div>
                <div class="score-row">
                  <div class="score-cell">
                    <span style="font-size: 11px; font-weight: 700; color: #64748b; display: block; text-transform: uppercase;">Lettura del Gioco</span>
                    <strong style="font-size: 18px; color: #059669;">{scores.get('game_reading', '-')}</strong><span style="font-size: 12px; color: #94a3b8;">/10</span>
                  </div>
                  <div class="score-cell">
                    <span style="font-size: 11px; font-weight: 700; color: #64748b; display: block; text-transform: uppercase;">Coinvolgimento & Grinta</span>
                    <strong style="font-size: 18px; color: #e11d48;">{scores.get('motivation', '-')}</strong><span style="font-size: 12px; color: #94a3b8;">/10</span>
                  </div>
                </div>
              </div>

              <!-- TEST MOTORI -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; margin-bottom: 24px;">
                <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; display: block; margin-bottom: 4px;">
                  🏃 Sintesi Test Motori Svolti
                </span>
                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1E2046;">
                  {physical_summary}
                </p>
              </div>

              <!-- HERO CARD: SPORT CONSIGLIATO -->
              <div style="background: linear-gradient(135deg, #1E2046 0%, #292d63 100%); border-radius: 16px; padding: 22px; color: #ffffff; text-align: center; margin-bottom: 20px; box-shadow: 0 4px 16px rgba(30, 32, 70, 0.12);">
                <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #E52B6D; background: rgba(229, 43, 109, 0.18); padding: 4px 12px; border-radius: 20px; display: inline-block; margin-bottom: 10px;">
                  🏅 Disciplina Consigliata
                </span>
                <h3 style="margin: 0; font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">
                  {sport_name}
                </h3>
                <p style="margin: 6px 0 0 0; font-size: 12px; color: #cbd5e1;">
                  Attività consigliata tra le strutture sportive del tuo territorio
                </p>
              </div>

              <!-- CARD: PANORAMICA ABILITA' -->
              <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 22px; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);">
                <h3 style="margin: 0 0 14px 0; font-size: 15px; font-weight: 800; color: #1E2046;">
                  🎯 Panoramica sulle Abilità di {child_name}
                </h3>
                <div>
                  {overview_paragraphs}
                </div>
              </div>

              <!-- CARD: CONSIGLIO FAMIGLIA -->
              {tip_html}

              <!-- CARD: NOTE COACH -->
              {coach_notes_html}
            </div>

            <div class="footer">
              Ricevi questa email come genitore registrato sulla piattaforma <strong>Athlos</strong>.<br>
              Insieme per uno sport a misura di crescita e divertimento.
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
            error_msg = str(e)
            print(f"[EmailService] Errore nell'invio dell'email a {parent_email}: {error_msg}")
            if "testing emails to your own email address" in error_msg.lower() or "only send testing emails" in error_msg.lower():
                raise ValueError(
                    f"Resend (account di test gratuito) consente di inviare email SOLO all'indirizzo con cui ti sei registrato su Resend. "
                    f"Il genitore nel database ha email '{parent_email}'. "
                    f"Per testare con successo l'invio, cambia l'email del genitore registrato con la tua email di Resend (o collega un dominio su resend.com/domains)."
                )
            raise ValueError(f"Errore Resend durante l'invio: {error_msg}")

    def send_password_reset_email(
            self,
            to_email: str,
            first_name: str,
            reset_token: str
    ) -> bool:
        """
        Invia un'email tramite Resend contenente il codice/token temporaneo per reimpostare la password.
        """
        if not self.api_key:
            raise ValueError(
                "Chiave RESEND_API_KEY non configurata o non trovata nel file .env. "
                "Assicurati di aver inserito RESEND_API_KEY=re_... nel file .env e riavvia il server."
            )

        safe_name = first_name.strip() if first_name else "Utente"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Recupero Password - Athlos</title>
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px 12px; }}
            .container {{ max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(30, 32, 70, 0.08); }}
            .header {{ background: linear-gradient(135deg, #1E2046 0%, #2d3166 100%); padding: 32px 28px; text-align: center; color: #ffffff; }}
            .badge {{ display: inline-block; background-color: rgba(229, 43, 109, 0.2); color: #ff6b9d; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; padding: 5px 14px; border-radius: 99px; margin-bottom: 12px; }}
            .content {{ padding: 32px 28px; color: #334155; }}
            .token-box {{ background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 16px; padding: 22px 18px; margin: 22px 0; text-align: center; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #1E2046; }}
            .footer {{ background-color: #f8fafc; padding: 20px 28px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; line-height: 1.5; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="badge">Sicurezza Account</div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">Recupero Password Athlos</h1>
            </div>
            <div class="content">
              <p style="margin: 0 0 14px 0; font-size: 15px; line-height: 1.6;">
                Ciao <strong>{safe_name}</strong>,
              </p>
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Abbiamo ricevuto una richiesta per reimpostare la password del tuo account <strong>Athlos</strong>.
                Copia il codice di sicurezza qui sotto e incollalo nella schermata di recupero dell'applicazione:
              </p>

              <div class="token-box">
                {reset_token}
              </div>

              <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 14px 16px; margin-top: 20px;">
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #9f1239;">
                  ⏳ <strong>Nota di sicurezza:</strong> Questo codice è strettamente personale, è <strong>monouso</strong> e scadrà automaticamente tra <strong>15 minuti</strong>. Se non hai richiesto tu il cambio password, puoi ignorare questa email: la tua password attuale rimarrà invariata.
                </p>
              </div>
            </div>
            <div class="footer">
              Ricevi questa comunicazione di servizio per la sicurezza del tuo account <strong>Athlos</strong>.<br>
              Non condividere mai questo codice con nessuno.
            </div>
          </div>
        </body>
        </html>
        """

        try:
            params: resend.Emails.SendParams = {
                "from": settings.EMAIL_FROM,
                "to": [to_email],
                "subject": "Codice di Recupero Password - Athlos",
                "html": html_content,
            }
            email_response = resend.Emails.send(params)
            print(f"[EmailService] Email di reset password inviata a {to_email}. ID: {email_response}")
            return True
        except Exception as e:
            error_msg = str(e)
            print(f"[EmailService] Errore nell'invio dell'email di reset a {to_email}: {error_msg}")
            if "testing emails to your own email address" in error_msg.lower() or "only send testing emails" in error_msg.lower():
                raise ValueError(
                    f"Resend (account di test gratuito) consente di inviare email SOLO all'indirizzo con cui ti sei registrato su Resend ('{to_email}' non è autorizzato finché non colleghi un dominio)."
                )
            raise ValueError(f"Errore Resend durante l'invio dell'email di recupero: {error_msg}")
