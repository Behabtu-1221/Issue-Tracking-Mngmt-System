import { query } from '../connection.js';
import logger from '../../shared/utils/logger.js';

export async function enforceSingleBusinessPark() {
  console.log('=== Enforcing Single Business Park Campus: Ethiopian IT Park ===');

  try {
    // 1. Locate Ethiopian IT Park record
    const parks = await query(`
      SELECT * FROM businesspark 
      WHERE BusinessParkName LIKE '%Ethiopian IT Park%' 
         OR BusinessParkCode IN ('ICT_PARK_AA', 'EITP')
      ORDER BY BusinessParkID ASC
    `);

    let targetParkId = null;

    if (parks.length > 0) {
      targetParkId = parks[0].BusinessParkID;
      console.log(`Found Ethiopian IT Park with ID: ${targetParkId}`);
      
      // Ensure Ethiopian IT Park is active and operational
      await query(`
        UPDATE businesspark 
        SET BusinessParkName = 'Ethiopian IT Park',
            BusinessParkCode = 'ICT_PARK_AA',
            ShortName = 'EITP',
            Description = 'Central Ethiopian IT Park Campus — National ICT and Innovation Hub',
            Country = 'Ethiopia',
            City = 'Addis Ababa',
            SubCity = COALESCE(SubCity, 'Bole'),
            Woreda = COALESCE(Woreda, 'Koye Feche'),
            AddressLine1 = COALESCE(AddressLine1, 'Ring Road'),
            Email = COALESCE(Email, 'info@eitp.gov.et'),
            PhoneNumber = COALESCE(PhoneNumber, '+251 11 888 8888'),
            Website = COALESCE(Website, 'https://itpark.gov.et'),
            TimeZone = 'Africa/Addis_Ababa',
            CurrencyCode = 'ETB',
            LanguageCode = 'en',
            IsOperational = 1,
            IsActive = 1,
            IsDeleted = 0,
            DeletedBy = NULL,
            DeletedDate = NULL
        WHERE BusinessParkID = ?
      `, [targetParkId]);
    } else {
      console.log('Ethiopian IT Park not found. Inserting primary record...');
      const insertRes = await query(`
        INSERT INTO businesspark (
          BusinessParkCode, BusinessParkName, ShortName, Description,
          Email, PhoneNumber, Website, Country, City, SubCity, Woreda,
          AddressLine1, TimeZone, CurrencyCode, LanguageCode,
          TotalAreaSquareMeter, IsOperational, IsActive, IsDeleted, CreatedBy
        ) VALUES (
          'ICT_PARK_AA', 'Ethiopian IT Park', 'EITP',
          'Central Ethiopian IT Park Campus — National ICT and Innovation Hub',
          'info@eitp.gov.et', '+251 11 888 8888', 'https://itpark.gov.et',
          'Ethiopia', 'Addis Ababa', 'Bole', 'Koye Feche',
          'Ring Road', 'Africa/Addis_Ababa', 'ETB', 'en',
          3000000.00, 1, 1, 0, 1
        )
      `);
      targetParkId = insertRes.insertId;
      console.log(`Created Ethiopian IT Park with ID: ${targetParkId}`);
    }

    // 2. Reassign all child records from any other park to Ethiopian IT Park
    console.log(`Reassigning all entities to Ethiopian IT Park (ID: ${targetParkId})...`);

    const childTables = [
      'building',
      'facilityzone',
      'location',
      'tenant',
      'announcement',
      'broadcastnotification',
      'riskassessment'
    ];

    for (const table of childTables) {
      try {
        const updateRes = await query(
          `UPDATE \`${table}\` SET BusinessParkID = ? WHERE BusinessParkID != ?`,
          [targetParkId, targetParkId]
        );
        if (updateRes.affectedRows > 0) {
          console.log(`  Updated ${updateRes.affectedRows} row(s) in \`${table}\` to BusinessParkID = ${targetParkId}`);
        }
      } catch (tableErr) {
        console.warn(`  Notice updating \`${table}\`: ${tableErr.message}`);
      }
    }

    // 3. Delete all extraneous business parks
    const delRes = await query(
      `DELETE FROM businesspark WHERE BusinessParkID != ?`,
      [targetParkId]
    );
    console.log(`Purged ${delRes.affectedRows} extraneous business park record(s).`);

    // 4. Optionally standardize Ethiopian IT Park to BusinessParkID = 1 if not already
    if (targetParkId !== 1) {
      console.log(`Standardizing Ethiopian IT Park ID from ${targetParkId} to canonical ID 1...`);
      await query(`UPDATE businesspark SET BusinessParkID = 1 WHERE BusinessParkID = ?`, [targetParkId]);
      targetParkId = 1;
      console.log('Cascaded BusinessParkID update to all child tables successfully.');
    }

    // Reset auto-increment
    await query(`ALTER TABLE businesspark AUTO_INCREMENT = 2`);

    // 5. Verify final state
    const remainingParks = await query(`SELECT BusinessParkID, BusinessParkCode, BusinessParkName, IsActive, IsDeleted FROM businesspark`);
    console.log('Final BusinessPark records in database:', remainingParks);

    if (remainingParks.length === 1 && remainingParks[0].BusinessParkName === 'Ethiopian IT Park') {
      console.log('✓ SUCCESS: "Ethiopian IT Park" is now the SOLE business park campus in the system.');
    } else {
      console.warn('⚠️ WARNING: Unexpected business park count or name:', remainingParks);
    }

    return true;
  } catch (error) {
    logger.error('Failed to enforce single business park:', error);
    console.error('Error during enforceSingleBusinessPark:', error);
    throw error;
  }
}

// Allow direct CLI execution: node enforce-single-business-park.js
if (process.argv[1] && process.argv[1].endsWith('enforce-single-business-park.js')) {
  enforceSingleBusinessPark()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
