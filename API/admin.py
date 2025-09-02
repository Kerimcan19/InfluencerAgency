from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session, selectinload
from database import get_db, frontend_url
from core.models import Company, User, Campaign, ActivityLog, Influencer, Product
from core.schemas import InfluencerOut, CompanyCreate, CompanyOut, CompanyListResponse, UserCreate, CampaignCreate, InfluencerCreate, CompanyBase
from usecases.auth_use import get_current_user
from typing import Optional
from datetime import datetime
from usecases.auth_use import hash_password, create_access_token
import logging
import secrets, os, smtplib
from usecases.utils import send_password_reset_email    
from typing import Dict, Any, List

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/admin/create_company", response_model=CompanyOut, tags=["Admin"])
def create_company(
    company_in: CompanyCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    user = db.query(User).filter(User.id == current_user["sub"]).first()

    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create companies")

    existing = db.query(Company).filter(Company.name == company_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Company with this name already exists")
    company_data = company_in.model_dump(exclude={"username", "password"})

    company = Company(**company_data)
    try:
        db.add(company)
        db.flush()
        new_user = User(
            username = company_in.username,
            passwordHash = hash_password(company_in.password),
            role = "company",
            company_id = company.id)
        db.add(new_user)
        db.commit()
        db.refresh(company)

    except Exception as e:
        logger.error(f"Error creating company: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Bir hata oluştu.")

    return company

@router.post("/admin/add-influencer", tags=["Admin"])
def add_influencer(
    payload: InfluencerCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # 1) AuthZ
    admin = db.query(User).filter(User.id == current_user["sub"]).first()
    if not admin or admin.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    # 2) Uniqueness checks
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    if db.query(Influencer).filter(Influencer.username == payload.username).first():
        raise HTTPException(status_code=400, detail="Influencer username already exists")
    if db.query(Influencer).filter(Influencer.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Influencer email already exists")

    # 3) Create login user with a temporary password
    temp_password = secrets.token_urlsafe(12)
    new_user = User(
        username=payload.username,
        passwordHash=hash_password(temp_password),
        role="influencer",
    )
    db.add(new_user)
    db.flush()  # get new_user.id

    # 4) Create influencer profile
    new_infl = Influencer(
        user_id=new_user.id,
        display_name=payload.display_name,
        username=payload.username,
        email=payload.email,
        phone=payload.phone,
        profile_image=payload.profile_image,
        active=payload.active,
    )
    db.add(new_infl)
    db.flush()

    # 5) Create a password-reset token & URL
    token = create_access_token({
        "sub": str(new_user.id),
        "role": "influencer",
        "purpose": "password_reset"
    })
    reset_url = f"{frontend_url}/reset-password?token={token}"

    # 6) Commit before sending email
    db.commit()

    # 7) Send the email (non-fatal if SMTP not configured yet)
    try:
        send_password_reset_email(payload.email, reset_url)
    except Exception:
        # Don’t rollback user creation if email fails; just surface a warning-style message
        print("[WARN] Failed to send password reset email")

    return {
        "isSuccess": True,
        "message": "Influencer created and password reset link sent",
        "type": 0,
        "data": {
            "influencerId": new_infl.id,
            "userId": new_user.id,
            # returning URL helps you test quickly in dev; remove later if you prefer
            "resetUrl": reset_url
        }
    }


@router.post("/admin/add-campaign", tags=["Admin"])
def add_campaign(
    campaign: CampaignCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    user = db.query(User).filter(User.id == current_user["sub"]).first()
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    if not campaign.company_id:
        raise HTTPException(status_code=400, detail="Company ID is required")

    new_campaign = Campaign(
        name=campaign.name,
        brief=campaign.brief,
        brandingImage=campaign.brandingImage,
        brandCommissionRate=campaign.brandCommissionRate,
        influencerCommissionRate=campaign.influencerCommissionRate,
        otherCostsRate=campaign.otherCostsRate,
        endDate=campaign.endDate,
        company_id=campaign.company_id
    )
    log = ActivityLog(
        company_id= campaign.company_id,
        type="Campaign started",
        label= campaign.name  # or link URL
    )

    db.add(new_campaign)
    db.add(ActivityLog)
    db.commit()

    return {"isSuccess": True, "message": "Campaign created successfully", "type": 0}


@router.get("/admin/list_companies", response_model=CompanyListResponse, tags=["Admin"])
def list_companies(
    name: str = Query(default=None),
    email: str = Query(default=None),
    telefon: str = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    user = db.query(User).filter(User.id == current_user["sub"]).first()
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="You do not have permission to view companies")

    query = db.query(Company)

    if name:
        query = query.filter(Company.name.ilike(f"%{name}%"))

    if email:
        query = query.filter(Company.email.ilike(f"%{email}%"))

    if telefon:
        query = query.filter(Company.telefon.ilike(f"%{telefon}%"))

    companies = query.order_by(Company.id).all()

    return {
        "data": [CompanyOut.model_validate(c, from_attributes=True) for c in companies],
        "isSuccess": True,
        "message": None,
        "type": 0
    }

@router.get("/admin/list_influencers", tags=["Admin"])
def list_influencers(
    name: str = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    user = db.query(User).filter(User.id == current_user["sub"]).first()
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="You do not have permission to view influencers")

    query = db.query(Influencer)

    if name:
        query = query.filter(Influencer.username.ilike(f"%{name}%"))

    influencers = query.order_by(Influencer.id).all()

    # return simple serializable objects (no schema change)
    data = [
        {
            "id": i.id,
            "username": i.username,
            "display_name": i.display_name,
            "email": i.email,
            "active": i.active,
        }
        for i in influencers
    ]
    return {
        "isSuccess": True,
        "message": None,
        "type": 0,
        "data": data
    }

@router.get("/admin/influencers/{influencer_id}", tags=["Admin"])
def get_influencer_detail(
    influencer_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == current_user["sub"]).first()
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    inf = db.query(Influencer).filter(Influencer.id == influencer_id).first()
    if not inf:
        raise HTTPException(status_code=404, detail="Influencer not found")


    return {
        "isSuccess": True,
        "message": None,
        "type": 0,
        "data": {
            "id": inf.id,
            "username": inf.username,
            "display_name": inf.display_name,
            "email": inf.email,
            "phone": inf.phone,
            "profile_image": inf.profile_image,
            "active": inf.active,
            "user_id": inf.user_id,
            "mlink_id": getattr(inf, "mlink_id", None),
        }
    }

@router.put("/admin/influencers/{influencer_id}", tags=["Admin"])
def update_influencer(
    influencer_id: int,
    body: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == current_user["sub"]).first()
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    inf = db.query(Influencer).filter(Influencer.id == influencer_id).first()
    if not inf:
        raise HTTPException(status_code=404, detail="Influencer not found")

    # Only update known fields
    for fld in ("display_name", "email", "phone", "profile_image", "active"):
        if fld in body:
            setattr(inf, fld, body[fld])

    reset_url = None
    if body.get("resetPassword") and inf.user_id:
        token = create_access_token({"sub": str(inf.user_id), "role": "influencer", "purpose": "password_reset"})
        reset_url = f"{frontend_url}/reset-password?token={token}"

    db.commit()
    db.refresh(inf)

    resp = {
        "isSuccess": True,
        "message": "Influencer updated",
        "type": 0,
        "data": {
            "id": inf.id,
            "username": inf.username,
            "display_name": inf.display_name,
            "email": inf.email,
            "phone": inf.phone,
            "profile_image": inf.profile_image,
            "active": inf.active,
        }
    }
    if reset_url:
        resp["data"]["resetUrl"] = reset_url
    return resp



@router.post("/admin/add-company-user", tags=["Admin"])
def add_company_user(
    company_user: UserCreate,
    company_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    user = db.query(User).filter(User.id == current_user["sub"]).first()

    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    if db.query(User).filter(User.username == company_user.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")

    new_user = User(
        username=company_user.username,
        passwordHash =hash_password(company_user.password),
        role="company",
        company_id = company_id
    )

    db.add(new_user)
    db.commit()

    return {"isSuccess": True, "message": "User added successfully", "type": 0}

@router.get("/admin/companies/{company_id}", response_model=CompanyOut, tags=["Admin"])
def get_company_detail(
    company_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == current_user["sub"]).first()
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    comp = db.query(Company).filter(Company.id == company_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")

    return CompanyOut.model_validate(comp, from_attributes=True)

@router.put("/admin/companies/{company_id}", tags=["Admin"])
def update_company(
    company_id: int,
    body: CompanyBase,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == current_user["sub"]).first()
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    comp = db.query(Company).filter(Company.id == company_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")

    data = body.model_dump(exclude_unset=True)

    # name: normalize + uniqueness check
    if "name" in data:
        new_name = (data["name"] or "").strip()
        if not new_name:
            raise HTTPException(status_code=400, detail="Company name cannot be empty")
        conflict = db.query(Company).filter(Company.name == new_name, Company.id != company_id).first()
        if conflict:
            raise HTTPException(status_code=400, detail="Company with this name already exists")
        comp.name = new_name
        del data["name"]

    # apply remaining fields
    for fld, val in data.items():
        setattr(comp, fld, val)

    db.commit()
    db.refresh(comp)

    return {
        "isSuccess": True,
        "message": "Company updated",
        "type": 0,
        "data": CompanyOut.model_validate(comp, from_attributes=True)
    }





@router.post("/admin/import_mlink_campaigns", tags=["Admin"])
def import_mlink_campaigns(
    body: Dict[str, Any],
    company_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    # auth & company scope
    user = db.query(User).filter(User.id == current_user["sub"]).first()
    if not user or user.role not in ["admin", "company"]:
        raise HTTPException(status_code=403, detail="Access denied")

    if user.role == "company":
        company_id = user.company_id
    if not company_id:
        raise HTTPException(status_code=400, detail="company_id is required")

    items: List[Dict[str, Any]] = body.get("data") or []
    if not isinstance(items, list):
        raise HTTPException(status_code=400, detail="Body must contain a 'data' array")

    def parse_ddmmyyyy(s: Optional[str]) -> Optional[datetime]:
        if not s:
            return None
        try:
            return datetime.strptime(s, "%d.%m.%Y")
        except ValueError:
            return None

    imported = 0
    now = datetime.utcnow()

    for it in items:
        m_id = str(it.get("id")) if it.get("id") is not None else None
        if not m_id:
            # skip invalid item
            continue

        # upsert by mlink_id + company
        campaign = (
            db.query(Campaign)
              .options(selectinload(Campaign.products))
              .filter(Campaign.mlink_id == m_id, Campaign.company_id == company_id)
              .first()
        )
        if not campaign:
            campaign = Campaign(mlink_id=m_id, company_id=company_id)
            db.add(campaign)

        # map core fields
        campaign.name = it.get("name") or campaign.name
        campaign.brief = it.get("brief")
        campaign.brandCommissionRate = it.get("brandCampaignCommissionRate")
        campaign.influencerCommissionRate = it.get("influencerCommissionRate")
        campaign.otherCostsRate = it.get("otherCostsRate")
        campaign.endDate = parse_ddmmyyyy(it.get("endDate"))

        # branding image: prefer explicit, else first product.image
        branding = it.get("brandingImage")
        products_in = it.get("products") or []
        if not branding and products_in:
            first_img = products_in[0].get("image")
            branding = first_img if first_img else None
        campaign.brandingImage = branding

        # (optional) provenance fields if present in your model
        if hasattr(Campaign, "source"):
            campaign.source = "mlink"
        if hasattr(Campaign, "source_payload_json"):
            campaign.source_payload_json = it
        if hasattr(Campaign, "last_synced_at"):
            campaign.last_synced_at = now

        # products: append missing ones (don’t delete existing)
        existing_names = {p.name for p in (campaign.products or [])}
        for p in products_in:
            pname = p.get("name")
            pimg = p.get("image")
            if not pname:
                continue
            if pname not in existing_names:
                db.add(Product(name=pname, image=pimg, campaign=campaign))
                existing_names.add(pname)

        imported += 1

    db.commit()

    return {
        "isSuccess": True,
        "message": f"Imported/updated {imported} campaign(s).",
        "type": 0,
        "data": {"count": imported}
    }

@router.get("/list-influencers")
def list_influencers(
    campaign_id: Optional[int],
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == current_user["sub"]).first()
    if not user or user.role not in ["admin", "company"]:
        raise HTTPException(status_code=404, detail="User not found")
    
    if campaign_id:
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        influencers = campaign.influencers
    else:
        influencers = db.query(Influencer).all()
    return {
        "isSuccess": True,
        "message": None,
        "type": 0,
        "data": [InfluencerOut.model_validate(i, from_attributes=True) for i in influencers]
    }