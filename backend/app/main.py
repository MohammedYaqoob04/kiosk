"""KIOSK backend entry point.  Run:  uvicorn app.main:app --reload"""
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

import os
import sys

_BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _BASE_DIR not in sys.path:
    sys.path.insert(0, _BASE_DIR)

try:
    from .config import get_settings
    from .routers import audit_log, auth, hod, leave, notices, staff, student
except ImportError:
    from app.config import get_settings
    from app.routers import audit_log, auth, hod, leave, notices, staff, student


settings = get_settings()
is_prod = settings.env == "production"

app = FastAPI(title="KIOSK API", version="1.0.0",
              docs_url=None if is_prod else "/docs", redoc_url=None, openapi_url=None if is_prod else "/openapi.json")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_credentials=False,  # tokens travel in the Authorization header, not cookies
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def no_cache_and_hardening(request: Request, call_next):
    response = await call_next(request)
    # A shared kiosk must never keep a student's data in a cache.
    response.headers["Cache-Control"] = "no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response


@app.exception_handler(StarletteHTTPException)
async def http_error(_: Request, exc: StarletteHTTPException):
    """Errors are always {code, message}: the kiosk's API client reads exactly those two keys."""
    detail = exc.detail
    if isinstance(detail, dict) and "message" in detail:
        body = {"code": detail.get("code", "ERROR"), "message": detail["message"]}
    else:
        body = {"code": "NOT_FOUND" if exc.status_code == 404 else "ERROR", "message": str(detail)}
    return JSONResponse(body, status_code=exc.status_code, headers=getattr(exc, "headers", None))


@app.exception_handler(RequestValidationError)
async def validation_error(_: Request, exc: RequestValidationError):
    fields = [{"field": ".".join(str(p) for p in e["loc"][1:]) or str(e["loc"][0]),
               "message": str(e["msg"]).removeprefix("Value error, ")} for e in exc.errors()]
    first = fields[0]["message"] if fields else "Invalid request."
    return JSONResponse({"code": "VALIDATION_ERROR", "message": first, "fields": fields}, status_code=422)


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok"}


API = "/api/v1"
for r in (auth.router, student.router, leave.router, staff.router, hod.router, notices.router, audit_log.router):
    app.include_router(r, prefix=API)
