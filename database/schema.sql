CREATE TABLE organizations (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE financial_policies (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  organization_id BIGINT UNSIGNED NOT NULL,
  reserve_floor DECIMAL(18,2) NOT NULL,
  max_purchase_amount DECIMAL(18,2) NOT NULL,
  allowed_currencies JSON NOT NULL,
  allowed_merchant_category_codes JSON NULL,
  allowed_merchant_countries JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE purchase_intents (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  organization_id BIGINT UNSIGNED NOT NULL,
  merchant_name VARCHAR(160) NOT NULL,
  product_name VARCHAR(160) NOT NULL,
  raw_request TEXT NOT NULL,
  parsed_intent JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE purchase_options (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  purchase_intent_id BIGINT UNSIGNED NOT NULL,
  billing_period ENUM('monthly','annual') NOT NULL,
  monthly_price DECIMAL(18,2) NOT NULL,
  total_price DECIMAL(18,2) NOT NULL,
  currency CHAR(3) NOT NULL,
  description VARCHAR(255) NULL,
  FOREIGN KEY (purchase_intent_id) REFERENCES purchase_intents(id)
);

CREATE TABLE agent_decisions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  purchase_intent_id BIGINT UNSIGNED NOT NULL,
  outcome VARCHAR(64) NOT NULL,
  selected_option_id BIGINT UNSIGNED NULL,
  policy_snapshot JSON NOT NULL,
  impact_snapshot JSON NULL,
  reasoning TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (purchase_intent_id) REFERENCES purchase_intents(id),
  FOREIGN KEY (selected_option_id) REFERENCES purchase_options(id)
);

CREATE TABLE authority_envelopes (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  agent_decision_id BIGINT UNSIGNED NOT NULL,
  status ENUM('ACTIVE','SUSPENDED','EXPIRED','REVOKED') NOT NULL DEFAULT 'ACTIVE',
  max_transaction_amount DECIMAL(18,2) NOT NULL,
  currency CHAR(3) NOT NULL,
  allowed_categories JSON NULL,
  allowed_countries JSON NULL,
  airwallex_card_id VARCHAR(128) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agent_decision_id) REFERENCES agent_decisions(id)
);

CREATE TABLE transaction_events (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  authority_envelope_id BIGINT UNSIGNED NULL,
  airwallex_transaction_id VARCHAR(128) NULL,
  amount DECIMAL(18,2) NOT NULL,
  currency CHAR(3) NOT NULL,
  merchant_category_code VARCHAR(8) NULL,
  merchant_country CHAR(2) NULL,
  status VARCHAR(64) NOT NULL,
  decision VARCHAR(32) NULL,
  reasons JSON NULL,
  raw_event JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (authority_envelope_id) REFERENCES authority_envelopes(id)
);

CREATE TABLE agent_events (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  event_type VARCHAR(80) NOT NULL,
  entity_type VARCHAR(80) NULL,
  entity_id BIGINT UNSIGNED NULL,
  payload JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
