from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import admin, citas, galeria, profile, promos, recompensas, resenas, servicios, staff, uploads
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="AppSalon API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profile.router,    prefix="/api/v1/profile",    tags=["profile"])
app.include_router(servicios.router,  prefix="/api/v1/servicios",  tags=["servicios"])
app.include_router(staff.router,      prefix="/api/v1/staff",      tags=["staff"])
app.include_router(galeria.router,    prefix="/api/v1/galeria",    tags=["galeria"])
app.include_router(uploads.router,    prefix="/api/v1/uploads",    tags=["uploads"])
app.include_router(recompensas.router,prefix="/api/v1/recompensas",tags=["recompensas"])
app.include_router(promos.router,     prefix="/api/v1/promos",     tags=["promos"])
app.include_router(citas.router,      prefix="/api/v1/citas",      tags=["citas"])
app.include_router(resenas.router,    prefix="/api/v1/resenas",    tags=["resenas"])
app.include_router(admin.router,      prefix="/api/v1/admin",      tags=["admin"])


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok", "env": settings.app_env}
