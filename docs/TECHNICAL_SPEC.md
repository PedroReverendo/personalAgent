# 🏗️ Technical Spec: MoltBot Backend Core

## 1. Visión Arquitectónica: "Headless Logic & Tooling"

El objetivo no es construir un chatbot monolítico, sino una **API de Capacidades (Capabilities API)**. La inteligencia reside en n8n (El Cerebro/Orquestador). Este backend actúa como el **Músculo y la Memoria**.

### Principios de Diseño

- **Stateless API**: Los endpoints REST no guardan estado de conversación. Solo ejecutan acciones atómicas.
- **Single Source of Truth (SSOT)**: Google Calendar y Gmail son la verdad absoluta. Postgres es solo para caché operativa, logs de auditoría y gestión de jobs asíncronos.
- **Authentication**:
  - Inbound (n8n -> Backend): Bearer Token (API Key simple)
  - Outbound (Backend -> Google): OAuth2 con Offline Access (Refresh Token)

---

## 2. Database Schema (PostgreSQL)

```sql
-- 1. REMINDERS (La cola de tareas)
CREATE TABLE scheduled_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    execute_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. EVENT_LOGS (Auditoría y Contexto)
CREATE TABLE action_logs (
    id SERIAL PRIMARY KEY,
    tool_name VARCHAR(50) NOT NULL,
    input_params JSONB,
    output_summary TEXT,
    execution_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. KEY_VALUE_STORE (Config Dinámica)
CREATE TABLE system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL
);
```

---

## 3. API Contract

### A. Calendar (`/api/v1/calendar`)

- `GET /upcoming` - Eventos próximas 24h
- `POST /create` - Body: `{ summary, start, duration_min }`

### B. Scheduler (`/api/v1/scheduler`)

- `POST /remind` - Body: `{ message, deliver_at, context? }`

### C. Gmail (`/api/v1/mail`)

- `GET /search` - Query: `?q=is:unread label:important`

---

## 4. Lógica de Negocio Crítica

### Worker Polling Pattern

- Servicio que ejecuta cada 60 segundos
- Query: `SELECT * FROM scheduled_tasks WHERE status = 'PENDING' AND execute_at <= NOW() FOR UPDATE SKIP LOCKED`
- Ejecuta tarea y marca como `COMPLETED`

### Google Auth Singleton

- Clase `GoogleClient` (Singleton)
- Carga `GOOGLE_REFRESH_TOKEN` del .env
- Usa librería `googleapis` oficial

---

## 5. Project Structure

```
/src
 ├── /config         # Variables de entorno (zod validation)
 ├── /controllers    # HTTP handlers
 ├── /services       # Lógica de negocio
 ├── /repositories   # Acceso a DB
 ├── /clients        # GoogleClient, EvolutionClient
 ├── /jobs           # Task worker
 ├── /types          # Interfaces TS
 └── app.ts          # Entry point
```

---

## 6. Stack Tecnológico

- **Runtime**: Node.js (LTS)
- **Language**: TypeScript (Strict Mode)
- **Framework**: Express
- **Validation**: Zod
- **Database**: pg (driver nativo)
