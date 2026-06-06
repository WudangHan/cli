-- SYNTHEX — schéma initial (MINERVA)
-- Exécuté automatiquement au premier démarrage de postgres.

CREATE TABLE IF NOT EXISTS leads (
    id          BIGSERIAL PRIMARY KEY,
    name        TEXT,
    email       TEXT NOT NULL,
    company     TEXT,
    message     TEXT,
    score       INTEGER DEFAULT 0,
    qualified   BOOLEAN GENERATED ALWAYS AS (score >= 70) STORED,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads (created_at);

CREATE TABLE IF NOT EXISTS transactions (
    id          BIGSERIAL PRIMARY KEY,
    stripe_id   TEXT UNIQUE,
    type        TEXT,
    amount_cad  NUMERIC(12,2) NOT NULL DEFAULT 0,
    currency    TEXT NOT NULL DEFAULT 'CAD',
    email       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tx_created ON transactions (created_at);

CREATE TABLE IF NOT EXISTS mrr_log (
    id          BIGSERIAL PRIMARY KEY,
    month       DATE NOT NULL,
    mrr_cad     NUMERIC(12,2) NOT NULL DEFAULT 0,
    customers   INTEGER NOT NULL DEFAULT 0,
    UNIQUE (month)
);

CREATE TABLE IF NOT EXISTS audit_log (
    id          BIGSERIAL PRIMARY KEY,
    agent       TEXT NOT NULL,
    action      TEXT NOT NULL,
    subject     TEXT,
    hash        TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log (created_at);

-- Vue agrégée consommée par metrics-api / dashboard.
CREATE OR REPLACE VIEW v_dashboard_metrics AS
SELECT
    (SELECT COALESCE(SUM(mrr_cad), 0) FROM mrr_log
        WHERE month = date_trunc('month', NOW())::date)               AS mrr_current,
    (SELECT COALESCE(SUM(customers), 0) FROM mrr_log
        WHERE month = date_trunc('month', NOW())::date)               AS customers_current,
    (SELECT COUNT(*) FROM leads
        WHERE created_at > NOW() - INTERVAL '30 days')                AS leads_30d,
    (SELECT COUNT(*) FROM leads
        WHERE qualified AND created_at > NOW() - INTERVAL '30 days')  AS leads_qualified_30d,
    (SELECT COALESCE(SUM(amount_cad), 0) FROM transactions
        WHERE created_at > NOW() - INTERVAL '30 days')                AS revenue_30d;

-- Données de démonstration (idempotentes).
INSERT INTO mrr_log (month, mrr_cad, customers)
VALUES (date_trunc('month', NOW())::date, 18420.00, 9)
ON CONFLICT (month) DO NOTHING;
