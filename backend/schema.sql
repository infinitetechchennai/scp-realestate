-- SCP Real Estate Database Schema (Production Ready)
CREATE SCHEMA IF NOT EXISTS app;

-- Projects Table
CREATE TABLE IF NOT EXISTS app.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    total_area VARCHAR(50),
    total_plots INTEGER DEFAULT 0,
    available_plots INTEGER DEFAULT 0,
    token_booked_plots INTEGER DEFAULT 0,
    partial_booked_plots INTEGER DEFAULT 0,
    sold_plots INTEGER DEFAULT 0,
    total_value NUMERIC(16, 2) DEFAULT 0.00,
    image_url TEXT,
    blueprint_url TEXT,
    status VARCHAR(50) DEFAULT "active",
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Plots Table
CREATE TABLE IF NOT EXISTS app.plots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES app.projects(id) ON DELETE CASCADE,
    plot_number VARCHAR(50) NOT NULL,
    location VARCHAR(255) DEFAULT "Main Highway Layout, Hyderabad",
    area_sqft NUMERIC(10, 2) NOT NULL,
    dimensions VARCHAR(255),
    facing VARCHAR(50) DEFAULT "North",
    road_width_ft VARCHAR(50) DEFAULT "20 ft",
    price_per_sqft NUMERIC(10, 2) NOT NULL,
    total_price NUMERIC(16, 2) NOT NULL,
    token_required NUMERIC(12, 2) DEFAULT 10000.00,
    token_amount NUMERIC(12, 2) DEFAULT 0.00,
    token_date TIMESTAMP WITH TIME ZONE,
    token_expiry TIMESTAMP WITH TIME ZONE,
    amount_paid NUMERIC(16, 2) DEFAULT 0.00,
    balance_amount NUMERIC(16, 2) DEFAULT 0.00,
    balance_due_date TIMESTAMP WITH TIME ZONE,
    row_index INTEGER,
    col_index INTEGER,
    blueprint_coords JSONB,
    status VARCHAR(50) DEFAULT "available" NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_project_plot UNIQUE (project_id, plot_number)
);

CREATE INDEX IF NOT EXISTS idx_plots_project_id ON app.plots(project_id);
CREATE INDEX IF NOT EXISTS idx_plots_plot_number ON app.plots(plot_number);
CREATE INDEX IF NOT EXISTS idx_plots_status ON app.plots(status);
