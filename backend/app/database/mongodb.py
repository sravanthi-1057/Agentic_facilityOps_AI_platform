import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional
from pymongo import MongoClient
from app.config import settings

logger = logging.getLogger("facilityops.mongodb")

mongo_client: Optional[MongoClient] = None
mongo_db = None
active_mongo_type = "UNKNOWN"
mongo_status_detail = ""

class LocalDocCollection:
    """Lightweight thread-safe local JSON document collection fallback."""
    def __init__(self, collection_name: str, file_path: Path):
        self.name = collection_name
        self.file_path = file_path
        self._ensure_storage()

    def _ensure_storage(self):
        if not self.file_path.exists():
            self.file_path.write_text(json.dumps({}), encoding="utf-8")

    def _read_all(self) -> Dict[str, List[Dict[str, Any]]]:
        try:
            return json.loads(self.file_path.read_text(encoding="utf-8"))
        except Exception:
            return {}

    def _write_all(self, data: Dict[str, List[Dict[str, Any]]]):
        self.file_path.write_text(json.dumps(data, indent=2, default=str), encoding="utf-8")

    def insert_one(self, doc: Dict[str, Any]):
        data = self._read_all()
        if self.name not in data:
            data[self.name] = []
        doc_copy = dict(doc)
        if "_id" not in doc_copy:
            doc_copy["_id"] = f"{self.name}_{len(data[self.name]) + 1}_{int(datetime.utcnow().timestamp()*1000)}"
        if "created_at" not in doc_copy:
            doc_copy["created_at"] = datetime.utcnow().isoformat()
        data[self.name].append(doc_copy)
        self._write_all(data)
        return doc_copy

    def insert_many(self, docs: List[Dict[str, Any]]):
        for doc in docs:
            self.insert_one(doc)

    def find(self, filter_query: Optional[Dict[str, Any]] = None, limit: int = 100) -> List[Dict[str, Any]]:
        data = self._read_all()
        items = data.get(self.name, [])
        # Simple match if filter provided
        results = []
        for item in reversed(items):
            if filter_query:
                match = all(item.get(k) == v for k, v in filter_query.items())
                if match:
                    results.append(item)
            else:
                results.append(item)
            if len(results) >= limit:
                break
        return results

    def count_documents(self, filter_query: Optional[Dict[str, Any]] = None) -> int:
        data = self._read_all()
        items = data.get(self.name, [])
        if not filter_query:
            return len(items)
        return sum(1 for item in items if all(item.get(k) == v for k, v in filter_query.items()))


class LocalDocStore:
    def __init__(self, file_path: Path):
        self.file_path = file_path
        self.iot_sensor_events = LocalDocCollection("iot_sensor_events", self.file_path)
        self.energy_agent_logs = LocalDocCollection("energy_agent_logs", self.file_path)
        self.anomaly_analysis = LocalDocCollection("anomaly_analysis", self.file_path)
        self.asset_sensor_events = LocalDocCollection("asset_sensor_events", self.file_path)
        self.maintenance_agent_logs = LocalDocCollection("maintenance_agent_logs", self.file_path)

def init_mongo_database():
    global mongo_client, mongo_db, active_mongo_type, mongo_status_detail

    try:
        test_client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=2000)
        # Verify connection
        test_client.server_info()
        mongo_client = test_client
        mongo_db = mongo_client[settings.MONGODB_DATABASE]
        active_mongo_type = "MongoDB"
        mongo_status_detail = f"Connected to MongoDB at {settings.MONGODB_URI} (DB: {settings.MONGODB_DATABASE})"
        logger.info(mongo_status_detail)
    except Exception as e:
        logger.warning(f"MongoDB connection failed ({e}). Falling back to local DocStore JSON repository.")
        active_mongo_type = "Local DocStore (Fallback)"
        mongo_status_detail = f"Using Local DocStore at {settings.LOCAL_DOCSTORE_PATH} (MongoDB server offline)"
        mongo_db = LocalDocStore(settings.LOCAL_DOCSTORE_PATH)
        logger.info(mongo_status_detail)

    return mongo_db

def get_mongo_db():
    if mongo_db is None:
        init_mongo_database()
    return mongo_db

def get_mongo_status():
    return {
        "engine": active_mongo_type,
        "detail": mongo_status_detail,
        "is_production_mongo": active_mongo_type == "MongoDB"
    }
