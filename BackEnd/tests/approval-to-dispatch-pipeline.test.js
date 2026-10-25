import assert from 'node:assert/strict';
import { query } from '../src/database/connection.js';
import issueRequestService from '../src/modules/issue-management/services/issue-request.service.js';
import approvalService from '../src/modules/approval/services/approval.service.js';
import assignmentService from '../src/modules/dispatch/services/assignment.service.js';
import assignmentRepository from '../src/modules/dispatch/repositories/assignment.repository.js';
import approvalRepository from '../src/modules/approval/repositories/approval.repository.js';

async function runTests() {
  console.log('====================================================');
  console.log('APPROVAL-TO-DISPATCH PIPELINE VALIDATION TEST SUITE');
  console.log('====================================================');

  const timestamp = Date.now();
  const requesterUserId = 4; // Marta Tesfaye (Employee)
  const deptManagerUserId = 2; // Helen Facility (Manager of Dept 1 - Facilities Management)
  const parkAdminUserId = 1; // System Super Admin
  const techUserId = 5; // Daniel Worku (Technician in Dept 1)

  const createdIssueIds = [];

  try {
    // -------------------------------------------------------------------------
    // SCENARIO 1: Routine Issue (Single-Stage Approval -> Dispatch Queue -> Manual Assignment)
    // -------------------------------------------------------------------------
    console.log('\n[TEST 1] Requester submits routine issue request');
    const routineIssue = await issueRequestService.createIssue({
      Title: `Routine AC Filter Replacement ${timestamp}`,
      Description: 'Routine air conditioning filter maintenance in Wing B.',
      PriorityCode: 'MEDIUM',
      RequestTypeCode: 'MAINTENANCE',
      CategoryCode: 'FACILITY-HVAC',
      AssignedDepartmentID: 1,
      RequesterUserID: requesterUserId,
      EstimatedCost: 500
    }, requesterUserId);

    createdIssueIds.push(routineIssue.IssueRequestID);
    assert.equal(routineIssue.StatusCode, 'PENDING_APPROVAL');
    console.log(`✓ PASS: Request '${routineIssue.RequestNumber}' submitted with initial status 'PENDING_APPROVAL'`);

    // Verify approval workflow created
    const routineApproval = await approvalRepository.findByRequestId(routineIssue.IssueRequestID);
    assert.ok(routineApproval, 'Approval workflow must be created');
    assert.equal(routineApproval.TotalStages, 1, 'Routine request must have 1 stage');
    assert.equal(routineApproval.CurrentStageNumber, 1);
    console.log(`✓ PASS: Single-stage approval workflow created (ApprovalID: ${routineApproval.ApprovalID})`);

    // Verify issue is NOT in unassigned dispatch queue while pending approval
    console.log('\n[TEST 2] Verify pending issue does NOT display in unassigned dispatch queue');
    const queueBeforeApproval = await assignmentService.getUnassignedQueue({
      departmentId: 1
    }, deptManagerUserId);
    const inQueueBefore = queueBeforeApproval.requests.some(
      (r) => r.IssueRequestID === routineIssue.IssueRequestID
    );
    assert.equal(inQueueBefore, false, 'Pending request must not appear in dispatch queue');
    console.log('✓ PASS: Request is correctly withheld from unassigned dispatch queue while pending approval');

    // Verify assignment rejected while PENDING_APPROVAL
    console.log('\n[TEST 3] Verify manual assignment is blocked while request is pending approval');
    await assert.rejects(
      async () => {
        await assignmentService.manualAssign({
          RequestID: routineIssue.IssueRequestID,
          AssignedUserID: techUserId,
          Remarks: 'Premature assignment attempt'
        }, deptManagerUserId);
      },
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /cannot be assigned while in 'PENDING_APPROVAL' status/);
        return true;
      }
    );
    console.log('✓ PASS: Assignment correctly rejected with 400 when status is not approved');

    // Stage 1 Approval by Department Manager
    console.log('\n[TEST 4] Department Manager approves routine issue request');
    await approvalService.submitDecision({
      ApprovalID: routineApproval.ApprovalID,
      DecisionCode: 'APPROVED',
      Comments: 'Approved by Facilities Manager for maintenance dispatch.'
    }, deptManagerUserId);

    // Verify IssueRequest status transitioned to APPROVED
    const [approvedIssue] = await query(
      `SELECT StatusCode FROM IssueRequest WHERE IssueRequestID = ?`,
      [routineIssue.IssueRequestID]
    );
    assert.equal(approvedIssue.StatusCode, 'APPROVED', 'Issue status must transition to APPROVED upon final approval');
    console.log(`✓ PASS: IssueRequest StatusCode successfully transitioned to 'APPROVED'`);

    // Verify issue now IMMEDIATELY appears in unassigned dispatch queue
    console.log('\n[TEST 5] Verify approved issue appears automatically in unassigned dispatch queue');
    const queueAfterApproval = await assignmentService.getUnassignedQueue({
      departmentId: 1
    }, deptManagerUserId);
    const foundInQueue = queueAfterApproval.requests.find(
      (r) => r.IssueRequestID === routineIssue.IssueRequestID
    );
    assert.ok(foundInQueue, 'Approved request must display in unassigned dispatch queue');
    assert.equal(foundInQueue.StatusCode, 'APPROVED');
    assert.equal(foundInQueue.AssignedDepartmentID, 1);
    console.log(`✓ PASS: Request '${foundInQueue.RequestNumber}' is now visible in dispatch queue with status 'APPROVED'`);

    // Verify overview metrics count updated
    console.log('\n[TEST 6] Verify overview metrics reflect unassigned count');
    const metrics = await assignmentService.getOverviewMetrics(null, deptManagerUserId);
    assert.ok(metrics.unassignedCount >= 1, 'Unassigned count must be >= 1');
    console.log(`✓ PASS: Department metrics unassignedCount reflects pending dispatch tickets (count: ${metrics.unassignedCount})`);

    // Manual Assignment to Technician
    console.log('\n[TEST 7] Department Manager manually dispatches issue to technician');
    const assignmentResult = await assignmentService.manualAssign({
      RequestID: routineIssue.IssueRequestID,
      AssignedUserID: techUserId,
      Remarks: 'Dispatched to primary facilities technician'
    }, deptManagerUserId);

    assert.ok(assignmentResult, 'Assignment must be created');
    assert.equal(assignmentResult.AssignmentStatusCode, 'ASSIGNED');
    assert.equal(assignmentResult.AssignedUserID, techUserId);

    // Verify issue status is now ASSIGNED
    const [assignedIssue] = await query(
      `SELECT StatusCode FROM IssueRequest WHERE IssueRequestID = ?`,
      [routineIssue.IssueRequestID]
    );
    assert.equal(assignedIssue.StatusCode, 'ASSIGNED');
    console.log(`✓ PASS: Request '${routineIssue.RequestNumber}' status successfully transitioned to 'ASSIGNED'`);

    // Verify issue removed from unassigned queue
    console.log('\n[TEST 8] Verify assigned request is removed from unassigned dispatch queue');
    const queueAfterAssign = await assignmentService.getUnassignedQueue({
      departmentId: 1
    }, deptManagerUserId);
    const stillInQueue = queueAfterAssign.requests.some(
      (r) => r.IssueRequestID === routineIssue.IssueRequestID
    );
    assert.equal(stillInQueue, false, 'Assigned request must no longer appear in unassigned queue');
    console.log('✓ PASS: Request cleanly removed from unassigned queue upon successful assignment');

    // -------------------------------------------------------------------------
    // SCENARIO 2: Multi-Level Approval (CRITICAL / High Priority -> Dept Manager -> Park Admin -> Auto-Assign)
    // -------------------------------------------------------------------------
    console.log('\n[TEST 9] Requester submits high-impact CRITICAL request requiring multi-level approval');
    const criticalIssue = await issueRequestService.createIssue({
      Title: `Critical Main Power Transformer Surge ${timestamp}`,
      Description: 'Main electrical transformer malfunction causing campus brownout.',
      PriorityCode: 'CRITICAL',
      RequestTypeCode: 'INCIDENT',
      IsMajorIncident: 1,
      CategoryCode: 'POWER-INFRA',
      AssignedDepartmentID: 1,
      RequesterUserID: requesterUserId,
      EstimatedCost: 75000
    }, requesterUserId);

    createdIssueIds.push(criticalIssue.IssueRequestID);
    assert.equal(criticalIssue.StatusCode, 'PENDING_APPROVAL');

    const multiApproval = await approvalRepository.findByRequestId(criticalIssue.IssueRequestID);
    assert.ok(multiApproval);
    assert.equal(multiApproval.TotalStages, 2, 'Critical / high-cost request must have 2 stages');
    assert.equal(multiApproval.CurrentStageNumber, 1, 'Initial stage must be Stage 1');
    console.log(`✓ PASS: 2-stage multi-level approval workflow created for Critical request (ApprovalID: ${multiApproval.ApprovalID})`);

    // Verify not in dispatch queue at Stage 1
    console.log('\n[TEST 10] Verify multi-level request is withheld from dispatch queue at Stage 1');
    const queueStage1 = await assignmentService.getUnassignedQueue({ departmentId: 1 }, deptManagerUserId);
    assert.equal(queueStage1.requests.some((r) => r.IssueRequestID === criticalIssue.IssueRequestID), false);
    console.log('✓ PASS: Request not visible in dispatch queue prior to Stage 1 approval');

    // Stage 1 Approval by Department Manager
    console.log('\n[TEST 11] Stage 1: Department Manager approves request');
    await approvalService.submitDecision({
      ApprovalID: multiApproval.ApprovalID,
      DecisionCode: 'APPROVED',
      Comments: 'Department review complete. Escalated to Park Admin for final authorization.'
    }, deptManagerUserId);

    // Verify advanced to Stage 2
    const updatedApproval = await approvalRepository.findById(multiApproval.ApprovalID);
    assert.equal(updatedApproval.CurrentStageNumber, 2, 'Approval must advance to Stage 2');
    assert.equal(updatedApproval.ApprovalStatusCode, 'PENDING', 'Workflow remains PENDING until final stage');

    // Verify issue status REMAINS PENDING_APPROVAL and NOT in dispatch queue
    const [issueAfterStage1] = await query(
      `SELECT StatusCode FROM IssueRequest WHERE IssueRequestID = ?`,
      [criticalIssue.IssueRequestID]
    );
    assert.equal(issueAfterStage1.StatusCode, 'PENDING_APPROVAL');

    const queueStage2Pending = await assignmentService.getUnassignedQueue({ departmentId: 1 }, deptManagerUserId);
    assert.equal(
      queueStage2Pending.requests.some((r) => r.IssueRequestID === criticalIssue.IssueRequestID),
      false,
      'Request must not be in dispatch queue while awaiting Stage 2 authorization'
    );
    console.log('✓ PASS: Request advanced to Stage 2 (Park Administrator) and correctly withheld from dispatch queue');

    // Stage 2 Approval by Park Administrator
    console.log('\n[TEST 12] Stage 2: Business Park Administrator grants final approval');
    await approvalService.submitDecision({
      ApprovalID: multiApproval.ApprovalID,
      DecisionCode: 'APPROVED',
      Comments: 'Park Administrator budget and infrastructure sign-off granted.'
    }, parkAdminUserId);

    // Verify workflow completed and issue status is APPROVED
    const finalApproval = await approvalRepository.findById(multiApproval.ApprovalID);
    assert.equal(finalApproval.ApprovalStatusCode, 'APPROVED', 'Approval workflow must be APPROVED');

    const [issueAfterStage2] = await query(
      `SELECT StatusCode FROM IssueRequest WHERE IssueRequestID = ?`,
      [criticalIssue.IssueRequestID]
    );
    assert.equal(issueAfterStage2.StatusCode, 'APPROVED', 'IssueRequest StatusCode must be APPROVED');
    console.log(`✓ PASS: Final Stage 2 completed. IssueRequest StatusCode is 'APPROVED'`);

    // Verify issue now IMMEDIATELY appears in unassigned dispatch queue
    console.log('\n[TEST 13] Verify fully approved critical request is immediately present in dispatch queue');
    const queueFullyApproved = await assignmentService.getUnassignedQueue({ departmentId: 1 }, deptManagerUserId);
    const criticalInQueue = queueFullyApproved.requests.find(
      (r) => r.IssueRequestID === criticalIssue.IssueRequestID
    );
    assert.ok(criticalInQueue, 'Fully approved critical request must appear in dispatch queue');
    assert.equal(criticalInQueue.PriorityCode, 'CRITICAL');
    assert.equal(criticalInQueue.StatusCode, 'APPROVED');
    console.log(`✓ PASS: Critical request '${criticalInQueue.RequestNumber}' is active in unassigned queue awaiting dispatch`);

    // Automatic Dispatch
    console.log('\n[TEST 14] Automatic Dispatch: System auto-routes approved request to lowest-workload technician');
    const autoDispatchResult = await assignmentService.autoAssign(criticalIssue.IssueRequestID, deptManagerUserId);
    assert.ok(autoDispatchResult);
    assert.equal(autoDispatchResult.AssignmentStatusCode, 'ASSIGNED');
    assert.ok(autoDispatchResult.AssignedUserID, 'Technician must be selected');

    const [autoAssignedIssue] = await query(
      `SELECT StatusCode FROM IssueRequest WHERE IssueRequestID = ?`,
      [criticalIssue.IssueRequestID]
    );
    assert.equal(autoAssignedIssue.StatusCode, 'ASSIGNED');
    console.log(`✓ PASS: Auto-assign successfully routed request to Technician #${autoDispatchResult.AssignedUserID} and status is 'ASSIGNED'`);

    // Verify removed from queue
    const queueAfterAuto = await assignmentService.getUnassignedQueue({ departmentId: 1 }, deptManagerUserId);
    assert.equal(
      queueAfterAuto.requests.some((r) => r.IssueRequestID === criticalIssue.IssueRequestID),
      false
    );
    console.log('✓ PASS: Auto-dispatched request removed from unassigned queue');

    // -------------------------------------------------------------------------
    // SCENARIO 3: Cross-Department Security & Guardrails
    // -------------------------------------------------------------------------
    console.log('\n[TEST 15] Assigner Guardrail: Reject assignment if technician belongs to different department');
    const foreignIssue = await issueRequestService.createIssue({
      Title: `Operations Dept Test Ticket ${timestamp}`,
      Description: 'Operations department specific issue',
      PriorityCode: 'LOW',
      AssignedDepartmentID: 3, // Operations (Dept 3)
      RequesterUserID: requesterUserId
    }, requesterUserId);
    createdIssueIds.push(foreignIssue.IssueRequestID);

    // Direct approve for test
    const foreignApproval = await approvalRepository.findByRequestId(foreignIssue.IssueRequestID);
    await approvalService.submitDecision({
      ApprovalID: foreignApproval.ApprovalID,
      DecisionCode: 'APPROVED',
      Comments: 'Approved'
    }, parkAdminUserId);

    // Try assigning Facilities technician (Dept 1) to an Operations request (Dept 3)
    await assert.rejects(
      async () => {
        await assignmentService.manualAssign({
          RequestID: foreignIssue.IssueRequestID,
          AssignedUserID: techUserId, // Tech 5 is in Dept 1
          Remarks: 'Cross-dept test'
        }, parkAdminUserId);
      },
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /Cross-department technician assignment is prohibited/);
        return true;
      }
    );
    console.log('✓ PASS: Cross-department technician assignment properly blocked with 400 error');

    console.log('\n====================================================');
    console.log('🎉 ALL 15 APPROVAL-TO-DISPATCH PIPELINE TESTS PASSED!');
    console.log('====================================================\n');

  } finally {
    // Cleanup created test records
    console.log('Cleaning up test records...');
    if (createdIssueIds.length > 0) {
      const placeholders = createdIssueIds.map(() => '?').join(',');
      await query(`DELETE FROM AssignmentHistory WHERE AssignmentID IN (SELECT AssignmentID FROM Assignment WHERE RequestID IN (${placeholders}))`, createdIssueIds);
      await query(`DELETE FROM Assignment WHERE RequestID IN (${placeholders})`, createdIssueIds);
      await query(`DELETE FROM ApprovalHistory WHERE ApprovalID IN (SELECT ApprovalID FROM Approval WHERE RequestID IN (${placeholders}))`, createdIssueIds);
      await query(`DELETE FROM ApprovalDecision WHERE ApprovalStageID IN (SELECT ApprovalStageID FROM ApprovalStage WHERE ApprovalID IN (SELECT ApprovalID FROM Approval WHERE RequestID IN (${placeholders})))`, createdIssueIds);
      await query(`DELETE FROM ApprovalStage WHERE ApprovalID IN (SELECT ApprovalID FROM Approval WHERE RequestID IN (${placeholders}))`, createdIssueIds);
      await query(`DELETE FROM Approval WHERE RequestID IN (${placeholders})`, createdIssueIds);
      await query(`DELETE FROM SLAHistory WHERE SLAClockID IN (SELECT SLAClockID FROM SLAClock WHERE IssueRequestID IN (${placeholders}))`, createdIssueIds);
      await query(`DELETE FROM SLAClock WHERE IssueRequestID IN (${placeholders})`, createdIssueIds);
      await query(`DELETE FROM IssueRequestHistory WHERE IssueRequestID IN (${placeholders})`, createdIssueIds);
      await query(`DELETE FROM IssueRequest WHERE IssueRequestID IN (${placeholders})`, createdIssueIds);
    }
    console.log('Cleanup complete.');
  }
}

runTests().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
