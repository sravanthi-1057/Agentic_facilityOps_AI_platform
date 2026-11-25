import os
from pathlib import Path
from dotenv import load_dotenv

# Base paths
BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_DIR = BASE_DIR.parent
DATA_DIR = PROJECT_DIR / "data"

# Ensure data directory exists
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Load .env file
load_dotenv(PROJECT_DIR / ".env")

class Settings:
    PROJECT_NAME: str = "Agentic FacilityOps AI Platform"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    DATA_DIR: Path = DATA_DIR
    BASE_DIR: Path = BASE_DIR
    PROJECT_DIR: Path = PROJECT_DIR
    
    # Environment
    ENV: str = os.getenv("ENV", "development")
    IS_SIMULATED: bool = True  # Explicitly identified as simulated IoT data
    
    # MySQL Database Config
    MYSQL_HOST: str = os.getenv("MYSQL_HOST", "localhost")
    MYSQL_PORT: int = int(os.getenv("MYSQL_PORT", 3306))
    MYSQL_USER: str = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD: str = os.getenv("MYSQL_PASSWORD", "")
    MYSQL_DATABASE: str = os.getenv("MYSQL_DATABASE", "facilityops")
    
    # SQLite Fallback DB path
    SQLITE_DB_PATH: Path = DATA_DIR / "facilityops.db"
    
    # MongoDB Config
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    MONGODB_DATABASE: str = os.getenv("MONGODB_DATABASE", "facilityops_raw")
    LOCAL_DOCSTORE_PATH: Path = DATA_DIR / "docstore.json"
    
    # Energy Tariffs & Carbon Factors (configurable assumptions)
    ELECTRICITY_TARIFF_PER_KWH: float = float(os.getenv("ELECTRICITY_TARIFF_PER_KWH", 0.14)) # USD / kWh
    WATER_TARIFF_PER_LITRE: float = float(os.getenv("WATER_TARIFF_PER_LITRE", 0.004))       # USD / Litre
    CARBON_FACTOR_KG_PER_KWH: float = float(os.getenv("CARBON_FACTOR_KG_PER_KWH", 0.42))     # kg CO2 / kWh
    
    # Optional LLM Config (application remains 100% functional without an API key)
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

settings = Settings()
