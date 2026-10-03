import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from '../../../database/connection.js';
import AppError from '../../../shared/errors/AppError.js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyRefreshToken
} from '../../../shared/utils/token.js';
import {
  ACCOUNT_STATUS,
  LOCKOUT_MINUTES,
  LOGIN_STATUS,
  MAX_FAILED_LOGIN_ATTEMPTS,
  TOKEN_TYPES
} from '../constants/identity.constants.js';
import userAccountRepository from '../repositories/userAccount.repository.js';
import userRepository from '../repositories/user.repository.js';
import userSessionRepository from '../repositories/userSession.repository.js';
import loginHistoryRepository from '../repositories/loginHistory.repository.js';
import passwordResetTokenRepository from '../repositories/passwordResetToken.repository.js';

const buildTokenPayload = (account, sessionId) => ({
  userId: account.UserID,
  userAccountId: account.UserAccountID,
  tenantId: account.TenantID,
  userTypeCode: account.UserTypeCode,
  username: account.Username,
  sessionId
});

const getRequestMeta = (req = {}) => ({
  ipAddress: req?.ip || req?.headers?.['x-forwarded-for'] || null,
  userAgent: req?.headers?.['user-agent'] || null
});

const isLockoutActive = (account) => {
  if (!account.LockoutEndDateTime) {
    return false;
  }

  return new Date(account.LockoutEndDateTime) > new Date();
};

const getRefreshExpiryDate = () => {
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  const match = expiresIn.match(/^(\d+)([dhms])$/);
  const now = new Date();

  if (!match) {
    now.setDate(now.getDate() + 7);
    return now;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 'd':
      now.setDate(now.getDate() + value);
      break;
    case 'h':
      now.setHours(now.getHours() + value);
      break;
    case 'm':
      now.setMinutes(now.getMinutes() + value);
      break;
    case 's':
      now.setSeconds(now.getSeconds() + value);
      break;
    default:
      now.setDate(now.getDate() + 7);
  }

  return now;
};

const generateSecureTemporaryPassword = () => {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%*&';
  const all = upper + lower + digits + symbols;

  // Guarantee at least 2 chars from each complexity bucket
  const parts = [
    upper[crypto.randomInt(0, upper.length)],
    upper[crypto.randomInt(0, upper.length)],
    lower[crypto.randomInt(0, lower.length)],
    lower[crypto.randomInt(0, lower.length)],
    digits[crypto.randomInt(0, digits.length)],
    digits[crypto.randomInt(0, digits.length)],
    symbols[crypto.randomInt(0, symbols.length)],
    symbols[crypto.randomInt(0, symbols.length)]
  ];

  // Fill up to 12 characters
  while (parts.length < 12) {
    parts.push(all[crypto.randomInt(0, all.length)]);
  }

  // Cryptographically shuffle array (Fisher-Yates)
  for (let i = parts.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [parts[i], parts[j]] = [parts[j], parts[i]];
  }

  return parts.join('');
};

class AuthService {
  async login(credentials, req) {
    const { username, password } = credentials;
    const requestMeta = getRequestMeta(req);
    const account = await userAccountRepository.findByUsername(username);

    if (!account) {
      throw new AppError('Invalid username or password', 401);
    }

    if (!account.IsActive) {
      throw new AppError('Account is inactive', 403);
    }

    if (account.AccountStatusCode === ACCOUNT_STATUS.SUSPENDED) {
      throw new AppError('Account is suspended', 403);
    }

    // Auto-clear expired lockouts so users can retry after the lockout window
    if (account.AccountStatusCode === 'LOCKED' && account.LockoutEndDateTime) {
      const lockoutEnd = new Date(account.LockoutEndDateTime);
      if (lockoutEnd <= new Date()) {
        // Lockout has expired — clear it and let the user proceed
        await userAccountRepository.clearExpiredLockout(account.UserAccountID, account.UserID);
        account.AccountStatusCode = 'ACTIVE';
        account.FailedLoginAttempts = 0;
        account.LockoutEndDateTime = null;
      }
    }

    if (isLockoutActive(account)) {
      const remainingMinutes = Math.ceil((new Date(account.LockoutEndDateTime) - new Date()) / 60000);
      throw new AppError(
        `Account is temporarily locked due to failed login attempts. Please try again in ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}.`,
        423
      );
    }

    let passwordMatches = account.PasswordHash
      ? await bcrypt.compare(password, account.PasswordHash)
      : false;



    if (!passwordMatches) {
      await userAccountRepository.recordFailedLoginWithLockout(
        account.UserAccountID,
        account.UserID,
        MAX_FAILED_LOGIN_ATTEMPTS,
        LOCKOUT_MINUTES
      );

      await loginHistoryRepository.create({
        userAccountId: account.UserAccountID,
        ipAddress: requestMeta.ipAddress,
        userAgent: requestMeta.userAgent,
        loginStatus: LOGIN_STATUS.FAILED,
        failureReason: 'Invalid password',
        actorUserId: account.UserID
      });

      throw new AppError('Invalid username or password', 401);
    }

    const refreshExpiryDate = getRefreshExpiryDate();
    const session = await userSessionRepository.create({
      userAccountId: account.UserAccountID,
      sessionToken: 'pending',
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
      expiryDateTime: refreshExpiryDate,
      actorUserId: account.UserID
    });

    const refreshToken = generateRefreshToken({
      userAccountId: account.UserAccountID,
      sessionId: session.userSessionId,
      type: TOKEN_TYPES.REFRESH
    });

    await userSessionRepository.updateSessionToken(
      session.userSessionId,
      hashToken(refreshToken),
      account.UserID
    );

    const accessToken = generateAccessToken({
      ...buildTokenPayload(account, session.userSessionId),
      type: TOKEN_TYPES.ACCESS
    });

    await userAccountRepository.recordSuccessfulLogin(account.UserAccountID, account.UserID);

    await loginHistoryRepository.create({
      userAccountId: account.UserAccountID,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
      loginStatus: LOGIN_STATUS.SUCCESS,
      failureReason: null,
      actorUserId: account.UserID
    });

    const roles = await userAccountRepository.findRolesByUserId(account.UserID);
    const permissions = await userAccountRepository.findPermissionsByUserId(account.UserID);
    const mustChangePassword = account.AccountStatusCode === 'MUST_CHANGE_PASSWORD';
    const primaryRoleCode = (roles && roles.length > 0) ? roles[0].RoleCode : account.UserTypeCode;

    return {
      accessToken,
      refreshToken,
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      user: {
        userId: account.UserID,
        userAccountId: account.UserAccountID,
        tenantId: account.TenantID,
        username: account.Username,
        userTypeCode: primaryRoleCode || account.UserTypeCode,
        firstName: account.FirstName,
        lastName: account.LastName,
        email: account.Email,
        avatarUrl: account.AvatarUrl,
        accountStatusCode: account.AccountStatusCode,
        mustChangePassword,
        roles: roles.map((role) => role.RoleCode),
        permissions: permissions.map((permission) => permission.PermissionCode)
      }
    };
  }

  async refresh(refreshToken) {
    let decoded;

    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    if (decoded.type !== TOKEN_TYPES.REFRESH) {
      throw new AppError('Invalid refresh token', 401);
    }

    const session = await userSessionRepository.findActiveByToken(hashToken(refreshToken));
    if (!session) {
      throw new AppError('Session expired or invalidated', 401);
    }

    const account = await userAccountRepository.findAuthContextByUserId(session.UserID);
    if (!account || !account.IsActive || account.AccountStatusCode === ACCOUNT_STATUS.SUSPENDED) {
      throw new AppError('User account is inactive or suspended', 403);
    }

    const newAccessToken = generateAccessToken({
      userId: session.UserID,
      userAccountId: session.UserAccountID,
      tenantId: session.TenantID,
      userTypeCode: session.UserTypeCode,
      username: session.Username,
      sessionId: session.UserSessionID,
      type: TOKEN_TYPES.ACCESS
    });

    const newRefreshToken = generateRefreshToken({
      userAccountId: session.UserAccountID,
      sessionId: session.UserSessionID,
      type: TOKEN_TYPES.REFRESH
    });

    await userSessionRepository.updateSessionToken(
      session.UserSessionID,
      hashToken(newRefreshToken),
      session.UserID
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: process.env.JWT_EXPIRES_IN || '1h'
    };
  }

  async logout(actor) {
    if (actor?.sessionId) {
      await userSessionRepository.revoke(actor.sessionId, actor.userId);
    }

    return {
      message: 'Logged out successfully'
    };
  }

  async getCurrentUser(userId) {
    const profile = await userAccountRepository.findProfileByUserId(userId);

    if (!profile) {
      throw new AppError('User not found', 404);
    }

    const roles = await userAccountRepository.findRolesByUserId(userId);
    const permissions = await userAccountRepository.findPermissionsByUserId(userId);
    let permCodes = permissions.map((permission) => permission.PermissionCode);
    const primaryRoleCode = (roles && roles.length > 0) ? roles[0].RoleCode : profile.UserTypeCode;
    const userType = (primaryRoleCode || profile.UserTypeCode || '').toUpperCase();
    if (userType === 'SUPER_ADMIN' || userType === 'PARK_ADMIN') {
      if (!permCodes.includes('*')) permCodes.unshift('*');
    }

    const roleCodes = roles.map(r => r.RoleCode);

    return {
      userId: profile.UserID,
      UserID: profile.UserID,
      userAccountId: profile.UserAccountID,
      UserAccountID: profile.UserAccountID,
      tenantId: profile.TenantID,
      TenantID: profile.TenantID,
      tenantCode: profile.TenantCode,
      TenantCode: profile.TenantCode,
      tenantName: profile.TenantName,
      TenantName: profile.TenantName,
      CompanyName: profile.TenantName,
      businessParkName: profile.BusinessParkName || 'Ethiopian IT Park',
      BusinessParkName: profile.BusinessParkName || 'Ethiopian IT Park',
      businessParkId: profile.BusinessParkID || 1,
      BusinessParkID: profile.BusinessParkID || 1,
      username: profile.Username,
      Username: profile.Username,
      userTypeCode: primaryRoleCode || profile.UserTypeCode,
      UserTypeCode: primaryRoleCode || profile.UserTypeCode,
      firstName: profile.FirstName,
      FirstName: profile.FirstName,
      lastName: profile.LastName,
      LastName: profile.LastName,
      email: profile.Email,
      Email: profile.Email,
      phoneNumber: profile.PhoneNumber,
      PhoneNumber: profile.PhoneNumber,
      mobileNumber: profile.MobileNumber,
      MobileNumber: profile.MobileNumber,
      jobTitle: profile.JobTitle,
      JobTitle: profile.JobTitle,
      departmentId: profile.DepartmentID,
      DepartmentID: profile.DepartmentID,
      departmentName: profile.DepartmentName,
      DepartmentName: profile.DepartmentName,
      preferredLanguage: profile.PreferredLanguage,
      avatarUrl: profile.AvatarUrl,
      AvatarUrl: profile.AvatarUrl,
      accountStatusCode: profile.AccountStatusCode,
      mustChangePassword: profile.AccountStatusCode === 'MUST_CHANGE_PASSWORD',
      isMfaEnabled: !!profile.IsMfaEnabled,
      lastLoginDateTime: profile.LastLoginDateTime,
      roles: roleCodes,
      roleObjects: roles,
      permissions: permCodes
    };
  }

  async changePassword(userAccountId, actorUserId, currentPassword, newPassword) {
    const currentHash = await userAccountRepository.findPasswordHash(userAccountId);

    if (!currentHash) {
      throw new AppError('Account not found', 404);
    }

    const matches = await bcrypt.compare(currentPassword, currentHash);

    if (!matches) {
      throw new AppError('Current password is incorrect', 400);
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await userAccountRepository.updatePassword(userAccountId, newHash, actorUserId);
    
    // Update AccountStatusCode to ACTIVE if it was MUST_CHANGE_PASSWORD
    await db.query(
      `UPDATE UserAccount SET AccountStatusCode = 'ACTIVE', ModifiedBy = ?, ModifiedDate = CURRENT_TIMESTAMP(6) WHERE UserAccountID = ? AND AccountStatusCode = 'MUST_CHANGE_PASSWORD'`,
      [actorUserId, userAccountId]
    );

    await userSessionRepository.revokeAllForAccount(userAccountId, actorUserId);

    return { message: 'Password changed successfully. Your account is active. Please sign in with your new password.' };
  }

  async listSessions(userAccountId) {
    return userSessionRepository.listActiveByUserAccountId(userAccountId);
  }

  async revokeSession(sessionId, actorUserId) {
    await userSessionRepository.revoke(sessionId, actorUserId);
    return { message: 'Session revoked successfully' };
  }

  async forgotPassword(usernameOrEmail) {
    const identifier = (usernameOrEmail || '').trim();
    const account = identifier ? await userAccountRepository.findByUsername(identifier) : null;

    // Timing attack defense: perform dummy bcrypt work if account not found
    if (!account || !account.Email || !account.IsActive) {
      await bcrypt.hash('dummy_timing_mitigation_secret_value', 10);
      return {
        message: 'If an account matching the provided credentials exists, password recovery instructions have been sent to the registered email address.'
      };
    }

    // 1. Generate cryptographically secure random token (32 bytes = 64 hex characters)
    const rawResetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = hashToken(rawResetToken);

    // 2. Invalidate old tokens and store hashed token in database with 15-minute expiry
    await passwordResetTokenRepository.create({
      userAccountId: account.UserAccountID,
      hashedToken: hashedResetToken,
      expiryMinutes: 15,
      actorUserId: account.UserID || account.UserAccountID
    });

    // 3. Dispatch reset link with raw token ONLY by email
    try {
      const emailServiceModule = await import('../../notification/services/email.service.js');
      const emailService = emailServiceModule.default || emailServiceModule.emailService;

      const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const resetUrl = `${clientBaseUrl}/reset-password?token=${rawResetToken}`;
      const fullName = account.FirstName
        ? `${account.FirstName} ${account.LastName || ''}`.trim()
        : account.Username;

      const emailSubject = '🔐 Enterprise ITMS — Password Reset Request';
      const emailBody = emailService.wrapInHtmlEmail(
        'Password Reset Request',
        `
        <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;line-height:1.6">
          <p style="font-size:15px;margin-top:0">Dear <strong>${fullName}</strong>,</p>
          <p style="font-size:14px;color:#334155">
            We received a request to reset the password for your Enterprise ITMS account (<strong>${account.Username}</strong>).
          </p>
          <p style="font-size:14px;color:#334155">
            Click the button below to choose a new password. This secure link is valid for <strong>15 minutes</strong> and can only be used once.
          </p>
          <div style="text-align:center;margin:28px 0">
            <a href="${resetUrl}" style="background:linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0284c7 100%);color:#ffffff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;box-shadow:0 6px 20px rgba(2,132,199,0.35)">
              Reset Password ➔
            </a>
          </div>
          <p style="font-size:12px;color:#64748b">
            If the button doesn't work, copy and paste this link into your browser:<br/>
            <span style="word-break:break-all;color:#0284c7">${resetUrl}</span>
          </p>
          <div style="background:#fef2f2;border:1px solid #fee2e2;border-radius:8px;padding:12px 16px;margin-top:24px;font-size:12px;color:#991b1b">
            <strong>Security Notice:</strong> If you did not request this password reset, please ignore this email or contact your administrator. Your password will remain unchanged.
          </div>
        </div>
        `
      );

      const plainText = `
Enterprise ITMS — Password Reset Request

Dear ${fullName},

We received a request to reset your password.
Use the link below to set a new password within 15 minutes:
${resetUrl}

If you did not request this, please ignore this email.
      `.trim();

      await emailService.sendEmail({
        to: account.Email,
        subject: emailSubject,
        html: emailBody,
        text: plainText
      });
    } catch (err) {
      console.error('Email dispatch error in forgotPassword:', err.message);
    }

    return {
      message: 'If an account matching the provided credentials exists, password recovery instructions have been sent to the registered email address.'
    };
  }

  async resetPassword(rawToken, newPassword) {
    if (!rawToken || typeof rawToken !== 'string') {
      throw new AppError('Invalid or expired reset token', 400);
    }

    // 1. Hash incoming token with SHA-256 to look up in DB
    const hashedToken = hashToken(rawToken);
    const tokenRecord = await passwordResetTokenRepository.findByHashedToken(hashedToken);

    if (!tokenRecord) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    // 2. Check if already used or deleted
    if (tokenRecord.IsUsed || tokenRecord.IsDeleted) {
      throw new AppError('This password reset link has already been used or invalidated. Please request a new one.', 400);
    }

    // 3. Check expiration
    if (new Date(tokenRecord.ExpiryDateTime) <= new Date()) {
      await passwordResetTokenRepository.markUsed(tokenRecord.PasswordResetTokenID, tokenRecord.UserID || tokenRecord.UserAccountID);
      throw new AppError('This password reset link has expired. Please request a new one.', 400);
    }

    // 4. Validate user account status
    if (!tokenRecord.AccountIsActive || tokenRecord.AccountStatusCode === ACCOUNT_STATUS.SUSPENDED) {
      throw new AppError('User account is inactive or suspended', 403);
    }

    // 5. Enforce password complexity policy
    const passwordPolicyRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,128}$/;
    if (!passwordPolicyRegex.test(newPassword)) {
      throw new AppError('Password must be 8-128 characters long and include uppercase, lowercase, number, and special character (@$!%*?&#)', 400);
    }

    // 6. Hash new password with bcrypt (10 rounds)
    const newHash = await bcrypt.hash(newPassword, 10);
    const actorId = tokenRecord.UserID || tokenRecord.UserAccountID;

    // 7. Update password and activate account
    await userAccountRepository.updatePassword(tokenRecord.UserAccountID, newHash, actorId);
    await db.query(
      `UPDATE UserAccount
       SET AccountStatusCode = 'ACTIVE',
           FailedLoginAttempts = 0,
           LockoutEndDateTime = NULL,
           ModifiedBy = ?,
           ModifiedDate = CURRENT_TIMESTAMP(6)
       WHERE UserAccountID = ?`,
      [actorId, tokenRecord.UserAccountID]
    );

    // 8. Mark token used (single-use) and invalidate all other pending reset tokens
    await passwordResetTokenRepository.markUsed(tokenRecord.PasswordResetTokenID, actorId);
    await passwordResetTokenRepository.invalidateAllForAccount(tokenRecord.UserAccountID, actorId);

    // 9. Invalidate all existing active sessions / refresh tokens
    await userSessionRepository.revokeAllForAccount(tokenRecord.UserAccountID, actorId);

    return {
      message: 'Password has been reset successfully. You may now sign in with your new password.'
    };
  }

  async updateProfile(userId, profileData) {
    await userRepository.updateUser(
      userId,
      {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phoneNumber: profileData.phoneNumber,
        mobileNumber: profileData.mobileNumber,
        jobTitle: profileData.jobTitle,
        preferredLanguage: profileData.preferredLanguage,
        avatarUrl: profileData.avatarUrl
      },
      userId
    );

    return this.getCurrentUser(userId);
  }

  async updateNotificationPreferences(userId, preferencesData) {
    try {
      // Map UI toggle keys to notification types
      const keyTypeMap = {
        emailTicketUpdates: { typeCode: 'REQUEST_STATUS_CHANGED', channelCode: 'EMAIL' },
        emailSlaWarnings: { typeCode: 'SLA_BREACH', channelCode: 'EMAIL' },
        emailMaintenance: { typeCode: 'SYSTEM_ANNOUNCEMENT', channelCode: 'EMAIL' }
      };

      const [types] = await Promise.all([
        query(`SELECT NotificationTypeID, TypeCode FROM NotificationType WHERE IsDeleted = 0`)
      ]);
      const [channels] = await Promise.all([
        query(`SELECT NotificationChannelID, ChannelCode FROM NotificationChannel WHERE IsDeleted = 0`)
      ]);

      const typeMap = {};
      types.forEach(t => { typeMap[t.TypeCode] = t.NotificationTypeID; });
      const channelMap = {};
      channels.forEach(c => { channelMap[c.ChannelCode] = c.NotificationChannelID; });

      for (const [key, enabled] of Object.entries(preferencesData || {})) {
        const mapping = keyTypeMap[key];
        if (mapping) {
          const typeId = typeMap[mapping.typeCode];
          const channelId = channelMap[mapping.channelCode];
          if (typeId && channelId) {
            await query(
              `INSERT INTO NotificationPreference (UserID, NotificationTypeID, NotificationChannelID, IsEnabled, CreatedBy, CreatedDate)
               VALUES (?, ?, ?, ?, ?, NOW())
               ON DUPLICATE KEY UPDATE IsEnabled = VALUES(IsEnabled), ModifiedDate = NOW()`,
              [Number(userId), typeId, channelId, enabled ? 1 : 0, Number(userId)]
            );
          }
        }
      }
    } catch (err) {
      console.warn('Error saving notification preferences:', err.message);
    }

    return {
      message: 'Notification channels & preference settings updated successfully',
      preferences: preferencesData
    };
  }
}

export default new AuthService();
