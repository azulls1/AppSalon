"""Tests de validación de schemas (no requieren red ni Supabase)."""
from datetime import date, time

import pytest
from pydantic import ValidationError

from app.schemas.cita import CitaCreate


def test_cita_create_ok():
    c = CitaCreate(fecha=date(2030, 1, 7), hora=time(10, 30), servicio_ids=["uuid-1"])
    assert c.fecha.year == 2030


def test_cita_rechaza_fines_de_semana():
    # 2030-01-05 es sábado
    with pytest.raises(ValidationError) as exc:
        CitaCreate(fecha=date(2030, 1, 5), hora=time(10, 30), servicio_ids=["x"])
    assert "Sábado" in str(exc.value) or "finde" in str(exc.value).lower()


def test_cita_rechaza_hora_temprana():
    with pytest.raises(ValidationError):
        CitaCreate(fecha=date(2030, 1, 7), hora=time(9, 30), servicio_ids=["x"])


def test_cita_rechaza_hora_tarde():
    with pytest.raises(ValidationError):
        CitaCreate(fecha=date(2030, 1, 7), hora=time(18, 30), servicio_ids=["x"])


def test_cita_requiere_al_menos_un_servicio():
    with pytest.raises(ValidationError):
        CitaCreate(fecha=date(2030, 1, 7), hora=time(10, 30), servicio_ids=[])
