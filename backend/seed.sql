-- ============================================================================
-- SCP REAL ESTATE - PRODUCTION INITIAL SEED SCRIPT
-- Seeds System Roles, 3 Demo Portal Accounts, and Master Project Shell
-- (All plot data is managed dynamically via CSV Upload & Export)
-- ============================================================================

SET search_path TO app, public;

-- Enable pgcrypto for password hashing if not present
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. SEED SYSTEM ROLES
INSERT INTO roles (id, code, name, description, is_system_role)
VALUES 
  ('a0000001-0000-0000-0000-000000000001', 'super_admin', 'Super Admin', 'Full system administration access', true),
  ('a0000001-0000-0000-0000-000000000002', 'channel_partner', 'Channel Partner', 'Real estate broker and partner access', false),
  ('a0000001-0000-0000-0000-000000000003', 'customer', 'Customer', 'Plot buyer and customer portal access', false),
  ('a0000001-0000-0000-0000-000000000004', 'accounts_admin', 'Accounts Admin', 'Financial management and receipts', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- 2. SEED 3 PORTAL USERS (Default Password: password123)
-- User 1: Super Admin (admin@example.com)
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, is_active, is_email_verified)
VALUES (
  'b0000001-0000-0000-0000-000000000001',
  'admin@example.com',
  crypt('password123', gen_salt('bf')),
  'Suresh',
  'Admin',
  '9876543210',
  true,
  true
)
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, is_active = true;

INSERT INTO user_roles (user_id, role_id)
VALUES ('b0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001')
ON CONFLICT (user_id, role_id) DO NOTHING;

-- User 2: Channel Partner (partner@example.com)
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, is_active, is_email_verified)
VALUES (
  'b0000001-0000-0000-0000-000000000002',
  'partner@example.com',
  crypt('password123', gen_salt('bf')),
  'Rajesh',
  'Kumar',
  '9876543211',
  true,
  true
)
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, is_active = true;

INSERT INTO user_roles (user_id, role_id)
VALUES ('b0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000002')
ON CONFLICT (user_id, role_id) DO NOTHING;

INSERT INTO channel_partners (
  id, user_id, partner_code, company_name, first_name, last_name, email, phone, status, commission_rate_percent
)
VALUES (
  'e0000001-0000-0000-0000-000000000001',
  'b0000001-0000-0000-0000-000000000002',
  'CP-1001',
  'Sri Venkateswara Real Estate',
  'Rajesh',
  'Kumar',
  'partner@example.com',
  '9876543211',
  'approved',
  2.50
)
ON CONFLICT (user_id) DO UPDATE SET status = 'approved';

-- User 3: Customer (customer@example.com)
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, is_active, is_email_verified)
VALUES (
  'b0000001-0000-0000-0000-000000000003',
  'customer@example.com',
  crypt('password123', gen_salt('bf')),
  'Arun',
  'Reddy',
  '9876543212',
  true,
  true
)
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, is_active = true;

INSERT INTO user_roles (user_id, role_id)
VALUES ('b0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000003')
ON CONFLICT (user_id, role_id) DO NOTHING;

INSERT INTO customers (
  id, user_id, first_name, last_name, email, phone, status
)
VALUES (
  'f0000001-0000-0000-0000-000000000001',
  'b0000001-0000-0000-0000-000000000003',
  'Arun',
  'Reddy',
  'customer@example.com',
  '9876543212',
  'active'
)
ON CONFLICT (user_id) DO UPDATE SET status = 'active';

-- 3. SEED MASTER PROJECT SHELL (Plots are uploaded dynamically via UI)
INSERT INTO projects (
  id,
  code,
  name,
  description,
  address_line_1,
  city,
  state,
  postal_code,
  country_code,
  total_area_sqft,
  total_plots,
  default_price_per_sqft,
  default_token_amount,
  status,
  image_url,
  blueprint_url,
  total_area
)
VALUES (
  'c0000001-0000-0000-0000-000000000001',
  'SCP-2026',
  'SCP Farm Layout (184 Plots)',
  'Master planned luxury farm plots township development with complete CAD layout and live booking synchronization.',
  'Shamshabad Highway',
  'Hyderabad',
  'Telangana',
  '500081',
  'IN',
  1067220.00,
  184,
  2500.00,
  10000.00,
  'active',
  '/blueprint.png',
  '/blueprint.png',
  '24.5 Acres'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  address_line_1 = EXCLUDED.address_line_1,
  total_area = EXCLUDED.total_area,
  total_plots = EXCLUDED.total_plots;
