import uuid
import secrets
import asyncio
from datetime import datetime, timezone, timedelta
import stripe
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.config import settings
from app.models.payment import Payment, PaymentStatusEnum
from app.models.course import Course, CourseEnrollment
from app.models.child import Child
from app.models.club import Club
from app.models.parent import Parent
from app.models.user import User


class PaymentService:
    def __init__(self, db: AsyncSession):
        self.db = db
        if settings.STRIPE_SECRET_KEY:
            stripe.api_key = settings.STRIPE_SECRET_KEY

    async def create_checkout_session(
        self,
        parent_id: uuid.UUID,
        course_id: uuid.UUID,
        child_id: uuid.UUID
    ) -> dict:
        """
        Valida la richiesta, acquisisce un lock sul corso per evitare overbooking,
        crea la sessione Stripe al prezzo Genitore (es. 95€) e salva il Payment in stato PENDING.
        """

        stmt_child = select(Child).where(Child.id == child_id).where(Child.parent_id == parent_id)
        result_child = await self.db.execute(stmt_child)
        child = result_child.scalars().first()
        if not child:
            raise ValueError("Atleta non trovato o non appartenente al tuo profilo")

        # 2. LOCK PESSIMISTICO SUL CORSO (Anti-Overbooking):
        # Una semplice select dove cerca che il costo esista e la inserisce in course però utilizziamo
        # .with_for_update(), la quale serve a mettere un lucchetto su quel corso nel database per evitare
        # concorrenza tra due utentu che iscrivono il figlio allo stesso istante. il secondo genitore viene messo in coda
        # finchè non ri arriva al commit()
        stmt_course = select(Course).where(Course.id == course_id).with_for_update()
        result_course = await self.db.execute(stmt_course)
        course = result_course.scalars().first()
        if not course:
            raise ValueError("Corso non trovato")

        # CONTROLLO FASCIA D'ETÀ DELL'ATLETA:
        today = datetime.now(timezone.utc).date()
        dob = child.date_of_birth
        child_age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        if not (course.min_age <= child_age <= course.max_age):
            raise ValueError(
                f"{child.first_name} ha {child_age} anni, ma il corso '{course.name}' è riservato alla fascia {course.min_age}-{course.max_age} anni"
            )

        # CONTROLLO DOPPIA ISCRIZIONE:
        stmt_course_enrollment = select(CourseEnrollment).where(CourseEnrollment.course_id == course_id).where(CourseEnrollment.child_id == child_id)
        course_enrollment = await self.db.execute(stmt_course_enrollment)
        existing_enrollment = course_enrollment.scalars().first()
        if existing_enrollment:
            raise ValueError("L'atleta è già iscritto a questo corso")

        # CONTROLLO DISPONIBILITÀ POSTI (CAPIENZA):
        stmt_count = select(func.count(CourseEnrollment.id)).where(CourseEnrollment.course_id == course_id)
        result_count = await self.db.execute(stmt_count)
        enrolled_count = result_count.scalars().one()
        if enrolled_count >= course.max_participants:
            raise ValueError("Posti esauriti per questo corso")

        # Controlla eventuali sessioni PENDING avviate negli ultimi 15 minuti da altri genitori
        fifteen_mins_ago = datetime.now(timezone.utc) - timedelta(minutes=15)
        stmt_pending = (
            select(func.count(Payment.id))
            .where(
                Payment.course_id == course_id,
                Payment.status == PaymentStatusEnum.PENDING,
                Payment.created_at >= fifteen_mins_ago
            )
        )
        pending_count = (await self.db.execute(stmt_pending)).scalar() or 0
        if (enrolled_count + pending_count) >= course.max_participants:
            raise ValueError("I posti per questo corso sono attualmente in fase di completamento da parte di altri utenti. Riprova tra pochi minuti.")

        #CALCOLO DELLO SNAPSHOT DUAL-PRICING
        parent_amount = course.parent_price_cents
        club_amount = course.club_price_cents
        athlos_fee = max(0, parent_amount - club_amount)

        # GENERAZIONE CODICE RICEVUTA UNIVOCO:
        receipt_number = f"ATH-{datetime.now(timezone.utc).year}-{secrets.token_hex(3).upper()}"

        # --- 7. CREAZIONE DELLA SESSIONE STRIPE CHECKOUT ---
        # Chiediamo alle API di Stripe di predisporre una pagina di pagamento sicura:
        # Stripe ci restituirà un link (checkout_url) a cui reindirizzeremo il browser del genitore.
        if settings.STRIPE_SECRET_KEY:
            session = await stripe.checkout.Session.create_async(
                # Metodi di pagamento accettati: carte di credito/debito, con supporto automatico ad Apple Pay e Google Pay
                payment_method_types=["card"],

                # Modalità "payment": pagamento una tantum (a differenza di "subscription" per abbonamenti ricorrenti)
                mode="payment",

                # Dettagli del prodotto che il genitore visualizzerà nel riepilogo d'ordine di Stripe
                line_items=[{
                    "price_data": {
                        "currency": "eur",
                        "product_data": {
                            "name": f"Iscrizione Corso: {course.name} ({child.first_name} {child.last_name})"
                        },
                        # DUAL-PRICING: Il genitore paga esattamente `parent_amount` (es. 9500 centesimi = 95,00 €).
                        # Il prezzo riservato al club (90€) rimane totalmente invisibile a Stripe e al genitore.
                        "unit_amount": parent_amount,
                    },
                    "quantity": 1,
                }],

                # METADATA: ID applicativi che inviamo a Stripe. Stripe li memorizza e ce li rispedirà indietro
                # nel Webhook asincrono non appena la banca confermerà l'addebito. In questo modo sapremo con certezza
                # millimetrica quale corso e quale bambino attivare, senza dipendere dallo stato volatile del browser.
                metadata={
                    "course_id": str(course_id),
                    "child_id": str(child_id),
                    "parent_id": str(parent_id),
                },

                # URL a cui Stripe reindirizza il genitore dopo il pagamento riuscito.
                # {CHECKOUT_SESSION_ID} è una variabile speciale di Stripe: verrà sostituita in automatico con il vero ID di sessione.
                success_url=f"{settings.FRONTEND_URL}/?payment=success&session_id={{CHECKOUT_SESSION_ID}}",

                # URL a cui Stripe rimanda se il genitore clicca su "Annulla e torna al sito"
                cancel_url=f"{settings.FRONTEND_URL}/?payment=cancelled",
            )
            session_id = session.id
            checkout_url = session.url
        else:
            # FALLBACK / MOCK PER SVILUPPO LOCALE:
            # Se la chiave STRIPE_SECRET_KEY non è ancora configurata nel file .env,
            # l'applicazione non crasha. Genera invece un ID e un link simulati,
            # consentendoti di testare l'intera logica end-to-end anche offline o senza un account Stripe attivo.
            session_id = f"cs_test_mock_{uuid.uuid4().hex}"
            checkout_url = f"{settings.FRONTEND_URL}/?payment=mock_success&session_id={session_id}"


        payment = Payment(
            parent_id=parent_id,
            child_id=child_id,
            club_id=course.clubs_id,
            course_id=course_id,
            parent_amount_cents=parent_amount,
            club_amount_cents=club_amount,
            athlos_fee_cents=athlos_fee,
            currency="eur",
            status=PaymentStatusEnum.PENDING,
            stripe_checkout_session_id=session_id,
            receipt_number=receipt_number,
        )

        self.db.add(payment)
        await self.db.commit()
        await self.db.refresh(payment)

        return {"checkout_url": checkout_url, "session_id": session_id, "payment_id": payment.id}


    async def fulfill_payment(
        self,
        stripe_session_id: str,
        payment_intent_id: str | None = None
    ) -> Payment:
        """
        Conferma in modo IDEMPOTENTE e ATOMICO un pagamento completato su Stripe
        e iscrive formalmente l'atleta al corso.
        """

        stmt_payment = select(Payment).where(Payment.stripe_checkout_session_id == stripe_session_id).with_for_update()
        result = await self.db.execute(stmt_payment)
        payment = result.scalars().first()
        if not payment:
            raise ValueError("Pagamento non trovato per questa sessione")

        # 2. CONTROLLO DI IDEMPOTENZA:
        if payment.status in (PaymentStatusEnum.SUCCEEDED, PaymentStatusEnum.COMPLETED):
            return payment

        # 3. AGGIORNAMENTO STATO PAGAMENTO:
        payment.status = PaymentStatusEnum.SUCCEEDED
        payment.completed_at = datetime.now(timezone.utc)
        if payment_intent_id is not None:
            payment.stripe_payment_intent_id = payment_intent_id

        stmt_course_enrollment = select(CourseEnrollment).where(CourseEnrollment.course_id == payment.course_id).where(
            CourseEnrollment.child_id == payment.child_id
        )
        result = await self.db.execute(stmt_course_enrollment)
        course_enrollment = result.scalars().first()
        if not course_enrollment:
            enrollment = CourseEnrollment(
                course_id=payment.course_id,
                child_id=payment.child_id,
                enrolled_at=datetime.now(timezone.utc),
            )

            self.db.add(enrollment)

            stmt_course = select(Course).where(Course.id == payment.course_id)
            res_course = await self.db.execute(stmt_course)
            course = res_course.scalars().first()
            stmt_child = select(Child).where(Child.id == payment.child_id)
            res_child = await self.db.execute(stmt_child)
            child = res_child.scalars().first()
            if child and course:
                child.sport = course.name

            #per modificare il valore di child.sport devo fare le due query perchè in payment abbiamo solo gli id
            #non i valori specifici degli sport e del figlio

        await self.db.commit()
        await self.db.refresh(payment)

        return payment


    async def handle_stripe_webhook(self, payload_bytes: bytes, sig_header: str) -> dict:
        """
        Riceve la chiamata Server-to-Server (Webhook) dai server di Stripe,
        verifica la firma crittografica HMAC-SHA256 e smista l'evento bancario.
        """
        # 1. VERIFICA PRESENZA DELLA CHIAVE SEGRETA DEL WEBHOOK:
        #    Senza STRIPE_WEBHOOK_SECRET non potremmo verificare l'autenticità del mittente.
        if not settings.STRIPE_WEBHOOK_SECRET:
            raise ValueError("STRIPE_WEBHOOK_SECRET non configurato sul server")

        # 2. VERIFICA CRITTOGRAFICA DELLA FIRMA (Anti-Spoofing / Anti-Manomissione):
        #    `stripe.Webhook.construct_event` prende i byte grezzi del body HTTP (`payload_bytes`),
        #    calcola l'HMAC-SHA256 usando `settings.STRIPE_WEBHOOK_SECRET` e lo confronta con `sig_header`
        #    (l'header HTTP `Stripe-Signature` inviato da Stripe).
        #    Se un malintenzionato provasse a inviare un falso messaggio JSON con Postman per iscrivere
        #    un bambino gratis, la firma non coinciderebbe e verrebbe bloccato qui!
        try:
            event = stripe.Webhook.construct_event(
                payload=payload_bytes,
                sig_header=sig_header,
                secret=settings.STRIPE_WEBHOOK_SECRET
            )
        except Exception as e:
            raise ValueError(f"Firma Webhook Stripe non valida o payload manomesso: {e}")

        # 3. ESTRAZIONE DEL TIPO DI EVENTO E DEI DATI DELLA SESSIONE:
        event_type = event["type"]
        session_data = event["data"]["object"]

        # 4. SMISTAMENTO EVENTI (State Machine del Pagamento):
        #    CASO A: La banca ha confermato l'addebito (95€ incassati da Athlos).
        #    Anche se il genitore avesse chiuso il browser o perso la connessione subito dopo il pagamento,
        #    questo evento Server-to-Server arriva comunque e iscrive il bambino in modo atomico e idempotente.
        if event_type == "checkout.session.completed":
            session_id = session_data["id"]
            payment_intent_id = session_data.get("payment_intent")
            await self.fulfill_payment(
                stripe_session_id=session_id,
                payment_intent_id=payment_intent_id
            )

        #    CASO B: Il genitore ha aperto la pagina di Stripe ma non ha completato il pagamento
        #    entro la scadenza della sessione -> Segniamo il pagamento come FAILED.
        elif event_type == "checkout.session.expired":
            session_id = session_data["id"]
            stmt_payment = (
                select(Payment)
                .where(Payment.stripe_checkout_session_id == session_id)
                .with_for_update()
            )
            result = await self.db.execute(stmt_payment)
            payment = result.scalars().first()

            if payment and payment.status == PaymentStatusEnum.PENDING:
                payment.status = PaymentStatusEnum.FAILED
                await self.db.commit()

        # 5. RISPOSTA DI CONFERMA A STRIPE:
        #    Restituiamo 200 OK a Stripe per confermare di aver ricevuto ed elaborato l'evento,
        #    così Stripe sa che non deve più reinviarlo.
        return {"status": "received", "event_type": event_type}


    async def verify_checkout_session(self, session_id: str) -> dict:
        """
        Verifica lo stato di una sessione di checkout Stripe al rientro del genitore.
        Se il pagamento risulta saldato (o in modalità mock), finalizza immediatamente
        l'iscrizione tramite fulfill_payment senza attendere il webhook.
        """
        stmt = (
            select(Payment, Course, Club, Child)
            .join(Course, Payment.course_id == Course.id)
            .join(Club, Payment.club_id == Club.id)
            .join(Child, Payment.child_id == Child.id)
            .where(Payment.stripe_checkout_session_id == session_id)
        )
        res = await self.db.execute(stmt)
        row = res.first()
        if not row:
            raise ValueError("Sessione di pagamento non trovata")

        payment, course, club, child = row

        if payment.status != PaymentStatusEnum.SUCCEEDED:
            if not settings.STRIPE_SECRET_KEY or session_id.startswith("mock_"):
                payment = await self.fulfill_payment(
                    stripe_session_id=session_id,
                    payment_intent_id=f"mock_pi_{session_id[:8]}"
                )
            else:
                try:
                    session_obj = await stripe.checkout.Session.retrieve_async(session_id)
                    if session_obj and getattr(session_obj, "payment_status", None) == "paid":
                        payment = await self.fulfill_payment(
                            stripe_session_id=session_id,
                            payment_intent_id=getattr(session_obj, "payment_intent", None)
                        )
                except Exception as e:
                    print(f"[PaymentService] Errore verifica sessione Stripe ({e})")

        return {
            "id": payment.id,
            "course_id": course.id,
            "course_name": course.name,
            "club_name": club.name,
            "child_id": child.id,
            "child_name": f"{child.first_name} {child.last_name}",
            "amount_cents": payment.parent_amount_cents,
            "billing_period": course.billing_period,
            "status": payment.status,
            "receipt_number": payment.receipt_number,
            "created_at": payment.created_at,
            "completed_at": payment.completed_at,
        }


    async def get_parent_payments(self, parent_id: uuid.UUID) -> list[dict]:
        """
        Restituisce lo storico ricevute per il GENITORE.
        Mostra esclusivamente `parent_amount_cents` (es. 95,00 €).
        """
        # 1. Costruiamo una singola query SQL con JOIN su 4 tabelle (Payment, Course, Club, Child).
        #    Questo evita il problema delle query N+1: con un solo round-trip al database
        #    recuperiamo tutti i dati necessari per comporre la ricevuta del genitore.
        stmt = (
            select(Payment, Course, Club, Child)
            .join(Course, Payment.course_id == Course.id)
            .join(Club, Payment.club_id == Club.id)
            .join(Child, Payment.child_id == Child.id)
            .where(Payment.parent_id == parent_id)
            .order_by(Payment.created_at.desc())
        )
        result = await self.db.execute(stmt)

        # 2. Iteriamo sulle tuple (payment, course, club, child) restituite dalla JOIN
        #    e popoliamo `amount_cents` ESCLUSIVAMENTE con `payment.parent_amount_cents` (es. 9500 = 95,00 €).
        payments_list: list[dict] = []
        for payment, course, club, child in result.all():
            payments_list.append({
                "id": payment.id,
                "course_id": course.id,
                "course_name": course.name,
                "club_name": club.name,
                "child_id": child.id,
                "child_name": f"{child.first_name} {child.last_name}",
                "amount_cents": payment.parent_amount_cents,  # <-- Il genitore vede solo i 95€ che ha pagato!
                "billing_period": course.billing_period,
                "status": payment.status,
                "receipt_number": payment.receipt_number,
                "created_at": payment.created_at,
                "completed_at": payment.completed_at,
            })

        return payments_list


    async def get_club_payments(self, club_id: uuid.UUID) -> list[dict]:
        """
        Restituisce il registro incassi in entrata per il CLUB SPORTIVO.
        Mostra esclusivamente `club_amount_cents` (es. 90,00 €).
        """
        # 1. Costruiamo una singola query SQL con JOIN su 5 tabelle (Payment, Course, Child, Parent, User)
        #    per fornire alla segreteria del club anche il codice fiscale dell'atleta e i contatti del genitore.
        stmt = (
            select(Payment, Course, Child, Parent, User)
            .join(Course, Payment.course_id == Course.id)
            .join(Child, Payment.child_id == Child.id)
            .join(Parent, Payment.parent_id == Parent.id)
            .join(User, Parent.user_id == User.id)
            .where(Payment.club_id == club_id)
            .order_by(Payment.created_at.desc())
        )
        result = await self.db.execute(stmt)

        # 2. Iteriamo sulle tuple restituite dalla JOIN e popoliamo `amount_cents`
        #    ESCLUSIVAMENTE con `payment.club_amount_cents` (es. 9000 = 90,00 €).
        #    Il prezzo pagato dal genitore a Athlos (95€) non viene mai esposto al club!
        payments_list: list[dict] = []
        for payment, course, child, parent, user in result.all():
            payments_list.append({
                "id": payment.id,
                "course_id": course.id,
                "course_name": course.name,
                "child_id": child.id,
                "child_name": f"{child.first_name} {child.last_name}",
                "child_fiscal_code": child.fiscal_code,
                "parent_name": f"{parent.first_name} {parent.last_name}",
                "parent_email": user.email,
                "amount_cents": payment.club_amount_cents,    # <-- Il club vede solo i 90€ di sua spettanza!
                "billing_period": course.billing_period,
                "status": payment.status,
                "receipt_number": payment.receipt_number,
                "created_at": payment.created_at,
                "completed_at": payment.completed_at,
            })

        return payments_list
