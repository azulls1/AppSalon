# syntax=docker/dockerfile:1.7
FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_LINK_MODE=copy

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:0.5 /uv /usr/local/bin/uv

COPY pyproject.toml ./
RUN uv sync --no-dev --no-install-project

COPY celery_app.py config.py mailer.py ./
COPY tasks ./tasks
COPY templates ./templates

CMD ["uv", "run", "celery", "-A", "celery_app", "worker", "-l", "info"]
