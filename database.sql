CREATE TABLE "users" (
  "id" uuid PRIMARY KEY,
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
  "is_verified" boolean,
  "is_blocked" boolean,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "refresh_tokens" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid,
  "token" text,
  "expires_at" timestamp,
  "created_at" timestamp
);

CREATE TABLE "workout_categories" (
  "id" uuid PRIMARY KEY,
  "name" varchar,
  "description" text,
  "created_at" timestamp
);

CREATE TABLE "workouts" (
  "id" uuid PRIMARY KEY,
  "category_id" uuid,
  "title" varchar,
  "description" text,
  "difficulty" varchar,
  "estimated_duration" int,
  "calories_burn_estimate" int,
  "created_at" timestamp
);

CREATE TABLE "workout_exercises" (
  "id" uuid PRIMARY KEY,
  "workout_id" uuid,
  "exercise_name" varchar,
  "sets" int,
  "reps" int,
  "duration_minutes" int,
  "created_at" timestamp
);

CREATE TABLE "workout_logs" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid,
  "workout_id" uuid,
  "workout_date" date,
  "duration_minutes" int,
  "calories_burned" int,
  "notes" text,
  "created_at" timestamp
);

CREATE TABLE "goals" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid,
  "goal_type" varchar,
  "target_value" decimal,
  "current_value" decimal,
  "start_date" date,
  "target_date" date,
  "status" varchar,
  "created_at" timestamp
);

CREATE TABLE "weight_logs" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid,
  "weight" decimal,
  "recorded_at" timestamp
);

CREATE TABLE "meals" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid,
  "meal_type" varchar,
  "title" varchar,
  "calories" int,
  "protein" decimal,
  "carbs" decimal,
  "fat" decimal,
  "meal_date" date,
  "created_at" timestamp
);

CREATE TABLE "water_logs" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid,
  "amount_ml" int,
  "logged_at" timestamp
);

CREATE TABLE "sleep_logs" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid,
  "sleep_hours" decimal,
  "sleep_quality" varchar,
  "sleep_date" date,
  "created_at" timestamp
);

CREATE TABLE "step_logs" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid,
  "total_steps" int,
  "step_date" date,
  "created_at" timestamp
);

CREATE TABLE "achievements" (
  "id" uuid PRIMARY KEY,
  "title" varchar,
  "description" text,
  "badge_icon" varchar,
  "created_at" timestamp
);

CREATE TABLE "user_achievements" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid,
  "achievement_id" uuid,
  "earned_at" timestamp
);

CREATE TABLE "ai_workout_plans" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid,
  "goal" varchar,
  "prompt" text,
  "generated_plan" text,
  "created_at" timestamp
);

CREATE TABLE "ai_nutrition_plans" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid,
  "prompt" text,
  "generated_plan" text,
  "created_at" timestamp
);

CREATE TABLE "ai_chat_history" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid,
  "question" text,
  "answer" text,
  "created_at" timestamp
);

CREATE TABLE "weekly_reports" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid,
  "report_data" text,
  "generated_at" timestamp
);

CREATE TABLE "fitness_scores" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid,
  "score" int,
  "calculated_at" timestamp
);

CREATE TABLE "notifications" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid,
  "title" varchar,
  "message" text,
  "type" varchar,
  "is_read" boolean,
  "created_at" timestamp
);

ALTER TABLE "refresh_tokens" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "workouts" ADD FOREIGN KEY ("category_id") REFERENCES "workout_categories" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "workout_exercises" ADD FOREIGN KEY ("workout_id") REFERENCES "workouts" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "workout_logs" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "workout_logs" ADD FOREIGN KEY ("workout_id") REFERENCES "workouts" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "goals" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "weight_logs" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "meals" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "water_logs" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "sleep_logs" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "step_logs" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "user_achievements" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "user_achievements" ADD FOREIGN KEY ("achievement_id") REFERENCES "achievements" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "ai_workout_plans" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "ai_nutrition_plans" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "ai_chat_history" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "weekly_reports" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "fitness_scores" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "notifications" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;
