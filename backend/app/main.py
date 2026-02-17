from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.initialize import create_db_and_tables, populate_sample_data
from .routers import auth, course_offerings, admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup code (runs once)
    create_db_and_tables()
    populate_sample_data()
    print("Startup complete")
    yield
    # Shutdown code (optional)
    print("Shutdown complete")

app = FastAPI(lifespan=lifespan)
app.include_router(course_offerings.router)
app.include_router(auth.router)
app.include_router(admin.router)

@app.get("/")
def health_check():
    return {"health": "ok"}
