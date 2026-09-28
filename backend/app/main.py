from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import auth, cases
from app.core.config import get_settings

app = FastAPI(title="PRISM API", version="0.1.0")
origins = get_settings().allowed_origins
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_origin_regex=r"http://localhost:\d+", allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.exception_handler(HTTPException)
async def http_error(_: Request, exc: HTTPException):
    detail = exc.detail if isinstance(exc.detail, dict) else {"code": "HTTP_ERROR", "message": str(exc.detail), "details": None}
    return JSONResponse(status_code=exc.status_code, content={"error": detail})

@app.exception_handler(Exception)
async def unexpected_error(_: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"error": {"code": "INTERNAL_ERROR", "message": "An unexpected error occurred", "details": None}})

@app.get("/health")
def health():
    return {"status": "ok"}

app.include_router(auth.router)
app.include_router(cases.router)
