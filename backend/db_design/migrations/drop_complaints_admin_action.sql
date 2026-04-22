-- Remove the redundant admin_action denormalisation from complaints.
-- The authoritative record of what action was taken lives in moderation_actions.action_type.

ALTER TABLE complaints DROP COLUMN admin_action;
