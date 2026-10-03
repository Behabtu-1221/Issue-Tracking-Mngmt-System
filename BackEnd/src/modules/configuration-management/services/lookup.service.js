import AppError from '../../../shared/errors/AppError.js';
import { getEntityConfig } from '../constants/lookupEntities.js';
import { getLookupRepository } from '../repositories/lookup.repository.js';

class LookupService {
  resolveRepository(entityKey) {
    const config = getEntityConfig(entityKey);
    if (!config) {
      throw new AppError(`Unknown lookup entity: ${entityKey}`, 404);
    }

    return {
      config,
      repository: getLookupRepository(entityKey)
    };
  }

  async list(entityKey, query) {
    const { repository } = this.resolveRepository(entityKey);
    return repository.findAll({
      page: query.page,
      limit: query.limit,
      search: query.search,
      activeOnly: query.activeOnly === 'true' || query.activeOnly === true
    });
  }

  async getById(entityKey, id) {
    const { config, repository } = this.resolveRepository(entityKey);
    const record = await repository.findById(id);

    if (!record) {
      throw new AppError(`${config.label} not found`, 404);
    }

    return record;
  }

  async getByCode(entityKey, code) {
    const { config, repository } = this.resolveRepository(entityKey);
    const record = await repository.findByCode(code);

    if (!record) {
      throw new AppError(`${config.label} with code '${code}' not found`, 404);
    }

    return record;
  }

  async create(entityKey, payload, userId) {
    const { config, repository } = this.resolveRepository(entityKey);

    if (await repository.codeExists(payload.code)) {
      throw new AppError(`${config.label} code already exists`, 409);
    }

    return repository.create(payload, userId);
  }

  async update(entityKey, id, payload, userId) {
    const { config, repository } = this.resolveRepository(entityKey);

    const existing = await repository.findById(id);
    if (!existing) {
      throw new AppError(`${config.label} not found`, 404);
    }

    if (payload.code && payload.code !== existing[config.codeColumn]) {
      if (await repository.codeExists(payload.code, id)) {
        throw new AppError(`${config.label} code already exists`, 409);
      }
    }

    return repository.update(id, payload, userId);
  }

  async remove(entityKey, id, userId) {
    const { config, repository } = this.resolveRepository(entityKey);
    await repository.softDelete(id, userId);
    return { message: `${config.label} deleted successfully` };
  }
}

export default new LookupService();
