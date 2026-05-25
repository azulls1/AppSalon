from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field


PromoTipo = Literal[
    "descuento_pct",      # % de descuento sobre el total
    "descuento_fijo",     # monto fijo en MXN
    "servicio_gratis",    # un servicio sin costo
    "producto_gratis",    # un producto sin costo
]


class PromoBase(BaseModel):
    titulo:                 str = Field(min_length=1, max_length=120)
    descripcion:            str | None = Field(default=None, max_length=500)
    tipo:                   PromoTipo
    valor:                  Decimal = Field(default=Decimal("0"), ge=0)
    vigencia_inicio:        date | None = None
    vigencia_fin:           date | None = None
    min_visitas:            int = Field(default=0, ge=0)
    min_puntos:             int = Field(default=0, ge=0)
    max_canjes_por_usuario: int = Field(default=1, ge=1, le=99)
    codigo:                 str | None = Field(default=None, max_length=40)
    imagen_url:             str | None = None
    destacada:              bool = False
    activa:                 bool = True


class PromoCreate(PromoBase):
    pass


class PromoUpdate(BaseModel):
    titulo:                 str | None = Field(default=None, min_length=1, max_length=120)
    descripcion:            str | None = Field(default=None, max_length=500)
    tipo:                   PromoTipo | None = None
    valor:                  Decimal | None = Field(default=None, ge=0)
    vigencia_inicio:        date | None = None
    vigencia_fin:           date | None = None
    min_visitas:            int | None = Field(default=None, ge=0)
    min_puntos:             int | None = Field(default=None, ge=0)
    max_canjes_por_usuario: int | None = Field(default=None, ge=1, le=99)
    codigo:                 str | None = Field(default=None, max_length=40)
    imagen_url:             str | None = None
    destacada:              bool | None = None
    activa:                 bool | None = None


class PromoOut(PromoBase):
    id:         str
    created_at: datetime
    updated_at: datetime


class PromoCliente(PromoOut):
    """Promo aumentada con info de elegibilidad del cliente actual."""
    elegible:        bool = True
    canjes_usados:   int = 0   # cuántas veces el cliente ya canjeó esta promo
    motivo_no_elegible: str | None = None  # "Faltan 2 visitas", "Vigencia terminada", etc.
