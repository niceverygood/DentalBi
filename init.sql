-- DentalBI PostgreSQL 초기화 스크립트
-- SaaS 메타데이터 및 집계 데이터 저장용

-- ─── 치과 정보 ───
CREATE TABLE IF NOT EXISTS clinics (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    plan            VARCHAR(20) DEFAULT 'basic' CHECK (plan IN ('basic', 'pro', 'enterprise')),
    ehr_type        VARCHAR(30) NOT NULL DEFAULT 'hanaro',  -- hanaro, dentweb, oneclick
    mssql_host      VARCHAR(100),
    mssql_port      INTEGER DEFAULT 1433,
    mssql_database  VARCHAR(100),
    mssql_user      VARCHAR(100),
    mssql_password  TEXT,   -- 암호화 저장 필요
    agent_status    VARCHAR(20) DEFAULT 'disconnected',
    last_sync_at    TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ─── 사용자 계정 ───
CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    clinic_id       INTEGER REFERENCES clinics(id),
    email           VARCHAR(200) NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    name            VARCHAR(100),
    role            VARCHAR(20) DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'viewer')),
    last_login      TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ─── 의사별 일별 집계 ───
CREATE TABLE IF NOT EXISTS daily_doctor_stats (
    id              SERIAL PRIMARY KEY,
    clinic_id       INTEGER REFERENCES clinics(id),
    doctor_id       VARCHAR(50) NOT NULL,
    doctor_name     VARCHAR(100),
    stat_date       DATE NOT NULL,
    total_revenue   BIGINT DEFAULT 0,       -- 총수익 (원)
    corp_fee        BIGINT DEFAULT 0,       -- 공단부담금 (원)
    total_payment   BIGINT DEFAULT 0,       -- 총수납 (원)
    new_patients    INTEGER DEFAULT 0,      -- 신환수
    old_patients    INTEGER DEFAULT 0,      -- 구환진료건수
    total_visits    INTEGER DEFAULT 0,      -- 총진료건수
    distinct_patients INTEGER DEFAULT 0,    -- 총환자수
    created_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE(clinic_id, doctor_id, stat_date)
);

-- ─── 수납 일별 집계 ───
CREATE TABLE IF NOT EXISTS daily_payment_stats (
    id              SERIAL PRIMARY KEY,
    clinic_id       INTEGER REFERENCES clinics(id),
    stat_date       DATE NOT NULL,
    card_total      BIGINT DEFAULT 0,
    cash_total      BIGINT DEFAULT 0,
    cash_receipt_total BIGINT DEFAULT 0,
    online_total    BIGINT DEFAULT 0,
    corp_fee_total  BIGINT DEFAULT 0,
    patient_count   INTEGER DEFAULT 0,
    created_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE(clinic_id, stat_date)
);

-- ─── 환자 이탈 위험 스코어 ───
CREATE TABLE IF NOT EXISTS patient_risk_scores (
    id              SERIAL PRIMARY KEY,
    clinic_id       INTEGER REFERENCES clinics(id),
    patient_hash    VARCHAR(64) NOT NULL,   -- 환자ID 해시 (PII 비식별화)
    risk_score      FLOAT DEFAULT 0,        -- 이탈 위험도 (0~1)
    risk_type       VARCHAR(30),            -- turnaway, lost_ext, lost_endo, inactive
    last_visit_date DATE,
    days_since_visit INTEGER,
    pending_treatment VARCHAR(200),         -- 미완료 진료 내역
    estimated_revenue BIGINT DEFAULT 0,     -- 예상 잠재 매출 (원)
    recall_sent     BOOLEAN DEFAULT FALSE,
    recall_sent_at  TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ─── TxMix 일별 집계 ───
CREATE TABLE IF NOT EXISTS tx_mix_daily (
    id              SERIAL PRIMARY KEY,
    clinic_id       INTEGER REFERENCES clinics(id),
    doctor_id       VARCHAR(50),
    stat_date       DATE NOT NULL,
    category        VARCHAR(50) NOT NULL,   -- implant, crown, bridge, endo, extraction, ...
    count           INTEGER DEFAULT 0,
    revenue         BIGINT DEFAULT 0,
    created_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE(clinic_id, doctor_id, stat_date, category)
);

-- ─── AI 인사이트 로그 ───
CREATE TABLE IF NOT EXISTS ai_insights (
    id              SERIAL PRIMARY KEY,
    clinic_id       INTEGER REFERENCES clinics(id),
    generated_at    TIMESTAMP DEFAULT NOW(),
    insight_type    VARCHAR(20) CHECK (insight_type IN ('warning', 'danger', 'success', 'info')),
    priority        VARCHAR(10) CHECK (priority IN ('high', 'medium', 'low')),
    title           VARCHAR(200),
    body            TEXT,
    action_items    TEXT,
    is_read         BOOLEAN DEFAULT FALSE,
    is_resolved     BOOLEAN DEFAULT FALSE
);

-- ─── 통화 기록 (CRM) ───
CREATE TABLE IF NOT EXISTS call_records (
    id              SERIAL PRIMARY KEY,
    clinic_id       INTEGER REFERENCES clinics(id),
    patient_hash    VARCHAR(64),                -- 환자ID 해시 (PII 비식별화)
    patient_name    VARCHAR(100),               -- 마스킹된 환자명 (김**)
    staff_user_id   INTEGER REFERENCES users(id),
    staff_name      VARCHAR(100),
    phone_number    VARCHAR(20),                -- 마스킹 처리 (010-****-1234)
    direction       VARCHAR(10) DEFAULT 'outbound' CHECK (direction IN ('inbound', 'outbound')),
    status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    duration        INTEGER DEFAULT 0,          -- 통화 시간 (초)
    recording_url   TEXT,                       -- Supabase Storage URL
    transcript      TEXT,                       -- STT 전사 결과
    ai_summary      JSONB,                      -- AI 요약 { summary, reason, outcome, next_steps, sentiment }
    call_result     VARCHAR(30) CHECK (call_result IN ('appointment', 'callback', 'no_answer', 'refused', 'other')),
    notes           TEXT,                       -- 직원 메모
    scheduled_callback TIMESTAMP,               -- 콜백 예정 시각
    pending_tx      VARCHAR(200),               -- 미완료 진료 (환자 컨텍스트)
    risk_score      FLOAT,                      -- 이탈 위험도 (환자 컨텍스트)
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ─── 인덱스 ───
CREATE INDEX idx_doctor_stats_clinic_date ON daily_doctor_stats(clinic_id, stat_date);
CREATE INDEX idx_payment_stats_clinic_date ON daily_payment_stats(clinic_id, stat_date);
CREATE INDEX idx_risk_scores_clinic ON patient_risk_scores(clinic_id, risk_type);
CREATE INDEX idx_tx_mix_clinic_date ON tx_mix_daily(clinic_id, stat_date);
CREATE INDEX idx_insights_clinic ON ai_insights(clinic_id, generated_at DESC);
CREATE INDEX idx_call_records_clinic ON call_records(clinic_id, created_at DESC);
CREATE INDEX idx_call_records_patient ON call_records(clinic_id, patient_hash);
CREATE INDEX idx_call_records_staff ON call_records(clinic_id, staff_user_id);
CREATE INDEX idx_call_records_status ON call_records(clinic_id, call_result);

-- ─── 초기 데모 데이터 ───
INSERT INTO clinics (name, plan, ehr_type) VALUES
    ('아나플란트치과', 'pro', 'hanaro')
ON CONFLICT DO NOTHING;
