from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api import auth, transactions, models_api, explain, investigation
from backend.utils.helpers import init_db, logger

app = FastAPI(
    title="OmniTrace Fraud Detection & Intelligence API",
    description="Real-time financial fraud risk scoring, neural networks, and SHAP explainability insights.",
    version="1.0.0"
)

# Configure CORS for React/Vite local frontend (usually localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development, allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api")
app.include_router(transactions.router, prefix="/api")
app.include_router(models_api.router, prefix="/api")
app.include_router(explain.router, prefix="/api")
app.include_router(investigation.router, prefix="/api")

@app.on_event("startup")
def startup_event():
    logger.info("OmniTrace FastAPI Server Starting Up...")
    init_db()

@app.get("/api/healthz")
def health_check():
    return {
        "status": "healthy",
        "service": "OmniTrace Engine",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app:app", host="127.0.0.1", port=8000, reload=True)
