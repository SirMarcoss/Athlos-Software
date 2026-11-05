import uuid
import secrets
from datetime import datetime, timezone
import stripe
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.config import settings
from app.models.payment import Payment, PaymentStatusEnum
from app.models.course import Course, CourseEnrollment
from app.models.child import Child


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

        #CONTROLLO DOPPIA ISCRIZIONE:
        stmt_course_enrollment = select(CourseEnrollment).where(CourseEnrollment.course_id == course_id).where(CourseEnrollment.child_id == child_id)
        course_enrollment = await self.db.execute(stmt_course_enrollment)
        existing_enrollment = course_enrollment.scalars().first()
        if existing_enrollment:
            raise ValueError("L'atleta è già iscritto a questo corso")


        #CONTROLLO DISPONIBILITÀ POSTI (CAPIENZA)
        stmt_count = select(func.count(CourseEnrollment.id)).where(CourseEnrollment.course_id == course_id)
        result_count = await self.db.execute(stmt_count)
        enrolled_count = result_count.scalars().one() # per un singolo numero si usa one()
        if enrolled_count >= course.max_participants:
            raise ValueError("Posti esauriti per questo corso")

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
            session = stripe.checkout.Session.create(
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



