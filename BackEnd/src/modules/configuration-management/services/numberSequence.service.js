import AppError from '../../../shared/errors/AppError.js';
import numberSequenceRepository from '../repositories/numberSequence.repository.js';

class NumberSequenceService {
  async list(query) {
    return numberSequenceRepository.findAll({
      page: query.page,
      limit: query.limit,
      search: query.search,
      activeOnly: query.activeOnly
    });
  }

  async getById(id) {
    const record = await numberSequenceRepository.findById(id);
    if (!record) throw new AppError('Number sequence not found', 404);
    return record;
  }

  async getByCode(code) {
    const record = await numberSequenceRepository.findByCode(code);
    if (!record) throw new AppError(`Number sequence '${code}' not found`, 404);
    return record;
  }

  async create(payload, userId) {
    if (await numberSequenceRepository.codeExists(payload.code)) {
      throw new AppError('Number sequence code already exists', 409);
    }
    return numberSequenceRepository.create(payload, userId);
  }

  async update(id, payload, userId) {
    const existing = await numberSequenceRepository.findById(id);
    if (!existing) throw new AppError('Number sequence not found', 404);

    if (payload.code && payload.code !== existing.SequenceCode) {
      if (await numberSequenceRepository.codeExists(payload.code, id)) {
        throw new AppError('Number sequence code already exists', 409);
      }
    }

    return numberSequenceRepository.update(id, payload, userId);
  }

  async generateNext(code) {
    return numberSequenceRepository.generateNext(code);
  }

  async remove(id, userId) {
    await numberSequenceRepository.softDelete(id, userId);
    return { message: 'Number sequence deleted successfully' };
  }
}

export default new NumberSequenceService();
