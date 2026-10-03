import BaseLookupRepository from '../../../shared/repositories/baseLookup.repository.js';
import { getEntityConfig } from '../constants/lookupEntities.js';

const repositoryCache = new Map();

export const getLookupRepository = (entityKey) => {
  if (repositoryCache.has(entityKey)) {
    return repositoryCache.get(entityKey);
  }

  const config = getEntityConfig(entityKey);
  if (!config) {
    return null;
  }

  const repository = new BaseLookupRepository(config);
  repositoryCache.set(entityKey, repository);
  return repository;
};

export default getLookupRepository;
