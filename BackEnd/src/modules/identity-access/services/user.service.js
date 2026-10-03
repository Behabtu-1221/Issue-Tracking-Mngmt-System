import bcrypt from 'bcryptjs';
import db from '../../../database/connection.js';
import AppError from '../../../shared/errors/AppError.js';
import userRepository from '../repositories/user.repository.js';
import userSessionRepository from '../repositories/userSession.repository.js';
import roleRepository from '../repositories/role.repository.js';

const isParkAdminActor = (actor) => {
  if (!actor) return false;
  const code = (actor.userTypeCode || '').toUpperCase();
  const roles = (actor.roles || []).map(r => (typeof r === 'string' ? r : r.RoleCode || r.RoleName || '').toUpperCase());
  return (
    ['SUPER_ADMIN', 'ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'BUSINESS_PARK_ADMIN'].includes(code) ||
    roles.some(r => ['SUPER_ADMIN', 'ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'BUSINESS_PARK_ADMIN'].includes(r))
  );
};

class UserService {
  async getUsers(params, actor) {
    const tenantId = isParkAdminActor(actor)
      ? params.tenantId
      : actor?.tenantId;

    let departmentId = params.departmentId || null;

    // If Manager/Dispatcher actor, default to their authorized department if not explicitly set
    if (actor && actor.userId) {
      const code = (actor.userTypeCode || '').toUpperCase();
      if (['DEPARTMENT_MANAGER', 'DISPATCHER', 'MANAGER'].includes(code)) {
        try {
          const eaRows = await db.query(
            `SELECT DepartmentID FROM EmployeeAssignment WHERE UserID = ? AND IsPrimary = 1 AND IsDeleted = 0 LIMIT 1`,
            [actor.userId]
          );
          if (eaRows && eaRows[0] && eaRows[0].DepartmentID) {
            departmentId = eaRows[0].DepartmentID;
          }
        } catch {
          // Fallback if query fails
        }
      }
    }

    return userRepository.findAll({
      tenantId,
      departmentId,
      userTypeCode: params.userTypeCode,
      status: params.status,
      search: params.search,
      limit: params.limit || 10,
      offset: params.offset || 0
    });
  }

  async getUserById(userId, actor) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (
      !isParkAdminActor(actor) &&
      user.TenantID !== actor.tenantId &&
      user.UserID !== actor.userId
    ) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  async createUser(userData, actor) {
    const cleanEmail = userData.email?.trim().toLowerCase();
    const existingEmail = await userRepository.findByEmail(cleanEmail);
    if (existingEmail) {
      throw new AppError(`Email address '${userData.email}' already exists in the system database for another registered user account.`, 400);
    }

    // Determine or generate unique permanent username
    let username = userData.username?.trim();
    if (!username) {
      const emailPrefix = userData.email.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '');
      const baseName = emailPrefix || `${userData.firstName.toLowerCase()}.${userData.lastName.toLowerCase()}`.replace(/[^a-z0-9._-]/g, '');
      username = baseName;
      let counter = 1;
      while (await userRepository.findByUsername(username)) {
        username = `${baseName}${counter}`;
        counter++;
      }
    } else {
      const existingUsername = await userRepository.findByUsername(username);
      if (existingUsername) {
        throw new AppError('Username is already taken', 400);
      }
    }

    // Generate secure temporary password
    const randStr = Math.random().toString(36).substring(2, 8).toUpperCase() + Math.random().toString(36).substring(2, 6);
    const tempPassword = `Temp#${randStr}`;
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const tenantId = isParkAdminActor(actor)
      ? (userData.tenantId ? Number(userData.tenantId) : actor.tenantId)
      : actor.tenantId;

    if (!isParkAdminActor(actor)) {
      const requestedCode = (userData.userTypeCode || '').toUpperCase();
      if (['SUPER_ADMIN', 'PARK_ADMIN', 'PARK_SUPER_ADMIN', 'BUSINESS_PARK_ADMIN'].includes(requestedCode)) {
        throw new AppError('Permission denied: Company Administrators cannot create Business Park Administrator accounts', 403);
      }
    }

    const tx = await db.getTransaction();

    try {
      const userId = await userRepository.createUser(
        {
          tenantId,
          userTypeCode: userData.userTypeCode || 'STAFF',
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          phoneNumber: userData.phoneNumber,
          mobileNumber: userData.mobileNumber,
          jobTitle: userData.jobTitle,
          preferredLanguage: userData.preferredLanguage || 'en',
          actorUserId: actor.userId
        },
        tx
      );

      const userAccountId = await userRepository.createUserAccount(
        {
          userId,
          username,
          passwordHash,
          accountStatusCode: userData.accountStatusCode || 'MUST_CHANGE_PASSWORD',
          actorUserId: actor.userId
        },
        tx
      );

      if (userData.departmentId) {
        await tx.query(
          `INSERT INTO EmployeeAssignment (UserID, DepartmentID, IsPrimary, JoinedDate, IsActive, CreatedBy)
           VALUES (?, ?, 1, CURRENT_DATE(), 1, ?)`,
          [userId, Number(userData.departmentId), actor.userId || 1]
        );
      }

      if (userData.roleIds && userData.roleIds.length > 0) {
        await roleRepository.assignUserRoles(userId, userData.roleIds, actor.userId, tx);
      } else {
        const code = (userData.userTypeCode || '').toUpperCase();
        const defaultRoleCode = (code === 'PARK_ADMIN' || code === 'SUPER_ADMIN' || code === 'PARK_SUPER_ADMIN')
          ? 'PARK_SUPER_ADMIN'
          : (code === 'TENANT_REPRESENTATIVE' || code === 'TENANT_ADMIN' || code === 'COMPANY_ADMIN' || code === 'ADMIN')
            ? 'TENANT_REPRESENTATIVE'
            : (code === 'TECHNICIAN' || code === 'PARK_TECHNICIAN')
              ? 'TECHNICIAN'
              : (code === 'MANAGER' || code === 'DEPARTMENT_MANAGER' || code === 'DISPATCHER' || code === 'PARK_DISPATCHER')
                ? 'DEPARTMENT_MANAGER'
                : 'EMPLOYEE';
        
        let defaultRole = await roleRepository.findByCode(defaultRoleCode, tenantId, tx);
        if (!defaultRole && defaultRoleCode === 'DEPARTMENT_MANAGER') {
          defaultRole = (await roleRepository.findByCode('MANAGER', tenantId, tx)) || (await roleRepository.findByCode('DISPATCHER', tenantId, tx));
        }
        if (!defaultRole && defaultRoleCode === 'TENANT_REPRESENTATIVE') {
          defaultRole = (await roleRepository.findByCode('TENANT_ADMIN', tenantId, tx)) || (await roleRepository.findByCode('COMPANY_ADMIN', tenantId, tx));
        }
        if (!defaultRole) {
          defaultRole = await roleRepository.findByCode('EMPLOYEE', tenantId, tx);
        }
        if (defaultRole) {
          await roleRepository.assignUserRoles(userId, [defaultRole.RoleID], actor.userId, tx);
        }
      }

      await tx.commit();

      // Dispatch welcome email with temporary credentials asynchronously
      let emailSent = false;
      let emailError = null;
      let emailPreviewUrl = null;
      try {
        const emailServiceModule = await import('../../notification/services/email.service.js');
        const emailService = emailServiceModule.default || emailServiceModule.emailService;
        
        console.log(`📧 [USER-REGISTER] Attempting credential email dispatch to: ${userData.email}`);
        
        const emailBody = emailService.wrapInHtmlEmail(
          'Welcome to Enterprise ITMS - Your Employee Account Credentials',
          `
            <h2 style="color:#1e293b;margin-top:0">Welcome, ${userData.firstName}!</h2>
            <p>Your employee account has been created by your IT Administrator.</p>
            <div style="background:#f1f5f9;border-left:4px solid #6366f1;padding:16px;margin:20px 0;border-radius:6px">
              <p style="margin:0 0 10px 0;font-weight:700;color:#334155">Your Login Credentials:</p>
              <p style="margin:4px 0"><strong>Registered Email:</strong> <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;color:#4f46e5">${userData.email}</code></p>
              <p style="margin:4px 0"><strong>Assigned Username:</strong> <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;color:#4f46e5">${username}</code></p>
              <p style="margin:4px 0"><strong>Temporary Password:</strong> <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;color:#dc2626">${tempPassword}</code></p>
            </div>
            <p style="color:#64748b;font-size:13px"><strong>Important:</strong> You can log in using either your email address or username with the temporary password above. Upon your first login, you will be required to set a permanent password for security.</p>
          `
        );

        const emailResult = await emailService.sendEmail({
          to: userData.email,
          subject: 'Enterprise ITMS - Account Credentials & Welcome',
          html: emailBody
        });

        emailSent = emailResult.success;
        emailPreviewUrl = emailResult.previewUrl || null;

        if (emailResult.success) {
          console.log(`📧 ✅ [USER-REGISTER] Credential email DELIVERED to ${userData.email} via ${emailResult.transport} | messageId: ${emailResult.messageId}`);
          if (emailPreviewUrl) {
            console.log(`📧 🔗 [USER-REGISTER] Preview URL: ${emailPreviewUrl}`);
          }
        } else {
          emailError = emailResult.error;
          console.error(`📧 ❌ [USER-REGISTER] Credential email FAILED to ${userData.email}: ${emailResult.error}`);
          console.error(`📧 ❌ [USER-REGISTER] Transport used: ${emailResult.transport}`);
        }
      } catch (mailErr) {
        emailError = mailErr.message;
        console.error(`📧 ❌ [USER-REGISTER] Email dispatch exception: ${mailErr.message}`);
        console.error(mailErr.stack);
      }

      const createdUser = await userRepository.findById(userId);
      return {
        ...createdUser,
        tempPassword,
        generatedUsername: username,
        emailSent,
        emailError,
        emailPreviewUrl
      };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  async updateUser(userId, userData, actor) {
    const existingUser = await userRepository.findById(userId);
    if (!existingUser) {
      throw new AppError('User not found', 404);
    }

    if (
      !isParkAdminActor(actor) &&
      existingUser.TenantID !== actor.tenantId &&
      existingUser.UserID !== actor.userId
    ) {
      throw new AppError('Permission denied', 403);
    }

    if (userData.email && userData.email.trim().toLowerCase() !== existingUser.Email?.toLowerCase()) {
      const emailOccupied = await userRepository.findByEmail(userData.email.trim());
      if (emailOccupied) {
        throw new AppError(`Email address '${userData.email}' already exists in the system database for another registered user account.`, 400);
      }
    }

    await userRepository.updateUser(userId, userData, actor.userId);
    return userRepository.findById(userId);
  }

  async updateUserStatus(userId, status, actor) {
    const existingUser = await userRepository.findById(userId);
    if (!existingUser) {
      throw new AppError('User not found', 404);
    }

    if (
      !isParkAdminActor(actor) &&
      existingUser.TenantID !== actor.tenantId
    ) {
      throw new AppError('Permission denied', 403);
    }

    await userRepository.updateUserStatus(userId, status, actor.userId);

    if (status !== 'ACTIVE') {
      await userSessionRepository.revokeAllForAccount(existingUser.UserAccountID, actor.userId);
    }

    return { message: `User status updated to ${status}` };
  }

  async deleteUser(userId, actor) {
    const existingUser = await userRepository.findById(userId);
    if (!existingUser) {
      throw new AppError('User not found', 404);
    }

    if (
      !isParkAdminActor(actor) &&
      existingUser.TenantID !== actor.tenantId
    ) {
      throw new AppError('Permission denied', 403);
    }

    await userRepository.softDeleteUser(userId, actor.userId);
    await userSessionRepository.revokeAllForAccount(existingUser.UserAccountID, actor.userId);

    return { message: 'User deleted successfully' };
  }

  async getUserSessions(userId, actor) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!isParkAdminActor(actor) && user.TenantID !== actor.tenantId && user.UserID !== actor.userId) {
      throw new AppError('User not found', 404);
    }

    return userSessionRepository.listActiveByUserAccountId(user.UserAccountID);
  }

  async terminateUserSessions(userId, actor) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!isParkAdminActor(actor) && user.TenantID !== actor.tenantId && user.UserID !== actor.userId) {
      throw new AppError('User not found', 404);
    }

    await userSessionRepository.revokeAllForAccount(user.UserAccountID, actor.userId);
    return { message: 'All active sessions for the user have been terminated' };
  }

  async getUserLoginHistory(userId, params, actor) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!isParkAdminActor(actor) && user.TenantID !== actor.tenantId && user.UserID !== actor.userId) {
      throw new AppError('User not found', 404);
    }

    return userRepository.findLoginHistory(user.UserAccountID, {
      limit: params.limit || 20,
      offset: params.offset || 0
    });
  }
}

export default new UserService();
