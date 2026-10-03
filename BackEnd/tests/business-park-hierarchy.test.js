import assert from 'node:assert/strict';
import { query } from '../src/database/connection.js';
import parkService from '../src/modules/business-park/services/park.service.js';
import facilityZoneService from '../src/modules/business-park/services/facility-zone.service.js';
import buildingService from '../src/modules/business-park/services/building.service.js';
import floorService from '../src/modules/business-park/services/floor.service.js';
import officeService from '../src/modules/business-park/services/office.service.js';

async function runTests() {
  console.log('====================================================');
  console.log('BUSINESS PARK HIERARCHY & VALIDATION TEST SUITE');
  console.log('====================================================');

  const testUserId = 1;
  const timestamp = Date.now();

  let testPark = null;
  let testZone = null;
  let testBuilding = null;
  let testFloor = null;
  let testOffice = null;

  try {
    // 1. Create valid Business Park
    console.log('\n[TEST 1] Create valid Business Park');
    const parkCode = `BP-TEST-${timestamp}`;
    testPark = await parkService.createPark({
      BusinessParkCode: parkCode,
      BusinessParkName: `Integration Test Park ${timestamp}`,
      City: 'Addis Ababa',
      Country: 'Ethiopia',
      TotalAreaSquareMeter: 50000,
      IsActive: 1
    }, testUserId);
    assert.ok(testPark?.BusinessParkID, 'Park should be created with an ID');
    assert.equal(testPark.BusinessParkCode, parkCode);
    console.log('✓ PASS: Valid Business Park created ID:', testPark.BusinessParkID);

    // 2. Create valid Facility Zone under the Business Park
    console.log('\n[TEST 2] Create valid Facility Zone');
    const zoneCode = `ZN-TEST-${timestamp}`;
    testZone = await facilityZoneService.createFacilityZone({
      BusinessParkID: testPark.BusinessParkID,
      FacilityZoneCode: zoneCode,
      FacilityZoneName: `Test Engineering Zone ${timestamp}`,
      ZoneType: 'OPERATIONAL',
      CapacityLimit: 250,
      IsActive: 1
    }, testUserId);
    assert.ok(testZone?.FacilityZoneID, 'Facility Zone should be created with an ID');
    assert.equal(Number(testZone.BusinessParkID), testPark.BusinessParkID);
    console.log('✓ PASS: Valid Facility Zone created ID:', testZone.FacilityZoneID);

    // 3. Create Building under valid Zone
    console.log('\n[TEST 3] Create Building under valid Zone');
    const bldgCode = `BLD-${timestamp}`;
    testBuilding = await buildingService.createBuilding({
      BusinessParkID: testPark.BusinessParkID,
      FacilityZoneID: testZone.FacilityZoneID,
      BuildingCode: bldgCode,
      BuildingName: `Building Alpha ${timestamp}`,
      TotalFloors: 5,
      TotalAreaSquareMeter: 12000,
      IsActive: 1
    }, testUserId);
    assert.ok(testBuilding?.BuildingID, 'Building should be created with an ID');
    assert.equal(Number(testBuilding.FacilityZoneID), testZone.FacilityZoneID);
    assert.equal(testBuilding.TotalFloors, 5);
    console.log('✓ PASS: Valid Building created ID:', testBuilding.BuildingID, 'with configured TotalFloors = 5');

    // 4. Reject Building with invalid/non-existent Zone
    console.log('\n[TEST 4] Reject Building with non-existent Zone');
    await assert.rejects(
      async () => {
        await buildingService.createBuilding({
          BusinessParkID: testPark.BusinessParkID,
          FacilityZoneID: 9999999,
          BuildingCode: `BLD-INVALID-ZN-${timestamp}`,
          BuildingName: 'Should Fail',
          TotalFloors: 3
        }, testUserId);
      },
      (err) => {
        assert.equal(err.statusCode, 404);
        console.log('✓ PASS: Rejected non-existent Zone (404):', err.message);
        return true;
      }
    );

    // 5. Reject Building from another Business Park (Zone belongs to Park A, building specified Park B)
    console.log('\n[TEST 5] Reject Building with mismatching Park and Zone');
    const otherPark = await parkService.createPark({
      BusinessParkCode: `BP-OTHER-${timestamp}`,
      BusinessParkName: `Other Park ${timestamp}`,
      IsActive: 1
    }, testUserId);

    await assert.rejects(
      async () => {
        await buildingService.createBuilding({
          BusinessParkID: otherPark.BusinessParkID, // Mismatched!
          FacilityZoneID: testZone.FacilityZoneID, // Belongs to testPark!
          BuildingCode: `BLD-MISMATCH-${timestamp}`,
          BuildingName: 'Mismatch Building',
          TotalFloors: 3
        }, testUserId);
      },
      (err) => {
        assert.equal(err.statusCode, 400);
        console.log('✓ PASS: Rejected mismatched Zone/Park relationship (400):', err.message);
        return true;
      }
    );

    // 6. Reject Building duplicate code in same Park
    console.log('\n[TEST 6] Reject Building with duplicate code in same Park');
    await assert.rejects(
      async () => {
        await buildingService.createBuilding({
          BusinessParkID: testPark.BusinessParkID,
          FacilityZoneID: testZone.FacilityZoneID,
          BuildingCode: bldgCode, // duplicate
          BuildingName: 'Duplicate Code Building',
          TotalFloors: 3
        }, testUserId);
      },
      (err) => {
        assert.equal(err.statusCode, 409);
        console.log('✓ PASS: Rejected duplicate BuildingCode (409):', err.message);
        return true;
      }
    );

    // 7. Create valid Floor within building range
    console.log('\n[TEST 7] Create valid Floor 1 (within range 1..5)');
    testFloor = await floorService.createFloor({
      BuildingID: testBuilding.BuildingID,
      FloorNumber: 1,
      FloorCode: `FLR-1-${timestamp}`,
      FloorName: 'Ground Floor Innovation Center',
      TotalOfficeSpaces: 2 // Max capacity = 2 for testing
    }, testUserId);
    assert.ok(testFloor?.FloorID, 'Floor should be created');
    assert.equal(testFloor.FloorNumber, 1);
    assert.equal(testFloor.TotalOfficeSpaces, 2);

    // Verify building TotalFloors was NOT overwritten!
    const refreshedBldg = await buildingService.getBuildingById(testBuilding.BuildingID);
    assert.equal(refreshedBldg.TotalFloors, 5, 'Building TotalFloors must remain 5 and NOT be overwritten by floor count!');
    console.log('✓ PASS: Valid Floor created ID:', testFloor.FloorID, 'and Building TotalFloors remained 5 (Capacity Preserved)');

    // 8. Reject Floor number 0
    console.log('\n[TEST 8] Reject Floor number 0');
    await assert.rejects(
      async () => {
        await floorService.createFloor({
          BuildingID: testBuilding.BuildingID,
          FloorNumber: 0,
          FloorCode: `FLR-0-${timestamp}`,
          FloorName: 'Invalid Floor 0'
        }, testUserId);
      },
      (err) => {
        assert.equal(err.statusCode, 400);
        console.log('✓ PASS: Rejected Floor level 0 (400):', err.message);
        return true;
      }
    );

    // 9. Reject negative Floor number
    console.log('\n[TEST 9] Reject negative Floor number');
    await assert.rejects(
      async () => {
        await floorService.createFloor({
          BuildingID: testBuilding.BuildingID,
          FloorNumber: -3,
          FloorCode: `FLR-NEG-${timestamp}`,
          FloorName: 'Invalid Negative Floor'
        }, testUserId);
      },
      (err) => {
        assert.equal(err.statusCode, 400);
        console.log('✓ PASS: Rejected negative Floor number (400):', err.message);
        return true;
      }
    );

    // 10. Reject Floor number exceeding Building.TotalFloors (Floor 6 on 5-floor building)
    console.log('\n[TEST 10] Reject Floor number exceeding configured capacity (Floor 6 on 5-floor building)');
    await assert.rejects(
      async () => {
        await floorService.createFloor({
          BuildingID: testBuilding.BuildingID,
          FloorNumber: 6,
          FloorCode: `FLR-6-${timestamp}`,
          FloorName: 'Floor Above Limit'
        }, testUserId);
      },
      (err) => {
        assert.equal(err.statusCode, 400);
        console.log('✓ PASS: Rejected Floor exceeding building limit (400):', err.message);
        return true;
      }
    );

    // 11. Reject duplicate Floor number in same Building
    console.log('\n[TEST 11] Reject duplicate Floor number in same building');
    await assert.rejects(
      async () => {
        await floorService.createFloor({
          BuildingID: testBuilding.BuildingID,
          FloorNumber: 1, // already exists
          FloorCode: `FLR-1-DUP-${timestamp}`,
          FloorName: 'Duplicate Level 1'
        }, testUserId);
      },
      (err) => {
        assert.equal(err.statusCode, 409);
        console.log('✓ PASS: Rejected duplicate floor number (409):', err.message);
        return true;
      }
    );

    // 12. Create valid Office Unit under testFloor
    console.log('\n[TEST 12] Create valid Office Unit 1');
    testOffice = await officeService.createOffice({
      FloorID: testFloor.FloorID,
      OfficeNumber: `OF-101-${timestamp}`,
      OfficeName: 'Executive Suite 101',
      SquareMeters: 85,
      MaxOccupancy: 8,
      MonthlyRentAmount: 45000,
      AvailabilityStatus: 'VACANT'
    }, testUserId);
    assert.ok(testOffice?.OfficeSpaceID, 'Office should be created');

    // Verify Floor TotalOfficeSpaces was NOT overwritten!
    const refreshedFloor = await floorService.getFloorById(testFloor.FloorID);
    assert.equal(refreshedFloor.TotalOfficeSpaces, 2, 'Floor TotalOfficeSpaces must remain 2 and NOT be overwritten by count!');
    console.log('✓ PASS: Valid Office Unit created ID:', testOffice.OfficeSpaceID, 'and Floor TotalOfficeSpaces remained 2');

    // 13. Reject Office Unit with non-existent Floor
    console.log('\n[TEST 13] Reject Office Unit with non-existent Floor');
    await assert.rejects(
      async () => {
        await officeService.createOffice({
          FloorID: 9999999,
          OfficeNumber: `OF-INVALID-${timestamp}`,
          OfficeName: 'Should Fail',
          SquareMeters: 50
        }, testUserId);
      },
      (err) => {
        assert.equal(err.statusCode, 404);
        console.log('✓ PASS: Rejected non-existent Floor (404):', err.message);
        return true;
      }
    );

    // 14. Create second office unit up to capacity limit (2 / 2)
    console.log('\n[TEST 14] Create second Office Unit up to capacity limit (2 of 2)');
    const secondOffice = await officeService.createOffice({
      FloorID: testFloor.FloorID,
      OfficeNumber: `OF-102-${timestamp}`,
      OfficeName: 'Design Lab 102',
      SquareMeters: 90,
      MaxOccupancy: 10,
      AvailabilityStatus: 'VACANT'
    }, testUserId);
    assert.ok(secondOffice?.OfficeSpaceID);
    console.log('✓ PASS: Second Office Unit created ID:', secondOffice.OfficeSpaceID, '(Capacity now at 2/2)');

    // 15. Reject Office Unit when Floor capacity is reached (Attempting 3rd office on capacity 2)
    console.log('\n[TEST 15] Reject Office Unit when Floor capacity is reached');
    await assert.rejects(
      async () => {
        await officeService.createOffice({
          FloorID: testFloor.FloorID,
          OfficeNumber: `OF-103-${timestamp}`,
          OfficeName: 'Overcapacity Office',
          SquareMeters: 50
        }, testUserId);
      },
      (err) => {
        assert.equal(err.statusCode, 409);
        console.log('✓ PASS: Rejected Office exceeding floor capacity (409):', err.message);
        return true;
      }
    );

    // 16. Reject duplicate Office Number on same floor
    console.log('\n[TEST 16] Reject duplicate Office Number on same floor');
    await assert.rejects(
      async () => {
        await officeService.createOffice({
          FloorID: testFloor.FloorID,
          OfficeNumber: `OF-101-${timestamp}`, // duplicate
          OfficeName: 'Duplicate Office Number',
          SquareMeters: 60
        }, testUserId);
      },
      (err) => {
        assert.equal(err.statusCode, 409);
        console.log('✓ PASS: Rejected duplicate OfficeNumber (409):', err.message);
        return true;
      }
    );

    // 17. Reject operations against inactive/deleted parents
    console.log('\n[TEST 17] Reject operations against inactive parent');
    const inactivePark = await parkService.createPark({
      BusinessParkCode: `BP-INACT-${timestamp}`,
      BusinessParkName: 'Inactive Park',
      IsActive: 0
    }, testUserId);

    await assert.rejects(
      async () => {
        await facilityZoneService.createFacilityZone({
          BusinessParkID: inactivePark.BusinessParkID,
          FacilityZoneCode: `ZN-INACT-${timestamp}`,
          FacilityZoneName: 'Should Fail on Inactive Park'
        }, testUserId);
      },
      (err) => {
        assert.equal(err.statusCode, 400);
        console.log('✓ PASS: Rejected Zone creation under inactive Park (400):', err.message);
        return true;
      }
    );

    // 18. Safe Delete Guard: Reject deleting Floor with active Office Units
    console.log('\n[TEST 18] Reject deleting Floor with active Office Units');
    await assert.rejects(
      async () => {
        await floorService.deleteFloor(testFloor.FloorID, testUserId);
      },
      (err) => {
        assert.equal(err.statusCode, 409);
        console.log('✓ PASS: Blocked Floor deletion with active offices (409):', err.message);
        return true;
      }
    );

    // 19. Safe Delete Guard: Reject deleting Building with active Floors
    console.log('\n[TEST 19] Reject deleting Building with active Floors');
    await assert.rejects(
      async () => {
        await buildingService.deleteBuilding(testBuilding.BuildingID, testUserId);
      },
      (err) => {
        assert.equal(err.statusCode, 409);
        console.log('✓ PASS: Blocked Building deletion with active floors (409):', err.message);
        return true;
      }
    );

    // 20. Safe Delete Guard: Reject deleting Facility Zone with active Buildings
    console.log('\n[TEST 20] Reject deleting Facility Zone with active Buildings');
    await assert.rejects(
      async () => {
        await facilityZoneService.deleteFacilityZone(testZone.FacilityZoneID, testUserId);
      },
      (err) => {
        assert.equal(err.statusCode, 409);
        console.log('✓ PASS: Blocked Facility Zone deletion with active buildings (409):', err.message);
        return true;
      }
    );

    console.log('\n====================================================');
    console.log('ALL 20 SCENARIOS PASSED WITH ZERO FAILURES!');
    console.log('====================================================\n');

  } finally {
    // Clean up test data
    console.log('Cleaning up test data...');
    try {
      if (testOffice) await query(`DELETE FROM officespace WHERE OfficeNumber LIKE ?`, [`%${timestamp}%`]);
      if (testFloor) await query(`DELETE FROM floor WHERE BuildingID = ?`, [testBuilding?.BuildingID]);
      if (testBuilding) await query(`DELETE FROM building WHERE BusinessParkID = ?`, [testPark?.BusinessParkID]);
      if (testZone) await query(`DELETE FROM facilityzone WHERE BusinessParkID = ?`, [testPark?.BusinessParkID]);
      if (testPark) await query(`DELETE FROM businesspark WHERE BusinessParkID = ?`, [testPark.BusinessParkID]);
      await query(`DELETE FROM businesspark WHERE BusinessParkCode LIKE ?`, [`%${timestamp}%`]);
      console.log('Cleanup complete.');
    } catch (e) {
      console.warn('Cleanup error (non-fatal):', e.message);
    }
  }
}

runTests().then(() => process.exit(0)).catch((e) => {
  console.error('Test suite failed:', e);
  process.exit(1);
});
