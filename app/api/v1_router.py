from fastapi import APIRouter
from app.api.endpoints import predict  # Adjust import path to match your project structure

v1_router = APIRouter(prefix="/api/v1")

# Include sub-routers
v1_router.include_router(predict.router)
# v1_router.include_router(athletes.router) ... etc.