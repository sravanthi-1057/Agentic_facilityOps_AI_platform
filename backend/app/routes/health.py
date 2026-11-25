from fastapi import APIRouter
from app.config import settings
from app.database.mysql import get_db_status
from app.database.mongodb import get_mongo_status

router = APIRouter(tags=["System Health"])

@router.get("/health")
def health_check():
    """
    Returns system operational status, database connectivity,
    and simulated IoT environment identification.
    """
    mysql_info = get_db_status()
    mongo_info = get_mongo_status()

    return {
        "status": "HEALTHY",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENV,
        "data_mode": "Simulated Smart Building IoT Telemetry" if settings.IS_SIMULATED else "Live IoT",
        "is_simulated": settings.IS_SIMULATED,
        "databases": {
            "sql_database": mysql_info,
            "document_database": mongo_info
        },
        "tariffs": {
            "electricity_usd_per_kwh": settings.ELECTRICITY_TARIFF_PER_KWH,
            "water_usd_per_litre": settings.WATER_TARIFF_PER_LITRE,
            "carbon_kg_co2_per_kwh": settings.CARBON_FACTOR_KG_PER_KWH
        }
    }
