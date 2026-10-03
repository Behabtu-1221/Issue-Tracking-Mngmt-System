import Joi from 'joi';

export const calendarCreateSchema = Joi.object({
  calendarName: Joi.string().trim().max(100).required(),
  timeZoneId: Joi.number().integer().positive().required(),
  isActive: Joi.boolean().default(true)
});

export const calendarUpdateSchema = Joi.object({
  calendarName: Joi.string().trim().max(100),
  timeZoneId: Joi.number().integer().positive(),
  isActive: Joi.boolean()
}).min(1);

export const workingHourCreateSchema = Joi.object({
  dayOfWeek: Joi.number().integer().min(1).max(7).required(),
  startShift: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/).required(),
  endShift: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/).required(),
  isActive: Joi.boolean().default(true)
});

export const workingHourUpdateSchema = Joi.object({
  dayOfWeek: Joi.number().integer().min(1).max(7),
  startShift: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/),
  endShift: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/),
  isActive: Joi.boolean()
}).min(1);

export const holidayCreateSchema = Joi.object({
  holidayDate: Joi.date().iso().required(),
  holidayName: Joi.string().trim().max(150).required(),
  isActive: Joi.boolean().default(true)
});

export const holidayUpdateSchema = Joi.object({
  holidayDate: Joi.date().iso(),
  holidayName: Joi.string().trim().max(150),
  isActive: Joi.boolean()
}).min(1);

export const calendarListSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(50),
  activeOnly: Joi.boolean().truthy('true').falsy('false').default(false)
});

export const calendarIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

export const workingHourIdParamSchema = Joi.object({
  calendarId: Joi.number().integer().positive().required(),
  workingHourId: Joi.number().integer().positive().required()
});

export const holidayIdParamSchema = Joi.object({
  calendarId: Joi.number().integer().positive().required(),
  holidayId: Joi.number().integer().positive().required()
});
