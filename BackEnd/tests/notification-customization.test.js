import assert from 'assert';
import notificationRepository from '../src/modules/notification/repositories/notification.repository.js';
import notificationService from '../src/modules/notification/services/notification.service.js';
import emailService from '../src/modules/notification/services/email.service.js';
import { query } from '../src/database/connection.js';

async function runTests() {
  console.log('🧪 Starting Enterprise Notification Architecture & Customization Tests...\n');

  let passed = 0;
  let failed = 0;

  const test = async (name, fn) => {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}\n`);
      failed++;
    }
  };

  // Ensure tables and types are initialized
  await notificationRepository.initTables();

  // Test 1: Verify all 19 Enterprise Notification Types exist
  await test('All 19 Enterprise Notification Types exist in database', async () => {
    const types = await notificationRepository.getNotificationTypes();
    assert(types.length >= 19, `Expected at least 19 notification types, found ${types.length}`);

    const expectedCodes = [
      'ISSUE_CREATED',
      'APPROVAL_REQUIRED',
      'HIGHER_APPROVAL_REQUIRED',
      'DEPARTMENT_APPROVED',
      'APPROVAL_COMPLETED',
      'ISSUE_APPROVED_FOR_DISPATCH',
      'APPROVAL_REJECTED',
      'ISSUE_ASSIGNED',
      'ASSIGNMENT_REASSIGNED',
      'REQUEST_STATUS_CHANGED',
      'SLA_WARNING',
      'SLA_BREACH',
      'ISSUE_RESOLVED',
      'REQUEST_CLOSED',
      'REQUEST_CANCELLED',
      'REQUEST_REOPENED',
      'NEW_COMMENT_ADDED',
      'PARTS_REQUIRED',
      'MAINTENANCE_SCHEDULED'
    ];

    for (const code of expectedCodes) {
      const found = types.find(t => t.TypeCode === code);
      assert(found, `Missing notification type '${code}'`);
    }
  });

  // Test 2: Verify Templates exist for enterprise types
  await test('Notification Templates are registered for in-app and email', async () => {
    const templates = await notificationRepository.getTemplates();
    assert(templates.length >= 30, `Expected at least 30 templates, found ${templates.length}`);

    const sampleTypes = ['ISSUE_CREATED', 'APPROVAL_REQUIRED', 'ISSUE_APPROVED_FOR_DISPATCH', 'ISSUE_ASSIGNED', 'ISSUE_RESOLVED'];
    for (const code of sampleTypes) {
      const match = templates.find(t => t.TypeCode === code);
      assert(match, `Expected template for '${code}'`);
    }
  });

  // Test 3: Role-Perspective Message Synthesizer generates distinct content per role
  await test('generateRolePerspectiveContent generates role-tailored content', async () => {
    const context = {
      requestNumber: 'REQ-2026-TEST',
      title: 'Water Leak in Server Room',
      departmentName: 'Facility Maintenance',
      priority: 'CRITICAL',
      status: 'APPROVED',
      location: 'Building A, Floor 2',
      targetResolution: '2 hours',
      estimatedCost: '500'
    };

    // Role A: Requester on ISSUE_CREATED
    const requesterIntake = notificationService.generateRolePerspectiveContent({
      eventCode: 'ISSUE_CREATED',
      roleCode: 'REQUESTER',
      context,
      defaultTitle: 'Default',
      defaultMessage: 'Default'
    });
    assert(requesterIntake.title.includes('Ticket Submitted'), 'Requester title should confirm ticket submission');
    assert(requesterIntake.message.includes('logged and routed'), 'Requester message should indicate routing');

    // Role B: Manager on ISSUE_CREATED
    const mgrIntake = notificationService.generateRolePerspectiveContent({
      eventCode: 'ISSUE_CREATED',
      roleCode: 'DEPARTMENT_MANAGER',
      context,
      defaultTitle: 'Default',
      defaultMessage: 'Default'
    });
    assert(mgrIntake.title.includes('New Intake'), 'Manager title should state New Intake');
    assert(mgrIntake.message.includes('Priority: CRITICAL'), 'Manager message should highlight CRITICAL priority');

    // Role C: Department Manager on APPROVAL_REQUIRED
    const mgrApproval = notificationService.generateRolePerspectiveContent({
      eventCode: 'APPROVAL_REQUIRED',
      roleCode: 'DEPARTMENT_MANAGER',
      context,
      defaultTitle: 'Default',
      defaultMessage: 'Default'
    });
    assert(mgrApproval.title.includes('Department Approval'), 'Manager title should request department approval');

    // Role D: Requester on APPROVAL_REQUIRED
    const reqApproval = notificationService.generateRolePerspectiveContent({
      eventCode: 'APPROVAL_REQUIRED',
      roleCode: 'REQUESTER',
      context,
      defaultTitle: 'Default',
      defaultMessage: 'Default'
    });
    assert(reqApproval.title.includes('In Review'), 'Requester should see In Review status');

    // Role E: Park Administrator on HIGHER_APPROVAL_REQUIRED
    const adminApproval = notificationService.generateRolePerspectiveContent({
      eventCode: 'HIGHER_APPROVAL_REQUIRED',
      roleCode: 'PARK_ADMIN',
      context,
      defaultTitle: 'Default',
      defaultMessage: 'Default'
    });
    assert(adminApproval.title.includes('Executive Approval Required'), 'Park Admin should see Executive Approval Required');

    // Role F: Dispatcher on ISSUE_APPROVED_FOR_DISPATCH
    const dispQueue = notificationService.generateRolePerspectiveContent({
      eventCode: 'ISSUE_APPROVED_FOR_DISPATCH',
      roleCode: 'DISPATCHER',
      context,
      defaultTitle: 'Default',
      defaultMessage: 'Default'
    });
    assert(dispQueue.title.includes('Dispatch Queue'), 'Dispatcher should see Dispatch Queue alert');

    // Role G: Technician on ISSUE_ASSIGNED
    const techAssign = notificationService.generateRolePerspectiveContent({
      eventCode: 'ISSUE_ASSIGNED',
      roleCode: 'TECHNICIAN',
      context,
      defaultTitle: 'Default',
      defaultMessage: 'Default'
    });
    assert(techAssign.title.includes('Work Order Assigned'), 'Technician should see Work Order Assigned');
    assert(techAssign.message.includes('Building A, Floor 2'), 'Technician should receive exact location');

    // Role H: Requester on ISSUE_RESOLVED
    const reqResolved = notificationService.generateRolePerspectiveContent({
      eventCode: 'ISSUE_RESOLVED',
      roleCode: 'REQUESTER',
      context,
      defaultTitle: 'Default',
      defaultMessage: 'Default'
    });
    assert(reqResolved.title.includes('Pending Verification'), 'Requester should be prompted to verify resolution');
  });

  // Test 4: Verify email HTML wrapper renders rich metadata and CTA
  await test('wrapInHtmlEmail renders corporate design with metadata badges and CTA button', async () => {
    const html = emailService.wrapInHtmlEmail(
      'Work Order Assigned: #REQ-2026-TEST',
      '<p>You have been assigned to service ticket.</p>',
      {
        priority: 'CRITICAL',
        requestNumber: 'REQ-2026-TEST',
        status: 'ASSIGNED',
        departmentName: 'HVAC Operations'
      }
    );

    assert(html.includes('CRITICAL PRIORITY'), 'Email HTML must include Priority badge');
    assert(html.includes('REQ-2026-TEST'), 'Email HTML must include Ticket Ref');
    assert(html.includes('HVAC Operations'), 'Email HTML must include Department');
    assert(html.includes('Access ITMS Portal'), 'Email HTML must include Action CTA button');
    assert(html.toLowerCase().includes('automated system transmission'), 'Email HTML must include Compliance notice');
  });

  // Test 5: Verify UserNotification table accepts CustomTitle and CustomMessage
  await test('UserNotification repository stores custom role-perspective content and retrieves with issue joins', async () => {
    // Insert a test Notification record
    const types = await notificationRepository.getNotificationTypes();
    const typeId = types[0].NotificationTypeID;

    const notifId = await notificationRepository.createNotification({
      NotificationTypeID: typeId,
      Title: 'Master Notification Title',
      MessageText: 'Master message content',
      TriggeredByTable: 'IssueRequest',
      TriggeredByID: 1,
      CreatedBy: 1
    });

    // Create a personalized UserNotification for user 1
    const userNotifId = await notificationRepository.createUserNotification({
      NotificationID: notifId,
      UserID: 1,
      ChannelCode: 'IN_APP',
      CustomTitle: 'Custom Role-Perspective Alert',
      CustomMessage: 'Personalized instructions for your role.',
      CreatedBy: 1
    });

    assert(userNotifId > 0, 'UserNotification record should be inserted with auto-generated ID');

    // Fetch notifications for User 1
    const list = await notificationRepository.getUserNotifications(1, { limit: 10 });
    const target = list.find(n => n.UserNotificationID === userNotifId);

    assert(target, 'Should find the newly created UserNotification');
    assert.strictEqual(target.Title, 'Custom Role-Perspective Alert', 'Should retrieve CustomTitle over default Title');
    assert.strictEqual(target.MessageText, 'Personalized instructions for your role.', 'Should retrieve CustomMessage');
  });

  // Test 6: Verify User Preferences retrieval across all 19 types
  await test('getUserPreferences returns matrix of all active notification types and channels', async () => {
    const prefs = await notificationRepository.getUserPreferences(1);
    assert(prefs.length >= 19, `Expected preferences matrix covering at least 19 types, found ${prefs.length}`);

    // Verify SMS is excluded as designed and IN_APP + EMAIL are present
    const channels = new Set(prefs.map(p => p.ChannelCode));
    assert(channels.has('IN_APP'), 'Preferences must include IN_APP channel');
    assert(channels.has('EMAIL'), 'Preferences must include EMAIL channel');
    assert(!channels.has('SMS'), 'SMS channel should remain excluded from standard preferences');
  });

  console.log('\n=======================================');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log('=======================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Unhandled Test Runner Exception:', err);
  process.exit(1);
});
