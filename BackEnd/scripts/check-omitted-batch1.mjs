import fs from 'fs';

// Read 80 endpoints
const t80 = fs.readFileSync('docs/ITMS_80_ENDPOINTS_METHOD_AND_URL.txt', 'utf8');
const lines80 = t80.split('\n')
  .filter(l => /^\d+\.\s+[A-Z]+/.test(l))
  .map(l => {
    const parts = l.trim().split(/\s+/);
    return parts[1] + ' ' + parts[2];
  });
const set80 = new Set(lines80);

const mod1to5Files = [
  { file: 'src/shared/routes/health.routes.js', base: '/api/health', mod: 'Module 1: System Health' },
  { file: 'src/modules/identity-access/routes/auth.routes.js', base: '/api/auth', mod: 'Module 2: Identity (Auth)' },
  { file: 'src/modules/identity-access/routes/user.routes.js', base: '/api/users', mod: 'Module 2: Identity (Users)' },
  { file: 'src/modules/identity-access/routes/role.routes.js', base: '/api/roles', mod: 'Module 2: Identity (Roles)' },
  { file: 'src/modules/business-park/routes/park.routes.js', base: '/api/parks', mod: 'Module 3: Parks' },
  { file: 'src/modules/business-park/routes/building.routes.js', base: '/api/buildings', mod: 'Module 3: Buildings' },
  { file: 'src/modules/business-park/routes/floor.routes.js', base: '/api/floors', mod: 'Module 3: Floors' },
  { file: 'src/modules/business-park/routes/office.routes.js', base: '/api/offices', mod: 'Module 3: Offices' },
  { file: 'src/modules/business-park/routes/location.routes.js', base: '/api/locations', mod: 'Module 3: Locations' },
  { file: 'src/modules/business-park/routes/facility-zone.routes.js', base: '/api/facility-zones', mod: 'Module 3: Facility Zones' },
  { file: 'src/modules/business-park/routes/floor-plan.routes.js', base: '/api/floor-plans', mod: 'Module 3: Floor Plans' },
  { file: 'src/modules/tenant/routes/tenant.routes.js', base: '/api/tenants', mod: 'Module 4: Tenants' },
  { file: 'src/modules/tenant/routes/sub-tenant.routes.js', base: '/api/sub-tenants', mod: 'Module 4: Sub-Tenants' },
  { file: 'src/modules/tenant/routes/tenant-contact.routes.js', base: '/api/tenant-contacts', mod: 'Module 4: Tenant Contacts' },
  { file: 'src/modules/tenant/routes/tenant-address.routes.js', base: '/api/tenant-addresses', mod: 'Module 4: Tenant Addresses' },
  { file: 'src/modules/tenant/routes/lease.routes.js', base: '/api/leases', mod: 'Module 4: Leases' },
  { file: 'src/modules/tenant/routes/office-allocation.routes.js', base: '/api/office-allocations', mod: 'Module 4: Office Allocations' },
  { file: 'src/modules/organization/routes/department.routes.js', base: '/api/departments', mod: 'Module 5: Departments' },
  { file: 'src/modules/organization/routes/team.routes.js', base: '/api/teams', mod: 'Module 5: Teams' },
  { file: 'src/modules/organization/routes/position.routes.js', base: '/api/positions', mod: 'Module 5: Positions' },
  { file: 'src/modules/organization/routes/employee-assignment.routes.js', base: '/api/employee-assignments', mod: 'Module 5: Employee Assignments' },
  { file: 'src/modules/organization/routes/reporting-hierarchy.routes.js', base: '/api/reporting-hierarchies', mod: 'Module 5: Reporting Hierarchies' },
  { file: 'src/modules/organization/routes/budget-cost-center.routes.js', base: '/api/financials', mod: 'Module 5: Financials' }
];

function parse(file, base) {
  const content = fs.readFileSync(file, 'utf8');
  const routeRegex = /router\.(get|post|put|patch|delete)\s*\(\s*['\x22`]([^'\x22`]*)['\x22`]/gi;
  const list = [];
  let m;
  while ((m = routeRegex.exec(content)) !== null) {
    const method = m[1].toUpperCase();
    const p = m[2];
    const full = (base + (p === '/' ? '' : (p.startsWith('/') ? p : '/' + p))).replace(/\/+/g, '/');
    list.push({ method, full: 'http://localhost:5000' + full });
  }
  return list;
}

const missingFromBatch1 = [];
mod1to5Files.forEach(f => {
  const routes = parse(f.file, f.base);
  routes.forEach(r => {
    const key = r.method + ' ' + r.full;
    if (!set80.has(key)) {
      missingFromBatch1.push({ ...r, mod: f.mod });
    }
  });
});

console.log('Total omitted from Batch 1 (80):', missingFromBatch1.length);
missingFromBatch1.forEach((r, i) => {
  console.log(`${(i+1).toString().padStart(2, '0')}. [${r.mod}] ${r.method.padEnd(7)} ${r.full}`);
});
