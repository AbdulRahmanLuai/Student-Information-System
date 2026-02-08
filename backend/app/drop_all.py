from config import settings
from sqlalchemy import create_engine
from sqlmodel import SQLModel
import models



engine = create_engine(settings.DATABASE_URL)
SQLModel.metadata.drop_all(engine)
print("tables dropped")