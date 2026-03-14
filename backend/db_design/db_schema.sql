-- ============================================================
-- Athlete Dating App – Full Database Schema
-- ============================================================

-- ------------------------------------------------------------
-- Table 1: Users
-- ------------------------------------------------------------
CREATE TABLE users (
    user_id             INT             NOT NULL AUTO_INCREMENT,
    email               VARCHAR(255)    NOT NULL,
    password_hash       VARCHAR(255)    NOT NULL,
    role                ENUM('user', 'admin')                   NOT NULL DEFAULT 'user',
    account_status      ENUM('active', 'suspended', 'banned')   NOT NULL DEFAULT 'active',
    onboarding_complete BOOLEAN         NOT NULL DEFAULT FALSE,
    last_active         TIMESTAMP       NULL,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    UNIQUE KEY uq_users_email (email)
);

-- ------------------------------------------------------------
-- Table 2: Genders (lookup)
-- ------------------------------------------------------------
CREATE TABLE genders (
    gender_id   INT             NOT NULL AUTO_INCREMENT,
    gender_name VARCHAR(50)     NOT NULL,
    PRIMARY KEY (gender_id)
);

INSERT INTO genders (gender_name) VALUES
    ('Male'),
    ('Female'),
    ('Non-binary'),
    ('Prefer not to say');

-- ------------------------------------------------------------
-- Table 3: Countries (lookup)
-- ------------------------------------------------------------
CREATE TABLE countries (
    country_id   INT          NOT NULL AUTO_INCREMENT,
    country_code CHAR(2)      NOT NULL,
    country_name VARCHAR(100) NOT NULL,
    PRIMARY KEY (country_id),
    UNIQUE KEY uq_countries_code (country_code)
);

INSERT INTO countries (country_code, country_name) VALUES
    ('IE', 'Ireland'),
    ('US', 'United States'),
    ('GB', 'United Kingdom');

-- ------------------------------------------------------------
-- Table 4: Cities (lookup)
-- ------------------------------------------------------------
CREATE TABLE cities (
    city_id     INT          NOT NULL AUTO_INCREMENT,
    country_id  INT          NOT NULL,
    city_name   VARCHAR(100) NOT NULL,
    PRIMARY KEY (city_id),
    CONSTRAINT fk_cities_country FOREIGN KEY (country_id) REFERENCES countries (country_id)
);

-- ------------------------------------------------------------
-- Table 5: Profiles
-- ------------------------------------------------------------
CREATE TABLE profiles (
    user_id     INT          NOT NULL,
    first_name  VARCHAR(100) NOT NULL,
    last_name   VARCHAR(100) NOT NULL,
    birth_date  DATE         NOT NULL,
    gender_id   INT          NOT NULL,
    city_id     INT          NOT NULL,
    bio         TEXT         NULL,
    PRIMARY KEY (user_id),
    CONSTRAINT fk_profiles_user   FOREIGN KEY (user_id)   REFERENCES users   (user_id),
    CONSTRAINT fk_profiles_gender FOREIGN KEY (gender_id) REFERENCES genders (gender_id),
    CONSTRAINT fk_profiles_city   FOREIGN KEY (city_id)   REFERENCES cities  (city_id)
);

-- ------------------------------------------------------------
-- Table 6: User Photos
-- ------------------------------------------------------------
CREATE TABLE user_photos (
    photo_id      INT          NOT NULL AUTO_INCREMENT,
    user_id       INT          NOT NULL,
    photo_url     VARCHAR(255) NOT NULL,
    display_order INT          NOT NULL DEFAULT 0,
    uploaded_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (photo_id),
    CONSTRAINT fk_user_photos_user FOREIGN KEY (user_id) REFERENCES users (user_id)
);

-- ------------------------------------------------------------
-- Table 7: Sports
-- ------------------------------------------------------------
CREATE TABLE sports (
    sport_id   INT          NOT NULL AUTO_INCREMENT,
    sport_name VARCHAR(100) NOT NULL,
    PRIMARY KEY (sport_id)
);

INSERT INTO sports (sport_name) VALUES
    ('Running'),
    ('CrossFit'),
    ('Cycling'),
    ('Football'),
    ('Tennis')
    ('Rugby');

-- ------------------------------------------------------------
-- Table 8: Skill Levels (lookup)
-- ------------------------------------------------------------
CREATE TABLE skill_levels (
    skill_level_id INT         NOT NULL AUTO_INCREMENT,
    level_name     VARCHAR(50) NOT NULL,
    sort_order     INT         NOT NULL DEFAULT 0,
    PRIMARY KEY (skill_level_id)
);

INSERT INTO skill_levels (level_name, sort_order) VALUES
    ('Beginner',       1),
    ('Intermediate',   2),
    ('Advanced',       3),
    ('Professional',   4);

-- ------------------------------------------------------------
-- Table 9: Training Frequencies (lookup)
-- ------------------------------------------------------------
CREATE TABLE training_frequencies (
    frequency_id    INT         NOT NULL AUTO_INCREMENT,
    frequency_label VARCHAR(50) NOT NULL,
    sort_order      INT         NOT NULL DEFAULT 0,
    PRIMARY KEY (frequency_id)
);

INSERT INTO training_frequencies (frequency_label, sort_order) VALUES
    ('Rarely',          1),
    ('1–2x per week',   2),
    ('3–4x per week',   3),
    ('5+ per week',     4),
    ('Daily',           5);

-- ------------------------------------------------------------
-- Table 10: User Sports
-- ------------------------------------------------------------
CREATE TABLE user_sports (
    user_id           INT NOT NULL,
    sport_id          INT NOT NULL,
    skill_level_id    INT NOT NULL,
    years_experience  INT NULL,
    frequency_id      INT NOT NULL,
    PRIMARY KEY (user_id, sport_id),
    CONSTRAINT fk_user_sports_user      FOREIGN KEY (user_id)        REFERENCES users               (user_id),
    CONSTRAINT fk_user_sports_sport     FOREIGN KEY (sport_id)       REFERENCES sports              (sport_id),
    CONSTRAINT fk_user_sports_skill     FOREIGN KEY (skill_level_id) REFERENCES skill_levels        (skill_level_id),
    CONSTRAINT fk_user_sports_frequency FOREIGN KEY (frequency_id)   REFERENCES training_frequencies(frequency_id)
);

-- ------------------------------------------------------------
-- Table 11: Relationship Goals (lookup)
-- ------------------------------------------------------------
CREATE TABLE relationship_goals (
    goal_id   INT         NOT NULL AUTO_INCREMENT,
    goal_name VARCHAR(50) NOT NULL,
    PRIMARY KEY (goal_id)
);

INSERT INTO relationship_goals (goal_name) VALUES
    ('Casual'),
    ('Serious'),
    ('Friendship'),
    ('Not sure');

-- ------------------------------------------------------------
-- Table 12: Preferences
-- ------------------------------------------------------------
CREATE TABLE preferences (
    user_id         INT NOT NULL,
    gender_id       INT NOT NULL,
    min_age         INT NOT NULL DEFAULT 18,
    max_age         INT NOT NULL DEFAULT 99,
    max_distance_km INT NULL,
    goal_id         INT NOT NULL,
    PRIMARY KEY (user_id),
    CONSTRAINT fk_preferences_user   FOREIGN KEY (user_id)   REFERENCES users               (user_id),
    CONSTRAINT fk_preferences_gender FOREIGN KEY (gender_id) REFERENCES genders             (gender_id),
    CONSTRAINT fk_preferences_goal   FOREIGN KEY (goal_id)   REFERENCES relationship_goals  (goal_id)
);

-- ------------------------------------------------------------
-- Table 13: Preference Sports
-- ------------------------------------------------------------
CREATE TABLE preference_sports (
    user_id  INT NOT NULL,
    sport_id INT NOT NULL,
    PRIMARY KEY (user_id, sport_id),
    CONSTRAINT fk_preference_sports_user  FOREIGN KEY (user_id)  REFERENCES users  (user_id),
    CONSTRAINT fk_preference_sports_sport FOREIGN KEY (sport_id) REFERENCES sports (sport_id)
);

-- ------------------------------------------------------------
-- Table 14: Likes
-- ------------------------------------------------------------
CREATE TABLE likes (
    like_id    INT       NOT NULL AUTO_INCREMENT,
    liker_id   INT       NOT NULL,
    liked_id   INT       NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (like_id),
    UNIQUE KEY uq_likes (liker_id, liked_id),
    CONSTRAINT fk_likes_liker FOREIGN KEY (liker_id) REFERENCES users (user_id),
    CONSTRAINT fk_likes_liked FOREIGN KEY (liked_id) REFERENCES users (user_id)
);

-- ------------------------------------------------------------
-- Table 15: Passes
-- ------------------------------------------------------------
CREATE TABLE passes (
    pass_id    INT       NOT NULL AUTO_INCREMENT,
    passer_id  INT       NOT NULL,
    passed_id  INT       NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (pass_id),
    UNIQUE KEY uq_passes (passer_id, passed_id),
    CONSTRAINT fk_passes_passer FOREIGN KEY (passer_id) REFERENCES users (user_id),
    CONSTRAINT fk_passes_passed FOREIGN KEY (passed_id) REFERENCES users (user_id)
);

-- ------------------------------------------------------------
-- Table 16: Matches
-- ------------------------------------------------------------
CREATE TABLE matches (
    match_id   INT       NOT NULL AUTO_INCREMENT,
    user1_id   INT       NOT NULL,
    user2_id   INT       NOT NULL,
    matched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (match_id),
    UNIQUE KEY uq_matches (user1_id, user2_id),
    CONSTRAINT fk_matches_user1 FOREIGN KEY (user1_id) REFERENCES users (user_id),
    CONSTRAINT fk_matches_user2 FOREIGN KEY (user2_id) REFERENCES users (user_id)
);

-- ------------------------------------------------------------
-- Table 17: Messages
-- ------------------------------------------------------------
CREATE TABLE messages (
    message_id   INT       NOT NULL AUTO_INCREMENT,
    match_id     INT       NOT NULL,
    sender_id    INT       NOT NULL,
    message_text TEXT      NOT NULL,
    sent_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at      TIMESTAMP NULL,
    PRIMARY KEY (message_id),
    CONSTRAINT fk_messages_match  FOREIGN KEY (match_id)  REFERENCES matches (match_id),
    CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users   (user_id)
);

-- ------------------------------------------------------------
-- Table 18: Notification Types (lookup)
-- ------------------------------------------------------------
CREATE TABLE notification_types (
    type_id   INT         NOT NULL AUTO_INCREMENT,
    type_name VARCHAR(50) NOT NULL,
    PRIMARY KEY (type_id)
);

INSERT INTO notification_types (type_name) VALUES
    ('new_match'),
    ('new_message'),
    ('admin_warning');

-- ------------------------------------------------------------
-- Table 19: Notifications
-- ------------------------------------------------------------
CREATE TABLE notifications (
    notification_id INT          NOT NULL AUTO_INCREMENT,
    user_id         INT          NOT NULL,
    type_id         INT          NOT NULL,
    match_id        INT          NULL,
    message_id      INT          NULL,
    complaint_id    INT          NULL,
    message         VARCHAR(255) NOT NULL,
    is_read         BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (notification_id),
    CONSTRAINT fk_notifications_user       FOREIGN KEY (user_id)      REFERENCES users             (user_id),
    CONSTRAINT fk_notifications_type       FOREIGN KEY (type_id)      REFERENCES notification_types(type_id),
    CONSTRAINT fk_notifications_match      FOREIGN KEY (match_id)     REFERENCES matches           (match_id),
    CONSTRAINT fk_notifications_message    FOREIGN KEY (message_id)   REFERENCES messages          (message_id),
    -- fk_notifications_complaint added after complaints table is created (see below)
    CONSTRAINT chk_notifications_ref CHECK (
        (match_id      IS NOT NULL AND message_id IS NULL     AND complaint_id IS NULL) OR
        (match_id      IS NULL     AND message_id IS NOT NULL AND complaint_id IS NULL) OR
        (match_id      IS NULL     AND message_id IS NULL     AND complaint_id IS NOT NULL)
    )
);

-- ------------------------------------------------------------
-- Table 20: Password Reset Tokens
-- ------------------------------------------------------------
CREATE TABLE password_reset_tokens (
    token_id   INT          NOT NULL AUTO_INCREMENT,
    user_id    INT          NOT NULL,
    token      VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP    NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (token_id),
    UNIQUE KEY uq_password_reset_token (token),
    CONSTRAINT fk_password_reset_user FOREIGN KEY (user_id) REFERENCES users (user_id)
);

-- ------------------------------------------------------------
-- Table 21: Blocked Users
-- ------------------------------------------------------------
CREATE TABLE blocked_users (
    block_id   INT       NOT NULL AUTO_INCREMENT,
    blocker_id INT       NOT NULL,
    blocked_id INT       NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (block_id),
    UNIQUE KEY uq_blocked_users (blocker_id, blocked_id),
    CONSTRAINT fk_blocked_users_blocker FOREIGN KEY (blocker_id) REFERENCES users (user_id),
    CONSTRAINT fk_blocked_users_blocked FOREIGN KEY (blocked_id) REFERENCES users (user_id)
);

-- ------------------------------------------------------------
-- Table 22: Complaint Types (lookup)
-- ------------------------------------------------------------
CREATE TABLE complaint_types (
    type_id   INT         NOT NULL AUTO_INCREMENT,
    type_name VARCHAR(50) NOT NULL,
    PRIMARY KEY (type_id)
);

INSERT INTO complaint_types (type_name) VALUES
    ('Harassment'),
    ('Spam'),
    ('Inappropriate Content'),
    ('Fake Profile'),
    ('Other');

-- ------------------------------------------------------------
-- Table 23: Complaint Statuses (lookup)
-- ------------------------------------------------------------
CREATE TABLE complaint_statuses (
    status_id   INT         NOT NULL AUTO_INCREMENT,
    status_name VARCHAR(50) NOT NULL,
    PRIMARY KEY (status_id)
);

INSERT INTO complaint_statuses (status_name) VALUES
    ('Pending'),
    ('Under Review'),
    ('Resolved'),
    ('Dismissed');

-- ------------------------------------------------------------
-- Table 24: Complaints
-- ------------------------------------------------------------
CREATE TABLE complaints (
    complaint_id INT       NOT NULL AUTO_INCREMENT,
    reporter_id  INT       NOT NULL,
    reported_id  INT       NOT NULL,
    type_id      INT       NOT NULL,
    description  TEXT      NULL,
    status_id    INT       NOT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (complaint_id),
    CONSTRAINT fk_complaints_reporter FOREIGN KEY (reporter_id) REFERENCES users              (user_id),
    CONSTRAINT fk_complaints_reported FOREIGN KEY (reported_id) REFERENCES users              (user_id),
    CONSTRAINT fk_complaints_type     FOREIGN KEY (type_id)     REFERENCES complaint_types    (type_id),
    CONSTRAINT fk_complaints_status   FOREIGN KEY (status_id)   REFERENCES complaint_statuses (status_id)
);

-- ------------------------------------------------------------
-- Back-fill FK: notifications.complaint_id → complaints
-- (Added after complaints table exists)
-- ------------------------------------------------------------
ALTER TABLE notifications
    ADD CONSTRAINT fk_notifications_complaint
    FOREIGN KEY (complaint_id) REFERENCES complaints (complaint_id);
