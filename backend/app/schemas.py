from datetime import date

from pydantic import BaseModel


class ProfileOut(BaseModel):
    id: int
    name: str


class ProfileCreate(BaseModel):
    name: str


class ExerciseOut(BaseModel):
    id: int
    name: str
    equipment: str
    muscle_group: str
    full_name: str
    photo_url: str | None = None
    instructions: str | None = None


class ExerciseFilters(BaseModel):
    muscle_groups: list[str]
    equipment: list[str]


class ExerciseNameUpdate(BaseModel):
    name: str


class BestWeightOut(BaseModel):
    weight: float | None = None


class SetIn(BaseModel):
    reps: float | None = None
    weight: float | None = None


class SetOut(BaseModel):
    set_number: int
    reps: float | None = None
    weight: float | None = None


class LoggedExerciseIn(BaseModel):
    exercise_id: int
    sets: list[SetIn]


class LoggedExerciseOut(BaseModel):
    logged_exercise_id: int
    exercise_id: int
    name: str
    equipment: str
    muscle_group: str
    full_name: str
    photo_url: str | None = None
    sets: list[SetOut]


class WorkoutDayOut(BaseModel):
    log_date: date
    is_saved: bool
    exercises: list[LoggedExerciseOut]


class SaveWorkoutDayIn(BaseModel):
    exercises: list[LoggedExerciseIn]


class PRInfo(BaseModel):
    exercise_name: str
    previous_best: float
    today: float
    delta: float


class StreakInfo(BaseModel):
    count: int
    milestone_hit: bool


class SaveWorkoutDayOut(BaseModel):
    day: WorkoutDayOut
    pr: PRInfo | None = None
    streak: StreakInfo


class CalendarDayOut(BaseModel):
    log_date: date
    is_saved: bool
