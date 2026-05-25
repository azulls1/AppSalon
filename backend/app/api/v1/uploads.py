"""Endpoint de upload de imágenes a Supabase Storage.

El backend hace el upload con service_role (bypassa RLS de storage.objects).
Resulta más simple que configurar políticas RLS en una BD compartida con
muchas apps.
"""
import uuid
from urllib import request as urlrequest
from urllib.error import HTTPError

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from pydantic import BaseModel

from app.api.deps import AdminUser
from app.core.config import settings

router = APIRouter()

BUCKET = "appsalon-images"
ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_BYTES = 5 * 1024 * 1024  # 5 MB


class UploadOut(BaseModel):
    url: str
    path: str


@router.post("/image", response_model=UploadOut, status_code=status.HTTP_201_CREATED)
async def upload_image(_admin: AdminUser, file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(status_code=400, detail=f"Tipo no permitido: {file.content_type}")

    contents = await file.read()
    if len(contents) > MAX_BYTES:
        raise HTTPException(status_code=400, detail="Archivo mayor a 5 MB")
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Archivo vacío")

    ext = (file.filename or "").rsplit(".", 1)[-1].lower() or "jpg"
    # Sanitizar extensión
    if ext not in {"jpg", "jpeg", "png", "webp", "gif"}:
        ext = "jpg"

    path = f"{uuid.uuid4()}.{ext}"
    storage_url = f"{settings.supabase_url.rstrip('/')}/storage/v1/object/{BUCKET}/{path}"
    public_url = f"{settings.supabase_url.rstrip('/')}/storage/v1/object/public/{BUCKET}/{path}"

    req = urlrequest.Request(
        storage_url, method="POST",
        headers={
            "Authorization": f"Bearer {settings.supabase_service_role_key}",
            "apikey": settings.supabase_service_role_key,
            "Content-Type": file.content_type,
            "x-upsert": "true",
        },
        data=contents,
    )
    try:
        urlrequest.urlopen(req, timeout=30).read()
    except HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise HTTPException(status_code=500, detail=f"Storage error {e.code}: {body[:200]}")

    return UploadOut(url=public_url, path=path)
