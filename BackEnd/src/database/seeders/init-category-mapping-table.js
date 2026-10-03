import db from '../connection.js';

export async function initServiceCategoryMappingTable() {
  console.log('--- Ensuring ServiceCategoryDepartmentMapping table exists ---');

  await db.query(`
    CREATE TABLE IF NOT EXISTS ServiceCategoryDepartmentMapping (
      MappingID BIGINT AUTO_INCREMENT PRIMARY KEY,
      ServiceCategoryID BIGINT NOT NULL,
      DepartmentID BIGINT NOT NULL,
      IsActive TINYINT NOT NULL DEFAULT 1,
      IsDeleted TINYINT NOT NULL DEFAULT 0,
      CreatedBy BIGINT NOT NULL DEFAULT 1,
      CreatedDate DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      ModifiedBy BIGINT NULL,
      ModifiedDate DATETIME(6) NULL,
      DeletedBy BIGINT NULL,
      DeletedDate DATETIME(6) NULL,
      RowVersion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      CONSTRAINT fk_scdm_category FOREIGN KEY (ServiceCategoryID) REFERENCES ServiceCategory(ServiceCategoryID) ON UPDATE CASCADE ON DELETE CASCADE,
      CONSTRAINT fk_scdm_dept FOREIGN KEY (DepartmentID) REFERENCES Department(DepartmentID) ON UPDATE CASCADE ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Ensure index on ServiceCategoryID
  try {
    const indexes = await db.query(`SHOW INDEX FROM ServiceCategoryDepartmentMapping WHERE Key_name = 'idx_scdm_category'`);
    if (indexes.length === 0) {
      await db.query(`
        CREATE INDEX idx_scdm_category ON ServiceCategoryDepartmentMapping (ServiceCategoryID);
      `);
    }
  } catch (idxErr) {
    console.warn('Index check/creation warning:', idxErr.message);
  }

  // Seed default mappings for categories that don't have active mappings yet
  const categories = await db.query(`SELECT ServiceCategoryID, CategoryCode, CategoryName FROM ServiceCategory WHERE IsDeleted = 0`);
  const departments = await db.query(`
    SELECT d.DepartmentID, d.DepartmentCode, d.DepartmentName
    FROM Department d
    WHERE d.IsDeleted = 0
  `);

  for (const cat of categories) {
    // Check if mapping exists
    const existing = await db.query(
      `SELECT MappingID FROM ServiceCategoryDepartmentMapping WHERE ServiceCategoryID = ? AND IsDeleted = 0`,
      [cat.ServiceCategoryID]
    );

    if (existing.length === 0) {
      // Find matching department by code/name or default to first department
      let matchedDept = departments.find(d => 
        (cat.CategoryCode.includes('IT') && d.DepartmentCode.includes('IT')) ||
        (cat.CategoryCode.includes('FAC') && (d.DepartmentCode.includes('FAC') || d.DepartmentCode.includes('MAINT'))) ||
        (cat.CategoryCode.includes('SEC') && d.DepartmentCode.includes('SEC')) ||
        (cat.CategoryCode.includes('HR') && d.DepartmentCode.includes('HR')) ||
        (cat.CategoryCode.includes('WATER') && (d.DepartmentCode.includes('WATER') || d.DepartmentName.toLowerCase().includes('water')))
      );

      if (!matchedDept) {
        matchedDept = departments[0];
      }

      if (matchedDept) {
        await db.query(
          `INSERT INTO ServiceCategoryDepartmentMapping (ServiceCategoryID, DepartmentID, IsActive, CreatedBy) VALUES (?, ?, 1, 1)`,
          [cat.ServiceCategoryID, matchedDept.DepartmentID]
        );
        console.log(`Auto-seeded mapping: ${cat.CategoryName} -> ${matchedDept.DepartmentName}`);
      }
    }
  }

  console.log('--- ServiceCategoryDepartmentMapping table initialization complete ---');
}

if (process.argv[1] && process.argv[1].includes('init-category-mapping-table')) {
  initServiceCategoryMappingTable().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
