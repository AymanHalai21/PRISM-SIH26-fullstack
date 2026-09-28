"""Create the PRISM Phase 1 and 2 schema.

Document creation uses a two-step transaction: insert with a null current
version pointer, insert the immutable version, then update the pointer.
"""
from alembic import op
from app.db.session import Base
import app.models.models  # noqa: F401

revision = "0001_phase_1_2"
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    Base.metadata.create_all(bind=op.get_bind())
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS uq_case_assignments_active ON case_assignments (case_id, user_id, assignment_role) WHERE active = true")

def downgrade():
    Base.metadata.drop_all(bind=op.get_bind())
