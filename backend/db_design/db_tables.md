# Athlete Dating App – Database Schema

---

## Table 1: Users

This table stores authentication and account information.

| Field               | Type                                  | Key     |
| ------------------- | ------------------------------------- | ------- |
| user_id             | INT                                   | Primary |
| email               | VARCHAR(255)                          | Unique  |
| password_hash       | VARCHAR(255)                          |         |
| role                | ENUM('user', 'admin')                 |         |
| account_status      | ENUM('active', 'suspended', 'banned') |         |
| onboarding_complete | BOOLEAN                               |         |
| last_active         | TIMESTAMP                             |         |
| created_at          | TIMESTAMP                             |         |

---

## Table 2: Genders *(lookup)*

This table stores the valid gender options used across Profiles and Preferences.

| Field       | Type         | Key     |
| ----------- | ------------ | ------- |
| gender_id   | INT          | Primary |
| gender_name | VARCHAR(50)  |         |

Example values: Male, Female, Non-binary, Prefer not to say

---

## Table 3: Countries *(lookup)*

This table stores country data.

| Field        | Type        | Key     |
| ------------ | ----------- | ------- |
| country_id   | INT         | Primary |
| country_code | CHAR(2)     | Unique  |
| country_name | VARCHAR(100)|         |

Example values: (IE, Ireland), (US, United States), (GB, United Kingdom)

---

## Table 4: Cities *(lookup)*

This table stores cities linked to countries.

| Field      | Type         | Key     |
| ---------- | ------------ | ------- |
| city_id    | INT          | Primary |
| country_id | INT          | Foreign |
| city_name  | VARCHAR(100) |         |

Foreign Keys:

* `country_id → countries.country_id`

---

## Table 5: Profiles

This table stores descriptive information about the user.

| Field      | Type         | Key              |
| ---------- | ------------ | ---------------- |
| user_id    | INT          | Primary, Foreign |
| first_name | VARCHAR(100) |                  |
| last_name  | VARCHAR(100) |                  |
| birth_date | DATE         |                  |
| gender_id  | INT          | Foreign          |
| height_cm  | INT          |                  |
| city_id    | INT          | Foreign          |
| bio        | TEXT         |                  |

Foreign Keys:

* `user_id → users.user_id`
* `gender_id → genders.gender_id`
* `city_id → cities.city_id`

> Country is derived via `cities.country_id` — no redundant column needed.

---

## Table 6: User Photos

This table stores profile photos for each user. Each user can upload multiple photos.

| Field         | Type         | Key     |
| ------------- | ------------ | ------- |
| photo_id      | INT          | Primary |
| user_id       | INT          | Foreign |
| photo_url     | VARCHAR(255) |         |
| display_order | INT          |         |
| uploaded_at   | TIMESTAMP    |         |

Foreign Keys:

* `user_id → users.user_id`

---

## Table 7: Sports

This table contains all sports supported by the platform.

| Field      | Type         | Key     |
| ---------- | ------------ | ------- |
| sport_id   | INT          | Primary |
| sport_name | VARCHAR(100) |         |

Example values: Running, CrossFit, Cycling, Football, Tennis

---

## Table 8: Skill Levels *(lookup)*

This table stores the valid skill level options for user sports.

| Field          | Type        | Key     |
| -------------- | ----------- | ------- |
| skill_level_id | INT         | Primary |
| level_name     | VARCHAR(50) |         |
| sort_order     | INT         |         |

Example values (in order): Beginner, Intermediate, Advanced, Professional

---

## Table 9: Training Frequencies *(lookup)*

This table stores the valid training frequency options for user sports.

| Field           | Type        | Key     |
| --------------- | ----------- | ------- |
| frequency_id    | INT         | Primary |
| frequency_label | VARCHAR(50) |         |
| sort_order      | INT         |         |

Example values (in order): Rarely, 1–2x per week, 3–4x per week, 5+ per week, Daily

---

## Table 10: User Sports

This table records which sports a user practices.

| Field          | Type | Key     |
| -------------- | ---- | ------- |
| user_id        | INT  | Foreign |
| sport_id       | INT  | Foreign |
| skill_level_id | INT  | Foreign |
| years_experience | INT |        |
| frequency_id   | INT  | Foreign |

Primary Key:

* `(user_id, sport_id)`

Foreign Keys:

* `user_id → users.user_id`
* `sport_id → sports.sport_id`
* `skill_level_id → skill_levels.skill_level_id`
* `frequency_id → training_frequencies.frequency_id`

---

## Table 11: Relationship Goals *(lookup)*

This table stores valid relationship goal options used in Preferences.

| Field     | Type        | Key     |
| --------- | ----------- | ------- |
| goal_id   | INT         | Primary |
| goal_name | VARCHAR(50) |         |

Example values: Casual, Serious, Friendship, Not sure

---

## Table 12: Preferences

This table stores matching preferences for each user.

| Field           | Type | Key              |
| --------------- | ---- | ---------------- |
| user_id         | INT  | Primary, Foreign |
| gender_id       | INT  | Foreign          |
| min_age         | INT  |                  |
| max_age         | INT  |                  |
| max_distance_km | INT  |                  |
| goal_id         | INT  | Foreign          |

Foreign Keys:

* `user_id → users.user_id`
* `gender_id → genders.gender_id`
* `goal_id → relationship_goals.goal_id`

---

## Table 13: Preference Sports

This table stores sports that the user prefers their matches to practice.

| Field    | Type | Key     |
| -------- | ---- | ------- |
| user_id  | INT  | Foreign |
| sport_id | INT  | Foreign |

Primary Key:

* `(user_id, sport_id)`

Foreign Keys:

* `user_id → users.user_id`
* `sport_id → sports.sport_id`

---

## Table 14: Likes

This table records swipe/like actions between users.

| Field      | Type      | Key     |
| ---------- | --------- | ------- |
| like_id    | INT       | Primary |
| liker_id   | INT       | Foreign |
| liked_id   | INT       | Foreign |
| created_at | TIMESTAMP |         |

Foreign Keys:

* `liker_id → users.user_id`
* `liked_id → users.user_id`

---

## Table 15: Passes

This table records swipe-left (pass/dislike) actions to prevent showing the same profile again.

| Field      | Type      | Key     |
| ---------- | --------- | ------- |
| pass_id    | INT       | Primary |
| passer_id  | INT       | Foreign |
| passed_id  | INT       | Foreign |
| created_at | TIMESTAMP |         |

Foreign Keys:

* `passer_id → users.user_id`
* `passed_id → users.user_id`

---

## Table 16: Matches

This table records mutual matches between users.

| Field      | Type      | Key     |
| ---------- | --------- | ------- |
| match_id   | INT       | Primary |
| user1_id   | INT       | Foreign |
| user2_id   | INT       | Foreign |
| matched_at | TIMESTAMP |         |

Foreign Keys:

* `user1_id → users.user_id`
* `user2_id → users.user_id`

---

## Table 17: Messages

This table stores messages between matched users.

| Field        | Type      | Key     |
| ------------ | --------- | ------- |
| message_id   | INT       | Primary |
| match_id     | INT       | Foreign |
| sender_id    | INT       | Foreign |
| message_text | TEXT      |         |
| sent_at      | TIMESTAMP |         |
| read_at      | TIMESTAMP |         |

Foreign Keys:

* `match_id → matches.match_id`
* `sender_id → users.user_id`

---

## Table 18: Notification Types *(lookup)*

This table stores the valid notification type options.

| Field     | Type        | Key     |
| --------- | ----------- | ------- |
| type_id   | INT         | Primary |
| type_name | VARCHAR(50) |         |

Example values: new_match, new_message, admin_warning

---

## Table 19: Notifications

This table stores in-app notifications for users.

Each notification references at most one related entity via a dedicated nullable FK column. Only the column relevant to the notification type is populated; the others are NULL. This preserves full referential integrity without a generic polymorphic `reference_id`.

| Field           | Type         | Key     |
| --------------- | ------------ | ------- |
| notification_id | INT          | Primary |
| user_id         | INT          | Foreign |
| type_id         | INT          | Foreign |
| match_id        | INT NULL     | Foreign |
| message_id      | INT NULL     | Foreign |
| complaint_id    | INT NULL     | Foreign |
| message         | VARCHAR(255) |         |
| is_read         | BOOLEAN      |         |
| created_at      | TIMESTAMP    |         |

Foreign Keys:

* `user_id → users.user_id`
* `type_id → notification_types.type_id`
* `match_id → matches.match_id`
* `message_id → messages.message_id`
* `complaint_id → complaints.complaint_id`

Notes:

* Exactly one of `match_id`, `message_id`, `complaint_id` is non-NULL per row, depending on `type_id`.
* A CHECK constraint or application-layer rule should enforce this.

---

## Table 20: Password Reset Tokens

This table stores temporary tokens for password reset requests.

| Field      | Type         | Key     |
| ---------- | ------------ | ------- |
| token_id   | INT          | Primary |
| user_id    | INT          | Foreign |
| token      | VARCHAR(255) | Unique  |
| expires_at | TIMESTAMP    |         |
| created_at | TIMESTAMP    |         |

Foreign Keys:

* `user_id → users.user_id`

---

## Table 21: Blocked Users

This table records users who have been blocked.

| Field      | Type      | Key     |
| ---------- | --------- | ------- |
| block_id   | INT       | Primary |
| blocker_id | INT       | Foreign |
| blocked_id | INT       | Foreign |
| created_at | TIMESTAMP |         |

Foreign Keys:

* `blocker_id → users.user_id`
* `blocked_id → users.user_id`

---

## Table 22: Complaint Types *(lookup)*

This table stores the valid complaint type options.

| Field     | Type        | Key     |
| --------- | ----------- | ------- |
| type_id   | INT         | Primary |
| type_name | VARCHAR(50) |         |

Example values: Harassment, Spam, Inappropriate Content, Fake Profile, Other

---

## Table 23: Complaint Statuses *(lookup)*

This table stores the valid complaint status options.

| Field       | Type        | Key     |
| ----------- | ----------- | ------- |
| status_id   | INT         | Primary |
| status_name | VARCHAR(50) |         |

Example values: Pending, Under Review, Resolved, Dismissed

---

## Table 24: Complaints

This table records reports made by users against other users.

| Field        | Type | Key     |
| ------------ | ---- | ------- |
| complaint_id | INT  | Primary |
| reporter_id  | INT  | Foreign |
| reported_id  | INT  | Foreign |
| type_id      | INT  | Foreign |
| description  | TEXT |         |
| status_id    | INT  | Foreign |
| created_at   | TIMESTAMP |    |

Foreign Keys:

* `reporter_id → users.user_id`
* `reported_id → users.user_id`
* `type_id → complaint_types.type_id`
* `status_id → complaint_statuses.status_id`
