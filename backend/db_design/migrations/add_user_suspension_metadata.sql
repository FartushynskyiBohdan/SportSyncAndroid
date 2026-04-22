-- Add suspension metadata to users for auth gating and suspension wall messaging.

ALTER TABLE users
  ADD COLUMN suspended_until TIMESTAMP NULL,
  ADD COLUMN suspension_reason TEXT NULL;
