import os
import time
import threading
from collections import defaultdict
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.routes import predict_routes, commodity_routes, ipo_routes

app = FastAPI(title="QuantLens API")


# Thread-safe in-memory sliding-window rate limiter
class InMemoryRateLimiter:
    def __init__(self, max_requests: int = 120, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(list)
        self.lock = threading.Lock()

    def is_allowed(self, client_ip: str) -> bool:
        now = time.time()
        with self.lock:
            timestamps = self.requests[client_ip]
            cutoff = now - self.window_seconds
            # Prune expired request timestamps
            self.requests[client_ip] = [t for t in timestamps if t > cutoff]
            if len(self.requests[client_ip]) >= self.max_requests:
                return False
            self.requests[client_ip].append(now)
            return True


rate_limiter = InMemoryRateLimiter(max_requests=120, window_seconds=60)


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Allow CORS preflight requests without throttling
    if request.method == "OPTIONS":
        return await call_next(request)

    # Resolve real client IP behind reverse proxy / Render / Vercel
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()
    elif request.client:
        client_ip = request.client.host
    else:
        client_ip = "127.0.0.1"

    if not rate_limiter.is_allowed(client_ip):
        return JSONResponse(
            status_code=429,
            content={
                "detail": "Rate limit exceeded. Please limit your requests to 120 per minute."
            },
        )

    return await call_next(request)


# Register routers
app.include_router(predict_routes.router)
app.include_router(commodity_routes.router)
app.include_router(ipo_routes.router)


@app.get("/")
def root():
    return {"message": "QuantLens API is running"}


raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000",
)
allowed_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)
