from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from backend.api.auth import get_current_user, RoleChecker
from backend.services.stats_service import StatsService
from backend.utils.helpers import get_db_connection, write_audit_log

router = APIRouter(prefix="/models", tags=["Model Governance"])
stats_service = StatsService()

class ThresholdUpdateRequest(BaseModel):
    fraud_threshold: float = Field(..., ge=0.01, le=0.99, example=0.70)
    auto_decline_threshold: float = Field(..., ge=0.01, le=0.99, example=0.90)

@router.get("/stats")
def get_model_statistics(current_user: dict = Depends(RoleChecker(["Admin", "Investigator"]))):
    """Exposes KPIs, drift trackers, and fraud trend datasets."""
    kpis = stats_service.get_kpis()
    trends = stats_service.get_fraud_trends()
    drift = stats_service.get_drift_metrics()
    return {
        "kpis": kpis,
        "trends": trends,
        "drift": drift
    }

@router.get("/thresholds")
def get_thresholds(current_user: dict = Depends(get_current_user)):
    """Fetches currently active fraud score decision limits."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT key, value FROM system_config")
    rows = cursor.fetchall()
    conn.close()
    
    config = {r["key"]: float(r["value"]) for r in rows}
    return config

@router.post("/thresholds")
def update_thresholds(
    req: ThresholdUpdateRequest, 
    current_user: dict = Depends(RoleChecker(["Admin"]))
):
    """Saves updated decision bounds. Restricted to Bank Admins."""
    if req.fraud_threshold >= req.auto_decline_threshold:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Fraud alert threshold must be lower than the Auto Decline threshold."
        )

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE system_config SET value = ? WHERE key = 'fraud_threshold'", (str(req.fraud_threshold),))
    cursor.execute("UPDATE system_config SET value = ? WHERE key = 'auto_decline_threshold'", (str(req.auto_decline_threshold),))
    conn.commit()
    conn.close()
    
    write_audit_log(
        current_user["username"],
        "UPDATE_THRESHOLDS",
        f"Modified settings: alert_threshold={req.fraud_threshold}, decline_threshold={req.auto_decline_threshold}"
    )
    
    return {"message": "System thresholds updated successfully."}

@router.get("/tradeoff")
def get_threshold_tradeoff_curve(current_user: dict = Depends(RoleChecker(["Admin", "Investigator"]))):
    """Returns False Positive and False Negative Rate data points for ROC dashboard chart."""
    return stats_service.get_threshold_tradeoff()

@router.get("/health")
def get_infrastructure_health(current_user: dict = Depends(RoleChecker(["SysAdmin", "Admin", "Investigator"]))):
    """Retrieves container list and CPU/RAM load."""
    return stats_service.get_system_health()

@router.get("/audit")
def get_audit_logs(current_user: dict = Depends(RoleChecker(["Admin", "Investigator"]))):
    """Retrieves security audit logs. Restricted to Bank Admins and Investigators."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]
