import slaClockRepository from '../repositories/sla-clock.repository.js';
import slaPolicyRepository from '../repositories/sla-policy.repository.js';
import { notificationService } from '../../notification/services/notification.service.js';
import AppError from '../../../shared/errors/AppError.js';

export const slaClockService = {
  async getOverviewMetrics(tenantId) {
    return slaClockRepository.getOverviewMetrics(tenantId);
  },

  async findAllClocks(params) {
    // Run automated breach check pass before listing
    await this.evaluateBreaches();
    return slaClockRepository.findAllClocks(params);
  },

  async findClockById(id) {
    const clock = await slaClockRepository.findClockById(id);
    if (!clock) {
      throw new AppError('SLA Clock not found', 404);
    }
    return clock;
  },

  async startClockForIssue(requestId, policyId = 1, priorityCode = 'MEDIUM', actionUserId = 1) {
    let stage = await slaPolicyRepository.findStageByPriority(policyId, priorityCode);
    if (!stage) {
      // Fallback stage if policy isn't configured yet
      stage = {
        SLAStageID: 1,
        TargetResponseMinutes: priorityCode === 'CRITICAL' ? 15 : priorityCode === 'HIGH' ? 60 : 120,
        TargetResolutionMinutes: priorityCode === 'CRITICAL' ? 240 : priorityCode === 'HIGH' ? 480 : 1440
      };
    }

    const now = new Date();
    const responseDeadline = new Date(now.getTime() + stage.TargetResponseMinutes * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
    const resolutionDeadline = new Date(now.getTime() + stage.TargetResolutionMinutes * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');

    const clockId = await slaClockRepository.createClock({
      IssueRequestID: requestId,
      SLAStageID: stage.SLAStageID,
      ResponseDeadline: responseDeadline,
      ResolutionDeadline: resolutionDeadline,
      ClockStatus: 'RUNNING',
      CreatedBy: actionUserId
    });

    await slaClockRepository.createHistory({
      SLAClockID: clockId,
      EventName: 'CLOCK_STARTED',
      PerformedByUserID: actionUserId,
      Remarks: `SLA timer started. Target Response: ${stage.TargetResponseMinutes}m, Target Resolution: ${stage.TargetResolutionMinutes}m`,
      CreatedBy: actionUserId
    });

    return slaClockRepository.findClockById(clockId);
  },

  async pauseClock(clockId, pauseReason, actionUserId = 1) {
    const clock = await slaClockRepository.findClockById(clockId);
    if (!clock) throw new AppError('SLA Clock not found', 404);

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await slaClockRepository.updateClock(clockId, {
      ClockStatus: 'PAUSED',
      LastPausedDateTime: now,
      ModifiedBy: actionUserId
    });

    await slaClockRepository.createHistory({
      SLAClockID: clockId,
      EventName: 'CLOCK_PAUSED',
      PerformedByUserID: actionUserId,
      Remarks: pauseReason || 'SLA timer paused by technician',
      CreatedBy: actionUserId
    });

    return slaClockRepository.findClockById(clockId);
  },

  async resumeClock(clockId, actionUserId = 1) {
    const clock = await slaClockRepository.findClockById(clockId);
    if (!clock) throw new AppError('SLA Clock not found', 404);

    let accumulatedPause = clock.AccumulatedPausedSeconds || 0;
    if (clock.LastPausedDateTime) {
      const pausedAt = new Date(clock.LastPausedDateTime).getTime();
      const nowMs = Date.now();
      const pauseSecs = Math.floor((nowMs - pausedAt) / 1000);
      if (pauseSecs > 0) accumulatedPause += pauseSecs;
    }

    await slaClockRepository.updateClock(clockId, {
      ClockStatus: 'RUNNING',
      AccumulatedPausedSeconds: accumulatedPause,
      LastPausedDateTime: null,
      ModifiedBy: actionUserId
    });

    await slaClockRepository.createHistory({
      SLAClockID: clockId,
      EventName: 'CLOCK_RESUMED',
      PerformedByUserID: actionUserId,
      Remarks: `SLA timer resumed. Total accumulated pause: ${Math.round(accumulatedPause / 60)} minutes`,
      CreatedBy: actionUserId
    });

    return slaClockRepository.findClockById(clockId);
  },

  async evaluateBreaches() {
    const activeClocks = await slaClockRepository.findActiveRunningClocks();
    const now = new Date().getTime();

    for (const clock of activeClocks) {
      const responseDeadlineMs = new Date(clock.ResponseDeadline).getTime();
      const resolutionDeadlineMs = new Date(clock.ResolutionDeadline).getTime();

      // Check Response Breach
      if (!clock.IsResponseBreached && !clock.ResponseAchievedDateTime && now > responseDeadlineMs) {
        await slaClockRepository.updateClock(clock.SLAClockID, { IsResponseBreached: 1 });
        await slaClockRepository.createBreach({
          SLAClockID: clock.SLAClockID,
          BreachType: 'RESPONSE',
          SeverityLevel: clock.PriorityCode === 'CRITICAL' ? 'CRITICAL' : 'HIGH'
        });
        await slaClockRepository.createHistory({
          SLAClockID: clock.SLAClockID,
          EventName: 'RESPONSE_BREACHED',
          Remarks: 'Target response deadline exceeded'
        });

        try {
          await notificationService.notifyEvent('SLA_BREACH', {
            requestId: clock.IssueRequestID,
            breachType: 'Response Target Deadline',
            priority: clock.PriorityCode || 'HIGH',
            TriggeredByTable: 'SLAClock',
            TriggeredByID: clock.SLAClockID
          }, 1);
        } catch (notifErr) {
          console.warn('SLA breach notification notice:', notifErr.message);
        }
      }

      // Check Resolution Breach
      if (!clock.IsResolutionBreached && !clock.ResolutionAchievedDateTime && now > resolutionDeadlineMs) {
        await slaClockRepository.updateClock(clock.SLAClockID, { IsResolutionBreached: 1 });
        await slaClockRepository.createBreach({
          SLAClockID: clock.SLAClockID,
          BreachType: 'RESOLUTION',
          SeverityLevel: clock.PriorityCode === 'CRITICAL' ? 'CRITICAL' : 'HIGH'
        });
        await slaClockRepository.createHistory({
          SLAClockID: clock.SLAClockID,
          EventName: 'RESOLUTION_BREACHED',
          Remarks: 'Target resolution deadline exceeded'
        });

        try {
          await notificationService.notifyEvent('SLA_BREACH', {
            requestId: clock.IssueRequestID,
            breachType: 'Resolution Target Deadline',
            priority: clock.PriorityCode || 'HIGH',
            TriggeredByTable: 'SLAClock',
            TriggeredByID: clock.SLAClockID
          }, 1);
        } catch (notifErr) {
          console.warn('SLA breach notification notice:', notifErr.message);
        }
      }
    }
  },

  async findAllBreaches(params) {
    return slaClockRepository.findAllBreaches(params);
  },

  async acknowledgeBreach(breachId, userId = 1) {
    await slaClockRepository.acknowledgeBreach(breachId, userId);
    return { breachId, acknowledged: true };
  },

  async stopClockForIssue(requestId, actionUserId = 1) {
    try {
      const clock = await slaClockRepository.findClockByRequestId(requestId);
      if (!clock) return null;

      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      await slaClockRepository.updateClock(clock.SLAClockID, {
        ClockStatus: 'STOPPED',
        ResolutionAchievedDateTime: now,
        ModifiedBy: actionUserId
      });

      await slaClockRepository.createHistory({
        SLAClockID: clock.SLAClockID,
        EventName: 'CLOCK_STOPPED',
        PerformedByUserID: actionUserId,
        Remarks: 'SLA timer completed upon issue resolution',
        CreatedBy: actionUserId
      });

      return slaClockRepository.findClockById(clock.SLAClockID);
    } catch (err) {
      console.warn('stopClockForIssue notice:', err.message);
      return null;
    }
  }
};

export default slaClockService;
