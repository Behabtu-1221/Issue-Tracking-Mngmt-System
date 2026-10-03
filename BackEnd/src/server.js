import app from './app.js';
import db from './database/connection.js';
import logger from './shared/utils/logger.js';
import { enforceSingleBusinessPark } from './database/seeders/enforce-single-business-park.js';
import { initServiceCategoryMappingTable } from './database/seeders/init-category-mapping-table.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await db.query('SELECT 1');
    logger.info('Database connection established successfully.');
    // Enforce business rule: Ethiopian IT Park is the sole business park campus
    await enforceSingleBusinessPark();
    // Ensure Service Category to Department mappings table exists
    await initServiceCategoryMappingTable();
  } catch (error) {
    logger.error(`Database initialization or connection failed: ${error.message}`);
    logger.warn('Starting server without verified database connection.');
  }

  app.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer();
