"""FastAPI application entrypoint for AI Learning Adventure."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.session import init_db
from app.routes import worlds_router, stages_router, progress_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize SQLite schema
    await init_db()
    yield

app = FastAPI(
    title="🌟 AI Learning Adventure API",
    description="Multi-Agent AI Educational Game Backend for Preschoolers (Ages 3-6)",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(worlds_router)
app.include_router(stages_router)
app.include_router(progress_router)

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "game": "AI Learning Adventure",
        "companion": "Milo the Bunny 🐰",
        "active_world": "Colors 🌈",
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
