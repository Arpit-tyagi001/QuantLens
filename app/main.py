import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import predict_routes, commodity_routes, ipo_routes

app = FastAPI(title="QuantLens API")

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
