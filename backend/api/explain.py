from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
import json
from backend.api.auth import get_current_user, RoleChecker
from backend.utils.helpers import get_db_connection
from backend.services.transaction_service import TransactionService

router = APIRouter(prefix="/explain", tags=["Explainability"])
tx_service = TransactionService()

@router.get("/{transaction_id}")
def get_transaction_explanation(
    transaction_id: str, 
    current_user: dict = Depends(RoleChecker(["Investigator", "Admin"]))
):
    """
    Fetches the deep neural explainability metrics for a transaction.
    Returns GNN cycles, attention maps, and custom Shapley values.
    """
    transaction_id = transaction_id.upper()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM transactions WHERE transaction_id = ?", (transaction_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction {transaction_id} not found."
        )
        
    tx_dict = dict(row)
    
    # Reconstruct transaction dict for SHAP explainer
    # We will compute SHAP values on-the-fly to get the exact contributions
    # relative to the baseline.
    hist = tx_service._get_user_history_from_db(tx_dict["user_id"], tx_dict["timestamp"])
    
    def model_predict_fn(f_dict):
        eval_tx = tx_dict.copy()
        eval_tx.update(f_dict)
        r = tx_service.engine.evaluate_transaction(eval_tx, hist, tx_service.gnn_graph)
        return r["fraud_score"]
        
    ex_res = tx_service.explainer.explain(tx_dict, model_predict_fn)
    
    # Re-evaluate to get attention weights and GNN cycles
    eval_res = tx_service.engine.evaluate_transaction(tx_dict, hist, tx_service.gnn_graph)
    
    # Prepare details
    return {
        "transaction_id": transaction_id,
        "user_id": tx_dict["user_id"],
        "merchant_id": tx_dict["merchant_id"],
        "merchant_name": tx_dict["merchant_name"],
        "merchant_category": tx_dict["merchant_category"],
        "amount": tx_dict["amount"],
        "location": tx_dict["location"],
        "device_id": tx_dict["device_id"],
        "timestamp": tx_dict["timestamp"],
        "transaction_type": tx_dict["transaction_type"],
        "fraud_score": tx_dict["fraud_score"],
        "risk_level": tx_dict["fraud_score"], # will be mapped in frontend
        "status": tx_dict["status"],
        "label": tx_dict["label"],
        "escalated": bool(tx_dict["escalated"]),
        "model_scores": {
            "dnn": tx_dict["dnn_score"],
            "lstm": tx_dict["lstm_score"],
            "autoencoder": tx_dict["autoencoder_score"],
            "gnn": tx_dict["gnn_score"],
            "transformer": tx_dict["transformer_score"]
        },
        "shapley": {
            "base_value": ex_res["base_value"],
            "prediction_value": ex_res["prediction_value"],
            "shap_values": ex_res["shap_values"],
            "explanations": json.loads(tx_dict["explanation"])
        },
        "attention_weights": eval_res["attention_weights"],
        "cycles_detected": eval_res["cycles_detected"],
        "sequence_history": [
            {
                "amount": h["amount"],
                "time_delta_sec": h["time_delta"],
                "location_anomaly": h["location_anomaly"],
                "device_anomaly": h["device_anomaly"],
                "merchant_category": "Transfer" if h["merchant_risk"] > 0.5 else "Groceries"
            } for h in hist
        ]
    }
