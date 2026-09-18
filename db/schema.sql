CREATE TABLE IF NOT EXISTS profiles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exercise_library (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    equipment VARCHAR(100) NOT NULL,
    muscle_group VARCHAR(100) NOT NULL,
    photo_filename VARCHAR(255),
    instructions TEXT,              -- optional step-by-step reference text, shown in the photo preview
    deleted_at TIMESTAMP,          -- soft delete: keeps history/PRs on already-logged days intact
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (name, equipment)
);

CREATE TABLE IF NOT EXISTS workout_days (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    is_saved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (profile_id, log_date)
);

CREATE TABLE IF NOT EXISTS logged_exercises (
    id SERIAL PRIMARY KEY,
    workout_day_id INTEGER NOT NULL REFERENCES workout_days(id) ON DELETE CASCADE,
    exercise_id INTEGER NOT NULL REFERENCES exercise_library(id),
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sets (
    id SERIAL PRIMARY KEY,
    logged_exercise_id INTEGER NOT NULL REFERENCES logged_exercises(id) ON DELETE CASCADE,
    set_number INTEGER NOT NULL,
    reps NUMERIC,
    weight NUMERIC
);

CREATE INDEX IF NOT EXISTS idx_workout_days_profile_date ON workout_days (profile_id, log_date);
CREATE INDEX IF NOT EXISTS idx_logged_exercises_day ON logged_exercises (workout_day_id);
CREATE INDEX IF NOT EXISTS idx_logged_exercises_exercise ON logged_exercises (exercise_id);
CREATE INDEX IF NOT EXISTS idx_sets_logged_exercise ON sets (logged_exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_library_muscle_group ON exercise_library (muscle_group);
CREATE INDEX IF NOT EXISTS idx_exercise_library_equipment ON exercise_library (equipment);

-- Seed data so the app isn't empty on first run. These are just placeholder
-- profiles, rename or replace them from the app once it's running.
INSERT INTO profiles (name) VALUES ('Alex'), ('Sam')
ON CONFLICT DO NOTHING;

INSERT INTO exercise_library (name, equipment, muscle_group) VALUES
    ('Bench Press', 'Barbell', 'Chest'),
    ('Bench Press', 'Dumbbell', 'Chest'),
    ('Squat', 'Barbell', 'Legs'),
    ('Deadlift', 'Barbell', 'Back'),
    ('Overhead Press', 'Barbell', 'Shoulders'),
    ('Lat Pulldown', 'Cable', 'Back'),
    ('Bicep Curl', 'Dumbbell', 'Arms'),
    ('Tricep Pushdown', 'Cable', 'Arms'),
    ('Leg Press', 'Machine', 'Legs'),
    ('Plank', 'Bodyweight', 'Core')
ON CONFLICT DO NOTHING;
