import assert from 'node:assert/strict';
import { query } from '../src/database/connection.js';
import parkService from '../src/modules/business-park/services/park.service.js';
import facilityZoneService from '../src/modules/business-park/services/facility-zone.service.js';
import buildingService from '../src/modules/business-park/services/building.service.js';
import floorService from '../src/modules/business-park/services/floor.service.js';
import officeService from '../src/modules/business-park/services/office.service.js';
import tenantService from '../src/modules/tenant/services/tenant.service.js';
import leaseService from '../src/modules/tenant/services/lease.service.js';
import { officeAllocationService } from '../src/modules/tenant/services/office-allocation.service.js';
import tenantContactService from '../src/modules/tenant/services/tenant-contact.service.js';
import tenantAddressService from '../src/modules/tenant/services/tenant-address.service.js';
import subTenantService from '../src/modules/tenant/services/sub-tenant.service.js';

async function runTenantTests() {
  console.log('====================================================');
  console.log('TENANT MANAGEMENT VALIDATION & BUSINESS RULES TEST SUITE');
  console.log('====================================================');

  const testUserId = 1;
  const testActor = { userId: 1, userTypeCode: 'PARK_ADMIN' };
  const timestamp = Date.now();

  let testPark = null;
  let testZone = null;
  let testBuilding = null;
  let testFloor = null;
  let testOffice = null;
  let testTenant = null;
  let testLease = null;
  let testAllocation = null;
  let testContact = null;
  let testAddress = null;
  let testSubTenant = null;

  try {
    // 0. Setup Park Hierarchy for space allocation testing
    const parkCode = `BP-TN-${timestamp}`;
    testPark = await parkService.createPark({
      BusinessParkCode: parkCode,
      BusinessParkName: `Tenant Test Park ${timestamp}`,
      City: 'Addis Ababa',
      Country: 'Ethiopia',
      TotalAreaSquareMeter: 20000,
      IsActive: 1
    }, testUserId);

    testZone = await facilityZoneService.createFacilityZone({
      BusinessParkID: testPark.BusinessParkID,
      FacilityZoneCode: `ZN-TN-${timestamp}`,
      FacilityZoneName: `Tenant Zone ${timestamp}`,
      ZoneType: 'COMMERCIAL',
      CapacityLimit: 100,
      IsActive: 1
    }, testUserId);

    testBuilding = await buildingService.createBuilding({
      BusinessParkID: testPark.BusinessParkID,
      FacilityZoneID: testZone.FacilityZoneID,
      BuildingCode: `BLD-TN-${timestamp}`,
      BuildingName: `Tenant Test Tower ${timestamp}`,
      TotalFloors: 3,
      TotalAreaSquareMeters: 5000,
      IsActive: 1
    }, testUserId);

    testFloor = await floorService.createFloor({
      BuildingID: testBuilding.BuildingID,
      FloorNumber: 1,
      FloorName: `Level 1 Suite`,
      TotalOfficeSpaces: 2,
      FloorAreaSquareMeters: 1000,
      IsActive: 1
    }, testUserId);

    testOffice = await officeService.createOffice({
      FloorID: testFloor.FloorID,
      OfficeNumber: `SUITE-101-${timestamp}`,
      OfficeName: `Corner Suite 101`,
      SquareMeters: 120,
      AvailabilityStatus: 'VACANT',
      IsActive: 1
    }, testUserId);

    // [TEST 1] Create valid Tenant
    console.log('\n[TEST 1] Create valid Tenant with auto-generated TenantCode');
    testTenant = await tenantService.createTenant({
      CompanyName: `Enterprise Solutions Inc ${timestamp}`,
      IndustryType: 'IT_AND_SOFTWARE',
      TradeName: `Enterprise Solutions`,
      RegistrationNumber: `REG-ET-${timestamp}`,
      TaxIdentificationNumber: `TIN-${timestamp}`,
      BusinessParkID: testPark.BusinessParkID,
      Status: 'ACTIVE'
    }, testActor);
    assert.ok(testTenant?.TenantID, 'Tenant should be created with an ID');
    assert.ok(testTenant?.TenantCode, 'Tenant should have a generated TenantCode');
    console.log('✓ PASS: Valid Tenant created ID:', testTenant.TenantID, 'Code:', testTenant.TenantCode);

    // [TEST 2] Reject duplicate Tenant Company Name or Registration
    console.log('\n[TEST 2] Reject duplicate Registration Number');
    let duplicateRejected = false;
    try {
      await tenantService.createTenant({
        CompanyName: `Different Name ${timestamp}`,
        IndustryType: 'FINANCIAL_SERVICES',
        RegistrationNumber: `REG-ET-${timestamp}`,
        TaxIdentificationNumber: `TIN-DIFF-${timestamp}`,
        BusinessParkID: testPark.BusinessParkID,
        Status: 'ACTIVE'
      }, testActor);
    } catch (err) {
      duplicateRejected = true;
      assert.ok(err.statusCode === 409 || err.message.includes('already exists') || err.message.includes('duplicate'));
      console.log('✓ PASS: Rejected duplicate Registration Number (409):', err.message);
    }
    assert.ok(duplicateRejected, 'Should have rejected duplicate RegistrationNumber');

    // [TEST 3] Create Valid Lease Agreement
    console.log('\n[TEST 3] Create Valid Lease Agreement in DRAFT status');
    const agreementNum = `LEA-ET-${timestamp}`;
    testLease = await leaseService.createLease({
      TenantID: testTenant.TenantID,
      AgreementNumber: agreementNum,
      StartDate: '2026-10-01',
      EndDate: '2027-09-30',
      ExecutionDate: '2026-09-15',
      GracePeriodDays: 15,
      MonthlyRentAmount: 35000.00,
      SecurityDepositAmount: 70000.00
    }, testUserId);
    assert.ok(testLease?.LeaseAgreementID, 'Lease Agreement should be created with an ID');
    assert.equal(testLease.Status, 'DRAFT', 'New lease should start in DRAFT status');
    console.log('✓ PASS: Valid Lease created ID:', testLease.LeaseAgreementID, 'Status:', testLease.Status);

    // [TEST 4] Reject Lease with EndDate <= StartDate
    console.log('\n[TEST 4] Reject Lease where EndDate is before StartDate');
    let invalidDatesRejected = false;
    try {
      await leaseService.createLease({
        TenantID: testTenant.TenantID,
        AgreementNumber: `LEA-BAD-${timestamp}`,
        StartDate: '2027-01-01',
        EndDate: '2026-01-01',
        ExecutionDate: '2025-12-01',
        MonthlyRentAmount: 20000.00,
        SecurityDepositAmount: 40000.00
      }, testUserId);
    } catch (err) {
      invalidDatesRejected = true;
      assert.equal(err.statusCode, 400);
      console.log('✓ PASS: Rejected invalid date range (400):', err.message);
    }
    assert.ok(invalidDatesRejected, 'Should have rejected EndDate <= StartDate');

    // [TEST 5] Reject duplicate Lease Agreement Number
    console.log('\n[TEST 5] Reject duplicate Lease Agreement Number');
    let duplicateLeaseRejected = false;
    try {
      await leaseService.createLease({
        TenantID: testTenant.TenantID,
        AgreementNumber: agreementNum,
        StartDate: '2026-10-01',
        EndDate: '2027-09-30',
        ExecutionDate: '2026-09-15',
        MonthlyRentAmount: 35000.00,
        SecurityDepositAmount: 70000.00
      }, testUserId);
    } catch (err) {
      duplicateLeaseRejected = true;
      assert.ok(err.statusCode === 409 || err.message.includes('already exists'));
      console.log('✓ PASS: Rejected duplicate AgreementNumber (409):', err.message);
    }
    assert.ok(duplicateLeaseRejected, 'Should have rejected duplicate agreement number');

    // [TEST 6] Lease status transition: DRAFT -> ACTIVE
    console.log('\n[TEST 6] Transition Lease Status from DRAFT to ACTIVE');
    const activatedLease = await leaseService.updateLeaseStatus(testLease.LeaseAgreementID, 'ACTIVE', '', testUserId);
    assert.equal(activatedLease.Status, 'ACTIVE');
    console.log('✓ PASS: Lease successfully transitioned to ACTIVE');

    // [TEST 7] Reject TERMINATED status without termination reason
    console.log('\n[TEST 7] Reject TERMINATED status transition without termination reason');
    let missingReasonRejected = false;
    try {
      await leaseService.updateLeaseStatus(testLease.LeaseAgreementID, 'TERMINATED', '', testUserId);
    } catch (err) {
      missingReasonRejected = true;
      assert.equal(err.statusCode, 400);
      console.log('✓ PASS: Rejected termination without reason (400):', err.message);
    }
    assert.ok(missingReasonRejected, 'Should have rejected termination without reason');

    // [TEST 8] Allocate vacant Office Space to Tenant
    console.log('\n[TEST 8] Allocate vacant Office Space to Tenant');
    const allocResult = await officeAllocationService.allocateOffice({
      TenantID: testTenant.TenantID,
      OfficeSpaceID: testOffice.OfficeSpaceID,
      LeaseAgreementID: testLease.LeaseAgreementID,
      AllocatedDate: '2026-10-01',
      AllocationScope: 'OFFICE'
    }, testUserId);
    testAllocation = allocResult.allocations[0];
    assert.ok(testAllocation?.TenantOfficeAllocationID, 'Space should be allocated with a TenantOfficeAllocationID');

    // Verify office status is now OCCUPIED
    const updatedOffice = await officeService.getOfficeById(testOffice.OfficeSpaceID);
    assert.equal(updatedOffice.AvailabilityStatus, 'OCCUPIED', 'Office unit should now be OCCUPIED');
    console.log('✓ PASS: Office unit successfully allocated and marked as OCCUPIED');

    // [TEST 9] Reject allocating already occupied office
    console.log('\n[TEST 9] Reject allocating already occupied office space');
    let reallocateRejected = false;
    try {
      await officeAllocationService.allocateOffice({
        TenantID: testTenant.TenantID,
        OfficeSpaceID: testOffice.OfficeSpaceID,
        AllocatedDate: '2026-10-01',
        AllocationScope: 'OFFICE'
      }, testUserId);
    } catch (err) {
      reallocateRejected = true;
      assert.ok(err.statusCode === 409 || err.statusCode === 400);
      console.log('✓ PASS: Rejected allocating occupied office (400/409):', err.message);
    }
    assert.ok(reallocateRejected, 'Should have rejected allocation of occupied office');

    // [TEST 10] Reject deleting/deactivating Tenant with active allocations or leases
    console.log('\n[TEST 10] Reject deleting Tenant with active Lease and Space Allocation');
    let deleteTenantRejected = false;
    try {
      await tenantService.deleteTenant(testTenant.TenantID, testActor);
    } catch (err) {
      deleteTenantRejected = true;
      assert.ok(err.statusCode === 409 || err.statusCode === 400);
      console.log('✓ PASS: Blocked Tenant deletion with active dependencies (409):', err.message);
    }
    assert.ok(deleteTenantRejected, 'Should block tenant deletion with active leases');

    // [TEST 11] Release allocated office unit
    console.log('\n[TEST 11] Release allocated space back to VACANT');
    await officeAllocationService.releaseAllocation(testAllocation.TenantOfficeAllocationID, 'Tenant contract reorganization', testUserId);
    const releasedOffice = await officeService.getOfficeById(testOffice.OfficeSpaceID);
    assert.equal(releasedOffice.AvailabilityStatus, 'VACANT', 'Office unit should return to VACANT');
    console.log('✓ PASS: Allocated space released and office status reverted to VACANT');

    // [TEST 12] Add Registered Contact to Tenant
    console.log('\n[TEST 12] Add Primary Email Contact to Tenant');
    testContact = await tenantContactService.createContact({
      TenantID: testTenant.TenantID,
      ContactType: 'EMAIL',
      Label: 'Corporate Billing Email',
      ContactValue: `billing-${timestamp}@enterprise.et`,
      IsPrimary: 1
    }, testUserId);
    assert.ok(testContact?.TenantContactID, 'Contact should be created with an ID');
    console.log('✓ PASS: Primary contact created ID:', testContact.TenantContactID);

    // [TEST 13] Reject contact with invalid email format
    console.log('\n[TEST 13] Reject EMAIL contact with invalid format');
    let badEmailRejected = false;
    try {
      await tenantContactService.createContact({
        TenantID: testTenant.TenantID,
        ContactType: 'EMAIL',
        Label: 'Bad Contact',
        ContactValue: 'not-an-email',
        IsPrimary: 0
      }, testUserId);
    } catch (err) {
      badEmailRejected = true;
      assert.equal(err.statusCode, 400);
      console.log('✓ PASS: Rejected invalid email format (400):', err.message);
    }
    assert.ok(badEmailRejected, 'Should reject malformed email');

    // [TEST 14] Add Registered Address to Tenant
    console.log('\n[TEST 14] Add Legal Registered Address to Tenant');
    testAddress = await tenantAddressService.createAddress({
      TenantID: testTenant.TenantID,
      AddressType: 'LEGAL',
      Country: 'Ethiopia',
      Region: 'Addis Ababa',
      City: 'Addis Ababa',
      SubCity: 'Bole',
      Woreda: '04',
      PostalCode: '1000',
      AddressLine1: 'Bole Road, Mega Center 4th Floor'
    }, testUserId);
    assert.ok(testAddress?.TenantAddressID, 'Address should be created with an ID');
    console.log('✓ PASS: Registered address created ID:', testAddress.TenantAddressID);

    // [TEST 15] Create Sub-Tenant Entity under Tenant
    console.log('\n[TEST 15] Create Sub-Tenant Entity linked to Parent Tenant');
    testSubTenant = await subTenantService.createSubTenant({
      ParentTenantID: testTenant.TenantID,
      CompanyName: `Enterprise Logistics Sub ${timestamp}`,
      RegistrationNumber: `SUB-REG-${timestamp}`,
      RelationshipType: 'SUBSIDIARY',
      Status: 'ACTIVE',
      Description: 'Supply chain management subsidiary'
    }, testUserId);
    assert.ok(testSubTenant?.SubTenantID, 'Sub-tenant should be created with an ID');
    assert.equal(Number(testSubTenant.ParentTenantID), testTenant.TenantID);
    console.log('✓ PASS: Sub-tenant created ID:', testSubTenant.SubTenantID, 'under Parent:', testSubTenant.ParentTenantID);

    // [TEST 16] Reject Sub-Tenant under non-existent Parent
    console.log('\n[TEST 16] Reject Sub-Tenant under non-existent Parent Tenant');
    let nonExistentParentRejected = false;
    try {
      await subTenantService.createSubTenant({
        ParentTenantID: 9999999,
        CompanyName: `Phantom Sub ${timestamp}`,
        RegistrationNumber: `PHANTOM-${timestamp}`,
        RelationshipType: 'SUBSIDIARY',
        Status: 'ACTIVE'
      }, testUserId);
    } catch (err) {
      nonExistentParentRejected = true;
      assert.equal(err.statusCode, 404);
      console.log('✓ PASS: Rejected non-existent parent tenant (404):', err.message);
    }
    assert.ok(nonExistentParentRejected, 'Should reject non-existent parent tenant');

    // [TEST 17] Transition Lease to TERMINATED with reason
    console.log('\n[TEST 17] Terminate Lease with Valid Reason');
    const terminatedLease = await leaseService.updateLeaseStatus(
      testLease.LeaseAgreementID,
      'TERMINATED',
      'Mutual agreement to restructure enterprise entity',
      testUserId
    );
    assert.equal(terminatedLease.Status, 'TERMINATED');
    console.log('✓ PASS: Lease successfully transitioned to TERMINATED');

    console.log('\n====================================================');
    console.log('ALL 17 TENANT MANAGEMENT SCENARIOS PASSED WITH ZERO FAILURES!');
    console.log('====================================================');

  } finally {
    console.log('\nCleaning up test data...');
    try {
      if (testSubTenant?.SubTenantID) {
        await query('DELETE FROM SubTenant WHERE SubTenantID = ?', [testSubTenant.SubTenantID]);
      }
      if (testContact?.TenantContactID) {
        await query('DELETE FROM TenantContact WHERE TenantContactID = ?', [testContact.TenantContactID]);
      }
      if (testAddress?.TenantAddressID) {
        await query('DELETE FROM TenantAddress WHERE TenantAddressID = ?', [testAddress.TenantAddressID]);
      }
      if (testTenant?.TenantID) {
        await query('DELETE FROM TenantOfficeAllocation WHERE TenantID = ?', [testTenant.TenantID]);
        await query('DELETE FROM LeaseAgreement WHERE TenantID = ?', [testTenant.TenantID]);
        await query('DELETE FROM Tenant WHERE TenantID = ?', [testTenant.TenantID]);
      }
      if (testOffice?.OfficeSpaceID) {
        await query('DELETE FROM OfficeSpace WHERE OfficeSpaceID = ?', [testOffice.OfficeSpaceID]);
      }
      if (testFloor?.FloorID) {
        await query('DELETE FROM Floor WHERE FloorID = ?', [testFloor.FloorID]);
      }
      if (testBuilding?.BuildingID) {
        await query('DELETE FROM Building WHERE BuildingID = ?', [testBuilding.BuildingID]);
      }
      if (testZone?.FacilityZoneID) {
        await query('DELETE FROM FacilityZone WHERE FacilityZoneID = ?', [testZone.FacilityZoneID]);
      }
      if (testPark?.BusinessParkID) {
        await query('DELETE FROM BusinessPark WHERE BusinessParkID = ?', [testPark.BusinessParkID]);
      }
      console.log('Cleanup complete.');
    } catch (cleanupErr) {
      console.warn('Cleanup warning:', cleanupErr.message);
    }
  }
}

runTenantTests().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('\nFATAL TEST ERROR:', err);
  process.exit(1);
});
