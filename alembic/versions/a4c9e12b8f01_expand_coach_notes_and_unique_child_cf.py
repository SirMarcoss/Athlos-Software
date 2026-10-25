"""expand_coach_notes_and_unique_child_cf

Revision ID: a4c9e12b8f01
Revises: 903db8da27b5
Create Date: 2026-10-25 12:52:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a4c9e12b8f01'
down_revision: Union[str, None] = '903db8da27b5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        'psychological_forms',
        'coach_notes',
        existing_type=sa.String(length=255),
        type_=sa.String(length=1000),
        existing_nullable=True
    )
    op.create_index(
        op.f('ix_children_fiscal_code'),
        'children',
        ['fiscal_code'],
        unique=True
    )


def downgrade() -> None:
    op.drop_index(op.f('ix_children_fiscal_code'), table_name='children')
    op.alter_column(
        'psychological_forms',
        'coach_notes',
        existing_type=sa.String(length=1000),
        type_=sa.String(length=255),
        existing_nullable=True
    )
