from datetime import datetime

from pydantic import BaseModel, Field


class GaleriaBase(BaseModel):
    titulo:            str = Field(min_length=1, max_length=120)
    descripcion:       str | None = Field(default=None, max_length=500)
    foto_antes_url:    str = Field(min_length=4)
    foto_despues_url:  str = Field(min_length=4)
    servicio_id:       str | None = None
    activa:            bool = True


class GaleriaCreate(GaleriaBase):
    pass


class GaleriaUpdate(BaseModel):
    titulo:            str | None = Field(default=None, min_length=1, max_length=120)
    descripcion:       str | None = Field(default=None, max_length=500)
    foto_antes_url:    str | None = None
    foto_despues_url:  str | None = None
    servicio_id:       str | None = None
    activa:            bool | None = None


class GaleriaOut(GaleriaBase):
    id: str
    created_at: datetime
    updated_at: datetime
