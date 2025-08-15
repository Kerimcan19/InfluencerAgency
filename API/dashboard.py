from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from core.models import Company, User, Report, Campaign, ActivityLog
from core.schemas import CompanyCreate, CompanyOut, CompanyListResponse, DashboardSummaryResponse, ActivityOut
from usecases.auth_use import get_current_user
from typing import Optional, List
from datetime import datetime

router = APIRouter()

@router.get("/dashboard/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    company_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    user = db.query(User).filter(User.id == current_user["sub"]).first()

    # restrict to company
    if user.role not in ["admin", "company"]:
        raise HTTPException(status_code=403)

    company_id = user.company_id if user.role == "company" else None

    base_query = db.query(Report)
    if user.role == "admin":
        if company_id:
            base_query = base_query.filter(Report.company_id == company_id)
    else:
        base_query = base_query.filter(Report.company_id == user.company_id)

    total_sales = base_query.with_entities(func.sum(Report.totalSales)).scalar() or 0
    total_clicks = base_query.with_entities(func.sum(Report.totalClicks)).scalar() or 0
    total_commission = base_query.with_entities(func.sum(Report.brandCommissionAmount)).scalar() or 0
    active_campaigns = db.query(Campaign).filter(
        Campaign.endDate >= datetime.utcnow()
    )
    if company_id:
        active_campaigns = active_campaigns.filter(Campaign.company_id == company_id)

    count_active = active_campaigns.count()

    return {
        "activeCampaigns": count_active,
        "totalClicks": total_clicks,
        "totalSales": total_sales,
        "totalCommission": total_commission
    }

@router.get("/dashboard/activity", response_model=List[ActivityOut])
def get_activity_feed(
    company_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    user = db.query(User).filter(User.id == current_user["sub"]).first()

    if user.role not in ["admin", "company"]:
        raise HTTPException(status_code=403)

    query = db.query(ActivityLog).order_by(ActivityLog.timestamp.desc()).limit(10)

    if user.role == "admin":
        if company_id:
            query = query.filter(ActivityLog.company_id == company_id)
    else:
        query = query.filter(ActivityLog.company_id == user.company_id)

    return query.all()




