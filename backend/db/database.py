from sqlmodel import create_engine, Session, SQLModel
from core.config import create_settings
from contextlib import contextmanager

settings = create_settings()
# create_triggers()
engine = create_engine(
    url=settings.POSTGRES_URL,
    echo=settings.DB_ECHO_LOG,
    future=True,
    pool_pre_ping=True,
    connect_args={
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    },
)


def get_db() -> Session:  # easier debugging
    try:
        with Session(engine) as session:
            yield session
            session.commit()
    except Exception:
        session.rollback()
        raise


@contextmanager
def get_db_context_managed() -> Session:
    session = Session(engine)
    try:
        yield session
        session.commit()
    except Exception as e:
        session.rollback()
        # Optionally, log the exception here
        raise e
    finally:
        session.close()
