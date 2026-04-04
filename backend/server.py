from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from bson import ObjectId
import qrcode
import io
import base64
import httpx
import csv
from io import StringIO

ROOT_DIR = Path(__file__).parent

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

JWT_ALGORITHM = "HS256"
EMERGENT_AUTH_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ----------- Helper Functions -----------
def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60),
        "type": "access"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    # Check session_token cookie first (Google OAuth)
    session_token = request.cookies.get("session_token")
    if session_token:
        session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
        if session:
            expires_at = session.get("expires_at")
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at > datetime.now(timezone.utc):
                user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
                if user:
                    return user
    
    # Fall back to JWT access_token
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_admin_or_staff(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") not in ["admin", "staff"]:
        raise HTTPException(status_code=403, detail="Admin or Staff access required")
    return user

async def require_admin(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ----------- Pydantic Models -----------
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "student"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    member_id: Optional[str] = None

class GoogleSessionRequest(BaseModel):
    session_id: str

class MemberCreate(BaseModel):
    member_id: str
    first_name: str
    last_name: str
    status: str = "Active"
    starting_balance: float = 0
    notes: Optional[str] = None

class MemberUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    status: Optional[str] = None
    starting_balance: Optional[float] = None
    notes: Optional[str] = None

class MemberResponse(BaseModel):
    id: str
    member_id: str
    first_name: str
    last_name: str
    display_name: str
    status: str
    starting_balance: float
    earned: float
    bonus: float
    spent: float
    adjustments: float
    current_balance: float
    qr_payload: str
    notes: Optional[str] = None
    created_at: str

class TransactionCreate(BaseModel):
    member_id: str
    type: str  # earn, spend, bonus, adjustment
    category: str
    amount: float
    notes: Optional[str] = None
    staff_initials: Optional[str] = None

class TransactionResponse(BaseModel):
    id: str
    member_id: str
    member_name: str
    type: str
    category: str
    amount: float
    notes: Optional[str] = None
    staff_initials: Optional[str] = None
    created_at: str

class BulkMemberImport(BaseModel):
    members: List[MemberCreate]

class LinkChildRequest(BaseModel):
    member_id: str

class StaffCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class StaffUpdate(BaseModel):
    name: Optional[str] = None
    password: Optional[str] = None

class AppSettings(BaseModel):
    app_name: str = "Club Bucks"
    primary_color: str = "#0ea5e9"
    accent_color: str = "#f59e0b"
    theme: str = "light"

# ----------- Auth Routes -----------
@api_router.post("/auth/register")
async def register(user_data: UserCreate, response: Response):
    email = user_data.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed = hash_password(user_data.password)
    user_doc = {
        "user_id": f"user_{uuid.uuid4().hex[:12]}",
        "email": email,
        "password_hash": hashed,
        "name": user_data.name,
        "role": user_data.role,
        "member_id": None,
        "linked_children": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    access_token = create_access_token(user_id, email, user_data.role)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {"id": user_id, "email": email, "name": user_data.name, "role": user_data.role}

@api_router.post("/auth/login")
async def login(credentials: UserLogin, request: Request, response: Response):
    email = credentials.email.lower()
    ip = request.client.host
    identifier = f"{ip}:{email}"
    
    # Check brute force
    attempts = await db.login_attempts.find_one({"identifier": identifier})
    if attempts and attempts.get("count", 0) >= 5:
        lockout_until = attempts.get("lockout_until")
        if lockout_until and datetime.fromisoformat(lockout_until) > datetime.now(timezone.utc):
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again later.")
        else:
            await db.login_attempts.delete_one({"identifier": identifier})
    
    user = await db.users.find_one({"email": email})
    if not user or not user.get("password_hash") or not verify_password(credentials.password, user["password_hash"]):
        # Increment failed attempts
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {
                "$inc": {"count": 1},
                "$set": {"lockout_until": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()}
            },
            upsert=True
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Clear failed attempts on success
    await db.login_attempts.delete_one({"identifier": identifier})
    
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email, user["role"])
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {"id": user_id, "email": email, "name": user["name"], "role": user["role"], "member_id": user.get("member_id")}

@api_router.post("/auth/google/session")
async def google_session(data: GoogleSessionRequest, response: Response):
    """Exchange Google OAuth session_id for session_token"""
    try:
        async with httpx.AsyncClient() as client_http:
            res = await client_http.get(
                EMERGENT_AUTH_URL,
                headers={"X-Session-ID": data.session_id}
            )
            if res.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session ID")
            
            google_data = res.json()
            email = google_data["email"].lower()
            name = google_data.get("name", email.split("@")[0])
            picture = google_data.get("picture", "")
            session_token = google_data["session_token"]
            
            # Check if user exists
            existing_user = await db.users.find_one({"email": email}, {"_id": 0})
            
            if existing_user:
                user_id = existing_user["user_id"]
                # Update user info
                await db.users.update_one(
                    {"email": email},
                    {"$set": {"name": name, "picture": picture}}
                )
            else:
                # Create new user with default role (student for Google OAuth)
                user_id = f"user_{uuid.uuid4().hex[:12]}"
                await db.users.insert_one({
                    "user_id": user_id,
                    "email": email,
                    "name": name,
                    "picture": picture,
                    "role": "student",
                    "member_id": None,
                    "linked_children": [],
                    "created_at": datetime.now(timezone.utc).isoformat()
                })
            
            # Store session
            expires_at = datetime.now(timezone.utc) + timedelta(days=7)
            await db.user_sessions.update_one(
                {"user_id": user_id},
                {
                    "$set": {
                        "session_token": session_token,
                        "expires_at": expires_at.isoformat(),
                        "created_at": datetime.now(timezone.utc).isoformat()
                    }
                },
                upsert=True
            )
            
            # Set cookie
            response.set_cookie(
                key="session_token",
                value=session_token,
                httponly=True,
                secure=True,
                samesite="none",
                max_age=7 * 24 * 60 * 60,
                path="/"
            )
            
            # Get full user data
            user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
            
            return {
                "user_id": user_id,
                "email": email,
                "name": name,
                "role": user.get("role", "student"),
                "member_id": user.get("member_id"),
                "linked_children": user.get("linked_children", [])
            }
    except httpx.RequestError as e:
        logger.error(f"Google auth error: {e}")
        raise HTTPException(status_code=500, detail="Authentication service unavailable")

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    response.delete_cookie("session_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return {
        "id": user.get("_id") or user.get("user_id"),
        "user_id": user.get("user_id"),
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "member_id": user.get("member_id"),
        "linked_children": user.get("linked_children", [])
    }

@api_router.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        user_id = str(user["_id"])
        access_token = create_access_token(user_id, user["email"], user["role"])
        response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
        return {"message": "Token refreshed"}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

# ----------- Parent Routes -----------
@api_router.post("/parent/link-child")
async def link_child(data: LinkChildRequest, request: Request):
    """Link a member (child) to parent account"""
    user = await get_current_user(request)
    if user.get("role") != "parent":
        raise HTTPException(status_code=403, detail="Only parents can link children")
    
    # Check if member exists
    member = await db.members.find_one({"member_id": data.member_id}, {"_id": 0})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    # Check if already linked
    linked_children = user.get("linked_children", [])
    if data.member_id in linked_children:
        raise HTTPException(status_code=400, detail="Child already linked")
    
    # Update user
    user_id = user.get("user_id") or user.get("_id")
    if user.get("user_id"):
        await db.users.update_one(
            {"user_id": user_id},
            {"$push": {"linked_children": data.member_id}}
        )
    else:
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$push": {"linked_children": data.member_id}}
        )
    
    return {"message": "Child linked successfully", "member": member}

@api_router.delete("/parent/unlink-child/{member_id}")
async def unlink_child(member_id: str, request: Request):
    """Unlink a child from parent account"""
    user = await get_current_user(request)
    if user.get("role") != "parent":
        raise HTTPException(status_code=403, detail="Only parents can unlink children")
    
    user_id = user.get("user_id") or user.get("_id")
    if user.get("user_id"):
        await db.users.update_one(
            {"user_id": user_id},
            {"$pull": {"linked_children": member_id}}
        )
    else:
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$pull": {"linked_children": member_id}}
        )
    
    return {"message": "Child unlinked successfully"}

@api_router.get("/parent/children")
async def get_children(request: Request):
    """Get all linked children for a parent"""
    user = await get_current_user(request)
    if user.get("role") != "parent":
        raise HTTPException(status_code=403, detail="Only parents can view children")
    
    linked_children = user.get("linked_children", [])
    if not linked_children:
        return []
    
    children = await db.members.find(
        {"member_id": {"$in": linked_children}},
        {"_id": 0}
    ).to_list(100)
    
    return children

@api_router.get("/parent/child/{member_id}/transactions")
async def get_child_transactions(member_id: str, request: Request):
    """Get transactions for a linked child"""
    user = await get_current_user(request)
    if user.get("role") != "parent":
        raise HTTPException(status_code=403, detail="Only parents can view child transactions")
    
    linked_children = user.get("linked_children", [])
    if member_id not in linked_children:
        raise HTTPException(status_code=403, detail="Child not linked to your account")
    
    transactions = await db.transactions.find(
        {"member_id": member_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return transactions

# ----------- Staff Management Routes (Admin Only) -----------
@api_router.get("/admin/staff")
async def get_all_staff(request: Request):
    """Get all staff members (admin only)"""
    await require_admin(request)
    
    staff = await db.users.find(
        {"role": "staff"},
        {"_id": 0, "password_hash": 0}
    ).to_list(100)
    
    return staff

@api_router.post("/admin/staff")
async def create_staff(data: StaffCreate, request: Request):
    """Create a new staff member (admin only)"""
    await require_admin(request)
    
    email = data.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed = hash_password(data.password)
    staff_doc = {
        "user_id": f"user_{uuid.uuid4().hex[:12]}",
        "email": email,
        "password_hash": hashed,
        "name": data.name,
        "role": "staff",
        "member_id": None,
        "linked_children": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(staff_doc)
    staff_doc.pop("_id", None)
    staff_doc.pop("password_hash", None)
    
    return staff_doc

@api_router.put("/admin/staff/{user_id}")
async def update_staff(user_id: str, data: StaffUpdate, request: Request):
    """Update a staff member (admin only)"""
    await require_admin(request)
    
    staff = await db.users.find_one({"user_id": user_id, "role": "staff"})
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    
    update_data = {}
    if data.name:
        update_data["name"] = data.name
    if data.password:
        update_data["password_hash"] = hash_password(data.password)
    
    if update_data:
        await db.users.update_one({"user_id": user_id}, {"$set": update_data})
    
    updated = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    return updated

@api_router.delete("/admin/staff/{user_id}")
async def delete_staff(user_id: str, request: Request):
    """Delete a staff member (admin only)"""
    await require_admin(request)
    
    result = await db.users.delete_one({"user_id": user_id, "role": "staff"})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Staff member not found")
    
    return {"message": "Staff member deleted"}

# ----------- App Settings Routes (Admin Only) -----------
@api_router.get("/settings")
async def get_settings(request: Request):
    """Get app settings (any authenticated user can read)"""
    await get_current_user(request)
    
    settings = await db.app_settings.find_one({"_id": "app_settings"}, {"_id": 0})
    if not settings:
        # Return defaults
        return {
            "app_name": "Club Bucks",
            "primary_color": "#0ea5e9",
            "accent_color": "#f59e0b",
            "theme": "light"
        }
    return settings

@api_router.get("/settings/public")
async def get_public_settings():
    """Get app settings (no auth required for theming)"""
    settings = await db.app_settings.find_one({"_id": "app_settings"}, {"_id": 0})
    if not settings:
        return {
            "app_name": "Club Bucks",
            "primary_color": "#0ea5e9",
            "accent_color": "#f59e0b",
            "theme": "light"
        }
    return settings

@api_router.put("/settings")
async def update_settings(data: AppSettings, request: Request):
    """Update app settings (admin only)"""
    await require_admin(request)
    
    settings_doc = {
        "_id": "app_settings",
        "app_name": data.app_name,
        "primary_color": data.primary_color,
        "accent_color": data.accent_color,
        "theme": data.theme,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.app_settings.replace_one(
        {"_id": "app_settings"},
        settings_doc,
        upsert=True
    )
    
    settings_doc.pop("_id")
    return settings_doc

# ----------- Member Routes -----------
@api_router.get("/members", response_model=List[MemberResponse])
async def get_members(request: Request, status: Optional[str] = None, search: Optional[str] = None):
    await get_current_user(request)
    
    query = {}
    if status:
        query["status"] = status
    if search:
        query["$or"] = [
            {"first_name": {"$regex": search, "$options": "i"}},
            {"last_name": {"$regex": search, "$options": "i"}},
            {"member_id": {"$regex": search, "$options": "i"}}
        ]
    
    members = await db.members.find(query, {"_id": 0}).to_list(1000)
    return members

@api_router.get("/members/{member_id}", response_model=MemberResponse)
async def get_member(member_id: str, request: Request):
    await get_current_user(request)
    member = await db.members.find_one({"member_id": member_id}, {"_id": 0})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    return member

@api_router.post("/members", response_model=MemberResponse)
async def create_member(member: MemberCreate, request: Request):
    await require_admin_or_staff(request)
    
    existing = await db.members.find_one({"member_id": member.member_id})
    if existing:
        raise HTTPException(status_code=400, detail="Member ID already exists")
    
    display_name = f"{member.first_name} {member.last_name}".strip()
    qr_payload = f"CLUBPAY|{member.member_id}|{display_name}"
    
    member_doc = {
        "id": str(uuid.uuid4()),
        "member_id": member.member_id,
        "first_name": member.first_name,
        "last_name": member.last_name,
        "display_name": display_name,
        "status": member.status,
        "starting_balance": member.starting_balance,
        "earned": 0,
        "bonus": 0,
        "spent": 0,
        "adjustments": 0,
        "current_balance": member.starting_balance,
        "qr_payload": qr_payload,
        "notes": member.notes,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.members.insert_one(member_doc)
    member_doc.pop("_id", None)
    return member_doc

@api_router.put("/members/{member_id}", response_model=MemberResponse)
async def update_member(member_id: str, update: MemberUpdate, request: Request):
    await require_admin_or_staff(request)
    
    member = await db.members.find_one({"member_id": member_id})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    
    if "first_name" in update_data or "last_name" in update_data:
        first = update_data.get("first_name", member["first_name"])
        last = update_data.get("last_name", member["last_name"])
        update_data["display_name"] = f"{first} {last}".strip()
        update_data["qr_payload"] = f"CLUBPAY|{member_id}|{update_data['display_name']}"
    
    if "starting_balance" in update_data:
        balance_diff = update_data["starting_balance"] - member["starting_balance"]
        update_data["current_balance"] = member["current_balance"] + balance_diff
    
    await db.members.update_one({"member_id": member_id}, {"$set": update_data})
    
    updated = await db.members.find_one({"member_id": member_id}, {"_id": 0})
    return updated

@api_router.delete("/members/{member_id}")
async def delete_member(member_id: str, request: Request):
    await require_admin_or_staff(request)
    result = await db.members.delete_one({"member_id": member_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Member not found")
    return {"message": "Member deleted"}

@api_router.post("/members/bulk-import")
async def bulk_import_members(data: BulkMemberImport, request: Request):
    await require_admin_or_staff(request)
    
    imported = 0
    skipped = 0
    
    for member in data.members:
        existing = await db.members.find_one({"member_id": member.member_id})
        if existing:
            skipped += 1
            continue
        
        display_name = f"{member.first_name} {member.last_name}".strip()
        qr_payload = f"CLUBPAY|{member.member_id}|{display_name}"
        
        member_doc = {
            "id": str(uuid.uuid4()),
            "member_id": member.member_id,
            "first_name": member.first_name,
            "last_name": member.last_name,
            "display_name": display_name,
            "status": member.status,
            "starting_balance": member.starting_balance,
            "earned": 0,
            "bonus": 0,
            "spent": 0,
            "adjustments": 0,
            "current_balance": member.starting_balance,
            "qr_payload": qr_payload,
            "notes": member.notes,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.members.insert_one(member_doc)
        imported += 1
    
    return {"imported": imported, "skipped": skipped}

@api_router.post("/members/upload-csv")
async def upload_csv_members(request: Request, file: UploadFile = File(...)):
    """Bulk import members from CSV file"""
    await require_admin_or_staff(request)
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    content = await file.read()
    decoded = content.decode('utf-8')
    
    reader = csv.DictReader(StringIO(decoded))
    
    imported = 0
    skipped = 0
    errors = []
    
    for row_num, row in enumerate(reader, start=2):
        try:
            member_id = row.get('member_id', '').strip()
            first_name = row.get('first_name', '').strip()
            last_name = row.get('last_name', '').strip()
            
            if not member_id or not first_name:
                errors.append(f"Row {row_num}: Missing member_id or first_name")
                continue
            
            existing = await db.members.find_one({"member_id": member_id})
            if existing:
                skipped += 1
                continue
            
            status = row.get('status', 'Active').strip() or 'Active'
            try:
                starting_balance = float(row.get('starting_balance', 0) or 0)
            except ValueError:
                starting_balance = 0
            notes = row.get('notes', '').strip()
            
            display_name = f"{first_name} {last_name}".strip()
            qr_payload = f"CLUBPAY|{member_id}|{display_name}"
            
            member_doc = {
                "id": str(uuid.uuid4()),
                "member_id": member_id,
                "first_name": first_name,
                "last_name": last_name,
                "display_name": display_name,
                "status": status,
                "starting_balance": starting_balance,
                "earned": 0,
                "bonus": 0,
                "spent": 0,
                "adjustments": 0,
                "current_balance": starting_balance,
                "qr_payload": qr_payload,
                "notes": notes,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.members.insert_one(member_doc)
            imported += 1
        except Exception as e:
            errors.append(f"Row {row_num}: {str(e)}")
    
    return {
        "imported": imported,
        "skipped": skipped,
        "errors": errors[:10] if errors else []
    }

# ----------- Transaction Routes -----------
@api_router.get("/transactions", response_model=List[TransactionResponse])
async def get_transactions(
    request: Request,
    member_id: Optional[str] = None,
    type: Optional[str] = None,
    limit: int = 100
):
    await get_current_user(request)
    
    query = {}
    if member_id:
        query["member_id"] = member_id
    if type:
        query["type"] = type
    
    transactions = await db.transactions.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return transactions

@api_router.post("/transactions", response_model=TransactionResponse)
async def create_transaction(txn: TransactionCreate, request: Request):
    user = await require_admin_or_staff(request)
    
    member = await db.members.find_one({"member_id": txn.member_id})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    # Calculate signed amount
    signed_amount = txn.amount
    if txn.type == "spend":
        signed_amount = -abs(txn.amount)
    elif txn.type in ["earn", "bonus"]:
        signed_amount = abs(txn.amount)
    # adjustment can be positive or negative as provided
    
    txn_doc = {
        "id": str(uuid.uuid4()),
        "member_id": txn.member_id,
        "member_name": member["display_name"],
        "type": txn.type,
        "category": txn.category,
        "amount": signed_amount,
        "notes": txn.notes,
        "staff_initials": txn.staff_initials or user.get("name", "")[:2].upper(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.transactions.insert_one(txn_doc)
    
    # Update member balance
    update_field = txn.type if txn.type in ["earned", "bonus", "spent", "adjustments"] else {
        "earn": "earned",
        "spend": "spent",
        "bonus": "bonus",
        "adjustment": "adjustments"
    }.get(txn.type, "adjustments")
    
    new_balance = member["current_balance"] + signed_amount
    field_value = member.get(update_field, 0) + abs(signed_amount) if txn.type != "adjustment" else member.get(update_field, 0) + signed_amount
    
    await db.members.update_one(
        {"member_id": txn.member_id},
        {
            "$set": {"current_balance": new_balance, update_field: field_value}
        }
    )
    
    txn_doc.pop("_id", None)
    return txn_doc

@api_router.post("/transactions/quick")
async def quick_transaction(request: Request, member_id: str, amount: float, type: str = "earn"):
    user = await require_admin_or_staff(request)
    
    member = await db.members.find_one({"member_id": member_id})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    signed_amount = amount if type != "spend" else -abs(amount)
    
    txn_doc = {
        "id": str(uuid.uuid4()),
        "member_id": member_id,
        "member_name": member["display_name"],
        "type": type,
        "category": "Quick Transaction",
        "amount": signed_amount,
        "notes": "Quick transaction from scan station",
        "staff_initials": user.get("name", "")[:2].upper(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.transactions.insert_one(txn_doc)
    
    update_field = {"earn": "earned", "spend": "spent", "bonus": "bonus", "adjustment": "adjustments"}.get(type, "adjustments")
    new_balance = member["current_balance"] + signed_amount
    
    await db.members.update_one(
        {"member_id": member_id},
        {"$inc": {"current_balance": signed_amount, update_field: abs(signed_amount) if type != "adjustment" else signed_amount}}
    )
    
    return {"message": "Transaction completed", "new_balance": new_balance, "member_name": member["display_name"]}

# ----------- Dashboard Routes -----------
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(request: Request):
    await get_current_user(request)
    
    pipeline = [
        {"$match": {"status": "Active"}},
        {"$group": {
            "_id": None,
            "total_members": {"$sum": 1},
            "total_starting": {"$sum": "$starting_balance"},
            "total_earned": {"$sum": "$earned"},
            "total_bonus": {"$sum": "$bonus"},
            "total_spent": {"$sum": "$spent"},
            "total_adjustments": {"$sum": "$adjustments"},
            "total_current": {"$sum": "$current_balance"}
        }}
    ]
    
    result = await db.members.aggregate(pipeline).to_list(1)
    
    if not result:
        return {
            "active_members": 0,
            "total_starting_bucks": 0,
            "total_earned": 0,
            "total_bonus": 0,
            "total_spent": 0,
            "net_adjustments": 0,
            "current_bucks": 0,
            "transactions_today": 0
        }
    
    stats = result[0]
    
    # Get today's transaction count
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    txn_count = await db.transactions.count_documents({
        "created_at": {"$gte": today_start.isoformat()}
    })
    
    return {
        "active_members": stats["total_members"],
        "total_starting_bucks": stats["total_starting"],
        "total_earned": stats["total_earned"],
        "total_bonus": stats["total_bonus"],
        "total_spent": stats["total_spent"],
        "net_adjustments": stats["total_adjustments"],
        "current_bucks": stats["total_current"],
        "transactions_today": txn_count
    }

@api_router.get("/dashboard/leaderboard")
async def get_leaderboard(request: Request, limit: int = 10):
    await get_current_user(request)
    
    leaders = await db.members.find(
        {"status": "Active"},
        {"_id": 0, "member_id": 1, "display_name": 1, "current_balance": 1}
    ).sort("current_balance", -1).to_list(limit)
    
    return leaders

@api_router.get("/dashboard/recent-transactions")
async def get_recent_transactions(request: Request, limit: int = 10):
    await get_current_user(request)
    
    transactions = await db.transactions.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).to_list(limit)
    
    return transactions

# ----------- QR Code Routes -----------
@api_router.get("/qr/{member_id}")
async def get_qr_code(member_id: str, request: Request):
    await get_current_user(request)
    
    member = await db.members.find_one({"member_id": member_id}, {"_id": 0})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(member["qr_payload"])
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    
    img_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    return {
        "member_id": member_id,
        "member_name": member["display_name"],
        "qr_payload": member["qr_payload"],
        "qr_image": f"data:image/png;base64,{img_base64}"
    }

@api_router.post("/qr/scan")
async def scan_qr_code(request: Request, payload: str):
    await get_current_user(request)
    
    # Parse QR payload: CLUBPAY|Member ID|Member Name
    parts = payload.split("|")
    if len(parts) < 2 or parts[0] != "CLUBPAY":
        raise HTTPException(status_code=400, detail="Invalid QR code format")
    
    member_id = parts[1]
    member = await db.members.find_one({"member_id": member_id}, {"_id": 0})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    return member

# ----------- Root Route -----------
@api_router.get("/")
async def root():
    return {"message": "Club Bucks API"}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000"), "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event
@app.on_event("startup")
async def startup_event():
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", sparse=True)
    await db.user_sessions.create_index("user_id")
    await db.user_sessions.create_index("session_token")
    await db.members.create_index("member_id", unique=True)
    await db.login_attempts.create_index("identifier")
    
    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@clubbucks.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "ClubBucks2024!")
    
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "email": admin_email,
            "password_hash": hashed,
            "name": "Admin",
            "role": "admin",
            "member_id": None,
            "linked_children": [],
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Admin user created: {admin_email}")
    elif not existing.get("password_hash") or not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}}
        )
        logger.info(f"Admin password updated")
    
    # Write test credentials
    creds_path = Path("/app/memory/test_credentials.md")
    creds_path.parent.mkdir(parents=True, exist_ok=True)
    creds_path.write_text(f"""# Test Credentials

## Admin Account
- Email: {admin_email}
- Password: {admin_password}
- Role: admin

## Google OAuth
- Any Google account can sign in
- Default role for new Google users: student
- Parents can link children via member_id

## Auth Endpoints
- POST /api/auth/login (email/password)
- POST /api/auth/google/session (Google OAuth)
- POST /api/auth/register
- POST /api/auth/logout
- GET /api/auth/me
- POST /api/auth/refresh
""")
    logger.info("Test credentials written")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
