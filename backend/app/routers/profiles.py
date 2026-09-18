from fastapi import APIRouter

from app.db import get_pool
from app.schemas import ProfileCreate, ProfileOut

router = APIRouter(prefix="/api/profiles", tags=["profiles"])


@router.get("", response_model=list[ProfileOut])
async def list_profiles():
    pool = get_pool()
    rows = await pool.fetch("SELECT id, name FROM profiles ORDER BY id")
    return [dict(r) for r in rows]


@router.post("", response_model=ProfileOut, status_code=201)
async def create_profile(payload: ProfileCreate):
    pool = get_pool()
    row = await pool.fetchrow(
        "INSERT INTO profiles (name) VALUES ($1) RETURNING id, name",
        payload.name.strip(),
    )
    return dict(row)
