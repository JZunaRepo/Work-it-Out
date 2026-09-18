from datetime import date, timedelta

from fastapi import APIRouter

from app.db import get_pool
from app.schemas import (
    CalendarDayOut,
    LoggedExerciseOut,
    PRInfo,
    SaveWorkoutDayIn,
    SaveWorkoutDayOut,
    SetOut,
    StreakInfo,
    WorkoutDayOut,
)

router = APIRouter(prefix="/api/workout-days", tags=["workout-days"])


def _photo_url(filename: str | None) -> str | None:
    return f"/uploads/{filename}" if filename else None


async def _fetch_day(conn, profile_id: int, log_date: date) -> WorkoutDayOut:
    day_row = await conn.fetchrow(
        "SELECT id, is_saved FROM workout_days WHERE profile_id = $1 AND log_date = $2",
        profile_id,
        log_date,
    )
    if day_row is None:
        return WorkoutDayOut(log_date=log_date, is_saved=False, exercises=[])

    ex_rows = await conn.fetch(
        """SELECT le.id AS logged_exercise_id, le.exercise_id, el.name, el.equipment,
                  el.muscle_group, el.photo_filename
           FROM logged_exercises le
           JOIN exercise_library el ON el.id = le.exercise_id
           WHERE le.workout_day_id = $1
           ORDER BY le.position""",
        day_row["id"],
    )
    exercises = []
    for ex in ex_rows:
        set_rows = await conn.fetch(
            "SELECT set_number, reps, weight FROM sets WHERE logged_exercise_id = $1 ORDER BY set_number",
            ex["logged_exercise_id"],
        )
        exercises.append(
            LoggedExerciseOut(
                logged_exercise_id=ex["logged_exercise_id"],
                exercise_id=ex["exercise_id"],
                name=ex["name"],
                equipment=ex["equipment"],
                muscle_group=ex["muscle_group"],
                full_name=f'{ex["name"]} — {ex["equipment"]}',
                photo_url=_photo_url(ex["photo_filename"]),
                sets=[
                    SetOut(set_number=s["set_number"], reps=s["reps"], weight=s["weight"])
                    for s in set_rows
                ],
            )
        )
    return WorkoutDayOut(log_date=log_date, is_saved=day_row["is_saved"], exercises=exercises)


@router.get("/{profile_id}", response_model=list[CalendarDayOut])
async def list_range(profile_id: int, start: date, end: date):
    pool = get_pool()
    rows = await pool.fetch(
        "SELECT log_date, is_saved FROM workout_days WHERE profile_id = $1 AND log_date BETWEEN $2 AND $3",
        profile_id,
        start,
        end,
    )
    return [{"log_date": r["log_date"], "is_saved": r["is_saved"]} for r in rows]


@router.get("/{profile_id}/{log_date}", response_model=WorkoutDayOut)
async def get_day(profile_id: int, log_date: date):
    pool = get_pool()
    return await _fetch_day(pool, profile_id, log_date)


@router.put("/{profile_id}/{log_date}", response_model=SaveWorkoutDayOut)
async def save_day(profile_id: int, log_date: date, payload: SaveWorkoutDayIn):
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            day_row = await conn.fetchrow(
                "SELECT id FROM workout_days WHERE profile_id = $1 AND log_date = $2",
                profile_id,
                log_date,
            )
            if day_row is None:
                day_row = await conn.fetchrow(
                    "INSERT INTO workout_days (profile_id, log_date, is_saved) VALUES ($1, $2, true) RETURNING id",
                    profile_id,
                    log_date,
                )
            else:
                await conn.execute("UPDATE workout_days SET is_saved = true WHERE id = $1", day_row["id"])
            day_id = day_row["id"]

            # Determine the first PR among the exercises being saved, comparing against
            # sets logged on *other* days only — this day's own prior sets are being replaced.
            pr_hit = None
            for ex in payload.exercises:
                if not ex.sets:
                    continue
                today_top = max((s.weight or 0) for s in ex.sets)
                if today_top <= 0:
                    continue
                prev_best = await conn.fetchval(
                    """SELECT MAX(s.weight) FROM sets s
                       JOIN logged_exercises le ON le.id = s.logged_exercise_id
                       JOIN workout_days wd ON wd.id = le.workout_day_id
                       WHERE wd.profile_id = $1 AND le.exercise_id = $2 AND wd.id != $3""",
                    profile_id,
                    ex.exercise_id,
                    day_id,
                )
                if prev_best is not None and today_top > float(prev_best) and pr_hit is None:
                    ex_row = await conn.fetchrow(
                        "SELECT name, equipment FROM exercise_library WHERE id = $1", ex.exercise_id
                    )
                    pr_hit = PRInfo(
                        exercise_name=f'{ex_row["name"]} — {ex_row["equipment"]}',
                        previous_best=float(prev_best),
                        today=today_top,
                        delta=today_top - float(prev_best),
                    )

            # Replace this day's exercises/sets wholesale with the submitted set
            await conn.execute("DELETE FROM logged_exercises WHERE workout_day_id = $1", day_id)
            for idx, ex in enumerate(payload.exercises):
                le_row = await conn.fetchrow(
                    "INSERT INTO logged_exercises (workout_day_id, exercise_id, position) VALUES ($1, $2, $3) RETURNING id",
                    day_id,
                    ex.exercise_id,
                    idx,
                )
                for set_idx, s in enumerate(ex.sets, start=1):
                    await conn.execute(
                        "INSERT INTO sets (logged_exercise_id, set_number, reps, weight) VALUES ($1, $2, $3, $4)",
                        le_row["id"],
                        set_idx,
                        s.reps,
                        s.weight,
                    )

            # Streak: consecutive saved calendar days ending at log_date
            streak_rows = await conn.fetch(
                """SELECT log_date FROM workout_days
                   WHERE profile_id = $1 AND is_saved = true AND log_date <= $2
                   ORDER BY log_date DESC""",
                profile_id,
                log_date,
            )
            streak_count = 0
            expected = log_date
            for r in streak_rows:
                if r["log_date"] == expected:
                    streak_count += 1
                    expected = expected - timedelta(days=1)
                else:
                    break

        day = await _fetch_day(conn, profile_id, log_date)

    return SaveWorkoutDayOut(
        day=day,
        pr=pr_hit,
        streak=StreakInfo(count=streak_count, milestone_hit=streak_count > 0 and streak_count % 7 == 0),
    )
