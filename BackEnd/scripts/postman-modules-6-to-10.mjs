import { reqItem } from './postman-builder-helpers.mjs';

export function getModules6To10() {
  return [
    // ═════════════════════════════════════════════════════════════════
    // MODULE 6: SERVICE CATALOG & CATEGORY MAPPINGS (18 endpoints)
    // ═════════════════════════════════════════════════════════════════
    {
      name: '6. Service Catalog & Categories',
      item: [
        {
          name: '6.1 Service Categories',
          item: [
            reqItem({ name: 'List Service Categories', method: 'GET', url: 'http://localhost:5000/api/service-categories' }),
            reqItem({ name: 'Get Service Category by ID', method: 'GET', url: 'http://localhost:5000/api/service-categories/:id' }),
            reqItem({
              name: 'Create Service Category',
              method: 'POST',
              url: 'http://localhost:5000/api/service-categories',
              body: {
                CategoryCode: 'CAT_HVAC',
                CategoryName: 'HVAC & Climate Control',
                Description: 'Heating, ventilation, air conditioning and chiller plant systems',
                DefaultPriority: 'HIGH',
                DefaultSLAHours: 4,
                IsActive: 1
              }
            }),
            reqItem({
              name: 'Update Service Category',
              method: 'PUT',
              url: 'http://localhost:5000/api/service-categories/:id',
              body: {
                CategoryName: 'HVAC & Environmental Control',
                DefaultPriority: 'HIGH',
                DefaultSLAHours: 4,
                IsActive: 1
              }
            }),
            reqItem({ name: 'Delete Service Category', method: 'DELETE', url: 'http://localhost:5000/api/service-categories/:id' })
          ]
        },
        {
          name: '6.2 Services & Analytics',
          item: [
            reqItem({ name: 'List Services', method: 'GET', url: 'http://localhost:5000/api/services' }),
            reqItem({ name: 'Get Services Overview Metrics', method: 'GET', url: 'http://localhost:5000/api/services/metrics' }),
            reqItem({ name: 'Get Service by ID', method: 'GET', url: 'http://localhost:5000/api/services/:id' }),
            reqItem({
              name: 'Create Service',
              method: 'POST',
              url: 'http://localhost:5000/api/services',
              body: {
                CategoryID: 1,
                ServiceCode: 'SRV_CHILLER_REPAIR',
                ServiceName: 'Commercial Chiller Overhaul & Coolant Flush',
                Description: 'Heavy mechanical repair and coolant replacement for central chillers',
                EstimatedDurationMinutes: 180,
                BasePrice: 2500.0,
                CurrencyCode: 'ETB',
                RequiresApproval: 1,
                IsActive: 1
              }
            }),
            reqItem({
              name: 'Update Service',
              method: 'PUT',
              url: 'http://localhost:5000/api/services/:id',
              body: {
                ServiceName: 'Commercial Chiller Overhaul & Certified Refill',
                EstimatedDurationMinutes: 240,
                BasePrice: 3200.0,
                IsActive: 1
              }
            }),
            reqItem({ name: 'Delete Service', method: 'DELETE', url: 'http://localhost:5000/api/services/:id' }),
            reqItem({ name: 'Get Service Analytics Metrics', method: 'GET', url: 'http://localhost:5000/api/service-analytics/metrics' })
          ]
        },
        {
          name: '6.3 Category Department Mappings',
          item: [
            reqItem({ name: 'List Category Mappings', method: 'GET', url: 'http://localhost:5000/api/category-mappings' }),
            reqItem({ name: 'Get Category Mapping by ID', method: 'GET', url: 'http://localhost:5000/api/category-mappings/:id' }),
            reqItem({
              name: 'Create Category Mapping',
              method: 'POST',
              url: 'http://localhost:5000/api/category-mappings',
              body: {
                CategoryID: 1,
                DepartmentID: 1,
                DefaultTeamID: 1,
                AutoAssignEnabled: 1,
                PriorityOverride: 'HIGH',
                IsActive: 1
              }
            }),
            reqItem({
              name: 'Update Category Mapping',
              method: 'PUT',
              url: 'http://localhost:5000/api/category-mappings/:id',
              body: {
                AutoAssignEnabled: 1,
                PriorityOverride: 'CRITICAL',
                IsActive: 1
              }
            }),
            reqItem({
              name: 'Patch Category Mapping Status',
              method: 'PATCH',
              url: 'http://localhost:5000/api/category-mappings/:id/status',
              body: { status: 'ACTIVE' }
            }),
            reqItem({ name: 'Delete Category Mapping', method: 'DELETE', url: 'http://localhost:5000/api/category-mappings/:id' })
          ]
        }
      ]
    },

    // ═════════════════════════════════════════════════════════════════
    // MODULE 7: ISSUE REQUESTS & TICKET LIFECYCLE (21 endpoints)
    // ═════════════════════════════════════════════════════════════════
    {
      name: '7. Issue Requests & Lifecycle',
      item: [
        {
          name: '7.1 Issue Requests & Lifecycle Operations',
          item: [
            reqItem({ name: 'List Issue Requests', method: 'GET', url: 'http://localhost:5000/api/issues' }),
            reqItem({ name: 'Get Issue Requests Metrics & Counts', method: 'GET', url: 'http://localhost:5000/api/issues/metrics' }),
            reqItem({ name: 'Get Issue Request by ID', method: 'GET', url: 'http://localhost:5000/api/issues/:id' }),
            reqItem({
              name: 'Create Issue Request',
              method: 'POST',
              url: 'http://localhost:5000/api/issues',
              body: {
                ParkID: 1,
                BuildingID: 1,
                FloorID: 1,
                OfficeID: 1,
                TenantID: 1,
                CategoryID: 1,
                ServiceID: 1,
                Title: 'Server Room Air Handler Water Leakage',
                Description: 'Continuous water drip from primary air handling unit ceiling tile above rack 04',
                Priority: 'CRITICAL',
                LocationDescription: 'Rack Row B, Unit 4 Ceiling Grid',
                ContactPhone: '+251911223344'
              }
            }),
            reqItem({
              name: 'Update Issue Request',
              method: 'PUT',
              url: 'http://localhost:5000/api/issues/:id',
              body: {
                Title: 'Server Room Air Handler Major Coolant Drip',
                Priority: 'CRITICAL',
                LocationDescription: 'Rack Row B, Unit 4 Main Plenum'
              }
            }),
            reqItem({
              name: 'Assign Issue to Technician / Team',
              method: 'POST',
              url: 'http://localhost:5000/api/issues/:id/assign',
              body: {
                assignedToUserId: 1,
                teamId: 1,
                assignmentNotes: 'Immediate dispatch required due to critical server equipment proximity'
              }
            }),
            reqItem({
              name: 'Update Issue Status',
              method: 'POST',
              url: 'http://localhost:5000/api/issues/:id/status',
              body: {
                status: 'IN_PROGRESS',
                statusNotes: 'Technician on-site and isolating chiller valves'
              }
            }),
            reqItem({
              name: 'Cancel Issue Request',
              method: 'POST',
              url: 'http://localhost:5000/api/issues/:id/cancel',
              body: {
                cancellationReason: 'Duplicate ticket logged by assistant facilities officer'
              }
            }),
            reqItem({
              name: 'Reopen Issue Request',
              method: 'POST',
              url: 'http://localhost:5000/api/issues/:id/reopen',
              body: {
                reopenReason: 'Water seepage recurred 2 hours after initial valve repair'
              }
            }),
            reqItem({
              name: 'Submit Issue Feedback & CSAT',
              method: 'POST',
              url: 'http://localhost:5000/api/issues/:id/feedback',
              body: {
                rating: 5,
                comment: 'Rapid response time and professional clean-up of the server room.'
              }
            }),
            reqItem({ name: 'Get Issue Feedback & CSAT', method: 'GET', url: 'http://localhost:5000/api/issues/:id/feedback' }),
            reqItem({ name: 'Delete Issue Request', method: 'DELETE', url: 'http://localhost:5000/api/issues/:id' })
          ]
        },
        {
          name: '7.2 Technical Investigations',
          item: [
            reqItem({ name: 'Get Investigations for Issue', method: 'GET', url: 'http://localhost:5000/api/issue-investigations/issue/:issueRequestId' }),
            reqItem({
              name: 'Create Technical Investigation Entry',
              method: 'POST',
              url: 'http://localhost:5000/api/issue-investigations',
              body: {
                IssueRequestID: 1,
                InvestigatedByUserID: 1,
                RootCause: 'Secondary condensate drain line blockage caused overflow onto ceiling panel',
                PreventiveMeasures: 'Install automated water sensor and clean bi-monthly with algaecide tablets',
                FindingsSummary: 'No structural damage to equipment. Ceiling tile replaced.'
              }
            }),
            reqItem({ name: 'Delete Investigation Entry', method: 'DELETE', url: 'http://localhost:5000/api/issue-investigations/:id' })
          ]
        },
        {
          name: '7.3 Issue Resolutions',
          item: [
            reqItem({ name: 'Get Resolutions for Issue', method: 'GET', url: 'http://localhost:5000/api/issue-resolutions/issue/:issueRequestId' }),
            reqItem({
              name: 'Create Issue Resolution Record',
              method: 'POST',
              url: 'http://localhost:5000/api/issue-resolutions',
              body: {
                IssueRequestID: 1,
                ResolvedByUserID: 1,
                ResolutionSummary: 'Cleared condensate blockage with CO2 drain gun and replaced PVC trap',
                PartsUsed: '1x 3/4-inch PVC P-Trap, 2x PVC Couplers',
                LaborHours: 1.5,
                TotalCost: 350.0
              }
            }),
            reqItem({ name: 'Delete Resolution Record', method: 'DELETE', url: 'http://localhost:5000/api/issue-resolutions/:id' })
          ]
        },
        {
          name: '7.4 Issue Comments',
          item: [
            reqItem({ name: 'Get Comments for Issue', method: 'GET', url: 'http://localhost:5000/api/issue-comments/issue/:issueRequestId' }),
            reqItem({
              name: 'Create Issue Comment',
              method: 'POST',
              url: 'http://localhost:5000/api/issue-comments',
              body: {
                IssueRequestID: 1,
                CommentText: 'HVAC parts ordered from local distributor. ETA 30 minutes.',
                IsInternalOnly: 0
              }
            }),
            reqItem({ name: 'Delete Issue Comment', method: 'DELETE', url: 'http://localhost:5000/api/issue-comments/:id' })
          ]
        }
      ]
    },

    // ═════════════════════════════════════════════════════════════════
    // MODULE 8: APPROVAL WORKFLOWS & MANAGERIAL DECISIONS (25 endpoints)
    // ═════════════════════════════════════════════════════════════════
    {
      name: '8. Approval Workflows & Governance',
      item: [
        {
          name: '8.1 Approvals Lifecycle & Decisions',
          item: [
            reqItem({ name: 'List All Approval Requests', method: 'GET', url: 'http://localhost:5000/api/approvals' }),
            reqItem({ name: 'Get Approvals Executive Metrics', method: 'GET', url: 'http://localhost:5000/api/approvals/metrics' }),
            reqItem({ name: 'List Pending Approvals for Current User', method: 'GET', url: 'http://localhost:5000/api/approvals/pending' }),
            reqItem({ name: 'Get Approvals by Issue Request ID', method: 'GET', url: 'http://localhost:5000/api/approvals/by-request/:requestId' }),
            reqItem({ name: 'Get Approval Request by ID', method: 'GET', url: 'http://localhost:5000/api/approvals/:id' }),
            reqItem({
              name: 'Create Approval Request',
              method: 'POST',
              url: 'http://localhost:5000/api/approvals',
              body: {
                IssueRequestID: 1,
                RuleID: 1,
                ApprovalType: 'FINANCIAL',
                Amount: 4500.0,
                Reason: 'Compressor replacement exceeds routine maintenance threshold'
              }
            }),
            reqItem({
              name: 'Submit Managerial Approval Decision',
              method: 'POST',
              url: 'http://localhost:5000/api/approvals/decision',
              body: {
                approvalId: 1,
                decision: 'APPROVED',
                decisionNotes: 'Approved based on critical impact to tenant server uptime'
              }
            })
          ]
        },
        {
          name: '8.2 Approval Delegations',
          item: [
            reqItem({ name: 'List Approval Delegations', method: 'GET', url: 'http://localhost:5000/api/approval-delegations' }),
            reqItem({ name: 'Get Approval Delegation by ID', method: 'GET', url: 'http://localhost:5000/api/approval-delegations/:id' }),
            reqItem({
              name: 'Create Approval Delegation',
              method: 'POST',
              url: 'http://localhost:5000/api/approval-delegations',
              body: {
                DelegatorUserID: 1,
                DelegateUserID: 2,
                StartDate: '2026-11-01',
                EndDate: '2026-11-15',
                Reason: 'Annual operational leave delegation',
                IsActive: 1
              }
            }),
            reqItem({
              name: 'Update Approval Delegation',
              method: 'PUT',
              url: 'http://localhost:5000/api/approval-delegations/:id',
              body: {
                EndDate: '2026-11-20',
                Reason: 'Extended leave delegation',
                IsActive: 1
              }
            }),
            reqItem({ name: 'Delete Approval Delegation', method: 'DELETE', url: 'http://localhost:5000/api/approval-delegations/:id' })
          ]
        },
        {
          name: '8.3 Approval Rules & Thresholds',
          item: [
            reqItem({ name: 'List Approval Rules', method: 'GET', url: 'http://localhost:5000/api/approval-rules' }),
            reqItem({ name: 'List Financial Approval Thresholds', method: 'GET', url: 'http://localhost:5000/api/approval-rules/thresholds' }),
            reqItem({ name: 'Get Approval Rule by ID', method: 'GET', url: 'http://localhost:5000/api/approval-rules/:id' }),
            reqItem({
              name: 'Create Financial Approval Threshold',
              method: 'POST',
              url: 'http://localhost:5000/api/approval-rules/thresholds',
              body: {
                RoleID: 1,
                MaxApprovalLimit: 25000.0,
                CurrencyCode: 'ETB',
                RequiresDoubleApproval: 0
              }
            }),
            reqItem({
              name: 'Create Approval Rule',
              method: 'POST',
              url: 'http://localhost:5000/api/approval-rules',
              body: {
                RuleCode: 'RULE_EMERGENCY_HVAC',
                RuleName: 'HVAC Emergency Capital Approval',
                ApprovalType: 'EMERGENCY',
                ThresholdAmount: 5000.0,
                ApprovalGroupID: 1,
                IsActive: 1
              }
            }),
            reqItem({
              name: 'Update Approval Rule',
              method: 'PUT',
              url: 'http://localhost:5000/api/approval-rules/:id',
              body: {
                RuleName: 'HVAC Emergency Capital Approval (Updated)',
                ThresholdAmount: 7500.0,
                IsActive: 1
              }
            }),
            reqItem({ name: 'Delete Approval Rule', method: 'DELETE', url: 'http://localhost:5000/api/approval-rules/:id' })
          ]
        },
        {
          name: '8.4 Approval Groups & Members',
          item: [
            reqItem({ name: 'List Approval Groups', method: 'GET', url: 'http://localhost:5000/api/approval-groups' }),
            reqItem({ name: 'Get Approval Group by ID', method: 'GET', url: 'http://localhost:5000/api/approval-groups/:id' }),
            reqItem({
              name: 'Create Approval Group',
              method: 'POST',
              url: 'http://localhost:5000/api/approval-groups',
              body: {
                GroupCode: 'GRP_CAPEX_REVIEW',
                GroupName: 'Capital Expenditure Committee',
                Description: 'Committee reviewing facilities expenditures > 20,000 ETB',
                MinApprovalsRequired: 2,
                IsActive: 1
              }
            }),
            reqItem({
              name: 'Update Approval Group',
              method: 'PUT',
              url: 'http://localhost:5000/api/approval-groups/:id',
              body: {
                GroupName: 'Capital Expenditure Review Board',
                MinApprovalsRequired: 2,
                IsActive: 1
              }
            }),
            reqItem({
              name: 'Add Member to Approval Group',
              method: 'POST',
              url: 'http://localhost:5000/api/approval-groups/:id/members',
              body: {
                UserID: 1,
                ApprovalOrder: 1,
                IsMandatory: 1
              }
            }),
            reqItem({ name: 'Remove Member from Approval Group', method: 'DELETE', url: 'http://localhost:5000/api/approval-groups/:id/members/:userId' })
          ]
        }
      ]
    },

    // ═════════════════════════════════════════════════════════════════
    // MODULE 9: TECHNICIAN ASSIGNMENT & DISPATCH WORKBENCH (18 endpoints)
    // ═════════════════════════════════════════════════════════════════
    {
      name: '9. Technician Assignment & Dispatch',
      item: [
        {
          name: '9.1 Dispatch Queue & Assignment Operations',
          item: [
            reqItem({ name: 'Get Dispatch Queue Overview Metrics', method: 'GET', url: 'http://localhost:5000/api/dispatch/overview' }),
            reqItem({ name: 'List Unassigned Issues in Queue', method: 'GET', url: 'http://localhost:5000/api/dispatch/unassigned' }),
            reqItem({ name: 'List Active Dispatch Assignments', method: 'GET', url: 'http://localhost:5000/api/dispatch/assignments' }),
            reqItem({ name: 'Get Dispatch Assignment by ID', method: 'GET', url: 'http://localhost:5000/api/dispatch/assignments/:id' }),
            reqItem({
              name: 'Manual Issue Dispatch Assignment',
              method: 'POST',
              url: 'http://localhost:5000/api/dispatch/assign/manual',
              body: {
                issueRequestId: 1,
                technicianUserId: 1,
                teamId: 1,
                priority: 'HIGH',
                instructions: 'Report directly to Building A security office before proceeding to roof'
              }
            }),
            reqItem({
              name: 'Auto Issue Dispatch (AI/Rule-Based Engine)',
              method: 'POST',
              url: 'http://localhost:5000/api/dispatch/assign/auto',
              body: {
                issueRequestId: 1,
                considerLocationProximity: true,
                considerWorkloadBalance: true
              }
            })
          ]
        },
        {
          name: '9.2 Assignment Lifecycle',
          item: [
            reqItem({
              name: 'Accept Dispatch Assignment (Technician)',
              method: 'POST',
              url: 'http://localhost:5000/api/dispatch/assignments/:id/accept',
              body: { estimatedArrivalTime: '2026-10-25T11:00:00Z' }
            }),
            reqItem({
              name: 'Reject Dispatch Assignment',
              method: 'POST',
              url: 'http://localhost:5000/api/dispatch/assignments/:id/reject',
              body: { rejectionReason: 'Engaged in emergency elevator entrapment resolution' }
            }),
            reqItem({
              name: 'Start Work on Assignment',
              method: 'POST',
              url: 'http://localhost:5000/api/dispatch/assignments/:id/start',
              body: { notes: 'Clocking in on site; beginning safety isolation check' }
            }),
            reqItem({
              name: 'Pause Assignment (Wait for Parts / Vendor)',
              method: 'POST',
              url: 'http://localhost:5000/api/dispatch/assignments/:id/pause',
              body: { pauseReason: 'WAITING_FOR_PARTS', notes: 'Replacement gasket is in transit from central warehouse' }
            }),
            reqItem({
              name: 'Resume Paused Assignment',
              method: 'POST',
              url: 'http://localhost:5000/api/dispatch/assignments/:id/resume',
              body: { notes: 'Parts received on-site; work resumed' }
            }),
            reqItem({
              name: 'Record Work Progress Milestone',
              method: 'POST',
              url: 'http://localhost:5000/api/dispatch/assignments/:id/progress',
              body: { percentComplete: 75, progressNotes: 'Replaced piping joints; pressure testing underway' }
            }),
            reqItem({
              name: 'Complete Assignment',
              method: 'POST',
              url: 'http://localhost:5000/api/dispatch/assignments/:id/complete',
              body: { resolutionSummary: 'Installed replacement seal; system tested at full pressure with zero leakage.', hoursSpent: 2.5 }
            }),
            reqItem({
              name: 'Escalate Assignment to Specialist / Supervisor',
              method: 'POST',
              url: 'http://localhost:5000/api/dispatch/assignments/:id/escalate',
              body: { escalationReason: 'Compressor motor windings burnt out; requires senior electrical engineer' }
            })
          ]
        },
        {
          name: '9.3 Technician Workbench & Telemetry',
          item: [
            reqItem({ name: 'Get Personal Technician Workbench', method: 'GET', url: 'http://localhost:5000/api/dispatch/my-workbench' }),
            reqItem({ name: 'List Active Technicians & Status', method: 'GET', url: 'http://localhost:5000/api/dispatch/technicians' }),
            reqItem({
              name: 'Update Technician Availability Status',
              method: 'POST',
              url: 'http://localhost:5000/api/dispatch/technicians/availability',
              body: { availabilityStatus: 'AVAILABLE', shiftStatus: 'ON_DUTY' }
            }),
            reqItem({
              name: 'Update Technician Live Location (GPS Telemetry)',
              method: 'POST',
              url: 'http://localhost:5000/api/dispatch/technicians/location',
              body: { latitude: 9.012345, longitude: 38.745678, buildingId: 1, floorId: 2 }
            })
          ]
        }
      ]
    },

    // ═════════════════════════════════════════════════════════════════
    // MODULE 10: SLA POLICIES, MONITORING & ESCALATIONS (11 endpoints)
    // ═════════════════════════════════════════════════════════════════
    {
      name: '10. SLA Policies & Escalations',
      item: [
        {
          name: '10.1 SLA Clocks & Stopwatches',
          item: [
            reqItem({ name: 'Get SLA Compliance Overview Metrics', method: 'GET', url: 'http://localhost:5000/api/sla/overview' }),
            reqItem({ name: 'List Active SLA Clocks', method: 'GET', url: 'http://localhost:5000/api/sla/clocks' }),
            reqItem({ name: 'Get SLA Clock by ID', method: 'GET', url: 'http://localhost:5000/api/sla/clocks/:id' }),
            reqItem({
              name: 'Start New SLA Clock for Issue',
              method: 'POST',
              url: 'http://localhost:5000/api/sla/clocks',
              body: { issueRequestId: 1, policyId: 1, targetResponseMinutes: 30, targetResolutionMinutes: 240 }
            }),
            reqItem({
              name: 'Pause SLA Clock (Pending Parts / Tenant Confirmation)',
              method: 'POST',
              url: 'http://localhost:5000/api/sla/clocks/:id/pause',
              body: { pauseReason: 'PENDING_PARTS' }
            }),
            reqItem({
              name: 'Resume Paused SLA Clock',
              method: 'POST',
              url: 'http://localhost:5000/api/sla/clocks/:id/resume',
              body: { resumeNotes: 'Parts delivered; SLA countdown active' }
            })
          ]
        },
        {
          name: '10.2 SLA Policies & Definitions',
          item: [
            reqItem({ name: 'List SLA Policies', method: 'GET', url: 'http://localhost:5000/api/sla/policies' }),
            reqItem({ name: 'Get SLA Policy by ID', method: 'GET', url: 'http://localhost:5000/api/sla/policies/:id' }),
            reqItem({
              name: 'Create SLA Policy',
              method: 'POST',
              url: 'http://localhost:5000/api/sla/policies',
              body: {
                policyCode: 'SLA_CRITICAL_FACILITIES',
                policyName: 'Critical Facilities Emergency SLA',
                priority: 'CRITICAL',
                responseTargetMinutes: 15,
                resolutionTargetMinutes: 120,
                businessHoursOnly: false,
                escalationThresholdPercent: 80,
                isActive: true
              }
            })
          ]
        },
        {
          name: '10.3 SLA Breaches & Acknowledgement',
          item: [
            reqItem({ name: 'List SLA Breaches & Alerts', method: 'GET', url: 'http://localhost:5000/api/sla/breaches' }),
            reqItem({
              name: 'Acknowledge SLA Breach Incident',
              method: 'POST',
              url: 'http://localhost:5000/api/sla/breaches/:id/acknowledge',
              body: { acknowledgementNotes: 'Incident acknowledged by operations manager; senior vendor technician dispatched' }
            })
          ]
        }
      ]
    }
  ];
}
