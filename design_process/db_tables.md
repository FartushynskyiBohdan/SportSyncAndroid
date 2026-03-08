# Athlete Dating App – Database Schema

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

## Table 2: Profiles

This table stores descriptive information about the user.

| Field      | Type         | Key              |
| ---------- | ------------ | ---------------- |
| user_id    | INT          | Primary, Foreign |
| first_name | VARCHAR(100) |                  |
| last_name  | VARCHAR(100) |                  |
| birth_date | DATE         |                  |
| gender     | VARCHAR(20)  |                  |
| height_cm  | INT          |                  |
| city       | VARCHAR(100) |                  |
| country    | VARCHAR(100) |                  |
| bio        | TEXT         |                  |

Foreign Keys:

* `user_id → users.user_id`

---

## Table 3: User Photos

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

## Table 4: Sports

This table contains all sports supported by the platform.

| Field      | Type         | Key     |
| ---------- | ------------ | ------- |
| sport_id   | INT          | Primary |
| sport_name | VARCHAR(100) |         |

Example values:

* Running
* CrossFit
* Cycling
* Football
* Tennis

---

## Table 5: User Sports

This table records which sports a user practices.

| Field              | Type        | Key     |
| ------------------ | ----------- | ------- |
| user_id            | INT         | Foreign |
| sport_id           | INT         | Foreign |
| skill_level        | VARCHAR(50) |         |
| years_experience   | INT         |         |
| training_frequency | VARCHAR(50) |         |

Primary Key:

* `(user_id, sport_id)`

Foreign Keys:

* `user_id → users.user_id`
* `sport_id → sports.sport_id`

---

## Table 6: Preferences

This table stores matching preferences for each user.

| Field             | Type        | Key              |
| ----------------- | ----------- | ---------------- |
| user_id           | INT         | Primary, Foreign |
| preferred_gender  | VARCHAR(20) |                  |
| min_age           | INT         |                  |
| max_age           | INT         |                  |
| max_distance_km   | INT         |                  |
| relationship_goal | VARCHAR(50) |                  |

Foreign Keys:

* `user_id → users.user_id`

---

## Table 7: Preference Sports

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

## Table 8: Likes

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

## Table 9: Passes

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

## Table 10: Matches

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

## Table 11: Messages

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

## Table 12: Notifications

This table stores in-app notifications for users.

| Field             | Type         | Key     |
| ----------------- | ------------ | ------- |
| notification_id   | INT          | Primary |
| user_id           | INT          | Foreign |
| notification_type | VARCHAR(50)  |         |
| reference_id      | INT          |         |
| message           | VARCHAR(255) |         |
| is_read           | BOOLEAN      |         |
| created_at        | TIMESTAMP    |         |

Foreign Keys:

* `user_id → users.user_id`

Notes:

* `notification_type` indicates the kind of event (e.g. 'new_match', 'new_message', 'admin_warning').
* `reference_id` links to the relevant record (e.g. a match_id, message_id, or complaint_id) depending on the notification type.

---

## Table 13: Password Reset Tokens

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

## Table 14: Blocked Users

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

## Table 15: Complaints

This table records reports made by users against other users.

| Field          | Type        | Key     |
| -------------- | ----------- | ------- |
| complaint_id   | INT         | Primary |
| reporter_id    | INT         | Foreign |
| reported_id    | INT         | Foreign |
| complaint_type | VARCHAR(50) |         |
| description    | TEXT        |         |
| status         | VARCHAR(50) |         |
| created_at     | TIMESTAMP   |         |

Foreign Keys:

* `reporter_id → users.user_id`
* `reported_id → users.user_id`
