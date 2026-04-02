-- ============================================================
-- DrMindit — Seed Data for Development / Testing
-- ============================================================
-- PREREQUISITES: Run schema.sql first.
-- NOTE: UUIDs are hardcoded so this is idempotent (re-runnable).
-- ============================================================

-- ── Organisations ────────────────────────────────────────────
INSERT INTO public.organizations (id, name, type, subscription_tier, admin_user_id)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Greenfield College',    'college',    'professional', NULL),
  ('00000000-0000-0000-0000-000000000002', 'NeoCorp Industries',    'corporate',  'enterprise',   NULL),
  ('00000000-0000-0000-0000-000000000003', 'Ministry of Finance',   'government', 'professional', NULL),
  ('00000000-0000-0000-0000-000000000004', 'Metro Police Dept.',    'police',     'enterprise',   NULL),
  ('00000000-0000-0000-0000-000000000005', '5th Infantry Division', 'military',   'enterprise',   NULL)
ON CONFLICT (id) DO NOTHING;

-- ── Users ────────────────────────────────────────────────────
-- NOTE: In a real Supabase project, auth.users rows must exist first
-- (created via sign-up or `supabase auth invite`).
-- These INSERTs insert into public.users, assuming auth.users is pre-seeded.
INSERT INTO public.users (id, email, full_name, user_type, org_id, onboarding_complete, is_counselor)
VALUES
  -- Greenfield College
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aisha.student@greenfield.edu',  'Aisha Nair',    'student',       '00000000-0000-0000-0000-000000000001', true,  false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'raj.admin@greenfield.edu',      'Raj Sharma',    'student',       '00000000-0000-0000-0000-000000000001', true,  false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaac', 'dr.patel@greenfield.edu',       'Dr. Sima Patel','student',       '00000000-0000-0000-0000-000000000001', true,  true),  -- Counselor
  -- NeoCorp
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'carlos.emp@neocorp.com',        'Carlos Rivera', 'employee',      '00000000-0000-0000-0000-000000000002', true,  false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbc0', 'grace.hr@neocorp.com',          'Grace Kim',     'employee',      '00000000-0000-0000-0000-000000000002', true,  true),   -- Counselor
  -- Ministry of Finance
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'ali.gov@finance.gov',           'Ali Hassan',    'govt_employee', '00000000-0000-0000-0000-000000000003', true,  false),
  -- Metro Police
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'sarah.officer@metropd.gov',     'Sarah O''Brien','officer',       '00000000-0000-0000-0000-000000000004', true,  false),
  -- Military
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'james.soldier@army.mil',        'James Carter',  'military',      '00000000-0000-0000-0000-000000000005', true,  false)
ON CONFLICT (id) DO NOTHING;

-- Set org admins (after users exist)
UPDATE public.organizations SET admin_user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab' WHERE id = '00000000-0000-0000-0000-000000000001';
UPDATE public.organizations SET admin_user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbc0' WHERE id = '00000000-0000-0000-0000-000000000002';

-- ── Mood Logs ────────────────────────────────────────────────
INSERT INTO public.mood_logs (user_id, date, mood_score, energy_level, anxiety_level, notes, phq9_score, gad7_score)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - 6, 6, 7, 4, 'Feeling okay after morning run',    5,  4),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - 5, 4, 5, 6, 'Exam stress hitting hard',          9,  8),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - 4, 7, 8, 3, 'Meditation helped a lot',           3,  2),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - 3, 5, 6, 5, 'Average day, a bit distracted',     6,  5),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - 2, 8, 9, 2, 'Great session with Dr. Patel',      2,  1),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - 1, 6, 7, 4, 'Decent night sleep finally',        4,  3),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE,     7, 8, 3, NULL,                                3,  2),

  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', CURRENT_DATE - 3, 5, 4, 7, 'Deadline pressure at work',        12,  9),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', CURRENT_DATE - 2, 6, 6, 5, 'Breathing exercise helped',         8,  6),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', CURRENT_DATE - 1, 7, 7, 4, 'Team lunch, good conversation',     5,  4),

  ('cccccccc-cccc-cccc-cccc-cccccccccccc', CURRENT_DATE - 2, 6, 6, 5, 'Policy reviews — long day',         6,  5),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', CURRENT_DATE - 1, 5, 5, 6, 'Audit season fatigue',              8,  7),

  ('dddddddd-dddd-dddd-dddd-dddddddddddd', CURRENT_DATE - 4, 4, 5, 8, 'Difficult shift last night',       14, 11),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', CURRENT_DATE - 2, 5, 6, 6, 'Mandatory debrief session',         9,  8),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', CURRENT_DATE,     6, 6, 5, 'Starting to feel better',           7,  5),

  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', CURRENT_DATE - 5, 5, 6, 7, 'Field exercise exhaustion',        10,  9),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', CURRENT_DATE - 2, 6, 7, 5, 'Good debrief with chaplain',        6,  4),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', CURRENT_DATE,     7, 8, 4, NULL,                                4,  3)
ON CONFLICT (user_id, date) DO NOTHING;

-- ── Journal Entries ──────────────────────────────────────────
-- content_encrypted stores base64-encoded AES-256 ciphertext in production.
-- For seed data we store a placeholder token (not real encryption).
INSERT INTO public.journal_entries (user_id, content_encrypted, tags, sentiment_score, cognitive_distortions_detected)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'SEED_PLACEHOLDER::Today I felt overwhelmed with finals but tried the 4-7-8 breathing.',
   ARRAY['exam_stress','breathing'], -0.32,
   ARRAY['catastrophising','fortune_telling']),

  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'SEED_PLACEHOLDER::The morning walk really shifted my perspective. Grateful for small things.',
   ARRAY['gratitude','nature'], 0.71,
   ARRAY[]::TEXT[]),

  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'SEED_PLACEHOLDER::Imposter syndrome is real today. Everyone else seems to have it together.',
   ARRAY['work','self_doubt'], -0.55,
   ARRAY['mind_reading','personalisation']),

  ('dddddddd-dddd-dddd-dddd-dddddddddddd',
   'SEED_PLACEHOLDER::Tough call last night. Hard to shake it off. Need to talk to someone.',
   ARRAY['trauma','shift_work'], -0.78,
   ARRAY['emotional_reasoning']),

  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
   'SEED_PLACEHOLDER::Letters from home always help. Counting days until leave.',
   ARRAY['loneliness','resilience'], 0.12,
   ARRAY[]::TEXT[])
ON CONFLICT DO NOTHING;

-- ── Sleep Logs ───────────────────────────────────────────────
INSERT INTO public.sleep_logs (user_id, date, bedtime, wake_time, quality_score, cbti_protocol_followed, sleep_efficiency)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - 2,
   (CURRENT_DATE - 2 + INTERVAL '23 hours'), (CURRENT_DATE - 1 + INTERVAL '7 hours'),  6, true,  75.0),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - 1,
   (CURRENT_DATE - 1 + INTERVAL '22 hours 30 minutes'), (CURRENT_DATE + INTERVAL '7 hours 30 minutes'), 8, true, 88.5),

  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', CURRENT_DATE - 2,
   (CURRENT_DATE - 2 + INTERVAL '1 hour'), (CURRENT_DATE - 1 + INTERVAL '6 hours'), 5, false, 68.0),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', CURRENT_DATE - 1,
   (CURRENT_DATE - 1 + INTERVAL '23 hours'), (CURRENT_DATE + INTERVAL '7 hours'), 7, true, 82.3),

  ('dddddddd-dddd-dddd-dddd-dddddddddddd', CURRENT_DATE - 2,
   (CURRENT_DATE - 2 + INTERVAL '20 hours'), (CURRENT_DATE - 2 + INTERVAL '5 hours'), 4, false, 60.0),

  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', CURRENT_DATE - 1,
   (CURRENT_DATE - 1 + INTERVAL '21 hours'), (CURRENT_DATE + INTERVAL '5 hours'), 5, false, 65.5)
ON CONFLICT (user_id, date) DO NOTHING;

-- ── Breathing Sessions ───────────────────────────────────────
INSERT INTO public.breathing_sessions (user_id, technique, duration_seconds, completed_at, hrv_before, hrv_after)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '478',       300, NOW() - INTERVAL '5 days', 42.1, 55.3),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'box',       240, NOW() - INTERVAL '3 days', 38.7, 51.2),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'coherence', 600, NOW() - INTERVAL '1 day',  44.0, 60.1),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'box',       180, NOW() - INTERVAL '2 days', 35.0, 44.5),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '478',       300, NOW() - INTERVAL '1 day',  37.2, 49.8),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'coherence', 480, NOW() - INTERVAL '2 days', NULL, NULL),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'box',       600, NOW() - INTERVAL '3 days', 29.5, 38.0),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '478',       300, NOW() - INTERVAL '1 day',  31.0, 41.3),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'coherence', 720, NOW() - INTERVAL '4 days', 33.0, 46.7)
ON CONFLICT DO NOTHING;

-- ── AI Chat Sessions ─────────────────────────────────────────
INSERT INTO public.ai_chat_sessions (id, user_id, started_at, ended_at, message_count, crisis_flag, escalated_to_human)
VALUES
  ('f1000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '12 minutes', 8,  false, false),
  ('f1000000-0000-0000-0000-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '20 minutes', 14, false, false),
  ('f1000000-0000-0000-0000-000000000003', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NOW() - INTERVAL '1 day',  NOW() - INTERVAL '1 day'  + INTERVAL '30 minutes', 22, true,  true),   -- Crisis
  ('f1000000-0000-0000-0000-000000000004', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days' + INTERVAL '15 minutes', 10, false, false),
  ('f1000000-0000-0000-0000-000000000005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '30 minutes', NULL, 4, false, false)  -- Active session
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.ai_chat_messages (session_id, user_id, role, content)
VALUES
  ('f1000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'user',      'I feel really anxious about my upcoming exams.'),
  ('f1000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'assistant', 'I hear you. Exam pressure can feel overwhelming. Would you like to try a 3-minute breathing reset right now?'),
  ('f1000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'user',      'Yes please'),
  ('f1000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'assistant', 'Great — starting the 4-7-8 technique now. [ACTION: {"type": "start_session", "payload": {"sessionId": "breathe-478", "text": "4-7-8 Breathing"}}]'),

  ('f1000000-0000-0000-0000-000000000003', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'user',      'I cant stop thinking about what happened last week. I don''t see the point anymore.'),
  ('f1000000-0000-0000-0000-000000000003', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'assistant', 'I hear you, and I''m really glad you told me. Please reach out to a crisis line immediately — call or text 988. You are not alone. I''m connecting you with a counselor right now.'),
  ('f1000000-0000-0000-0000-000000000003', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'user',      'ok'),
  ('f1000000-0000-0000-0000-000000000003', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'assistant', 'You''ve done the right thing reaching out. Grace from your organisation has been notified and will contact you within the next few minutes. Stay with me — how are you breathing right now?')
ON CONFLICT DO NOTHING;

-- ── Crisis Events ─────────────────────────────────────────────
INSERT INTO public.crisis_events (id, user_id, detected_at, severity, trigger_source, counselor_notified, counselor_id, resolved_at, resolution_notes)
VALUES
  (
    'c1000000-0000-0000-0000-000000000001',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    NOW() - INTERVAL '1 day',
    '4',
    'ai_chat',
    true,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbc0',   -- Grace Kim (counselor from NeoCorp mapped as test)
    NULL,                                      -- Not yet resolved
    NULL
  )
ON CONFLICT (id) DO NOTHING;

-- Crisis triggered by high PHQ-9
INSERT INTO public.crisis_events (id, user_id, detected_at, severity, trigger_source, counselor_notified, counselor_id, resolved_at, resolution_notes)
VALUES
  (
    'c1000000-0000-0000-0000-000000000002',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    NOW() - INTERVAL '3 days',
    '3',
    'phq9',
    true,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbc0',
    NOW() - INTERVAL '1 day',
    'Follow-up call completed. EAP referral made. User stable.'
  )
ON CONFLICT (id) DO NOTHING;

-- ── Org Analytics (pre-aggregated snapshots) ──────────────────
INSERT INTO public.org_analytics (
  org_id, period_start, period_type,
  total_active_users, avg_mood_score, avg_sleep_efficiency,
  avg_anxiety_level, total_breathing_sessions, total_journal_entries, crisis_events_count
)
VALUES
  -- Greenfield College — last 7 days
  ('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 7, 'weekly', 3, 6.2, 82.0, 4.2, 12, 5, 0),
  -- NeoCorp — last 7 days
  ('00000000-0000-0000-0000-000000000002', CURRENT_DATE - 7, 'weekly', 2, 5.8, 75.0, 5.8, 6,  3, 1),
  -- Metro Police — last 7 days
  ('00000000-0000-0000-0000-000000000004', CURRENT_DATE - 7, 'weekly', 1, 5.0, 60.0, 6.5, 4,  2, 1),
  -- Military — last 7 days
  ('00000000-0000-0000-0000-000000000005', CURRENT_DATE - 7, 'weekly', 1, 6.0, 65.5, 5.5, 3,  1, 0),

  -- Daily snapshots (today)
  ('00000000-0000-0000-0000-000000000001', CURRENT_DATE, 'daily', 2, 7.0, 88.5, 3.0, 2, 1, 0),
  ('00000000-0000-0000-0000-000000000002', CURRENT_DATE, 'daily', 1, 7.0, 82.3, 4.0, 1, 0, 0)
ON CONFLICT (org_id, period_start, period_type) DO NOTHING;

-- ============================================================
-- Verification queries — comment out before production use
-- ============================================================
-- SELECT * FROM public.organizations;
-- SELECT id, email, user_type, org_id, is_counselor FROM public.users;
-- SELECT user_id, date, mood_score, phq9_score FROM public.mood_logs ORDER BY date DESC LIMIT 10;
-- SELECT id, user_id, severity, trigger_source, resolved_at FROM public.crisis_events;
-- SELECT org_id, period_type, avg_mood_score, crisis_events_count FROM public.org_analytics;
