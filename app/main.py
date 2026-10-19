from fastapi import FastAPI
from app.routes import predict_routes
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="QuantLens API") #creating an app object

app.include_router(predict_routes.router)

@app.get('/')
def root():
    return {"message": "QuantLens API is running"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)