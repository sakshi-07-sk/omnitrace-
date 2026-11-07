from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional, Dict, Any
from backend.api.auth import RoleChecker
from backend.services.fraud_investigation_service import FraudInvestigationService

router = APIRouter(prefix="/investigation", tags=["Investigation & Analytics"])
investigation_service = FraudInvestigationService()

@router.get("/dashboard")
def get_fraud_dashboard(
    current_user: dict = Depends(RoleChecker(["Investigator", "Admin"]))
):
    """
    Fetches key fraud metrics for the investigation dashboard.
    Includes fraud rate, pending investigations, and risk distribution.
    """
    try:
        metrics = investigation_service.get_dashboard_metrics()
        return {
            "status": "success",
            "data": metrics
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Dashboard Error: {str(e)}"
        )


@router.get("/live-transactions")
def get_live_transaction_monitoring(
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(RoleChecker(["Investigator", "Admin"]))
):
    """
    Fetches recent transactions for live monitoring.
    Shows real-time transaction activity with fraud scores.
    """
    try:
        data = investigation_service.get_live_transactions(limit=limit)
        return {
            "status": "success",
            "data": data
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Live Monitoring Error: {str(e)}"
        )


@router.get("/alert-queue")
def get_fraud_alert_queue(
    limit: int = Query(50, ge=1, le=500),
    current_user: dict = Depends(RoleChecker(["Investigator", "Admin"]))
):
    """
    Fetches pending fraud alerts for investigation queue.
    Prioritizes by fraud score and shows escalation status.
    """
    try:
        queue = investigation_service.get_fraud_alert_queue(limit=limit)
        return {
            "status": "success",
            "data": queue
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Alert Queue Error: {str(e)}"
        )


@router.get("/geolocation-heatmap")
def get_geolocation_fraud_heatmap(
    current_user: dict = Depends(RoleChecker(["Investigator", "Admin"]))
):
    """
    Fetches geolocation-based fraud data for heatmap visualization.
    Shows fraud concentration by location with statistics.
    """
    try:
        heatmap = investigation_service.get_geolocation_heatmap()
        return {
            "status": "success",
            "data": heatmap
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Heatmap Error: {str(e)}"
        )


@router.get("/risk-analytics")
def get_risk_score_analytics(
    current_user: dict = Depends(RoleChecker(["Investigator", "Admin"]))
):
    """
    Provides detailed risk score analytics and distributions.
    Includes model comparison and risk level breakdown.
    """
    try:
        analytics = investigation_service.get_risk_score_analytics()
        return {
            "status": "success",
            "data": analytics
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Risk Analytics Error: {str(e)}"
        )


@router.get("/fraud-trends")
def get_fraud_trend_report(
    days: int = Query(30, ge=1, le=365),
    current_user: dict = Depends(RoleChecker(["Investigator", "Admin"]))
):
    """
    Generates fraud trend report for specified time period.
    Includes daily/weekly trends and category-based analysis.
    """
    try:
        trends = investigation_service.get_fraud_trend_report(days=days)
        return {
            "status": "success",
            "data": trends
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Trend Report Error: {str(e)}"
        )


@router.get("/transaction-history/{user_id}")
def get_user_transaction_history(
    user_id: str,
    limit: int = Query(100, ge=1, le=500),
    current_user: dict = Depends(RoleChecker(["Investigator", "Admin"]))
):
    """
    Analyzes transaction history for a specific user.
    Shows user statistics and recent transactions with fraud scores.
    """
    try:
        history = investigation_service.get_transaction_history_analysis(
            user_id=user_id, 
            limit=limit
        )
        if "error" in history:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=history["error"]
            )
        return {
            "status": "success",
            "data": history
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Transaction History Error: {str(e)}"
        )


@router.get("/explainable-report/{transaction_id}")
def get_explainable_ai_report(
    transaction_id: str,
    current_user: dict = Depends(RoleChecker(["Investigator", "Admin"]))
):
    """
    Generates detailed explainable AI report for a transaction.
    Includes SHAP values, model scores, and identified risk factors.
    """
    try:
        report = investigation_service.get_explainable_report(transaction_id=transaction_id)
        if "error" in report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=report["error"]
            )
        return {
            "status": "success",
            "data": report
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Explainable Report Error: {str(e)}"
        )
