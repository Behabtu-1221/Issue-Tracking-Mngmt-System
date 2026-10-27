# ITMS API Testing Guide: All Remaining Endpoints (Modules 5 Remainder, 11, 12, 13, 14, 15)

## 1. Overview & Architectural Testing Context

This guide covers all **188 remaining testable API endpoints** across the Issue Tracking Management System (ITMS) backend server (`http://localhost:5000`).

### Cumulative Backend Inventory
| Phase | Modules Covered | Endpoint Count | Reference File |
|---|---|---|---|
| **Batch 1** | Modules 1–5 (Foundational Identity, Parks, Buildings, SLAs, Staff Core) | **80** | [ITMS_80_ENDPOINTS_METHOD_AND_URL.txt](file:///d:/Issue-Tracking-Mngmt-System/BackEnd/docs/ITMS_80_ENDPOINTS_METHOD_AND_URL.txt) |
| **Batch 2** | Modules 6–10 (Tickets, Approvals, Work Orders, Asset Registry, Maintenance) | **93** | [ITMS_MODULES_6_TO_10_ENDPOINTS.txt](file:///d:/Issue-Tracking-Mngmt-System/BackEnd/docs/ITMS_MODULES_6_TO_10_ENDPOINTS.txt) |
| **Final Batch** | Modules 5 Remainder, 11, 12, 13, 14, 15 (Communication, Notifications, Documents, Reports, Configuration) | **188** | [ITMS_ALL_REMAINING_ENDPOINTS_METHOD_AND_URL.txt](file:///d:/Issue-Tracking-Mngmt-System/BackEnd/docs/ITMS_ALL_REMAINING_ENDPOINTS_METHOD_AND_URL.txt) |
| **Total System** | **All 15 Backend Modules** | **361** | Complete Express Server Surface |

---

## 2. Postman Global Setup & Headers

### Mandatory Headers
Except for the single public endpoint (`GET /api/documents/share/:shareToken`), all remaining routes are secured by `globalAuth` ([globalAuth.js](file:///d:/Issue-Tracking-Mngmt-System/BackEnd/src/shared/middleware/globalAuth.js)):

```http
Authorization: Bearer {{token}}
Content-Type: application/json
```

### Pre-request Script (Postman Collection Level)
To test with `PARK_SUPER_ADMIN` (bypassing tenant row-level filtering):
```javascript
// Obtain token from POST http://localhost:5000/api/auth/login
// Body: { "username": "superadmin", "password": "Admin@123" }
pm.collectionVariables.set("baseUrl", "http://localhost:5000");
```

---

## 3. Module-by-Module Testing Recipes

### Module 5 (Remainder): Teams, Positions, Assignments, Hierarchies & Budgets (34 Endpoints)
- **Base Routes:** `/api/departments`, `/api/teams`, `/api/positions`, `/api/employee-assignments`, `/api/reporting-hierarchies`, `/api/financials`
- **Key Controller:** `staff.controller.js`
- **Sample POST `/api/teams` Payload:**
  ```json
  {
    "teamName": "HVAC Rapid Response",
    "departmentId": 1,
    "teamLeadId": 2,
    "specialization": "HVAC & Electrical",
    "capacity": 10,
    "isActive": true
  }
  ```
- **Sample POST `/api/financials/cost-centers` Payload:**
  ```json
  {
    "code": "CC-FAC-01",
    "name": "Facilities & Maintenance",
    "parkId": 1,
    "departmentId": 1,
    "isActive": true
  }
  ```
- **Sample POST `/api/financials/budgets` Payload:**
  ```json
  {
    "costCenterId": 1,
    "fiscalYear": 2026,
    "totalBudget": 50000.00,
    "allocatedBudget": 15000.00,
    "currency": "USD"
  }
  ```

---

### Module 11: Communication & Messaging (24 Endpoints)
- **Base Route:** `/api/communication`
- **Key Controller:** `communication.controller.js`
- **Sample POST `/api/communication/conversations/request/:issueRequestId` Payload:**
  ```json
  {
    "title": "Discussion regarding AC Unit Maintenance",
    "participantIds": [1, 2, 3]
  }
  ```
- **Sample POST `/api/communication/conversations/:conversationId/messages` Payload:**
  ```json
  {
    "messageText": "The technician has been dispatched to floor 3.",
    "attachments": []
  }
  ```
- **Sample POST `/api/communication/notes/:requestId` Payload:**
  ```json
  {
    "note": "Internal review complete. Replacement motor ordered.",
    "isInternal": true
  }
  ```
- **Sample POST `/api/communication/quick-replies` Payload:**
  ```json
  {
    "title": "Awaiting Vendor Part",
    "shortcut": "part_wait",
    "message": "We have ordered the required replacement part and will resume work upon delivery."
  }
  ```

---

### Module 12: Notifications & Alerts (20 Endpoints)
- **Base Route:** `/api/notifications`
- **Key Controller:** `notification.controller.js`
- **Sample POST `/api/notifications/dispatch` Payload:**
  ```json
  {
    "recipientId": 2,
    "title": "Work Order Assigned",
    "message": "WO-2026-0042 has been assigned to your team.",
    "priority": "HIGH",
    "type": "WORK_ORDER_ASSIGNED",
    "metadata": { "workOrderId": 42 }
  }
  ```
- **Sample PUT `/api/notifications/preferences` Payload:**
  ```json
  {
    "emailEnabled": true,
    "inAppEnabled": true,
    "smsEnabled": false,
    "quietHoursStart": "22:00",
    "quietHoursEnd": "07:00"
  }
  ```

---

### Module 13: File & Document Management (16 Endpoints)
- **Base Route:** `/api/documents`
- **Key Controller:** `document.controller.js`
- **Multipart Upload Testing (`POST /api/documents/upload`):**
  - **Body Type:** `form-data`
  - **Key `file`:** Type = File (select any `.pdf` or `.png` file)
  - **Key `entityType`:** `ISSUE_REQUEST` or `WORK_ORDER`
  - **Key `entityId`:** `1`
  - **Key `category`:** `EVIDENCE`
- **Multiple Files Upload (`POST /api/documents/upload-multiple`):**
  - **Body Type:** `form-data`
  - **Key `files`:** Type = File (multi-select up to 10 files)
- **Public Share Link Verification:**
  - `GET http://localhost:5000/api/documents/share/:shareToken`
  - *No `Authorization` header required!*

---

### Module 14: Reporting & Analytics (19 Endpoints)
- **Base Route:** `/api/reports`
- **Key Controller:** `reporting.controller.js`
- **Analytical Metrics Available (GET with query parameters `?startDate=2026-01-01&endDate=2026-12-31&parkId=1`):**
  - `/api/reports/sla-compliance`
  - `/api/reports/technician-performance`
  - `/api/reports/resolution-efficiency`
  - `/api/reports/reopen-rate`
  - `/api/reports/issue-volume`
  - `/api/reports/first-contact-resolution`
  - `/api/reports/mttr` (Mean Time to Resolution)
  - `/api/reports/park-summary`
  - `/api/reports/tenant-summary`
  - `/api/reports/executive-kpi`
- **Exports:**
  - `GET /api/reports/export/csv?type=sla-compliance`
  - `GET /api/reports/export/pdf?type=executive-kpi`

---

### Module 15: Configuration Management (66 Endpoints)
- **Base Route:** `/api/configuration`
- **Key Controller:** `configuration.controller.js`
- **Sub-domains:**
  1. **Bootstrap & System Settings:** `/api/configuration/bootstrap`, `/api/configuration/system-settings`
  2. **Business Rules Engine:** `/api/configuration/business-rules` (supports dynamic JSON conditions & actions)
  3. **Feature Flags:** `/api/configuration/feature-flags` (with instant `/toggle`)
  4. **Number Sequences:** `/api/configuration/number-sequences` (handles auto-generation prefixes `TICK-`, `WO-`, `PO-`)
  5. **Lookups & Lookup Types:** `/api/configuration/lookups`, `/api/configuration/lookup-types`
  6. **Calendars, Shifts & Working Hours:** `/api/configuration/calendars` (controls SLA timer working windows)
  7. **Localizations & Resource Bundles:** `/api/configuration/localizations`
