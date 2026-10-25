import assert from 'node:assert/strict';
import { query } from '../src/database/connection.js';
import assignmentService from '../src/modules/dispatch/services/assignment.service.js';
import { authorizedRecipientService } from '../src/modules/notification/services/authorized-recipient.service.js';
import issueRequestRepository from '../src/modules/issue-management/repositories/issue-request.repository.js';
import issueHistoryRepository from '../src/modules/issue-management/repositories/issue-history.repository.js';

console.log('====================================================');
console.log('REAL-TIME REQUEST PROGRESS TRACKING TEST SUITE');
console.log('====================================================\n');

async function runTests() {
  let createdIssueId = null;
  let createdAssignmentId = null;
  let testRequesterId = null;
  let testTechnicianId = null;
  let testApproverId = null;

  try {
    // 1. Fetch or create test actors
    const [requester] = await query("SELECT UserID, Email FROM `User` WHERE UserTypeCode IN ('EMPLOYEE', 'TENANT_USER') AND IsActive = 1 LIMIT 1");
    testRequesterId = requester?.UserID || 1;

    const [tech] = await query("SELECT UserID, Email FROM `User` WHERE UserTypeCode IN ('TECHNICIAN', 'PARK_TECHNICIAN') AND IsActive = 1 LIMIT 1");
    testTechnicianId = tech?.UserID || 1;

    const [approver] = await query("SELECT UserID, Email FROM `User` WHERE UserTypeCode IN ('DEPARTMENT_MANAGER', 'PARK_ADMIN') AND IsActive = 1 LIMIT 1");
    testApproverId = approver?.UserID || 1;

    console.log(`[SETUP] Requester: #${testRequesterId}, Technician: #${testTechnicianId}, Approver: #${testApproverId}`);

    // 2. Create a test request in APPROVED status
    const testReqNumber = `REQ-TEST-PROG-${Date.now()}`;
    const [dept] = await query("SELECT DepartmentID FROM Department WHERE IsDeleted = 0 LIMIT 1");
    const deptId = dept?.DepartmentID || 1;

    const [svc] = await query("SELECT s.ServiceID, sc.CategoryCode FROM Service s LEFT JOIN ServiceCategory sc ON s.ServiceCategoryID = sc.ServiceCategoryID WHERE s.IsDeleted = 0 LIMIT 1");
    const serviceId = svc?.ServiceID || 1;

    const createSql = `
      INSERT INTO IssueRequest (
        RequestNumber, Title, Description, RequestTypeCode, PriorityCode, StatusCode,
        RequestChannelCode, CategoryCode, RequestSourceCode, RequesterUserID, AssignedDepartmentID,
        ServiceID, CreatedBy
      ) VALUES (?, ?, ?, 'MAINTENANCE', 'HIGH', 'APPROVED', 'WEB', ?, 'EMPLOYEE', ?, ?, ?, ?)
    `;
    const createRes = await query(createSql, [
      testReqNumber,
      'HVAC Compressor Thermal Overload Trip',
      'HVAC unit in Building A tripped due to high pressure compressor thermal overload.',
      svc?.CategoryCode || 'HVAC',
      testRequesterId,
      deptId,
      serviceId,
      testRequesterId
    ]);
    createdIssueId = createRes.insertId;
    console.log(`✓ [TEST 1] Created test issue request #${createdIssueId} (${testReqNumber}) in APPROVED state`);

    // 3. Link an Approval record so we can test approver resolution
    const appRes = await query(
      `INSERT INTO Approval (RequestID, Title, TotalStages, CurrentStageNumber, ApprovalStatusCode, CreatedBy)
       VALUES (?, 'Approval for HVAC Request', 1, 1, 'APPROVED', ?)`,
      [createdIssueId, testApproverId]
    );
    const approvalId = appRes.insertId;

    const stageRes = await query(
      `INSERT INTO ApprovalStage (ApprovalID, StageNumber, ApproverUserID, StageStatusCode, CreatedBy)
       VALUES (?, 1, ?, 'APPROVED', ?)`,
      [approvalId, testApproverId, testApproverId]
    );
    const stageId = stageRes.insertId;

    await query(
      `INSERT INTO ApprovalDecision (ApprovalStageID, DecisionUserID, DecisionCode, Comments, CreatedBy)
       VALUES (?, ?, 'APPROVED', 'Approved for immediate field dispatch', ?)`,
      [stageId, testApproverId, testApproverId]
    );
    console.log(`✓ [TEST 2] Established Approval & Decision records for Approver #${testApproverId}`);

    // 4. Create an assignment in ASSIGNED state
    const assignSql = `
      INSERT INTO Assignment (RequestID, AssignedUserID, AssignmentStatusCode, CreatedBy)
      VALUES (?, ?, 'ASSIGNED', ?)
    `;
    const assignRes = await query(assignSql, [createdIssueId, testTechnicianId, testApproverId]);
    createdAssignmentId = assignRes.insertId;
    console.log(`✓ [TEST 3] Created Assignment #${createdAssignmentId} for Technician #${testTechnicianId}`);

    // 5. Test Technician startWork transitions issue to IN_PROGRESS
    console.log('\n--- Testing startWork Lifecycle ---');
    await assignmentService.startWork(createdAssignmentId, testTechnicianId);

    const [startedIssue] = await query("SELECT StatusCode FROM IssueRequest WHERE IssueRequestID = ?", [createdIssueId]);
    assert.equal(startedIssue.StatusCode, 'IN_PROGRESS', 'Issue status must transition to IN_PROGRESS upon startWork');
    console.log(`✓ [TEST 4] startWork successfully transitioned IssueRequest to 'IN_PROGRESS'`);

    // 6. Test Technician posting Progress Update
    console.log('\n--- Testing Technician updateProgress ---');
    const progressResult = await assignmentService.updateProgress(createdAssignmentId, {
      progressPercentage: 45,
      milestone: 'DIAGNOSIS',
      remarks: 'Diagnosed high head pressure due to blocked condenser coil. Commencing flush.',
      timeSpentMinutes: 30
    }, testTechnicianId);

    assert.equal(progressResult.progressPercentage, 45);
    assert.equal(progressResult.milestone, 'DIAGNOSIS');

    // Verify database updates
    const [progIssue] = await query("SELECT CustomFieldsDataJson, StatusCode FROM IssueRequest WHERE IssueRequestID = ?", [createdIssueId]);
    const custom = typeof progIssue.CustomFieldsDataJson === 'string'
      ? JSON.parse(progIssue.CustomFieldsDataJson)
      : (progIssue.CustomFieldsDataJson || {});
    assert.equal(custom.progressPercentage, 45, 'CustomFieldsDataJson must record 45%');
    assert.equal(custom.progressMilestone, 'DIAGNOSIS', 'CustomFieldsDataJson must record milestone');
    assert.equal(custom.totalTimeSpentMinutes, 30, 'CustomFieldsDataJson must accumulate time spent');
    console.log(`✓ [TEST 5] updateProgress stored custom fields: ${custom.progressPercentage}% [${custom.progressMilestone}]`);

    // Verify IssueRequestHistory audit trail
    const history = await issueHistoryRepository.findByIssueRequestId(createdIssueId);
    const progressHist = history.find(h => h.ActionTypeCode === 'PROGRESS_UPDATED');
    assert(progressHist, 'History must contain a PROGRESS_UPDATED event record');
    assert.equal(progressHist.NewValue, '45% (DIAGNOSIS)');
    console.log(`✓ [TEST 6] Audit trail verified: Logged '${progressHist.ActionTypeCode}' with NewValue: '${progressHist.NewValue}'`);

    // 7. Test Authorized Recipient Resolution includes Requester and Approver
    console.log('\n--- Testing Real-Time Announcement Recipients ---');
    const recipients = await authorizedRecipientService.resolveRecipients('REQUEST_PROGRESS_UPDATED', {
      requestId: createdIssueId,
      progressPercentage: 45,
      milestone: 'DIAGNOSIS'
    }, testTechnicianId);

    const recipientUserIds = recipients.map(r => r.userId);
    console.log(`[RECIPIENTS] Resolved user IDs: [${recipientUserIds.join(', ')}]`);

    assert(recipientUserIds.includes(Number(testRequesterId)), 'Recipients must include the Requester');
    assert(recipientUserIds.includes(Number(testApproverId)), 'Recipients must include the Approver who authorized the work');
    console.log(`✓ [TEST 7] Both Requester (#${testRequesterId}) and Approver (#${testApproverId}) are included in announcement recipients`);

    // 8. Test Technician pauseWork
    console.log('\n--- Testing pauseWork Lifecycle ---');
    await assignmentService.pauseWork(createdAssignmentId, 'Waiting for high-pressure relief valve from central warehouse', testTechnicianId);

    const [pausedIssue] = await query("SELECT StatusCode FROM IssueRequest WHERE IssueRequestID = ?", [createdIssueId]);
    assert.equal(pausedIssue.StatusCode, 'PENDING', 'Issue status must transition to PENDING on pauseWork');
    console.log(`✓ [TEST 8] pauseWork moved IssueRequest status to 'PENDING'`);

    // 9. Test Technician resumeWork
    console.log('\n--- Testing resumeWork Lifecycle ---');
    await assignmentService.resumeWork(createdAssignmentId, 'Valve arrived. Resuming field installation.', testTechnicianId);

    const [resumedIssue] = await query("SELECT StatusCode FROM IssueRequest WHERE IssueRequestID = ?", [createdIssueId]);
    assert.equal(resumedIssue.StatusCode, 'IN_PROGRESS', 'Issue status must transition back to IN_PROGRESS on resumeWork');
    console.log(`✓ [TEST 9] resumeWork moved IssueRequest status back to 'IN_PROGRESS'`);

    // 10. Advance progress to 100% (Testing & Verification)
    console.log('\n--- Testing Final Milestone Update ---');
    const finalProg = await assignmentService.updateProgress(createdAssignmentId, {
      progressPercentage: 100,
      milestone: 'CLEANUP',
      remarks: 'Replaced valve, completed nitrogen leak check, and restored HVAC loop to 72°F.',
      timeSpentMinutes: 45
    }, testTechnicianId);

    assert.equal(finalProg.progressPercentage, 100);
    const [finalIssue] = await query("SELECT CustomFieldsDataJson FROM IssueRequest WHERE IssueRequestID = ?", [createdIssueId]);
    const finalCustom = typeof finalIssue.CustomFieldsDataJson === 'string'
      ? JSON.parse(finalIssue.CustomFieldsDataJson)
      : (finalIssue.CustomFieldsDataJson || {});
    assert.equal(finalCustom.progressPercentage, 100);
    assert.equal(finalCustom.totalTimeSpentMinutes, 75);
    console.log(`✓ [TEST 10] Final progress recorded at 100% [CLEANUP] with total 75 mins accumulated`);

    console.log('\n====================================================');
    console.log('🎉 ALL 10 REAL-TIME PROGRESS TRACKING TESTS PASSED!');
    console.log('====================================================\n');

  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exitCode = 1;
  } finally {
    // Cleanup
    if (createdAssignmentId) {
      await query("DELETE FROM AssignmentHistory WHERE AssignmentID = ?", [createdAssignmentId]);
      await query("DELETE FROM Assignment WHERE AssignmentID = ?", [createdAssignmentId]);
    }
    if (createdIssueId) {
      await query("DELETE FROM IssueRequestHistory WHERE IssueRequestID = ?", [createdIssueId]);
      await query("DELETE FROM ApprovalDecision WHERE ApprovalStageID IN (SELECT ApprovalStageID FROM ApprovalStage WHERE ApprovalID IN (SELECT ApprovalID FROM Approval WHERE RequestID = ?))", [createdIssueId]);
      await query("DELETE FROM ApprovalStage WHERE ApprovalID IN (SELECT ApprovalID FROM Approval WHERE RequestID = ?)", [createdIssueId]);
      await query("DELETE FROM Approval WHERE RequestID = ?", [createdIssueId]);
      await query("DELETE FROM IssueRequest WHERE IssueRequestID = ?", [createdIssueId]);
    }
    console.log('Test cleanup complete.');
    process.exit(process.exitCode || 0);
  }
}

runTests();
