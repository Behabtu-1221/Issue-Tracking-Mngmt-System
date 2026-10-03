import AppError from '../../../shared/errors/AppError.js';
import lookupTypeRepository from '../repositories/lookupType.repository.js';

class LookupTypeService {
  async list(query) {
    return lookupTypeRepository.findAll({
      page: query.page,
      limit: query.limit,
      search: query.search,
      activeOnly: query.activeOnly
    });
  }

  async getById(id, includeValues = false) {
    const record = await lookupTypeRepository.findById(id, includeValues);
    if (!record) {
      throw new AppError('Lookup type not found', 404);
    }
    return record;
  }

  async getByCode(code, includeValues = true) {
    const record = await lookupTypeRepository.findByCode(code);
    if (!record) {
      throw new AppError(`Lookup type '${code}' not found`, 404);
    }

    if (includeValues) {
      record.values = await lookupTypeRepository.findValuesByTypeId(record.LookupTypeID, true);
    }

    return record;
  }

  async create(payload, userId) {
    if (await lookupTypeRepository.codeExists(payload.code)) {
      throw new AppError('Lookup type code already exists', 409);
    }
    return lookupTypeRepository.create(payload, userId);
  }

  async update(id, payload, userId) {
    const existing = await lookupTypeRepository.findById(id);
    if (!existing) {
      throw new AppError('Lookup type not found', 404);
    }

    if (payload.code && payload.code !== existing.LookupTypeCode) {
      if (await lookupTypeRepository.codeExists(payload.code, id)) {
        throw new AppError('Lookup type code already exists', 409);
      }
    }

    return lookupTypeRepository.update(id, payload, userId);
  }

  async remove(id, userId) {
    await lookupTypeRepository.softDelete(id, userId);
    return { message: 'Lookup type deleted successfully' };
  }

  async listValues(lookupTypeId, activeOnly = false) {
    await this.getById(lookupTypeId);
    return lookupTypeRepository.findValuesByTypeId(lookupTypeId, activeOnly);
  }

  async createValue(lookupTypeId, payload, userId) {
    await this.getById(lookupTypeId);

    if (await lookupTypeRepository.valueCodeExists(lookupTypeId, payload.code)) {
      throw new AppError('Lookup value code already exists for this type', 409);
    }

    return lookupTypeRepository.createValue(lookupTypeId, payload, userId);
  }

  async updateValue(valueId, payload, userId) {
    const existing = await lookupTypeRepository.findValueById(valueId);
    if (!existing) {
      throw new AppError('Lookup value not found', 404);
    }

    if (payload.code && payload.code !== existing.LookupValueCode) {
      if (await lookupTypeRepository.valueCodeExists(existing.LookupTypeID, payload.code, valueId)) {
        throw new AppError('Lookup value code already exists for this type', 409);
      }
    }

    return lookupTypeRepository.updateValue(valueId, payload, userId);
  }

  async removeValue(valueId, userId) {
    await lookupTypeRepository.softDeleteValue(valueId, userId);
    return { message: 'Lookup value deleted successfully' };
  }
}

export default new LookupTypeService();
