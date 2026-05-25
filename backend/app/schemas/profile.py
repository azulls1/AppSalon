from datetime import datetime

from pydantic import BaseModel, Field


class ProfileBase(BaseModel):
    nombre: str = Field(min_length=1, max_length=60)
    apellido: str = Field(min_length=1, max_length=60)
    telefono: str | None = Field(default=None, max_length=20)


class ProfileUpdate(ProfileBase):
    pass


class ProfileOut(ProfileBase):
    id: str
    is_admin: bool
    puntos: int = 0
    created_at: datetime
    updated_at: datetime
