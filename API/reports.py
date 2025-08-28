from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session, selectinload
from API import user
from database import get_db
from core.models import Report, Campaign, User, Influencer, ActivityLog
from core.schemas import ReportCreate, ReportOut, ReportListResponse
from usecases.auth_use import get_current_user
from decimal import Decimal
from typing import Optional
from datetime import datetime, timedelta
import logging
logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/reports/create", response_model=ReportOut, tags=["Reports"])
def create_report(
    report_in: ReportCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    user = db.query(User).filter(User.id == current_user["sub"]).first()

    # Role-based permission
    if not user or user.role not in ["admin", "influencer"]:
        raise HTTPException(status_code=403, detail="Unauthorized role")

    # If the caller is an influencer, map their User -> Influencer.id
    if user.role == "influencer":
        infl = db.query(Influencer).filter(Influencer.user_id == user.id).first()
        if not infl:
            raise HTTPException(status_code=404, detail="Influencer profile not found")
        report_in.influencer_id = infl.id

    # Admin must provide a valid influencerId if not set already
    if not report_in.influencer_id:
        raise HTTPException(status_code=400, detail="influencer id is required")

    # Validate campaign
    campaign = db.query(Campaign).filter(Campaign.id == report_in.campaignId).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    report = Report(
        influencer_id=report_in.influencer_id,
        campaignId=report_in.campaignId,
        company_id=campaign.company_id,
        totalClicks=report_in.totalClicks,
        totalSales=report_in.totalSales,
        brandCommissionRate=report_in.brandCommissionRate,
        brandCommissionAmount=report_in.brandCommissionAmount,
        influencerCommissionRate=report_in.influencerCommissionRate,
        influencerCommissionAmount=report_in.influencerCommissionAmount,
        otherCostsRate=report_in.otherCostsRate,
        mimedaCommissionRate=report_in.mimedaCommissionRate,
        mimedaCommissionAmount=report_in.mimedaCommissionAmount,
        agencyCommissionRate=report_in.agencyCommissionRate,
        agencyCommissionAmount=report_in.agencyCommissionAmount,
    )
    log = ActivityLog(
        company_id= campaign.company_id,
        type="Report created.",
        label= campaign.name
    )
    try:
        db.add(report)
        db.add(log)
        db.commit()
        db.refresh(report)
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating report: {e}")
        raise HTTPException

    return report


@router.get("/Affiliate/GetReport", response_model=ReportListResponse)
def get_report(
    InfluencerID: Optional[str] = Query(None),
    StartDate: Optional[str] = Query(None),
    EndDate: Optional[str] = Query(None),
    company_id: Optional[int] = Query(None),  # Admin can override
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # Fetch the full user from DB to access company_id
    user = db.query(User).filter(User.id == current_user["sub"]).first()

    if user.role == "influencer":
        influencer = db.query(Influencer).filter(Influencer.user_id == user.id).first()
        if not influencer:
            raise HTTPException(status_code=404, detail="Influencer profile not found")
        reports = db.query(Report).filter(Report.influencer_id == influencer.id).all()
        return {
            "data": [ReportOut.model_validate(r, from_attributes=True) for r in reports],
            "isSuccess": True,
            "message": None,
            "type": 0,
            "activeInfluencers": 1 if reports else 0,
            "totalInfluencerCommission": sum(
                (r.influencerCommissionAmount or Decimal("0.00")) for r in reports
            ),
        }

    if not user or user.role not in ["company", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied")

    query = db.query(Report)

    # Company scoping
    if user.role == "admin":
        if company_id:
            query = query.filter(Report.company_id == company_id)
    else:
        query = query.filter(Report.company_id == user.company_id)

    # Influencer filter: accept numeric (our PK) or string mlink_id
    if InfluencerID:
        try:
            infl_id_int = int(InfluencerID)
            query = query.filter(Report.influencer_id == infl_id_int)
        except ValueError:
            # treat as external mlink_id
            query = query.join(Influencer, Report.influencer_id == Influencer.id) \
                         .filter(Influencer.mlink_id == InfluencerID)

    # Date filters (DD.MM.YYYY)
    if StartDate:
        try:
            start_dt = datetime.strptime(StartDate, "%d.%m.%Y")
            query = query.filter(Report.createdAt >= start_dt)
        except ValueError:
            return {"data": [], "isSuccess": False, "message": "Invalid StartDate", "type": 1}

    if EndDate:
        try:
            end_dt = datetime.strptime(EndDate, "%d.%m.%Y") + timedelta(days=1)
            query = query.filter(Report.createdAt <= end_dt)
        except ValueError:
            return {"data": [], "isSuccess": False, "message": "Invalid EndDate", "type": 1}

    query = query.options(
        selectinload(Report.influencer),
        selectinload(Report.campaign)
    )

    reports = query.all()

    # Active influencers in the *filtered* set
    active_influencers = len({r.influencer_id for r in reports})

    # Sum influencer commission across the filtered set
    total_influencer_commission = sum(
        (r.influencerCommissionAmount or Decimal("0.00")) for r in reports
    )

    return {
        "data": [ReportOut.model_validate(r, from_attributes=True) for r in reports],
        "activeInfluencers": active_influencers,
        "totalInfluencerCommission": total_influencer_commission,
        "isSuccess": True,
        "message": None,
        "type": 0
    }