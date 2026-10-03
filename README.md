# Enterprise Issue Tracking & Service Request Management System (ITMS)

Production-ready, multi-tenant issue tracking and service request management system designed for enterprise business parks, campus management, and facility workflows.

---

## Getting Started & Environment Setup

### 1. Prerequisites
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **MySQL**: 8.0 or later
- **npm**: v9.0.0 or later

### 2. Configure Environment Variables

The backend requires environment variables to connect to the database, sign tokens, configure CORS, and enforce rate limits.

```bash
# 1. Navigate to the backend directory
cd BackEnd

# 2. Copy the example configuration template
cp .env.example .env
```

Open `BackEnd/.env` and update the values for your environment.

#### Generating Cryptographically Secure Secrets
Generate strong, unique secrets for `JWT_SECRET` and `JWT_REFRESH_SECRET`:
```bash
# Generate a strong 64-character base64 secret (run twice for access and refresh keys):
openssl rand -base64 48
```
> **Security Note:** In production, the system validates that secrets are at least 32 characters long and will fail fast at startup if default development strings are used.

### 3. Install Dependencies
```bash
# In BackEnd
cd BackEnd
npm install

# In FrontEnd
cd ../FrontEnd
npm install
```

### 4. Database Setup
Ensure MySQL is running, then load the master schema:
```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS issue_tracking_system DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p issue_tracking_system < BackEnd/src/database/Database.sql
```

### 5. Running the Application
```bash
# Start Backend (Default: http://localhost:5000)
cd BackEnd
npm run dev

# Start Frontend (Default: http://localhost:5173)
cd ../FrontEnd
npm run dev
```

### 6. Running Security & Integration Tests
```bash
cd BackEnd
npm test
```

---

## Security Architecture & Controls

- **Global Authentication by Default**: All API endpoints require verified Bearer token authentication unless explicitly included on the strict public allowlist (`/health`, `/api/auth/login`, `/api/auth/refresh`, `/api/auth/forgot-password`, `/api/auth/reset-password`).
- **No Actor Fallbacks**: User identity is derived strictly from verified JWT tokens and active database user accounts. Client-supplied headers (`x-user-id`) and anonymous default IDs are eliminated.
- **Fail-Fast Configuration**: Centralized environment configuration (`BackEnd/src/config/env.js`) validates required parameters at startup.
- **Hashed Password Resets**: Cryptographically random 32-byte tokens stored as SHA-256 hashes in MySQL table `PasswordResetToken` with 15-minute expiration, single-use enforcement, constant-time enumeration protection, and full session revocation upon reset.
- **CORS Protection**: Restricted to explicit origins configured in `CORS_ALLOWED_ORIGINS`. Wildcards with credentials are strictly prohibited.
- **Multi-Tiered Rate Limiting**: Global rate limiter (100 req/min) plus strict rate limits on authentication and password reset endpoints returning `429 Too Many Requests` with standard `Retry-After` headers.
