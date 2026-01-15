# Seventeen29 OS

Seventeen29 OS is a high-performance, enterprise-ready EHSQ platform designed for millions of users.

## Structure
- `backend/`: Rust-based Kernel (Actix/Axum + Tokio).
- `frontend/`: React + Vite + TypeScript.
- `infra/`: Docker Compose for PostgreSQL and other services.

## Setup

1. **Database**:
   ```bash
   cd infra
   docker-compose up -d
   ```

2. **Backend**:
   ```bash
   cd backend
   cargo run
   ```

3. **Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```
