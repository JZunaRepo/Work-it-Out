import os
import uuid

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.db import get_pool
from app.schemas import BestWeightOut, ExerciseFilters, ExerciseNameUpdate, ExerciseOut

router = APIRouter(prefix="/api/exercises", tags=["exercises"])

UPLOAD_DIR = "uploads"


def _photo_url(filename: str | None) -> str | None:
    return f"/uploads/{filename}" if filename else None


def _row_to_exercise(r) -> dict:
    return {
        "id": r["id"],
        "name": r["name"],
        "equipment": r["equipment"],
        "muscle_group": r["muscle_group"],
        "full_name": f'{r["name"]} — {r["equipment"]}',
        "photo_url": _photo_url(r["photo_filename"]),
    }


@router.get("", response_model=list[ExerciseOut])
async def list_exercises(
    q: str | None = None,
    muscle_group: str | None = None,
    equipment: str | None = None,
):
    pool = get_pool()
    conditions = ["deleted_at IS NULL"]
    params: list = []
    if q:
        # Match each typed word independently against the combined searchable text, rather
        # than the whole query as one substring — so "chest lever" matches "Lever Chest
        # Press" regardless of what order the words were typed in.
        searchable = "(name || ' ' || equipment || ' ' || muscle_group)"
        for word in q.split():
            params.append(f"%{word}%")
            conditions.append(f"{searchable} ILIKE ${len(params)}")
    if muscle_group:
        params.append(muscle_group)
        conditions.append(f"muscle_group = ${len(params)}")
    if equipment:
        params.append(equipment)
        conditions.append(f"equipment = ${len(params)}")

    query = (
        "SELECT id, name, equipment, muscle_group, photo_filename FROM exercise_library "
        f"WHERE {' AND '.join(conditions)} ORDER BY name, equipment"
    )
    rows = await pool.fetch(query, *params)
    return [_row_to_exercise(r) for r in rows]


@router.get("/filters", response_model=ExerciseFilters)
async def get_filters():
    pool = get_pool()
    muscle_groups = await pool.fetch(
        "SELECT DISTINCT muscle_group FROM exercise_library WHERE deleted_at IS NULL ORDER BY muscle_group"
    )
    equipment = await pool.fetch(
        "SELECT DISTINCT equipment FROM exercise_library WHERE deleted_at IS NULL ORDER BY equipment"
    )
    return {
        "muscle_groups": [r["muscle_group"] for r in muscle_groups],
        "equipment": [r["equipment"] for r in equipment],
    }


@router.get("/recent", response_model=list[ExerciseOut])
async def list_recent_exercises(profile_id: int):
    # Exercises this profile has actually logged before, most-recently-used first —
    # feeds the "Add exercise" panel's default suggestion list instead of the full library.
    pool = get_pool()
    rows = await pool.fetch(
        """SELECT el.id, el.name, el.equipment, el.muscle_group, el.photo_filename,
                  MAX(wd.log_date) AS last_used
           FROM exercise_library el
           JOIN logged_exercises le ON le.exercise_id = el.id
           JOIN workout_days wd ON wd.id = le.workout_day_id
           WHERE wd.profile_id = $1 AND wd.is_saved = true AND el.deleted_at IS NULL
           GROUP BY el.id
           ORDER BY last_used DESC""",
        profile_id,
    )
    return [_row_to_exercise(r) for r in rows]


@router.get("/{exercise_id}", response_model=ExerciseOut)
async def get_exercise(exercise_id: int):
    pool = get_pool()
    row = await pool.fetchrow(
        "SELECT id, name, equipment, muscle_group, photo_filename, instructions FROM exercise_library WHERE id = $1",
        exercise_id,
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Exercise not found")
    result = _row_to_exercise(row)
    result["instructions"] = row["instructions"]
    return result


@router.get("/{exercise_id}/best-weight", response_model=BestWeightOut)
async def get_best_weight(exercise_id: int, profile_id: int):
    # Highest weight this profile has ever logged for this exercise, across all saved days —
    # used to pre-fill the first set's weight when the exercise is added to a new day.
    pool = get_pool()
    best = await pool.fetchval(
        """SELECT MAX(s.weight) FROM sets s
           JOIN logged_exercises le ON le.id = s.logged_exercise_id
           JOIN workout_days wd ON wd.id = le.workout_day_id
           WHERE wd.profile_id = $1 AND le.exercise_id = $2""",
        profile_id,
        exercise_id,
    )
    return {"weight": float(best) if best is not None else None}


@router.patch("/{exercise_id}", response_model=ExerciseOut)
async def update_exercise_name(exercise_id: int, payload: ExerciseNameUpdate):
    pool = get_pool()
    new_name = payload.name.strip()
    if not new_name:
        raise HTTPException(status_code=422, detail="Name cannot be empty.")

    row = await pool.fetchrow(
        "SELECT id, equipment FROM exercise_library WHERE id = $1 AND deleted_at IS NULL",
        exercise_id,
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Exercise not found")

    conflict = await pool.fetchrow(
        """SELECT id FROM exercise_library
           WHERE lower(name) = lower($1) AND lower(equipment) = lower($2)
             AND id != $3 AND deleted_at IS NULL""",
        new_name,
        row["equipment"],
        exercise_id,
    )
    if conflict:
        raise HTTPException(
            status_code=409,
            detail="An exercise with this name and equipment already exists.",
        )

    updated = await pool.fetchrow(
        """UPDATE exercise_library SET name = $1 WHERE id = $2
           RETURNING id, name, equipment, muscle_group, photo_filename""",
        new_name,
        exercise_id,
    )
    return _row_to_exercise(updated)


@router.post("", response_model=ExerciseOut, status_code=201)
async def create_exercise(
    name: str = Form(...),
    muscle_group: str = Form(...),
    equipment: str = Form(...),
    photo: UploadFile | None = File(None),
):
    pool = get_pool()
    # Check against ALL rows, not just active ones — (name, equipment) is unique at the
    # DB level regardless of deleted_at, so a soft-deleted match would otherwise slip past
    # this check and crash on the INSERT's unique-constraint violation below.
    existing = await pool.fetchrow(
        """SELECT id, deleted_at FROM exercise_library
           WHERE lower(name) = lower($1) AND lower(equipment) = lower($2)""",
        name.strip(),
        equipment.strip(),
    )
    if existing and existing["deleted_at"] is None:
        raise HTTPException(
            status_code=409,
            detail="An exercise with this name and equipment already exists.",
        )

    photo_filename = None
    if photo is not None and photo.filename:
        ext = os.path.splitext(photo.filename)[1]
        photo_filename = f"{uuid.uuid4().hex}{ext}"
        contents = await photo.read()
        with open(os.path.join(UPLOAD_DIR, photo_filename), "wb") as f:
            f.write(contents)

    if existing:
        # Previously deleted — restore it instead of inserting a duplicate row, so any
        # logged history/PRs still pointing at this id stay connected to it.
        row = await pool.fetchrow(
            """UPDATE exercise_library
               SET muscle_group = $1, photo_filename = COALESCE($2, photo_filename), deleted_at = NULL
               WHERE id = $3
               RETURNING id, name, equipment, muscle_group, photo_filename""",
            muscle_group.strip(),
            photo_filename,
            existing["id"],
        )
    else:
        row = await pool.fetchrow(
            """INSERT INTO exercise_library (name, equipment, muscle_group, photo_filename)
               VALUES ($1, $2, $3, $4)
               RETURNING id, name, equipment, muscle_group, photo_filename""",
            name.strip(),
            equipment.strip(),
            muscle_group.strip(),
            photo_filename,
        )
    return _row_to_exercise(row)


@router.delete("/{exercise_id}", status_code=204)
async def delete_exercise(exercise_id: int):
    pool = get_pool()
    result = await pool.execute(
        "UPDATE exercise_library SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL",
        exercise_id,
    )
    if result == "UPDATE 0":
        raise HTTPException(status_code=404, detail="Exercise not found")
