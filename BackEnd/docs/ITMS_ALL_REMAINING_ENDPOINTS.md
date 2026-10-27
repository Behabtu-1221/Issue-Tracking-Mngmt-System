# ITMS Backend API — All Remaining Endpoints Testing Guide & Inventory

**Base URL:** `http://localhost:5000`  
**Authentication Standard:** `Authorization: Bearer {{token}}` (JWT required on all endpoints, except public share routes)  
**Total Remaining Endpoints Documented:** 188 endpoints  
**Coverage:**
1. **Module 5 Remainder:** Organizational Teams, Positions, Employee Assignments, Reporting Hierarchies, Cost Centers & Budgets (38 Endpoints)
2. **Module 11:** Communication & Messaging (24 Endpoints)
3. **Module 12:** Notifications & Alerts (20 Endpoints)
4. **Module 13:** File & Document Management (16 Endpoints)
5. **Module 14:** Reporting & Analytics (19 Endpoints)
6. **Module 15:** Configuration Management (71 Endpoints)

---

## Postman Global Setup & Pre-requisites

### 1. Environment Variables
Set the following Postman Environment variables:
```json
{
  "baseUrl": "http://localhost:5000",
  "token": "YOUR_JWT_ACCESS_TOKEN",
  "superadmin_user": "superadmin",
  "superadmin_pass": "Admin@123",
  "parkId": "1",
  "tenantId": "1",
  "departmentId": "1",
  "teamId": "1",
  "positionId": "1",
  "requestId": "1",
  "conversationId": "1"
}
```

### 2. Global Request Headers
```http
Authorization: Bearer {{token}}
Content-Type: application/json
Accept: application/json
```
*(For file upload endpoints in Module 13, omit `Content-Type` header so Postman automatically generates multipart boundary).*

---

# MODULE 5 (REMAINDER): Teams, Positions, Employee Assignments & Financials

Base Paths:
- `/api/departments`
- `/api/teams`
- `/api/positions`
- `/api/employee-assignments`
- `/api/reporting-hierarchies`
- `/api/financials`

### Endpoints (Method Left, Full URL Right)
```text
GET      http://localhost:5000/api/departments/:id/locations
POST     http://localhost:5000/api/departments/:id/locations
DELETE   http://localhost:5000/api/departments/locations/:locId
GET      http://localhost:5000/api/teams/eligible-technicians
GET      http://localhost:5000/api/teams/workload-summary
GET      http://localhost:5000/api/teams
GET      http://localhost:5000/api/teams/:id
POST     http://localhost:5000/api/teams
PUT      http://localhost:5000/api/teams/:id
DELETE   http://localhost:5000/api/teams/:id
GET      http://localhost:5000/api/teams/:id/members
POST     http://localhost:5000/api/teams/:id/members
DELETE   http://localhost:5000/api/teams/:id/members/:userId
GET      http://localhost:5000/api/positions
GET      http://localhost:5000/api/positions/:id
POST     http://localhost:5000/api/positions
PUT      http://localhost:5000/api/positions/:id
DELETE   http://localhost:5000/api/positions/:id
GET      http://localhost:5000/api/employee-assignments
GET      http://localhost:5000/api/employee-assignments/:id
POST     http://localhost:5000/api/employee-assignments
PUT      http://localhost:5000/api/employee-assignments/:id
DELETE   http://localhost:5000/api/employee-assignments/:id
GET      http://localhost:5000/api/reporting-hierarchies
GET      http://localhost:5000/api/reporting-hierarchies/:id
POST     http://localhost:5000/api/reporting-hierarchies
PUT      http://localhost:5000/api/reporting-hierarchies/:id
DELETE   http://localhost:5000/api/reporting-hierarchies/:id
GET      http://localhost:5000/api/financials/cost-centers
GET      http://localhost:5000/api/financials/cost-centers/:id
POST     http://localhost:5000/api/financials/cost-centers
PUT      http://localhost:5000/api/financials/cost-centers/:id
DELETE   http://localhost:5000/api/financials/cost-centers/:id
GET      http://localhost:5000/api/financials/budgets
GET      http://localhost:5000/api/financials/budgets/:id
POST     http://localhost:5000/api/financials/budgets
PUT      http://localhost:5000/api/financials/budgets/:id
DELETE   http://localhost:5000/api/financials/budgets/:id
```

### Postman Testing Payloads

#### Create Team (`POST /api/teams`)
```json
{
  "DepartmentID": 1,
  "TeamCode": "HVAC-TM-01",
  "TeamName": "HVAC Rapid Response Team",
  "TeamLeadUserID": 1,
  "Description": "Dedicated HVAC triage and maintenance",
  "Status": "ACTIVE"
}
```

#### Add Team Member (`POST /api/teams/:id/members`)
```json
{
  "UserID": 2,
  "RoleInTeam": "TECHNICIAN"
}
```

#### Create Position (`POST /api/positions`)
```json
{
  "DepartmentID": 1,
  "PositionCode": "SR-TECH-01",
  "PositionTitle": "Senior Facilities Specialist",
  "JobDescription": "Lead technical responder for park operations",
  "Status": "ACTIVE"
}
```

#### Create Employee Assignment (`POST /api/employee-assignments`)
```json
{
  "UserID": 2,
  "DepartmentID": 1,
  "PositionID": 1,
  "IsPrimary": true,
  "StartDate": "2026-01-01"
}
```

#### Create Cost Center (`POST /api/financials/cost-centers`)
```json
{
  "CostCenterCode": "CC-FAC-01",
  "CostCenterName": "Facilities Operations Cost Center",
  "DepartmentID": 1,
  "Status": "ACTIVE"
}
```

---

# MODULE 11: Communication & Messaging

Base Path: `/api/communication`

### Endpoints (Method Left, Full URL Right)
```text
GET      http://localhost:5000/api/communication/overview
GET      http://localhost:5000/api/communication/conversations
GET      http://localhost:5000/api/communication/conversations/request/:issueRequestId
POST     http://localhost:5000/api/communication/conversations/request/:issueRequestId
GET      http://localhost:5000/api/communication/conversations/:conversationId/participants
POST     http://localhost:5000/api/communication/conversations/:conversationId/participants
GET      http://localhost:5000/api/communication/conversations/:conversationId/messages
POST     http://localhost:5000/api/communication/conversations/:conversationId/messages
POST     http://localhost:5000/api/communication/requests/:issueRequestId/messages
PUT      http://localhost:5000/api/communication/conversations/:conversationId/read
GET      http://localhost:5000/api/communication/notes/:requestId
POST     http://localhost:5000/api/communication/notes/:requestId
DELETE   http://localhost:5000/api/communication/notes/:noteId
GET      http://localhost:5000/api/communication/comments/:issueRequestId
POST     http://localhost:5000/api/communication/comments
GET      http://localhost:5000/api/communication/quick-replies
POST     http://localhost:5000/api/communication/quick-replies
PUT      http://localhost:5000/api/communication/quick-replies/:replyId
DELETE   http://localhost:5000/api/communication/quick-replies/:replyId
GET      http://localhost:5000/api/communication/templates
POST     http://localhost:5000/api/communication/templates
PUT      http://localhost:5000/api/communication/templates/:templateId
DELETE   http://localhost:5000/api/communication/templates/:templateId
POST     http://localhost:5000/api/communication/templates/:templateId/render
```

### Postman Testing Payloads

#### Send Message in Conversation (`POST /api/communication/conversations/:conversationId/messages`)
```json
{
  "messageText": "Hello, technician is on-site at Building A to inspect the cooling unit.",
  "messageType": "TEXT"
}
```

#### Add Internal Note (`POST /api/communication/notes/:requestId`)
```json
{
  "noteText": "Customer called back to verify technician dispatch time.",
  "isPrivate": true
}
```

#### Create Quick Reply (`POST /api/communication/quick-replies`)
```json
{
  "title": "Awaiting Tenant Access",
  "body": "Our technician arrived but requires tenant suite access. Please reply to coordinate entry.",
  "category": "DISPATCH"
}
```

---

# MODULE 12: Notifications & Alerts

Base Path: `/api/notifications`

### Endpoints (Method Left, Full URL Right)
```text
GET      http://localhost:5000/api/notifications
GET      http://localhost:5000/api/notifications/unread-count
GET      http://localhost:5000/api/notifications/summary
GET      http://localhost:5000/api/notifications/preferences
PUT      http://localhost:5000/api/notifications/preferences
PUT      http://localhost:5000/api/notifications/read-all
GET      http://localhost:5000/api/notifications/templates
POST     http://localhost:5000/api/notifications/templates
PUT      http://localhost:5000/api/notifications/templates/:id
DELETE   http://localhost:5000/api/notifications/templates/:id
GET      http://localhost:5000/api/notifications/rules
POST     http://localhost:5000/api/notifications/rules
PUT      http://localhost:5000/api/notifications/rules/:id
DELETE   http://localhost:5000/api/notifications/rules/:id
GET      http://localhost:5000/api/notifications/logs
POST     http://localhost:5000/api/notifications/dispatch
POST     http://localhost:5000/api/notifications/bulk
GET      http://localhost:5000/api/notifications/:id
PUT      http://localhost:5000/api/notifications/:id/read
DELETE   http://localhost:5000/api/notifications/:id
```

### Postman Testing Payloads

#### Dispatch Immediate Alert (`POST /api/notifications/dispatch`)
```json
{
  "userId": 1,
  "templateCode": "ISSUE_ASSIGNED",
  "channels": ["IN_APP", "EMAIL"],
  "payload": {
    "issueNumber": "ISS-2026-0001",
    "priority": "HIGH"
  }
}
```

#### Update User Preferences (`PUT /api/notifications/preferences`)
```json
{
  "emailEnabled": true,
  "smsEnabled": false,
  "inAppEnabled": true,
  "digestFrequency": "DAILY"
}
```

---

# MODULE 13: File & Document Management

Base Path: `/api/documents`

### Endpoints (Method Left, Full URL Right)
```text
POST     http://localhost:5000/api/documents/upload
POST     http://localhost:5000/api/documents/upload-multiple
GET      http://localhost:5000/api/documents/entity/:entityType/:entityId
GET      http://localhost:5000/api/documents/entity/:entityType/:entityId/attachments
GET      http://localhost:5000/api/documents/request/:requestId
GET      http://localhost:5000/api/documents/categories
GET      http://localhost:5000/api/documents/stats
GET      http://localhost:5000/api/documents/share/:shareToken
GET      http://localhost:5000/api/documents/:id
GET      http://localhost:5000/api/documents/:id/download
GET      http://localhost:5000/api/documents/:id/view
GET      http://localhost:5000/api/documents/:id/versions
PUT      http://localhost:5000/api/documents/:id
DELETE   http://localhost:5000/api/documents/:id
POST     http://localhost:5000/api/documents/:id/share
DELETE   http://localhost:5000/api/documents/:id/share
```

### Postman Testing Instructions for Uploads

#### Upload Single File (`POST /api/documents/upload`)
- **Body:** `form-data`
- **Fields:**
  - `file`: Select File (e.g. `report.pdf` or `screenshot.png`)
  - `entityType`: `ISSUE_REQUEST` (Text)
  - `entityId`: `1` (Text)
  - `category`: `EVIDENCE` (Text)
  - `isPublic`: `false` (Text)

#### Generate Document Share Link (`POST /api/documents/:id/share`)
```json
{
  "expiresInHours": 48
}
```
*Returns public share token accessible via `GET /api/documents/share/:shareToken` without Bearer token.*

---

# MODULE 14: Reporting & Analytics

Base Path: `/api/reports`

### Endpoints (Method Left, Full URL Right)
```text
GET      http://localhost:5000/api/reports/sla-compliance
GET      http://localhost:5000/api/reports/technician-performance
GET      http://localhost:5000/api/reports/resolution-efficiency
GET      http://localhost:5000/api/reports/reopen-rate
GET      http://localhost:5000/api/reports/issue-volume
GET      http://localhost:5000/api/reports/first-contact-resolution
GET      http://localhost:5000/api/reports/mttr
GET      http://localhost:5000/api/reports/park-summary
GET      http://localhost:5000/api/reports/tenant-summary
GET      http://localhost:5000/api/reports/executive-kpi
GET      http://localhost:5000/api/reports/export/csv
GET      http://localhost:5000/api/reports/export/pdf
GET      http://localhost:5000/api/reports/scheduled
POST     http://localhost:5000/api/reports/scheduled
GET      http://localhost:5000/api/reports/scheduled/:id
PUT      http://localhost:5000/api/reports/scheduled/:id
DELETE   http://localhost:5000/api/reports/scheduled/:id
POST     http://localhost:5000/api/reports/scheduled/:id/run
GET      http://localhost:5000/api/reports/history
```

### Postman Testing Query Parameters & Payloads

#### Date Range Queries on Analytics
- `GET http://localhost:5000/api/reports/sla-compliance?startDate=2026-01-01&endDate=2026-12-31&parkId=1`
- `GET http://localhost:5000/api/reports/executive-kpi?period=MONTHLY`

#### Schedule Automated Report (`POST /api/reports/scheduled`)
```json
{
  "reportType": "SLA_COMPLIANCE",
  "frequency": "WEEKLY",
  "recipients": ["admin@itms.local"],
  "format": "PDF",
  "filters": {
    "parkId": 1
  }
}
```

---

# MODULE 15: Configuration Management

Base Path: `/api/configuration`

### Endpoints (Method Left, Full URL Right)
```text
GET      http://localhost:5000/api/configuration/bootstrap
GET      http://localhost:5000/api/configuration/system-settings
GET      http://localhost:5000/api/configuration/system-settings/category/:category
GET      http://localhost:5000/api/configuration/system-settings/key/:key
GET      http://localhost:5000/api/configuration/system-settings/:id
POST     http://localhost:5000/api/configuration/system-settings
PUT      http://localhost:5000/api/configuration/system-settings/bulk
PUT      http://localhost:5000/api/configuration/system-settings/:id
DELETE   http://localhost:5000/api/configuration/system-settings/:id
GET      http://localhost:5000/api/configuration/business-rules
GET      http://localhost:5000/api/configuration/business-rules/active
GET      http://localhost:5000/api/configuration/business-rules/event/:eventType
GET      http://localhost:5000/api/configuration/business-rules/:id
POST     http://localhost:5000/api/configuration/business-rules
PUT      http://localhost:5000/api/configuration/business-rules/:id
DELETE   http://localhost:5000/api/configuration/business-rules/:id
POST     http://localhost:5000/api/configuration/business-rules/evaluate
GET      http://localhost:5000/api/configuration/feature-flags
GET      http://localhost:5000/api/configuration/feature-flags/active
GET      http://localhost:5000/api/configuration/feature-flags/evaluate/:flagKey
GET      http://localhost:5000/api/configuration/feature-flags/:id
POST     http://localhost:5000/api/configuration/feature-flags
PUT      http://localhost:5000/api/configuration/feature-flags/:id
DELETE   http://localhost:5000/api/configuration/feature-flags/:id
PATCH    http://localhost:5000/api/configuration/feature-flags/:id/toggle
GET      http://localhost:5000/api/configuration/number-sequences
GET      http://localhost:5000/api/configuration/number-sequences/next/:sequenceType
GET      http://localhost:5000/api/configuration/number-sequences/:id
POST     http://localhost:5000/api/configuration/number-sequences
PUT      http://localhost:5000/api/configuration/number-sequences/:id
DELETE   http://localhost:5000/api/configuration/number-sequences/:id
POST     http://localhost:5000/api/configuration/number-sequences/:id/reset
GET      http://localhost:5000/api/configuration/lookups/supported-entities
GET      http://localhost:5000/api/configuration/lookups/batch
GET      http://localhost:5000/api/configuration/lookups/:entityKey
GET      http://localhost:5000/api/configuration/lookups/:entityKey/:id
POST     http://localhost:5000/api/configuration/lookups/:entityKey
PUT      http://localhost:5000/api/configuration/lookups/:entityKey/:id
DELETE   http://localhost:5000/api/configuration/lookups/:entityKey/:id
GET      http://localhost:5000/api/configuration/lookup-types
GET      http://localhost:5000/api/configuration/lookup-types/code/:code
GET      http://localhost:5000/api/configuration/lookup-types/:id
POST     http://localhost:5000/api/configuration/lookup-types
PUT      http://localhost:5000/api/configuration/lookup-types/:id
DELETE   http://localhost:5000/api/configuration/lookup-types/:id
GET      http://localhost:5000/api/configuration/lookup-types/:id/values
POST     http://localhost:5000/api/configuration/lookup-types/:id/values
PUT      http://localhost:5000/api/configuration/lookup-types/:lookupTypeId/values/:valueId
DELETE   http://localhost:5000/api/configuration/lookup-types/:lookupTypeId/values/:valueId
GET      http://localhost:5000/api/configuration/calendars
GET      http://localhost:5000/api/configuration/calendars/:id
POST     http://localhost:5000/api/configuration/calendars
PUT      http://localhost:5000/api/configuration/calendars/:id
DELETE   http://localhost:5000/api/configuration/calendars/:id
GET      http://localhost:5000/api/configuration/calendars/:id/working-hours
POST     http://localhost:5000/api/configuration/calendars/:id/working-hours
PUT      http://localhost:5000/api/configuration/calendars/:calendarId/working-hours/:workingHourId
DELETE   http://localhost:5000/api/configuration/calendars/:calendarId/working-hours/:workingHourId
GET      http://localhost:5000/api/configuration/calendars/:id/holidays
POST     http://localhost:5000/api/configuration/calendars/:id/holidays
PUT      http://localhost:5000/api/configuration/calendars/:calendarId/holidays/:holidayId
DELETE   http://localhost:5000/api/configuration/calendars/:calendarId/holidays/:holidayId
GET      http://localhost:5000/api/configuration/localizations
GET      http://localhost:5000/api/configuration/localizations/:id
POST     http://localhost:5000/api/configuration/localizations
PUT      http://localhost:5000/api/configuration/localizations/:id
DELETE   http://localhost:5000/api/configuration/localizations/:id
GET      http://localhost:5000/api/configuration/localizations/:id/resources
POST     http://localhost:5000/api/configuration/localizations/:id/resources
PUT      http://localhost:5000/api/configuration/localizations/:localizationId/resources/:resourceId
DELETE   http://localhost:5000/api/configuration/localizations/:localizationId/resources/:resourceId
```

### Postman Testing Payloads

#### Evaluate Business Rule Engine (`POST /api/configuration/business-rules/evaluate`)
```json
{
  "eventType": "ISSUE_CREATED",
  "context": {
    "priority": "CRITICAL",
    "category": "ELECTRICAL",
    "parkId": 1
  }
}
```

#### Toggle Feature Flag (`PATCH /api/configuration/feature-flags/:id/toggle`)
*(No request body needed — switches boolean flag status `isEnabled` in DB and clears feature flag cache).*

#### Next Number Sequence Generator (`GET /api/configuration/number-sequences/next/:sequenceType`)
- E.g. `GET http://localhost:5000/api/configuration/number-sequences/next/ISSUE_REQUEST`
- Generates atomized sequential number (e.g., `IR-2026-00045`).
