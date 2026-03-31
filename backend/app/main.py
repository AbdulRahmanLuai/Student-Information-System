from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.initialize import create_db_and_tables, populate_sample_data
from .routers import auth, admin, teacher
from fastapi.middleware.cors import CORSMiddleware




@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup code (runs once
    create_db_and_tables()
    populate_sample_data()
    print("Startup complete")
    yield
    # Shutdown code (optional)
    print("Shutdown complete")

app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(teacher.router)
app.include_router(auth.router)
app.include_router(admin.router)

@app.get("/")
def health_check():
    return {"health": "ok"}
