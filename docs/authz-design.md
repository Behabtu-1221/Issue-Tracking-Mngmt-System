# Authorization & Multi-Tenant Data Isolation Design

**Issue Tracking & Management System (ITMS)**  
**Version:** 1.0 (Production Ready)  
**Security Classification:** Strict Row-Level Security & RBAC  

---

## 1. Executive Summary

This document specifies the authorization architecture, multi-tenant isolation mechanisms, and role-based access control (RBAC) design implemented across the ITMS platform. The system enforces **defense-in-depth**, **deny-by-default access**, **strict tenant isolation**, and **zero-existence leakage (404 masking)** across all 14 backend modules and 415+ registered API endpoints.

---

## 2. Tenancy Architecture

### 2.1 Multi-Tenancy Storage Model
ITMS utilizes a **shared-database, shared-schema** multi-tenancy model. Every tenant organization hosted within the business park is partitioned at the row level via an indexed integer foreign key `TenantID`.

Tables partitioned by `TenantID` include:
- `Tenant` (Organization master)
- `User` & `UserAccount`
- `LeaseAgreement`
- `TenantOfficeAllocation`
- `TenantContact`
- `TenantAddress`
- `SubTenant`
- `IssueRequest`
- `Conversation` & `IssueRequestComment`
- `sys_documents`
- `sys_document_versions`
- `CostCenter`
- `Announcement`

### 2.2 Tenant Identity Establishment & Propagation
Tenant context is established strictly from authenticated cryptographic tokens and verified against the user database record. Client applications are never trusted to declare their tenant identity.

```
┌─────────────────┐       ┌───────────────────────┐       ┌──────────────────────┐       ┌────────────────────┐
│ Incoming Client │ ────> │ `attachActor`         │ ────> │ `globalAuth`         │ ────> │ `dataScope`        │
│ Request         │       │ (Extracts JWT Claims) │       │ (Enforces Token/401) │       │ (Row-Level Scope)  │
└─────────────────┘       └───────────────────────┘       └──────────────────────┘       └────────────────────┘
                                                                                                    │
                                                                                                    ▼
                                                                                      ┌───────────────────────────┐
                                                                                      │ Sanitizes Client Body:    │
                                                                                      │ req.body.TenantID =       │
                                                                                      │ req.actor.tenantId        │
                                                                                      └───────────────────────────┘
```

1. **Authentication Token (`JWT`)**:
   - Access tokens contain the authenticated `tenantId`, `userId`, `userAccountId`, and `userTypeCode`.
   - When a request enters `BackEnd/src/shared/middleware/attachActor.js` and `authenticate.js`, the signature is verified using `JWT_SECRET`.
   - The user's active status (`AccountStatusCode = 'ACTIVE'`) is verified against the database.
   - The verified actor object is bound to `req.actor`.

2. **Client-Supplied Identifier Sanitization**:
   - To prevent **Tenant ID Spoofing / Tampering**, the global `dataScope` middleware inspects `req.body` and `req.query` for any client-supplied `TenantID` or `tenantId`.
   - For all non-park-admins, the middleware automatically overwrites client-supplied tenant fields with `req.actor.tenantId`.
   - If an authenticated representative of Tenant 1 submits `{ "TenantID": 2, ... }`, the payload is sanitized to `{ "TenantID": 1, ... }` prior to controller execution.

3. **Multi-Tenant Existence Masking (404 Not Found Policy)**:
   - When a tenant requests a resource by ID (e.g. `GET /api/leases/:id`, `GET /api/documents/:id`, `PUT /api/tenant-addresses/:id`) that belongs to a different tenant, the backend **must return HTTP 404 Not Found** (NOT 403 Forbidden).
   - **Rationale**: Returning 403 Forbidden informs an attacker that a foreign resource ID exists, enabling ID scanning, tenant mapping, and resource enumeration. Returning 404 ensures cross-tenant lookups are completely indistinguishable from non-existent resources.

---

## 3. Roles and Permissions Model

### 3.1 Role Hierarchy

| Role Code | Tenancy Scope | Data Scope Type | Description |
|:---|:---|:---|:---|
| `SUPER_ADMIN` | Global (All Tenants) | `ALL` | Full system access across platform configuration, all tenants, and global facilities. |
| `PARK_ADMIN` | Business Park | `ALL` | Business park management, facility spaces, leases, onboarding tenants, and service catalog. |
| `DEPARTMENT_MANAGER` | Departmental | `DEPARTMENT` | Manages departmental service issues, assignments, SLA escalation, and team members. |
| `DISPATCHER` | Operations | `DEPARTMENT` | Dispatches unassigned requests to technicians within operational departments. |
| `TECHNICIAN` | Assigned Work | `ASSIGNED` | Field worker executing assigned work orders and updating work logs. |
| `TENANT_REPRESENTATIVE`| Tenant Bounded | `TENANT` | Primary tenant contact; manages tenant contacts, addresses, sub-tenants, and views tenant issues. |
| `EMPLOYEE` | Individual/Tenant | `OWN` | Standard tenant employee; submits and views own issue requests and notices. |

### 3.2 Row-Level Data Scope Definition

The `req.dataScope` context populated by `dataScope.js`:

```javascript
req.dataScope = {
  type: 'ALL' | 'TENANT' | 'DEPARTMENT' | 'ASSIGNED' | 'OWN',
  userId: number,
  tenantId: number | null,
  departmentId: number | null
};
```

Repositories evaluate `dataScope` in parameterized SQL:
- **`ALL`**: No tenant predicate added.
- **`TENANT`**: Appends `AND table.TenantID = ?` (`dataScope.tenantId`).
- **`DEPARTMENT`**: Appends `AND table.AssignedDepartmentID = ?`.
- **`ASSIGNED`**: Appends `AND table.TechnicianUserID = ?`.
- **`OWN`**: Appends `AND table.RequesterUserID = ? AND table.TenantID = ?`.

---

## 4. Developer Guide: Adding a New Route

To ensure all future endpoints remain secure, production-ready, and compliant with tenant isolation:

### Step 1: Define the Router
In your module's `routes/` directory, create your router and mount `authenticate` and `dataScope` at the router level:

```javascript
import { Router } from 'express';
import myController from '../controllers/my.controller.js';
import validate from '../../../shared/middleware/validate.js';
import authenticate from '../../../shared/middleware/authenticate.js';
import dataScope from '../../../shared/middleware/dataScope.js';
import { authorizeRoles, authorizePermissions } from '../../../shared/middleware/authorize.js';
import { createSchema, updateSchema } from '../validators/my.validator.js';

const router = Router();

// 1. Mandatory Router Guards
router.use(authenticate);
router.use(dataScope);
```

### Step 2: Declare Authorization on Endpoints
Attach role or permission middleware to all mutation and privileged read endpoints:

```javascript
// Read (scoped to tenant automatically)
router.get('/', myController.list);
router.get('/:id', myController.getById);

// Admin-only mutation
router.post(
  '/',
  authorizeRoles('SUPER_ADMIN', 'PARK_ADMIN', 'DEPARTMENT_MANAGER'),
  validate(createSchema),
  myController.create
);

router.put(
  '/:id',
  authorizeRoles('SUPER_ADMIN', 'PARK_ADMIN'),
  validate(updateSchema),
  myController.update
);

router.delete(
  '/:id',
  authorizeRoles('SUPER_ADMIN', 'PARK_ADMIN'),
  myController.delete
);

export default router;
```

### Step 3: Implement Tenant-Scoped Service & Repository Logic
Never query the database by ID alone without checking the tenant ownership!

```javascript
// In Service:
async getResourceById(id, actor) {
  const resource = await myRepository.findById(id);
  if (!resource) {
    throw new AppError(`Resource with ID ${id} not found`, 404);
  }

  // 404 Masking for cross-tenant access:
  if (!actor.isParkAdmin && resource.TenantID && Number(resource.TenantID) !== Number(actor.tenantId)) {
    throw new AppError(`Resource with ID ${id} not found`, 404);
  }

  return resource;
}
```

```javascript
// In Repository (List Query):
async findAll({ page = 1, limit = 50, dataScope }) {
  let sql = 'SELECT * FROM MyTable WHERE IsDeleted = 0';
  const params = [];

  if (dataScope && dataScope.type === 'TENANT' && dataScope.tenantId) {
    sql += ' AND TenantID = ?';
    params.push(Number(dataScope.tenantId));
  }

  return query(sql, params);
}
```

---

## 5. Public Allowlist Policy & Governance

### 5.1 Criteria for Public Endpoints
A route may **only** be added to the public allowlist if it satisfies one of the following criteria:
1. **Unauthenticated Entry Points**: User authentication credentials exchange (`POST /api/auth/login`, `POST /api/auth/register`).
2. **Self-Service Password Recovery**: Token-based password reset and email verification flows (`/api/auth/forgot-password`, `/api/auth/reset-password`).
3. **Public Share Links**: Cryptographically random UUID token retrieval where token possession grants access (`GET /api/documents/share/:shareToken`).
4. **Health Check**: Infrastructure health monitoring returning non-sensitive operational status (`GET /health`).

### 5.2 Review & Approval Process
1. Any modification to `PUBLIC_ALLOWLIST` in `BackEnd/src/shared/middleware/globalAuth.js` requires explicit security review.
2. Route must not accept user ID or tenant ID parameters.
3. Route must have rate limiting mounted (via `authLimiter` or `globalLimiter`).
4. Automated verification via `npm test` runs `tests/security-hardening.test.js` and `tests/authorization-isolation.test.js` to ensure the route coverage guard passes.

---

## 6. Verification and Testing

All authorization and tenant isolation rules are validated by automated end-to-end integration tests:
- **`npm test`**: Runs the complete test suite.
- **`node tests/authorization-isolation.test.js`**:
  - Suite 1: Cross-tenant list query isolation.
  - Suite 2: BOLA / IDOR 404 existence masking.
  - Suite 3: Cross-tenant update and delete integrity preservation.
  - Suite 4: Tenant ID spoofing and client payload sanitization.
  - Suite 5: RBAC role and permission boundaries.
  - Suite 6: Negative proof test confirming active filter isolation.
  - Suite 7: Programmatic Express route stack coverage guard (415 endpoints verified).
