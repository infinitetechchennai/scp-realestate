from fastapi import APIRouter
from app.api.v1.endpoints import plots, projects

api_router = APIRouter()
api_router.include_router(plots.router, prefix="/plots", tags=["plots"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
