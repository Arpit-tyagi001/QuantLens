from fastapi import FastAPI
from app.routes import predict_routes

app = FastAPI(title="QuantLens API") #creating an app object

app.include_router(predict_routes.router)

@app.get('/')
def root():
    return {"message": "QuantLens API is running"}