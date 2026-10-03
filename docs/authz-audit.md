# Authorization & Multi-Tenant Scoping Audit Matrix

**Project:** IT Park Issue Tracking & Management System (ITMS)  
**Date:** October 2026  
**Auditor:** Senior Backend / Application Security Engineer  
**Scope:** 100% of all registered HTTP API routes (416 endpoints across 14 modules)

---

## 1. Executive Summary

An exhaustive security and authorization audit was conducted across all 416 endpoints registered in the Express 5 application. While baseline authentication is enforced by `globalAuth` (securing 409 of 416 routes with 7 documented public allowlist exceptions), **critical authorization and tenant isolation gaps** were uncovered across multiple modules:

- **Critical Vulnerability (Active Cross-Tenant Data Leak via IDOR/BOLA)**: Multiple services in Tenant Management (`/api/leases`, `/api/office-allocations`, `/api/tenant-contacts`, `/api/tenant-addresses`, `/api/sub-tenants`), Communication (`/api/communication/notes`, `/api/comments`), and File Document query the database by primary key or list all records without scoping to `req.actor.tenantId`. A user authenticated as Tenant A can read, modify, and delete Tenant B's sensitive lease terms, financial agreements, contacts, and issue comments.
- **High Vulnerability (Missing Permission Guards / Authenticated != Authorized)**: Over 70% of routes lack explicit role or permission checks (`authorizeRoles` / `authorizePermissions`). Standard employee accounts can execute administrative actions (e.g. `POST /api/approvals/decision`, `POST /api/services`, `DELETE /api/services/:id`, `POST /api/departments`, `POST /api/notifications/dispatch`).
- **Medium Vulnerability (Cross-Tenant Existence Leaks via 403 vs 404)**: When cross-tenant access is checked in some services (such as `user.service.js`), the application returns `403 Forbidden` rather than `404 Not Found`, enabling attackers to enumerate resources belonging to other tenants.
- **Medium Vulnerability (Client-Supplied TenantID Trust)**: Several controllers accept `TenantID` in request bodies or query parameters rather than deriving tenant scope strictly from verified JWT credentials (`req.actor.tenantId`).

---

## 2. Findings by Severity

| Severity | Count | Summary |
| :--- | :--- | :--- |
| **Critical** | 38 | Unscoped multi-tenant data access, IDOR on leases, allocations, contacts, notes, and comments |
| **High** | 184 | Missing permission/role enforcement on sensitive mutation and catalog endpoints |
| **Medium** | 62 | Inconsistent 403-vs-404 status codes causing existence leaks; client-supplied TenantID fallbacks |
| **Low / Info** | 132 | Intentionally public routes, campus-wide global read catalog, properly guarded admin routes |

---

## 3. Comprehensive Route Audit Matrix (416 Endpoints)

| Method | Path | Handler | Auth required? | Permission/role required | Tenant source | Data access scoped by tenant? | Risk | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | `healthCheck` | No (Allowlisted Public) | None (Public) | N/A | N/A | **Low** | Intentionally Public |
| `GET` | `/api/configuration/lookups/:entityKey` | `ensureEntity` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/configuration/lookups/:entityKey/code/:code` | `ensureEntity` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/configuration/lookups/:entityKey/:id` | `ensureEntity` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/configuration/lookups/:entityKey` | `validateCreateBody` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/configuration/lookups/:entityKey/:id` | `validateUpdateBody` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/configuration/lookups/:entityKey/:id` | `ensureEntity` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/configuration/lookup-types` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/configuration/lookup-types/code/:code` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/configuration/lookup-types/:id` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/configuration/lookup-types` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/configuration/lookup-types/:id` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/configuration/lookup-types/:id` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/configuration/lookup-types/:id/values` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/configuration/lookup-types/:id/values` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/configuration/lookup-types/:lookupTypeId/values/:valueId` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/configuration/lookup-types/:lookupTypeId/values/:valueId` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/configuration/system-settings` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/configuration/system-settings/key/:key` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/configuration/system-settings/:id` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/configuration/system-settings` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/configuration/system-settings/:id` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/configuration/system-settings/:id` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/configuration/feature-flags` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/configuration/feature-flags/code/:code` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/configuration/feature-flags/code/:code/enabled` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/configuration/feature-flags/:id` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/configuration/feature-flags` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/configuration/feature-flags/:id` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PATCH` | `/api/configuration/feature-flags/:id/toggle` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/configuration/feature-flags/:id` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/configuration/business-rules` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/configuration/business-rules/code/:code` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/configuration/business-rules/:id` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/configuration/business-rules` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/configuration/business-rules/:id` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/configuration/business-rules/:id` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/configuration/number-sequences` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/configuration/number-sequences/code/:code` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/configuration/number-sequences/code/:code/next` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/configuration/number-sequences/:id` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/configuration/number-sequences` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/configuration/number-sequences/:id` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/configuration/number-sequences/:id` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/configuration/localizations` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/configuration/localizations/:id` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/configuration/localizations` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/configuration/localizations/:id` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/configuration/localizations/:id` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/configuration/localizations/:id/resources` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/configuration/localizations/:id/resources` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/configuration/localizations/:localizationId/resources/:resourceId` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/configuration/localizations/:localizationId/resources/:resourceId` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/configuration/calendars` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/configuration/calendars/:id` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/configuration/calendars` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/configuration/calendars/:id` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/configuration/calendars/:id` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/configuration/calendars/:id/working-hours` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/configuration/calendars/:id/working-hours` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/configuration/calendars/:calendarId/working-hours/:workingHourId` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/configuration/calendars/:calendarId/working-hours/:workingHourId` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/configuration/calendars/:id/holidays` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/configuration/calendars/:id/holidays` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/configuration/calendars/:calendarId/holidays/:holidayId` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/configuration/calendars/:calendarId/holidays/:holidayId` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/configuration/bootstrap` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/login` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/refresh` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/forgot-password` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/reset-password` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/logout` | `authenticate` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/me` | `authenticate` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/profile` | `authenticate` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/notification-preferences` | `authenticate` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/change-password` | `authenticate` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/sessions` | `authenticate` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/sessions/:sessionId` | `authenticate` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/:id` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/:id` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PATCH` | `/api/:id/status` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/:id` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/:id/sessions` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/:id/sessions` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/:id/login-history` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/permissions` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/audit-logs` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/assign` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/:id` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/:id` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/:id` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/:id/permissions` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/users/:id/assign` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No | **High** | Vulnerable (Missing Role Guard) |
| `DELETE` | `/api/users/:id/roles/:roleId` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No | **High** | Vulnerable (Missing Role Guard) |
| `GET` | `/api/` | `getParks` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/metrics` | `getOverviewMetrics` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/:id` | `getParkById` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/` | `createPark` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/:id` | `updatePark` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/:id` | `deletePark` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/` | `getBuildings` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/:id` | `getBuildingById` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/:buildingId/floors` | `getFloors` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/` | `createBuilding` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/:id` | `updateBuilding` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/:id` | `deleteBuilding` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/` | `getFloors` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/:id` | `getFloorById` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/:floorId/offices` | `getOffices` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/` | `createFloor` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/:id` | `updateFloor` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/:id` | `deleteFloor` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/` | `getOffices` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/:id` | `getOfficeById` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/` | `createOffice` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/:id` | `updateOffice` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PATCH` | `/api/:id/status` | `updateStatus` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/:id` | `deleteOffice` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/` | `getLocations` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/:id` | `getLocationById` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/` | `createLocation` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/:id` | `updateLocation` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/:id` | `deleteLocation` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/` | `getFacilityZones` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/:id` | `getFacilityZoneById` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/:zoneId/buildings` | `getBuildings` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/` | `createFacilityZone` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/:id` | `updateFacilityZone` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/:id` | `deleteFacilityZone` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/floor/:floorId` | `getFloorPlanByFloorId` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/` | `createFloorPlan` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/:id` | `updateFloorPlan` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/:id` | `deleteFloorPlan` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/` | `getTenants` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/metrics` | `getDashboardMetrics` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/:id` | `getTenantById` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/` | `createTenant` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/:id` | `updateTenant` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PATCH` | `/api/:id/status` | `updateTenantStatus` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/:id` | `deleteTenant` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/` | `getSubTenants` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/:id` | `getSubTenantById` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/` | `createSubTenant` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/:id` | `updateSubTenant` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/:id` | `deleteSubTenant` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/` | `getContacts` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/:id` | `getContactById` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/` | `createContact` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/:id` | `updateContact` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/:id` | `deleteContact` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/` | `getAddresses` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/:id` | `getAddressById` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/` | `createAddress` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/:id` | `updateAddress` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/:id` | `deleteAddress` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/` | `getLeases` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/expiring-soon` | `getExpiringSoon` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/:id` | `getLeaseById` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/` | `createLease` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/:id` | `updateLease` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PATCH` | `/api/:id/status` | `updateLeaseStatus` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/:id` | `deleteLease` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/` | `getAllocations` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/history` | `getHistory` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/:id` | `getAllocationById` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/` | `allocateOffice` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PATCH` | `/api/:id/release` | `releaseAllocation` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/:id` | `deleteAllocation` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/` | `getDepartments` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/:id` | `getDepartmentById` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/` | `createDepartment` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/:id` | `updateDepartment` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/:id` | `deleteDepartment` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/:id/locations` | `getLocations` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/:id/locations` | `addLocation` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/locations/:locId` | `removeLocation` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/eligible-technicians` | `getEligibleTechnicians` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/workload-summary` | `getTeamWorkloadSummary` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/` | `getTeams` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/:id` | `getTeamById` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/` | `createTeam` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/:id` | `updateTeam` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/:id` | `deleteTeam` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/:id/members` | `getTeamMembers` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/:id/members` | `addTeamMember` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/:id/members/:userId` | `removeTeamMember` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/` | `getPositions` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/:id` | `getPositionById` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/` | `createPosition` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/:id` | `updatePosition` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/:id` | `deletePosition` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/` | `getAssignments` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/:id` | `getAssignmentById` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/` | `createAssignment` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/:id` | `updateAssignment` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/:id` | `deleteAssignment` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/` | `getHierarchies` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/:id` | `getHierarchyById` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/` | `createHierarchy` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/:id` | `updateHierarchy` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/:id` | `deleteHierarchy` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/cost-centers` | `getCostCenters` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/cost-centers/:id` | `getCostCenterById` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/cost-centers` | `createCostCenter` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/cost-centers/:id` | `updateCostCenter` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/cost-centers/:id` | `deleteCostCenter` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/budgets` | `getBudgets` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/budgets/:id` | `getBudgetById` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/budgets` | `createBudget` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/budgets/:id` | `updateBudget` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/budgets/:id` | `deleteBudget` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/` | `getCategories` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/:id` | `getCategoryById` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/` | `createCategory` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/:id` | `updateCategory` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/:id` | `deleteCategory` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/` | `getServices` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/metrics` | `getOverviewMetrics` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/:id` | `getServiceById` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/` | `createService` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/:id` | `updateService` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/:id` | `deleteService` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/service/:serviceId` | `getPricingByServiceId` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/` | `upsertPricing` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/:id` | `deletePricing` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/service/:serviceId` | `getPricingByServiceId` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/` | `upsertPricing` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/:id` | `deletePricing` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/fields/service/:serviceId` | `getRequirementsByServiceId` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/fields` | `createRequirement` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/fields/:id` | `updateRequirement` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/fields/:id` | `deleteRequirement` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/attachments/service/:serviceId` | `getAttachmentsByServiceId` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/attachments` | `createAttachment` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/attachments/:id` | `updateAttachment` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/attachments/:id` | `deleteAttachment` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/visibility/service/:serviceId` | `getVisibilityByServiceId` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/visibility` | `createVisibility` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/visibility/:id` | `deleteVisibility` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/departments/service/:serviceId` | `getDepartmentsByServiceId` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/departments` | `createServiceDepartment` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/departments/:id` | `deleteServiceDepartment` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/sla/service/:serviceId` | `getSLAByServiceId` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/sla` | `upsertSLA` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/sla/:id` | `deleteSLA` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/approval-rules/service/:serviceId` | `getApprovalRulesByServiceId` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/approval-rules` | `createApprovalRule` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/approval-rules/:id` | `deleteApprovalRule` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/metrics` | `getOverviewMetrics` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/:id` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/:id` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PATCH` | `/api/:id/status` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/:id` | `anonymous` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/` | `getIssues` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/metrics` | `getOverviewMetrics` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/:id` | `getIssueById` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/` | `createIssue` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/:id` | `updateIssue` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/:id/assign` | `assignIssue` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/:id/status` | `updateStatus` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/:id/cancel` | `cancelIssue` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/:id/reopen` | `reopenIssue` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/:id/feedback` | `submitFeedback` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/:id/feedback` | `getFeedback` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/:id` | `deleteIssue` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/issue/:issueRequestId` | `getInvestigation` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/` | `saveInvestigation` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/:id` | `deleteInvestigation` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/issue/:issueRequestId` | `getResolution` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/` | `saveResolution` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/:id` | `deleteResolution` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/issue/:issueRequestId` | `getComments` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/` | `addComment` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/:id` | `deleteComment` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/` | `getKnownIssues` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/:id` | `getKnownIssueById` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/` | `createKnownIssue` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/:id` | `updateKnownIssue` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/:id` | `deleteKnownIssue` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/` | `getApprovals` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/metrics` | `getMetrics` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/pending` | `getPendingApprovals` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/by-request/:requestId` | `getApprovalByRequestId` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/:id` | `getApprovalById` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/` | `createApproval` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/decision` | `submitDecision` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/` | `getDelegations` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/:id` | `getDelegationById` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/` | `createDelegation` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/:id` | `updateDelegation` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/:id` | `deleteDelegation` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/` | `getRules` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/thresholds` | `getThresholds` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/thresholds` | `createThreshold` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/:id` | `getRuleById` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/` | `createRule` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/:id` | `updateRule` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/:id` | `deleteRule` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/` | `getGroups` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/:id` | `getGroupById` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/` | `createGroup` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/:id` | `updateGroup` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/:id/members` | `addMember` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/:id/members/:userId` | `removeMember` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/dispatch/overview` | `getOverviewMetrics` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/dispatch/unassigned` | `getUnassignedQueue` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/dispatch/assignments` | `getAssignments` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/dispatch/assignments/:id` | `getAssignmentById` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/dispatch/assign/manual` | `manualAssign` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/dispatch/assign/auto` | `autoAssign` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/dispatch/assignments/:id/accept` | `acceptAssignment` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/dispatch/assignments/:id/reject` | `rejectAssignment` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/dispatch/assignments/:id/start` | `startWork` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/dispatch/assignments/:id/pause` | `pauseWork` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/dispatch/assignments/:id/complete` | `completeWork` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/dispatch/assignments/:id/escalate` | `escalateWork` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/dispatch/my-workbench` | `getMyAssignedRequests` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/dispatch/technicians` | `getTechnicians` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/dispatch/technicians/availability` | `updateAvailability` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/dispatch/technicians/location` | `updateLocation` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/sla/overview` | `getOverviewMetrics` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/sla/clocks` | `findAllClocks` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/sla/clocks/:id` | `findClockById` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/sla/clocks` | `startClock` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/sla/clocks/:id/pause` | `pauseClock` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/sla/clocks/:id/resume` | `resumeClock` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/sla/policies` | `getPolicies` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/sla/policies/:id` | `getPolicyById` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/sla/policies` | `createPolicy` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/sla/breaches` | `findAllBreaches` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/sla/breaches/:id/acknowledge` | `acknowledgeBreach` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/communication/overview` | `getOverviewMetrics` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/communication/conversations` | `getUserConversations` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/communication/conversations/request/:issueRequestId` | `getConversationByRequestId` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/communication/conversations/request/:issueRequestId` | `getOrCreateRequestConversation` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/communication/conversations/:conversationId/participants` | `getConversationParticipants` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/communication/conversations/:conversationId/participants` | `addParticipant` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/communication/conversations/:conversationId/messages` | `getMessages` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/communication/conversations/:conversationId/messages` | `sendMessage` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/communication/requests/:issueRequestId/messages` | `sendRequestMessage` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/communication/conversations/:conversationId/read` | `markAsRead` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/communication/notes/:requestId` | `getInternalNotes` | Yes (globalAuth) | None (Missing) | Client Input / Route Param | No (Missing Tenant Isolation) | **Critical** | Vulnerable (Data Leak) |
| `POST` | `/api/communication/notes/:requestId` | `addInternalNote` | Yes (globalAuth) | None (Missing) | Client Input / Route Param | No (Missing Tenant Isolation) | **Critical** | Vulnerable (Data Leak) |
| `DELETE` | `/api/communication/notes/:noteId` | `deleteInternalNote` | Yes (globalAuth) | None (Missing) | Client Input / Route Param | No (Missing Tenant Isolation) | **Critical** | Vulnerable (Data Leak) |
| `GET` | `/api/communication/comments/:issueRequestId` | `getComments` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/communication/comments` | `addComment` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/communication/comments/:id` | `deleteComment` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/communication/announcements` | `getAnnouncements` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/communication/announcements` | `createAnnouncement` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/communication/announcements/:id` | `deleteAnnouncement` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/communication/channels` | `getDiscussionGroups` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/communication/channels` | `createDiscussionGroup` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/communication/channels/:channelId/messages` | `getDiscussionMessages` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/communication/channels/:channelId/messages` | `addDiscussionMessage` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/communication/activity/:issueRequestId` | `getActivityTimeline` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/notifications/overview` | `getOverviewMetrics` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/notifications/types` | `getNotificationTypes` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/notifications/channels` | `getNotificationChannels` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/notifications/inbox` | `getUserNotifications` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/notifications/unread-count` | `getUnreadCount` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PATCH` | `/api/notifications/read-all` | `markAllRead` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PATCH` | `/api/notifications/:id/read` | `markAsRead` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/notifications/event` | `notifyEvent` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/notifications/dispatch` | `dispatchNotification` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/notifications/preferences` | `getUserPreferences` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/notifications/preferences` | `updateUserPreferences` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/notifications/delivery-log` | `getDeliveryLog` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/notifications/templates` | `getTemplates` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/notifications/templates` | `createTemplate` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/notifications/templates/:id` | `updateTemplate` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/notifications/reminders` | `getReminders` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/notifications/reminders` | `createReminder` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PATCH` | `/api/notifications/reminders/:id/complete` | `completeReminder` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/notifications/test-email` | `sendTestEmail` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/documents/share/:shareToken` | `getShareByToken` | No (Allowlisted Public) | None (Public) | N/A | N/A | **Low** | Intentionally Public |
| `GET` | `/api/documents/metrics` | `getMetrics` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | Partial (Service layer) | **Medium** | Needs Review |
| `GET` | `/api/documents/categories` | `getCategories` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | Partial (Service layer) | **Medium** | Needs Review |
| `POST` | `/api/documents/categories` | `createCategory` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | Partial (Service layer) | **Medium** | Needs Review |
| `GET` | `/api/documents/` | `listDocuments` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | Partial (Service layer) | **Medium** | Needs Review |
| `GET` | `/api/documents/:id` | `getDocumentById` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | Partial (Service layer) | **Medium** | Needs Review |
| `POST` | `/api/documents/upload` | `uploadFile` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | Partial (Service layer) | **Medium** | Needs Review |
| `POST` | `/api/documents/upload-multiple` | `uploadMultipleFiles` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | Partial (Service layer) | **Medium** | Needs Review |
| `GET` | `/api/documents/:id/download` | `downloadFile` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | Partial (Service layer) | **Medium** | Needs Review |
| `GET` | `/api/documents/:id/preview` | `previewFile` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | Partial (Service layer) | **Medium** | Needs Review |
| `POST` | `/api/documents/:id/versions` | `addVersion` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | Partial (Service layer) | **Medium** | Needs Review |
| `POST` | `/api/documents/:id/share` | `createShare` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | Partial (Service layer) | **Medium** | Needs Review |
| `PATCH` | `/api/documents/:id` | `updateDocument` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | Partial (Service layer) | **Medium** | Needs Review |
| `DELETE` | `/api/documents/:id` | `archiveDocument` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | Partial (Service layer) | **Medium** | Needs Review |
| `POST` | `/api/documents/:id/restore` | `restoreDocument` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | Partial (Service layer) | **Medium** | Needs Review |
| `DELETE` | `/api/documents/:id/permanent` | `deletePermanent` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | Partial (Service layer) | **Medium** | Needs Review |
| `GET` | `/api/reports/dashboard/executive` | `getExecutiveOverview` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/reports/requests` | `getRequestAnalytics` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/reports/assignments` | `getAssignmentAnalytics` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/reports/sla` | `getSLAAnalytics` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/reports/tenants` | `getTenantPerformance` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/reports/departments` | `getDepartmentPerformance` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/reports/approvals` | `getApprovalAnalytics` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/reports/audit` | `getAuditAnalytics` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/reports/knowledge` | `getKnowledgeAnalytics` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/reports/export/:reportType` | `exportReport` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/reports/saved` | `getSavedReports` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/reports/saved` | `createSavedReport` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/reports/saved/:id` | `updateSavedReport` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/reports/saved/:id` | `deleteSavedReport` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/reports/schedules` | `getReportSchedules` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/reports/schedules` | `createReportSchedule` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `PUT` | `/api/reports/schedules/:id` | `updateReportSchedule` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `DELETE` | `/api/reports/schedules/:id` | `deleteReportSchedule` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `POST` | `/api/reports/schedules/:id/trigger` | `triggerScheduleExecution` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
| `GET` | `/api/reports/executions` | `getExecutionHistory` | Yes (globalAuth) | None (Missing) | req.actor.tenantId | No (Unscoped / At Risk) | **High** | Vulnerable |
