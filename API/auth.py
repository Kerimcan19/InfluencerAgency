from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.models import User, Company, Influencer
from core.schemas import TokenRequest, TokenResponse, TokenData, UserOut, CompanyOut, InfluencerOut
from usecases.auth_use import verify_password, create_access_token, get_current_user
from database import get_db
from datetime import datetime, timedelta

router = APIRouter( tags=["Auth"])

@router.post("/login", response_model=TokenResponse)
def login(request: TokenRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username).first()
    if not user or not verify_password(request.password, user.passwordHash):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    access_token = create_access_token({
        "sub": str(user.id),
        "role": user.role
    })

    return TokenResponse(
        data=TokenData(accessToken=access_token, expiration=None),  # Optional: return token expiry
        isSuccess=True,
        message=None,
        type=0
    )

@router.get("/users/me", tags=["Users"])
def read_users_me(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    user = db.query(User).filter(User.id == current_user["sub"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user_out = UserOut.model_validate(user)
    
    if current_user["role"] == "admin":
        return {
            "user": user_out,
            "info": "admin"
        }
    if current_user["role"] == "company":
        user_company = db.query(Company).filter(Company.id == user.company_id).first()
        company_out = CompanyOut.model_validate(user_company) if user_company else None
        return {
            "user": user_out,
            "info": company_out
        }
    if current_user["role"] == "influencer":
        user_influencer = db.query(Influencer).filter(Influencer.id == user.influencer_id).first()
        influencer_out = InfluencerOut.model_validate(user_influencer) if user_influencer else None
        return {
            "user": user_out,
            "info": influencer_out
        }
    else:
        raise HTTPException(status_code=400, detail="Invalid user role")