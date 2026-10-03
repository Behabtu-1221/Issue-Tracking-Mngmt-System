import AppError from '../../../shared/errors/AppError.js';
import { DAY_OF_WEEK } from '../constants/configuration.constants.js';
import calendarRepository from '../repositories/calendar.repository.js';

class CalendarService {
  async list(query) {
    return calendarRepository.findAll({
      page: query.page,
      limit: query.limit,
      activeOnly: query.activeOnly
    });
  }

  async getById(id, includeDetails = false) {
    const record = await calendarRepository.findById(id, includeDetails);
    if (!record) throw new AppError('Business calendar not found', 404);
    return record;
  }

  async create(payload, userId) {
    if (await calendarRepository.nameExists(payload.calendarName)) {
      throw new AppError('Calendar name already exists', 409);
    }
    if (!(await calendarRepository.timezoneExists(payload.timeZoneId))) {
      throw new AppError('Time zone not found', 404);
    }
    return calendarRepository.create(payload, userId);
  }

  async update(id, payload, userId) {
    const existing = await calendarRepository.findById(id);
    if (!existing) throw new AppError('Business calendar not found', 404);

    if (payload.calendarName && payload.calendarName !== existing.CalendarName) {
      if (await calendarRepository.nameExists(payload.calendarName, id)) {
        throw new AppError('Calendar name already exists', 409);
      }
    }

    if (payload.timeZoneId !== undefined) {
      if (!(await calendarRepository.timezoneExists(payload.timeZoneId))) {
        throw new AppError('Time zone not found', 404);
      }
    }

    return calendarRepository.update(id, payload, userId);
  }

  async remove(id, userId) {
    await calendarRepository.softDelete(id, userId);
    return { message: 'Business calendar deleted successfully' };
  }

  validateDayOfWeek(dayOfWeek) {
    if (dayOfWeek < DAY_OF_WEEK.MIN || dayOfWeek > DAY_OF_WEEK.MAX) {
      throw new AppError('Day of week must be between 1 (Monday) and 7 (Sunday)', 400);
    }
  }

  validateShiftTimes(startShift, endShift) {
    if (startShift >= endShift) {
      throw new AppError('Start shift must be before end shift', 400);
    }
  }

  async listWorkingHours(calendarId) {
    await this.getById(calendarId);
    return calendarRepository.findWorkingHours(calendarId);
  }

  async createWorkingHour(calendarId, payload, userId) {
    await this.getById(calendarId);
    this.validateDayOfWeek(payload.dayOfWeek);
    this.validateShiftTimes(payload.startShift, payload.endShift);

    if (await calendarRepository.workingDayExists(calendarId, payload.dayOfWeek)) {
      throw new AppError('Working hour already exists for this day', 409);
    }

    return calendarRepository.createWorkingHour(calendarId, payload, userId);
  }

  async updateWorkingHour(workingHourId, payload, userId) {
    const existing = await calendarRepository.findWorkingHourById(workingHourId);
    if (!existing) throw new AppError('Working hour not found', 404);

    const dayOfWeek = payload.dayOfWeek ?? existing.DayOfWeek;
    const startShift = payload.startShift ?? existing.StartShift;
    const endShift = payload.endShift ?? existing.EndShift;

    if (payload.dayOfWeek !== undefined) this.validateDayOfWeek(dayOfWeek);
    this.validateShiftTimes(startShift, endShift);

    if (payload.dayOfWeek && payload.dayOfWeek !== existing.DayOfWeek) {
      if (await calendarRepository.workingDayExists(existing.BusinessCalendarID, dayOfWeek, workingHourId)) {
        throw new AppError('Working hour already exists for this day', 409);
      }
    }

    return calendarRepository.updateWorkingHour(workingHourId, payload, userId);
  }

  async removeWorkingHour(workingHourId, userId) {
    await calendarRepository.softDeleteWorkingHour(workingHourId, userId);
    return { message: 'Working hour deleted successfully' };
  }

  async listHolidays(calendarId) {
    await this.getById(calendarId);
    return calendarRepository.findHolidays(calendarId);
  }

  async createHoliday(calendarId, payload, userId) {
    await this.getById(calendarId);

    if (await calendarRepository.holidayDateExists(calendarId, payload.holidayDate)) {
      throw new AppError('Holiday already exists for this date', 409);
    }

    return calendarRepository.createHoliday(calendarId, payload, userId);
  }

  async updateHoliday(holidayId, payload, userId) {
    const existing = await calendarRepository.findHolidayById(holidayId);
    if (!existing) throw new AppError('Holiday not found', 404);

    if (payload.holidayDate && payload.holidayDate !== existing.HolidayDate) {
      if (await calendarRepository.holidayDateExists(existing.BusinessCalendarID, payload.holidayDate, holidayId)) {
        throw new AppError('Holiday already exists for this date', 409);
      }
    }

    return calendarRepository.updateHoliday(holidayId, payload, userId);
  }

  async removeHoliday(holidayId, userId) {
    await calendarRepository.softDeleteHoliday(holidayId, userId);
    return { message: 'Holiday deleted successfully' };
  }
}

export default new CalendarService();
