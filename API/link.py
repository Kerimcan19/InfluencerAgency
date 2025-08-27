from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session, selectinload
from database import get_db, frontend_url
from core.models import Campaign, Report, User, TrackingLink, ActivityLog, LinkClicksDaily
from core.schemas import CampaignListResponse, CampaignOut, ReportOut, ReportListResponse, GenerateLinkRequest, GenerateLinkResponse, GeneratedLinkData
from usecases.auth_use import get_current_user, create_link_token
from typing import Optional
from datetime import datetime, date
import logging
from decimal import Decimal

logger = logging.getLogger(__name__)

router = APIRouter()

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
    
    existing_link = db.query(TrackingLink).filter(
        TrackingLink.influencer_id == int(body.influencerID),
        TrackingLink.campaignId == body.campaignID,
        TrackingLink.company_id == campaign.company_id
    ).first()

    if existing_link:
        response_data = GeneratedLinkData(
            campaignID=campaign.id,
            name=campaign.name,
            endDate=campaign.endDate,
            url=existing_link.generated_url
        )
        return {
            "data": response_data,
            "isSuccess": True,
            "message": "Tracking link already exists.",
            "type": 0
        }

    # Create new link
    link_token = create_link_token({
        "sub": body.influencerID,
        "name": body.influencerName,
        "campaignID": body.campaignID
    })
    
    a = datetime.utcnow()
    new_link = TrackingLink(
        influencer_id=int(body.influencerID),
        influencer_name=body.influencerName,
        campaignId=body.campaignID,
        company_id=campaign.company_id,
        generated_url=f"{frontend_url}/track?token={link_token}",
        token=link_token,
        status="active",
        source="local",
        click_count=0,
        createdAt=datetime.utcnow(),
        landing_url="https://ibb.co/tTRQrDfj",   
        mlink_id="",       
        mlink_url="" 
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

@router.get("/track/{token}")
def track_link(token: str, db: Session = Depends(get_db)):
    link = db.query(TrackingLink).filter(TrackingLink.token == token).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")

    # Increment click count
    link.click_count += 1

    today = date.today()
    daily = db.query(LinkClicksDaily).filter(
        LinkClicksDaily.link_id == link.id,
        LinkClicksDaily.date == today
    ).first()
    if daily:
        daily.clicks += 1
    else:
        daily = LinkClicksDaily(
            link_id=link.id,
            date=today,
            clicks=1,
            unique_clicks=1
        )
        db.add(daily)

    db.commit()

    return {
        "data": {
            "campaignID": link.campaignId,
            "influencerID": link.influencer_id,
            "url": link.landing_url
        },
        "isSuccess": True,
        "message": None,
        "type": 0
    }