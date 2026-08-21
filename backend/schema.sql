-- ============================================================================
-- SEVEN CIRCLE PROPERTY (SCP)
-- PRODUCTION DATABASE SCHEMA & INITIAL SEED
-- Target Database: PostgreSQL 14+
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE SCHEMA IF NOT EXISTS app;

SET search_path TO app, public;

-- ============================================================================
-- COMMON UPDATED_AT TRIGGER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- ============================================================================
-- 1. USERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(320) NOT NULL,
    password_hash TEXT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    phone VARCHAR(20),
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT chk_users_email_not_empty CHECK (length(trim(email)) > 0),
    CONSTRAINT chk_users_password_hash_not_empty CHECK (length(trim(password_hash)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- ============================================================================
-- 2. ROLES & PERMISSIONS (RBAC)
-- ============================================================================
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_roles_code UNIQUE (code)
);

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_permissions_resource_action UNIQUE (resource, action)
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID,

    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    CONSTRAINT fk_user_roles_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- ============================================================================
-- 3. SESSIONS & AUTH TOKENS
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    refresh_token_hash TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS uq_sessions_refresh_token ON user_sessions(refresh_token_hash);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_password_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_password_reset_token ON password_reset_tokens(token_hash);

CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_email_verification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_email_verification_token ON email_verification_tokens(token_hash);

-- ============================================================================
-- 4. CHANNEL PARTNERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS channel_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE,
    partner_code VARCHAR(50) NOT NULL,
    company_name VARCHAR(200),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(320) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address_line_1 VARCHAR(255),
    address_line_2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country_code CHAR(2) DEFAULT 'IN',

    pan_encrypted TEXT,
    pan_hash VARCHAR(128),
    pan_last4 CHAR(4),

    aadhaar_encrypted TEXT,
    aadhaar_hash VARCHAR(128),
    aadhaar_last4 CHAR(4),

    registration_fee NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (registration_fee >= 0),
    registration_paid BOOLEAN NOT NULL DEFAULT FALSE,
    commission_rate_percent NUMERIC(5,2) NOT NULL DEFAULT 2.00 CHECK (commission_rate_percent >= 0 AND commission_rate_percent <= 100),
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    approved_at TIMESTAMPTZ,
    approved_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_channel_partner_code UNIQUE (partner_code),
    CONSTRAINT uq_channel_partner_email UNIQUE (email),
    CONSTRAINT uq_channel_partner_pan UNIQUE (pan_hash),
    CONSTRAINT uq_channel_partner_aadhaar UNIQUE (aadhaar_hash),
    CONSTRAINT fk_partner_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_partner_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_partner_status CHECK (status IN ('pending', 'approved', 'rejected', 'suspended'))
);

CREATE INDEX IF NOT EXISTS idx_channel_partners_status ON channel_partners(status);

CREATE TABLE IF NOT EXISTS channel_partner_bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_partner_id UUID NOT NULL,
    account_holder_name VARCHAR(200) NOT NULL,
    account_number_encrypted TEXT NOT NULL,
    account_number_hash VARCHAR(128) NOT NULL,
    bank_name VARCHAR(200) NOT NULL,
    ifsc_code VARCHAR(20) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_partner_bank_partner FOREIGN KEY (channel_partner_id) REFERENCES channel_partners(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_partner_bank_partner ON channel_partner_bank_accounts(channel_partner_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_partner_primary_bank ON channel_partner_bank_accounts(channel_partner_id) WHERE is_primary = TRUE;

-- ============================================================================
-- 5. CUSTOMERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(320) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address_line_1 VARCHAR(255),
    address_line_2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country_code CHAR(2) DEFAULT 'IN',

    pan_encrypted TEXT,
    pan_hash VARCHAR(128),
    pan_last4 CHAR(4),

    aadhaar_encrypted TEXT,
    aadhaar_hash VARCHAR(128),
    aadhaar_last4 CHAR(4),

    assigned_channel_partner_id UUID,
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_customers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_customers_partner FOREIGN KEY (assigned_channel_partner_id) REFERENCES channel_partners(id) ON DELETE SET NULL,
    CONSTRAINT uq_customers_pan_hash UNIQUE (pan_hash),
    CONSTRAINT uq_customers_aadhaar_hash UNIQUE (aadhaar_hash),
    CONSTRAINT chk_customers_status CHECK (status IN ('active', 'inactive', 'blocked'))
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_partner ON customers(assigned_channel_partner_id);

-- ============================================================================
-- 6. PROJECTS & PLOTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    address_line_1 VARCHAR(255),
    address_line_2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country_code CHAR(2) DEFAULT 'IN',
    total_area_sqft NUMERIC(15,2) CHECK (total_area_sqft > 0),
    total_plots INTEGER NOT NULL DEFAULT 0 CHECK (total_plots >= 0),
    default_price_per_sqft NUMERIC(15,2) CHECK (default_price_per_sqft >= 0),
    default_token_amount NUMERIC(15,2) CHECK (default_token_amount >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    image_url TEXT,
    blueprint_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_projects_code UNIQUE (code),
    CONSTRAINT chk_project_status CHECK (status IN ('draft', 'active', 'inactive', 'completed', 'archived'))
);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

CREATE TABLE IF NOT EXISTS plots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    plot_number VARCHAR(50) NOT NULL,
    location VARCHAR(200),
    area_sqft NUMERIC(12,2) NOT NULL CHECK (area_sqft > 0),
    dimensions VARCHAR(50),
    facing VARCHAR(30),
    road_width_ft NUMERIC(8,2) CHECK (road_width_ft > 0),
    price_per_sqft NUMERIC(15,2) NOT NULL CHECK (price_per_sqft >= 0),
    total_price NUMERIC(18,2) NOT NULL CHECK (total_price >= 0),
    token_required NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (token_required >= 0),
    row_index INTEGER,
    col_index INTEGER,
    blueprint_coords JSONB,
    status VARCHAR(30) NOT NULL DEFAULT 'available',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_plots_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT,
    CONSTRAINT uq_plot_number_per_project UNIQUE (project_id, plot_number),
    CONSTRAINT chk_plot_status CHECK (status IN ('available', 'token_booked', 'confirmed', 'sold', 'reserved', 'blocked'))
);

CREATE INDEX IF NOT EXISTS idx_plots_project ON plots(project_id);
CREATE INDEX IF NOT EXISTS idx_plots_status ON plots(status);
CREATE INDEX IF NOT EXISTS idx_plots_project_status ON plots(project_id, status);

-- ============================================================================
-- 7. FILES & DOCUMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_file_name VARCHAR(255) NOT NULL,
    storage_provider VARCHAR(50) NOT NULL, -- e.g. 'local', 's3', 'gcs'
    storage_key TEXT NOT NULL,
    mime_type VARCHAR(150) NOT NULL,
    file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes >= 0),
    checksum_sha256 CHAR(64),
    uploaded_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_files_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uq_files_storage_key UNIQUE (storage_provider, storage_key)
);

CREATE TABLE IF NOT EXISTS entity_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'customer', 'channel_partner', 'plot', 'project', 'payment'
    entity_id UUID NOT NULL,
    document_type VARCHAR(50) NOT NULL, -- 'aadhaar', 'pan', 'agreement', 'receipt'
    status VARCHAR(30) NOT NULL DEFAULT 'uploaded',
    verified_by UUID,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_entity_document_file FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE RESTRICT,
    CONSTRAINT fk_entity_document_verifier FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_document_status CHECK (status IN ('uploaded', 'pending_verification', 'verified', 'rejected'))
);

CREATE INDEX IF NOT EXISTS idx_entity_documents_entity ON entity_documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_documents_file ON entity_documents(file_id);

-- ============================================================================
-- 8. BOOKINGS & STATUS HISTORY
-- ============================================================================
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_reference VARCHAR(50) NOT NULL,
    plot_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    channel_partner_id UUID,
    status VARCHAR(30) NOT NULL DEFAULT 'token_paid',
    total_amount NUMERIC(18,2) NOT NULL CHECK (total_amount >= 0),
    token_amount NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (token_amount >= 0),
    amount_paid NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
    balance_amount NUMERIC(18,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,

    token_paid_at TIMESTAMPTZ,
    token_expires_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ,
    payment_deadline_at TIMESTAMPTZ,
    sold_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    notes TEXT,
    version BIGINT NOT NULL DEFAULT 0, -- Optimistic locking
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_booking_reference UNIQUE (booking_reference),
    CONSTRAINT fk_booking_plot FOREIGN KEY (plot_id) REFERENCES plots(id) ON DELETE RESTRICT,
    CONSTRAINT fk_booking_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    CONSTRAINT fk_booking_channel_partner FOREIGN KEY (channel_partner_id) REFERENCES channel_partners(id) ON DELETE SET NULL,
    CONSTRAINT chk_booking_status CHECK (status IN ('pending', 'token_paid', 'confirmed', 'sold', 'expired', 'cancelled')),
    CONSTRAINT chk_booking_amounts CHECK (amount_paid <= total_amount)
);

CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_plot ON bookings(plot_id);
CREATE INDEX IF NOT EXISTS idx_bookings_partner ON bookings(channel_partner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings(created_at DESC);

-- Double-Booking Prevention: Only one active booking allowed per plot
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_booking_per_plot ON bookings(plot_id)
WHERE status IN ('pending', 'token_paid', 'confirmed');

CREATE TABLE IF NOT EXISTS booking_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL,
    old_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    changed_by UUID,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_booking_history_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_booking_history_user FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_booking_history_booking ON booking_status_history(booking_id, created_at DESC);

-- ============================================================================
-- 9. PAYMENTS & REFUNDS
-- ============================================================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_reference VARCHAR(60) NOT NULL,
    booking_id UUID,
    customer_id UUID NOT NULL,
    payment_type VARCHAR(40) NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    amount NUMERIC(18,2) NOT NULL CHECK (amount > 0),
    currency CHAR(3) NOT NULL DEFAULT 'INR',
    status VARCHAR(30) NOT NULL DEFAULT 'completed',
    gateway_transaction_id VARCHAR(150),
    gateway_name VARCHAR(50),
    payment_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    receipt_file_id UUID,
    failure_reason TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_payment_reference UNIQUE (payment_reference),
    CONSTRAINT fk_payment_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE RESTRICT,
    CONSTRAINT fk_payment_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    CONSTRAINT fk_payment_receipt FOREIGN KEY (receipt_file_id) REFERENCES files(id) ON DELETE SET NULL,
    CONSTRAINT chk_payment_type CHECK (payment_type IN ('registration_fee', 'token_advance', 'continue_payment', 'full_payment', 'balance_payment', 'refund')),
    CONSTRAINT chk_payment_method CHECK (payment_method IN ('upi', 'bank_transfer', 'cash', 'card', 'cheque', 'other')),
    CONSTRAINT chk_payment_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_gateway_transaction ON payments(gateway_transaction_id) WHERE gateway_transaction_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS payment_refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL,
    refund_reference VARCHAR(60) NOT NULL,
    amount NUMERIC(18,2) NOT NULL CHECK (amount > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    gateway_refund_id VARCHAR(150),
    reason TEXT,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_refund_reference UNIQUE (refund_reference),
    CONSTRAINT fk_refund_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE RESTRICT,
    CONSTRAINT chk_refund_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_refunds_payment ON payment_refunds(payment_id);

-- ============================================================================
-- 10. NOTIFICATIONS & RECIPIENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_entity ON notifications(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS notification_recipients (
    notification_id UUID NOT NULL,
    user_id UUID NOT NULL,
    read_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,

    PRIMARY KEY (notification_id, user_id),
    CONSTRAINT fk_notif_recipient_notif FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
    CONSTRAINT fk_notif_recipient_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notification_recipients_user ON notification_recipients(user_id, read_at);

-- ============================================================================
-- 11. AUDIT LOGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    request_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_request ON audit_logs(request_id) WHERE request_id IS NOT NULL;

-- ============================================================================
-- 12. SYSTEM SETTINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(150) NOT NULL,
    setting_value TEXT NOT NULL,
    value_type VARCHAR(30) NOT NULL DEFAULT 'string',
    description TEXT,
    is_secret BOOLEAN NOT NULL DEFAULT FALSE,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_system_setting_key UNIQUE (setting_key),
    CONSTRAINT fk_system_setting_user FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_setting_value_type CHECK (value_type IN ('string', 'integer', 'decimal', 'boolean', 'json'))
);

-- ============================================================================
-- 13. ATTACH AUTOMATIC UPDATED_AT TRIGGERS
-- ============================================================================
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_roles_updated_at ON roles;
CREATE TRIGGER trg_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_customers_updated_at ON customers;
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_channel_partners_updated_at ON channel_partners;
CREATE TRIGGER trg_channel_partners_updated_at BEFORE UPDATE ON channel_partners FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_partner_bank_updated_at ON channel_partner_bank_accounts;
CREATE TRIGGER trg_partner_bank_updated_at BEFORE UPDATE ON channel_partner_bank_accounts FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_projects_updated_at ON projects;
CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_plots_updated_at ON plots;
CREATE TRIGGER trg_plots_updated_at BEFORE UPDATE ON plots FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_documents_updated_at ON entity_documents;
CREATE TRIGGER trg_documents_updated_at BEFORE UPDATE ON entity_documents FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_bookings_updated_at ON bookings;
CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_payments_updated_at ON payments;
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_refunds_updated_at ON payment_refunds;
CREATE TRIGGER trg_refunds_updated_at BEFORE UPDATE ON payment_refunds FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_settings_updated_at ON system_settings;
CREATE TRIGGER trg_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION set_updated_at();
