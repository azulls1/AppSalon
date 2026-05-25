from dataclasses import dataclass

from fastapi import HTTPException, status
from jose import JWTError, jwt

from app.core.config import settings


@dataclass(frozen=True)
class AuthUser:
    id: str
    email: str | None
    access_token: str


def verify_supabase_jwt(token: str) -> AuthUser:
    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token inválido: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token sin sub")

    return AuthUser(id=user_id, email=payload.get("email"), access_token=token)
