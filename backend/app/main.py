import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database.mysql import init_sql_database, SessionLocal
from app.database.mongodb import init_mongo_database
from app.database.models import EnergyUsage, Asset
from app.routes.health import router as health_router
from app.routes.facilities import router as facilities_router
from app.routes.energy import router as energy_router, seed_simulated_data
from app.routes.agent import router as agent_router
from app.routes.maintenance import router as maintenance_router
from app.services.asset_simulator import asset_simulator

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("facilityops")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup sequence
    logger.info("Initializing Agentic FacilityOps AI Platform Backend...")
    init_sql_database()
    init_mongo_database()

    # Check if database needs initial seeding
    if SessionLocal:
        db = SessionLocal()
        try:
            count = db.query(EnergyUsage).count()
            if count == 0:
                logger.info("Database empty. Auto-seeding 35 days of simulated Smart Building IoT telemetry...")
                seed_res = seed_simulated_data(days=35, db=db)
                logger.info(f"Auto-seed completed: {seed_res['total_records_inserted']} records inserted.")
            else:
                logger.info(f"Database already contains {count} telemetry records.")

            # Check if assets need initial seeding
            asset_count = db.query(Asset).count()
            if asset_count == 0:
                logger.info("Assets table empty. Seeding facility equipment assets & predictive maintenance data...")
                asset_simulator.seed_initial_assets(db)
                logger.info("Asset seeding completed.")
            else:
                logger.info(f"Database contains {asset_count} facility equipment assets.")
        except Exception as e:
            logger.error(f"Error during startup check: {e}")
        finally:
            db.close()

    yield
    logger.info("Shutting down Agentic FacilityOps AI Platform...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Agentic AI-powered Facility Operations Platform for Energy Intelligence, Monitoring, Anomaly Detection, and Optimization.",
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers under /api
app.include_router(health_router, prefix=settings.API_PREFIX)
app.include_router(facilities_router, prefix=settings.API_PREFIX)
app.include_router(energy_router, prefix=settings.API_PREFIX)
app.include_router(agent_router, prefix=settings.API_PREFIX)
app.include_router(maintenance_router, prefix=settings.API_PREFIX)

@app.get("/")
def root():
    return {
        "message": "Welcome to Agentic FacilityOps AI Platform API",
        "docs_url": "/docs",
        "health_check": f"{settings.API_PREFIX}/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
