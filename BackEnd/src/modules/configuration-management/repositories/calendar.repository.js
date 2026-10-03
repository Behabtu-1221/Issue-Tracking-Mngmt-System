import db from '../../../database/connection.js';
import AppError from '../../../shared/errors/AppError.js';
import { getPagination } from '../../../shared/utils/pagination.js';

class CalendarRepository {
  async findAll({ page = 1, limit = 50, activeOnly = false }) {
    const conditions = ['bc.IsDeleted = 0'];
    const params = [];
    if (activeOnly) conditions.push('bc.IsActive = 1');

    const whereSql = conditions.join(' AND ');
    const offset = (page - 1) * limit;

    const countRows = await db.query(`SELECT COUNT(*) AS total FROM BusinessCalendar bc WHERE ${whereSql}`, params);
    const rows = await db.query(
      `SELECT bc.BusinessCalendarID, bc.CalendarName, bc.TimeZoneID, tz.TimeZoneCode, tz.DisplayName,
              bc.IsActive, bc.CreatedBy, bc.CreatedDate, bc.ModifiedBy, bc.ModifiedDate
       FROM BusinessCalendar bc
       INNER JOIN TimeZone tz ON tz.TimeZoneID = bc.TimeZoneID
       WHERE ${whereSql}
       ORDER BY bc.CalendarName ASC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return { items: rows, meta: { page, limit, total: countRows[0].total } };
  }

  async findById(id, includeDetails = false) {
    const rows = await db.query(
      `SELECT bc.BusinessCalendarID, bc.CalendarName, bc.TimeZoneID, tz.TimeZoneCode, tz.DisplayName,
              bc.IsActive, bc.CreatedBy, bc.CreatedDate, bc.ModifiedBy, bc.ModifiedDate
       FROM BusinessCalendar bc
       INNER JOIN TimeZone tz ON tz.TimeZoneID = bc.TimeZoneID
       WHERE bc.BusinessCalendarID = ? AND bc.IsDeleted = 0`,
      [id]
    );
    const calendar = rows[0] || null;
    if (calendar && includeDetails) {
      calendar.workingHours = await this.findWorkingHours(id);
      calendar.holidays = await this.findHolidays(id);
    }
    return calendar;
  }

  async nameExists(name, excludeId = null) {
    const params = [name];
    let sql = 'SELECT BusinessCalendarID FROM BusinessCalendar WHERE CalendarName = ? AND IsDeleted = 0';
    if (excludeId) {
      sql += ' AND BusinessCalendarID <> ?';
      params.push(excludeId);
    }
    const rows = await db.query(sql, params);
    return rows.length > 0;
  }

  async timezoneExists(timeZoneId) {
    const rows = await db.query(
      'SELECT TimeZoneID FROM TimeZone WHERE TimeZoneID = ? AND IsDeleted = 0',
      [timeZoneId]
    );
    return rows.length > 0;
  }

  async create(payload, userId) {
    const result = await db.query(
      `INSERT INTO BusinessCalendar (CalendarName, TimeZoneID, IsActive, CreatedBy)
       VALUES (?, ?, ?, ?)`,
      [payload.calendarName, payload.timeZoneId, payload.isActive === false ? 0 : 1, userId]
    );
    return this.findById(result.insertId);
  }

  async update(id, payload, userId) {
    const sets = ['ModifiedBy = ?', 'ModifiedDate = CURRENT_TIMESTAMP(6)'];
    const values = [userId];

    if (payload.calendarName !== undefined) { sets.push('CalendarName = ?'); values.push(payload.calendarName); }
    if (payload.timeZoneId !== undefined) { sets.push('TimeZoneID = ?'); values.push(payload.timeZoneId); }
    if (payload.isActive !== undefined) { sets.push('IsActive = ?'); values.push(payload.isActive ? 1 : 0); }

    values.push(id);
    const result = await db.query(
      `UPDATE BusinessCalendar SET ${sets.join(', ')} WHERE BusinessCalendarID = ? AND IsDeleted = 0`,
      values
    );
    if (result.affectedRows === 0) throw new AppError('Business calendar not found', 404);
    return this.findById(id);
  }

  async softDelete(id, userId) {
    const tx = await db.getTransaction();
    try {
      await tx.query(
        `UPDATE WorkingHour SET IsDeleted = 1, DeletedBy = ?, DeletedDate = CURRENT_TIMESTAMP(6),
         ModifiedBy = ?, ModifiedDate = CURRENT_TIMESTAMP(6)
         WHERE BusinessCalendarID = ? AND IsDeleted = 0`,
        [userId, userId, id]
      );
      await tx.query(
        `UPDATE HolidayCalendar SET IsDeleted = 1, DeletedBy = ?, DeletedDate = CURRENT_TIMESTAMP(6),
         ModifiedBy = ?, ModifiedDate = CURRENT_TIMESTAMP(6)
         WHERE BusinessCalendarID = ? AND IsDeleted = 0`,
        [userId, userId, id]
      );
      const result = await tx.query(
        `UPDATE BusinessCalendar SET IsDeleted = 1, DeletedBy = ?, DeletedDate = CURRENT_TIMESTAMP(6),
         ModifiedBy = ?, ModifiedDate = CURRENT_TIMESTAMP(6)
         WHERE BusinessCalendarID = ? AND IsDeleted = 0`,
        [userId, userId, id]
      );
      if (result.affectedRows === 0) throw new AppError('Business calendar not found', 404);
      await tx.commit();
      return true;
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  async findWorkingHours(calendarId) {
    return db.query(
      `SELECT WorkingHourID, BusinessCalendarID, DayOfWeek, StartShift, EndShift, IsActive
       FROM WorkingHour WHERE BusinessCalendarID = ? AND IsDeleted = 0 ORDER BY DayOfWeek ASC`,
      [calendarId]
    );
  }

  async findWorkingHourById(workingHourId) {
    const rows = await db.query(
      `SELECT WorkingHourID, BusinessCalendarID, DayOfWeek, StartShift, EndShift, IsActive
       FROM WorkingHour WHERE WorkingHourID = ? AND IsDeleted = 0`,
      [workingHourId]
    );
    return rows[0] || null;
  }

  async workingDayExists(calendarId, dayOfWeek, excludeId = null) {
    const params = [calendarId, dayOfWeek];
    let sql = `SELECT WorkingHourID FROM WorkingHour
               WHERE BusinessCalendarID = ? AND DayOfWeek = ? AND IsDeleted = 0`;
    if (excludeId) {
      sql += ' AND WorkingHourID <> ?';
      params.push(excludeId);
    }
    const rows = await db.query(sql, params);
    return rows.length > 0;
  }

  async createWorkingHour(calendarId, payload, userId) {
    const result = await db.query(
      `INSERT INTO WorkingHour (BusinessCalendarID, DayOfWeek, StartShift, EndShift, IsActive, CreatedBy)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [calendarId, payload.dayOfWeek, payload.startShift, payload.endShift, payload.isActive === false ? 0 : 1, userId]
    );
    return this.findWorkingHourById(result.insertId);
  }

  async updateWorkingHour(workingHourId, payload, userId) {
    const sets = ['ModifiedBy = ?', 'ModifiedDate = CURRENT_TIMESTAMP(6)'];
    const values = [userId];

    if (payload.dayOfWeek !== undefined) { sets.push('DayOfWeek = ?'); values.push(payload.dayOfWeek); }
    if (payload.startShift !== undefined) { sets.push('StartShift = ?'); values.push(payload.startShift); }
    if (payload.endShift !== undefined) { sets.push('EndShift = ?'); values.push(payload.endShift); }
    if (payload.isActive !== undefined) { sets.push('IsActive = ?'); values.push(payload.isActive ? 1 : 0); }

    values.push(workingHourId);
    const result = await db.query(
      `UPDATE WorkingHour SET ${sets.join(', ')} WHERE WorkingHourID = ? AND IsDeleted = 0`,
      values
    );
    if (result.affectedRows === 0) throw new AppError('Working hour not found', 404);
    return this.findWorkingHourById(workingHourId);
  }

  async softDeleteWorkingHour(workingHourId, userId) {
    const result = await db.query(
      `UPDATE WorkingHour SET IsDeleted = 1, DeletedBy = ?, DeletedDate = CURRENT_TIMESTAMP(6),
       ModifiedBy = ?, ModifiedDate = CURRENT_TIMESTAMP(6)
       WHERE WorkingHourID = ? AND IsDeleted = 0`,
      [userId, userId, workingHourId]
    );
    if (result.affectedRows === 0) throw new AppError('Working hour not found', 404);
    return true;
  }

  async findHolidays(calendarId) {
    return db.query(
      `SELECT HolidayCalendarID, BusinessCalendarID, HolidayDate, HolidayName, IsActive
       FROM HolidayCalendar WHERE BusinessCalendarID = ? AND IsDeleted = 0 ORDER BY HolidayDate ASC`,
      [calendarId]
    );
  }

  async findHolidayById(holidayId) {
    const rows = await db.query(
      `SELECT HolidayCalendarID, BusinessCalendarID, HolidayDate, HolidayName, IsActive
       FROM HolidayCalendar WHERE HolidayCalendarID = ? AND IsDeleted = 0`,
      [holidayId]
    );
    return rows[0] || null;
  }

  async holidayDateExists(calendarId, holidayDate, excludeId = null) {
    const params = [calendarId, holidayDate];
    let sql = `SELECT HolidayCalendarID FROM HolidayCalendar
               WHERE BusinessCalendarID = ? AND HolidayDate = ? AND IsDeleted = 0`;
    if (excludeId) {
      sql += ' AND HolidayCalendarID <> ?';
      params.push(excludeId);
    }
    const rows = await db.query(sql, params);
    return rows.length > 0;
  }

  async createHoliday(calendarId, payload, userId) {
    const result = await db.query(
      `INSERT INTO HolidayCalendar (BusinessCalendarID, HolidayDate, HolidayName, IsActive, CreatedBy)
       VALUES (?, ?, ?, ?, ?)`,
      [calendarId, payload.holidayDate, payload.holidayName, payload.isActive === false ? 0 : 1, userId]
    );
    return this.findHolidayById(result.insertId);
  }

  async updateHoliday(holidayId, payload, userId) {
    const sets = ['ModifiedBy = ?', 'ModifiedDate = CURRENT_TIMESTAMP(6)'];
    const values = [userId];

    if (payload.holidayDate !== undefined) { sets.push('HolidayDate = ?'); values.push(payload.holidayDate); }
    if (payload.holidayName !== undefined) { sets.push('HolidayName = ?'); values.push(payload.holidayName); }
    if (payload.isActive !== undefined) { sets.push('IsActive = ?'); values.push(payload.isActive ? 1 : 0); }

    values.push(holidayId);
    const result = await db.query(
      `UPDATE HolidayCalendar SET ${sets.join(', ')} WHERE HolidayCalendarID = ? AND IsDeleted = 0`,
      values
    );
    if (result.affectedRows === 0) throw new AppError('Holiday not found', 404);
    return this.findHolidayById(holidayId);
  }

  async softDeleteHoliday(holidayId, userId) {
    const result = await db.query(
      `UPDATE HolidayCalendar SET IsDeleted = 1, DeletedBy = ?, DeletedDate = CURRENT_TIMESTAMP(6),
       ModifiedBy = ?, ModifiedDate = CURRENT_TIMESTAMP(6)
       WHERE HolidayCalendarID = ? AND IsDeleted = 0`,
      [userId, userId, holidayId]
    );
    if (result.affectedRows === 0) throw new AppError('Holiday not found', 404);
    return true;
  }
}

export default new CalendarRepository();
