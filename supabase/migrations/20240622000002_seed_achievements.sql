-- Seed achievements master list
INSERT INTO "achievements" ("id", "title", "description", "badge_icon", "created_at") VALUES
('a0000000-0000-0000-0000-000000000001', 'First Steps', 'Logged your first workout template.', 'first_workout', NOW()),
('a0000000-0000-0000-0000-000000000002', 'Consistency Champion', 'Reach a 3-day workout streak.', 'streak_3', NOW()),
('a0000000-0000-0000-0000-000000000003', 'Dedicated Athlete', 'Reach a 7-day workout streak.', 'streak_7', NOW()),
('a0000000-0000-0000-0000-000000000004', 'Workout Warrior', 'Log 10 workouts total.', 'workouts_10', NOW()),
('a0000000-0000-0000-0000-000000000005', 'Early Bird', 'Logged a workout before 8:00 AM.', 'early_bird', NOW()),
('a0000000-0000-0000-0000-000000000006', 'Night Owl', 'Logged a workout after 8:00 PM.', 'night_owl', NOW())
ON CONFLICT (id) DO NOTHING;
