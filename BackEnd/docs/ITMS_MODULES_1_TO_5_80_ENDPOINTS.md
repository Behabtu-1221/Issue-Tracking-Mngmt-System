# Enterprise ITMS — Comprehensive API Endpoint Inventory (Modules 1 to 5)

This document is the verified, single-file inventory of all **80 API Endpoints** implemented across the first 5 foundation modules of the Enterprise Issue Tracking Management System (ITMS).

- **Local Base URL:** `http://localhost:5000`
- **Authentication Scheme:** `Authorization: Bearer <JWT_ACCESS_TOKEN>`
- **Default Seed Super Admin Login:** `superadmin` / `Admin@123`

---

## Table of Contents

- [Module 1: System Health & Diagnostics (3 Endpoints)](#module-1-system-health--diagnostics)
- [Module 2: Identity & Access Management (31 Endpoints)](#module-2-identity--access-management)
- [Module 3: Business Park & Campus Facility Management (21 Endpoints)](#module-3-business-park--campus-facility-management)
- [Module 4: Tenant Organizations & Space Allocation (17 Endpoints)](#module-4-tenant-organizations--space-allocation)
- [Module 5: Organizational Structure & Staff Management (17 Endpoints)](#module-5-organizational-structure--staff-management)

---
### Endpoint 1: Comprehensive System Health Check

| Property | Details |
|---|---|
| **Module** | 1. System Health & Diagnostics |
| **HTTP Method** | `GET` |
| **Full URL** | `GET http://localhost:5000/api/health` |
| **Authentication** | Public (Allowlisted in PUBLIC_ROUTES) |
| **Authorization** | None (Unrestricted) |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Accept: application/json` |
| **Database Effects** | Executes ping ('SELECT 1') and inspects _SchemaMigrations table. |
| **Source Location** | `BackEnd/src/shared/routes/health.routes.js:L79` |

#### Request Body
```json
None
```

#### Validation Rules
None

#### Expected Success Response (200 OK)
```json
{
  "status": "UP",
  "uptimeSeconds": 14250,
  "database": "CONNECTED",
  "migrations": "AT_HEAD",
  "headVersion": "006",
  "timestamp": "2026-10-24T10:45:00.000Z"
}
```

#### Error Responses
• 503 Service Unavailable: Database down or schema drift detected.

#### Postman Testing Instructions
1. Select GET\n2. Enter {{baseUrl}}/api/health\n3. Send and assert pm.response.code === 200 and pm.response.json().database === "CONNECTED"

---
### Endpoint 2: Container Liveness Probe

| Property | Details |
|---|---|
| **Module** | 1. System Health & Diagnostics |
| **HTTP Method** | `GET` |
| **Full URL** | `GET http://localhost:5000/api/health/live` |
| **Authentication** | Public |
| **Authorization** | None |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Accept: application/json` |
| **Database Effects** | Memory check on appLifecycle state. |
| **Source Location** | `BackEnd/src/shared/routes/health.routes.js:L16` |

#### Request Body
```json
None
```

#### Validation Rules
None

#### Expected Success Response (200 OK)
```json
{ "status": "UP", "timestamp": "2026-10-24T10:45:00.000Z" }
```

#### Error Responses
• 503 Service Unavailable: Server is gracefully shutting down (SIGTERM).

#### Postman Testing Instructions
1. Select GET\n2. Enter {{baseUrl}}/api/health/live\n3. Send and verify status 200.

---
### Endpoint 3: Container Readiness Probe

| Property | Details |
|---|---|
| **Module** | 1. System Health & Diagnostics |
| **HTTP Method** | `GET` |
| **Full URL** | `GET http://localhost:5000/api/health/ready` |
| **Authentication** | Public |
| **Authorization** | None |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Accept: application/json` |
| **Database Effects** | Pings database pool and validates migration versions. |
| **Source Location** | `BackEnd/src/shared/routes/health.routes.js:L28` |

#### Request Body
```json
None
```

#### Validation Rules
None

#### Expected Success Response (200 OK)
```json
{ "status": "UP", "database": "CONNECTED", "migrations": "AT_HEAD", "headVersion": "006" }
```

#### Error Responses
• 503 Service Unavailable: Initialization in progress or migrations not at head.

#### Postman Testing Instructions
1. Select GET\n2. Enter {{baseUrl}}/api/health/ready\n3. Send and verify status 200.

---
### Endpoint 4: User Account Login

| Property | Details |
|---|---|
| **Module** | 2. Identity & Access — Authentication |
| **HTTP Method** | `POST` |
| **Full URL** | `POST http://localhost:5000/api/auth/login` |
| **Authentication** | Public |
| **Authorization** | None |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Content-Type: application/json` |
| **Database Effects** | Reads UserAccount/User, resets FailedLoginAttempts, inserts UserSession and UserLoginHistory. |
| **Source Location** | `BackEnd/src/modules/identity-access/routes/auth.routes.js:L20` |

#### Request Body
```json
{
  "username": "superadmin",
  "password": "Admin@123"
}
```

#### Validation Rules
username: min 3, max 150 (required)\npassword: min 6, max 128 (required)

#### Expected Success Response (200 OK)
```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "expiresIn": "1h",
    "user": {
      "userId": 1,
      "userAccountId": 1,
      "tenantId": null,
      "username": "superadmin",
      "userTypeCode": "PARK_SUPER_ADMIN",
      "roles": ["PARK_SUPER_ADMIN"]
    }
  }
}
```

#### Error Responses
• 400 Bad Request: Missing or malformed username/password\n• 401 Unauthorized: Invalid username or password\n• 429 Too Many Requests: Exceeded 10 attempts/min

#### Postman Testing Instructions
1. Select POST\n2. Enter {{baseUrl}}/api/auth/login\n3. Set Body raw JSON: {"username":"superadmin","password":"Admin@123"}\n4. In Tests tab set: pm.collectionVariables.set("token", pm.response.json().data.accessToken)

---
### Endpoint 5: Refresh JWT Access Token

| Property | Details |
|---|---|
| **Module** | 2. Identity & Access — Authentication |
| **HTTP Method** | `POST` |
| **Full URL** | `POST http://localhost:5000/api/auth/refresh` |
| **Authentication** | Public |
| **Authorization** | None |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Content-Type: application/json` |
| **Database Effects** | Validates session in UserSession table. |
| **Source Location** | `BackEnd/src/modules/identity-access/routes/auth.routes.js:L21` |

#### Request Body
```json
{
  "refreshToken": "{{refreshToken}}"
}
```

#### Validation Rules
refreshToken: string (required)

#### Expected Success Response (200 OK)
```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "expiresIn": "1h"
  }
}
```

#### Error Responses
• 401 Unauthorized: Invalid, revoked or expired refresh token.

#### Postman Testing Instructions
1. Select POST\n2. Enter {{baseUrl}}/api/auth/refresh\n3. Pass refreshToken in body.

---
### Endpoint 6: Forgot Password Request

| Property | Details |
|---|---|
| **Module** | 2. Identity & Access — Authentication |
| **HTTP Method** | `POST` |
| **Full URL** | `POST http://localhost:5000/api/auth/forgot-password` |
| **Authentication** | Public |
| **Authorization** | None |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Content-Type: application/json` |
| **Database Effects** | Generates reset token in PasswordResetToken and queues email via outbox. |
| **Source Location** | `BackEnd/src/modules/identity-access/routes/auth.routes.js:L22` |

#### Request Body
```json
{
  "email": "superadmin@businesspark.local"
}
```

#### Validation Rules
username or email required (max 150)

#### Expected Success Response (200 OK)
```json
{
  "status": "success",
  "data": { "message": "Password reset instructions sent if account exists." }
}
```

#### Error Responses
• 400 Bad Request: Invalid email format\n• 429: Exceeded 5 requests/hr

#### Postman Testing Instructions
1. Select POST\n2. Enter {{baseUrl}}/api/auth/forgot-password\n3. Provide email.

---
### Endpoint 7: Reset Password With Token

| Property | Details |
|---|---|
| **Module** | 2. Identity & Access — Authentication |
| **HTTP Method** | `POST` |
| **Full URL** | `POST http://localhost:5000/api/auth/reset-password` |
| **Authentication** | Public |
| **Authorization** | None |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Content-Type: application/json` |
| **Database Effects** | Updates PasswordHash in UserAccount, invalidates PasswordResetToken. |
| **Source Location** | `BackEnd/src/modules/identity-access/routes/auth.routes.js:L23` |

#### Request Body
```json
{
  "token": "32_CHAR_HEX_RESET_TOKEN",
  "newPassword": "SecurePassword@2026!"
}
```

#### Validation Rules
token: min 32, max 128 (required)\nnewPassword: min 8, uppercase, lowercase, digit, symbol

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { "message": "Password reset successfully." } }
```

#### Error Responses
• 400 Bad Request: Weak password or invalid token\n• 401: Expired/used token

#### Postman Testing Instructions
1. Select POST\n2. Enter {{baseUrl}}/api/auth/reset-password\n3. Provide token and new password.

---
### Endpoint 8: Logout Current Session

| Property | Details |
|---|---|
| **Module** | 2. Identity & Access — Authentication |
| **HTTP Method** | `POST` |
| **Full URL** | `POST http://localhost:5000/api/auth/logout` |
| **Authentication** | Bearer Token |
| **Authorization** | Any Authenticated User |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}` |
| **Database Effects** | Marks session in UserSession as RevokedAt = NOW(). |
| **Source Location** | `BackEnd/src/modules/identity-access/routes/auth.routes.js:L24` |

#### Request Body
```json
None
```

#### Validation Rules
None

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { "message": "Logged out successfully" } }
```

#### Error Responses
• 401 Unauthorized: Invalid or missing token.

#### Postman Testing Instructions
1. Select POST\n2. Enter {{baseUrl}}/api/auth/logout\n3. Pass Bearer token.

---
### Endpoint 9: Get Current Actor Profile (/me)

| Property | Details |
|---|---|
| **Module** | 2. Identity & Access — Authentication |
| **HTTP Method** | `GET` |
| **Full URL** | `GET http://localhost:5000/api/auth/me` |
| **Authentication** | Bearer Token |
| **Authorization** | Any Authenticated User |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}` |
| **Database Effects** | Reads User, UserAccount, UserRole, Role, RolePermission. |
| **Source Location** | `BackEnd/src/modules/identity-access/routes/auth.routes.js:L25` |

#### Request Body
```json
None
```

#### Validation Rules
None

#### Expected Success Response (200 OK)
```json
{
  "status": "success",
  "data": {
    "userId": 1,
    "username": "superadmin",
    "firstName": "System",
    "lastName": "Super Admin",
    "roles": ["PARK_SUPER_ADMIN"],
    "permissions": ["issue:create", "issue:read", "user:manage"]
  }
}
```

#### Error Responses
• 401 Unauthorized: Expired/invalid JWT.

#### Postman Testing Instructions
1. Select GET\n2. Enter {{baseUrl}}/api/auth/me\n3. Pass Bearer token.

---
### Endpoint 10: Update Current User Profile

| Property | Details |
|---|---|
| **Module** | 2. Identity & Access — Authentication |
| **HTTP Method** | `PUT` |
| **Full URL** | `PUT http://localhost:5000/api/auth/profile` |
| **Authentication** | Bearer Token |
| **Authorization** | Any Authenticated User |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Content-Type: application/json, Authorization: Bearer {{token}}` |
| **Database Effects** | UPDATE User SET FirstName=?, LastName=?, PhoneNumber=? WHERE UserID=? |
| **Source Location** | `BackEnd/src/modules/identity-access/routes/auth.routes.js:L26` |

#### Request Body
```json
{
  "firstName": "System",
  "lastName": "Super Admin",
  "phoneNumber": "+251911000000",
  "preferredLanguage": "en"
}
```

#### Validation Rules
At least 1 field must be provided. firstName/lastName: max 100.

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { "userId": 1, "firstName": "System", ... } }
```

#### Error Responses
• 400 Bad Request: Empty body\n• 401 Unauthorized

#### Postman Testing Instructions
1. Select PUT\n2. Enter {{baseUrl}}/api/auth/profile\n3. Send updated fields.

---
### Endpoint 11: Update Notification Preferences

| Property | Details |
|---|---|
| **Module** | 2. Identity & Access — Authentication |
| **HTTP Method** | `PUT` |
| **Full URL** | `PUT http://localhost:5000/api/auth/notification-preferences` |
| **Authentication** | Bearer Token |
| **Authorization** | Any Authenticated User |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Content-Type: application/json, Authorization: Bearer {{token}}` |
| **Database Effects** | UPDATE UserPreference SET EmailNotifications=?, InAppNotifications=? |
| **Source Location** | `BackEnd/src/modules/identity-access/routes/auth.routes.js:L27` |

#### Request Body
```json
{
  "emailNotifications": true,
  "inAppNotifications": true,
  "digestFrequency": "DAILY"
}
```

#### Validation Rules
Boolean flags; digestFrequency: IMMEDIATE, DAILY, WEEKLY

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { "updated": true } }
```

#### Error Responses
• 400: Invalid payload\n• 401: Unauthorized

#### Postman Testing Instructions
1. Select PUT\n2. Enter {{baseUrl}}/api/auth/notification-preferences

---
### Endpoint 12: Change Current User Password

| Property | Details |
|---|---|
| **Module** | 2. Identity & Access — Authentication |
| **HTTP Method** | `POST` |
| **Full URL** | `POST http://localhost:5000/api/auth/change-password` |
| **Authentication** | Bearer Token |
| **Authorization** | Any Authenticated User |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Content-Type: application/json, Authorization: Bearer {{token}}` |
| **Database Effects** | Updates PasswordHash in UserAccount. |
| **Source Location** | `BackEnd/src/modules/identity-access/routes/auth.routes.js:L28` |

#### Request Body
```json
{
  "currentPassword": "Admin@123",
  "newPassword": "NewAdmin@123!"
}
```

#### Validation Rules
currentPassword: min 6; newPassword: min 8, uppercase, lowercase, digit, symbol

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { "message": "Password changed successfully." } }
```

#### Error Responses
• 400 Bad Request: Incorrect old password or weak new password

#### Postman Testing Instructions
1. Select POST\n2. Enter {{baseUrl}}/api/auth/change-password

---
### Endpoint 13: List Active User Sessions

| Property | Details |
|---|---|
| **Module** | 2. Identity & Access — Authentication |
| **HTTP Method** | `GET` |
| **Full URL** | `GET http://localhost:5000/api/auth/sessions` |
| **Authentication** | Bearer Token |
| **Authorization** | Any Authenticated User |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}` |
| **Database Effects** | SELECT from UserSession WHERE UserAccountID = ? AND RevokedAt IS NULL |
| **Source Location** | `BackEnd/src/modules/identity-access/routes/auth.routes.js:L29` |

#### Request Body
```json
None
```

#### Validation Rules
None

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": [{ "SessionID": 47, "UserAgent": "...", "CreatedAt": "..." }] }
```

#### Error Responses
• 401 Unauthorized

#### Postman Testing Instructions
1. Select GET\n2. Enter {{baseUrl}}/api/auth/sessions

---
### Endpoint 14: Revoke Specific User Session

| Property | Details |
|---|---|
| **Module** | 2. Identity & Access — Authentication |
| **HTTP Method** | `DELETE` |
| **Full URL** | `DELETE http://localhost:5000/api/auth/sessions/:sessionId` |
| **Authentication** | Bearer Token |
| **Authorization** | Any Authenticated User |
| **Path Parameters** | sessionId: Integer (positive) |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}` |
| **Database Effects** | UPDATE UserSession SET RevokedAt = NOW() WHERE SessionID = ? |
| **Source Location** | `BackEnd/src/modules/identity-access/routes/auth.routes.js:L30` |

#### Request Body
```json
None
```

#### Validation Rules
sessionId must be valid integer

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { "revoked": true } }
```

#### Error Responses
• 404 Not Found: Session does not belong to actor or not found

#### Postman Testing Instructions
1. Select DELETE\n2. Enter {{baseUrl}}/api/auth/sessions/47

---
### Endpoint 15: List User Accounts

| Property | Details |
|---|---|
| **Module** | 2. Identity & Access — Users |
| **HTTP Method** | `GET` |
| **Full URL** | `GET http://localhost:5000/api/users` |
| **Authentication** | Bearer Token |
| **Authorization** | Any Authenticated User (Scoped by DataScope) |
| **Path Parameters** | None |
| **Query Parameters** | limit (default 10), offset (default 0), search, tenantId, userTypeCode |
| **Headers** | `Authorization: Bearer {{token}}` |
| **Database Effects** | SELECT from User u JOIN UserAccount ua with tenant filter. |
| **Source Location** | `BackEnd/src/modules/identity-access/routes/user.routes.js:L20` |

#### Request Body
```json
None
```

#### Validation Rules
limit: 1..100, offset: >=0

#### Expected Success Response (200 OK)
```json
{
  "status": "success",
  "data": {
    "users": [
      { "UserID": 1, "FirstName": "System", "LastName": "Super Admin", "Email": "superadmin@businesspark.local" }
    ],
    "pagination": { "total": 8, "limit": 10, "offset": 0 }
  }
}
```

#### Error Responses
• 401 Unauthorized

#### Postman Testing Instructions
1. Select GET\n2. Enter {{baseUrl}}/api/users?limit=10&offset=0

---
### Endpoint 16: Create New User Account

| Property | Details |
|---|---|
| **Module** | 2. Identity & Access — Users |
| **HTTP Method** | `POST` |
| **Full URL** | `POST http://localhost:5000/api/users` |
| **Authentication** | Bearer Token |
| **Authorization** | SUPER_ADMIN, ADMIN, PARK_ADMIN, PARK_SUPER_ADMIN, TENANT_ADMIN, COMPANY_ADMIN |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Content-Type: application/json, Authorization: Bearer {{token}}` |
| **Database Effects** | INSERT INTO User; INSERT INTO UserAccount; queue transactional email. |
| **Source Location** | `BackEnd/src/modules/identity-access/routes/user.routes.js:L21` |

#### Request Body
```json
{
  "firstName": "Abebe",
  "lastName": "Kebede",
  "email": "abebe.kebede@tenantcorp.et",
  "userTypeCode": "STAFF",
  "tenantId": 1,
  "jobTitle": "Facilities Coordinator",
  "phoneNumber": "+251911223344",
  "accountStatusCode": "ACTIVE"
}
```

#### Validation Rules
firstName, lastName, email required. userTypeCode enum: SUPER_ADMIN, ADMIN, STAFF, TECHNICIAN, MANAGER, TENANT_ADMIN, TENANT_REPRESENTATIVE, CONTRACTOR, VISITOR, EMPLOYEE

#### Expected Success Response (201 Created)
```json
{
  "status": "success",
  "data": {
    "UserID": 14,
    "FirstName": "Abebe",
    "LastName": "Kebede",
    "Email": "abebe.kebede@tenantcorp.et",
    "generatedUsername": "abebekebede1",
    "emailSent": true
  }
}
```

#### Error Responses
• 400 Bad Request: Missing required field or invalid email\n• 409 Conflict: Email already registered

#### Postman Testing Instructions
1. Select POST\n2. Enter {{baseUrl}}/api/users\n3. Provide payload and send.

---
### Endpoint 17: Get User By ID

| Property | Details |
|---|---|
| **Module** | 2. Identity & Access — Users |
| **HTTP Method** | `GET` |
| **Full URL** | `GET http://localhost:5000/api/users/:id` |
| **Authentication** | Bearer Token |
| **Authorization** | Any Authenticated User |
| **Path Parameters** | id: Integer (positive) |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}` |
| **Database Effects** | SELECT from User WHERE UserID = ? |
| **Source Location** | `BackEnd/src/modules/identity-access/routes/user.routes.js:L23` |

#### Request Body
```json
None
```

#### Validation Rules
id: positive integer

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { "UserID": 1, "FirstName": "System", ... } }
```

#### Error Responses
• 404 Not Found: User does not exist

#### Postman Testing Instructions
1. Select GET\n2. Enter {{baseUrl}}/api/users/1

---
### Endpoint 18: Update User Details

| Property | Details |
|---|---|
| **Module** | 2. Identity & Access — Users |
| **HTTP Method** | `PUT` |
| **Full URL** | `PUT http://localhost:5000/api/users/:id` |
| **Authentication** | Bearer Token |
| **Authorization** | Any Authenticated User (Own or Admin) |
| **Path Parameters** | id: Integer |
| **Query Parameters** | None |
| **Headers** | `Content-Type: application/json, Authorization: Bearer {{token}}` |
| **Database Effects** | UPDATE User SET ... WHERE UserID = ? |
| **Source Location** | `BackEnd/src/modules/identity-access/routes/user.routes.js:L24` |

#### Request Body
```json
{
  "firstName": "Abebe",
  "lastName": "Kebede Modified",
  "jobTitle": "Lead Facilities Coordinator",
  "phoneNumber": "+251911998877"
}
```

#### Validation Rules
Min 1 field required. Valid phone/email formats.

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { "UserID": 14, ... } }
```

#### Error Responses
• 400: Validation failed\n• 404: User not found

#### Postman Testing Instructions
1. Select PUT\n2. Enter {{baseUrl}}/api/users/1

---
### Endpoint 19: Update User Account Status

| Property | Details |
|---|---|
| **Module** | 2. Identity & Access — Users |
| **HTTP Method** | `PATCH` |
| **Full URL** | `PATCH http://localhost:5000/api/users/:id/status` |
| **Authentication** | Bearer Token |
| **Authorization** | Super/Park/Tenant Admin |
| **Path Parameters** | id: Integer |
| **Query Parameters** | None |
| **Headers** | `Content-Type: application/json, Authorization: Bearer {{token}}` |
| **Database Effects** | UPDATE UserAccount SET AccountStatusCode = ? WHERE UserID = ? |
| **Source Location** | `BackEnd/src/modules/identity-access/routes/user.routes.js:L25` |

#### Request Body
```json
{
  "status": "ACTIVE"
}
```

#### Validation Rules
status enum: ACTIVE, LOCKED, SUSPENDED, PENDING_MFA, DEACTIVATED, INACTIVE, MUST_CHANGE_PASSWORD, PENDING, PENDING_ACTIVATION

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { "UserID": 1, "AccountStatusCode": "ACTIVE" } }
```

#### Error Responses
• 400: Invalid status code\n• 403: Forbidden

#### Postman Testing Instructions
1. Select PATCH\n2. Enter {{baseUrl}}/api/users/1/status

---
### Endpoint 20: Soft Delete User Account

| Property | Details |
|---|---|
| **Module** | 2. Identity & Access — Users |
| **HTTP Method** | `DELETE` |
| **Full URL** | `DELETE http://localhost:5000/api/users/:id` |
| **Authentication** | Bearer Token |
| **Authorization** | Super/Park/Tenant Admin |
| **Path Parameters** | id: Integer |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}` |
| **Database Effects** | UPDATE User SET IsDeleted = 1; UPDATE UserAccount SET IsDeleted = 1; revokes active sessions. |
| **Source Location** | `BackEnd/src/modules/identity-access/routes/user.routes.js:L26` |

#### Request Body
```json
None
```

#### Validation Rules
id: positive integer

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { "message": "User deleted successfully" } }
```

#### Error Responses
• 403: Forbidden\n• 404: User not found

#### Postman Testing Instructions
1. Select DELETE\n2. Enter {{baseUrl}}/api/users/:id

---
### Endpoint 21: Get User Active Sessions

| Property | Details |
|---|---|
| **Module** | 2. Identity & Access — Users |
| **HTTP Method** | `GET` |
| **Full URL** | `GET http://localhost:5000/api/users/:id/sessions` |
| **Authentication** | Bearer Token |
| **Authorization** | Any Authenticated User |
| **Path Parameters** | id: Integer |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}` |
| **Database Effects** | SELECT from UserSession WHERE UserAccountID IN (SELECT UserAccountID FROM UserAccount WHERE UserID=?) |
| **Source Location** | `BackEnd/src/modules/identity-access/routes/user.routes.js:L28` |

#### Request Body
```json
None
```

#### Validation Rules
id: positive integer

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": [ ... ] }
```

#### Error Responses
• 404: User not found

#### Postman Testing Instructions
1. Select GET\n2. Enter {{baseUrl}}/api/users/1/sessions

---
### Endpoint 22: Terminate All User Sessions

| Property | Details |
|---|---|
| **Module** | 2. Identity & Access — Users |
| **HTTP Method** | `DELETE` |
| **Full URL** | `DELETE http://localhost:5000/api/users/:id/sessions` |
| **Authentication** | Bearer Token |
| **Authorization** | Super/Park/Tenant Admin |
| **Path Parameters** | id: Integer |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}` |
| **Database Effects** | UPDATE UserSession SET RevokedAt = NOW() WHERE UserAccountID IN (...) |
| **Source Location** | `BackEnd/src/modules/identity-access/routes/user.routes.js:L29` |

#### Request Body
```json
None
```

#### Validation Rules
id: positive integer

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { "revokedCount": 2 } }
```

#### Error Responses
• 403: Forbidden

#### Postman Testing Instructions
1. Select DELETE\n2. Enter {{baseUrl}}/api/users/1/sessions

---
### Endpoint 23: Get User Login History

| Property | Details |
|---|---|
| **Module** | 2. Identity & Access — Users |
| **HTTP Method** | `GET` |
| **Full URL** | `GET http://localhost:5000/api/users/:id/login-history` |
| **Authentication** | Bearer Token |
| **Authorization** | Any Authenticated User |
| **Path Parameters** | id: Integer |
| **Query Parameters** | limit (default 10), offset (default 0) |
| **Headers** | `Authorization: Bearer {{token}}` |
| **Database Effects** | SELECT from UserLoginHistory WHERE UserAccountID = ? |
| **Source Location** | `BackEnd/src/modules/identity-access/routes/user.routes.js:L30` |

#### Request Body
```json
None
```

#### Validation Rules
limit: 1..100, offset: >=0

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { "history": [ ... ], "total": 12 } }
```

#### Error Responses
• 401 Unauthorized

#### Postman Testing Instructions
1. Select GET\n2. Enter {{baseUrl}}/api/users/1/login-history

---
### Endpoint 24: Get All System Permissions

| Property | Details |
|---|---|
| **Module** | 2. Identity & Access — Roles |
| **HTTP Method** | `GET` |
| **Full URL** | `GET http://localhost:5000/api/roles/permissions` |
| **Authentication** | Bearer Token |
| **Authorization** | Any Authenticated User |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}` |
| **Database Effects** | SELECT from Permission WHERE IsActive = 1 |
| **Source Location** | `BackEnd/src/modules/identity-access/routes/role.routes.js:L20` |

#### Request Body
```json
None
```

#### Validation Rules
None

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": [ { "PermissionID": 1, "PermissionCode": "issue:create", "ModuleName": "issue-management" } ] }
```

#### Error Responses
• 401 Unauthorized

#### Postman Testing Instructions
1. Select GET\n2. Enter {{baseUrl}}/api/roles/permissions

---
### Endpoint 25: Get RBAC Audit Logs

| Property | Details |
|---|---|
| **Module** | 2. Identity & Access — Roles |
| **HTTP Method** | `GET` |
| **Full URL** | `GET http://localhost:5000/api/roles/audit-logs` |
| **Authentication** | Bearer Token |
| **Authorization** | Any Authenticated User |
| **Path Parameters** | None |
| **Query Parameters** | limit, offset |
| **Headers** | `Authorization: Bearer {{token}}` |
| **Database Effects** | SELECT from AuditLog WHERE Action LIKE '%ROLE%' OR Action LIKE '%PERMISSION%' |
| **Source Location** | `BackEnd/src/modules/identity-access/routes/role.routes.js:L21` |

#### Request Body
```json
None
```

#### Validation Rules
None

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": [ ... ] }
```

#### Error Responses
• 401 Unauthorized

#### Postman Testing Instructions
1. Select GET\n2. Enter {{baseUrl}}/api/roles/audit-logs

---
### Endpoint 26: List Defined Roles

| Property | Details |
|---|---|
| **Module** | 2. Identity & Access — Roles |
| **HTTP Method** | `GET` |
| **Full URL** | `GET http://localhost:5000/api/roles` |
| **Authentication** | Bearer Token |
| **Authorization** | Any Authenticated User |
| **Path Parameters** | None |
| **Query Parameters** | limit (default 20), offset (default 0), tenantId, search |
| **Headers** | `Authorization: Bearer {{token}}` |
| **Database Effects** | SELECT from Role WHERE IsDeleted = 0 |
| **Source Location** | `BackEnd/src/modules/identity-access/routes/role.routes.js:L22` |

#### Request Body
```json
None
```

#### Validation Rules
limit: 1..100, offset: >=0

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": [ { "RoleID": 1, "RoleCode": "PARK_SUPER_ADMIN", "RoleName": "Park Super Admin" } ] }
```

#### Error Responses
• 401 Unauthorized

#### Postman Testing Instructions
1. Select GET\n2. Enter {{baseUrl}}/api/roles

---
### Endpoint 27: Create Custom Role

| Property | Details |
|---|---|
| **Module** | 2. Identity & Access — Roles |
| **HTTP Method** | `POST` |
| **Full URL** | `POST http://localhost:5000/api/roles` |
| **Authentication** | Bearer Token |
| **Authorization** | SUPER_ADMIN, ADMIN, TENANT_ADMIN, PARK_ADMIN |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Content-Type: application/json, Authorization: Bearer {{token}}` |
| **Database Effects** | INSERT INTO Role; INSERT INTO RolePermission. |
| **Source Location** | `BackEnd/src/modules/identity-access/routes/role.routes.js:L23` |

#### Request Body
```json
{
  "roleCode": "FACILITY_AUDITOR",
  "roleName": "Facility Safety Auditor",
  "description": "Performs facility compliance safety audits",
  "permissionIds": [1, 2, 3]
}
```

#### Validation Rules
roleCode: uppercase, 2..50; roleName: 2..150; permissionIds: array of positive integers

#### Expected Success Response (201 Created)
```json
{ "status": "success", "data": { "RoleID": 8, "RoleCode": "FACILITY_AUDITOR", ... } }
```

#### Error Responses
• 400: Validation error\n• 409: Role code already exists

#### Postman Testing Instructions
1. Select POST\n2. Enter {{baseUrl}}/api/roles

---
### Endpoint 28: Get Role By ID

| Property | Details |
|---|---|
| **Module** | 2. Identity & Access — Roles |
| **HTTP Method** | `GET` |
| **Full URL** | `GET http://localhost:5000/api/roles/:id` |
| **Authentication** | Bearer Token |
| **Authorization** | Any Authenticated User |
| **Path Parameters** | id: Integer |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}` |
| **Database Effects** | SELECT from Role JOIN RolePermission WHERE RoleID = ? |
| **Source Location** | `BackEnd/src/modules/identity-access/routes/role.routes.js:L26` |

#### Request Body
```json
None
```

#### Validation Rules
id: positive integer

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { "RoleID": 1, "RoleCode": "PARK_SUPER_ADMIN", "permissions": [...] } }
```

#### Error Responses
• 404: Role not found

#### Postman Testing Instructions
1. Select GET\n2. Enter {{baseUrl}}/api/roles/1

---
### Endpoint 29: Update Role Details

| Property | Details |
|---|---|
| **Module** | 2. Identity & Access — Roles |
| **HTTP Method** | `PUT` |
| **Full URL** | `PUT http://localhost:5000/api/roles/:id` |
| **Authentication** | Bearer Token |
| **Authorization** | SUPER_ADMIN, ADMIN, TENANT_ADMIN, PARK_ADMIN |
| **Path Parameters** | id: Integer |
| **Query Parameters** | None |
| **Headers** | `Content-Type: application/json, Authorization: Bearer {{token}}` |
| **Database Effects** | UPDATE Role SET RoleName=?, Description=? WHERE RoleID = ? |
| **Source Location** | `BackEnd/src/modules/identity-access/routes/role.routes.js:L27` |

#### Request Body
```json
{
  "roleName": "Senior Facility Safety Auditor",
  "description": "Expanded campus compliance audit privileges"
}
```

#### Validation Rules
Min 1 field. roleName: 2..150

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { "RoleID": 8, ... } }
```

#### Error Responses
• 400: Validation error\n• 404: Role not found

#### Postman Testing Instructions
1. Select PUT\n2. Enter {{baseUrl}}/api/roles/:id

---
### Endpoint 30: Delete Role

| Property | Details |
|---|---|
| **Module** | 2. Identity & Access — Roles |
| **HTTP Method** | `DELETE` |
| **Full URL** | `DELETE http://localhost:5000/api/roles/:id` |
| **Authentication** | Bearer Token |
| **Authorization** | SUPER_ADMIN, ADMIN, TENANT_ADMIN, PARK_ADMIN |
| **Path Parameters** | id: Integer |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}` |
| **Database Effects** | UPDATE Role SET IsDeleted = 1 WHERE RoleID = ? |
| **Source Location** | `BackEnd/src/modules/identity-access/routes/role.routes.js:L28` |

#### Request Body
```json
None
```

#### Validation Rules
id: positive integer

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { "message": "Role deleted successfully" } }
```

#### Error Responses
• 409 Conflict: Cannot delete system role or role with assigned active users

#### Postman Testing Instructions
1. Select DELETE\n2. Enter {{baseUrl}}/api/roles/:id

---
### Endpoint 31: Sync Role Permissions

| Property | Details |
|---|---|
| **Module** | 2. Identity & Access — Roles |
| **HTTP Method** | `PUT` |
| **Full URL** | `PUT http://localhost:5000/api/roles/:id/permissions` |
| **Authentication** | Bearer Token |
| **Authorization** | SUPER_ADMIN, ADMIN, PARK_ADMIN |
| **Path Parameters** | id: Integer |
| **Query Parameters** | None |
| **Headers** | `Content-Type: application/json, Authorization: Bearer {{token}}` |
| **Database Effects** | DELETE from RolePermission WHERE RoleID = ?; INSERT new permission associations. |
| **Source Location** | `BackEnd/src/modules/identity-access/routes/role.routes.js:L29` |

#### Request Body
```json
{
  "permissionIds": [1, 2, 3, 4, 5]
}
```

#### Validation Rules
permissionIds: Array of positive integers (required)

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { "synced": true, "permissionCount": 5 } }
```

#### Error Responses
• 400: Invalid permission ID array\n• 404: Role not found

#### Postman Testing Instructions
1. Select PUT\n2. Enter {{baseUrl}}/api/roles/1/permissions

---
### Endpoint 32: Assign Roles to User (Direct)

| Property | Details |
|---|---|
| **Module** | 2. Identity & Access — Roles |
| **HTTP Method** | `POST` |
| **Full URL** | `POST http://localhost:5000/api/roles/assign` |
| **Authentication** | Bearer Token |
| **Authorization** | SUPER_ADMIN, ADMIN, TENANT_ADMIN, PARK_ADMIN |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Content-Type: application/json, Authorization: Bearer {{token}}` |
| **Database Effects** | INSERT INTO UserRole (UserID, RoleID, IsActive) VALUES ... |
| **Source Location** | `BackEnd/src/modules/identity-access/routes/role.routes.js:L25` |

#### Request Body
```json
{
  "userId": 5,
  "roleIds": [2, 3]
}
```

#### Validation Rules
userId: positive integer; roleIds: array of positive integers

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { "assigned": true } }
```

#### Error Responses
• 400: Invalid payload\n• 404: User or Role not found

#### Postman Testing Instructions
1. Select POST\n2. Enter {{baseUrl}}/api/roles/assign

---
### Endpoint 33: Assign Roles to Specific User URL

| Property | Details |
|---|---|
| **Module** | 2. Identity & Access — Roles |
| **HTTP Method** | `POST` |
| **Full URL** | `POST http://localhost:5000/api/roles/users/:id/assign` |
| **Authentication** | Bearer Token |
| **Authorization** | SUPER_ADMIN, ADMIN, TENANT_ADMIN, PARK_ADMIN |
| **Path Parameters** | id: Integer (UserID) |
| **Query Parameters** | None |
| **Headers** | `Content-Type: application/json, Authorization: Bearer {{token}}` |
| **Database Effects** | INSERT INTO UserRole. |
| **Source Location** | `BackEnd/src/modules/identity-access/routes/role.routes.js:L31` |

#### Request Body
```json
{
  "roleIds": [2]
}
```

#### Validation Rules
id: positive integer; roleIds: array of integers (min 1)

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { "assigned": true } }
```

#### Error Responses
• 400: Validation error

#### Postman Testing Instructions
1. Select POST\n2. Enter {{baseUrl}}/api/roles/users/5/assign

---
### Endpoint 34: Remove Role from User

| Property | Details |
|---|---|
| **Module** | 2. Identity & Access — Roles |
| **HTTP Method** | `DELETE` |
| **Full URL** | `DELETE http://localhost:5000/api/roles/users/:id/roles/:roleId` |
| **Authentication** | Bearer Token |
| **Authorization** | SUPER_ADMIN, ADMIN, TENANT_ADMIN, PARK_ADMIN |
| **Path Parameters** | id: UserID, roleId: RoleID |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}` |
| **Database Effects** | UPDATE UserRole SET IsActive = 0, IsDeleted = 1 WHERE UserID = ? AND RoleID = ? |
| **Source Location** | `BackEnd/src/modules/identity-access/routes/role.routes.js:L32` |

#### Request Body
```json
None
```

#### Validation Rules
id, roleId positive integers

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { "removed": true } }
```

#### Error Responses
• 404: Association not found

#### Postman Testing Instructions
1. Select DELETE\n2. Enter {{baseUrl}}/api/roles/users/5/roles/2

---
### Endpoint 35: List Business Parks

| Property | Details |
|---|---|
| **Module** | 3. Business Park & Campus Facilities |
| **HTTP Method** | `GET` |
| **Full URL** | `GET http://localhost:5000/api/parks` |
| **Authentication** | Bearer Token |
| **Authorization** | Authenticated |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | SELECT from BusinessPark |
| **Source Location** | `src/modules/business-park/routes/park.routes.js:L13` |

#### Request Body
```json
None
```

#### Validation Rules
Joi schema validated in park.validator.js

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select GET\n2. Enter {{baseUrl}}/api/parks\n3. Send with Bearer token.

---
### Endpoint 36: Get Park Telemetry Metrics

| Property | Details |
|---|---|
| **Module** | 3. Business Park & Campus Facilities |
| **HTTP Method** | `GET` |
| **Full URL** | `GET http://localhost:5000/api/parks/metrics` |
| **Authentication** | Bearer Token |
| **Authorization** | SUPER_ADMIN, PARK_ADMIN |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | Aggregate counts of buildings, floors, offices, occupancy |
| **Source Location** | `src/modules/business-park/routes/park.routes.js:L14` |

#### Request Body
```json
None
```

#### Validation Rules
Joi schema validated in park.validator.js

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select GET\n2. Enter {{baseUrl}}/api/parks/metrics\n3. Send with Bearer token.

---
### Endpoint 37: Get Business Park By ID

| Property | Details |
|---|---|
| **Module** | 3. Business Park & Campus Facilities |
| **HTTP Method** | `GET` |
| **Full URL** | `GET http://localhost:5000/api/parks/:id` |
| **Authentication** | Bearer Token |
| **Authorization** | Authenticated |
| **Path Parameters** | id |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | SELECT from BusinessPark WHERE BusinessParkID = ? |
| **Source Location** | `src/modules/business-park/routes/park.routes.js:L15` |

#### Request Body
```json
None
```

#### Validation Rules
Joi schema validated in park.validator.js

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select GET\n2. Enter {{baseUrl}}/api/parks/:id\n3. Send with Bearer token.

---
### Endpoint 38: Create Business Park

| Property | Details |
|---|---|
| **Module** | 3. Business Park & Campus Facilities |
| **HTTP Method** | `POST` |
| **Full URL** | `POST http://localhost:5000/api/parks` |
| **Authentication** | Bearer Token |
| **Authorization** | SUPER_ADMIN, PARK_ADMIN |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | INSERT INTO BusinessPark |
| **Source Location** | `src/modules/business-park/routes/park.routes.js:L16` |

#### Request Body
```json
{
  "BusinessParkCode": "ETH-IT-PARK-02",
  "BusinessParkName": "Bole Lemi Tech Park",
  "City": "Addis Ababa",
  "Country": "Ethiopia",
  "IsOperational": 1,
  "IsActive": 1
}
```

#### Validation Rules
Joi schema validated in park.validator.js

#### Expected Success Response (201 Created)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select POST\n2. Enter {{baseUrl}}/api/parks\n3. Send with Bearer token.

---
### Endpoint 39: Update Business Park

| Property | Details |
|---|---|
| **Module** | 3. Business Park & Campus Facilities |
| **HTTP Method** | `PUT` |
| **Full URL** | `PUT http://localhost:5000/api/parks/:id` |
| **Authentication** | Bearer Token |
| **Authorization** | SUPER_ADMIN, PARK_ADMIN |
| **Path Parameters** | id |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | UPDATE BusinessPark |
| **Source Location** | `src/modules/business-park/routes/park.routes.js:L17` |

#### Request Body
```json
{
  "BusinessParkName": "Bole Lemi ICT Hub",
  "TotalAreaSquareMeter": 45000.0
}
```

#### Validation Rules
Joi schema validated in park.validator.js

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select PUT\n2. Enter {{baseUrl}}/api/parks/:id\n3. Send with Bearer token.

---
### Endpoint 40: Delete Business Park

| Property | Details |
|---|---|
| **Module** | 3. Business Park & Campus Facilities |
| **HTTP Method** | `DELETE` |
| **Full URL** | `DELETE http://localhost:5000/api/parks/:id` |
| **Authentication** | Bearer Token |
| **Authorization** | SUPER_ADMIN, PARK_ADMIN |
| **Path Parameters** | id |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | UPDATE BusinessPark SET IsActive = 0, IsDeleted = 1 |
| **Source Location** | `src/modules/business-park/routes/park.routes.js:L18` |

#### Request Body
```json
None
```

#### Validation Rules
Joi schema validated in park.validator.js

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select DELETE\n2. Enter {{baseUrl}}/api/parks/:id\n3. Send with Bearer token.

---
### Endpoint 41: List Campus Buildings

| Property | Details |
|---|---|
| **Module** | 3. Business Park & Campus Facilities |
| **HTTP Method** | `GET` |
| **Full URL** | `GET http://localhost:5000/api/buildings` |
| **Authentication** | Bearer Token |
| **Authorization** | SUPER_ADMIN, PARK_ADMIN |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | SELECT from Building |
| **Source Location** | `src/modules/business-park/routes/building.routes.js:L15` |

#### Request Body
```json
None
```

#### Validation Rules
Joi schema validated in park.validator.js

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select GET\n2. Enter {{baseUrl}}/api/buildings\n3. Send with Bearer token.

---
### Endpoint 42: Get Building By ID

| Property | Details |
|---|---|
| **Module** | 3. Business Park & Campus Facilities |
| **HTTP Method** | `GET` |
| **Full URL** | `GET http://localhost:5000/api/buildings/:id` |
| **Authentication** | Bearer Token |
| **Authorization** | SUPER_ADMIN, PARK_ADMIN |
| **Path Parameters** | id |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | SELECT from Building WHERE BuildingID = ? |
| **Source Location** | `src/modules/business-park/routes/building.routes.js:L16` |

#### Request Body
```json
None
```

#### Validation Rules
Joi schema validated in park.validator.js

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select GET\n2. Enter {{baseUrl}}/api/buildings/:id\n3. Send with Bearer token.

---
### Endpoint 43: Get Floors in Building

| Property | Details |
|---|---|
| **Module** | 3. Business Park & Campus Facilities |
| **HTTP Method** | `GET` |
| **Full URL** | `GET http://localhost:5000/api/buildings/:buildingId/floors` |
| **Authentication** | Bearer Token |
| **Authorization** | SUPER_ADMIN, PARK_ADMIN |
| **Path Parameters** | buildingId/floors |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | SELECT from Floor WHERE BuildingID = ? |
| **Source Location** | `src/modules/business-park/routes/building.routes.js:L17` |

#### Request Body
```json
None
```

#### Validation Rules
Joi schema validated in park.validator.js

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select GET\n2. Enter {{baseUrl}}/api/buildings/:buildingId/floors\n3. Send with Bearer token.

---
### Endpoint 44: Create Campus Building

| Property | Details |
|---|---|
| **Module** | 3. Business Park & Campus Facilities |
| **HTTP Method** | `POST` |
| **Full URL** | `POST http://localhost:5000/api/buildings` |
| **Authentication** | Bearer Token |
| **Authorization** | SUPER_ADMIN, PARK_ADMIN |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | INSERT INTO Building |
| **Source Location** | `src/modules/business-park/routes/building.routes.js:L18` |

#### Request Body
```json
{
  "BusinessParkID": 1,
  "FacilityZoneID": 1,
  "BuildingCode": "BLD-ALPHA-01",
  "BuildingName": "Alpha Innovation Hub",
  "TotalFloors": 5,
  "TotalAreaSquareMeter": 12500.0,
  "IsActive": 1
}
```

#### Validation Rules
Joi schema validated in park.validator.js

#### Expected Success Response (201 Created)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select POST\n2. Enter {{baseUrl}}/api/buildings\n3. Send with Bearer token.

---
### Endpoint 45: Update Campus Building

| Property | Details |
|---|---|
| **Module** | 3. Business Park & Campus Facilities |
| **HTTP Method** | `PUT` |
| **Full URL** | `PUT http://localhost:5000/api/buildings/:id` |
| **Authentication** | Bearer Token |
| **Authorization** | SUPER_ADMIN, PARK_ADMIN |
| **Path Parameters** | id |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | UPDATE Building |
| **Source Location** | `src/modules/business-park/routes/building.routes.js:L19` |

#### Request Body
```json
{
  "BuildingName": "Alpha Innovation Hub North Wing",
  "TotalFloors": 6
}
```

#### Validation Rules
Joi schema validated in park.validator.js

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select PUT\n2. Enter {{baseUrl}}/api/buildings/:id\n3. Send with Bearer token.

---
### Endpoint 46: Delete Campus Building

| Property | Details |
|---|---|
| **Module** | 3. Business Park & Campus Facilities |
| **HTTP Method** | `DELETE` |
| **Full URL** | `DELETE http://localhost:5000/api/buildings/:id` |
| **Authentication** | Bearer Token |
| **Authorization** | SUPER_ADMIN, PARK_ADMIN |
| **Path Parameters** | id |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | Soft delete Building |
| **Source Location** | `src/modules/business-park/routes/building.routes.js:L20` |

#### Request Body
```json
None
```

#### Validation Rules
Joi schema validated in park.validator.js

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select DELETE\n2. Enter {{baseUrl}}/api/buildings/:id\n3. Send with Bearer token.

---
### Endpoint 47: List Campus Floors

| Property | Details |
|---|---|
| **Module** | 3. Business Park & Campus Facilities |
| **HTTP Method** | `GET` |
| **Full URL** | `GET http://localhost:5000/api/floors` |
| **Authentication** | Bearer Token |
| **Authorization** | SUPER_ADMIN, PARK_ADMIN |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | SELECT from Floor |
| **Source Location** | `src/modules/business-park/routes/floor.routes.js:L15` |

#### Request Body
```json
None
```

#### Validation Rules
Joi schema validated in park.validator.js

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select GET\n2. Enter {{baseUrl}}/api/floors\n3. Send with Bearer token.

---
### Endpoint 48: Get Floor By ID

| Property | Details |
|---|---|
| **Module** | 3. Business Park & Campus Facilities |
| **HTTP Method** | `GET` |
| **Full URL** | `GET http://localhost:5000/api/floors/:id` |
| **Authentication** | Bearer Token |
| **Authorization** | SUPER_ADMIN, PARK_ADMIN |
| **Path Parameters** | id |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | SELECT from Floor WHERE FloorID = ? |
| **Source Location** | `src/modules/business-park/routes/floor.routes.js:L16` |

#### Request Body
```json
None
```

#### Validation Rules
Joi schema validated in park.validator.js

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select GET\n2. Enter {{baseUrl}}/api/floors/:id\n3. Send with Bearer token.

---
### Endpoint 49: Get Offices on Floor

| Property | Details |
|---|---|
| **Module** | 3. Business Park & Campus Facilities |
| **HTTP Method** | `GET` |
| **Full URL** | `GET http://localhost:5000/api/floors/:floorId/offices` |
| **Authentication** | Bearer Token |
| **Authorization** | SUPER_ADMIN, PARK_ADMIN |
| **Path Parameters** | floorId/offices |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | SELECT from OfficeSpace WHERE FloorID = ? |
| **Source Location** | `src/modules/business-park/routes/floor.routes.js:L17` |

#### Request Body
```json
None
```

#### Validation Rules
Joi schema validated in park.validator.js

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select GET\n2. Enter {{baseUrl}}/api/floors/:floorId/offices\n3. Send with Bearer token.

---
### Endpoint 50: Create Floor

| Property | Details |
|---|---|
| **Module** | 3. Business Park & Campus Facilities |
| **HTTP Method** | `POST` |
| **Full URL** | `POST http://localhost:5000/api/floors` |
| **Authentication** | Bearer Token |
| **Authorization** | SUPER_ADMIN, PARK_ADMIN |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | INSERT INTO Floor |
| **Source Location** | `src/modules/business-park/routes/floor.routes.js:L18` |

#### Request Body
```json
{
  "BuildingID": 1,
  "FloorNumber": 2,
  "FloorCode": "FL-02",
  "FloorName": "Second Floor Tech Wing",
  "TotalOfficeSpaces": 12,
  "IsActive": 1
}
```

#### Validation Rules
Joi schema validated in park.validator.js

#### Expected Success Response (201 Created)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select POST\n2. Enter {{baseUrl}}/api/floors\n3. Send with Bearer token.

---
### Endpoint 51: Update Floor

| Property | Details |
|---|---|
| **Module** | 3. Business Park & Campus Facilities |
| **HTTP Method** | `PUT` |
| **Full URL** | `PUT http://localhost:5000/api/floors/:id` |
| **Authentication** | Bearer Token |
| **Authorization** | SUPER_ADMIN, PARK_ADMIN |
| **Path Parameters** | id |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | UPDATE Floor |
| **Source Location** | `src/modules/business-park/routes/floor.routes.js:L19` |

#### Request Body
```json
{
  "FloorName": "Second Floor Extended Wing"
}
```

#### Validation Rules
Joi schema validated in park.validator.js

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select PUT\n2. Enter {{baseUrl}}/api/floors/:id\n3. Send with Bearer token.

---
### Endpoint 52: Delete Floor

| Property | Details |
|---|---|
| **Module** | 3. Business Park & Campus Facilities |
| **HTTP Method** | `DELETE` |
| **Full URL** | `DELETE http://localhost:5000/api/floors/:id` |
| **Authentication** | Bearer Token |
| **Authorization** | SUPER_ADMIN, PARK_ADMIN |
| **Path Parameters** | id |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | Soft delete Floor |
| **Source Location** | `src/modules/business-park/routes/floor.routes.js:L20` |

#### Request Body
```json
None
```

#### Validation Rules
Joi schema validated in park.validator.js

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select DELETE\n2. Enter {{baseUrl}}/api/floors/:id\n3. Send with Bearer token.

---
### Endpoint 53: List Office Suites

| Property | Details |
|---|---|
| **Module** | 3. Business Park & Campus Facilities |
| **HTTP Method** | `GET` |
| **Full URL** | `GET http://localhost:5000/api/offices` |
| **Authentication** | Bearer Token |
| **Authorization** | SUPER_ADMIN, PARK_ADMIN |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | SELECT from OfficeSpace |
| **Source Location** | `src/modules/business-park/routes/office.routes.js:L14` |

#### Request Body
```json
None
```

#### Validation Rules
Joi schema validated in park.validator.js

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select GET\n2. Enter {{baseUrl}}/api/offices\n3. Send with Bearer token.

---
### Endpoint 54: Get Office By ID

| Property | Details |
|---|---|
| **Module** | 3. Business Park & Campus Facilities |
| **HTTP Method** | `GET` |
| **Full URL** | `GET http://localhost:5000/api/offices/:id` |
| **Authentication** | Bearer Token |
| **Authorization** | SUPER_ADMIN, PARK_ADMIN |
| **Path Parameters** | id |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | SELECT from OfficeSpace WHERE OfficeSpaceID = ? |
| **Source Location** | `src/modules/business-park/routes/office.routes.js:L15` |

#### Request Body
```json
None
```

#### Validation Rules
Joi schema validated in park.validator.js

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select GET\n2. Enter {{baseUrl}}/api/offices/:id\n3. Send with Bearer token.

---
### Endpoint 55: Create Office Suite

| Property | Details |
|---|---|
| **Module** | 3. Business Park & Campus Facilities |
| **HTTP Method** | `POST` |
| **Full URL** | `POST http://localhost:5000/api/offices` |
| **Authentication** | Bearer Token |
| **Authorization** | SUPER_ADMIN, PARK_ADMIN |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | INSERT INTO OfficeSpace |
| **Source Location** | `src/modules/business-park/routes/office.routes.js:L16` |

#### Request Body
```json
{
  "FloorID": 1,
  "OfficeTypeID": 1,
  "OfficeNumber": "OFF-201",
  "OfficeName": "Software Engineering Lab",
  "SquareMeters": 95.0,
  "MaxOccupancy": 12,
  "MonthlyRentAmount": 48000.0,
  "AvailabilityStatus": "VACANT",
  "IsActive": 1
}
```

#### Validation Rules
Joi schema validated in park.validator.js

#### Expected Success Response (201 Created)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select POST\n2. Enter {{baseUrl}}/api/offices\n3. Send with Bearer token.

---
### Endpoint 56: Update Office Status

| Property | Details |
|---|---|
| **Module** | 4. Tenant Organizations & Space Allocations |
| **HTTP Method** | `PATCH` |
| **Full URL** | `PATCH http://localhost:5000/api/offices/:id/status` |
| **Authentication** | Bearer Token |
| **Authorization** | Authenticated / PARK_ADMIN for writes |
| **Path Parameters** | id/status |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | Tenant isolation and lifecycle updates |
| **Source Location** | `src/modules/business-park/routes/office.routes.js:L18` |

#### Request Body
```json
{
  "status": "OCCUPIED"
}
```

#### Validation Rules
Joi schema validated in tenant.validator.js

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select PATCH\n2. Enter {{baseUrl}}/api/offices/:id/status\n3. Send with Bearer token.

---
### Endpoint 57: Delete Office Suite

| Property | Details |
|---|---|
| **Module** | 4. Tenant Organizations & Space Allocations |
| **HTTP Method** | `DELETE` |
| **Full URL** | `DELETE http://localhost:5000/api/offices/:id` |
| **Authentication** | Bearer Token |
| **Authorization** | Authenticated / PARK_ADMIN for writes |
| **Path Parameters** | id |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | Tenant isolation and lifecycle updates |
| **Source Location** | `src/modules/business-park/routes/office.routes.js:L19` |

#### Request Body
```json
None
```

#### Validation Rules
Joi schema validated in tenant.validator.js

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select DELETE\n2. Enter {{baseUrl}}/api/offices/:id\n3. Send with Bearer token.

---
### Endpoint 58: List Campus Locations

| Property | Details |
|---|---|
| **Module** | 4. Tenant Organizations & Space Allocations |
| **HTTP Method** | `GET` |
| **Full URL** | `GET http://localhost:5000/api/locations` |
| **Authentication** | Bearer Token |
| **Authorization** | Authenticated / PARK_ADMIN for writes |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | Tenant isolation and lifecycle updates |
| **Source Location** | `src/modules/business-park/routes/location.routes.js:L14` |

#### Request Body
```json
None
```

#### Validation Rules
Joi schema validated in tenant.validator.js

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select GET\n2. Enter {{baseUrl}}/api/locations\n3. Send with Bearer token.

---
### Endpoint 59: List Facility Zones

| Property | Details |
|---|---|
| **Module** | 4. Tenant Organizations & Space Allocations |
| **HTTP Method** | `GET` |
| **Full URL** | `GET http://localhost:5000/api/facility-zones` |
| **Authentication** | Bearer Token |
| **Authorization** | Authenticated / PARK_ADMIN for writes |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | Tenant isolation and lifecycle updates |
| **Source Location** | `src/modules/business-park/routes/facility-zone.routes.js:L15` |

#### Request Body
```json
None
```

#### Validation Rules
Joi schema validated in tenant.validator.js

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select GET\n2. Enter {{baseUrl}}/api/facility-zones\n3. Send with Bearer token.

---
### Endpoint 60: Get Floor Plan By Floor ID

| Property | Details |
|---|---|
| **Module** | 4. Tenant Organizations & Space Allocations |
| **HTTP Method** | `GET` |
| **Full URL** | `GET http://localhost:5000/api/floor-plans/floor/:floorId` |
| **Authentication** | Bearer Token |
| **Authorization** | Authenticated / PARK_ADMIN for writes |
| **Path Parameters** | floorId |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | Tenant isolation and lifecycle updates |
| **Source Location** | `src/modules/business-park/routes/floor-plan.routes.js:L14` |

#### Request Body
```json
None
```

#### Validation Rules
Joi schema validated in tenant.validator.js

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select GET\n2. Enter {{baseUrl}}/api/floor-plans/floor/:floorId\n3. Send with Bearer token.

---
### Endpoint 61: List Commercial Tenants

| Property | Details |
|---|---|
| **Module** | 4. Tenant Organizations & Space Allocations |
| **HTTP Method** | `GET` |
| **Full URL** | `GET http://localhost:5000/api/tenants` |
| **Authentication** | Bearer Token |
| **Authorization** | Authenticated / PARK_ADMIN for writes |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | Tenant isolation and lifecycle updates |
| **Source Location** | `src/modules/tenant/routes/tenant.routes.js:L14` |

#### Request Body
```json
None
```

#### Validation Rules
Joi schema validated in tenant.validator.js

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select GET\n2. Enter {{baseUrl}}/api/tenants\n3. Send with Bearer token.

---
### Endpoint 62: Get Tenant Dashboard Metrics

| Property | Details |
|---|---|
| **Module** | 4. Tenant Organizations & Space Allocations |
| **HTTP Method** | `GET` |
| **Full URL** | `GET http://localhost:5000/api/tenants/metrics` |
| **Authentication** | Bearer Token |
| **Authorization** | Authenticated / PARK_ADMIN for writes |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | Tenant isolation and lifecycle updates |
| **Source Location** | `src/modules/tenant/routes/tenant.routes.js:L15` |

#### Request Body
```json
None
```

#### Validation Rules
Joi schema validated in tenant.validator.js

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select GET\n2. Enter {{baseUrl}}/api/tenants/metrics\n3. Send with Bearer token.

---
### Endpoint 63: Get Tenant By ID

| Property | Details |
|---|---|
| **Module** | 4. Tenant Organizations & Space Allocations |
| **HTTP Method** | `GET` |
| **Full URL** | `GET http://localhost:5000/api/tenants/:id` |
| **Authentication** | Bearer Token |
| **Authorization** | Authenticated / PARK_ADMIN for writes |
| **Path Parameters** | id |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | Tenant isolation and lifecycle updates |
| **Source Location** | `src/modules/tenant/routes/tenant.routes.js:L16` |

#### Request Body
```json
None
```

#### Validation Rules
Joi schema validated in tenant.validator.js

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select GET\n2. Enter {{baseUrl}}/api/tenants/:id\n3. Send with Bearer token.

---
### Endpoint 64: Create Tenant Organization

| Property | Details |
|---|---|
| **Module** | 4. Tenant Organizations & Space Allocations |
| **HTTP Method** | `POST` |
| **Full URL** | `POST http://localhost:5000/api/tenants` |
| **Authentication** | Bearer Token |
| **Authorization** | Authenticated / PARK_ADMIN for writes |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | Tenant isolation and lifecycle updates |
| **Source Location** | `src/modules/tenant/routes/tenant.routes.js:L17` |

#### Request Body
```json
{
  "BusinessParkID": 1,
  "TenantTypeID": 1,
  "TenantCode": "TNT-INNOVATE-01",
  "CompanyName": "Innovate Enterprise Solutions PLC",
  "RegistrationNumber": "REG-ETH-2026-99",
  "TaxIdentificationNo": "TIN-0099887766",
  "Status": "ACTIVE",
  "Website": "https://innovatetech.et",
  "IsActive": 1
}
```

#### Validation Rules
Joi schema validated in tenant.validator.js

#### Expected Success Response (201 Created)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select POST\n2. Enter {{baseUrl}}/api/tenants\n3. Send with Bearer token.

---
### Endpoint 65: Update Tenant Status

| Property | Details |
|---|---|
| **Module** | 4. Tenant Organizations & Space Allocations |
| **HTTP Method** | `PATCH` |
| **Full URL** | `PATCH http://localhost:5000/api/tenants/:id/status` |
| **Authentication** | Bearer Token |
| **Authorization** | Authenticated / PARK_ADMIN for writes |
| **Path Parameters** | id/status |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | Tenant isolation and lifecycle updates |
| **Source Location** | `src/modules/tenant/routes/tenant.routes.js:L19` |

#### Request Body
```json
{
  "Status": "ACTIVE"
}
```

#### Validation Rules
Joi schema validated in tenant.validator.js

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select PATCH\n2. Enter {{baseUrl}}/api/tenants/:id/status\n3. Send with Bearer token.

---
### Endpoint 66: List Sub-Tenants

| Property | Details |
|---|---|
| **Module** | 4. Tenant Organizations & Space Allocations |
| **HTTP Method** | `GET` |
| **Full URL** | `GET http://localhost:5000/api/sub-tenants` |
| **Authentication** | Bearer Token |
| **Authorization** | Authenticated / PARK_ADMIN for writes |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | Tenant isolation and lifecycle updates |
| **Source Location** | `src/modules/tenant/routes/sub-tenant.routes.js:L14` |

#### Request Body
```json
None
```

#### Validation Rules
Joi schema validated in tenant.validator.js

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select GET\n2. Enter {{baseUrl}}/api/sub-tenants\n3. Send with Bearer token.

---
### Endpoint 67: Create Sub-Tenant

| Property | Details |
|---|---|
| **Module** | 4. Tenant Organizations & Space Allocations |
| **HTTP Method** | `POST` |
| **Full URL** | `POST http://localhost:5000/api/sub-tenants` |
| **Authentication** | Bearer Token |
| **Authorization** | Authenticated / PARK_ADMIN for writes |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | Tenant isolation and lifecycle updates |
| **Source Location** | `src/modules/tenant/routes/sub-tenant.routes.js:L16` |

#### Request Body
```json
{
  "ParentTenantID": 1,
  "CompanyName": "Apex Cloud Subsidiary",
  "RelationshipType": "SUBSIDIARY",
  "Status": "ACTIVE",
  "IsActive": 1
}
```

#### Validation Rules
Joi schema validated in tenant.validator.js

#### Expected Success Response (201 Created)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select POST\n2. Enter {{baseUrl}}/api/sub-tenants\n3. Send with Bearer token.

---
### Endpoint 68: List Tenant Contacts

| Property | Details |
|---|---|
| **Module** | 4. Tenant Organizations & Space Allocations |
| **HTTP Method** | `GET` |
| **Full URL** | `GET http://localhost:5000/api/tenant-contacts` |
| **Authentication** | Bearer Token |
| **Authorization** | Authenticated / PARK_ADMIN for writes |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | Tenant isolation and lifecycle updates |
| **Source Location** | `src/modules/tenant/routes/tenant-contact.routes.js:L14` |

#### Request Body
```json
None
```

#### Validation Rules
Joi schema validated in tenant.validator.js

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select GET\n2. Enter {{baseUrl}}/api/tenant-contacts\n3. Send with Bearer token.

---
### Endpoint 69: Create Tenant Contact

| Property | Details |
|---|---|
| **Module** | 4. Tenant Organizations & Space Allocations |
| **HTTP Method** | `POST` |
| **Full URL** | `POST http://localhost:5000/api/tenant-contacts` |
| **Authentication** | Bearer Token |
| **Authorization** | Authenticated / PARK_ADMIN for writes |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | Tenant isolation and lifecycle updates |
| **Source Location** | `src/modules/tenant/routes/tenant-contact.routes.js:L16` |

#### Request Body
```json
{
  "TenantID": 1,
  "ContactType": "EMAIL",
  "Label": "Operations Contact",
  "ContactValue": "ops@tenantcorp.et",
  "IsPrimary": 1,
  "IsActive": 1
}
```

#### Validation Rules
Joi schema validated in tenant.validator.js

#### Expected Success Response (201 Created)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select POST\n2. Enter {{baseUrl}}/api/tenant-contacts\n3. Send with Bearer token.

---
### Endpoint 70: List Tenant Addresses

| Property | Details |
|---|---|
| **Module** | 4. Tenant Organizations & Space Allocations |
| **HTTP Method** | `GET` |
| **Full URL** | `GET http://localhost:5000/api/tenant-addresses` |
| **Authentication** | Bearer Token |
| **Authorization** | Authenticated / PARK_ADMIN for writes |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | Tenant isolation and lifecycle updates |
| **Source Location** | `src/modules/tenant/routes/tenant-address.routes.js:L14` |

#### Request Body
```json
None
```

#### Validation Rules
Joi schema validated in tenant.validator.js

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select GET\n2. Enter {{baseUrl}}/api/tenant-addresses\n3. Send with Bearer token.

---
### Endpoint 71: Create Tenant Address

| Property | Details |
|---|---|
| **Module** | 4. Tenant Organizations & Space Allocations |
| **HTTP Method** | `POST` |
| **Full URL** | `POST http://localhost:5000/api/tenant-addresses` |
| **Authentication** | Bearer Token |
| **Authorization** | Authenticated / PARK_ADMIN for writes |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | Tenant isolation and lifecycle updates |
| **Source Location** | `src/modules/tenant/routes/tenant-address.routes.js:L16` |

#### Request Body
```json
{
  "TenantID": 1,
  "AddressType": "LEGAL",
  "Country": "Ethiopia",
  "City": "Addis Ababa",
  "AddressLine1": "IT Park Commercial Complex",
  "IsActive": 1
}
```

#### Validation Rules
Joi schema validated in tenant.validator.js

#### Expected Success Response (201 Created)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select POST\n2. Enter {{baseUrl}}/api/tenant-addresses\n3. Send with Bearer token.

---
### Endpoint 72: List Commercial Leases

| Property | Details |
|---|---|
| **Module** | 4. Tenant Organizations & Space Allocations |
| **HTTP Method** | `GET` |
| **Full URL** | `GET http://localhost:5000/api/leases` |
| **Authentication** | Bearer Token |
| **Authorization** | Authenticated / PARK_ADMIN for writes |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | Tenant isolation and lifecycle updates |
| **Source Location** | `src/modules/tenant/routes/lease.routes.js:L15` |

#### Request Body
```json
None
```

#### Validation Rules
Joi schema validated in tenant.validator.js

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select GET\n2. Enter {{baseUrl}}/api/leases\n3. Send with Bearer token.

---
### Endpoint 73: Get Leases Expiring Soon

| Property | Details |
|---|---|
| **Module** | 4. Tenant Organizations & Space Allocations |
| **HTTP Method** | `GET` |
| **Full URL** | `GET http://localhost:5000/api/leases/expiring-soon` |
| **Authentication** | Bearer Token |
| **Authorization** | Authenticated / PARK_ADMIN for writes |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | Tenant isolation and lifecycle updates |
| **Source Location** | `src/modules/tenant/routes/lease.routes.js:L16` |

#### Request Body
```json
None
```

#### Validation Rules
Joi schema validated in tenant.validator.js

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select GET\n2. Enter {{baseUrl}}/api/leases/expiring-soon\n3. Send with Bearer token.

---
### Endpoint 74: Create Lease Agreement

| Property | Details |
|---|---|
| **Module** | 4. Tenant Organizations & Space Allocations |
| **HTTP Method** | `POST` |
| **Full URL** | `POST http://localhost:5000/api/leases` |
| **Authentication** | Bearer Token |
| **Authorization** | Authenticated / PARK_ADMIN for writes |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | Tenant isolation and lifecycle updates |
| **Source Location** | `src/modules/tenant/routes/lease.routes.js:L20` |

#### Request Body
```json
{
  "TenantID": 1,
  "AgreementNumber": "LSE-2026-001",
  "StartDate": "2026-01-01",
  "EndDate": "2027-12-31",
  "ExecutionDate": "2025-12-20",
  "MonthlyRentAmount": 55000.0,
  "SecurityDepositAmount": 165000.0,
  "CurrencyCode": "ETB",
  "Status": "ACTIVE",
  "IsActive": 1
}
```

#### Validation Rules
Joi schema validated in tenant.validator.js

#### Expected Success Response (201 Created)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select POST\n2. Enter {{baseUrl}}/api/leases\n3. Send with Bearer token.

---
### Endpoint 75: List Office Allocations

| Property | Details |
|---|---|
| **Module** | 4. Tenant Organizations & Space Allocations |
| **HTTP Method** | `GET` |
| **Full URL** | `GET http://localhost:5000/api/office-allocations` |
| **Authentication** | Bearer Token |
| **Authorization** | Authenticated / PARK_ADMIN for writes |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | Tenant isolation and lifecycle updates |
| **Source Location** | `src/modules/tenant/routes/office-allocation.routes.js:L15` |

#### Request Body
```json
None
```

#### Validation Rules
Joi schema validated in tenant.validator.js

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select GET\n2. Enter {{baseUrl}}/api/office-allocations\n3. Send with Bearer token.

---
### Endpoint 76: Allocate Office Space

| Property | Details |
|---|---|
| **Module** | 4. Tenant Organizations & Space Allocations |
| **HTTP Method** | `POST` |
| **Full URL** | `POST http://localhost:5000/api/office-allocations` |
| **Authentication** | Bearer Token |
| **Authorization** | Authenticated / PARK_ADMIN for writes |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | Tenant isolation and lifecycle updates |
| **Source Location** | `src/modules/tenant/routes/office-allocation.routes.js:L20` |

#### Request Body
```json
{
  "TenantID": 1,
  "AllocationScope": "OFFICE",
  "OfficeSpaceID": 1,
  "AllocatedDate": "2026-01-01",
  "IsActive": 1
}
```

#### Validation Rules
Joi schema validated in tenant.validator.js

#### Expected Success Response (201 Created)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select POST\n2. Enter {{baseUrl}}/api/office-allocations\n3. Send with Bearer token.

---
### Endpoint 77: Release Allocated Office

| Property | Details |
|---|---|
| **Module** | 4. Tenant Organizations & Space Allocations |
| **HTTP Method** | `PATCH` |
| **Full URL** | `PATCH http://localhost:5000/api/office-allocations/:id/release` |
| **Authentication** | Bearer Token |
| **Authorization** | Authenticated / PARK_ADMIN for writes |
| **Path Parameters** | id/release |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | Tenant isolation and lifecycle updates |
| **Source Location** | `src/modules/tenant/routes/office-allocation.routes.js:L21` |

#### Request Body
```json
{
  "Remarks": "Office released following space reallocation"
}
```

#### Validation Rules
Joi schema validated in tenant.validator.js

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select PATCH\n2. Enter {{baseUrl}}/api/office-allocations/:id/release\n3. Send with Bearer token.

---
### Endpoint 78: List Departments

| Property | Details |
|---|---|
| **Module** | 5. Organizational Structure & Staff |
| **HTTP Method** | `GET` |
| **Full URL** | `GET http://localhost:5000/api/departments` |
| **Authentication** | Bearer Token |
| **Authorization** | Authenticated / Dept Manager / Admin |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | Organizational structural mapping |
| **Source Location** | `src/modules/organization/routes/department.routes.js:L14` |

#### Request Body
```json
None
```

#### Validation Rules
Joi schema validated in organization.validator.js

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select GET\n2. Enter {{baseUrl}}/api/departments\n3. Send with Bearer token.

---
### Endpoint 79: Create Department

| Property | Details |
|---|---|
| **Module** | 5. Organizational Structure & Staff |
| **HTTP Method** | `POST` |
| **Full URL** | `POST http://localhost:5000/api/departments` |
| **Authentication** | Bearer Token |
| **Authorization** | Authenticated / Dept Manager / Admin |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | Organizational structural mapping |
| **Source Location** | `src/modules/organization/routes/department.routes.js:L16` |

#### Request Body
```json
{
  "DepartmentCode": "DEPT-NET",
  "DepartmentName": "Network & Telecom Services",
  "ManagerUserID": 1,
  "IsActive": 1
}
```

#### Validation Rules
Joi schema validated in organization.validator.js

#### Expected Success Response (201 Created)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select POST\n2. Enter {{baseUrl}}/api/departments\n3. Send with Bearer token.

---
### Endpoint 80: List Teams

| Property | Details |
|---|---|
| **Module** | 5. Organizational Structure & Staff |
| **HTTP Method** | `GET` |
| **Full URL** | `GET http://localhost:5000/api/teams` |
| **Authentication** | Bearer Token |
| **Authorization** | Authenticated / Dept Manager / Admin |
| **Path Parameters** | None |
| **Query Parameters** | None |
| **Headers** | `Authorization: Bearer {{token}}, Content-Type: application/json` |
| **Database Effects** | Organizational structural mapping |
| **Source Location** | `src/modules/organization/routes/team.routes.js:L17` |

#### Request Body
```json
None
```

#### Validation Rules
Joi schema validated in organization.validator.js

#### Expected Success Response (200 OK)
```json
{ "status": "success", "data": { ... } }
```

#### Error Responses
• 400 Bad Request\n• 401 Unauthorized\n• 403 Forbidden

#### Postman Testing Instructions
1. Select GET\n2. Enter {{baseUrl}}/api/teams\n3. Send with Bearer token.

---
