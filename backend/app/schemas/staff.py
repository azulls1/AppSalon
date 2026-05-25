from datetime import datetime

from pydantic import BaseModel, Field


class StaffBase(BaseModel):
    nombre:       str = Field(min_length=1, max_length=60)
    apellido:     str = Field(min_length=1, max_length=60)
    especialidad: str = Field(min_length=1, max_length=120)
    bio:          str | None = Field(default=None, max_length=500)
    foto_url:     str | None = None
    instagram:    str | None = Field(default=None, max_length=60)
    activo:       bool = True


class StaffCreate(StaffBase):
    pass


class StaffUpdate(BaseModel):
    nombre:       str | None = Field(default=None, min_length=1, max_length=60)
    apellido:     str | None = Field(default=None, min_length=1, max_length=60)
    especialidad: str | None = Field(default=None, min_length=1, max_length=120)
    bio:          str | None = Field(default=None, max_length=500)
    foto_url:     str | None = None
    instagram:    str | None = Field(default=None, max_length=60)
    activo:       bool | None = None


class StaffOut(StaffBase):
    id: str
    created_at: datetime
    updated_at: datetime


class StaffConStats(StaffOut):
    rating_promedio: float | None = None
    total_resenas:   int = 0


# ---------- Reseñas

class ResenaCreate(BaseModel):
    cita_id:    str
    rating:     int = Field(ge=1, le=5)
    comentario: str | None = Field(default=None, max_length=500)


class ResenaOut(BaseModel):
    id:           str
    cita_id:      str
    usuario_id:   str
    staff_id:     str | None
    rating:       int
    comentario:   str | None
    created_at:   datetime
    cliente_nombre: str | None = None
