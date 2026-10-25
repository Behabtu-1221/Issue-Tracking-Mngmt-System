import assert from 'node:assert/strict';
import http from 'http';
import crypto from 'crypto';
import app from '../src/app.js';
import db from '../src/database/connection.js';
import env from '../src/config/env.js';
import { isPublicRoute } from '../src/shared/middleware/globalAuth.js';
import { hashToken } from '../src/shared/utils/token.js';
import passwordResetTokenRepository from '../src/modules/identity-access/repositories/passwordResetToken.repository.js';
import userSessionRepository from '../src/modules/identity-access/repositories/userSession.repository.js';

// Import all module routers to enumerate the complete API surface accurately
import configurationModule from '../src/modules/configuration-management/index.js';
import authRoutes from '../src/modules/identity-access/routes/auth.routes.js';
import userRoutes from '../src/modules/identity-access/routes/user.routes.js';
import roleRoutes from '../src/modules/identity-access/routes/role.routes.js';

import parkRoutes from '../src/modules/business-park/routes/park.routes.js';
import buildingRoutes from '../src/modules/business-park/routes/building.routes.js';
import floorRoutes from '../src/modules/business-park/routes/floor.routes.js';
import officeRoutes from '../src/modules/business-park/routes/office.routes.js';
import locationRoutes from '../src/modules/business-park/routes/location.routes.js';
import facilityZoneRoutes from '../src/modules/business-park/routes/facility-zone.routes.js';
import floorPlanRoutes from '../src/modules/business-park/routes/floor-plan.routes.js';

import tenantRoutes from '../src/modules/tenant/routes/tenant.routes.js';
import leaseRoutes from '../src/modules/tenant/routes/lease.routes.js';
import officeAllocationRoutes from '../src/modules/tenant/routes/office-allocation.routes.js';
import tenantAddressRoutes from '../src/modules/tenant/routes/tenant-address.routes.js';
import tenantContactRoutes from '../src/modules/tenant/routes/tenant-contact.routes.js';
import subTenantRoutes from '../src/modules/tenant/routes/sub-tenant.routes.js';

import departmentRoutes from '../src/modules/organization/routes/department.routes.js';
import teamRoutes from '../src/modules/organization/routes/team.routes.js';
import positionRoutes from '../src/modules/organization/routes/position.routes.js';
import employeeAssignmentRoutes from '../src/modules/organization/routes/employee-assignment.routes.js';
import reportingHierarchyRoutes from '../src/modules/organization/routes/reporting-hierarchy.routes.js';
import budgetCostCenterRoutes from '../src/modules/organization/routes/budget-cost-center.routes.js';

import serviceCategoryRoutes from '../src/modules/service-catalog/routes/service-category.routes.js';
import serviceRoutes from '../src/modules/service-catalog/routes/service.routes.js';
import serviceAnalyticsRoutes from '../src/modules/service-catalog/routes/service-analytics.routes.js';
import serviceCategoryMappingRoutes from '../src/modules/service-catalog/routes/service-category-mapping.routes.js';

import issueRequestRoutes from '../src/modules/issue-management/routes/issue-request.routes.js';
import issueCommentRoutes from '../src/modules/issue-management/routes/issue-comment.routes.js';
import issueInvestigationRoutes from '../src/modules/issue-management/routes/issue-investigation.routes.js';
import issueResolutionRoutes from '../src/modules/issue-management/routes/issue-resolution.routes.js';

import approvalRoutes from '../src/modules/approval/routes/approval.routes.js';
import approvalDelegationRoutes from '../src/modules/approval/routes/approval-delegation.routes.js';
import approvalRuleRoutes from '../src/modules/approval/routes/approval-rule.routes.js';
import approvalGroupRoutes from '../src/modules/approval/routes/approval-group.routes.js';

import dispatchModule from '../src/modules/dispatch/index.js';
import slaModule from '../src/modules/sla/index.js';
import communicationModule from '../src/modules/communication/index.js';
import notificationModule from '../src/modules/notification/index.js';
import fileDocumentModule from '../src/modules/file-document/index.js';
import reportingModule from '../src/modules/reporting/index.js';

const ROUTE_REGISTRY = [
  { basePath: '/api/configuration', router: configurationModule.router },
  { basePath: '/api/auth', router: authRoutes },
  { basePath: '/api/users', router: userRoutes },
  { basePath: '/api/roles', router: roleRoutes },
  { basePath: '/api/parks', router: parkRoutes },
  { basePath: '/api/buildings', router: buildingRoutes },
  { basePath: '/api/floors', router: floorRoutes },
  { basePath: '/api/offices', router: officeRoutes },
  { basePath: '/api/locations', router: locationRoutes },
  { basePath: '/api/facility-zones', router: facilityZoneRoutes },
  { basePath: '/api/floor-plans', router: floorPlanRoutes },
  { basePath: '/api/tenants', router: tenantRoutes },
  { basePath: '/api/leases', router: leaseRoutes },
  { basePath: '/api/office-allocations', router: officeAllocationRoutes },
  { basePath: '/api/tenant-addresses', router: tenantAddressRoutes },
  { basePath: '/api/tenant-contacts', router: tenantContactRoutes },
  { basePath: '/api/sub-tenants', router: subTenantRoutes },
  { basePath: '/api/departments', router: departmentRoutes },
  { basePath: '/api/teams', router: teamRoutes },
  { basePath: '/api/positions', router: positionRoutes },
  { basePath: '/api/employee-assignments', router: employeeAssignmentRoutes },
  { basePath: '/api/reporting-hierarchies', router: reportingHierarchyRoutes },
  { basePath: '/api/financials', router: budgetCostCenterRoutes },
  { basePath: '/api/service-categories', router: serviceCategoryRoutes },
  { basePath: '/api/services', router: serviceRoutes },
  { basePath: '/api/service-analytics', router: serviceAnalyticsRoutes },
  { basePath: '/api/category-mappings', router: serviceCategoryMappingRoutes },
  { basePath: '/api/requests', router: issueRequestRoutes },
  { basePath: '/api/comments', router: issueCommentRoutes },
  { basePath: '/api/investigations', router: issueInvestigationRoutes },
  { basePath: '/api/resolutions', router: issueResolutionRoutes },
  { basePath: '/api/approvals', router: approvalRoutes },
  { basePath: '/api/approval-delegations', router: approvalDelegationRoutes },
  { basePath: '/api/approval-rules', router: approvalRuleRoutes },
  { basePath: '/api/approval-groups', router: approvalGroupRoutes },
  { basePath: '/api/dispatch', router: dispatchModule.router },
  { basePath: '/api/sla', router: slaModule.router },
  { basePath: '/api/communication', router: communicationModule.router },
  { basePath: '/api/notifications', router: notificationModule.router },
  { basePath: '/api/documents', router: fileDocumentModule.router },
  { basePath: '/api/reports', router: reportingModule.router }
];

function getAllRegisteredRoutes() {
  const routes = [];
  function walk(router, prefix = '') {
    if (!router || !router.stack) return;
    for (const layer of router.stack) {
      if (layer.route) {
        const fullPath = (prefix + layer.route.path).replace(/\/+/g, '/');
        const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase());
        routes.push({ methods, path: fullPath });
      } else if (layer.name === 'router' && layer.handle?.stack) {
        walk(layer.handle, prefix);
      }
    }
  }
  for (const entry of ROUTE_REGISTRY) {
    walk(entry.router, entry.basePath);
  }
  return routes;
}

async function runSecurityHardeningTests() {
  console.log('='.repeat(70));
  console.log('🔒 ITMS SECURITY HARDENING VALIDATION TEST SUITE');
  console.log('='.repeat(70));

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[INFO] Ephemeral security test server active on ${baseUrl}`);

  try {
    // ─────────────────────────────────────────────────────────────────────────
    // TEST SUITE 1: Task 1 - Actor Fallback Removal & Header Spoofing
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- [TEST SUITE 1] Task 1: Actor Fallback Removal ---');

    console.log('[TEST 1.1] Unauthenticated request to protected route returns 401');
    const resUnauth = await fetch(`${baseUrl}/api/configuration/bootstrap`);
    assert.equal(resUnauth.status, 401, 'Unauthenticated request must return 401 Unauthorized');
    const unauthBody = await resUnauth.json();
    assert.equal(unauthBody.status, 'fail');
    console.log('✓ PASS: Unauthenticated request failed with 401 Unauthorized');

    console.log('[TEST 1.2] Spoofed x-user-id header is ignored and still returns 401');
    const resSpoofedHeader = await fetch(`${baseUrl}/api/configuration/bootstrap`, {
      headers: {
        'x-user-id': '1',
        'X-Actor': 'SUPER_ADMIN'
      }
    });
    assert.equal(resSpoofedHeader.status, 401, 'Client-supplied actor headers must be ignored and return 401');
    console.log('✓ PASS: Spoofed x-user-id header was rejected with 401');

    console.log('[TEST 1.3] Public health check route remains accessible');
    const resHealth = await fetch(`${baseUrl}/health`);
    assert.equal(resHealth.status, 200, 'Health check should be public 200');
    console.log('✓ PASS: Health check accessible without credentials');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST SUITE 2: Task 2 - Global Authentication & Route Enumeration
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- [TEST SUITE 2] Task 2: Global Authentication Route Enumeration ---');

    const allRoutes = getAllRegisteredRoutes();
    console.log(`[INFO] Enumerating all ${allRoutes.length} registered routes across all modules for 401 compliance...`);

    let testedRoutes = 0;
    let failedRoutes = [];

    for (const route of allRoutes) {
      if (route.path.includes('(.*)')) continue; // skip 404 catch-all

      const samplePath = route.path.replace(/:[a-zA-Z0-9_]+/g, '1');
      const method = route.methods[0] === 'ALL' ? 'GET' : (route.methods[0] || 'GET');
      const isAllowlisted = isPublicRoute(method, samplePath);

      if (!isAllowlisted) {
        testedRoutes++;
        const res = await fetch(`${baseUrl}${samplePath}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'x-bypass-rate-limit': 'test-suite-bypass'
          }
        });

        if (res.status !== 401) {
          failedRoutes.push({
            method,
            path: route.path,
            samplePath,
            status: res.status
          });
        }
      }
    }

    console.log(`[INFO] Tested ${testedRoutes} non-allowlisted routes against globalAuth`);
    assert.equal(
      failedRoutes.length,
      0,
      `Detected unprotected routes accessible without auth: ${JSON.stringify(failedRoutes)}`
    );
    console.log(`✓ PASS: All ${testedRoutes} non-allowlisted routes strictly require auth (returned 401)`);

    // ─────────────────────────────────────────────────────────────────────────
    // TEST SUITE 3: Task 4 - Password Reset Flow Hardening
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- [TEST SUITE 3] Task 4: Password Reset Flow ---');

    console.log('[TEST 3.1] User enumeration defense: Non-existent user returns identical generic response');
    const resUnknown = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bypass-rate-limit': 'test-suite-bypass'
      },
      body: JSON.stringify({ username: `nonexistent_user_${Date.now()}@example.com` })
    });
    assert.equal(resUnknown.status, 200);
    const unknownBody = await resUnknown.json();
    assert.ok(
      unknownBody.data.message.includes('If an account matching the provided credentials exists'),
      'Must return uniform generic message'
    );
    console.log('✓ PASS: Unknown user returned generic response without leaking account existence');

    console.log('[TEST 3.2] Reset with invalid/fake token returns 400');
    const fakeToken = crypto.randomBytes(32).toString('hex');
    const resInvalidToken = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bypass-rate-limit': 'test-suite-bypass'
      },
      body: JSON.stringify({
        token: fakeToken,
        newPassword: 'NewSecurePassword123!'
      })
    });
    assert.equal(resInvalidToken.status, 400, 'Invalid token must return 400');
    console.log('✓ PASS: Invalid token rejected with 400 Bad Request');

    // Clean up any stale test sessions from previous runs
    await db.pool.query("DELETE FROM UserSession WHERE SessionToken LIKE 'test_active_session%'");

    // Create a temporary test account in DB to test valid reset, token reuse, expiry, and session termination
    const testTimestamp = Date.now();
    const testUsername = `reset_test_${testTimestamp}`;
    const testEmail = `reset.test.${testTimestamp}@example.local`;

    let testUserId = null;
    let testUserAccountId = null;

    try {
      const [userRes] = await db.pool.query(
        `INSERT INTO \`User\` (TenantID, UserTypeCode, FirstName, LastName, Email, CreatedBy)
         VALUES (1, 'STAFF', 'Reset', 'Tester', ?, 1)`,
        [testEmail]
      );
      testUserId = userRes.insertId;

      const [accountRes] = await db.pool.query(
        `INSERT INTO UserAccount (UserID, AuthenticationProviderID, Username, PasswordHash, AccountStatusCode, IsActive, CreatedBy)
         VALUES (?, 1, ?, '$2a$10$abcdefghijklmnopqrstuv', 'ACTIVE', 1, ?)`,
        [testUserId, testUsername, testUserId]
      );
      testUserAccountId = accountRes.insertId;

      const dynamicSessionToken = `test_active_session_${crypto.randomBytes(8).toString('hex')}`;
      // Create an active session to test session revocation
      await userSessionRepository.create({
        userAccountId: testUserAccountId,
        sessionToken: dynamicSessionToken,
        ipAddress: '127.0.0.1',
        userAgent: 'Security-Test-Agent',
        expiryDateTime: new Date(Date.now() + 86400000),
        actorUserId: testUserId
      });

      console.log('[TEST 3.3] Successful password reset using 32-byte hashed token');
      const validRawToken = crypto.randomBytes(32).toString('hex');
      const validHashedToken = hashToken(validRawToken);

      await passwordResetTokenRepository.create({
        userAccountId: testUserAccountId,
        hashedToken: validHashedToken,
        expiryMinutes: 15,
        actorUserId: testUserId
      });

      const resResetSuccess = await fetch(`${baseUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-bypass-rate-limit': 'test-suite-bypass'
        },
        body: JSON.stringify({
          token: validRawToken,
          newPassword: 'NewlyResetPassword123!'
        })
      });
      assert.equal(resResetSuccess.status, 200, 'Valid reset must succeed with 200');
      console.log('✓ PASS: Password reset succeeded with 32-byte token');

      console.log('[TEST 3.4] Token single-use enforcement: Reused token is rejected');
      const resReusedToken = await fetch(`${baseUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-bypass-rate-limit': 'test-suite-bypass'
        },
        body: JSON.stringify({
          token: validRawToken,
          newPassword: 'AnotherPassword123!'
        })
      });
      assert.equal(resReusedToken.status, 400, 'Reused token must return 400');
      console.log('✓ PASS: Reused token rejected with 400');

      console.log('[TEST 3.5] Expired token rejection');
      const expiredRawToken = crypto.randomBytes(32).toString('hex');
      const expiredHashedToken = hashToken(expiredRawToken);

      await passwordResetTokenRepository.create({
        userAccountId: testUserAccountId,
        hashedToken: expiredHashedToken,
        expiryMinutes: -5, // expired 5 minutes ago
        actorUserId: testUserId
      });

      const resExpired = await fetch(`${baseUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-bypass-rate-limit': 'test-suite-bypass'
        },
        body: JSON.stringify({
          token: expiredRawToken,
          newPassword: 'ExpiredTokenPassword123!'
        })
      });
      assert.equal(resExpired.status, 400, 'Expired token must return 400');
      console.log('✓ PASS: Expired token rejected with 400');

      console.log('[TEST 3.6] Session invalidation: Existing sessions revoked upon reset');
      const activeSessions = await userSessionRepository.listActiveByUserAccountId(testUserAccountId);
      assert.equal(activeSessions.length, 0, 'All existing user sessions must be revoked upon password reset');
      console.log('✓ PASS: All user sessions successfully revoked on password reset');
    } finally {
      // Clean up test data
      if (testUserAccountId) {
        await db.pool.query('DELETE FROM PasswordResetToken WHERE UserAccountID = ?', [testUserAccountId]);
        await db.pool.query('DELETE FROM UserSession WHERE UserAccountID = ?', [testUserAccountId]);
        await db.pool.query('DELETE FROM UserAccount WHERE UserAccountID = ?', [testUserAccountId]);
      }
      if (testUserId) {
        await db.pool.query('DELETE FROM `User` WHERE UserID = ?', [testUserId]);
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST SUITE 4: Task 5 - Strict CORS Policy
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- [TEST SUITE 4] Task 5: CORS Policy Enforcement ---');

    console.log('[TEST 4.1] Permitted origin receives Access-Control-Allow-Origin header');
    const resCorsAllowed = await fetch(`${baseUrl}/health`, {
      headers: { Origin: 'http://localhost:5173' }
    });
    assert.equal(resCorsAllowed.status, 200);
    assert.equal(
      resCorsAllowed.headers.get('access-control-allow-origin'),
      'http://localhost:5173',
      'Allowed origin must be reflected in CORS header'
    );
    console.log('✓ PASS: Configured origin http://localhost:5173 accepted');

    console.log('[TEST 4.2] Unauthorized origin is blocked by CORS policy');
    const resCorsBlocked = await fetch(`${baseUrl}/health`, {
      headers: { Origin: 'http://unauthorized-malicious-site.com' }
    });
    assert.equal(resCorsBlocked.status, 403, 'Unauthorized origin must receive 403 Forbidden');
    assert.equal(
      resCorsBlocked.headers.get('access-control-allow-origin'),
      null,
      'Blocked origin must not receive Access-Control-Allow-Origin header'
    );
    console.log('✓ PASS: Unauthorized origin blocked with 403 Forbidden');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST SUITE 5: Task 5 - Rate Limiting & Retry-After Header
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- [TEST SUITE 5] Task 5: Rate Limiting & Retry-After ---');

    console.log('[TEST 5.1] Rapid requests to sensitive login endpoint triggers 429 & Retry-After');
    let rateLimitTriggered = false;
    let receivedRetryAfter = null;

    // Trigger login limiter (threshold is 5 requests/min)
    for (let i = 0; i < 10; i++) {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: `ratelimit_probe_${i}`,
          password: 'ProbePassword123!'
        })
      });

      if (res.status === 429) {
        rateLimitTriggered = true;
        receivedRetryAfter = res.headers.get('retry-after');
        const body429 = await res.json();
        assert.equal(body429.status, 'fail');
        assert.ok(receivedRetryAfter, '429 response must include Retry-After header');
        break;
      }
    }

    assert.ok(rateLimitTriggered, 'Rate limiter must return 429 Too Many Requests when threshold exceeded');
    console.log(`✓ PASS: Rate limit triggered 429 with Retry-After: ${receivedRetryAfter}s`);

    console.log('\n====================================================');
    console.log('🎉 ALL SECURITY HARDENING TESTS PASSED SUCCESSFULLY!');
    console.log('====================================================\n');

  } finally {
    server.close();
    await db.pool.end();
  }
}

runSecurityHardeningTests().catch((err) => {
  console.error('\n❌ FATAL SECURITY TEST FAILURE:\n', err);
  process.exit(1);
});
