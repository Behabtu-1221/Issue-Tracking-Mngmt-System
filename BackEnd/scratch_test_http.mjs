import pool from './src/config/database.js';
import { generateAccessToken } from './src/shared/utils/token.js';

async function testHttpFlow() {
  try {
    console.log('Generating auth token for User 1 (superadmin)...');
    const [userRows] = await pool.query(
      `SELECT ua.UserAccountID, ua.UserID, ua.Username, u.TenantID, u.UserTypeCode, r.RoleCode
       FROM UserAccount ua
       JOIN \`User\` u ON ua.UserID = u.UserID
       LEFT JOIN UserRole ur ON u.UserID = ur.UserID AND ur.IsActive = 1 AND ur.IsDeleted = 0
       LEFT JOIN Role r ON ur.RoleID = r.RoleID
       WHERE u.UserID = 1 LIMIT 1`
    );
    const user = userRows[0];
    const token = generateAccessToken({
      userId: user.UserID,
      username: user.Username,
      userTypeCode: user.UserTypeCode,
      tenantId: user.TenantID,
      role: user.RoleCode,
      sessionId: 58
    });

    console.log('\n--- 1. Testing POST /api/tenants ---');
    const tenantRes = await fetch('http://localhost:5000/api/tenants', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        BusinessParkID: 1,
        TenantTypeID: 1,
        TenantCode: 'TNT-TEST-HTTP',
        CompanyName: 'Acme HTTP Test PLC',
        RegistrationNumber: 'REG-HTTP-001',
        TaxIdentificationNo: 'TIN-HTTP-001',
        Website: 'https://acmehttp.com',
        Status: 'ONBOARDING'
      })
    });
    const tenantJson = await tenantRes.json();
    console.log('Tenant Response Status:', tenantRes.status);
    console.log('Tenant Response Body:', tenantJson);

    let createdTenantId = tenantJson?.data?.TenantID;

    if (createdTenantId) {
      console.log('\n--- 2. Updating Tenant Status to ACTIVE ---');
      const patchRes = await fetch(`http://localhost:5000/api/tenants/${createdTenantId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ Status: 'ACTIVE' })
      });
      console.log('Status Patch:', patchRes.status, await patchRes.json());
    } else {
      createdTenantId = 1;
    }

    console.log('\n--- 3. Testing POST /api/leases ---');
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const endStr = nextYear.toISOString().split('T')[0];

    const leaseRes = await fetch('http://localhost:5000/api/leases', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        TenantID: createdTenantId,
        AgreementNumber: 'LEA-TEST-HTTP',
        StartDate: today,
        EndDate: endStr,
        ExecutionDate: today,
        MonthlyRentAmount: 25000,
        SecurityDepositAmount: 50000,
        GracePeriodDays: 10,
        CurrencyCode: 'ETB',
        Status: 'DRAFT'
      })
    });
    const leaseJson = await leaseRes.json();
    console.log('Lease Response Status:', leaseRes.status);
    console.log('Lease Response Body:', leaseJson);

    let createdLeaseId = leaseJson?.data?.LeaseAgreementID;
    if (createdLeaseId) {
      console.log('\n--- 4. Activating Lease ---');
      const activateRes = await fetch(`http://localhost:5000/api/leases/${createdLeaseId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ Status: 'ACTIVE' })
      });
      console.log('Lease Activation Status:', activateRes.status, await activateRes.json());
    }

    console.log('\n--- 5. Testing POST /api/office-allocations ---');
    const allocRes = await fetch('http://localhost:5000/api/office-allocations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        TenantID: createdTenantId,
        AllocationScope: 'OFFICE',
        OfficeSpaceID: 1,
        LeaseAgreementID: createdLeaseId || null,
        AllocatedDate: today
      })
    });
    const allocJson = await allocRes.json();
    console.log('Allocation Response Status:', allocRes.status);
    console.log('Allocation Response Body:', allocJson);

    console.log('\n--- 6. Cleaning Up ---');
    if (allocJson?.data?.allocations?.[0]?.TenantOfficeAllocationID) {
      await pool.query('DELETE FROM TenantOfficeAllocation WHERE TenantOfficeAllocationID = ?', [allocJson.data.allocations[0].TenantOfficeAllocationID]);
      await pool.query('UPDATE OfficeSpace SET AvailabilityStatus = "VACANT" WHERE OfficeSpaceID = 1');
      await pool.query('DELETE FROM OfficeAllocationHistory WHERE TenantID = ?', [createdTenantId]);
    }
    if (createdLeaseId) {
      await pool.query('DELETE FROM LeaseAgreement WHERE LeaseAgreementID = ?', [createdLeaseId]);
    }
    if (tenantJson?.data?.TenantID) {
      await pool.query('DELETE FROM Tenant WHERE TenantID = ?', [tenantJson.data.TenantID]);
    }
    console.log('✓ Cleanup completed!');
    process.exit(0);
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
}

testHttpFlow();
