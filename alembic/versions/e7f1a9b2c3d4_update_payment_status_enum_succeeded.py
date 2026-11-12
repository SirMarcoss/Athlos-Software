"""update payment_status_enum to use SUCCEEDED

Revision ID: e7f1a9b2c3d4
Revises: bc06ce487962
Create Date: 2026-11-11 08:45:00.000000

"""
from typing import Sequence, Union
from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'e7f1a9b2c3d4'
down_revision: Union[str, None] = 'bc06ce487962'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM pg_enum 
                JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
                WHERE pg_type.typname = 'payment_status_enum' AND pg_enum.enumlabel = 'COMPLETED'
            ) THEN
                ALTER TYPE payment_status_enum RENAME VALUE 'COMPLETED' TO 'SUCCEEDED';
            ELSIF NOT EXISTS (
                SELECT 1 FROM pg_enum 
                JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
                WHERE pg_type.typname = 'payment_status_enum' AND pg_enum.enumlabel = 'SUCCEEDED'
            ) THEN
                ALTER TYPE payment_status_enum ADD VALUE 'SUCCEEDED';
            END IF;
        END
        $$;
    """)


def downgrade() -> None:
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM pg_enum 
                JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
                WHERE pg_type.typname = 'payment_status_enum' AND pg_enum.enumlabel = 'SUCCEEDED'
            ) THEN
                ALTER TYPE payment_status_enum RENAME VALUE 'SUCCEEDED' TO 'COMPLETED';
            END IF;
        END
        $$;
    """)
