import AppError from '../../../shared/errors/AppError.js';
import localizationRepository from '../repositories/localization.repository.js';

class LocalizationService {
  async list(query) {
    return localizationRepository.findAll({
      page: query.page,
      limit: query.limit,
      activeOnly: query.activeOnly
    });
  }

  async getById(id, includeResources = false) {
    const record = await localizationRepository.findById(id, includeResources);
    if (!record) throw new AppError('Localization not found', 404);
    return record;
  }

  async create(payload, userId) {
    if (await localizationRepository.localeExists(payload.languageCode, payload.countryCode)) {
      throw new AppError('Localization locale already exists', 409);
    }
    return localizationRepository.create(payload, userId);
  }

  async update(id, payload, userId) {
    const existing = await localizationRepository.findById(id);
    if (!existing) throw new AppError('Localization not found', 404);

    const languageCode = payload.languageCode ?? existing.LanguageCode;
    const countryCode = payload.countryCode ?? existing.CountryCode;

    if (
      (payload.languageCode || payload.countryCode) &&
      (languageCode !== existing.LanguageCode || countryCode !== existing.CountryCode)
    ) {
      if (await localizationRepository.localeExists(languageCode, countryCode, id)) {
        throw new AppError('Localization locale already exists', 409);
      }
    }

    return localizationRepository.update(id, payload, userId);
  }

  async remove(id, userId) {
    await localizationRepository.softDelete(id, userId);
    return { message: 'Localization deleted successfully' };
  }

  async listResources(localizationId) {
    await this.getById(localizationId);
    return localizationRepository.findResourcesByLocaleId(localizationId);
  }

  async createResource(localizationId, payload, userId) {
    await this.getById(localizationId);
    if (await localizationRepository.resourceKeyExists(localizationId, payload.resourceKey)) {
      throw new AppError('Resource key already exists for this locale', 409);
    }
    return localizationRepository.createResource(localizationId, payload, userId);
  }

  async updateResource(resourceId, payload, userId) {
    const existing = await localizationRepository.findResourceById(resourceId);
    if (!existing) throw new AppError('Language resource not found', 404);

    if (payload.resourceKey && payload.resourceKey !== existing.ResourceKey) {
      if (await localizationRepository.resourceKeyExists(existing.LocalizationID, payload.resourceKey, resourceId)) {
        throw new AppError('Resource key already exists for this locale', 409);
      }
    }

    return localizationRepository.updateResource(resourceId, payload, userId);
  }

  async removeResource(resourceId, userId) {
    await localizationRepository.softDeleteResource(resourceId, userId);
    return { message: 'Language resource deleted successfully' };
  }
}

export default new LocalizationService();
