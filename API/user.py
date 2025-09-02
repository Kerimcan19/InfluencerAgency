from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session, selectinload
from database import get_db, frontend_url
from core.models import Campaign, Report, User, TrackingLink, ActivityLog, Influencer
from core.schemas import CampaignListResponse, CampaignOut, ReportOut, ReportListResponse, GenerateLinkRequest, GenerateLinkResponse, GeneratedLinkData
from core.schemas import ResetPasswordRequest, InfluencerUpdate
from usecases.auth_use import get_current_user, create_link_token, decode_access_token, hash_password
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
    if not user or user.role not in ["company", "admin", "influencer"]:
        raise HTTPException(status_code=403, detail= "Access denied")
    
    if user.role == "influencer":
        influencer = db.query(Influencer).filter(Influencer.user_id == user.id).first()
        if not influencer:
            return {"data": [], "isSuccess": False, "message": "Influencer profile not found", "type": 1}
        campaigns = influencer.campaigns
        # Apply filters if needed
        if Name:
            campaigns = [c for c in campaigns if Name.lower() in c.name.lower()]
        if StartDate:
            try:
                start_dt = datetime.strptime(StartDate, "%d.%m.%Y")
                campaigns = [c for c in campaigns if c.endDate >= start_dt]
            except ValueError:
                return {"data": [], "isSuccess": False, "message": "Invalid StartDate", "type": 1}
        if EndDate:
            try:
                end_dt = datetime.strptime(EndDate, "%d.%m.%Y")
                campaigns = [c for c in campaigns if c.endDate <= end_dt]
            except ValueError:
                return {"data": [], "isSuccess": False, "message": "Invalid EndDate", "type": 1}
        return {
            "data": [CampaignOut.model_validate(c, from_attributes=True) for c in campaigns],
            "isSuccess": True,
            "message": None,
            "type": 0
        }
    
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

@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    reset_token = decode_access_token(request.token)
    if not reset_token:
        raise HTTPException(status_code=400, detail="Invalid token")

    user = db.query(User).filter(User.id == reset_token["sub"]).first()
    logger.info(f"Resetting password {reset_token}")
    print(reset_token)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if reset_token["purpose"] != "password_reset":
        raise HTTPException(status_code=400, detail="Invalid token")
    if request.new_password != request.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    user.passwordHash = hash_password(request.new_password)
    db.commit()

    return {"message": "Password reset successful"}

@router.patch("/update-influencer-profile")
def update_profile(request: InfluencerUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.name = request.name
    user.email = request.email
    db.commit()

    return {"message": "Profile updated successfully"}