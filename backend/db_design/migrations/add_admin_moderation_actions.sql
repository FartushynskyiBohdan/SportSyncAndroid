-- Add moderation metadata for complaints and a persistent admin action audit trail.

ALTER TABLE complaints
  ADD COLUMN internal_note TEXT NULL,
  ADD COLUMN admin_action VARCHAR(32) NULL,
  ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS moderation_actions (
  action_id INT NOT NULL AUTO_INCREMENT,
  complaint_id INT NOT NULL,
  admin_id INT NOT NULL,
  target_user_id INT NOT NULL,
  action_type ENUM('warn', 'suspend', 'ban', 'dismiss') NOT NULL,
  previous_account_status ENUM('active', 'suspended', 'banned') NOT NULL,
  new_account_status ENUM('active', 'suspended', 'banned') NOT NULL,
  note TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (action_id),
  KEY idx_moderation_actions_target_user (target_user_id, created_at),
  KEY idx_moderation_actions_complaint (complaint_id),
  CONSTRAINT fk_moderation_actions_complaint FOREIGN KEY (complaint_id) REFERENCES complaints (complaint_id) ON DELETE CASCADE,
  CONSTRAINT fk_moderation_actions_admin FOREIGN KEY (admin_id) REFERENCES users (user_id) ON DELETE CASCADE,
  CONSTRAINT fk_moderation_actions_target FOREIGN KEY (target_user_id) REFERENCES users (user_id) ON DELETE CASCADE
);
