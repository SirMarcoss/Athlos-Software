"""add coach to user_role_enum

Revision ID: 2d0eae822138
Revises: bba367d4cc69
Create Date: 2026-09-03 01:39:27.593502

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2d0eae822138'
down_revision: Union[str, None] = 'bba367d4cc69'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE user_role_enum ADD VALUE 'coach'")


def downgrade() -> None:
    pass
