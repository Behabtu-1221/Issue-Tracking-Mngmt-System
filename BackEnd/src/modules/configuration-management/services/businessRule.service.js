import AppError from '../../../shared/errors/AppError.js';
import businessRuleRepository from '../repositories/businessRule.repository.js';

class BusinessRuleService {
  async list(query) {
    return businessRuleRepository.findAll({
      page: query.page,
      limit: query.limit,
      search: query.search,
      activeOnly: query.activeOnly
    });
  }

  async getById(id) {
    const record = await businessRuleRepository.findById(id);
    if (!record) throw new AppError('Business rule not found', 404);
    return record;
  }

  async getByCode(code) {
    const record = await businessRuleRepository.findByCode(code);
    if (!record) throw new AppError(`Business rule '${code}' not found`, 404);
    return record;
  }

  async create(payload, userId) {
    if (await businessRuleRepository.codeExists(payload.code)) {
      throw new AppError('Business rule code already exists', 409);
    }
    return businessRuleRepository.create(payload, userId);
  }

  async update(id, payload, userId) {
    const existing = await businessRuleRepository.findById(id);
    if (!existing) throw new AppError('Business rule not found', 404);

    if (payload.code && payload.code !== existing.RuleCode) {
      if (await businessRuleRepository.codeExists(payload.code, id)) {
        throw new AppError('Business rule code already exists', 409);
      }
    }

    return businessRuleRepository.update(id, payload, userId);
  }

  async remove(id, userId) {
    await businessRuleRepository.softDelete(id, userId);
    return { message: 'Business rule deleted successfully' };
  }
}

export default new BusinessRuleService();
