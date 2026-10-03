/**
 * Business Calendar for SLA Deadline Computations.
 * Accurately handles working hours, weekends, holidays, and 24x7 emergency coverage.
 */

export class BusinessCalendar {
  constructor(config = {}) {
    this.startHour = config.startHour ?? 8; // 08:00
    this.endHour = config.endHour ?? 17;     // 17:00 (9 hours / 540 min per day)
    this.workingDays = config.workingDays || [1, 2, 3, 4, 5]; // Mon-Fri (0=Sun, 6=Sat)
    this.holidays = new Set(config.holidays || [
      '2026-01-01', // New Year's Day
      '2026-01-07', // Genna (Ethiopian Christmas)
      '2026-01-19', // Timkat (Epiphany)
      '2026-03-02', // Adwa Victory Day
      '2026-05-01', // International Workers' Day
      '2026-05-05', // Patriots' Victory Day
      '2026-09-11', // Enkutatash (Ethiopian New Year)
      '2026-09-27'  // Meskel
    ]);
  }

  formatDateKey(date) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  isWeekend(date) {
    const day = date.getUTCDay();
    return !this.workingDays.includes(day);
  }

  isHoliday(date) {
    return this.holidays.has(this.formatDateKey(date));
  }

  isBusinessDay(date) {
    return !this.isWeekend(date) && !this.isHoliday(date);
  }

  /**
   * Fast-forward date to the start of the next valid business window.
   */
  snapToNextBusinessWindow(date) {
    const current = new Date(date);

    while (true) {
      if (!this.isBusinessDay(current)) {
        // Move to next day at startHour
        current.setUTCDate(current.getUTCDate() + 1);
        current.setUTCHours(this.startHour, 0, 0, 0);
        continue;
      }

      const hour = current.getUTCHours();
      if (hour < this.startHour) {
        current.setUTCHours(this.startHour, 0, 0, 0);
        return current;
      }

      if (hour >= this.endHour) {
        current.setUTCDate(current.getUTCDate() + 1);
        current.setUTCHours(this.startHour, 0, 0, 0);
        continue;
      }

      return current;
    }
  }

  /**
   * Calculate target deadline in UTC given duration in minutes.
   * If is24x7 is true (e.g. CRITICAL priority), working hours are ignored.
   *
   * @param {Date} startDate
   * @param {number} durationMinutes
   * @param {Object} options - { is24x7: boolean }
   * @returns {Date} Target deadline in UTC
   */
  calculateDeadline(startDate, durationMinutes, options = {}) {
    if (durationMinutes <= 0) return new Date(startDate);

    if (options.is24x7) {
      return new Date(startDate.getTime() + durationMinutes * 60 * 1000);
    }

    let current = this.snapToNextBusinessWindow(startDate);
    let remainingMinutes = durationMinutes;

    while (remainingMinutes > 0) {
      const currentHour = current.getUTCHours();
      const currentMinute = current.getUTCMinutes();
      const currentSecond = current.getUTCSeconds();

      // Minutes remaining in today's business window
      const minutesLeftInDay = (this.endHour - currentHour) * 60 - currentMinute - (currentSecond > 0 ? 1 : 0);

      if (remainingMinutes <= minutesLeftInDay) {
        current = new Date(current.getTime() + remainingMinutes * 60 * 1000);
        remainingMinutes = 0;
      } else {
        remainingMinutes -= minutesLeftInDay;
        // Advance to next business day startHour
        current.setUTCDate(current.getUTCDate() + 1);
        current.setUTCHours(this.startHour, 0, 0, 0);
        current = this.snapToNextBusinessWindow(current);
      }
    }

    return current;
  }

  /**
   * Computes the warning threshold timestamp (e.g. 80% elapsed).
   */
  getWarningThreshold(startDate, deadlineDate, warningRatio = 0.8) {
    const totalMs = deadlineDate.getTime() - startDate.getTime();
    if (totalMs <= 0) return new Date(startDate);
    return new Date(startDate.getTime() + Math.round(totalMs * warningRatio));
  }
}

export const businessCalendar = new BusinessCalendar();
export default businessCalendar;
