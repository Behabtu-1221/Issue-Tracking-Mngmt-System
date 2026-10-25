import fs from 'fs';

const j = JSON.parse(fs.readFileSync('docs/postman/ITMS_Modules_1_to_5.postman_collection.json', 'utf8'));
const existing = new Set();

function collect(arr) {
  for (const x of arr) {
    if (x.request) {
      const m = x.request.method;
      let raw = x.request.url.raw || '';
      raw = raw.replace('{{baseUrl}}', 'http://localhost:5000').split('?')[0];
      existing.add(m + ' ' + raw);
    }
    if (x.item) collect(x.item);
  }
}
collect(j.item);

const mod1to5Files = [
  { file: 'src/shared/routes/health.routes.js', base: '/api/health', mod: 'Module 1' },
  { file: 'src/modules/identity-access/routes/auth.routes.js', base: '/api/auth', mod: 'Module 2' },
  { file: 'src/modules/identity-access/routes/user.routes.js', base: '/api/users', mod: 'Module 2' },
  { file: 'src/modules/identity-access/routes/role.routes.js', base: '/api/roles', mod: 'Module 2' },
  { file: 'src/modules/business-park/routes/park.routes.js', base: '/api/parks', mod: 'Module 3' },
  { file: 'src/modules/business-park/routes/building.routes.js', base: '/api/buildings', mod: 'Module 3' },
  { file: 'src/modules/business-park/routes/floor.routes.js', base: '/api/floors', mod: 'Module 3' },
  { file: 'src/modules/business-park/routes/office.routes.js', base: '/api/offices', mod: 'Module 3' },
  { file: 'src/modules/business-park/routes/location.routes.js', base: '/api/locations', mod: 'Module 3' },
  { file: 'src/modules/business-park/routes/facility-zone.routes.js', base: '/api/facility-zones', mod: 'Module 3' },
  { file: 'src/modules/business-park/routes/floor-plan.routes.js', base: '/api/floor-plans', mod: 'Module 3' },
  { file: 'src/modules/tenant/routes/tenant.routes.js', base: '/api/tenants', mod: 'Module 4' },
  { file: 'src/modules/tenant/routes/sub-tenant.routes.js', base: '/api/sub-tenants', mod: 'Module 4' },
  { file: 'src/modules/tenant/routes/tenant-contact.routes.js', base: '/api/tenant-contacts', mod: 'Module 4' },
  { file: 'src/modules/tenant/routes/tenant-address.routes.js', base: '/api/tenant-addresses', mod: 'Module 4' },
  { file: 'src/modules/tenant/routes/lease.routes.js', base: '/api/leases', mod: 'Module 4' },
  { file: 'src/modules/tenant/routes/office-allocation.routes.js', base: '/api/office-allocations', mod: 'Module 4' },
  { file: 'src/modules/organization/routes/department.routes.js', base: '/api/departments', mod: 'Module 5' },
  { file: 'src/modules/organization/routes/team.routes.js', base: '/api/teams', mod: 'Module 5' },
  { file: 'src/modules/organization/routes/position.routes.js', base: '/api/positions', mod: 'Module 5' },
  { file: 'src/modules/organization/routes/employee-assignment.routes.js', base: '/api/employee-assignments', mod: 'Module 5' },
  { file: 'src/modules/organization/routes/reporting-hierarchy.routes.js', base: '/api/reporting-hierarchies', mod: 'Module 5' },
  { file: 'src/modules/organization/routes/budget-cost-center.routes.js', base: '/api/financials', mod: 'Module 5' }
];

const needed = [];
mod1to5Files.forEach(f => {
  const content = fs.readFileSync(f.file, 'utf8');
  const routeRegex = /router\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]*)['"`]/gi;
  let m;
  while ((m = routeRegex.exec(content)) !== null) {
    const method = m[1].toUpperCase();
    const p = m[2];
    const full = (f.base + (p === '/' ? '' : (p.startsWith('/') ? p : '/' + p))).replace(/\/+/g, '/');
    const fullUrl = 'http://localhost:5000' + full;
    const key = method + ' ' + fullUrl;
    if (!existing.has(key)) {
      needed.push({ mod: f.mod, method, fullUrl });
    }
  }
});

console.log('Existing in JSON:', existing.size);
console.log('Total missing in Modules 1-5:', needed.length);
needed.forEach((n, i) => {
  console.log(`${(i+1).toString().padStart(2, '0')}. [${n.mod}] ${n.method.padEnd(7)} ${n.fullUrl}`);
});
