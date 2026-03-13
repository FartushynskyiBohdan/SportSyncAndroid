# SportSync – Entity Relationship Diagram

Paste the mermaid code block below into [Mermaid Live Editor](https://mermaid.live) to render and export as PNG/SVG for your document.

```mermaid
erDiagram
    direction TB

    Users {
        INT user_id PK
        VARCHAR email UK
        VARCHAR password_hash
        ENUM role
        ENUM account_status
        BOOLEAN onboarding_complete
        TIMESTAMP last_active
        TIMESTAMP created_at
    }

    Profiles {
        INT user_id PK, FK
        VARCHAR first_name
        VARCHAR last_name
        DATE birth_date
        VARCHAR gender
        INT height_cm
        VARCHAR city
        VARCHAR country
        TEXT bio
    }

    UserPhotos {
        INT photo_id PK
        INT user_id FK
        VARCHAR photo_url
        INT display_order
        TIMESTAMP uploaded_at
    }

    Sports {
        INT sport_id PK
        VARCHAR sport_name
    }

    UserSports {
        INT user_id PK, FK
        INT sport_id PK, FK
        VARCHAR skill_level
        INT years_experience
        VARCHAR training_frequency
    }

    Preferences {
        INT user_id PK, FK
        VARCHAR preferred_gender
        INT min_age
        INT max_age
        INT max_distance_km
        VARCHAR relationship_goal
    }

    PreferenceSports {
        INT user_id PK, FK
        INT sport_id PK, FK
    }

    Likes {
        INT like_id PK
        INT liker_id FK
        INT liked_id FK
        TIMESTAMP created_at
    }

    Passes {
        INT pass_id PK
        INT passer_id FK
        INT passed_id FK
        TIMESTAMP created_at
    }

    Matches {
        INT match_id PK
        INT user1_id FK
        INT user2_id FK
        TIMESTAMP matched_at
    }

    Messages {
        INT message_id PK
        INT match_id FK
        INT sender_id FK
        TEXT message_text
        TIMESTAMP sent_at
        TIMESTAMP read_at
    }

    Notifications {
        INT notification_id PK
        INT user_id FK
        VARCHAR notification_type
        INT reference_id
        VARCHAR message
        BOOLEAN is_read
        TIMESTAMP created_at
    }

    PasswordResetTokens {
        INT token_id PK
        INT user_id FK
        VARCHAR token UK
        TIMESTAMP expires_at
        TIMESTAMP created_at
    }

    BlockedUsers {
        INT block_id PK
        INT blocker_id FK
        INT blocked_id FK
        TIMESTAMP created_at
    }

    Complaints {
        INT complaint_id PK
        INT reporter_id FK
        INT reported_id FK
        VARCHAR complaint_type
        TEXT description
        VARCHAR status
        TIMESTAMP created_at
    }

    Users ||--|| Profiles : "has"
    Users ||--o{ UserPhotos : "uploads"
    Users ||--|| Preferences : "sets"
    Users ||--o{ PasswordResetTokens : "requests reset"
    Users ||--o{ Notifications : "receives"
    Users ||--o{ UserSports : "practices"
    Users ||--o{ PreferenceSports : "prefers"
    Users ||--o{ Likes : "liker / liked"
    Users ||--o{ Passes : "passer / passed"
    Users ||--o{ Matches : "user1 / user2"
    Users ||--o{ Messages : "sends"
    Users ||--o{ BlockedUsers : "blocker / blocked"
    Users ||--o{ Complaints : "reporter / reported"

    Sports ||--o{ UserSports : "sport"
    Sports ||--o{ PreferenceSports : "sport"

    Matches ||--o{ Messages : "contains"
```
