-- Fitness Tracker initial schema

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "first_name" varchar,
  "last_name" varchar,
  "email" varchar UNIQUE,
  "password" varchar,
  "gender" varchar,
  "age" int,
  "height" decimal,
  "current_weight" decimal,
  "target_weight" decimal,
  "activity_level" varchar,
  "fitness_goal" varchar,
  "profile_image" varchar,
  "is_verified" boolean DEFAULT false,
  "is_blocked" boolean DEFAULT false,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

CREATE TABLE "refresh_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "token" text NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "created_at" timestamptz DEFAULT now()
);

CREATE TABLE "workout_categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar NOT NULL,
  "description" text,
  "created_at" timestamptz DEFAULT now()
);

CREATE TABLE "workouts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "category_id" uuid,
  "title" varchar NOT NULL,
  "description" text,
  "difficulty" varchar,
  "estimated_duration" int,
  "calories_burn_estimate" int,
  "created_at" timestamptz DEFAULT now()
);

CREATE TABLE "workout_exercises" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "workout_id" uuid NOT NULL,
  "exercise_name" varchar NOT NULL,
  "sets" int,
  "reps" int,
  "duration_minutes" int,
  "created_at" timestamptz DEFAULT now()
);

CREATE TABLE "workout_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "workout_id" uuid NOT NULL,
  "workout_date" date NOT NULL,
  "duration_minutes" int,
  "calories_burned" int,
  "notes" text,
  "created_at" timestamptz DEFAULT now()
);

CREATE TABLE "goals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "goal_type" varchar NOT NULL,
  "target_value" decimal,
  "current_value" decimal,
  "start_date" date,
  "target_date" date,
  "status" varchar,
  "created_at" timestamptz DEFAULT now()
);

CREATE TABLE "weight_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "weight" decimal NOT NULL,
  "recorded_at" timestamptz DEFAULT now()
);

CREATE TABLE "meals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "meal_type" varchar,
  "title" varchar,
  "calories" int,
  "protein" decimal,
  "carbs" decimal,
  "fat" decimal,
  "meal_date" date NOT NULL,
  "created_at" timestamptz DEFAULT now()
);

CREATE TABLE "water_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "amount_ml" int NOT NULL,
  "logged_at" timestamptz DEFAULT now()
);

CREATE TABLE "sleep_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "sleep_hours" decimal,
  "sleep_quality" varchar,
  "sleep_date" date NOT NULL,
  "created_at" timestamptz DEFAULT now()
);

CREATE TABLE "step_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "total_steps" int NOT NULL,
  "step_date" date NOT NULL,
  "created_at" timestamptz DEFAULT now()
);

CREATE TABLE "achievements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" varchar NOT NULL,
  "description" text,
  "badge_icon" varchar,
  "created_at" timestamptz DEFAULT now()
);

CREATE TABLE "user_achievements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "achievement_id" uuid NOT NULL,
  "earned_at" timestamptz DEFAULT now()
);

CREATE TABLE "ai_workout_plans" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "goal" varchar,
  "prompt" text,
  "generated_plan" text,
  "created_at" timestamptz DEFAULT now()
);

CREATE TABLE "ai_nutrition_plans" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "prompt" text,
  "generated_plan" text,
  "created_at" timestamptz DEFAULT now()
);

CREATE TABLE "ai_chat_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "question" text NOT NULL,
  "answer" text,
  "created_at" timestamptz DEFAULT now()
);

CREATE TABLE "weekly_reports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "report_data" text,
  "generated_at" timestamptz DEFAULT now()
);

CREATE TABLE "fitness_scores" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "score" int NOT NULL,
  "calculated_at" timestamptz DEFAULT now()
);

CREATE TABLE "notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "title" varchar NOT NULL,
  "message" text,
  "type" varchar,
  "is_read" boolean DEFAULT false,
  "created_at" timestamptz DEFAULT now()
);

ALTER TABLE "refresh_tokens" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "workouts" ADD FOREIGN KEY ("category_id") REFERENCES "workout_categories" ("id") ON DELETE SET NULL;

ALTER TABLE "workout_exercises" ADD FOREIGN KEY ("workout_id") REFERENCES "workouts" ("id") ON DELETE CASCADE;

ALTER TABLE "workout_logs" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "workout_logs" ADD FOREIGN KEY ("workout_id") REFERENCES "workouts" ("id") ON DELETE CASCADE;

ALTER TABLE "goals" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "weight_logs" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "meals" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "water_logs" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "sleep_logs" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "step_logs" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "user_achievements" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "user_achievements" ADD FOREIGN KEY ("achievement_id") REFERENCES "achievements" ("id") ON DELETE CASCADE;

ALTER TABLE "ai_workout_plans" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "ai_nutrition_plans" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "ai_chat_history" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "weekly_reports" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "fitness_scores" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "notifications" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
