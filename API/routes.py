from fastapi import APIRouter, Depends, Query, Body, HTTPException
from typing import Optional
from core.schemas import CampaignListResponse, CampaignOut, ReportListResponse, ReportOut, GenerateLinkRequest
from core.models import User, Influencer
from usecases.auth_use import get_current_user  # <-- your backend JWT auth
from usecases.client import mlink_client  # <-- updated client with auto-login
from database import get_db
from sqlalchemy.orm import Session, selectinload

router = APIRouter(prefix="/mlink", tags=["MLink"])

@router.get("/campaigns")
async def mlink_campaigns(
    name: Optional[str] = Query(None, alias="Name"),
    start_date: Optional[str] = Query(None, alias="StartDate"),
    end_date: Optional[str] = Query(None, alias="EndDate"),
    user=Depends(get_current_user),  
):
    if user["role"] not in ["company", "admin", "influencer"]:
        raise HTTPException(status_code=403, detail= "Access denied")
    
    params = {}
    if name:
        params["Name"] = name
    if start_date:
        params["StartDate"] = start_date
    if end_date:
        params["EndDate"] = end_date
    return await mlink_client.get_campaigns(params)

@router.get("/reports")
async def mlink_reports(
    influencer_id: Optional[str] = Query(None, alias="InfluencerID"),
    start_date: Optional[str] = Query(None, alias="StartDate"),
    end_date: Optional[str] = Query(None, alias="EndDate"),
    user=Depends(get_current_user),  
):
    if user["role"] not in ["company", "admin"]:
        raise HTTPException(status_code=403, detail= "Access denied")
    
    params = {}
    if influencer_id:
        params["InfluencerID"] = influencer_id
    if start_date:
        params["StartDate"] = start_date
    if end_date:
        params["EndDate"] = end_date
    return await mlink_client.get_report(params)

@router.put("/generate-link")
async def mlink_generate_link(
    body: GenerateLinkRequest,
    user=Depends(get_current_user),  
    db: Session = Depends(get_db)
):
    if user["role"] == "influencer":
        influencer = db.query(Influencer).filter(User.id == user["sub"]).first()
        if not influencer:
            raise HTTPException(status_code=404, detail="Influencer not found") 
        body.influencerID = str(influencer.id)
        body.influencerName = influencer.username
        return await mlink_client.generate_link(body)
    if user["role"] not in ["company", "admin"]:
        raise HTTPException(status_code=403, detail= "Access denied")
    return await mlink_client.generate_link(body)
