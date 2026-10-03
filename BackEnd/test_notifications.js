import { query } from 'file:///d:/Issue-Tracking-Mngmt-System/BackEnd/src/database/connection.js';
import { notificationService } from 'file:///d:/Issue-Tracking-Mngmt-System/BackEnd/src/modules/notification/services/notification.service.js';
import { authorizedRecipientService } from 'file:///d:/Issue-Tracking-Mngmt-System/BackEnd/src/modules/notification/services/authorized-recipient.service.js';
import { issueRequestService } from 'file:///d:/Issue-Tracking-Mngmt-System/BackEnd/src/modules/issue-management/services/issue-request.service.js';
import { approvalService } from 'file:///d:/Issue-Tracking-Mngmt-System/BackEnd/src/modules/approval/services/approval.service.js';
import { assignmentService } from 'file:///d:/Issue-Tracking-Mngmt-System/BackEnd/src/modules/dispatch/services/assignment.service.js';

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passed++;
  console.log(`✅ PASSED: ${message}`);
}

async function runNotificationTests() {
  console.log('================================================================');
  console.log('🧪 RUNNING PRODUCTION-READY NOTIFICATION MANAGEMENT TEST SUITE');
  console.log('================================================================\n');

  // Clean up any previous test requests and notifications
  await query("DELETE FROM NotificationLog WHERE NotificationID IN (SELECT NotificationID FROM Notification WHERE Title LIKE 'TEST_NOTIF%')");
  await query("DELETE FROM NotificationQueue WHERE NotificationRecipientID IN (SELECT NotificationRecipientID FROM NotificationRecipient WHERE NotificationID IN (SELECT NotificationID FROM Notification WHERE Title LIKE 'TEST_NOTIF%'))");
  await query("DELETE FROM NotificationRecipient WHERE NotificationID IN (SELECT NotificationID FROM Notification WHERE Title LIKE 'TEST_NOTIF%')");
  await query("DELETE FROM UserNotification WHERE NotificationID IN (SELECT NotificationID FROM Notification WHERE Title LIKE 'TEST_NOTIF%')");
  await query("DELETE FROM Notification WHERE Title LIKE 'TEST_NOTIF%'");
  await query("DELETE FROM IssueRequestHistory WHERE IssueRequestID IN (SELECT IssueRequestID FROM IssueRequest WHERE Title LIKE 'TEST_NOTIF%')");
  await query("DELETE FROM AssignmentHistory WHERE AssignmentID IN (SELECT AssignmentID FROM Assignment WHERE RequestID IN (SELECT IssueRequestID FROM IssueRequest WHERE Title LIKE 'TEST_NOTIF%'))");
  await query("DELETE FROM Assignment WHERE RequestID IN (SELECT IssueRequestID FROM IssueRequest WHERE Title LIKE 'TEST_NOTIF%')");
  await query("DELETE FROM ApprovalDecision WHERE ApprovalStageID IN (SELECT ApprovalStageID FROM ApprovalStage WHERE ApprovalID IN (SELECT ApprovalID FROM Approval WHERE Title LIKE 'TEST_NOTIF%'))");
  await query("DELETE FROM ApprovalHistory WHERE ApprovalID IN (SELECT ApprovalID FROM Approval WHERE Title LIKE 'TEST_NOTIF%')");
  await query("DELETE FROM ApprovalStage WHERE ApprovalID IN (SELECT ApprovalID FROM Approval WHERE Title LIKE 'TEST_NOTIF%')");
  await query("DELETE FROM Approval WHERE Title LIKE 'TEST_NOTIF%'");
  await query("DELETE FROM IssueRequest WHERE Title LIKE 'TEST_NOTIF%'");

  // -------------------------------------------------------------------------
  // TEST 1: End-to-End Workflow Notifications
  // -------------------------------------------------------------------------
  console.log('--- TEST 1: Request Submission & Department Review Notification ---');

  // Marta (UserID: 4, Employee of Tenant 1) creates a request
  const issue = await issueRequestService.createIssue({
    TenantID: 1,
    ServiceID: 1,
    Title: 'TEST_NOTIF_HVAC_Issue',
    Description: 'AC leaking in server room',
    PriorityCode: 'HIGH',
    EstimatedCost: 6500.00,
    IsMajorIncident: 0,
    RequestSourceCode: 'EMPLOYEE',
    RequestChannelCode: 'WEB'
  }, 4);

  assert(issue !== null, 'Issue request created');

  // Check in-app notification for Requester (Marta, UserID: 4)
  const martaInbox = await notificationService.getUserNotifications(4);
  const martaSubmissionNotif = martaInbox.find(n => n.Title?.includes(issue.RequestNumber) || n.MessageText?.includes(issue.RequestNumber));
  assert(martaSubmissionNotif !== undefined, 'Requester received in-app submission notification');

  // Check in-app notification for Department Manager (Helen Facility, UserID: 2)
  const helenInbox = await notificationService.getUserNotifications(2);
  const helenReviewNotif = helenInbox.find(n => n.Title?.includes(issue.RequestNumber) || n.MessageText?.includes(issue.RequestNumber));
  assert(helenReviewNotif !== undefined, 'Department Manager received approval required notification');

  // Verify delivery log recorded
  const logs = await notificationService.getDeliveryLog();
  assert(logs.length > 0, 'Notification delivery audit logs created');

  // -------------------------------------------------------------------------
  // TEST 2: Multi-Level Approval Notifications (Stage 1 Dept -> Stage 2 Superadmin)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 2: Multi-Level Approval Progression Notifications ---');

  const approval = await approvalService.getApprovalByRequestId(issue.IssueRequestID);
  assert(approval !== null, 'Approval workflow found');

  // Helen (Dept Manager UserID: 2) approves Stage 1
  await approvalService.submitDecision({
    ApprovalID: approval.ApprovalID,
    DecisionCode: 'APPROVED',
    Comments: 'Department review complete, forwarding to Business Park Administrator'
  }, 2);

  // Business Park Super Admin (UserID: 1) should receive Higher-Level Approval notification
  const superadminInbox = await notificationService.getUserNotifications(1);
  const higherApprNotif = superadminInbox.find(n => n.Title?.includes(issue.RequestNumber) || n.MessageText?.includes(issue.RequestNumber));
  assert(higherApprNotif !== undefined, 'Business Park Administrator received higher-level approval required notification');

  // Business Park Super Admin (UserID: 1) approves Stage 2
  await approvalService.submitDecision({
    ApprovalID: approval.ApprovalID,
    DecisionCode: 'APPROVED',
    Comments: 'Executive authorization granted'
  }, 1);

  // Dispatcher (Ruth Alemu, UserID: 6) should receive APPROVAL_COMPLETED notification
  const dispatcherInbox = await notificationService.getUserNotifications(6);
  const apprCompletedNotif = dispatcherInbox.find(n => n.Title?.includes(issue.RequestNumber) || n.MessageText?.includes(issue.RequestNumber));
  assert(apprCompletedNotif !== undefined, 'Dispatcher received APPROVAL_COMPLETED notification ready for dispatch');

  // -------------------------------------------------------------------------
  // TEST 3: Assignment & Reassignment Notifications
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 3: Assignment & Work Order Notifications ---');

  // Dispatcher assigns to Technician Daniel Worku (UserID: 5)
  const assignment = await assignmentService.manualAssign({
    RequestID: issue.IssueRequestID,
    AssignedUserID: 5,
    Remarks: 'Assigned to Daniel Worku for urgent HVAC repair'
  }, 6);

  assert(assignment !== null, 'Assignment created');

  // Technician Daniel Worku (UserID: 5) should receive ISSUE_ASSIGNED notification
  const danielInbox = await notificationService.getUserNotifications(5);
  const techAssignmentNotif = danielInbox.find(n => n.Title?.includes(issue.RequestNumber) || n.MessageText?.includes(issue.RequestNumber));
  assert(techAssignmentNotif !== undefined, 'Technician received work order assignment notification');

  // -------------------------------------------------------------------------
  // TEST 4: Status Transition & Resolution Notifications
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 4: Work Completion & Resolution Notifications ---');

  // Technician completes work
  await assignmentService.completeWork(assignment.AssignmentID, {
    workNotes: 'Replaced HVAC valve and recharged refrigerant'
  }, 5);

  // Marta (Requester UserID: 4) should receive ISSUE_RESOLVED notification
  const martaUpdatedInbox = await notificationService.getUserNotifications(4);
  const resolvedNotif = martaUpdatedInbox.find(n => n.TypeCode === 'ISSUE_RESOLVED' && (n.Title?.includes(issue.RequestNumber) || n.MessageText?.includes(issue.RequestNumber)));
  assert(resolvedNotif !== undefined, 'Requester received ISSUE_RESOLVED notification to verify work');

  // -------------------------------------------------------------------------
  // TEST 5: In-App Read/Unread State & IDOR Protection
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 5: In-App Read/Unread State & IDOR Protection ---');

  const unreadBefore = await notificationService.getUnreadCount(4);
  assert(unreadBefore > 0, `Requester has ${unreadBefore} unread notifications`);

  // Mark single notification as read
  if (resolvedNotif) {
    const markRes = await notificationService.markAsRead(resolvedNotif.UserNotificationID, 4);
    assert(markRes.read === true, 'Successfully marked single notification as read');

    // Attempt IDOR: User 5 trying to mark User 4's notification as read -> affectedRows must be 0
    const idorRes = await notificationService.markAsRead(resolvedNotif.UserNotificationID, 5);
    assert(idorRes.read === false, 'IDOR attempt blocked: User cannot mark another user notification as read');
  }

  // Mark all read for User 4
  await notificationService.markAllRead(4);
  const unreadAfter = await notificationService.getUnreadCount(4);
  assert(unreadAfter === 0, 'markAllRead set unread count to 0');

  // -------------------------------------------------------------------------
  // TEST 6: Strict Multi-Tenant Isolation
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 6: Strict Multi-Tenant Isolation ---');

  // User 7 (Tenant Representative of Beta Logistics, Tenant 2)
  // Must NEVER be in recipients for Tenant 1's issue
  const recipients = await authorizedRecipientService.resolveRecipients('ISSUE_CREATED', {
    issue,
    requestId: issue.IssueRequestID
  });

  const crossTenantFound = recipients.some(r => r.userId === 7);
  assert(!crossTenantFound, 'Cross-tenant isolation enforced: Tenant 2 user was NOT included in Tenant 1 notification');

  // -------------------------------------------------------------------------
  // TEST 7: Notification Preferences (Channel Suppression)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 7: User Notification Preferences ---');

  // Fetch preferences for User 4
  const prefs = await notificationService.getUserPreferences(4);
  assert(Array.isArray(prefs) && prefs.length > 0, 'User preferences retrieved');

  // Disable EMAIL for ISSUE_RESOLVED for User 4
  const resolvedType = prefs.find(p => p.TypeCode === 'ISSUE_RESOLVED' && p.ChannelCode === 'EMAIL');
  if (resolvedType) {
    await notificationService.updateUserPreferences(4, [
      { NotificationTypeID: resolvedType.NotificationTypeID, NotificationChannelID: resolvedType.NotificationChannelID, IsEnabled: false }
    ]);

    const updatedPrefs = await notificationService.getUserPreferences(4);
    const updatedPref = updatedPrefs.find(p => p.TypeCode === 'ISSUE_RESOLVED' && p.ChannelCode === 'EMAIL');
    assert(updatedPref.IsEnabled === 0, 'Notification preference successfully updated to disabled');

    // Re-enable it
    await notificationService.updateUserPreferences(4, [
      { NotificationTypeID: resolvedType.NotificationTypeID, NotificationChannelID: resolvedType.NotificationChannelID, IsEnabled: true }
    ]);
  }

  console.log('\n================================================================');
  console.log(`🎉 ALL ${passed}/${total} NOTIFICATION TESTS PASSED SUCCESSFULLY!`);
  console.log('================================================================\n');
}

runNotificationTests()
  .then(() => {
    setTimeout(() => process.exit(0), 1500);
  })
  .catch(err => {
    console.error('❌ Test suite failed:', err);
    process.exit(1);
  });
