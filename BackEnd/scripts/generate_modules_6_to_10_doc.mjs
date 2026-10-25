import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mdContent = `# Enterprise ITMS — API Endpoints Inventory (Modules 6 to 10)

This document provides the complete, verified specification of all **93 API Endpoints** for the operational core of the Enterprise Issue Tracking Management System (ITMS):

- **Module 6:** Service Catalog & Service Category Mappings (18 Endpoints)
- **Module 7:** Issue Requests & Ticket Lifecycle Management (21 Endpoints)
- **Module 8:** Approval Workflows & Managerial Decisions (25 Endpoints)
- **Module 9:** Technician Assignment & Dispatch Workbench (18 Endpoints)
- **Module 10:** SLA Policies, Target Monitoring & Escalations (11 Endpoints)

---

## 1. Module 6: Service Catalog & Categories (18 Endpoints)

Mounted at \`/api/service-categories\`, \`/api/services\`, \`/api/service-analytics\`, \`/api/category-mappings\`

| # | Method | Full URL | Authorization | Description & Purpose |
|---|---|---|---|---|
| 01 | \`GET\` | \`http://localhost:5000/api/service-categories\` | Authenticated | List all service categories (Facilities, IT, Utilities) |
| 02 | \`GET\` | \`http://localhost:5000/api/service-categories/:id\` | Authenticated | Fetch specific service category details |
| 03 | \`POST\` | \`http://localhost:5000/api/service-categories\` | Admin / Dept Manager | Create new service category |
| 04 | \`PUT\` | \`http://localhost:5000/api/service-categories/:id\` | Admin / Dept Manager | Update category name, code, description |
| 05 | \`DELETE\` | \`http://localhost:5000/api/service-categories/:id\` | Admin / Dept Manager | Soft-delete service category |
| 06 | \`GET\` | \`http://localhost:5000/api/services\` | Authenticated | List all active catalog services |
| 07 | \`GET\` | \`http://localhost:5000/api/services/metrics\` | Authenticated | Service catalog telemetry & ticket volumes |
| 08 | \`GET\` | \`http://localhost:5000/api/services/:id\` | Authenticated | Fetch single service item with SLA details |
| 09 | \`POST\` | \`http://localhost:5000/api/services\` | Admin / Dept Manager | Create catalog service item |
| 10 | \`PUT\` | \`http://localhost:5000/api/services/:id\` | Admin / Dept Manager | Update service item specifications |
| 11 | \`DELETE\` | \`http://localhost:5000/api/services/:id\` | Admin / Dept Manager | Soft-delete catalog service item |
| 12 | \`GET\` | \`http://localhost:5000/api/service-analytics/metrics\` | Authenticated | Service request velocity and resolution stats |
| 13 | \`GET\` | \`http://localhost:5000/api/category-mappings\` | Service.Read, Issue.Create | List tenant/department category routing rules |
| 14 | \`GET\` | \`http://localhost:5000/api/category-mappings/:id\` | Service.Read | Get specific mapping configuration |
| 15 | \`POST\` | \`http://localhost:5000/api/category-mappings\` | Service.Update, Dept.Update | Map service category to responsible department |
| 16 | \`PUT\` | \`http://localhost:5000/api/category-mappings/:id\` | Service.Update, Dept.Update | Modify category-department routing |
| 17 | \`PATCH\` | \`http://localhost:5000/api/category-mappings/:id/status\`| Service.Update, Dept.Update | Activate or deactivate category mapping rule |
| 18 | \`DELETE\` | \`http://localhost:5000/api/category-mappings/:id\` | Service.Update, Dept.Update | Delete category routing mapping |

---

## 2. Module 7: Issue Requests & Ticket Lifecycle (21 Endpoints)

Mounted at \`/api/issues\`, \`/api/issue-investigations\`, \`/api/issue-resolutions\`, \`/api/issue-comments\`

| # | Method | Full URL | Authorization | Description & Purpose |
|---|---|---|---|---|
| 19 | \`GET\` | \`http://localhost:5000/api/issues\` | Issue.Read (Scoped) | Query service tickets with filters (status, priority) |
| 20 | \`GET\` | \`http://localhost:5000/api/issues/metrics\` | Report.View, Issue.Read | High-level issue status & resolution telemetry |
| 21 | \`GET\` | \`http://localhost:5000/api/issues/:id\` | Issue.Read (Scoped) | Detailed request card with full audit timeline |
| 22 | \`POST\` | \`http://localhost:5000/api/issues\` | Issue.Create | Log new service request (triggers approval/routing) |
| 23 | \`PUT\` | \`http://localhost:5000/api/issues/:id\` | Issue.Update | Update issue description or estimated cost |
| 24 | \`POST\` | \`http://localhost:5000/api/issues/:id/assign\` | Issue.Assign | Assign issue to department or technician |
| 25 | \`POST\` | \`http://localhost:5000/api/issues/:id/status\` | Issue.Resolve, Issue.Update | Transition status (IN_PROGRESS, RESOLVED, etc.) |
| 26 | \`POST\` | \`http://localhost:5000/api/issues/:id/cancel\` | Issue.Cancel, Issue.Delete | Cancel service request with reason |
| 27 | \`POST\` | \`http://localhost:5000/api/issues/:id/reopen\` | Issue.Update | Reopen previously resolved or closed request |
| 28 | \`POST\` | \`http://localhost:5000/api/issues/:id/feedback\` | Issue.Read (Requester) | Submit 1–5 star rating and satisfaction feedback |
| 29 | \`GET\` | \`http://localhost:5000/api/issues/:id/feedback\` | Issue.Read | Retrieve tenant satisfaction survey feedback |
| 30 | \`DELETE\` | \`http://localhost:5000/api/issues/:id\` | Issue.Delete | Soft-delete issue request |
| 31 | \`GET\` | \`http://localhost:5000/api/issue-investigations/issue/:issueRequestId\` | Authenticated | Get technician root-cause investigation log |
| 32 | \`POST\` | \`http://localhost:5000/api/issue-investigations\` | Authenticated | Save diagnostic investigation notes |
| 33 | \`DELETE\` | \`http://localhost:5000/api/issue-investigations/:id\` | Authenticated | Remove diagnostic investigation record |
| 34 | \`GET\` | \`http://localhost:5000/api/issue-resolutions/issue/:issueRequestId\` | Authenticated | Retrieve technical resolution sign-off record |
| 35 | \`POST\` | \`http://localhost:5000/api/issue-resolutions\` | Authenticated | Record technical resolution and root cause codes |
| 36 | \`DELETE\` | \`http://localhost:5000/api/issue-resolutions/:id\` | Authenticated | Remove resolution record |
| 37 | \`GET\` | \`http://localhost:5000/api/issue-comments/issue/:issueRequestId\` | Issue.Read | Fetch chronological conversation comments |
| 38 | \`POST\` | \`http://localhost:5000/api/issue-comments\` | Issue.Update, Issue.Create | Post public or internal comment to ticket |
| 39 | \`DELETE\` | \`http://localhost:5000/api/issue-comments/:id\` | Issue.Delete | Remove comment |

---

## 3. Module 8: Approval Workflows & Managerial Decisions (25 Endpoints)

Mounted at \`/api/approvals\`, \`/api/approval-delegations\`, \`/api/approval-rules\`, \`/api/approval-groups\`

| # | Method | Full URL | Authorization | Description & Purpose |
|---|---|---|---|---|
| 40 | \`GET\` | \`http://localhost:5000/api/approvals\` | Authenticated | List all multi-stage approval workflows |
| 41 | \`GET\` | \`http://localhost:5000/api/approvals/metrics\` | Authenticated | Pending approvals count and clearance velocity |
| 42 | \`GET\` | \`http://localhost:5000/api/approvals/pending\` | Authenticated | Current actor's pending sign-off queue |
| 43 | \`GET\` | \`http://localhost:5000/api/approvals/by-request/:requestId\`| Authenticated | Get approval status for specific issue request |
| 44 | \`GET\` | \`http://localhost:5000/api/approvals/:id\` | Authenticated | View approval workflow stages and decisions |
| 45 | \`POST\` | \`http://localhost:5000/api/approvals\` | Issue.Create, Approval.Manage | Spawn multi-stage approval workflow |
| 46 | \`POST\` | \`http://localhost:5000/api/approvals/decision\` | Issue.Approve, Approval.Decide | Submit sign-off decision (APPROVED / REJECTED) |
| 47 | \`GET\` | \`http://localhost:5000/api/approval-delegations\` | Authenticated | List active authority delegation rules |
| 48 | \`GET\` | \`http://localhost:5000/api/approval-delegations/:id\` | Authenticated | Fetch specific delegation rule |
| 49 | \`POST\` | \`http://localhost:5000/api/approval-delegations\` | Authenticated | Delegate approval signing authority |
| 50 | \`PUT\` | \`http://localhost:5000/api/approval-delegations/:id\` | Authenticated | Update delegation date range or surrogate |
| 51 | \`DELETE\` | \`http://localhost:5000/api/approval-delegations/:id\` | Authenticated | Revoke authority delegation |
| 52 | \`GET\` | \`http://localhost:5000/api/approval-rules\` | Authenticated | List dynamic approval routing matrix rules |
| 53 | \`GET\` | \`http://localhost:5000/api/approval-rules/thresholds\`| Authenticated | List cost threshold rules for managerial sign-off |
| 54 | \`GET\` | \`http://localhost:5000/api/approval-rules/:id\` | Authenticated | Get approval matrix rule by ID |
| 55 | \`POST\` | \`http://localhost:5000/api/approval-rules/thresholds\`| Admin / Dept Manager | Create cost-based approval requirement |
| 56 | \`POST\` | \`http://localhost:5000/api/approval-rules\` | Admin / Dept Manager | Define dynamic approval matrix rule |
| 57 | \`PUT\` | \`http://localhost:5000/api/approval-rules/:id\` | Admin / Dept Manager | Update approval matrix rule |
| 58 | \`DELETE\` | \`http://localhost:5000/api/approval-rules/:id\` | Admin / Dept Manager | Delete approval matrix rule |
| 59 | \`GET\` | \`http://localhost:5000/api/approval-groups\` | Authenticated | List approval sign-off committees / groups |
| 60 | \`GET\` | \`http://localhost:5000/api/approval-groups/:id\` | Authenticated | Get approval group details and members |
| 61 | \`POST\` | \`http://localhost:5000/api/approval-groups\` | Admin / Dept Manager | Create approval group / board |
| 62 | \`PUT\` | \`http://localhost:5000/api/approval-groups/:id\` | Admin / Dept Manager | Update approval group details |
| 63 | \`POST\` | \`http://localhost:5000/api/approval-groups/:id/members\`| Admin / Dept Manager | Add voting member to approval group |
| 64 | \`DELETE\` | \`http://localhost:5000/api/approval-groups/:id/members/:userId\`| Admin / Dept Manager | Remove member from approval group |

---

## 4. Module 9: Technician Assignment & Dispatch Workbench (18 Endpoints)

Mounted at \`/api/dispatch\`

| # | Method | Full URL | Authorization | Description & Purpose |
|---|---|---|---|---|
| 65 | \`GET\` | \`http://localhost:5000/api/dispatch/overview\` | Issue.Assign, Report.View | Dispatcher overview telemetry & workforce status |
| 66 | \`GET\` | \`http://localhost:5000/api/dispatch/unassigned\` | Issue.Assign, Issue.Dispatch | Queue of approved requests awaiting technician |
| 67 | \`GET\` | \`http://localhost:5000/api/dispatch/assignments\` | Issue.Assign, Issue.Read | List active technician assignments |
| 68 | \`GET\` | \`http://localhost:5000/api/dispatch/assignments/:id\` | Issue.Assign, Issue.Read | Get assignment details by ID |
| 69 | \`POST\` | \`http://localhost:5000/api/dispatch/assign/manual\` | Issue.Assign, Issue.Dispatch | Manually assign technician to ticket |
| 70 | \`POST\` | \`http://localhost:5000/api/dispatch/assign/auto\` | Issue.Assign, Issue.Dispatch | Intelligent auto-assignment by workload & skill |
| 71 | \`POST\` | \`http://localhost:5000/api/dispatch/assignments/:id/accept\` | Issue.AcceptAssignment | Technician accepts dispatched work |
| 72 | \`POST\` | \`http://localhost:5000/api/dispatch/assignments/:id/reject\` | Issue.AcceptAssignment | Technician rejects assignment with reason |
| 73 | \`POST\` | \`http://localhost:5000/api/dispatch/assignments/:id/start\` | Issue.Update.Assigned | Clock-in: Technician starts on-site work |
| 74 | \`POST\` | \`http://localhost:5000/api/dispatch/assignments/:id/pause\` | Issue.Update.Assigned | Pause work (parts on order / tenant unavailable) |
| 75 | \`POST\` | \`http://localhost:5000/api/dispatch/assignments/:id/resume\` | Issue.Update.Assigned | Resume paused field work |
| 76 | \`POST\` | \`http://localhost:5000/api/dispatch/assignments/:id/progress\` | Issue.Update.Assigned | Update percent complete (0–100%) & work log |
| 77 | \`POST\` | \`http://localhost:5000/api/dispatch/assignments/:id/complete\` | Issue.Resolve | Complete job, record labor hours & close work |
| 78 | \`POST\` | \`http://localhost:5000/api/dispatch/assignments/:id/escalate\` | Issue.Escalate.Assigned | Escalate to senior specialist or supervisor |
| 79 | \`GET\` | \`http://localhost:5000/api/dispatch/my-workbench\` | Issue.Read.Assigned | Logged-in technician's personal work queue |
| 80 | \`GET\` | \`http://localhost:5000/api/dispatch/technicians\` | Issue.Assign, Dept.Read | Technicians roster, current load & availability |
| 81 | \`POST\` | \`http://localhost:5000/api/dispatch/technicians/availability\`| Issue.Read.Assigned | Toggle technician on-duty / off-duty / busy status |
| 82 | \`POST\` | \`http://localhost:5000/api/dispatch/technicians/location\` | Issue.Read.Assigned | Update technician physical campus location |

---

## 5. Module 10: SLA Policies, Target Monitoring & Escalations (11 Endpoints)

Mounted at \`/api/sla\`

| # | Method | Full URL | Authorization | Description & Purpose |
|---|---|---|---|---|
| 83 | \`GET\` | \`http://localhost:5000/api/sla/overview\` | Authenticated | SLA target compliance rate & breach statistics |
| 84 | \`GET\` | \`http://localhost:5000/api/sla/clocks\` | Authenticated | Real-time SLA response & resolution countdown clocks |
| 85 | \`GET\` | \`http://localhost:5000/api/sla/clocks/:id\` | Authenticated | View target deadlines & paused minutes for a clock |
| 86 | \`POST\` | \`http://localhost:5000/api/sla/clocks\` | Staff / Admin | Initialize SLA clock on request creation |
| 87 | \`POST\` | \`http://localhost:5000/api/sla/clocks/:id/pause\` | Staff / Admin | Pause clock (e.g. outside business calendar) |
| 88 | \`POST\` | \`http://localhost:5000/api/sla/clocks/:id/resume\` | Staff / Admin | Resume SLA clock countdown |
| 89 | \`GET\` | \`http://localhost:5000/api/sla/policies\` | Authenticated | List campus SLA target policies |
| 90 | \`GET\` | \`http://localhost:5000/api/sla/policies/:id\` | Authenticated | Get specific SLA policy targets |
| 91 | \`POST\` | \`http://localhost:5000/api/sla/policies\` | Admin Roles | Create SLA policy (Response & Resolution hours) |
| 92 | \`GET\` | \`http://localhost:5000/api/sla/breaches\` | Authenticated | List all breached and at-risk SLA clocks |
| 93 | \`POST\` | \`http://localhost:5000/api/sla/breaches/:id/acknowledge\`| Staff / Admin | Acknowledge breach & document mitigation |
`;

const outputPath = path.resolve(__dirname, '../docs/ITMS_MODULES_6_TO_10_ENDPOINTS.md');
fs.writeFileSync(outputPath, mdContent, 'utf-8');
console.log(`✅ Generated Modules 6 to 10 documentation at: ${outputPath}`);
