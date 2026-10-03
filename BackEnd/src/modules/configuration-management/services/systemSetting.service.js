import AppError from '../../../shared/errors/AppError.js';
import { DATA_TYPES } from '../constants/configuration.constants.js';
import systemSettingRepository from '../repositories/systemSetting.repository.js';

const validateSettingValue = (dataType, value) => {
  switch (dataType) {
    case 'INTEGER':
      if (!/^-?\d+$/.test(value)) {
        throw new AppError('Setting value must be a valid integer for INTEGER data type', 400);
      }
      break;
    case 'BOOLEAN':
      if (!['true', 'false', '1', '0'].includes(String(value).toLowerCase())) {
        throw new AppError('Setting value must be true/false for BOOLEAN data type', 400);
      }
      break;
    case 'JSON':
      try {
        JSON.parse(value);
      } catch {
        throw new AppError('Setting value must be valid JSON for JSON data type', 400);
      }
      break;
    default:
      break;
  }
};

class SystemSettingService {
  async list(query) {
    return systemSettingRepository.findAll({
      page: query.page,
      limit: query.limit,
      search: query.search,
      categoryId: query.categoryId,
      activeOnly: query.activeOnly
    });
  }

  async getById(id) {
    const record = await systemSettingRepository.findById(id);
    if (!record) {
      throw new AppError('System setting not found', 404);
    }
    return record;
  }

  async getByKey(key) {
    const record = await systemSettingRepository.findByKey(key);
    if (!record) {
      throw new AppError(`System setting '${key}' not found`, 404);
    }
    return record;
  }

  async create(payload, userId) {
    if (!DATA_TYPES.includes(payload.dataType)) {
      throw new AppError(`Invalid data type. Allowed: ${DATA_TYPES.join(', ')}`, 400);
    }

    if (!(await systemSettingRepository.categoryExists(payload.configurationCategoryId))) {
      throw new AppError('Configuration category not found', 404);
    }

    if (await systemSettingRepository.keyExists(payload.settingKey)) {
      throw new AppError('Setting key already exists', 409);
    }

    validateSettingValue(payload.dataType, payload.settingValue);
    return systemSettingRepository.create(payload, userId);
  }

  async update(id, payload, userId) {
    const existing = await systemSettingRepository.findById(id);
    if (!existing) {
      throw new AppError('System setting not found', 404);
    }

    if (payload.configurationCategoryId !== undefined) {
      if (!(await systemSettingRepository.categoryExists(payload.configurationCategoryId))) {
        throw new AppError('Configuration category not found', 404);
      }
    }

    if (payload.settingKey && payload.settingKey !== existing.SettingKey) {
      if (await systemSettingRepository.keyExists(payload.settingKey, id)) {
        throw new AppError('Setting key already exists', 409);
      }
    }

    const dataType = payload.dataType || existing.DataType;
    const settingValue = payload.settingValue ?? existing.SettingValue;

    if (payload.dataType && !DATA_TYPES.includes(payload.dataType)) {
      throw new AppError(`Invalid data type. Allowed: ${DATA_TYPES.join(', ')}`, 400);
    }

    validateSettingValue(dataType, settingValue);
    return systemSettingRepository.update(id, payload, userId);
  }

  async remove(id, userId) {
    await systemSettingRepository.softDelete(id, userId);
    return { message: 'System setting deleted successfully' };
  }
}

export default new SystemSettingService();
