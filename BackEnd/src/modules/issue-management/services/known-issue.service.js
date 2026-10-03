import knownIssueRepository from '../repositories/known-issue.repository.js';
import AppError from '../../../shared/errors/AppError.js';

export const knownIssueService = {
  async getKnownIssues(params) {
    return knownIssueRepository.findAll(params);
  },

  async getKnownIssueById(id) {
    const issue = await knownIssueRepository.findById(id);
    if (!issue) {
      throw new AppError(`Known issue with ID ${id} not found`, 404);
    }
    return issue;
  },

  async createKnownIssue(data, userId) {
    return knownIssueRepository.create({
      ...data,
      CreatedBy: userId || 1
    });
  },

  async updateKnownIssue(id, data, userId) {
    const existing = await knownIssueRepository.findById(id);
    if (!existing) {
      throw new AppError(`Known issue with ID ${id} not found`, 404);
    }
    return knownIssueRepository.update(id, {
      ...data,
      ModifiedBy: userId || 1
    });
  },

  async deleteKnownIssue(id, userId) {
    const existing = await knownIssueRepository.findById(id);
    if (!existing) {
      throw new AppError(`Known issue with ID ${id} not found`, 404);
    }
    await knownIssueRepository.softDelete(id, userId);
    return { message: 'Known issue article deleted successfully.' };
  }
};

export default knownIssueService;
