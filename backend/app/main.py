import os
import shutil
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.db import connect, disconnect
from app.routers import exercises, profiles, workout_days

UPLOAD_DIR = "uploads"
SEED_PHOTOS_DIR = "seed_photos"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Seed photos (imported exercise library images) are committed to the repo and served
# the same way as user uploads — copy any not already present into the uploads volume.
# Idempotent: never overwrites a file that's already there.
if os.path.isdir(SEED_PHOTOS_DIR):
    for filename in os.listdir(SEED_PHOTOS_DIR):
        dest = os.path.join(UPLOAD_DIR, filename)
        if not os.path.exists(dest):
            shutil.copyfile(os.path.join(SEED_PHOTOS_DIR, filename), dest)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect()
    yield
    await disconnect()


app = FastAPI(title="workout-tracker", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(profiles.router)
app.include_router(exercises.router)
app.include_router(workout_days.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
