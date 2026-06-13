from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import explore, learn, first_pr, ask

app = FastAPI(
    title="CodeFlow 2.0 API",
    version="1.0.0",
    description="AI-powered developer onboarding platform"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://your-frontend.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register v1 routers
app.include_router(explore.router, prefix="/api/v1")
app.include_router(learn.router, prefix="/api/v1")
app.include_router(first_pr.router, prefix="/api/v1")
app.include_router(ask.router, prefix="/api/v1")

@app.get("/")
async def root():
    return {
        "message": "CodeFlow 2.0 API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}
