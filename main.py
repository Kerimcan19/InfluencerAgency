from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from API import user, admin, auth, reports, dashboard, routes, link
from database import engine
from core.models import Base

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

app.include_router(user.router)
app.include_router(admin.router)
app.include_router(auth.router)
app.include_router(reports.router)
app.include_router(dashboard.router)
app.include_router(routes.router)
app.include_router(link.router)
