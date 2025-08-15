from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session, selectinload
from database import get_db, frontend_url
from core.models import Campaign, Report, User, TrackingLink, ActivityLog
from core.schemas import CampaignListResponse, CampaignOut, ReportOut, ReportListResponse, GenerateLinkRequest, GenerateLinkResponse, GeneratedLinkData
from usecases.auth_use import get_current_user
from typing import Optional
from datetime import datetime
import logging
from decimal import Decimal

router = APIRouter()

logger = logging.getLogger(__name__)




@router.get("/Affiliate/GetCampaigns", response_model=CampaignListResponse)
def get_campaigns(
    Name: Optional[str] = Query(None),
    StartDate: Optional[str] = Query(None),
    EndDate: Optional[str] = Query(None),
    company_id: Optional[int] = Query(None),  # only used if user is admin
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    
    user = db.query(User).filter(User.id == current_user["sub"]).first()
    if not user or user.role not in ["company", "admin"]:
        raise HTTPException(status_code=403, detail= "Access denied")

    query = db.query(Campaign)

    # Admin can optionally filter by any company_id
    if user.role == "admin":
        if company_id:
            query = query.filter(Campaign.company_id == company_id)
    else:
        # Companies can only access their own campaigns
        query = query.filter(Campaign.company_id == user.company_id)

    if Name:
        query = query.filter(Campaign.name.ilike(f"%{Name}%"))

    if StartDate:
        try:
            start_dt = datetime.strptime(StartDate, "%d.%m.%Y")
            query = query.filter(Campaign.end_date >= start_dt)
        except ValueError:
            return {"data": [], "isSuccess": False, "message": "Invalid StartDate", "type": 1}

    if EndDate:
        try:
            end_dt = datetime.strptime(EndDate, "%d.%m.%Y")
            query = query.filter(Campaign.end_date <= end_dt)
        except ValueError:
            return {"data": [], "isSuccess": False, "message": "Invalid EndDate", "type": 1}

    campaigns = query.all()

    return {
        "data": [CampaignOut.model_validate(c, from_attributes=True) for c in campaigns],
        "isSuccess": True,
        "message": None,
        "type": 0
    }


@router.put("/Affiliate/GenerateLink", response_model=GenerateLinkResponse)
def generate_link(
    body: GenerateLinkRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    user = db.query(User).filter(User.id == current_user["sub"]).first()

    if not user or user.role not in ["company", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied")

    campaign = db.query(Campaign).filter(Campaign.id == body.campaignID).first()

    if not campaign:
        return {
            "data": None,
            "isSuccess": False,
            "message": "Campaign not found",
            "type": 1
        }

    if user.role == "company" and campaign.company_id != user.company_id:
        raise HTTPException(status_code=403, detail="You are not authorized to modify this campaign")

    # Create new link
    a = datetime.utcnow()
    new_link = TrackingLink(
        influencer_id=body.influencerID,
        influencer_name=body.influencerName,
        campaignId=body.campaignID,
        company_id = campaign.company_id,
        generated_url=f"{frontend_url}/track/{body.influencerID}/{body.campaignID}",
        token = "placeholder_token3",
        status = "active",
        source = "local",
        click_count = 0,
        createdAt=datetime.utcnow()
    )
    log = ActivityLog(
        company_id= campaign.company_id,
        type="Link generated",
        label= body.influencerName  # or link URL
    )
    try:
        db.add(new_link)
        db.add(log)
        db.commit()
        db.refresh(new_link)
    except Exception as e:
        db.rollback()
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500)

    response_data = GeneratedLinkData(
        campaignID=campaign.id,
        name=campaign.name,
        endDate=campaign.endDate,
        url=new_link.generated_url
    )

    return {
        "data": response_data,
        "isSuccess": True,
        "message": None,
        "type": 0
    }