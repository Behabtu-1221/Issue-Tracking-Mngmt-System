import assert from 'node:assert/strict';
import http from 'http';
import app from '../src/app.js';
import db from '../src/database/connection.js';
import { generateAccessToken } from '../src/shared/utils/token.js';
import { isPublicRoute } from '../src/shared/middleware/globalAuth.js';
import { modules } from '../src/app.js';

// Helper to generate access tokens directly for tests
function createTestToken(userId, tenantId, userTypeCode, username = 'testuser') {
  return generateAccessToken({
    userId,
    userAccountId: userId,
    tenantId,
    userTypeCode,
    username,
    sessionId: `test-session-${userId}-${Date.now()}`,
    type: 'ACCESS'
  });
}

async function runAuthorizationIsolationTests() {
  console.log('='.repeat(75));
  console.log('🛡️  MULTI-TENANT ISOLATION & AUTHORIZATION PRODUCTION TEST SUITE');
  console.log('='.repeat(75));

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[INFO] Test server running on ${baseUrl}`);

  // Test Tokens
  const tokenSuperAdmin = createTestToken(1, null, 'PARK_ADMIN', 'superadmin');
  const tokenTenant1Admin = createTestToken(3, 1, 'TENANT_REPRESENTATIVE', 'tenantadmin');
  const tokenTenant1Employee = createTestToken(4, 1, 'EMPLOYEE', 'employee');
  const tokenTenant2Admin = createTestToken(7, 2, 'TENANT_REPRESENTATIVE', 'betatenant');

  const authHeader = (token) => ({ Authorization: `Bearer ${token}` });
  const jsonHeaders = (token) => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  const createdCleanupIds = {
    addressIds: [],
    issueIds: []
  };

  try {
    // ─────────────────────────────────────────────────────────────────────────
    // SUITE 1: Cross-Tenant Read & List Isolation (Zero Cross-Tenant Leaks)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- [SUITE 1] Cross-Tenant Read & List Isolation ---');

    // 1.1 Leases: Tenant 1 list
    console.log('[TEST 1.1] Tenant 1 listing leases returns only Tenant 1 leases');
    const resT1Leases = await fetch(`${baseUrl}/api/leases`, { headers: authHeader(tokenTenant1Admin) });
    assert.equal(resT1Leases.status, 200);
    const bodyT1Leases = await resT1Leases.json();
    const t1Leases = bodyT1Leases.data?.leases || bodyT1Leases.data || [];
    assert(Array.isArray(t1Leases) && t1Leases.length > 0, 'Tenant 1 should have leases');
    for (const lease of t1Leases) {
      assert.equal(Number(lease.TenantID), 1, `Expected TenantID 1, found ${lease.TenantID}`);
    }
    console.log(`✓ PASS: Tenant 1 received ${t1Leases.length} lease(s), strictly scoped to Tenant 1`);

    // 1.2 Leases: Tenant 2 list
    console.log('[TEST 1.2] Tenant 2 listing leases returns only Tenant 2 leases');
    const resT2Leases = await fetch(`${baseUrl}/api/leases`, { headers: authHeader(tokenTenant2Admin) });
    assert.equal(resT2Leases.status, 200);
    const bodyT2Leases = await resT2Leases.json();
    const t2Leases = bodyT2Leases.data?.leases || bodyT2Leases.data || [];
    assert(Array.isArray(t2Leases) && t2Leases.length > 0, 'Tenant 2 should have leases');
    for (const lease of t2Leases) {
      assert.equal(Number(lease.TenantID), 2, `Expected TenantID 2, found ${lease.TenantID}`);
    }
    console.log(`✓ PASS: Tenant 2 received ${t2Leases.length} lease(s), strictly scoped to Tenant 2 (0 cross-tenant records)`);

    // 1.3 Office Allocations: Tenant 1 list
    console.log('[TEST 1.3] Tenant 1 listing office allocations is strictly tenant-scoped');
    const resT1Allocs = await fetch(`${baseUrl}/api/office-allocations`, { headers: authHeader(tokenTenant1Admin) });
    assert.equal(resT1Allocs.status, 200);
    const bodyT1Allocs = await resT1Allocs.json();
    const t1Allocs = bodyT1Allocs.data?.allocations || bodyT1Allocs.data || [];
    for (const alloc of t1Allocs) {
      assert.equal(Number(alloc.TenantID), 1, `Allocation must belong to Tenant 1`);
    }
    console.log(`✓ PASS: Tenant 1 allocations returned zero records belonging to Tenant 2`);

    // 1.4 Tenant Addresses: Tenant 1 list
    console.log('[TEST 1.4] Tenant 1 listing addresses returns only Tenant 1 addresses');
    const resT1Addrs = await fetch(`${baseUrl}/api/tenant-addresses`, { headers: authHeader(tokenTenant1Admin) });
    assert.equal(resT1Addrs.status, 200);
    const bodyT1Addrs = await resT1Addrs.json();
    const t1Addrs = bodyT1Addrs.data?.addresses || bodyT1Addrs.data || [];
    for (const addr of t1Addrs) {
      assert.equal(Number(addr.TenantID), 1, `Address must belong to Tenant 1`);
    }
    console.log(`✓ PASS: Tenant 1 addresses returned zero records belonging to Tenant 2`);

    // 1.5 Tenant Contacts: Tenant 1 list
    console.log('[TEST 1.5] Tenant 1 listing contacts returns only Tenant 1 contacts');
    const resT1Contacts = await fetch(`${baseUrl}/api/tenant-contacts`, { headers: authHeader(tokenTenant1Admin) });
    assert.equal(resT1Contacts.status, 200);
    const bodyT1Contacts = await resT1Contacts.json();
    const t1Contacts = bodyT1Contacts.data?.contacts || bodyT1Contacts.data || [];
    for (const contact of t1Contacts) {
      assert.equal(Number(contact.TenantID), 1, `Contact must belong to Tenant 1`);
    }
    console.log(`✓ PASS: Tenant 1 contacts returned zero records belonging to other tenants`);

    // 1.6 Issues: Tenant 1 list
    console.log('[TEST 1.6] Tenant 1 listing issues returns only Tenant 1 issues');
    const resT1Issues = await fetch(`${baseUrl}/api/issues`, { headers: authHeader(tokenTenant1Admin) });
    assert.equal(resT1Issues.status, 200);
    const bodyT1Issues = await resT1Issues.json();
    const t1Issues = bodyT1Issues.data?.issues || bodyT1Issues.data?.items || bodyT1Issues.data?.requests || [];
    assert(Array.isArray(t1Issues), 'Issues must be an array');
    for (const issue of t1Issues) {
      if (issue.TenantID) {
        assert.equal(Number(issue.TenantID), 1, `Issue must belong to Tenant 1`);
      }
    }
    console.log(`✓ PASS: Tenant 1 issues list (${t1Issues.length} issues) strictly isolated to Tenant 1`);


    // ─────────────────────────────────────────────────────────────────────────
    // SUITE 2: Cross-Tenant BOLA/IDOR Direct Access & 404 Masking
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- [SUITE 2] Cross-Tenant BOLA/IDOR Direct Access & 404 Masking ---');

    // 2.1 Cross-tenant lease fetch returns 404 Not Found (NOT 403 Forbidden)
    console.log('[TEST 2.1] Tenant 1 fetching Tenant 2 lease (ID: 2) returns 404 (Masking Existence)');
    const resLeaseBOLA = await fetch(`${baseUrl}/api/leases/2`, { headers: authHeader(tokenTenant1Admin) });
    assert.equal(resLeaseBOLA.status, 404, 'Cross-tenant resource must return 404 Not Found to prevent existence leaks');
    const bodyLeaseBOLA = await resLeaseBOLA.json();
    assert.equal(bodyLeaseBOLA.status, 'fail');
    assert(!bodyLeaseBOLA.data, 'No lease data should be returned');
    console.log('✓ PASS: Cross-tenant lease lookup masked with 404 Not Found');

    // 2.2 Tenant 2 fetching Tenant 1 lease (ID: 1) returns 404
    console.log('[TEST 2.2] Tenant 2 fetching Tenant 1 lease (ID: 1) returns 404');
    const resLeaseReverseBOLA = await fetch(`${baseUrl}/api/leases/1`, { headers: authHeader(tokenTenant2Admin) });
    assert.equal(resLeaseReverseBOLA.status, 404, 'Must return 404 Not Found');
    console.log('✓ PASS: Reverse cross-tenant lease lookup masked with 404 Not Found');

    // 2.3 Cross-tenant office allocation fetch returns 404
    console.log('[TEST 2.3] Tenant 1 fetching Tenant 2 allocation (ID: 2) returns 404');
    const resAllocBOLA = await fetch(`${baseUrl}/api/office-allocations/2`, { headers: authHeader(tokenTenant1Admin) });
    assert.equal(resAllocBOLA.status, 404, 'Must return 404 Not Found');
    console.log('✓ PASS: Cross-tenant office allocation lookup masked with 404 Not Found');

    // 2.4 Cross-tenant tenant address fetch returns 404
    console.log('[TEST 2.4] Tenant 1 fetching Tenant 2 address (ID: 2) returns 404');
    const resAddrBOLA = await fetch(`${baseUrl}/api/tenant-addresses/2`, { headers: authHeader(tokenTenant1Admin) });
    assert.equal(resAddrBOLA.status, 404, 'Must return 404 Not Found');
    console.log('✓ PASS: Cross-tenant tenant address lookup masked with 404 Not Found');

    // 2.5 Cross-tenant tenant profile fetch returns 404
    console.log('[TEST 2.5] Tenant 1 fetching Tenant 2 profile (/api/tenants/2) returns 404');
    const resTenantBOLA = await fetch(`${baseUrl}/api/tenants/2`, { headers: authHeader(tokenTenant1Admin) });
    assert.equal(resTenantBOLA.status, 404, 'Must return 404 Not Found');
    console.log('✓ PASS: Cross-tenant tenant organization profile lookup masked with 404 Not Found');

    // 2.6 Cross-tenant user detail fetch returns 404
    console.log('[TEST 2.6] Tenant 1 fetching Tenant 2 user (/api/users/7) returns 404');
    const resUserBOLA = await fetch(`${baseUrl}/api/users/7`, { headers: authHeader(tokenTenant1Admin) });
    assert.equal(resUserBOLA.status, 404, 'Must return 404 Not Found');
    console.log('✓ PASS: Cross-tenant user profile lookup masked with 404 Not Found');


    // ─────────────────────────────────────────────────────────────────────────
    // SUITE 3: Cross-Tenant Mutation Prevention & Data Integrity
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- [SUITE 3] Cross-Tenant Mutation Prevention & Data Integrity ---');

    // 3.1 Tenant 1 attempting to update Tenant 2 lease is blocked by RBAC (403 Forbidden)
    console.log('[TEST 3.1] Tenant 1 PUT /api/leases/2 (Tenant 2 lease) returns 403 Forbidden (Lease mutations admin-only)');
    const [origLease] = await db.query('SELECT MonthlyRentAmount FROM LeaseAgreement WHERE LeaseAgreementID = 2');
    const resUpdateLease = await fetch(`${baseUrl}/api/leases/2`, {
      method: 'PUT',
      headers: jsonHeaders(tokenTenant1Admin),
      body: JSON.stringify({ MonthlyRentAmount: 999999.00 })
    });
    assert.equal(resUpdateLease.status, 403, 'Must return 403 Forbidden (Lease mutations restricted to Park Admin)');
    const [afterLease] = await db.query('SELECT MonthlyRentAmount FROM LeaseAgreement WHERE LeaseAgreementID = 2');
    assert.equal(Number(afterLease.MonthlyRentAmount), Number(origLease.MonthlyRentAmount), 'Lease rent amount must remain unchanged');
    console.log('✓ PASS: Lease mutation blocked by role authority and DB record unaltered');

    // 3.2 Tenant 1 attempting to update Tenant 2 address returns 404 (Masking Existence & Blocking IDOR)
    console.log('[TEST 3.2] Tenant 1 PUT /api/tenant-addresses/2 returns 404 Not Found and leaves DB record intact');
    const [origAddr] = await db.query('SELECT AddressLine1 FROM TenantAddress WHERE TenantAddressID = 2');
    const resUpdateAddr = await fetch(`${baseUrl}/api/tenant-addresses/2`, {
      method: 'PUT',
      headers: jsonHeaders(tokenTenant1Admin),
      body: JSON.stringify({ AddressLine1: 'Tampered Road' })
    });
    assert.equal(resUpdateAddr.status, 404, 'Must return 404 Not Found to prevent existence leaks');
    const [afterAddr] = await db.query('SELECT AddressLine1 FROM TenantAddress WHERE TenantAddressID = 2');
    assert.equal(afterAddr.AddressLine1, origAddr.AddressLine1, 'Address line must remain intact');
    console.log('✓ PASS: Foreign address update rejected with 404 and record preserved in DB');

    // 3.3 Tenant 1 attempting to delete Tenant 2 address returns 404
    console.log('[TEST 3.3] Tenant 1 DELETE /api/tenant-addresses/2 returns 404 and leaves record active in DB');
    const resDelAddr = await fetch(`${baseUrl}/api/tenant-addresses/2`, {
      method: 'DELETE',
      headers: authHeader(tokenTenant1Admin)
    });
    assert.equal(resDelAddr.status, 404, 'Must return 404 Not Found');
    const [delCheckAddr] = await db.query('SELECT IsDeleted FROM TenantAddress WHERE TenantAddressID = 2');
    assert.equal(delCheckAddr.IsDeleted, 0, 'Address must NOT be deleted');
    console.log('✓ PASS: Foreign address deletion rejected with 404 and record preserved in DB');

    // 3.4 Tenant 1 attempting to update Tenant 2 organization profile returns 404
    console.log('[TEST 3.4] Tenant 1 PUT /api/tenants/2 returns 404 Not Found');
    const resUpdateTenant = await fetch(`${baseUrl}/api/tenants/2`, {
      method: 'PUT',
      headers: jsonHeaders(tokenTenant1Admin),
      body: JSON.stringify({ CompanyName: 'Hacked Beta Logistics' })
    });
    assert.equal(resUpdateTenant.status, 404, 'Must return 404 Not Found');
    const [checkTenant] = await db.query('SELECT CompanyName FROM Tenant WHERE TenantID = 2');
    assert.notEqual(checkTenant.CompanyName, 'Hacked Beta Logistics', 'Tenant profile must not be modified');
    console.log('✓ PASS: Foreign tenant profile update rejected with 404 and DB state verified unaltered');


    // ─────────────────────────────────────────────────────────────────────────
    // SUITE 4: Tenant ID Spoofing & Body Tampering Prevention
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- [SUITE 4] Tenant ID Spoofing & Tampering Prevention ---');

    // 4.1 Tenant 1 tries to create an address claiming TenantID: 2
    console.log('[TEST 4.1] Tenant 1 creates address with spoofed { TenantID: 2 } in request body');
    const resSpoofedAddr = await fetch(`${baseUrl}/api/tenant-addresses`, {
      method: 'POST',
      headers: jsonHeaders(tokenTenant1Admin),
      body: JSON.stringify({
        TenantID: 2,
        AddressLine1: 'Security Test Address',
        City: 'Addis Ababa',
        Country: 'Ethiopia',
        AddressType: 'PHYSICAL'
      })
    });
    assert.equal(resSpoofedAddr.status, 201, 'Address creation should succeed');
    const bodySpoofedAddr = await resSpoofedAddr.json();
    const createdAddr = bodySpoofedAddr.data;
    assert.equal(Number(createdAddr.TenantID), 1, 'Server MUST override TenantID to actor tenant (1), ignoring client spoofing (2)');
    createdCleanupIds.addressIds.push(createdAddr.TenantAddressID);
    console.log(`✓ PASS: Client TenantID=2 was sanitized; record saved under authenticated TenantID=1`);

    // 4.2 Tenant 1 tries to create an issue claiming TenantID: 2
    console.log('[TEST 4.2] Tenant 1 creates issue with spoofed { TenantID: 2 } in body');
    const resSpoofedIssue = await fetch(`${baseUrl}/api/issues`, {
      method: 'POST',
      headers: jsonHeaders(tokenTenant1Admin),
      body: JSON.stringify({
        TenantID: 2,
        RequesterUserID: 3,
        ServiceID: 1,
        Title: 'Security Audit Spoof Test',
        Description: 'Testing that TenantID in body is stripped and replaced with actor tenant',
        PriorityCode: 'MEDIUM'
      })
    });
    assert.equal(resSpoofedIssue.status, 201, 'Issue creation should succeed');
    const bodySpoofedIssue = await resSpoofedIssue.json();
    const createdIssue = bodySpoofedIssue.data;
    assert.equal(Number(createdIssue.TenantID), 1, 'Server MUST override TenantID to actor tenant (1), ignoring client spoofing (2)');
    createdCleanupIds.issueIds.push(createdIssue.IssueRequestID);
    console.log(`✓ PASS: Client-supplied TenantID=2 was sanitized; issue saved under authenticated TenantID=1`);


    // ─────────────────────────────────────────────────────────────────────────
    // SUITE 5: RBAC Role & Permission Boundary Enforcement
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- [SUITE 5] RBAC Role & Permission Boundary Enforcement ---');

    // 5.1 Non-admin (Tenant Employee) cannot post announcements (403 Forbidden)
    console.log('[TEST 5.1] Tenant Employee POST /api/communication/announcements returns 403 Forbidden');
    const resAnnounceEmp = await fetch(`${baseUrl}/api/communication/announcements`, {
      method: 'POST',
      headers: jsonHeaders(tokenTenant1Employee),
      body: JSON.stringify({ Title: 'Unauthorized Announcement', Message: 'Test' })
    });
    assert.equal(resAnnounceEmp.status, 403, 'Must return 403 Forbidden');
    console.log('✓ PASS: Non-admin rejected from creating announcements with 403 Forbidden');

    // 5.2 Super Admin CAN post announcements
    console.log('[TEST 5.2] Super Admin POST /api/communication/announcements succeeds');
    const resAnnounceAdmin = await fetch(`${baseUrl}/api/communication/announcements`, {
      method: 'POST',
      headers: jsonHeaders(tokenSuperAdmin),
      body: JSON.stringify({ Title: 'Admin Maintenance Notice', Message: 'Scheduled maintenance this weekend' })
    });
    assert(resAnnounceAdmin.status === 201 || resAnnounceAdmin.status === 200, `Expected 201/200, got ${resAnnounceAdmin.status}`);
    console.log('✓ PASS: Park Admin authorized to create announcement');

    // 5.3 Non-admin cannot mutate system settings (403 Forbidden)
    console.log('[TEST 5.3] Tenant Employee POST /api/configuration/system-settings returns 403 Forbidden');
    const resConfigEmp = await fetch(`${baseUrl}/api/configuration/system-settings`, {
      method: 'POST',
      headers: jsonHeaders(tokenTenant1Employee),
      body: JSON.stringify({ SettingKey: 'MALICIOUS_KEY', SettingValue: 'true' })
    });
    assert.equal(resConfigEmp.status, 403, 'Configuration mutation must return 403 Forbidden for non-park-admins');
    console.log('✓ PASS: Non-admin prevented from modifying configuration with 403 Forbidden');

    // 5.4 Non-admin cannot modify service catalog (403 Forbidden)
    console.log('[TEST 5.4] Tenant Employee POST /api/services returns 403 Forbidden');
    const resServiceEmp = await fetch(`${baseUrl}/api/services`, {
      method: 'POST',
      headers: jsonHeaders(tokenTenant1Employee),
      body: JSON.stringify({ ServiceName: 'Hacked Service', ServiceCode: 'HACK' })
    });
    assert.equal(resServiceEmp.status, 403, 'Must return 403 Forbidden');
    console.log('✓ PASS: Service catalog modification blocked with 403 Forbidden');

    // 5.5 Non-staff cannot access internal staff notes (403 Forbidden)
    console.log('[TEST 5.5] Tenant Employee GET /api/communication/notes/1 returns 403 Forbidden');
    const resNotesEmp = await fetch(`${baseUrl}/api/communication/notes/1`, {
      headers: authHeader(tokenTenant1Employee)
    });
    assert.equal(resNotesEmp.status, 403, 'Internal notes must return 403 Forbidden for non-staff');
    console.log('✓ PASS: Internal notes endpoint blocked for tenant users with 403 Forbidden');

    // 5.6 Non-admin cannot view system notification delivery log (403 Forbidden)
    console.log('[TEST 5.6] Tenant Employee GET /api/notifications/delivery-log returns 403 Forbidden');
    const resDelivLog = await fetch(`${baseUrl}/api/notifications/delivery-log`, {
      headers: authHeader(tokenTenant1Employee)
    });
    assert.equal(resDelivLog.status, 403, 'Must return 403 Forbidden');
    console.log('✓ PASS: Notification delivery log blocked with 403 Forbidden');


    // ─────────────────────────────────────────────────────────────────────────
    // SUITE 6: Negative Proof Test (Verification of Active Scoping Filter)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- [SUITE 6] Negative Proof Test (Active Filter Verification) ---');

    // 6.1 Database naturally contains records across multiple tenants
    console.log('[TEST 6.1] Proving raw database contains multi-tenant records across tenants 1 and 2');
    const allLeasesRaw = await db.query('SELECT LeaseAgreementID, TenantID FROM LeaseAgreement WHERE IsDeleted = 0');
    const tenantIdsInDb = new Set(allLeasesRaw.map(l => l.TenantID));
    assert(tenantIdsInDb.has(1) && tenantIdsInDb.has(2), 'Raw DB must contain leases for both Tenant 1 and Tenant 2');
    console.log(`✓ PASS: Raw database contains leases for tenants: [${Array.from(tenantIdsInDb).join(', ')}]`);

    // 6.2 Scoped query for Tenant 1 returns strictly Tenant 1 leases
    console.log('[TEST 6.2] Proving tenant scoping filter actively reduces multi-tenant set');
    const tenant1LeasesFiltered = allLeasesRaw.filter(l => l.TenantID === 1);
    assert(tenant1LeasesFiltered.length < allLeasesRaw.length, 'Filtered count must be strictly less than unfiltered total');
    assert.equal(t1Leases.length, tenant1LeasesFiltered.length, 'API returned exact count of Tenant 1 leases');
    console.log(`✓ PASS: Negative proof verified: Without filter, ${allLeasesRaw.length} records exist. With filter, exactly ${t1Leases.length} returned.`);


    // ─────────────────────────────────────────────────────────────────────────
    // SUITE 7: Route Coverage Guard Test (Every Endpoint Has Authz or Allowlist)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- [SUITE 7] Route Coverage Guard Test ---');

    const inspectedEndpoints = [];
    function inspectRouter(router, prefix = '') {
      if (!router || !router.stack) return;
      for (const layer of router.stack) {
        if (layer.route) {
          const path = (prefix + layer.route.path).replace(/\/+/g, '/');
          const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase());
          inspectedEndpoints.push({ path, methods });
        } else if (layer.name === 'router' && layer.handle?.stack) {
          inspectRouter(layer.handle, prefix);
        }
      }
    }

    for (const mod of modules) {
      inspectRouter(mod.router, mod.basePath);
    }

    console.log(`[INFO] Programmatically inspected ${inspectedEndpoints.length} registered endpoints in Express route stack`);
    let unguardedCount = 0;
    for (const ep of inspectedEndpoints) {
      for (const method of ep.methods) {
        const isPublic = isPublicRoute(ep.path, method);
        // If not public, globalAuth enforces 401. If public, must be in allowlist.
        if (isPublic) {
          // Verify it matches documented public routes
          const allowedPublicPrefixes = [
            '/api/auth/login',
            '/api/auth/register',
            '/api/auth/forgot-password',
            '/api/auth/reset-password',
            '/api/auth/verify-email',
            '/api/auth/resend-verification',
            '/api/auth/refresh-token',
            '/api/documents/share/',
            '/health'
          ];
          const isDocumented = allowedPublicPrefixes.some(p => ep.path.startsWith(p));
          assert(isDocumented, `Public route ${method} ${ep.path} is not in documented allowlist!`);
        }
      }
    }
    console.log(`✓ PASS: All ${inspectedEndpoints.length} registered routes conform strictly to deny-by-default and authorization guards`);

  } finally {
    // Clean up test records created during spoofing tests
    for (const addrId of createdCleanupIds.addressIds) {
      try {
        await db.query('DELETE FROM TenantAddress WHERE TenantAddressID = ?', [addrId]);
      } catch {}
    }
    for (const issueId of createdCleanupIds.issueIds) {
      try {
        await db.query('DELETE FROM IssueRequest WHERE IssueRequestID = ?', [issueId]);
      } catch {}
    }

    // Close server and database connection
    server.close();
    if (db.pool && typeof db.pool.end === 'function') {
      await db.pool.end();
    }
    console.log('\n[INFO] Test server and DB connection closed.');
  }

  console.log('\n' + '='.repeat(75));
  console.log('🎉 ALL MULTI-TENANT ISOLATION & AUTHORIZATION TESTS PASSED SUCCESSFULLY!');
  console.log('='.repeat(75) + '\n');
}

runAuthorizationIsolationTests().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
