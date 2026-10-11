from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.parent import Parent
from app.schemas.parent import ParentCreate, ParentUpdate
from app.services.geo_service import GeoService
import uuid

class ParentService:
    def __init__(self, db: AsyncSession):
        self.db = db


    async def get_parent_by_user_id(self, user_id: uuid.UUID) -> Parent | None:
        """Recupera il profilo genitore tramite l'ID dell'utente."""

        stmt = select(Parent).where(Parent.user_id == user_id)
        parent = await self.db.execute(stmt)
        return parent.scalars().first()


    async def create_parent(self, parent_in: ParentCreate, user_id: uuid.UUID) -> Parent:
        """Crea il profilo genitore collegato all'account."""

        existing_parent = await self.get_parent_by_user_id(user_id)
        if existing_parent:
            raise ValueError("Profilo già esistente")

        address_data = parent_in.address.model_dump() if parent_in.address else None
        new_referral_code = str(uuid.uuid4()).split('-')[0].upper()
        # Genera una stringa casuale di 8 caratteri basata su UUID

        referred_by_id = None
        if parent_in.referral_code and not referred_by_id:
            stmt_ref = select(Parent).where(Parent.referral_code == parent_in.referral_code.strip().upper())
            res_ref = await self.db.execute(stmt_ref)
            inviter = res_ref.scalars().first()
            if inviter:
                referred_by_id = inviter.id
        # verifico se l'utente si è registrato usando il referral di un altro utente

        lat, lon = None, None
        if parent_in.address:
            geo_service = GeoService()
            query_str = f"{parent_in.address.street}, {parent_in.address.city}"
            geo_results = await geo_service.autocomplete(query_str, limit=1)
            if geo_results:
                lat = geo_results[0].latitude
                lon = geo_results[0].longitude
        # se latitude e longitude sono a None, utilizzo il service di geo per
        # ottenerle automaticamente

        db_parent =  Parent(
            user_id=user_id,
            first_name=parent_in.first_name,
            last_name=parent_in.last_name,
            phone_number=parent_in.phone_number,
            fiscal_code=parent_in.fiscal_code,
            info=parent_in.info,
            address=address_data,
            latitude=lat,
            longitude=lon,
            referral_code=new_referral_code,
            referred_by_id=referred_by_id
        )
        self.db.add(db_parent)
        await self.db.commit()
        await self.db.refresh(db_parent)
        return db_parent


    async def update_parent(self, parent_in: ParentUpdate, user_id: uuid.UUID) -> Parent:
        """Aggiorna i dati del genitore loggato."""

        parent  = await self.get_parent_by_user_id(user_id)
        if not parent:
            raise ValueError("Profilo genitore non trovato")

        update_data = parent_in.model_dump(exclude_unset=True)
        # contiene solo i campi che il Front-End ha effettivamente modificato

        # Se l'utente sta modificando l'indirizzo le ricalcoliamo automaticamente con GeoService
        if parent_in.address:
            geo_service = GeoService()
            query_str = f"{parent_in.address.street}, {parent_in.address.city}"
            geo_results = await geo_service.autocomplete(query_str, limit=1)
            if geo_results:
                update_data["latitude"] = geo_results[0].latitude
                update_data["longitude"] = geo_results[0].longitude

        for key, value in update_data.items():
            setattr(parent, key, value)

        await self.db.commit()
        await self.db.refresh(parent)
        return parent


    async def delete_parent(self, user_id: uuid.UUID) -> None:
        """Elimina il profilo genitore collegato all'utente."""

        parent = await self.get_parent_by_user_id(user_id)
        if not parent:
            raise ValueError("Profilo genitore non trovato")

        await self.db.delete(parent)
        await self.db.commit()

