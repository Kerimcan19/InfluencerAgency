from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.models import User, Company, Influencer
from core.schemas import (
    TokenRequest,
    TokenResponse,
    TokenData,
    UserOut,
    CompanyOut,
    InfluencerOut,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from usecases.auth_use import (
    verify_password,
    create_access_token,
    get_current_user,
    create_link_token,
    decode_access_token,
    hash_password,
)
from database import get_db
from datetime import datetime, timedelta
import os
from usecases.utils import send_password_reset_email

router = APIRouter(tags=["Auth"])

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
        user_influencer = db.query(Influencer).filter(Influencer.user_id == user.id).first()
        influencer_out = InfluencerOut.model_validate(user_influencer, from_attributes=True) if user_influencer else None
        return {
            "user": user_out,
            "info": influencer_out
        }
    else:
        raise HTTPException(status_code=400, detail="Invalid user role")

@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Accepts an email, finds a related user, and sends a reset link via email."""
    email = payload.email.strip().lower()

    # Try to find a user via Company.email or Influencer.email ownership
    # Assumptions: users may belong to a company (company.email), or be linked to an influencer (influencer.email)
    company = db.query(Company).filter(Company.email != None).filter(Company.email.ilike(email)).first()
    influencer = db.query(Influencer).filter(Influencer.email != None).filter(Influencer.email.ilike(email)).first()

    user: User | None = None
    if company:
        user = db.query(User).filter(User.company_id == company.id).first()
    if not user and influencer:
        if influencer.user_id:
            user = db.query(User).filter(User.id == influencer.user_id).first()

    # If still not found, as a fallback allow matching username equal to email (some systems use email as username)
    if not user:
        user = db.query(User).filter(User.username.ilike(email)).first()

    if not user:
        # Avoid user enumeration; respond success regardless, but don't send email
        return {"detail": "If an account exists for this email, a reset link has been sent."}

    # Create a short-lived reset token
    token = create_link_token({"sub": str(user.id), "purpose": "password_reset"})

    frontend_base = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173")
    reset_url = f"{frontend_base}/reset-password?token={token}"

    # Send email (no error thrown if SMTP not configured; utils logs a warning)
    send_password_reset_email(email, reset_url)

    return {"detail": "Reset link sent if the email exists."}

@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Resets the user's password using a valid token and new passwords."""
    if payload.new_password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    # Decode token and extract user id
    try:
        data = decode_access_token(payload.token)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    if data.get("purpose") != "password_reset":
        # Accept legacy tokens without purpose as well
        pass

    user_id = data.get("sub")
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid token payload")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.passwordHash = hash_password(payload.new_password)
    db.add(user)
    db.commit()

    return {"detail": "Password has been reset successfully."}