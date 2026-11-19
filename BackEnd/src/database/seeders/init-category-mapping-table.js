import db from '../connection.js';

export async function initServiceCategoryMappingTable() {
  console.log('--- Ensuring ServiceCategoryDepartmentMapping table exists ---');

  // Disable FK checks during DDL to prevent order dependencies on startup
  try {
    await db.query('SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0');
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
        CONSTRAINT uq_scdm_cat_dept UNIQUE (ServiceCategoryID, DepartmentID),
        CONSTRAINT fk_scdm_category FOREIGN KEY (ServiceCategoryID) REFERENCES ServiceCategory(ServiceCategoryID) ON UPDATE CASCADE ON DELETE CASCADE,
        CONSTRAINT fk_scdm_dept FOREIGN KEY (DepartmentID) REFERENCES Department(DepartmentID) ON UPDATE CASCADE ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  } catch (ddlErr) {
    console.warn('ServiceCategoryDepartmentMapping DDL notice:', ddlErr.message);
  } finally {
    try {
      await db.query('SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS');
    } catch {
      // Ignored
    }
  }

  // Ensure index on ServiceCategoryID and DepartmentID
  try {
    const [catIdx] = await db.query(`SHOW INDEX FROM ServiceCategoryDepartmentMapping WHERE Key_name = 'idx_scdm_category'`);
    if (!catIdx || catIdx.length === 0) {
      await db.query(`CREATE INDEX idx_scdm_category ON ServiceCategoryDepartmentMapping (ServiceCategoryID);`);
    }
    const [deptIdx] = await db.query(`SHOW INDEX FROM ServiceCategoryDepartmentMapping WHERE Key_name = 'idx_scdm_dept'`);
    if (!deptIdx || deptIdx.length === 0) {
      await db.query(`CREATE INDEX idx_scdm_dept ON ServiceCategoryDepartmentMapping (DepartmentID);`);
    }
  } catch (idxErr) {
    console.warn('Index check/creation warning:', idxErr.message);
  }

  // Check if tables are available before seeding default mappings
  try {
    const [hasCat] = await db.query(`SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ServiceCategory' LIMIT 1`);
    const [hasDept] = await db.query(`SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Department' LIMIT 1`);
    if (!hasCat || !hasDept) {
      console.log('--- ServiceCategory or Department table not yet available; skipping mapping seeder ---');
      return;
    }

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
          (cat.CategoryCode.includes('ELECT') && (d.DepartmentCode.includes('FAC') || d.DepartmentName.toLowerCase().includes('facilities') || d.DepartmentCode.includes('ELECT'))) ||
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
  } catch (seedErr) {
    console.warn('Mapping seeder notice:', seedErr.message);
  }

  console.log('--- ServiceCategoryDepartmentMapping table initialization complete ---');
}

export const initServiceCategoryDepartmentMapping = initServiceCategoryMappingTable;
export default initServiceCategoryMappingTable;
