from datetime import date, datetime, time
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field, field_validator


CitaEstado = Literal["pendiente", "confirmada", "cancelada", "completada"]


class CitaCreate(BaseModel):
    fecha: date
    hora: time
    servicio_ids: list[str] = Field(min_length=1)
    staff_id: str | None = None
    notas: str | None = Field(default=None, max_length=280)
    # Si el caller NO viene autenticado, estos 3 son obligatorios (validado
    # en el endpoint con OptionalUser). Si sí está autenticado, se ignoran.
    guest_nombre:   str | None = Field(default=None, max_length=120)
    guest_email:    str | None = Field(default=None, max_length=180)
    guest_telefono: str | None = Field(default=None, max_length=30)
    # Promo opcional. Sólo se aplica si hay user autenticado y la promo es
    # elegible (vigente, no excede max_canjes_por_usuario). Si no, se ignora.
    promo_id:       str | None = None

    @field_validator("fecha")
    @classmethod
    def no_finde(cls, v: date) -> date:
        if v.weekday() >= 5:
            raise ValueError("Sábado y domingo no permitidos")
        return v

    @field_validator("hora")
    @classmethod
    def horario_valido(cls, v: time) -> time:
        if not (time(10, 0) <= v < time(18, 0)):
            raise ValueError("Hora debe estar entre 10:00 y 18:00")
        return v


class CitaServicioOut(BaseModel):
    servicio_id: str
    nombre: str
    precio_snapshot: Decimal


class CitaOut(BaseModel):
    id: str
    usuario_id: str | None = None
    fecha: date
    hora: time
    estado: CitaEstado
    notas: str | None = None
    staff_id:     str | None = None
    staff_nombre: str | None = None
    servicios: list[CitaServicioOut] = []
    total: Decimal = Decimal("0.00")
    created_at: datetime


class CitaAdminOut(CitaOut):
    cliente_nombre: str
    cliente_apellido: str
    cliente_email: str | None = None
    cliente_telefono: str | None = None


class DisponibilidadOut(BaseModel):
    fecha: date
    ocupados: list[time]
