from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db, Facility, EnergyMeter

router = APIRouter(prefix="/facilities", tags=["Facilities & Meters"])

@router.get("", response_model=List[Dict[str, Any]])
def list_facilities(db: Session = Depends(get_db)):
    """Retrieves all registered smart building facilities with associated floors and meters."""
    facilities = db.query(Facility).all()
    results = []

    for fac in facilities:
        meters = db.query(EnergyMeter).filter(EnergyMeter.facility_id == fac.facility_id).all()
        floors = sorted(list({m.floor for m in meters}))
        results.append({
            "facility_id": fac.facility_id,
            "facility_name": fac.facility_name,
            "facility_type": fac.facility_type,
            "location": fac.location,
            "floors": floors,
            "meters_count": len(meters),
            "meters": [m.to_dict() for m in meters]
        })

    return results
