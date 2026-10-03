import { query } from 'file:///d:/Issue-Tracking-Mngmt-System/BackEnd/src/database/connection.js';
import { issueRequestService } from 'file:///d:/Issue-Tracking-Mngmt-System/BackEnd/src/modules/issue-management/services/issue-request.service.js';
import { approvalService } from 'file:///d:/Issue-Tracking-Mngmt-System/BackEnd/src/modules/approval/services/approval.service.js';
import { assignmentService } from 'file:///d:/Issue-Tracking-Mngmt-System/BackEnd/src/modules/dispatch/services/assignment.service.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedTests++;
  console.log(`✅ PASSED: ${message}`);
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 RUNNING PRODUCTION-READY MULTI-LEVEL WORKFLOW TEST SUITE');
  console.log('================================================================\n');

  // Clean up any previous test requests
  await query("DELETE FROM AssignmentHistory WHERE AssignmentID IN (SELECT AssignmentID FROM Assignment WHERE RequestID IN (SELECT IssueRequestID FROM IssueRequest WHERE Title LIKE 'TEST_WORKFLOW%'))");
  await query("DELETE FROM Assignment WHERE RequestID IN (SELECT IssueRequestID FROM IssueRequest WHERE Title LIKE 'TEST_WORKFLOW%')");
  await query("DELETE FROM ApprovalDecision WHERE ApprovalStageID IN (SELECT ApprovalStageID FROM ApprovalStage WHERE ApprovalID IN (SELECT ApprovalID FROM Approval WHERE Title LIKE 'TEST_WORKFLOW%'))");
  await query("DELETE FROM ApprovalHistory WHERE ApprovalID IN (SELECT ApprovalID FROM Approval WHERE Title LIKE 'TEST_WORKFLOW%')");
  await query("DELETE FROM ApprovalStage WHERE ApprovalID IN (SELECT ApprovalID FROM Approval WHERE Title LIKE 'TEST_WORKFLOW%')");
  await query("DELETE FROM Approval WHERE Title LIKE 'TEST_WORKFLOW%'");
  await query("DELETE FROM IssueRequestHistory WHERE IssueRequestID IN (SELECT IssueRequestID FROM IssueRequest WHERE Title LIKE 'TEST_WORKFLOW%')");
  await query("DELETE FROM IssueRequest WHERE Title LIKE 'TEST_WORKFLOW%'");

  // -------------------------------------------------------------------------
  // TEST 1: ROUTINE REQUEST WORKFLOW (1-Stage Department Manager Approval)
  // -------------------------------------------------------------------------
  console.log('--- TEST 1: Routine Request (1-Stage Approval -> Assign -> Resolve -> Close) ---');
  
  // Requester (UserID: 4, Marta Tesfaye) submits a routine request
  const routineIssue = await issueRequestService.createIssue({
    TenantID: 1,
    ServiceID: 1, // Routine facility service
    Title: 'TEST_WORKFLOW_Routine_AC_Filter',
    Description: 'Routine air conditioning filter cleaning',
    PriorityCode: 'MEDIUM',
    EstimatedCost: 450.00,
    IsMajorIncident: 0,
    RequestSourceCode: 'EMPLOYEE',
    RequestChannelCode: 'WEB'
  }, 4);

  assert(routineIssue.StatusCode === 'PENDING_APPROVAL', 'Initial status is PENDING_APPROVAL');
  assert(routineIssue.AssignedDepartmentID === 1, 'Correct department (Facilities Management) determined');

  // Verify approval workflow generated
  const routineApproval = await approvalService.getApprovalByRequestId(routineIssue.IssueRequestID);
  assert(routineApproval !== null, 'Approval workflow created for request');
  assert(routineApproval.TotalStages === 1, 'Routine request has exactly 1 approval stage');
  assert(routineApproval.ApprovalStatusCode === 'PENDING', 'Workflow status is PENDING');

  // Verify Stage 1 is Department Manager
  const stage1 = routineApproval.stages[0];
  assert(stage1.StageNumber === 1, 'Stage 1 exists');
  assert(stage1.StageStatusCode === 'PENDING', 'Stage 1 status is PENDING');

  // Attempt assignment before approval -> MUST FAIL
  let assignFailedBeforeApproval = false;
  try {
    await assignmentService.manualAssign({
      RequestID: routineIssue.IssueRequestID,
      AssignedUserID: 5,
      Remarks: 'Illegal early assignment attempt'
    }, 6);
  } catch (err) {
    assignFailedBeforeApproval = true;
    assert(err.statusCode === 400, 'Blocked early assignment before approval with HTTP 400');
  }
  assert(assignFailedBeforeApproval, 'Early assignment before approval was successfully rejected');

  // Department Manager (Helen Facility, UserID: 2) reviews & approves Stage 1
  const approvedWorkflow = await approvalService.submitDecision({
    ApprovalID: routineApproval.ApprovalID,
    DecisionCode: 'APPROVED',
    Comments: 'Department budget and scope authorized for filter cleaning'
  }, 2);

  assert(approvedWorkflow.ApprovalStatusCode === 'APPROVED', 'Approval workflow marked APPROVED after Stage 1');

  // Verify IssueRequest transitioned to APPROVED (assignable state)
  const approvedIssue = await issueRequestService.getIssueById(routineIssue.IssueRequestID);
  assert(approvedIssue.StatusCode === 'APPROVED', 'IssueRequest transitioned to APPROVED status');

  // Department Dispatcher (Ruth Alemu, UserID: 6) assigns to eligible Technician (Daniel Worku, UserID: 5)
  const assignment = await assignmentService.manualAssign({
    RequestID: routineIssue.IssueRequestID,
    AssignedUserID: 5,
    Remarks: 'Dispatched to Daniel Worku for AC filter maintenance'
  }, 6);

  assert(assignment !== null, 'Assignment created');
  assert(assignment.AssignedUserID === 5, 'Assigned to Technician UserID 5');
  assert(assignment.AssignmentStatusCode === 'ASSIGNED', 'Assignment status is ASSIGNED');

  const assignedIssue = await issueRequestService.getIssueById(routineIssue.IssueRequestID);
  assert(assignedIssue.StatusCode === 'ASSIGNED', 'IssueRequest status transitioned to ASSIGNED');

  // Technician (Daniel Worku, UserID: 5) starts work
  await assignmentService.startWork(assignment.AssignmentID, 5);
  const inProgressIssue = await issueRequestService.getIssueById(routineIssue.IssueRequestID);
  assert(inProgressIssue.StatusCode === 'IN_PROGRESS', 'IssueRequest status transitioned to IN_PROGRESS');

  // Technician completes work
  await assignmentService.completeWork(assignment.AssignmentID, {
    ResolutionTypeCode: 'PERMANENT_FIX',
    ResolutionSummary: 'Replaced AC filter in server room. Clean air intake verified.',
    ActionStepsTaken: 'Removed old filter, vacuumed duct, inserted HEPA filter.'
  }, 5);

  const resolvedIssue = await issueRequestService.getIssueById(routineIssue.IssueRequestID);
  assert(resolvedIssue.StatusCode === 'RESOLVED', 'IssueRequest status transitioned to RESOLVED');

  // Department Manager / Supervisor verifies completion and closes request
  await issueRequestService.updateStatus(routineIssue.IssueRequestID, 'CLOSED', 'Supervisor verified AC filter completion and closed ticket.', 2);
  const closedIssue = await issueRequestService.getIssueById(routineIssue.IssueRequestID);
  assert(closedIssue.StatusCode === 'CLOSED', 'IssueRequest status transitioned to CLOSED');

  console.log('\n--- TEST 2: High-Impact Request (Conditional Multi-Level Approval: Dept Manager + Park Admin) ---');
  
  // Requester submits high-impact request (CRITICAL priority, Cost: 25,000, Major Incident)
  const criticalIssue = await issueRequestService.createIssue({
    TenantID: 1,
    ServiceID: 1,
    Title: 'TEST_WORKFLOW_Critical_Transformer_Failure',
    Description: 'Main power transformer failure in Block B affecting entire facility',
    PriorityCode: 'CRITICAL',
    EstimatedCost: 25000.00,
    IsMajorIncident: 1,
    RequestSourceCode: 'TENANT',
    RequestChannelCode: 'WEB'
  }, 3);

  assert(criticalIssue.StatusCode === 'PENDING_APPROVAL', 'High-impact request initial status is PENDING_APPROVAL');

  const criticalApproval = await approvalService.getApprovalByRequestId(criticalIssue.IssueRequestID);
  assert(criticalApproval.TotalStages === 2, 'High-impact request dynamically generated 2 approval stages');
  assert(criticalApproval.CurrentStageNumber === 1, 'Currently at Stage 1');

  // Verify non-authorized user (e.g. employee UserID: 4) CANNOT approve Stage 1
  let unauthStage1Failed = false;
  try {
    await approvalService.submitDecision({
      ApprovalID: criticalApproval.ApprovalID,
      DecisionCode: 'APPROVED',
      Comments: 'Unauthorized approval attempt'
    }, 4);
  } catch (err) {
    unauthStage1Failed = true;
    assert(err.statusCode === 403, 'Unauthorized Stage 1 approval rejected with HTTP 403');
  }
  assert(unauthStage1Failed, 'Unauthorized approval blocked');

  // Department Manager (Helen Facility, UserID: 2) approves Stage 1
  const stage1Decision = await approvalService.submitDecision({
    ApprovalID: criticalApproval.ApprovalID,
    DecisionCode: 'APPROVED',
    Comments: 'Facilities department review approved. Escalating for Business Park Administrator sign-off due to high cost and critical priority.'
  }, 2);

  assert(stage1Decision.CurrentStageNumber === 2, 'Workflow advanced to Stage 2');
  assert(stage1Decision.ApprovalStatusCode === 'PENDING', 'Workflow remains PENDING for Stage 2');

  const midIssue = await issueRequestService.getIssueById(criticalIssue.IssueRequestID);
  assert(midIssue.StatusCode === 'PENDING_APPROVAL', 'IssueRequest remains in PENDING_APPROVAL while Stage 2 is pending');

  // Verify Department Manager CANNOT approve Stage 2 (requires Business Park Administrator)
  let deptMgrStage2Failed = false;
  try {
    await approvalService.submitDecision({
      ApprovalID: criticalApproval.ApprovalID,
      DecisionCode: 'APPROVED',
      Comments: 'Department manager attempting Stage 2 authorization'
    }, 2);
  } catch (err) {
    deptMgrStage2Failed = true;
    assert(err.statusCode === 403, 'Department manager blocked from Stage 2 with HTTP 403');
  }
  assert(deptMgrStage2Failed, 'Department manager cannot self-authorize Stage 2');

  // Attempt assignment while Stage 2 pending -> MUST FAIL
  let assignFailedAtStage2 = false;
  try {
    await assignmentService.manualAssign({
      RequestID: criticalIssue.IssueRequestID,
      AssignedUserID: 5,
      Remarks: 'Illegal assignment attempt during Stage 2'
    }, 6);
  } catch (err) {
    assignFailedAtStage2 = true;
    assert(err.statusCode === 400, 'Assignment blocked while Stage 2 pending with HTTP 400');
  }
  assert(assignFailedAtStage2, 'Assignment blocked during multi-level approval');

  // Business Park Administrator (Super Admin, UserID: 1) approves Stage 2
  const finalDecision = await approvalService.submitDecision({
    ApprovalID: criticalApproval.ApprovalID,
    DecisionCode: 'APPROVED',
    Comments: 'Business Park Administrator authorization granted for emergency transformer repair.'
  }, 1);

  assert(finalDecision.ApprovalStatusCode === 'APPROVED', 'Workflow marked APPROVED after Stage 2 completion');

  const finalApprovedIssue = await issueRequestService.getIssueById(criticalIssue.IssueRequestID);
  assert(finalApprovedIssue.StatusCode === 'APPROVED', 'IssueRequest transitioned to APPROVED status after full multi-level approval');

  // Test Assignment by Authorized Dispatcher to Technical Team (Team 1)
  const teamAssignment = await assignmentService.manualAssign({
    RequestID: criticalIssue.IssueRequestID,
    AssignedTeamID: 1,
    Remarks: 'Emergency power crew dispatched'
  }, 6);

  assert(teamAssignment.AssignedTeamID === 1, 'Assigned to Technical Team 1');
  const teamAssignedIssue = await issueRequestService.getIssueById(criticalIssue.IssueRequestID);
  assert(teamAssignedIssue.StatusCode === 'ASSIGNED', 'IssueRequest transitioned to ASSIGNED to technical team');

  console.log('\n--- TEST 3: Rejection Scenario ---');
  
  const rejectIssue = await issueRequestService.createIssue({
    TenantID: 1,
    ServiceID: 1,
    Title: 'TEST_WORKFLOW_Unreasonable_Expenditure',
    Description: 'Luxury lounge modification request',
    PriorityCode: 'LOW',
    EstimatedCost: 9999.00,
    RequestSourceCode: 'TENANT',
    RequestChannelCode: 'WEB'
  }, 3);

  const rejectApproval = await approvalService.getApprovalByRequestId(rejectIssue.IssueRequestID);
  
  // Department Manager rejects request
  const rejectedWorkflow = await approvalService.submitDecision({
    ApprovalID: rejectApproval.ApprovalID,
    DecisionCode: 'REJECTED',
    Comments: 'Rejected: Expenditure outside tenant lease agreement'
  }, 2);

  assert(rejectedWorkflow.ApprovalStatusCode === 'REJECTED', 'Workflow marked REJECTED');

  const cancelledIssue = await issueRequestService.getIssueById(rejectIssue.IssueRequestID);
  assert(cancelledIssue.StatusCode === 'CANCELLED', 'IssueRequest transitioned to CANCELLED upon rejection');
  assert(cancelledIssue.CancellationReason.includes('Expenditure outside tenant lease agreement'), 'Cancellation reason recorded in issue');

  console.log('\n--- TEST 4: Cross-Department Assignment & Security Validation ---');
  
  // Create an approved issue in Department 1
  const testSecIssue = await issueRequestService.createIssue({
    TenantID: 1,
    ServiceID: 1,
    Title: 'TEST_WORKFLOW_Security_Validation',
    Description: 'Testing cross-department assignment prevention',
    PriorityCode: 'LOW',
    EstimatedCost: 100.00,
    RequestSourceCode: 'EMPLOYEE',
    RequestChannelCode: 'WEB'
  }, 4);

  const testSecApproval = await approvalService.getApprovalByRequestId(testSecIssue.IssueRequestID);
  await approvalService.submitDecision({
    ApprovalID: testSecApproval.ApprovalID,
    DecisionCode: 'APPROVED',
    Comments: 'Approved for test'
  }, 2);

  // Attempt to assign a technician from Department 3/4 or a non-existent department technician
  // UserID 4 is an Employee in Department 3, not a Technician in Department 1
  let crossDeptFailed = false;
  try {
    await assignmentService.manualAssign({
      RequestID: testSecIssue.IssueRequestID,
      AssignedUserID: 4, // Marta in Dept 3
      Remarks: 'Illegal cross-department assignment'
    }, 6);
  } catch (err) {
    crossDeptFailed = true;
    assert(err.statusCode === 400, 'Cross-department assignment blocked with HTTP 400');
  }
  assert(crossDeptFailed, 'Cross-department assignment prevented');

  // Test technician rejection return to APPROVED queue
  const validAssignment = await assignmentService.manualAssign({
    RequestID: testSecIssue.IssueRequestID,
    AssignedUserID: 5,
    Remarks: 'Initial test assignment'
  }, 6);

  // Technician rejects assignment
  await assignmentService.rejectAssignment(validAssignment.AssignmentID, 'Technician on emergency leave', 5);
  const reApprovedIssue = await issueRequestService.getIssueById(testSecIssue.IssueRequestID);
  assert(reApprovedIssue.StatusCode === 'APPROVED', 'Issue returned to APPROVED state for reassignment when technician declines');

  console.log('\n================================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} WORKFLOW TESTS PASSED SUCCESSFULLY!`);
  console.log('================================================================');
  
  process.exit(0);
}

runTests().catch(err => {
  console.error('\n❌ TEST SUITE FAILED WITH ERROR:', err);
  process.exit(1);
});
