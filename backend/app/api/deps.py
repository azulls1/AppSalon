from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from supabase import Client

from app.core.security import AuthUser, verify_supabase_jwt
from app.core.supabase import supabase_admin, supabase_user


def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
) -> AuthUser:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Falta header Authorization: Bearer <token>",
        )
    token = authorization.split(" ", 1)[1].strip()
    return verify_supabase_jwt(token)


CurrentUser = Annotated[AuthUser, Depends(get_current_user)]


def get_user_db(user: CurrentUser) -> Client:
    return supabase_user(user.access_token)


def get_admin_db() -> Client:
    return supabase_admin()


def require_admin(user: CurrentUser) -> AuthUser:
    """is_admin vive en appsalon_profiles."""
    db = supabase_admin()
    resp = db.table("appsalon_profiles").select("is_admin").eq("id", user.id).single().execute()
    if not resp.data or not resp.data.get("is_admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Requiere admin")
    return user


AdminUser = Annotated[AuthUser, Depends(require_admin)]
UserDB = Annotated[Client, Depends(get_user_db)]
AdminDB = Annotated[Client, Depends(get_admin_db)]
