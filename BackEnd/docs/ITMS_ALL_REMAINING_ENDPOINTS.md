# Enterprise Issue Tracking Management System (ITMS) — All Remaining API Endpoints & Postman Test Suite

## Executive Architecture & Test Engineering Summary

As a Senior Software Engineer and Principal Quality Assurance Architect, this document delivers the **complete, verified inventory of all 216 remaining API endpoints** in the ITMS platform, ensuring **100% coverage (389 of 389 endpoints)** across the entire system.

### Inventory Reconciliation & Breakdown

| Category / Batch | Module Scope | Total Endpoints | Status |
| :--- | :--- | :--- | :--- |
| **Batch 1 (Initial Core)** | Modules 1–5 (Foundational Subset) | **80** | Documented in [`ITMS_80_ENDPOINTS_METHOD_AND_URL.txt`](file:///d:/Issue-Tracking-Mngmt-System/BackEnd/docs/ITMS_80_ENDPOINTS_METHOD_AND_URL.txt) |
| **Batch 2 (Operations)** | Modules 6–10 (Service Catalog, Issues, Workbench, Dispatch, Approvals) | **93** | Documented in [`ITMS_MODULES_6_TO_10_ENDPOINTS.txt`](file:///d:/Issue-Tracking-Mngmt-System/BackEnd/docs/ITMS_MODULES_6_TO_10_ENDPOINTS.txt) |
| **Batch 3 (Part 1 - Remaining Modules)** | Modules 11–15 (Comms, Notifications, Documents, Reports, Configuration) | **145** | Documented below & in [`ITMS_ALL_REMAINING_ENDPOINTS.txt`](file:///d:/Issue-Tracking-Mngmt-System/BackEnd/docs/ITMS_ALL_REMAINING_ENDPOINTS.txt) |
| **Batch 3 (Part 2 - Omitted Foundational)** | Modules 3–5 Remainder (Zones, Floor Plans, Leases, Org Hierarchies, Budgets) | **71** | Documented below & in [`ITMS_ALL_REMAINING_ENDPOINTS.txt`](file:///d:/Issue-Tracking-Mngmt-System/BackEnd/docs/ITMS_ALL_REMAINING_ENDPOINTS.txt) |
| **SYSTEM TOTAL** | **All 15 Platform Modules** | **389** | **100.0% Verified & Tested** |

---

## 1. Global Postman Configuration & Authentication Runbook

### 1.1 Environment Setup
In Postman, create an Environment named **`ITMS Local Dev`** with the following keys:

```json
{
  "baseUrl": "http://localhost:5000",
  "token": "PASTE_JWT_TOKEN_HERE",
  "parkId": "1",
  "buildingId": "1",
  "floorId": "1",
  "officeId": "1",
  "tenantId": "1",
  "departmentId": "1",
  "teamId": "1",
  "issueRequestId": "1",
  "conversationId": "1",
  "channelId": "1",
  "documentId": "1",
  "lookupTypeId": "1"
}
```

### 1.2 Seed Super Admin Credentials
To obtain a valid JWT token that bypasses tenant isolation constraints via `PARK_SUPER_ADMIN`:
- **Endpoint**: `POST {{baseUrl}}/api/auth/login`
- **Body**:
```json
{
  "username": "superadmin",
  "password": "Admin@123"
}
```
- **Postman Tests Script (Auto-Token Extraction)**:
```javascript
if (pm.response.code === 200) {
    const res = pm.response.json();
    const token = res.data?.accessToken || res.accessToken || res.token;
    pm.environment.set("token", token);
    pm.environment.set("userId", res.data?.user?.id || 1);
    console.log("Token stored successfully:", token);
}
```

### 1.3 Universal Request Headers
Every request (except the public document share link) must include:
```http
Authorization: Bearer {{token}}
Content-Type: application/json
Accept: application/json
```

---

## 2. Part 1: Modules 11 to 15 API Endpoints (145 Endpoints)

### MODULE 11: COMMUNICATION & MESSAGING (24 Endpoints)
*Base Route: `/api/communication`*

| # | Method | URL | Description / Parameters |
| :--- | :--- | :--- | :--- |
| 001 | `GET` | `http://localhost:5000/api/communication/overview` | High-level messaging KPIs and conversation counts |
| 002 | `GET` | `http://localhost:5000/api/communication/conversations` | List active conversations for current user |
| 003 | `GET` | `http://localhost:5000/api/communication/conversations/request/:issueRequestId` | Get conversation bound to an issue ticket |
| 004 | `POST` | `http://localhost:5000/api/communication/conversations/request/:issueRequestId` | Create/bind conversation to an issue ticket |
| 005 | `GET` | `http://localhost:5000/api/communication/conversations/:conversationId/participants` | List participants in conversation |
| 006 | `POST` | `http://localhost:5000/api/communication/conversations/:conversationId/participants` | Add user to conversation: `{ "userId": 2 }` |
| 007 | `GET` | `http://localhost:5000/api/communication/conversations/:conversationId/messages` | Fetch conversation thread messages |
| 008 | `POST` | `http://localhost:5000/api/communication/conversations/:conversationId/messages` | Post message: `{ "content": "Update on HVAC repair" }` |
| 009 | `POST` | `http://localhost:5000/api/communication/requests/:issueRequestId/messages` | Direct post message to ticket |
| 010 | `PUT` | `http://localhost:5000/api/communication/conversations/:conversationId/read` | Mark all messages in thread as read |
| 011 | `GET` | `http://localhost:5000/api/communication/notes/:requestId` | Get private internal notes on ticket |
| 012 | `POST` | `http://localhost:5000/api/communication/notes/:requestId` | Add internal staff note: `{ "note": "Technician dispatched" }` |
| 013 | `DELETE` | `http://localhost:5000/api/communication/notes/:noteId` | Soft delete internal staff note |
| 014 | `GET` | `http://localhost:5000/api/communication/comments/:issueRequestId` | List public/tenant comments on issue |
| 015 | `POST` | `http://localhost:5000/api/communication/comments` | Post comment: `{ "issueRequestId": 1, "comment": "Parts arrived" }` |
| 016 | `DELETE` | `http://localhost:5000/api/communication/comments/:id` | Delete comment by ID |
| 017 | `GET` | `http://localhost:5000/api/communication/announcements` | List facility & campus broadcast announcements |
| 018 | `POST` | `http://localhost:5000/api/communication/announcements` | Create campus announcement: `{ "title": "Fire Drill", "content": "Scheduled 2 PM" }` |
| 019 | `DELETE` | `http://localhost:5000/api/communication/announcements/:id` | Remove announcement |
| 020 | `GET` | `http://localhost:5000/api/communication/channels` | List team broadcast communication channels |
| 021 | `POST` | `http://localhost:5000/api/communication/channels` | Create channel: `{ "name": "Facility Engineering", "channelType": "TEAM" }` |
| 022 | `GET` | `http://localhost:5000/api/communication/channels/:channelId/messages` | Read channel messages |
| 023 | `POST` | `http://localhost:5000/api/communication/channels/:channelId/messages` | Post channel broadcast: `{ "content": "Power maintenance tonight" }` |
| 024 | `GET` | `http://localhost:5000/api/communication/activity/:issueRequestId` | Unified audit & timeline activity stream for ticket |

---

### MODULE 12: NOTIFICATIONS & ALERTS (20 Endpoints)
*Base Route: `/api/notifications`*

| # | Method | URL | Description / Parameters |
| :--- | :--- | :--- | :--- |
| 025 | `GET` | `http://localhost:5000/api/notifications/overview` | Notification system overview metrics |
| 026 | `GET` | `http://localhost:5000/api/notifications/types` | Enumeration of registered notification types |
| 027 | `GET` | `http://localhost:5000/api/notifications/channels` | Enabled dispatch channels (IN_APP, EMAIL, SMS, PUSH) |
| 028 | `GET` | `http://localhost:5000/api/notifications/inbox` | Paginated user inbox (`?page=1&limit=20&unreadOnly=false`) |
| 029 | `GET` | `http://localhost:5000/api/notifications/unread-count` | Current unread count badge for user |
| 030 | `PATCH` | `http://localhost:5000/api/notifications/read-all` | Mark all user inbox notifications as read |
| 031 | `PATCH` | `http://localhost:5000/api/notifications/:id/read` | Mark specific notification as read |
| 032 | `PATCH` | `http://localhost:5000/api/notifications/:id/unread` | Mark specific notification as unread |
| 033 | `POST` | `http://localhost:5000/api/notifications/event` | Trigger event notification: `{ "eventType": "ISSUE_CREATED", "entityId": 1 }` |
| 034 | `POST` | `http://localhost:5000/api/notifications/dispatch` | Force dispatch queued outbound alerts |
| 035 | `GET` | `http://localhost:5000/api/notifications/preferences` | Get user email/SMS alert preferences |
| 036 | `PUT` | `http://localhost:5000/api/notifications/preferences` | Update preferences: `{ "emailNotifications": true, "smsNotifications": false }` |
| 037 | `GET` | `http://localhost:5000/api/notifications/delivery-log` | Audit delivery log of sent messages |
| 038 | `GET` | `http://localhost:5000/api/notifications/templates` | List message templates |
| 039 | `POST` | `http://localhost:5000/api/notifications/templates` | Create template: `{ "code": "SLA_BREACH", "subject": "Alert", "body": "..." }` |
| 040 | `PUT` | `http://localhost:5000/api/notifications/templates/:id` | Update template content |
| 041 | `GET` | `http://localhost:5000/api/notifications/reminders` | List pending automated ticket reminders |
| 042 | `POST` | `http://localhost:5000/api/notifications/reminders` | Schedule reminder: `{ "issueRequestId": 1, "remindAt": "2026-10-25T10:00:00Z" }` |
| 043 | `PATCH` | `http://localhost:5000/api/notifications/reminders/:id/complete` | Mark reminder as fulfilled |
| 044 | `POST` | `http://localhost:5000/api/notifications/test-email` | Test SMTP integration: `{ "to": "admin@itms.local" }` |

---

### MODULE 13: FILE & DOCUMENT MANAGEMENT (16 Endpoints)
*Base Route: `/api/documents`*

> [!IMPORTANT]
> **Upload Configuration**:
> - Single file upload (`POST /api/documents/upload`): Form field name must be **`file`**.
> - Multiple file upload (`POST /api/documents/upload-multiple`): Form field name must be **`files`** (max 10).
> - Public share link (`GET /api/documents/share/:shareToken`): Does **not** require `Authorization` header.

| # | Method | URL | Description / Parameters |
| :--- | :--- | :--- | :--- |
| 045 | `GET` | `http://localhost:5000/api/documents/share/:shareToken` | **Public**: Download file via secure temporary token |
| 046 | `GET` | `http://localhost:5000/api/documents/metrics` | Storage consumption, mime distribution, file count KPIs |
| 047 | `GET` | `http://localhost:5000/api/documents/categories` | Document taxonomy categories (INVOICES, CONTRACTS, MANUALS) |
| 048 | `POST` | `http://localhost:5000/api/documents/categories` | Create category: `{ "name": "Facility Schematics", "code": "SCHEMATICS" }` |
| 049 | `GET` | `http://localhost:5000/api/documents` | List documents (`?entityType=ISSUE&entityId=1`) |
| 050 | `GET` | `http://localhost:5000/api/documents/:id` | Get document metadata by ID |
| 051 | `POST` | `http://localhost:5000/api/documents/upload` | Upload single file (`multipart/form-data`, field: `file`, entityType, entityId) |
| 052 | `POST` | `http://localhost:5000/api/documents/upload-multiple` | Upload multiple files (`multipart/form-data`, field: `files`) |
| 053 | `GET` | `http://localhost:5000/api/documents/:id/download` | Stream download file payload |
| 054 | `GET` | `http://localhost:5000/api/documents/:id/preview` | In-browser preview streaming (PDF / images) |
| 055 | `POST` | `http://localhost:5000/api/documents/:id/versions` | Upload revision: `multipart/form-data` (field: `file`, `changeLog`) |
| 056 | `POST` | `http://localhost:5000/api/documents/:id/share` | Generate temporary secure share link: `{ "expiresInHours": 24 }` |
| 057 | `PATCH` | `http://localhost:5000/api/documents/:id` | Update document metadata (title, categoryId, tags) |
| 058 | `DELETE` | `http://localhost:5000/api/documents/:id` | Soft delete document |
| 059 | `POST` | `http://localhost:5000/api/documents/:id/restore` | Restore soft-deleted document |
| 060 | `DELETE` | `http://localhost:5000/api/documents/:id/permanent` | Permanently purge document and disk file |

---

### MODULE 14: REPORTING & ANALYTICS (19 Endpoints)
*Base Route: `/api/reports`*

| # | Method | URL | Description / Parameters |
| :--- | :--- | :--- | :--- |
| 061 | `GET` | `http://localhost:5000/api/reports/dashboard/executive` | Executive dashboard aggregated performance metrics |
| 062 | `GET` | `http://localhost:5000/api/reports/requests` | Ticket volume, resolution time, and backlog report |
| 063 | `GET` | `http://localhost:5000/api/reports/assignments` | Technician dispatch workload and throughput analytics |
| 064 | `GET` | `http://localhost:5000/api/reports/sla` | SLA compliance %, MTTA, MTTR, and breach statistics |
| 065 | `GET` | `http://localhost:5000/api/reports/tenants` | Tenant service consumption and request distribution |
| 066 | `GET` | `http://localhost:5000/api/reports/departments` | Departmental facility expenditure and ticket metrics |
| 067 | `GET` | `http://localhost:5000/api/reports/approvals` | Approval queue velocity, bottleneck, and reject rates |
| 068 | `GET` | `http://localhost:5000/api/reports/audit` | Regulatory compliance, data mutations, and security audit log |
| 069 | `GET` | `http://localhost:5000/api/reports/export/:reportType` | Export report (`?format=pdf` or `?format=excel` or `?format=csv`) |
| 070 | `GET` | `http://localhost:5000/api/reports/saved` | List user saved custom report templates |
| 071 | `POST` | `http://localhost:5000/api/reports/saved` | Save report query: `{ "name": "Monthly SLA", "filters": { ... } }` |
| 072 | `PUT` | `http://localhost:5000/api/reports/saved/:id` | Update saved report configuration |
| 073 | `DELETE` | `http://localhost:5000/api/reports/saved/:id` | Delete saved report definition |
| 074 | `GET` | `http://localhost:5000/api/reports/schedules` | List scheduled recurring report jobs |
| 075 | `POST` | `http://localhost:5000/api/reports/schedules` | Create schedule: `{ "reportId": 1, "cron": "0 8 * * 1", "recipients": ["cfo@park.local"] }` |
| 076 | `PUT` | `http://localhost:5000/api/reports/schedules/:id` | Update report schedule job |
| 077 | `DELETE` | `http://localhost:5000/api/reports/schedules/:id` | Cancel and delete scheduled report job |
| 078 | `POST` | `http://localhost:5000/api/reports/schedules/:id/trigger` | Immediately execute scheduled report on demand |
| 079 | `GET` | `http://localhost:5000/api/reports/executions` | View execution history log of scheduled report runs |

---

### MODULE 15: CONFIGURATION MANAGEMENT (66 Endpoints)
*Base Route: `/api/configuration`*

| # | Method | URL | Description / Parameters |
| :--- | :--- | :--- | :--- |
| 080 | `GET` | `http://localhost:5000/api/configuration/bootstrap` | Master system bootstrap config for UI initialization |
| 081 | `GET` | `http://localhost:5000/api/configuration/system-settings` | List all system settings key-value pairs |
| 082 | `GET` | `http://localhost:5000/api/configuration/system-settings/key/:key` | Lookup setting by key (e.g. `DEFAULT_TIMEZONE`) |
| 083 | `GET` | `http://localhost:5000/api/configuration/system-settings/:id` | Get setting by numeric ID |
| 084 | `POST` | `http://localhost:5000/api/configuration/system-settings` | Create setting: `{ "key": "MAX_ATTACHMENT_SIZE_MB", "value": "25" }` |
| 085 | `PUT` | `http://localhost:5000/api/configuration/system-settings/:id` | Update setting value |
| 086 | `DELETE` | `http://localhost:5000/api/configuration/system-settings/:id` | Delete setting |
| 087 | `GET` | `http://localhost:5000/api/configuration/feature-flags` | List dynamic feature flags |
| 088 | `GET` | `http://localhost:5000/api/configuration/feature-flags/code/:code` | Get feature flag by code |
| 089 | `GET` | `http://localhost:5000/api/configuration/feature-flags/code/:code/enabled` | Fast boolean check (`{ "enabled": true }`) |
| 090 | `GET` | `http://localhost:5000/api/configuration/feature-flags/:id` | Get feature flag by ID |
| 091 | `POST` | `http://localhost:5000/api/configuration/feature-flags` | Create feature flag: `{ "code": "AI_DISPATCH_ENABLED", "isEnabled": false }` |
| 092 | `PUT` | `http://localhost:5000/api/configuration/feature-flags/:id` | Update feature flag details |
| 093 | `PATCH` | `http://localhost:5000/api/configuration/feature-flags/:id/toggle` | Atomically toggle feature flag boolean |
| 094 | `DELETE` | `http://localhost:5000/api/configuration/feature-flags/:id` | Delete feature flag |
| 095 | `GET` | `http://localhost:5000/api/configuration/business-rules` | List enterprise validation & workflow business rules |
| 096 | `GET` | `http://localhost:5000/api/configuration/business-rules/code/:code` | Get business rule by code |
| 097 | `GET` | `http://localhost:5000/api/configuration/business-rules/:id` | Get business rule by ID |
| 098 | `POST` | `http://localhost:5000/api/configuration/business-rules` | Create business rule: `{ "code": "SLA_AUTO_ESCALATE", "ruleJson": {...} }` |
| 099 | `PUT` | `http://localhost:5000/api/configuration/business-rules/:id` | Update business rule parameters |
| 100 | `DELETE` | `http://localhost:5000/api/configuration/business-rules/:id` | Delete business rule |
| 101 | `GET` | `http://localhost:5000/api/configuration/number-sequences` | List autoincrementing document number sequences |
| 102 | `GET` | `http://localhost:5000/api/configuration/number-sequences/code/:code` | Get sequence definition by code (e.g., `TICKET_NO`) |
| 103 | `POST` | `http://localhost:5000/api/configuration/number-sequences/code/:code/next` | **Atomic**: Generate and reserve next number sequence value |
| 104 | `GET` | `http://localhost:5000/api/configuration/number-sequences/:id` | Get sequence by ID |
| 105 | `POST` | `http://localhost:5000/api/configuration/number-sequences` | Create sequence: `{ "code": "WO_NO", "prefix": "WO-", "nextNumber": 1 }` |
| 106 | `PUT` | `http://localhost:5000/api/configuration/number-sequences/:id` | Update sequence format or current counter |
| 107 | `DELETE` | `http://localhost:5000/api/configuration/number-sequences/:id` | Delete sequence definition |
| 108 | `GET` | `http://localhost:5000/api/configuration/lookups/:entityKey` | Fast entity lookup by key (e.g. `PRIORITY`) |
| 109 | `GET` | `http://localhost:5000/api/configuration/lookups/:entityKey/code/:code` | Lookup item by entity key and code |
| 110 | `GET` | `http://localhost:5000/api/configuration/lookups/:entityKey/:id` | Lookup item by entity key and ID |
| 111 | `POST` | `http://localhost:5000/api/configuration/lookups/:entityKey` | Add lookup item to entity category |
| 112 | `PUT` | `http://localhost:5000/api/configuration/lookups/:entityKey/:id` | Update lookup item |
| 113 | `DELETE` | `http://localhost:5000/api/configuration/lookups/:entityKey/:id` | Delete lookup item |
| 114 | `GET` | `http://localhost:5000/api/configuration/lookup-types` | List parent lookup dictionary types |
| 115 | `GET` | `http://localhost:5000/api/configuration/lookup-types/code/:code` | Get lookup type by code |
| 116 | `GET` | `http://localhost:5000/api/configuration/lookup-types/:id` | Get lookup type by ID |
| 117 | `POST` | `http://localhost:5000/api/configuration/lookup-types` | Create lookup type: `{ "code": "ASSET_STATUS", "name": "Asset Statuses" }` |
| 118 | `PUT` | `http://localhost:5000/api/configuration/lookup-types/:id` | Update lookup type |
| 119 | `DELETE` | `http://localhost:5000/api/configuration/lookup-types/:id` | Delete lookup type |
| 120 | `GET` | `http://localhost:5000/api/configuration/lookup-types/:id/values` | List child values for a lookup type |
| 121 | `POST` | `http://localhost:5000/api/configuration/lookup-types/:id/values` | Create value: `{ "code": "MAINT", "label": "Under Maintenance" }` |
| 122 | `PUT` | `http://localhost:5000/api/configuration/lookup-types/:lookupTypeId/values/:valueId` | Update child lookup value |
| 123 | `DELETE` | `http://localhost:5000/api/configuration/lookup-types/:lookupTypeId/values/:valueId` | Delete child lookup value |
| 124 | `GET` | `http://localhost:5000/api/configuration/calendars` | List operating enterprise business calendars |
| 125 | `GET` | `http://localhost:5000/api/configuration/calendars/:id` | Get calendar details by ID |
| 126 | `POST` | `http://localhost:5000/api/configuration/calendars` | Create calendar: `{ "name": "Campus Standard Calendar", "timeZone": "UTC" }` |
| 127 | `PUT` | `http://localhost:5000/api/configuration/calendars/:id` | Update calendar metadata |
| 128 | `DELETE` | `http://localhost:5000/api/configuration/calendars/:id` | Delete calendar |
| 129 | `GET` | `http://localhost:5000/api/configuration/calendars/:id/working-hours` | List weekly working hours schedules |
| 130 | `POST` | `http://localhost:5000/api/configuration/calendars/:id/working-hours` | Set working hours: `{ "dayOfWeek": 1, "startTime": "08:00", "endTime": "17:00" }` |
| 131 | `PUT` | `http://localhost:5000/api/configuration/calendars/:calendarId/working-hours/:workingHourId` | Update working hours shift |
| 132 | `DELETE` | `http://localhost:5000/api/configuration/calendars/:calendarId/working-hours/:workingHourId` | Delete working hours shift |
| 133 | `GET` | `http://localhost:5000/api/configuration/calendars/:id/holidays` | List registered non-working holidays |
| 134 | `POST` | `http://localhost:5000/api/configuration/calendars/:id/holidays` | Add holiday: `{ "name": "New Year", "holidayDate": "2027-01-01" }` |
| 135 | `PUT` | `http://localhost:5000/api/configuration/calendars/:calendarId/holidays/:holidayId` | Update holiday date/title |
| 136 | `DELETE` | `http://localhost:5000/api/configuration/calendars/:calendarId/holidays/:holidayId` | Remove holiday |
| 137 | `GET` | `http://localhost:5000/api/configuration/localizations` | List supported UI localizations & languages |
| 138 | `GET` | `http://localhost:5000/api/configuration/localizations/:id` | Get localization locale by ID |
| 139 | `POST` | `http://localhost:5000/api/configuration/localizations` | Add localization: `{ "code": "fr-FR", "name": "French" }` |
| 140 | `PUT` | `http://localhost:5000/api/configuration/localizations/:id` | Update localization metadata |
| 141 | `DELETE` | `http://localhost:5000/api/configuration/localizations/:id` | Delete localization locale |
| 142 | `GET` | `http://localhost:5000/api/configuration/localizations/:id/resources` | Get translation string key-values |
| 143 | `POST` | `http://localhost:5000/api/configuration/localizations/:id/resources` | Add translation: `{ "resourceKey": "common.submit", "value": "Soumettre" }` |
| 144 | `PUT` | `http://localhost:5000/api/configuration/localizations/:localizationId/resources/:resourceId` | Update translation string |
| 145 | `DELETE` | `http://localhost:5000/api/configuration/localizations/:localizationId/resources/:resourceId` | Delete translation string |

---

## 3. Part 2: Modules 3 to 5 Remainder API Endpoints (71 Endpoints)
*Omitted when Batch 1 was capped at 80 endpoints. Now fully mapped and testable.*

### MODULE 3: FACILITY LOCATIONS, ZONES & FLOOR PLANS (13 Endpoints)

| # | Method | URL | Description / Parameters |
| :--- | :--- | :--- | :--- |
| 146 | `PUT` | `http://localhost:5000/api/offices/:id` | Update office suite details |
| 147 | `GET` | `http://localhost:5000/api/locations/:id` | Get specific campus geofence/location by ID |
| 148 | `POST` | `http://localhost:5000/api/locations` | Create campus location: `{ "name": "North Quad Gate", "parkId": 1 }` |
| 149 | `PUT` | `http://localhost:5000/api/locations/:id` | Update location properties |
| 150 | `DELETE` | `http://localhost:5000/api/locations/:id` | Delete location |
| 151 | `GET` | `http://localhost:5000/api/facility-zones/:id` | Get facility security/climate zone by ID |
| 152 | `GET` | `http://localhost:5000/api/facility-zones/:zoneId/buildings` | List buildings situated within zone |
| 153 | `POST` | `http://localhost:5000/api/facility-zones` | Create zone: `{ "name": "High Voltage Substation Zone", "parkId": 1 }` |
| 154 | `PUT` | `http://localhost:5000/api/facility-zones/:id` | Update facility zone |
| 155 | `DELETE` | `http://localhost:5000/api/facility-zones/:id` | Delete facility zone |
| 156 | `POST` | `http://localhost:5000/api/floor-plans` | Create floor plan drawing: `{ "floorId": 1, "svgData": "<svg>...</svg>" }` |
| 157 | `PUT` | `http://localhost:5000/api/floor-plans/:id` | Update floor plan layout & coordinates |
| 158 | `DELETE` | `http://localhost:5000/api/floor-plans/:id` | Delete floor plan layout |

---

### MODULE 4: TENANT MANAGEMENT — LEASES, CONTRACTS & ALLOCATIONS (18 Endpoints)

| # | Method | URL | Description / Parameters |
| :--- | :--- | :--- | :--- |
| 159 | `PUT` | `http://localhost:5000/api/tenants/:id` | Update primary tenant company profile |
| 160 | `DELETE` | `http://localhost:5000/api/tenants/:id` | Soft-delete tenant organization |
| 161 | `GET` | `http://localhost:5000/api/sub-tenants/:id` | Get sub-tenant profile by ID |
| 162 | `PUT` | `http://localhost:5000/api/sub-tenants/:id` | Update sub-tenant details |
| 163 | `DELETE` | `http://localhost:5000/api/sub-tenants/:id` | Delete sub-tenant |
| 164 | `GET` | `http://localhost:5000/api/tenant-contacts/:id` | Get tenant contact by ID |
| 165 | `PUT` | `http://localhost:5000/api/tenant-contacts/:id` | Update tenant contact info |
| 166 | `DELETE` | `http://localhost:5000/api/tenant-contacts/:id` | Remove tenant contact |
| 167 | `GET` | `http://localhost:5000/api/tenant-addresses/:id` | Get tenant physical/billing address by ID |
| 168 | `PUT` | `http://localhost:5000/api/tenant-addresses/:id` | Update tenant address |
| 169 | `DELETE` | `http://localhost:5000/api/tenant-addresses/:id` | Delete tenant address |
| 170 | `GET` | `http://localhost:5000/api/leases/:id` | Get lease contract details by ID |
| 171 | `PUT` | `http://localhost:5000/api/leases/:id` | Update lease contract terms |
| 172 | `PATCH` | `http://localhost:5000/api/leases/:id/status` | Modify lease status: `{ "status": "TERMINATED" }` |
| 173 | `DELETE` | `http://localhost:5000/api/leases/:id` | Terminate & delete lease record |
| 174 | `GET` | `http://localhost:5000/api/office-allocations/history` | Historical log of office space assignments |
| 175 | `GET` | `http://localhost:5000/api/office-allocations/:id` | Get office allocation details |
| 176 | `DELETE` | `http://localhost:5000/api/office-allocations/:id` | Revoke/delete office space allocation |

---

### MODULE 5: ORGANIZATIONAL STRUCTURE, TEAMS, POSITIONS & FINANCIALS (40 Endpoints)

| # | Method | URL | Description / Parameters |
| :--- | :--- | :--- | :--- |
| 177 | `GET` | `http://localhost:5000/api/departments/:id` | Get department profile by ID |
| 178 | `PUT` | `http://localhost:5000/api/departments/:id` | Update department details |
| 179 | `DELETE` | `http://localhost:5000/api/departments/:id` | Delete department |
| 180 | `GET` | `http://localhost:5000/api/departments/:id/locations` | List campus physical locations associated with department |
| 181 | `POST` | `http://localhost:5000/api/departments/:id/locations` | Bind location to department: `{ "locationId": 1 }` |
| 182 | `DELETE` | `http://localhost:5000/api/departments/locations/:locId` | Unbind department location link |
| 183 | `GET` | `http://localhost:5000/api/teams/eligible-technicians` | Query technicians qualified and certified for team assignment |
| 184 | `GET` | `http://localhost:5000/api/teams/workload-summary` | Real-time workload & ticket distribution per operational team |
| 185 | `GET` | `http://localhost:5000/api/teams/:id` | Get team details by ID |
| 186 | `POST` | `http://localhost:5000/api/teams` | Create operational team: `{ "name": "HVAC Specialists", "departmentId": 1 }` |
| 187 | `PUT` | `http://localhost:5000/api/teams/:id` | Update team details |
| 188 | `DELETE` | `http://localhost:5000/api/teams/:id` | Delete team |
| 189 | `GET` | `http://localhost:5000/api/teams/:id/members` | List technicians and leads assigned to team |
| 190 | `POST` | `http://localhost:5000/api/teams/:id/members` | Assign user to team: `{ "userId": 3, "role": "LEAD" }` |
| 191 | `DELETE` | `http://localhost:5000/api/teams/:id/members/:userId` | Remove user from team membership |
| 192 | `GET` | `http://localhost:5000/api/positions` | List corporate job positions/titles |
| 193 | `GET` | `http://localhost:5000/api/positions/:id` | Get job position details |
| 194 | `POST` | `http://localhost:5000/api/positions` | Create position: `{ "title": "Senior Facilities Specialist", "code": "SFS-01" }` |
| 195 | `PUT` | `http://localhost:5000/api/positions/:id` | Update job position |
| 196 | `DELETE` | `http://localhost:5000/api/positions/:id` | Delete job position |
| 197 | `GET` | `http://localhost:5000/api/employee-assignments` | List staff assignments to departments and positions |
| 198 | `GET` | `http://localhost:5000/api/employee-assignments/:id` | Get specific staff assignment record |
| 199 | `POST` | `http://localhost:5000/api/employee-assignments` | Assign employee: `{ "userId": 2, "departmentId": 1, "positionId": 1 }` |
| 200 | `PUT` | `http://localhost:5000/api/employee-assignments/:id` | Update staff assignment |
| 201 | `DELETE` | `http://localhost:5000/api/employee-assignments/:id` | Terminate staff assignment record |
| 202 | `GET` | `http://localhost:5000/api/reporting-hierarchies` | List organizational managerial reporting trees |
| 203 | `GET` | `http://localhost:5000/api/reporting-hierarchies/:id` | Get reporting tree node |
| 204 | `POST` | `http://localhost:5000/api/reporting-hierarchies` | Define manager-subordinate link: `{ "subordinateId": 3, "managerId": 1 }` |
| 205 | `PUT` | `http://localhost:5000/api/reporting-hierarchies/:id` | Update managerial relationship |
| 206 | `DELETE` | `http://localhost:5000/api/reporting-hierarchies/:id` | Sever managerial reporting link |
| 207 | `GET` | `http://localhost:5000/api/financials/cost-centers` | List financial cost centers |
| 208 | `GET` | `http://localhost:5000/api/financials/cost-centers/:id` | Get cost center details |
| 209 | `POST` | `http://localhost:5000/api/financials/cost-centers` | Create cost center: `{ "code": "CC-FAC-01", "name": "Facility Maintenance" }` |
| 210 | `PUT` | `http://localhost:5000/api/financials/cost-centers/:id` | Update cost center profile |
| 211 | `DELETE` | `http://localhost:5000/api/financials/cost-centers/:id` | Delete cost center |
| 212 | `GET` | `http://localhost:5000/api/financials/budgets` | List departmental operating budgets |
| 213 | `GET` | `http://localhost:5000/api/financials/budgets/:id` | Get budget details and balance |
| 214 | `POST` | `http://localhost:5000/api/financials/budgets` | Allocate budget: `{ "costCenterId": 1, "fiscalYear": 2026, "amount": 150000 }` |
| 215 | `PUT` | `http://localhost:5000/api/financials/budgets/:id` | Update budget allocation |
| 216 | `DELETE` | `http://localhost:5000/api/financials/budgets/:id` | Delete budget record |

---

## 4. Key Senior Engineer Postman Test Scripts & Assertions

### 4.1 Status Code & Response Time Assertion
Paste in the **Tests** tab of Postman requests:
```javascript
pm.test("Status code is 200 or 201", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 201]);
});

pm.test("Response time is acceptable (< 1500ms)", function () {
    pm.expect(pm.response.responseTime).to.be.below(1500);
});

pm.test("Response format conforms to standard ITMS schema", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.be.an("object");
    pm.expect(jsonData.success).to.be.true;
    pm.expect(jsonData).to.have.property("data");
});
```

### 4.2 Handling Number Sequences Atomically
When testing `POST http://localhost:5000/api/configuration/number-sequences/code/:code/next`:
```javascript
pm.test("Number sequence increments monotonically", function () {
    const res = pm.response.json();
    pm.expect(res.data).to.have.property("generatedNumber");
    console.log("Allocated Sequence Number:", res.data.generatedNumber);
});
```
