import AppError from '../../../shared/errors/AppError.js';
import featureFlagRepository from '../repositories/featureFlag.repository.js';

class FeatureFlagService {
  async list(query) {
    return featureFlagRepository.findAll({
      page: query.page,
      limit: query.limit,
      search: query.search,
      activeOnly: query.activeOnly,
      enabledOnly: query.enabledOnly
    });
  }

  async getById(id) {
    const record = await featureFlagRepository.findById(id);
    if (!record) throw new AppError('Feature flag not found', 404);
    return record;
  }

  async getByCode(code) {
    const record = await featureFlagRepository.findByCode(code);
    if (!record) throw new AppError(`Feature flag '${code}' not found`, 404);
    return record;
  }

  async isEnabled(code) {
    const record = await featureFlagRepository.findByCode(code);
    return {
      code,
      isEnabled: Boolean(record?.IsEnabled && record?.IsActive)
    };
  }

  async create(payload, userId) {
    if (await featureFlagRepository.codeExists(payload.code)) {
      throw new AppError('Feature flag code already exists', 409);
    }
    return featureFlagRepository.create(payload, userId);
  }

  async update(id, payload, userId) {
    const existing = await featureFlagRepository.findById(id);
    if (!existing) throw new AppError('Feature flag not found', 404);

    if (payload.code && payload.code !== existing.FlagCode) {
      if (await featureFlagRepository.codeExists(payload.code, id)) {
        throw new AppError('Feature flag code already exists', 409);
      }
    }

    return featureFlagRepository.update(id, payload, userId);
  }

  async toggle(id, isEnabled, userId) {
    await this.getById(id);
    return featureFlagRepository.toggle(id, isEnabled, userId);
  }

  async remove(id, userId) {
    await featureFlagRepository.softDelete(id, userId);
    return { message: 'Feature flag deleted successfully' };
  }
}

export default new FeatureFlagService();
