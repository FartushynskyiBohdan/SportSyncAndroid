# Athlete Dating App -- Website Page Structure

## 1. Public / Marketing Pages

-   `/` -- Landing Page
-   `/about` -- About the company/app
-   `/how-it-works` -- Explanation of the platform
-   `/features` -- Feature overview
-   `/faq` -- Frequently asked questions

------------------------------------------------------------------------

## 2. Authentication Pages

-   `/signup` -- Create a new account
-   `/login` -- Log into an existing account
-   `/forgot-password` -- Request password reset
-   `/reset-password` -- Set a new password

------------------------------------------------------------------------

## 3. Onboarding Pages

-   `/onboarding/profile` -- Basic user info
-   `/onboarding/sports` -- Sports and athletic details
-   `/onboarding/photos` -- Upload profile photos
-   `/onboarding/bio` -- Personal bio and prompts
-   `/onboarding/preferences` -- Match preferences
-   `/onboarding/complete` -- Completion confirmation

------------------------------------------------------------------------

## 4. Core App Pages (Logged In)

-   `/discover` -- Swipe / discover profiles
-   `/matches` -- List of mutual matches
-   `/messages` -- Conversations list
-   `/messages/:match_id` -- Individual chat thread

------------------------------------------------------------------------

## 5. Profile Pages

-   `/profile` -- View your own profile
-   `/profile/edit` -- Edit profile information
-   `/users/:id` -- View another user's profile

------------------------------------------------------------------------

## 6. Discovery Settings

-   `/discovery/settings` -- Adjust matching filters

------------------------------------------------------------------------

## 7. Notifications

-   `/notifications` -- View app notifications

------------------------------------------------------------------------

## 8. Safety and Moderation

-   `/blocked-users` -- Users you have blocked
-   `/report/:user_id` -- Report a user
-   `/safety` -- Safety guidelines

------------------------------------------------------------------------

## 9. Account Management

-   `/settings` -- General account settings
-   `/settings/preferences` -- Dating preferences
-   `/settings/password` -- Change password
-   `/settings/privacy` -- Privacy controls
-   `/settings/delete-account` -- Delete account

------------------------------------------------------------------------

## 10. Legal Pages

-   `/terms` -- Terms of service
-   `/privacy` -- Privacy policy
-   `/cookies` -- Cookie policy

------------------------------------------------------------------------

## 11. Optional Pages

-   `/premium` -- Subscription plans
-   `/events` -- Athletic events and meetups

------------------------------------------------------------------------

## 12. Admin Dashboard (Internal)

-   `/admin/users` -- Manage users
-   `/admin/reports` -- Review user reports
-   `/admin/moderation` -- Content moderation
