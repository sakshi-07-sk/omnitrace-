from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import time
from backend.api.auth import get_current_user, RoleChecker
from backend.services.transaction_service import TransactionService
from backend.utils.helpers import write_audit_log

router = APIRouter(prefix="/transactions", tags=["Transactions"])
tx_service = TransactionService()

# Input Models
class TransactionInput(BaseModel):
    user_id: str = Field(..., example="ACC001")
    merchant_id: str = Field(..., example="MERCH001")
    amount: float = Field(..., example=25000.0)
    transaction_type: str = Field("UPI", example="UPI") # UPI, Credit Card, Debit Card, Wire Transfer
    location: str = Field("Bangalore", example="Bangalore")
    device_id: str = Field("DEV001", example="DEV001")
    timestamp: Optional[float] = None

class FeedbackInput(BaseModel):
    action: str = Field(..., example="Confirm Fraud") # Confirm Fraud, Dismiss Alert, Escalate
    comments: str = Field("", example="Confirmed account takeover velocity spike")

@router.post("/predict")
def predict_transaction(tx: TransactionInput):
    """
    Ingests and scores a transaction in real-time.
    RunsDNN, LSTM, Autoencoder, GNN and Transformer models.
    """
    start_time = time.time()
    tx_dict = tx.model_dump()
    if tx_dict["timestamp"] is None:
        tx_dict["timestamp"] = time.time()
        
    try:
        result = tx_service.ingest_and_score(tx_dict)
        latency = (time.time() - start_time) * 1000.0
        result["latency_ms"] = round(latency, 2)
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Scoring Engine Error: {str(e)}"
        )

@router.get("/history")
def get_transaction_history(
    limit: int = 50,
    offset: int = 0,
    user_id: Optional[str] = None,
    risk_level: Optional[str] = None,
    status_filter: Optional[str] = None,
    current_user: dict = Depends(RoleChecker(["Investigator", "Admin"]))
):
    """Fetches paginated transactions. Restricted to Investigators and Admins."""
    return tx_service.get_transactions_list(
        limit=limit, offset=offset, user_id=user_id, risk_level=risk_level, status=status_filter
    )

@router.get("/queue")
def get_investigation_queue(
    current_user: dict = Depends(RoleChecker(["Investigator", "Admin"]))
):
    """Fetches high-risk transactions waiting for analyst verification."""
    return tx_service.get_queue()

@router.post("/resolve/{transaction_id}")
def resolve_transaction(
    transaction_id: str,
    feedback: FeedbackInput,
    current_user: dict = Depends(RoleChecker(["Investigator", "Admin"]))
):
    """Resolves pending alerts. Updates the dataset labels for continuous model tuning."""
    success = tx_service.submit_feedback(
        tx_id=transaction_id,
        action=feedback.action,
        username=current_user["username"],
        comments=feedback.comments
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transaction not found or invalid resolution action."
        )
        
    write_audit_log(
        current_user["username"], 
        "RESOLVE_ALERT", 
        f"Resolved alert {transaction_id} as {feedback.action}. Analyst note: {feedback.comments}"
    )
    return {"message": f"Transaction {transaction_id} successfully marked as {feedback.action}."}

@router.get("/escrows")
def get_monitored_escrows(
    current_user: dict = Depends(RoleChecker(["Investigator", "Admin"]))
):
    """Retrieves 12-hour monitored escrows and fund movement paths."""
    return tx_service.get_monitored_escrows()

@router.post("/revert/{transaction_id}")
def revert_transaction_api(
    transaction_id: str,
    current_user: dict = Depends(RoleChecker(["Investigator", "Admin"]))
):
    """Reverts the transaction and returns funds to the original user."""
    success = tx_service.revert_transaction(transaction_id, current_user["username"])
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transaction not found or already reverted."
        )
    return {"message": f"Transaction {transaction_id} funds reverted successfully."}

class VerifyInput(BaseModel):
    status: str = Field(..., example="Verified") # Verified, Unverified
    method: str = Field(..., example="Face ID") # Face ID, OTP
    score: float = Field(0.95, example=0.95)

@router.post("/report-scam/{transaction_id}")
def report_scam_api(
    transaction_id: str,
    current_user: dict = Depends(RoleChecker(["Investigator", "Admin"]))
):
    """Flags transaction as reported scam and initiates 12-hour fund escrow monitoring."""
    success = tx_service.report_scam(transaction_id, current_user["username"])
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transaction not found."
        )
    return {"message": f"Transaction {transaction_id} reported as scam and placed under 12h monitoring."}

@router.post("/verify/{transaction_id}")
def verify_transaction_api(
    transaction_id: str,
    payload: VerifyInput,
    current_user: dict = Depends(RoleChecker(["Investigator", "Admin"]))
):
    """Verifies a transaction on adaptive hold using Face ID or OTP verification."""
    success = tx_service.verify_transaction(
        tx_id=transaction_id,
        status=payload.status,
        method=payload.method,
        score=payload.score,
        username=current_user["username"]
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transaction not found or already verified/expired."
        )
    return {"message": f"Transaction {transaction_id} verification processed successfully as {payload.status}."}
