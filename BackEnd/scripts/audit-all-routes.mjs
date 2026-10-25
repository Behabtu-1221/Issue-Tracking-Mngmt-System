import fs from 'fs';
import path from 'path';

// Mapping of route files to their mounted base path in the application
const routeMounts = [
  // Health
  { file: 'src/shared/routes/health.routes.js', base: '/api/health', module: 'Module 1: System Health' },

  // Identity & Access
  { file: 'src/modules/identity-access/routes/auth.routes.js', base: '/api/auth', module: 'Module 2: Identity & Access - Auth' },
  { file: 'src/modules/identity-access/routes/user.routes.js', base: '/api/users', module: 'Module 2: Identity & Access - Users' },
  { file: 'src/modules/identity-access/routes/role.routes.js', base: '/api/roles', module: 'Module 2: Identity & Access - Roles' },

  // Business Park
  { file: 'src/modules/business-park/routes/park.routes.js', base: '/api/parks', module: 'Module 3: Business Park' },
  { file: 'src/modules/business-park/routes/building.routes.js', base: '/api/buildings', module: 'Module 3: Business Park' },
  { file: 'src/modules/business-park/routes/floor.routes.js', base: '/api/floors', module: 'Module 3: Business Park' },
  { file: 'src/modules/business-park/routes/office.routes.js', base: '/api/offices', module: 'Module 3: Business Park' },
  { file: 'src/modules/business-park/routes/location.routes.js', base: '/api/locations', module: 'Module 3: Business Park' },
  { file: 'src/modules/business-park/routes/facility-zone.routes.js', base: '/api/facility-zones', module: 'Module 3: Business Park' },
  { file: 'src/modules/business-park/routes/floor-plan.routes.js', base: '/api/floor-plans', module: 'Module 3: Business Park' },

  // Tenant Management
  { file: 'src/modules/tenant/routes/tenant.routes.js', base: '/api/tenants', module: 'Module 4: Tenants' },
  { file: 'src/modules/tenant/routes/sub-tenant.routes.js', base: '/api/sub-tenants', module: 'Module 4: Tenants' },
  { file: 'src/modules/tenant/routes/tenant-contact.routes.js', base: '/api/tenant-contacts', module: 'Module 4: Tenants' },
  { file: 'src/modules/tenant/routes/tenant-address.routes.js', base: '/api/tenant-addresses', module: 'Module 4: Tenants' },
  { file: 'src/modules/tenant/routes/lease.routes.js', base: '/api/leases', module: 'Module 4: Tenants' },
  { file: 'src/modules/tenant/routes/office-allocation.routes.js', base: '/api/office-allocations', module: 'Module 4: Tenants' },

  // Organization
  { file: 'src/modules/organization/routes/department.routes.js', base: '/api/departments', module: 'Module 5: Organization' },
  { file: 'src/modules/organization/routes/team.routes.js', base: '/api/teams', module: 'Module 5: Organization' },
  { file: 'src/modules/organization/routes/position.routes.js', base: '/api/positions', module: 'Module 5: Organization' },
  { file: 'src/modules/organization/routes/employee-assignment.routes.js', base: '/api/employee-assignments', module: 'Module 5: Organization' },
  { file: 'src/modules/organization/routes/reporting-hierarchy.routes.js', base: '/api/reporting-hierarchies', module: 'Module 5: Organization' },
  { file: 'src/modules/organization/routes/budget-cost-center.routes.js', base: '/api/financials', module: 'Module 5: Organization' },

  // Service Catalog
  { file: 'src/modules/service-catalog/routes/service-category.routes.js', base: '/api/service-categories', module: 'Module 6: Service Catalog' },
  { file: 'src/modules/service-catalog/routes/service.routes.js', base: '/api/services', module: 'Module 6: Service Catalog' },
  { file: 'src/modules/service-catalog/routes/service-analytics.routes.js', base: '/api/service-analytics', module: 'Module 6: Service Catalog' },
  { file: 'src/modules/service-catalog/routes/service-category-mapping.routes.js', base: '/api/category-mappings', module: 'Module 6: Service Catalog' },

  // Issue Management
  { file: 'src/modules/issue-management/routes/issue-request.routes.js', base: '/api/issues', module: 'Module 7: Issue Requests' },
  { file: 'src/modules/issue-management/routes/issue-investigation.routes.js', base: '/api/issue-investigations', module: 'Module 8: Investigations' },
  { file: 'src/modules/issue-management/routes/issue-resolution.routes.js', base: '/api/issue-resolutions', module: 'Module 8: Resolutions' },
  { file: 'src/modules/issue-management/routes/issue-comment.routes.js', base: '/api/issue-comments', module: 'Module 7: Issue Comments' },

  // Approval
  { file: 'src/modules/approval/routes/approval.routes.js', base: '/api/approvals', module: 'Module 10: Approvals' },
  { file: 'src/modules/approval/routes/approval-delegation.routes.js', base: '/api/approval-delegations', module: 'Module 10: Approvals' },
  { file: 'src/modules/approval/routes/approval-rule.routes.js', base: '/api/approval-rules', module: 'Module 10: Approvals' },
  { file: 'src/modules/approval/routes/approval-group.routes.js', base: '/api/approval-groups', module: 'Module 10: Approvals' },

  // Dispatch & SLA
  { file: 'src/modules/dispatch/routes/dispatch.routes.js', base: '/api/dispatch', module: 'Module 9: Dispatch & Workflow' },
  { file: 'src/modules/sla/routes/sla.routes.js', base: '/api/sla', module: 'Module 9: SLA Clocks & Policies' },

  // Communication
  { file: 'src/modules/communication/routes/communication.routes.js', base: '/api/communication', module: 'Module 11: Communication & Messaging' },

  // Notification
  { file: 'src/modules/notification/routes/notification.routes.js', base: '/api/notifications', module: 'Module 12: Notifications & Alerts' },

  // File & Document
  { file: 'src/modules/file-document/routes/file-document.routes.js', base: '/api/documents', module: 'Module 13: File & Document Management' },

  // Reporting
  { file: 'src/modules/reporting/routes/reporting.routes.js', base: '/api/reports', module: 'Module 14: Reporting & Analytics' },

  // Configuration Management
  { file: 'src/modules/configuration-management/routes/bootstrap.routes.js', base: '/api/configuration', module: 'Module 15: Configuration Management' },
  { file: 'src/modules/configuration-management/routes/systemSetting.routes.js', base: '/api/configuration', module: 'Module 15: Configuration Management' },
  { file: 'src/modules/configuration-management/routes/featureFlag.routes.js', base: '/api/configuration', module: 'Module 15: Configuration Management' },
  { file: 'src/modules/configuration-management/routes/businessRule.routes.js', base: '/api/configuration', module: 'Module 15: Configuration Management' },
  { file: 'src/modules/configuration-management/routes/numberSequence.routes.js', base: '/api/configuration', module: 'Module 15: Configuration Management' },
  { file: 'src/modules/configuration-management/routes/lookup.routes.js', base: '/api/configuration', module: 'Module 15: Configuration Management' },
  { file: 'src/modules/configuration-management/routes/lookupType.routes.js', base: '/api/configuration', module: 'Module 15: Configuration Management' },
  { file: 'src/modules/configuration-management/routes/calendar.routes.js', base: '/api/configuration', module: 'Module 15: Configuration Management' },
  { file: 'src/modules/configuration-management/routes/localization.routes.js', base: '/api/configuration', module: 'Module 15: Configuration Management' },
];

function parseRouteFile(filePath, basePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const routes = [];

  const routeRegex = /router\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]*)['"`]/gi;
  let match;
  while ((match = routeRegex.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    const routePath = match[2];
    const fullPath = (basePath + (routePath === '/' ? '' : (routePath.startsWith('/') ? routePath : '/' + routePath))).replace(/\/+/g, '/');
    routes.push({ method, fullPath });
  }

  // Also check router.route('...')
  const routeGroupRegex = /router\.route\s*\(\s*['"`]([^'"`]*)['"`]\)\s*\n?(\s*\.(get|post|put|patch|delete)\s*\([^)]*\))+/gi;
  // If any router.route is used, parse it
  return routes;
}

const allExtracted = [];
routeMounts.forEach(rm => {
  if (fs.existsSync(rm.file)) {
    const list = parseRouteFile(rm.file, rm.base);
    list.forEach(r => {
      allExtracted.push({
        ...r,
        module: rm.module,
        file: rm.file
      });
    });
  } else {
    console.warn(`File not found: ${rm.file}`);
  }
});

console.log(`Total parsed routes from all 50 files: ${allExtracted.length}`);

// Group by module
const byModule = {};
allExtracted.forEach(r => {
  byModule[r.module] = byModule[r.module] || [];
  byModule[r.module].push(r);
});

Object.keys(byModule).forEach(m => {
  console.log(`\n=== ${m} (${byModule[m].length} endpoints) ===`);
  byModule[m].forEach((r, i) => {
    console.log(`${(i+1).toString().padStart(2, '0')}. ${r.method.padEnd(8)} http://localhost:5000${r.fullPath}`);
  });
});
