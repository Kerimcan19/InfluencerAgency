from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr
from decimal import Decimal
from datetime import datetime


# === AUTH ===
class TokenRequest(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    role: str
    company_id: Optional[int]
    createdAt: datetime

    class Config:
        from_attributes = True

class InfluencerCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=255)
    display_name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    phone: Optional[str] = None
    profile_image: Optional[str] = None
    active: bool = True

class InfluencerBase(BaseModel):
    username: str
    display_name: str
    email: EmailStr
    phone: Optional[str]
    profile_image: Optional[str]
    active: bool

class InfluencerUpdate(BaseModel):
    # Make all fields optional for updates
    username: Optional[str] = None
    display_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    profile_image: Optional[str] = None
    active: Optional[bool] = None
    
    # Social profile URLs (basic ones)
    instagram_url: Optional[str] = None
    tiktok_url: Optional[str] = None
    youtube_url: Optional[str] = None
    
    # For frontend to identify the user
    user_id: Optional[int] = None

class InfluencerOut(InfluencerBase):
    id: int

    class Config:
        from_attributes = True

class TokenData(BaseModel):
    accessToken: str
    expiration: Optional[datetime] = None


class TokenResponse(BaseModel):
    data: Optional[TokenData]
    isSuccess: bool
    message: Optional[str]
    type: int


# === PRODUCT ===
class ProductOut(BaseModel):
    name: str
    image: Optional[str]


# === CAMPAIGNS ===
class CampaignBase(BaseModel):
    name: str
    brief: Optional[str] = None
    brandCommissionRate: Decimal = Field(..., gt=0)
    influencerCommissionRate: Decimal = Field(..., gt=0)
    otherCostsRate: Optional[Decimal] = Field(..., ge=0)
    endDate: datetime
    brandingImage: Optional[str] = None

class CampaignCreate(CampaignBase):
    company_id: Optional[int]

    class Config:
        from_attributes = True


class CampaignOut(BaseModel):
    id: int
    name: str
    brandCommissionRate: Decimal
    influencerCommissionRate: Decimal
    otherCostsRate: Decimal
    endDate: datetime
    products: List[ProductOut]
    brandingImage: str

    class Config:
        from_attributes = True

        


class CampaignListResponse(BaseModel):
    data: List[CampaignOut]
    isSuccess: bool
    message: Optional[str]
    type: int

# === COMPANIES ===

class CompanyBase(BaseModel):
    name: str
    adres: Optional[str] = None
    telefon: Optional[str] = None
    gsm: Optional[str] = None
    faks: Optional[str] = None
    vergi_dairesi: Optional[str] = None
    vergi_numarasi: Optional[str] = None
    email: Optional[EmailStr] = None
    aktiflik_durumu: Optional[bool] = True

    yetkili_adi: Optional[str] = None
    yetkili_soyadi: Optional[str] = None
    yetkili_gsm: Optional[str] = None


class CompanyCreate(CompanyBase):
    username: Optional[str] = None
    password: Optional[str] = None

    class Config:
        from_attributes = True


class CompanyOut(BaseModel):
    id: int
    name: str
    created_at: datetime
    adres: Optional[str]
    telefon: Optional[str]
    gsm: Optional[str]
    faks: Optional[str]
    vergi_dairesi: Optional[str]
    vergi_numarasi: Optional[str]
    email: Optional[str]
    aktiflik_durumu: bool
    yetkili_adi: Optional[str]
    yetkili_soyadi: Optional[str]
    yetkili_gsm: Optional[str]

    class Config:
        from_attributes = True

class CompanyListResponse(BaseModel):
    data: list[CompanyOut]
    isSuccess: bool
    message: Optional[str]
    type: int

# === REPORTS ===
class ReportCreate(BaseModel):
    influencer_id: Optional[int]
    campaignId: int
    totalClicks: int
    totalSales: int

    brandCommissionRate: Decimal
    brandCommissionAmount: Decimal
    influencerCommissionRate: Decimal
    influencerCommissionAmount: Decimal
    otherCostsRate: Decimal

    mimedaCommissionRate: Decimal
    mimedaCommissionAmount: Decimal
    agencyCommissionRate: Decimal
    agencyCommissionAmount: Decimal

    class Config:
        from_attributes = True


class ReportOut(BaseModel):
    id: int
    influencer_id: int
    campaignId: int
    totalClicks: int
    totalSales: int
    createdAt: datetime

    brandCommissionRate: Decimal
    brandCommissionAmount: Decimal
    influencerCommissionRate: Decimal
    influencerCommissionAmount: Decimal
    otherCostsRate: Decimal

    mimedaCommissionRate: Decimal
    mimedaCommissionAmount: Decimal
    agencyCommissionRate: Decimal
    agencyCommissionAmount: Decimal

    influencerName: Optional[str] = None
    campaignName: Optional[str] = None

    class Config:
        from_attributes = True


class ReportListResponse(BaseModel):
    data: List[ReportOut]
    isSuccess: bool
    message: Optional[str]
    type: int

    activeInfluencers: Optional[int]
    totalInfluencerCommission: Optional[Decimal]

class ReportFilter(BaseModel):
    influencerID: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None


# === LINK GENERATION ===
class GenerateLinkRequest(BaseModel):
    influencerID: str
    influencerName: str
    campaignID: int


class GeneratedLinkData(BaseModel):
    campaignID: int
    name: str
    endDate: datetime
    url: str


class GenerateLinkResponse(BaseModel):
    data: Optional[GeneratedLinkData]
    isSuccess: bool
    message: Optional[str]
    type: int


# === LOCAL PRODUCT DB ===
class ProductBase(BaseModel):
    name: str
    image: Optional[str] = None


class ProductCreate(ProductBase):
    pass


class ProductOut(ProductBase):
    id: int
    campaign_id: int

    class Config:
        from_attributes = True

class DashboardSummaryResponse(BaseModel):
    activeCampaigns: int
    totalClicks: int
    totalSales: Decimal
    totalCommission: Decimal

class ActivityOut(BaseModel):
    type: str
    label: str
    timestamp: datetime

    class Config:
        from_attributes = True

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    confirm_password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr
