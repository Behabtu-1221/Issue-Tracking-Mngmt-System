import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { reqItem } from './postman-builder-helpers.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getFullModules1To5() {
  // Read base collection
  const originalPath = path.resolve(__dirname, '../docs/postman/ITMS_Modules_1_to_5.postman_collection.json');
  const originalJson = JSON.parse(fs.readFileSync(originalPath, 'utf8'));
  const modules = originalJson.item;

  // Track existing to ensure idempotency
  const seen = new Set();
  function registerSeen(items) {
    for (const it of items) {
      if (it.request) {
        const key = it.request.method + ' ' + (it.request.url.raw || '').replace('{{baseUrl}}', 'http://localhost:5000').split('?')[0];
        seen.add(key);
      }
      if (it.item) registerSeen(it.item);
    }
  }
  registerSeen(modules);

  function pushIfNew(targetList, item) {
    const key = item.request.method + ' ' + (item.request.url.raw || '').replace('{{baseUrl}}', 'http://localhost:5000').split('?')[0];
    if (!seen.has(key)) {
      seen.add(key);
      targetList.push(item);
    }
  }

  // Module 2: Identity & Access Management (modules[1])
  const mod2 = modules[1];
  if (mod2 && mod2.item) {
    const usersFolder = mod2.item.find(f => f.name.includes('User Accounts') || f.name.includes('Users')) || mod2;
    const targetUsersList = usersFolder.item || mod2.item;
    pushIfNew(targetUsersList, reqItem({ name: 'Get User by ID', method: 'GET', url: 'http://localhost:5000/api/users/:id' }));
    pushIfNew(targetUsersList, reqItem({
      name: 'Update User Profile',
      method: 'PUT',
      url: 'http://localhost:5000/api/users/:id',
      body: { FirstName: 'Super', LastName: 'Administrator', Email: 'admin@enterprise.com', Phone: '+251911000000' }
    }));
    pushIfNew(targetUsersList, reqItem({
      name: 'Patch User Status (Activate/Deactivate)',
      method: 'PATCH',
      url: 'http://localhost:5000/api/users/:id/status',
      body: { isActive: true }
    }));
    pushIfNew(targetUsersList, reqItem({ name: 'Delete User Account', method: 'DELETE', url: 'http://localhost:5000/api/users/:id' }));
    pushIfNew(targetUsersList, reqItem({ name: 'List Active Sessions for User', method: 'GET', url: 'http://localhost:5000/api/users/:id/sessions' }));
    pushIfNew(targetUsersList, reqItem({ name: 'Revoke All Sessions for User', method: 'DELETE', url: 'http://localhost:5000/api/users/:id/sessions' }));
    pushIfNew(targetUsersList, reqItem({ name: 'Get User Login History & Audit', method: 'GET', url: 'http://localhost:5000/api/users/:id/login-history' }));

    const rolesFolder = mod2.item.find(f => f.name.includes('Roles') || f.name.includes('Security')) || mod2;
    const targetRolesList = rolesFolder.item || mod2.item;
    pushIfNew(targetRolesList, reqItem({
      name: 'Assign Role to User',
      method: 'POST',
      url: 'http://localhost:5000/api/roles/assign',
      body: { userId: 1, roleId: 1 }
    }));
    pushIfNew(targetRolesList, reqItem({ name: 'Get Role by ID', method: 'GET', url: 'http://localhost:5000/api/roles/:id' }));
    pushIfNew(targetRolesList, reqItem({
      name: 'Update Role Definition',
      method: 'PUT',
      url: 'http://localhost:5000/api/roles/:id',
      body: { roleName: 'PARK_OPERATIONS_MANAGER', description: 'Operations and facilities lead manager', roleLevel: 50 }
    }));
    pushIfNew(targetRolesList, reqItem({ name: 'Delete Role', method: 'DELETE', url: 'http://localhost:5000/api/roles/:id' }));
    pushIfNew(targetRolesList, reqItem({
      name: 'Update Role Permissions Matrix',
      method: 'PUT',
      url: 'http://localhost:5000/api/roles/:id/permissions',
      body: { permissionIds: [1, 2, 3, 4, 5, 10, 15] }
    }));
    pushIfNew(targetRolesList, reqItem({
      name: 'Assign User to Role',
      method: 'POST',
      url: 'http://localhost:5000/api/roles/users/:id/assign',
      body: { roleId: 1 }
    }));
    pushIfNew(targetRolesList, reqItem({ name: 'Remove Role from User', method: 'DELETE', url: 'http://localhost:5000/api/roles/users/:id/roles/:roleId' }));
  }

  // Module 3: Business Park & Facilities (modules[2])
  const mod3 = modules[2];
  if (mod3 && mod3.item) {
    pushIfNew(mod3.item, reqItem({ name: 'Get Business Park by ID', method: 'GET', url: 'http://localhost:5000/api/parks/:id' }));
    pushIfNew(mod3.item, reqItem({
      name: 'Create Business Park',
      method: 'POST',
      url: 'http://localhost:5000/api/parks',
      body: { ParkCode: 'BP_ADDIS_TECH', ParkName: 'Addis Technology Park', Description: 'Flagship innovation and software park', TotalLandAreaSqMeters: 500000.0, IsActive: 1 }
    }));
    pushIfNew(mod3.item, reqItem({
      name: 'Update Business Park',
      method: 'PUT',
      url: 'http://localhost:5000/api/parks/:id',
      body: { ParkName: 'Addis Technology & Innovation Park', TotalLandAreaSqMeters: 550000.0, IsActive: 1 }
    }));
    pushIfNew(mod3.item, reqItem({ name: 'Delete Business Park', method: 'DELETE', url: 'http://localhost:5000/api/parks/:id' }));
    pushIfNew(mod3.item, reqItem({ name: 'Get Building by ID', method: 'GET', url: 'http://localhost:5000/api/buildings/:id' }));
    pushIfNew(mod3.item, reqItem({ name: 'Get Floors in Building', method: 'GET', url: 'http://localhost:5000/api/buildings/:buildingId/floors' }));
    pushIfNew(mod3.item, reqItem({
      name: 'Update Building',
      method: 'PUT',
      url: 'http://localhost:5000/api/buildings/:id',
      body: { BuildingName: 'Building A (Technology Tower)', TotalFloors: 12, TotalAreaSqMeters: 18000.0, IsActive: 1 }
    }));
    pushIfNew(mod3.item, reqItem({ name: 'Delete Building', method: 'DELETE', url: 'http://localhost:5000/api/buildings/:id' }));
    pushIfNew(mod3.item, reqItem({ name: 'Get Floor by ID', method: 'GET', url: 'http://localhost:5000/api/floors/:id' }));
    pushIfNew(mod3.item, reqItem({ name: 'Get Offices on Floor', method: 'GET', url: 'http://localhost:5000/api/floors/:floorId/offices' }));
    pushIfNew(mod3.item, reqItem({
      name: 'Update Floor',
      method: 'PUT',
      url: 'http://localhost:5000/api/floors/:id',
      body: { FloorName: '2nd Floor - Innovation Hub', FloorAreaSqMeters: 1500.0, IsActive: 1 }
    }));
    pushIfNew(mod3.item, reqItem({ name: 'Delete Floor', method: 'DELETE', url: 'http://localhost:5000/api/floors/:id' }));
    pushIfNew(mod3.item, reqItem({ name: 'Get Office by ID', method: 'GET', url: 'http://localhost:5000/api/offices/:id' }));
    pushIfNew(mod3.item, reqItem({
      name: 'Update Office Suite',
      method: 'PUT',
      url: 'http://localhost:5000/api/offices/:id',
      body: { OfficeName: 'Suite 201-B', AreaSqMeters: 145.0, MaxOccupancy: 18, IsActive: 1 }
    }));
    pushIfNew(mod3.item, reqItem({
      name: 'Update Office Status',
      method: 'PATCH',
      url: 'http://localhost:5000/api/offices/:id/status',
      body: { status: 'OCCUPIED' }
    }));
    pushIfNew(mod3.item, reqItem({ name: 'Delete Office', method: 'DELETE', url: 'http://localhost:5000/api/offices/:id' }));
    pushIfNew(mod3.item, reqItem({ name: 'Get Location by ID', method: 'GET', url: 'http://localhost:5000/api/locations/:id' }));
    pushIfNew(mod3.item, reqItem({
      name: 'Update Campus Location',
      method: 'PUT',
      url: 'http://localhost:5000/api/locations/:id',
      body: { LocationName: 'East Gate Security & Visitor Plaza', LocationType: 'SECURITY', IsActive: 1 }
    }));
    pushIfNew(mod3.item, reqItem({ name: 'Delete Campus Location', method: 'DELETE', url: 'http://localhost:5000/api/locations/:id' }));
    pushIfNew(mod3.item, reqItem({ name: 'Get Facility Zone by ID', method: 'GET', url: 'http://localhost:5000/api/facility-zones/:id' }));
    pushIfNew(mod3.item, reqItem({ name: 'Get Buildings in Facility Zone', method: 'GET', url: 'http://localhost:5000/api/facility-zones/:zoneId/buildings' }));
    pushIfNew(mod3.item, reqItem({
      name: 'Create Facility Zone',
      method: 'POST',
      url: 'http://localhost:5000/api/facility-zones',
      body: { ParkID: 1, ZoneCode: 'ZONE_NORTH', ZoneName: 'North Technology Quad', ZoneType: 'COMMERCIAL', Description: 'Commercial tech cluster', IsActive: 1 }
    }));
    pushIfNew(mod3.item, reqItem({
      name: 'Update Facility Zone',
      method: 'PUT',
      url: 'http://localhost:5000/api/facility-zones/:id',
      body: { ZoneName: 'North Technology Innovation Quad', Description: 'Updated commercial cluster zone', IsActive: 1 }
    }));
    pushIfNew(mod3.item, reqItem({ name: 'Delete Facility Zone', method: 'DELETE', url: 'http://localhost:5000/api/facility-zones/:id' }));
    pushIfNew(mod3.item, reqItem({ name: 'Get Floor Plan Blueprint by Floor ID', method: 'GET', url: 'http://localhost:5000/api/floor-plans/floor/:floorId' }));
    pushIfNew(mod3.item, reqItem({
      name: 'Create Floor Plan Blueprint',
      method: 'POST',
      url: 'http://localhost:5000/api/floor-plans',
      body: { FloorID: 1, PlanName: 'Building A Floor 2 CAD Layout', FileUrl: '/uploads/floorplans/bldg_a_fl_2.pdf', ScaleRatio: '1:100', IsActive: 1 }
    }));
    pushIfNew(mod3.item, reqItem({
      name: 'Update Floor Plan Blueprint',
      method: 'PUT',
      url: 'http://localhost:5000/api/floor-plans/:id',
      body: { PlanName: 'Building A Floor 2 CAD Layout v2', ScaleRatio: '1:100', IsActive: 1 }
    }));
    pushIfNew(mod3.item, reqItem({ name: 'Delete Floor Plan Blueprint', method: 'DELETE', url: 'http://localhost:5000/api/floor-plans/:id' }));
  }

  // Module 4: Tenant Management (modules[3])
  const mod4 = modules[3];
  if (mod4 && mod4.item) {
    pushIfNew(mod4.item, reqItem({ name: 'Get Tenant by ID', method: 'GET', url: 'http://localhost:5000/api/tenants/:id' }));
    pushIfNew(mod4.item, reqItem({
      name: 'Update Corporate Tenant',
      method: 'PUT',
      url: 'http://localhost:5000/api/tenants/:id',
      body: { TenantName: 'Acme International Corporation', Industry: 'Information Technology', RegistrationNumber: 'REG-2026-9999', ContactEmail: 'info@acme.com', ContactPhone: '+251911002233', IsActive: 1 }
    }));
    pushIfNew(mod4.item, reqItem({
      name: 'Patch Tenant Status',
      method: 'PATCH',
      url: 'http://localhost:5000/api/tenants/:id/status',
      body: { status: 'ACTIVE' }
    }));
    pushIfNew(mod4.item, reqItem({ name: 'Delete Corporate Tenant', method: 'DELETE', url: 'http://localhost:5000/api/tenants/:id' }));
    pushIfNew(mod4.item, reqItem({ name: 'Get Sub-Tenant by ID', method: 'GET', url: 'http://localhost:5000/api/sub-tenants/:id' }));
    pushIfNew(mod4.item, reqItem({
      name: 'Update Sub-Tenant',
      method: 'PUT',
      url: 'http://localhost:5000/api/sub-tenants/:id',
      body: { SubTenantName: 'Acme Cloud Labs Branch', BusinessType: 'R&D', ContactPerson: 'Jane Doe', ContactEmail: 'jane.doe@acme.com', ContactPhone: '+251911445566', IsActive: 1 }
    }));
    pushIfNew(mod4.item, reqItem({ name: 'Delete Sub-Tenant', method: 'DELETE', url: 'http://localhost:5000/api/sub-tenants/:id' }));
    pushIfNew(mod4.item, reqItem({ name: 'Get Tenant Contact by ID', method: 'GET', url: 'http://localhost:5000/api/tenant-contacts/:id' }));
    pushIfNew(mod4.item, reqItem({
      name: 'Update Tenant Contact',
      method: 'PUT',
      url: 'http://localhost:5000/api/tenant-contacts/:id',
      body: { ContactName: 'Jane Smith', JobTitle: 'Senior Operations Director', Email: 'jane.smith@acme.com', Phone: '+251911223344', IsPrimary: 1, IsActive: 1 }
    }));
    pushIfNew(mod4.item, reqItem({ name: 'Delete Tenant Contact', method: 'DELETE', url: 'http://localhost:5000/api/tenant-contacts/:id' }));
    pushIfNew(mod4.item, reqItem({ name: 'Get Tenant Address by ID', method: 'GET', url: 'http://localhost:5000/api/tenant-addresses/:id' }));
    pushIfNew(mod4.item, reqItem({
      name: 'Update Tenant Address',
      method: 'PUT',
      url: 'http://localhost:5000/api/tenant-addresses/:id',
      body: { AddressLine1: 'Bole Sub-City, Road 4, Suite 300', City: 'Addis Ababa', PostalCode: '1000', Country: 'Ethiopia', IsPrimary: 1 }
    }));
    pushIfNew(mod4.item, reqItem({ name: 'Delete Tenant Address', method: 'DELETE', url: 'http://localhost:5000/api/tenant-addresses/:id' }));
    pushIfNew(mod4.item, reqItem({ name: 'Get Lease by ID', method: 'GET', url: 'http://localhost:5000/api/leases/:id' }));
    pushIfNew(mod4.item, reqItem({
      name: 'Update Lease Agreement',
      method: 'PUT',
      url: 'http://localhost:5000/api/leases/:id',
      body: { LeaseAgreementNumber: 'LSE-2026-001-A', MonthlyRent: 8500.0, SecurityDeposit: 25500.0, CurrencyCode: 'ETB', IsActive: 1 }
    }));
    pushIfNew(mod4.item, reqItem({
      name: 'Patch Lease Status',
      method: 'PATCH',
      url: 'http://localhost:5000/api/leases/:id/status',
      body: { status: 'ACTIVE' }
    }));
    pushIfNew(mod4.item, reqItem({ name: 'Delete Lease Agreement', method: 'DELETE', url: 'http://localhost:5000/api/leases/:id' }));
    pushIfNew(mod4.item, reqItem({ name: 'Get Office Allocation History', method: 'GET', url: 'http://localhost:5000/api/office-allocations/history' }));
    pushIfNew(mod4.item, reqItem({ name: 'Get Office Allocation by ID', method: 'GET', url: 'http://localhost:5000/api/office-allocations/:id' }));
    pushIfNew(mod4.item, reqItem({
      name: 'Release Office Allocation',
      method: 'PATCH',
      url: 'http://localhost:5000/api/office-allocations/:id/release',
      body: { releaseDate: '2026-10-31', notes: 'Lease expired; office vacated' }
    }));
    pushIfNew(mod4.item, reqItem({ name: 'Delete Office Allocation', method: 'DELETE', url: 'http://localhost:5000/api/office-allocations/:id' }));
  }

  // Module 5: Organizational Structure (modules[4])
  const mod5 = modules[4];
  if (mod5 && mod5.item) {
    pushIfNew(mod5.item, reqItem({ name: 'Get Department by ID', method: 'GET', url: 'http://localhost:5000/api/departments/:id' }));
    pushIfNew(mod5.item, reqItem({
      name: 'Update Department',
      method: 'PUT',
      url: 'http://localhost:5000/api/departments/:id',
      body: { DepartmentName: 'Facilities & Infrastructure Engineering', Description: 'Updated facilities operations and mechanical maintenance', IsActive: 1 }
    }));
    pushIfNew(mod5.item, reqItem({ name: 'Delete Department', method: 'DELETE', url: 'http://localhost:5000/api/departments/:id' }));
    pushIfNew(mod5.item, reqItem({ name: 'List Locations for Department', method: 'GET', url: 'http://localhost:5000/api/departments/:id/locations' }));
    pushIfNew(mod5.item, reqItem({
      name: 'Assign Location to Department',
      method: 'POST',
      url: 'http://localhost:5000/api/departments/:id/locations',
      body: { LocationID: 1, IsPrimary: 1 }
    }));
    pushIfNew(mod5.item, reqItem({ name: 'Remove Department Location Assignment', method: 'DELETE', url: 'http://localhost:5000/api/departments/locations/:locId' }));
    pushIfNew(mod5.item, reqItem({ name: 'Get Team by ID', method: 'GET', url: 'http://localhost:5000/api/teams/:id' }));
    pushIfNew(mod5.item, reqItem({
      name: 'Update Team',
      method: 'PUT',
      url: 'http://localhost:5000/api/teams/:id',
      body: { TeamName: 'Plumbing & Environmental Response Team', TeamLeadUserID: 1, IsActive: 1 }
    }));
    pushIfNew(mod5.item, reqItem({ name: 'Delete Team', method: 'DELETE', url: 'http://localhost:5000/api/teams/:id' }));
    pushIfNew(mod5.item, reqItem({ name: 'List Team Members', method: 'GET', url: 'http://localhost:5000/api/teams/:id/members' }));
    pushIfNew(mod5.item, reqItem({
      name: 'Add Member to Team',
      method: 'POST',
      url: 'http://localhost:5000/api/teams/:id/members',
      body: { UserID: 1, RoleInTeam: 'SPECIALIST', IsActive: 1 }
    }));
    pushIfNew(mod5.item, reqItem({ name: 'Remove Member from Team', method: 'DELETE', url: 'http://localhost:5000/api/teams/:id/members/:userId' }));
    pushIfNew(mod5.item, reqItem({ name: 'Get Position by ID', method: 'GET', url: 'http://localhost:5000/api/positions/:id' }));
    pushIfNew(mod5.item, reqItem({
      name: 'Update Position',
      method: 'PUT',
      url: 'http://localhost:5000/api/positions/:id',
      body: { PositionTitle: 'Lead Electrical & Systems Engineer', JobGrade: 'GRADE-10', IsActive: 1 }
    }));
    pushIfNew(mod5.item, reqItem({ name: 'Delete Position', method: 'DELETE', url: 'http://localhost:5000/api/positions/:id' }));
    pushIfNew(mod5.item, reqItem({ name: 'Get Employee Assignment by ID', method: 'GET', url: 'http://localhost:5000/api/employee-assignments/:id' }));
    pushIfNew(mod5.item, reqItem({
      name: 'Update Employee Assignment',
      method: 'PUT',
      url: 'http://localhost:5000/api/employee-assignments/:id',
      body: { AssignmentType: 'PRIMARY', EndDate: '2027-12-31', IsActive: 1 }
    }));
    pushIfNew(mod5.item, reqItem({ name: 'Delete Employee Assignment', method: 'DELETE', url: 'http://localhost:5000/api/employee-assignments/:id' }));
    pushIfNew(mod5.item, reqItem({ name: 'Get Reporting Hierarchy by ID', method: 'GET', url: 'http://localhost:5000/api/reporting-hierarchies/:id' }));
    pushIfNew(mod5.item, reqItem({
      name: 'Update Reporting Hierarchy',
      method: 'PUT',
      url: 'http://localhost:5000/api/reporting-hierarchies/:id',
      body: { HierarchyType: 'FUNCTIONAL_MANAGER', IsActive: 1 }
    }));
    pushIfNew(mod5.item, reqItem({ name: 'Delete Reporting Hierarchy', method: 'DELETE', url: 'http://localhost:5000/api/reporting-hierarchies/:id' }));
    pushIfNew(mod5.item, reqItem({ name: 'Get Cost Center by ID', method: 'GET', url: 'http://localhost:5000/api/financials/cost-centers/:id' }));
    pushIfNew(mod5.item, reqItem({
      name: 'Update Cost Center',
      method: 'PUT',
      url: 'http://localhost:5000/api/financials/cost-centers/:id',
      body: { CostCenterName: 'Campus Infrastructure & Clean Room Plant', IsActive: 1 }
    }));
    pushIfNew(mod5.item, reqItem({ name: 'Delete Cost Center', method: 'DELETE', url: 'http://localhost:5000/api/financials/cost-centers/:id' }));
    pushIfNew(mod5.item, reqItem({ name: 'Get Department Budget by ID', method: 'GET', url: 'http://localhost:5000/api/financials/budgets/:id' }));
    pushIfNew(mod5.item, reqItem({
      name: 'Update Department Budget Allocation',
      method: 'PUT',
      url: 'http://localhost:5000/api/financials/budgets/:id',
      body: { AllocatedAmount: 600000.0, IsActive: 1 }
    }));
    pushIfNew(mod5.item, reqItem({ name: 'Delete Department Budget', method: 'DELETE', url: 'http://localhost:5000/api/financials/budgets/:id' }));
  }

  return modules;
}
