from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401 — ensures every table is registered on Base.metadata
from app.api.routes import api_router
from app.core.config import settings
from app.core.csrf_middleware import CSRFMiddleware
from app.db.seed_modules import seed_modules


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Schema is owned by Alembic migrations (see backend/alembic/), run as an
    # explicit deploy step (`alembic upgrade head`) — never auto-applied here,
    # since that's unsafe with multiple replicas booting concurrently.
    seed_modules()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

app.add_middleware(CSRFMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/health")
def health():
    return {"status": "ok", "app": settings.APP_NAME}
