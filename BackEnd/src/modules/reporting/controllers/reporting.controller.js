import reportingService from '../services/reporting.service.js';
import { sendSuccess, sendCreated } from '../../../shared/utils/apiResponse.js';
import { getQuery, getParams } from '../../../shared/utils/requestData.js';

export const reportingController = {
  // ── 1. Executive Dashboard ──
  async getExecutiveOverview(req, res, next) {
    try {
      const filters = getQuery(req);
      const data = await reportingService.getExecutiveOverview(filters, req.actor);
      sendSuccess(res, data, 'Executive reporting metrics retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  // ── 2. Request Analytics ──
  async getRequestAnalytics(req, res, next) {
    try {
      const filters = getQuery(req);
      const data = await reportingService.getRequestAnalytics(filters, req.actor);
      sendSuccess(res, data, 'Request analytics retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  // ── 3. Assignment & Workload Analytics ──
  async getAssignmentAnalytics(req, res, next) {
    try {
      const filters = getQuery(req);
      const data = await reportingService.getAssignmentAnalytics(filters, req.actor);
      sendSuccess(res, data, 'Assignment workload analytics retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  // ── 4. SLA & Escalations Analytics ──
  async getSLAAnalytics(req, res, next) {
    try {
      const filters = getQuery(req);
      const data = await reportingService.getSLAAnalytics(filters, req.actor);
      sendSuccess(res, data, 'SLA and escalation performance metrics retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  // ── 5. Tenant Performance Analytics ──
  async getTenantPerformance(req, res, next) {
    try {
      const filters = getQuery(req);
      const data = await reportingService.getTenantPerformance(filters, req.actor);
      sendSuccess(res, data, 'Tenant benchmarking performance retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  // ── 6. Department Performance Analytics ──
  async getDepartmentPerformance(req, res, next) {
    try {
      const filters = getQuery(req);
      const data = await reportingService.getDepartmentPerformance(filters, req.actor);
      sendSuccess(res, data, 'Department resolution efficiency retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  // ── 7. Approval & Governance Analytics ──
  async getApprovalAnalytics(req, res, next) {
    try {
      const filters = getQuery(req);
      const data = await reportingService.getApprovalAnalytics(filters, req.actor);
      sendSuccess(res, data, 'Approval workflow analytics retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  // ── 8. Audit & Compliance Analytics ──
  async getAuditAnalytics(req, res, next) {
    try {
      const filters = getQuery(req);
      const data = await reportingService.getAuditAnalytics(filters, req.actor);
      sendSuccess(res, data, 'Audit telemetry analytics retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  // ── 9. Knowledge Base Analytics ──
  async getKnowledgeAnalytics(req, res, next) {
    try {
      const data = await reportingService.getKnowledgeAnalytics();
      sendSuccess(res, data, 'Knowledge base engagement analytics retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  // ── 10. Saved Reports Management ──
  async getSavedReports(req, res, next) {
    try {
      const data = await reportingService.getSavedReports(req.actor);
      sendSuccess(res, data, 'Saved reports retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  async createSavedReport(req, res, next) {
    try {
      const data = await reportingService.createSavedReport(req.body, req.actor);
      sendCreated(res, data, 'Saved report configuration created successfully');
    } catch (err) {
      next(err);
    }
  },

  async updateSavedReport(req, res, next) {
    try {
      const { id } = getParams(req);
      const data = await reportingService.updateSavedReport(id, req.body, req.actor);
      sendSuccess(res, data, 'Saved report updated successfully');
    } catch (err) {
      next(err);
    }
  },

  async deleteSavedReport(req, res, next) {
    try {
      const { id } = getParams(req);
      const data = await reportingService.deleteSavedReport(id, req.actor);
      sendSuccess(res, data, 'Saved report removed successfully');
    } catch (err) {
      next(err);
    }
  },

  // ── 11. Report Schedules & Execution History ──
  async getReportSchedules(req, res, next) {
    try {
      const data = await reportingService.getReportSchedules(req.actor);
      sendSuccess(res, data, 'Report schedules retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  async createReportSchedule(req, res, next) {
    try {
      const data = await reportingService.createReportSchedule(req.body, req.actor);
      sendCreated(res, data, 'Report schedule registered successfully');
    } catch (err) {
      next(err);
    }
  },

  async updateReportSchedule(req, res, next) {
    try {
      const { id } = getParams(req);
      const data = await reportingService.updateReportSchedule(id, req.body, req.actor);
      sendSuccess(res, data, 'Report schedule updated successfully');
    } catch (err) {
      next(err);
    }
  },

  async deleteReportSchedule(req, res, next) {
    try {
      const { id } = getParams(req);
      const data = await reportingService.deleteReportSchedule(id, req.actor);
      sendSuccess(res, data, 'Report schedule removed successfully');
    } catch (err) {
      next(err);
    }
  },

  async triggerScheduleExecution(req, res, next) {
    try {
      const { id } = getParams(req);
      const data = await reportingService.triggerScheduleExecution(id, req.actor);
      sendSuccess(res, data, 'Report schedule triggered successfully');
    } catch (err) {
      next(err);
    }
  },

  async getExecutionHistory(req, res, next) {
    try {
      const data = await reportingService.getExecutionHistory(req.actor);
      sendSuccess(res, data, 'Report execution logs retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  // ── 12. Universal Export Engine (Direct Download Stream) ──
  async exportReport(req, res, next) {
    try {
      const { reportType } = req.params;
      const { format = 'CSV', ...filters } = getQuery(req);

      const { fileContent, mimeType, filename } = await reportingService.exportReport(
        reportType.toUpperCase(),
        format.toUpperCase(),
        filters,
        req.actor
      );

      res.setHeader('Content-Type', `${mimeType}; charset=utf-8`);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(fileContent);
    } catch (err) {
      next(err);
    }
  }
};

export default reportingController;
