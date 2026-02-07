-- MoltBot Backend Database Schema
-- Run this migration against your PostgreSQL database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SCHEDULED_TASKS (La cola de tareas / recordatorios)
CREATE TABLE IF NOT EXISTS scheduled_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    execute_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient polling queries
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_pending 
ON scheduled_tasks (execute_at) 
WHERE status = 'PENDING';

-- 2. ACTION_LOGS (Auditoría y Contexto para la IA)
CREATE TABLE IF NOT EXISTS action_logs (
    id SERIAL PRIMARY KEY,
    tool_name VARCHAR(50) NOT NULL,
    input_params JSONB,
    output_summary TEXT,
    execution_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for recent logs lookup
CREATE INDEX IF NOT EXISTS idx_action_logs_created 
ON action_logs (created_at DESC);

-- 3. SYSTEM_SETTINGS (Config Dinámica / Key-Value Store)
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_scheduled_tasks_updated_at
    BEFORE UPDATE ON scheduled_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
