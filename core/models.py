from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, Numeric, Boolean, Text, JSON, Table, Index, UniqueConstraint, Date
)
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey('companies.id'), nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    username = Column(String(255), unique=True, nullable=False)
    passwordHash = Column(String, nullable=False)
    role = Column(String, default='user')  # 'admin' | 'influencer' | 'company'

    company = relationship("Company", back_populates="users")
    influencer = relationship("Influencer", back_populates="user", uselist=False)



class Influencer(Base):
    __tablename__ = "influencers"

    id = Column(Integer, primary_key=True, index=True)

    # For future MLink sync (string-safe)
    mlink_id = Column(String(64), unique=True, nullable=True)

    # Optional one-to-one link to local login user (kept nullable)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    # note: per your request, no backref from User side

    # Basic profile info
    display_name = Column(String(255), nullable=False)
    username = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    profile_image = Column(String, nullable=True)

    # Key metrics
    follower_count = Column(Integer, default=0)
    engagement_rate = Column(Numeric(5, 2), nullable=True)  # %

    # Platform handles
    instagram_url = Column(String, nullable=True)
    tiktok_url = Column(String, nullable=True)
    youtube_url = Column(String, nullable=True)

    # JSON storage
    social_links_json = Column(JSON, nullable=True)        # e.g. {"twitter": "..."}
    source_payload_json = Column(JSON, nullable=True)      # raw MLink payload if needed

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    active = Column(Boolean, default=True)

    user = relationship("User", back_populates="influencer", uselist=False)
    reports = relationship("Report", back_populates="influencer")
    campaigns = relationship("Campaign", secondary="campaign_influencers", back_populates="influencers")
    links = relationship("TrackingLink", back_populates="influencer")


campaign_influencers = Table(
    "campaign_influencers",
    Base.metadata,
    Column("campaign_id", Integer, ForeignKey("campaigns.id"), primary_key=True),
    Column("influencer_id", Integer, ForeignKey("influencers.id"), primary_key=True)
)


class Campaign(Base):
    __tablename__ = 'campaigns'

    id = Column(Integer, primary_key=True, index=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    userId = Column(Integer, ForeignKey('users.id'), nullable=True, index=True)  # kept for compatibility (not used for influencer relation now)
    company_id = Column(Integer, ForeignKey('companies.id'), nullable=True)

    name = Column(String, nullable=False)
    brief = Column(String)

    brandCommissionRate = Column(Numeric(5, 2))
    influencerCommissionRate = Column(Numeric(5, 2))
    otherCostsRate = Column(Numeric(5, 2))
    startDate = Column(DateTime, default=datetime.utcnow)
    endDate = Column(DateTime)
    brandingImage = Column(String)

    company = relationship("Company", back_populates="campaigns")
    products = relationship("Product", back_populates="campaign", cascade="all, delete-orphan")
    links = relationship("TrackingLink", back_populates="campaign", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="campaign", cascade="all, delete-orphan")
    influencers = relationship("Influencer", secondary="campaign_influencers", back_populates="campaigns")


    mlink_id = Column(String(64), unique=True, nullable=True)
    source = Column(String(16), default='mlink')
    source_payload_json = Column(JSON, nullable=True)
    last_synced_at = Column(DateTime, nullable=True)


class Product(Base):
    __tablename__ = 'products'

    id = Column(Integer, primary_key=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    name = Column(String, nullable=False)
    image = Column(String)
    campaignId = Column(Integer, ForeignKey('campaigns.id'))

    campaign = relationship("Campaign", back_populates="products")

    mlink_id = Column(String(64), unique=True, nullable=True)
    source = Column(String(16), default='mlink')
    source_payload_json = Column(JSON, nullable=True)
    last_synced_at = Column(DateTime, nullable=True)


class TrackingLink(Base):
    __tablename__ = 'tracking_links'

    id = Column(Integer, primary_key=True)
    createdAt = Column(DateTime, default=datetime.utcnow)

    # cleaned: use Influencer FK (new) and remove legacy user FK + redundant fields
    influencer_id = Column(Integer, ForeignKey('influencers.id'), nullable=True)
    campaignId = Column(Integer, ForeignKey('campaigns.id'))
    company_id = Column(Integer, ForeignKey('companies.id'))
    influencer_name = Column(String(255), nullable= True)

    company = relationship("Company", back_populates="links")
    influencer = relationship("Influencer", back_populates="links")
    campaign = relationship("Campaign", back_populates="links", foreign_keys=[campaignId])

    token = Column(String(512), unique=True, index=True, nullable=False)
    generated_url = Column(String(512), nullable=False)  # your public short link (e.g., /r/{token})
    landing_url = Column(String(512), nullable=True)     # current destination; can switch to MLink later
    status = Column(String(16), default='active')
    source = Column(String(16), default='local')
    mlink_id = Column(String(64), unique=True, nullable=True)   
    mlink_url = Column(String(512), nullable=True)

    # NEW: simple aggregate counter (fast and tiny)
    click_count = Column(Integer, default=0, nullable=False)


class Report(Base):
    __tablename__ = 'reports'

    id = Column(Integer, primary_key=True)
    createdAt = Column(DateTime, default=datetime.utcnow)

    # switch to Influencer FK; keep name 'influencer' relationship but point to Influencer
    influencer_id = Column(Integer, ForeignKey('influencers.id'), nullable=True)
    campaignId = Column(Integer, ForeignKey('campaigns.id'))
    company_id = Column(Integer, ForeignKey('companies.id'), nullable=True)

    totalClicks = Column(Integer, default=0)
    totalSales = Column(Integer, default=0)

    brandCommissionRate = Column(Numeric(5, 2))
    brandCommissionAmount = Column(Numeric(10, 2))
    influencerCommissionRate = Column(Numeric(5, 2))
    influencerCommissionAmount = Column(Numeric(10, 2))
    otherCostsRate = Column(Numeric(5, 2))

    mimedaCommissionRate = Column(Numeric(5, 2))
    mimedaCommissionAmount = Column(Numeric(10, 2))
    agencyCommissionRate = Column(Numeric(5, 2))
    agencyCommissionAmount = Column(Numeric(10, 2))

    influencer = relationship("Influencer", back_populates="reports")
    campaign = relationship("Campaign", back_populates="reports", foreign_keys=[campaignId])
    company = relationship("Company", back_populates="reports")

    @property
    def influencerName(self):
        # derive name from Influencer now
        return self.influencer.display_name if self.influencer else None

    @property
    def campaignName(self):
        return self.campaign.name if self.campaign else None

    mlink_id = Column(String(64), unique=True, nullable=True)
    source = Column(String(16), default='mlink')
    source_payload_json = Column(JSON, nullable=True)
    last_synced_at = Column(DateTime, nullable=True)


class Company(Base):
    __tablename__ = 'companies'

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    adres = Column(Text, nullable=True)
    telefon = Column(String(20), nullable=True)
    gsm = Column(String(20), nullable=True)
    faks = Column(String(20), nullable=True)
    vergi_dairesi = Column(String(100), nullable=True)
    vergi_numarasi = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    aktiflik_durumu = Column(Boolean, default=True)

    yetkili_adi = Column(String(100), nullable=True)
    yetkili_soyadi = Column(String(100), nullable=True)
    yetkili_gsm = Column(String(20), nullable=True)

    users = relationship("User", back_populates="company", cascade="all, delete-orphan")
    campaigns = relationship("Campaign", back_populates="company", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="company", cascade="all, delete-orphan")
    links = relationship("TrackingLink", back_populates="company", cascade="all, delete-orphan")


class ActivityLog(Base):
    __tablename__ = 'activity_log'

    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey('companies.id'), nullable=False)
    type = Column(String, nullable=False)   # 'campaign_created', 'link_generated', etc.
    label = Column(String, nullable=False)  # e.g. "Summer Fashion 2024"
    timestamp = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company")


# Daily rollup model instead of per-click events
class LinkClicksDaily(Base):
    __tablename__ = 'link_clicks_daily'

    id = Column(Integer, primary_key=True)
    link_id = Column(Integer, ForeignKey('tracking_links.id'), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    clicks = Column(Integer, default=0, nullable=False)
    unique_clicks = Column(Integer, default=0, nullable=False)  # optional if you implement uniqueness

    __table_args__ = (
        UniqueConstraint('link_id', 'date', name='uq_link_date'),
        Index('ix_linkclicksdaily_linkid_date', 'link_id', 'date'),
    )
