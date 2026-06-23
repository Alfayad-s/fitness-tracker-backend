-- Create master exercises list
CREATE TABLE "exercises" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar UNIQUE NOT NULL,
  "description" text,
  "muscle_group" varchar,
  "equipment" varchar,
  "created_at" timestamptz DEFAULT now()
);

-- Alter workout_exercises to map to exercises table
ALTER TABLE "workout_exercises" ADD COLUMN "exercise_id" uuid;
ALTER TABLE "workout_exercises" ADD FOREIGN KEY ("exercise_id") REFERENCES "exercises" ("id") ON DELETE RESTRICT;

-- Drop obsolete flat name column and enforce non-null on foreign key
ALTER TABLE "workout_exercises" DROP COLUMN "exercise_name";
ALTER TABLE "workout_exercises" ALTER COLUMN "exercise_id" SET NOT NULL;
