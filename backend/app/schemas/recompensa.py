from datetime import datetime

from pydantic import BaseModel, Field


class RecompensaBase(BaseModel):
    nombre:       str = Field(min_length=1, max_length=120)
    descripcion:  str | None = Field(default=None, max_length=500)
    puntos_costo: int = Field(gt=0, le=10000)
    foto_url:     str | None = None
    stock:        int | None = Field(default=None, ge=0)
    activa:       bool = True


class RecompensaCreate(RecompensaBase):
    pass


class RecompensaUpdate(BaseModel):
    nombre:       str | None = Field(default=None, min_length=1, max_length=120)
    descripcion:  str | None = Field(default=None, max_length=500)
    puntos_costo: int | None = Field(default=None, gt=0, le=10000)
    foto_url:     str | None = None
    stock:        int | None = Field(default=None, ge=0)
    activa:       bool | None = None


class RecompensaOut(RecompensaBase):
    id: str
    created_at: datetime
    updated_at: datetime


class CanjeOut(BaseModel):
    id: str
    usuario_id: str
    recompensa_id: str
    puntos_descontados: int
    estado: str
    codigo: str
    created_at: datetime
    recompensa_nombre: str | None = None


class CanjearOut(BaseModel):
    canje_id: str
    codigo: str
    puntos_restantes: int
