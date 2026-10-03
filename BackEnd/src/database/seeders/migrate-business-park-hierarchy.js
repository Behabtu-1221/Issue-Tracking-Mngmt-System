import { query } from '../connection.js';
import logger from '../../shared/utils/logger.js';

export async function migrateBusinessParkHierarchy() {
  console.log('--- Starting Business Park Hierarchy Migration ---');

  try {
    // 1. Check if FacilityZoneID column exists in Building table
    const columns = await query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'building' 
        AND COLUMN_NAME = 'FacilityZoneID'
    `);

    if (columns.length === 0) {
      console.log('Adding FacilityZoneID column to building table...');
      await query(`
        ALTER TABLE building 
        ADD COLUMN FacilityZoneID BIGINT NULL AFTER BusinessParkID
      `);
      console.log('FacilityZoneID column added successfully.');
    } else {
      console.log('FacilityZoneID column already exists in building table.');
    }

    // 2. Ensure each active Business Park has at least one Facility Zone
    const parks = await query(`SELECT BusinessParkID, BusinessParkCode, BusinessParkName FROM businesspark WHERE IsDeleted = 0`);
    for (const park of parks) {
      const zones = await query(`
        SELECT FacilityZoneID FROM facilityzone 
        WHERE BusinessParkID = ? AND IsDeleted = 0 
        ORDER BY FacilityZoneID ASC
      `, [park.BusinessParkID]);

      if (zones.length === 0) {
        console.log(`Creating default Facility Zone for Business Park ${park.BusinessParkName} (ID: ${park.BusinessParkID})...`);
        const zoneCode = `ZN-${park.BusinessParkCode || 'PARK'}-01`;
        await query(`
          INSERT INTO facilityzone (
            BusinessParkID, FacilityZoneCode, FacilityZoneName, ZoneType, Description, CapacityLimit, IsActive, CreatedBy
          ) VALUES (?, ?, ?, 'OPERATIONAL', 'Primary Operational Zone', 100, 1, 1)
        `, [park.BusinessParkID, zoneCode, `${park.BusinessParkName} Primary Zone`]);
      }
    }

    // 3. Assign existing buildings with NULL FacilityZoneID to the first active zone of their Business Park
    const unassignedBuildings = await query(`
      SELECT b.BuildingID, b.BuildingName, b.BusinessParkID 
      FROM building b 
      WHERE b.FacilityZoneID IS NULL
    `);

    if (unassignedBuildings.length > 0) {
      console.log(`Found ${unassignedBuildings.length} buildings with NULL FacilityZoneID. Assigning to active zones...`);
      for (const bldg of unassignedBuildings) {
        const [zone] = await query(`
          SELECT FacilityZoneID FROM facilityzone 
          WHERE BusinessParkID = ? AND IsDeleted = 0 
          ORDER BY FacilityZoneID ASC LIMIT 1
        `, [bldg.BusinessParkID]);

        if (zone) {
          await query(`UPDATE building SET FacilityZoneID = ? WHERE BuildingID = ?`, [zone.FacilityZoneID, bldg.BuildingID]);
          console.log(`Assigned Building '${bldg.BuildingName}' (ID: ${bldg.BuildingID}) to Zone ID ${zone.FacilityZoneID}`);
        } else {
          console.warn(`No active zone found for BusinessParkID ${bldg.BusinessParkID}!`);
        }
      }
    }

    // 4. Ensure index and foreign key on Building(FacilityZoneID)
    const fks = await query(`
      SELECT CONSTRAINT_NAME 
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'building' 
        AND CONSTRAINT_NAME = 'fk_building_facility_zone'
    `);

    if (fks.length === 0) {
      console.log('Adding foreign key fk_building_facility_zone...');
      await query(`
        ALTER TABLE building 
        ADD CONSTRAINT fk_building_facility_zone 
        FOREIGN KEY (FacilityZoneID) REFERENCES facilityzone (FacilityZoneID)
      `);
      console.log('Foreign key fk_building_facility_zone added.');
    } else {
      console.log('Foreign key fk_building_facility_zone already exists.');
    }

    // 5. Ensure index on FacilityZoneID
    const idxs = await query(`
      SHOW INDEX FROM building WHERE Key_name = 'idx_building_facility_zone'
    `);
    if (idxs.length === 0) {
      console.log('Adding index idx_building_facility_zone on building(FacilityZoneID)...');
      await query(`CREATE INDEX idx_building_facility_zone ON building (FacilityZoneID)`);
      console.log('Index idx_building_facility_zone added.');
    }

    // 6. Ensure unique constraint on Floor(BuildingID, FloorCode)
    const floorCodeIdxs = await query(`
      SHOW INDEX FROM floor WHERE Key_name = 'uq_floor_building_code'
    `);
    if (floorCodeIdxs.length === 0) {
      console.log('Adding unique constraint uq_floor_building_code on floor(BuildingID, FloorCode)...');
      try {
        await query(`ALTER TABLE floor ADD CONSTRAINT uq_floor_building_code UNIQUE (BuildingID, FloorCode)`);
        console.log('Unique constraint uq_floor_building_code added.');
      } catch (e) {
        console.warn('Could not add uq_floor_building_code (may have duplicates in existing data):', e.message);
      }
    }

    // 7. Fix corrupted TotalFloors on buildings where it was overwritten to 0
    await query(`
      UPDATE building b
      SET TotalFloors = GREATEST(
        COALESCE(TotalFloors, 1),
        COALESCE((SELECT MAX(FloorNumber) FROM floor f WHERE f.BuildingID = b.BuildingID AND f.IsDeleted = 0), 1),
        1
      )
      WHERE TotalFloors <= 0 OR TotalFloors IS NULL
    `);
    console.log('Normalized Building TotalFloors capacities.');

    // 8. Fix corrupted TotalOfficeSpaces on floors where it was set to 0 or overwritten
    await query(`
      UPDATE floor f
      SET TotalOfficeSpaces = GREATEST(
        COALESCE(TotalOfficeSpaces, 10),
        COALESCE((SELECT COUNT(*) FROM officespace o WHERE o.FloorID = f.FloorID AND o.IsDeleted = 0), 0) + 5,
        10
      )
      WHERE TotalOfficeSpaces <= 0 OR TotalOfficeSpaces IS NULL
    `);
    console.log('Normalized Floor TotalOfficeSpaces capacities.');

    console.log('--- Business Park Hierarchy Migration Complete Successfully ---');
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

if (process.argv[1]?.endsWith('migrate-business-park-hierarchy.js')) {
  migrateBusinessParkHierarchy().then(() => process.exit(0)).catch(() => process.exit(1));
}
