import { Router } from 'express';
import validate from '../../../shared/middleware/validate.js';
import calendarController from '../controllers/calendar.controller.js';
import {
  calendarCreateSchema,
  calendarIdParamSchema,
  calendarListSchema,
  calendarUpdateSchema,
  holidayCreateSchema,
  holidayIdParamSchema,
  holidayUpdateSchema,
  workingHourCreateSchema,
  workingHourIdParamSchema,
  workingHourUpdateSchema
} from '../validators/calendar.validator.js';

const router = Router();

router.get('/calendars', validate(calendarListSchema, 'query'), calendarController.list);
router.get('/calendars/:id', validate(calendarIdParamSchema, 'params'), calendarController.getById);
router.post('/calendars', validate(calendarCreateSchema), calendarController.create);
router.put('/calendars/:id', validate(calendarIdParamSchema, 'params'), validate(calendarUpdateSchema), calendarController.update);
router.delete('/calendars/:id', validate(calendarIdParamSchema, 'params'), calendarController.remove);

router.get('/calendars/:id/working-hours', validate(calendarIdParamSchema, 'params'), calendarController.listWorkingHours);
router.post('/calendars/:id/working-hours', validate(calendarIdParamSchema, 'params'), validate(workingHourCreateSchema), calendarController.createWorkingHour);
router.put('/calendars/:calendarId/working-hours/:workingHourId', validate(workingHourIdParamSchema, 'params'), validate(workingHourUpdateSchema), calendarController.updateWorkingHour);
router.delete('/calendars/:calendarId/working-hours/:workingHourId', validate(workingHourIdParamSchema, 'params'), calendarController.removeWorkingHour);

router.get('/calendars/:id/holidays', validate(calendarIdParamSchema, 'params'), calendarController.listHolidays);
router.post('/calendars/:id/holidays', validate(calendarIdParamSchema, 'params'), validate(holidayCreateSchema), calendarController.createHoliday);
router.put('/calendars/:calendarId/holidays/:holidayId', validate(holidayIdParamSchema, 'params'), validate(holidayUpdateSchema), calendarController.updateHoliday);
router.delete('/calendars/:calendarId/holidays/:holidayId', validate(holidayIdParamSchema, 'params'), calendarController.removeHoliday);

export default router;
