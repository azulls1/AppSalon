from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class ServicioBase(BaseModel):
    nombre: str = Field(min_length=1, max_length=120)
    precio: Decimal = Field(ge=0, max_digits=10, decimal_places=2)
    duracion_min: int = Field(default=30, ge=5, le=480)
    activo: bool = True


class ServicioCreate(ServicioBase):
    pass


class ServicioUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=1, max_length=120)
    precio: Decimal | None = Field(default=None, ge=0, max_digits=10, decimal_places=2)
    duracion_min: int | None = Field(default=None, ge=5, le=480)
    activo: bool | None = None


class ServicioOut(ServicioBase):
    id: str
    created_at: datetime
    updated_at: datetime
