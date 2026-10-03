import Joi from 'joi';

export const loginSchema = Joi.object({
  username: Joi.string().trim().min(3).max(150).required(),
  password: Joi.string().min(6).max(128).required()
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().trim().required()
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().min(6).max(128).required(),
  newPassword: Joi.string().min(8).max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]+$/)
    .required()
    .messages({
      'string.pattern.base': 'New password must include uppercase, lowercase, number, and special character'
    })
});

export const forgotPasswordSchema = Joi.object({
  username: Joi.string().trim().max(150),
  email: Joi.string().trim().email().max(150)
}).or('username', 'email');

export const resetPasswordSchema = Joi.object({
  token: Joi.string().trim().min(32).max(128).required(),
  newPassword: Joi.string().min(8).max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]+$/)
    .required()
    .messages({
      'string.pattern.base': 'New password must include uppercase, lowercase, number, and special character'
    })
});
