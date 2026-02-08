from sqlmodel import Session, create_engine
from datetime import date
from app.models import (
    Department, Teacher, Course, Section,
    Semester, Student, CourseOffering, Enrollment
)
from sqlmodel import Session
from typing import Generator
from app.config import settings
from app import utils

# --- Setup Engine ---
engine = create_engine(settings.DATABASE_URL)

def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session

