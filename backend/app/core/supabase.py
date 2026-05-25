from functools import lru_cache

from supabase import Client, create_client

from app.core.config import settings


@lru_cache
def supabase_admin() -> Client:
    """Cliente con service_role key — bypassa RLS. Solo server-side."""
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def supabase_user(access_token: str) -> Client:
    """Cliente que actúa en nombre del usuario (respeta RLS)."""
    client = create_client(settings.supabase_url, settings.supabase_anon_key)
    client.postgrest.auth(access_token)
    return client
