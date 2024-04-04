"""feedback table

Revision ID: a8c52a4404ed
Revises: 8bfb3b2a3c37
Create Date: 2024-02-01 17:41:04.717454

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "a8c52a4404ed"
down_revision: Union[str, None] = "8bfb3b2a3c37"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column(
        "feedback",
        sa.Column(
            "advice_on_variance_categories",
            postgresql.ARRAY(sa.String()),
            nullable=True,
        ),
    )
    op.drop_column("feedback", "advice_on_variance_categorys")
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column(
        "feedback",
        sa.Column(
            "advice_on_variance_categorys",
            postgresql.ARRAY(sa.VARCHAR()),
            autoincrement=False,
            nullable=True,
        ),
    )
    op.drop_column("feedback", "advice_on_variance_categories")
    # ### end Alembic commands ###