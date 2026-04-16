-- ============================================================
-- Migration: add ON DELETE CASCADE to all FKs that reference
-- users, matches, messages, or complaints so that deleting a
-- user cleans up all child rows automatically.
--
-- Each FK is dropped first, then re-added in a separate
-- statement to avoid MySQL's duplicate-name validation error.
-- ============================================================

-- profiles
ALTER TABLE profiles DROP FOREIGN KEY fk_profiles_user;
ALTER TABLE profiles ADD CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE;

-- user_photos
ALTER TABLE user_photos DROP FOREIGN KEY fk_user_photos_user;
ALTER TABLE user_photos ADD CONSTRAINT fk_user_photos_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE;

-- user_sports
ALTER TABLE user_sports DROP FOREIGN KEY fk_user_sports_user;
ALTER TABLE user_sports ADD CONSTRAINT fk_user_sports_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE;

-- preferences
ALTER TABLE preferences DROP FOREIGN KEY fk_preferences_user;
ALTER TABLE preferences ADD CONSTRAINT fk_preferences_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE;

-- preference_sports
ALTER TABLE preference_sports DROP FOREIGN KEY fk_preference_sports_user;
ALTER TABLE preference_sports ADD CONSTRAINT fk_preference_sports_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE;

-- likes
ALTER TABLE likes DROP FOREIGN KEY fk_likes_liker;
ALTER TABLE likes ADD CONSTRAINT fk_likes_liker FOREIGN KEY (liker_id) REFERENCES users (user_id) ON DELETE CASCADE;

ALTER TABLE likes DROP FOREIGN KEY fk_likes_liked;
ALTER TABLE likes ADD CONSTRAINT fk_likes_liked FOREIGN KEY (liked_id) REFERENCES users (user_id) ON DELETE CASCADE;

-- passes
ALTER TABLE passes DROP FOREIGN KEY fk_passes_passer;
ALTER TABLE passes ADD CONSTRAINT fk_passes_passer FOREIGN KEY (passer_id) REFERENCES users (user_id) ON DELETE CASCADE;

ALTER TABLE passes DROP FOREIGN KEY fk_passes_passed;
ALTER TABLE passes ADD CONSTRAINT fk_passes_passed FOREIGN KEY (passed_id) REFERENCES users (user_id) ON DELETE CASCADE;

-- matches
ALTER TABLE matches DROP FOREIGN KEY fk_matches_user1;
ALTER TABLE matches ADD CONSTRAINT fk_matches_user1 FOREIGN KEY (user1_id) REFERENCES users (user_id) ON DELETE CASCADE;

ALTER TABLE matches DROP FOREIGN KEY fk_matches_user2;
ALTER TABLE matches ADD CONSTRAINT fk_matches_user2 FOREIGN KEY (user2_id) REFERENCES users (user_id) ON DELETE CASCADE;

-- messages
ALTER TABLE messages DROP FOREIGN KEY fk_messages_match;
ALTER TABLE messages ADD CONSTRAINT fk_messages_match FOREIGN KEY (match_id) REFERENCES matches (match_id) ON DELETE CASCADE;

ALTER TABLE messages DROP FOREIGN KEY fk_messages_sender;
ALTER TABLE messages ADD CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users (user_id) ON DELETE CASCADE;

-- notifications
ALTER TABLE notifications DROP FOREIGN KEY fk_notifications_user;
ALTER TABLE notifications ADD CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE;

ALTER TABLE notifications DROP FOREIGN KEY fk_notifications_match;
ALTER TABLE notifications ADD CONSTRAINT fk_notifications_match FOREIGN KEY (match_id) REFERENCES matches (match_id) ON DELETE CASCADE;

ALTER TABLE notifications DROP FOREIGN KEY fk_notifications_message;
ALTER TABLE notifications ADD CONSTRAINT fk_notifications_message FOREIGN KEY (message_id) REFERENCES messages (message_id) ON DELETE CASCADE;

ALTER TABLE notifications DROP FOREIGN KEY fk_notifications_complaint;
ALTER TABLE notifications ADD CONSTRAINT fk_notifications_complaint FOREIGN KEY (complaint_id) REFERENCES complaints (complaint_id) ON DELETE CASCADE;

-- password_reset_tokens
ALTER TABLE password_reset_tokens DROP FOREIGN KEY fk_password_reset_user;
ALTER TABLE password_reset_tokens ADD CONSTRAINT fk_password_reset_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE;

-- blocked_users
ALTER TABLE blocked_users DROP FOREIGN KEY fk_blocked_users_blocker;
ALTER TABLE blocked_users ADD CONSTRAINT fk_blocked_users_blocker FOREIGN KEY (blocker_id) REFERENCES users (user_id) ON DELETE CASCADE;

ALTER TABLE blocked_users DROP FOREIGN KEY fk_blocked_users_blocked;
ALTER TABLE blocked_users ADD CONSTRAINT fk_blocked_users_blocked FOREIGN KEY (blocked_id) REFERENCES users (user_id) ON DELETE CASCADE;

-- complaints
ALTER TABLE complaints DROP FOREIGN KEY fk_complaints_reporter;
ALTER TABLE complaints ADD CONSTRAINT fk_complaints_reporter FOREIGN KEY (reporter_id) REFERENCES users (user_id) ON DELETE CASCADE;

ALTER TABLE complaints DROP FOREIGN KEY fk_complaints_reported;
ALTER TABLE complaints ADD CONSTRAINT fk_complaints_reported FOREIGN KEY (reported_id) REFERENCES users (user_id) ON DELETE CASCADE;
