import { reqItem } from './postman-builder-helpers.mjs';

export function getModules11To15() {
  return [
    // ═════════════════════════════════════════════════════════════════
    // MODULE 11: COMMUNICATION & MESSAGING (24 endpoints)
    // ═════════════════════════════════════════════════════════════════
    {
      name: '11. Communication & Collaboration',
      item: [
        {
          name: '11.1 Conversations & Messages',
          item: [
            reqItem({ name: 'List Active Conversations', method: 'GET', url: 'http://localhost:5000/api/communication/conversations' }),
            reqItem({ name: 'Get Unread Messages Count', method: 'GET', url: 'http://localhost:5000/api/communication/unread-count' }),
            reqItem({ name: 'Search Communications', method: 'GET', url: 'http://localhost:5000/api/communication/search?q=leak' }),
            reqItem({ name: 'Get Conversation by ID', method: 'GET', url: 'http://localhost:5000/api/communication/conversations/:id' }),
            reqItem({
              name: 'Start Conversation',
              method: 'POST',
              url: 'http://localhost:5000/api/communication/conversations',
              body: {
                title: 'HVAC Unit 4 Maintenance Coordination',
                participantUserIds: [1, 2],
                channelType: 'DIRECT',
                issueRequestId: 1
              }
            }),
            reqItem({
              name: 'Send Message in Conversation',
              method: 'POST',
              url: 'http://localhost:5000/api/communication/conversations/:id/messages',
              body: {
                messageBody: 'Technician team is on-site and commencing inspection.'
              }
            }),
            reqItem({
              name: 'Mark Conversation as Read',
              method: 'PATCH',
              url: 'http://localhost:5000/api/communication/conversations/:id/read'
            }),
            reqItem({
              name: 'Archive Conversation',
              method: 'PATCH',
              url: 'http://localhost:5000/api/communication/conversations/:id/archive'
            }),
            reqItem({
              name: 'Add Participant to Conversation',
              method: 'POST',
              url: 'http://localhost:5000/api/communication/conversations/:id/participants',
              body: {
                userId: 2,
                role: 'MEMBER'
              }
            }),
            reqItem({
              name: 'Remove Participant from Conversation',
              method: 'DELETE',
              url: 'http://localhost:5000/api/communication/conversations/:id/participants/:userId'
            })
          ]
        },
        {
          name: '11.2 Internal Notes (Staff Only)',
          item: [
            reqItem({ name: 'List Internal Notes for Issue', method: 'GET', url: 'http://localhost:5000/api/communication/issues/:id/notes' }),
            reqItem({
              name: 'Create Internal Note',
              method: 'POST',
              url: 'http://localhost:5000/api/communication/issues/:id/notes',
              body: {
                content: 'Tenant has reported recurring vibration noise; check pump mounting bracket.'
              }
            }),
            reqItem({ name: 'Delete Internal Note', method: 'DELETE', url: 'http://localhost:5000/api/communication/notes/:id' })
          ]
        },
        {
          name: '11.3 Public Comments',
          item: [
            reqItem({ name: 'List Public Comments for Issue', method: 'GET', url: 'http://localhost:5000/api/communication/issues/:id/comments' }),
            reqItem({
              name: 'Create Public Comment',
              method: 'POST',
              url: 'http://localhost:5000/api/communication/issues/:id/comments',
              body: {
                content: 'Our HVAC contractor is scheduled to arrive at 2:00 PM today.'
              }
            }),
            reqItem({ name: 'Delete Public Comment', method: 'DELETE', url: 'http://localhost:5000/api/communication/comments/:id' })
          ]
        },
        {
          name: '11.4 System Announcements',
          item: [
            reqItem({ name: 'List Announcements', method: 'GET', url: 'http://localhost:5000/api/communication/announcements' }),
            reqItem({
              name: 'Create Announcement',
              method: 'POST',
              url: 'http://localhost:5000/api/communication/announcements',
              body: {
                title: 'Scheduled Water Main Maintenance — Building B',
                body: 'Water supply to Building B will be temporarily paused on Saturday from 8:00 AM to 12:00 PM.',
                priority: 'HIGH',
                targetAudience: 'ALL_TENANTS',
                startsAt: '2026-11-01T08:00:00Z',
                expiresAt: '2026-11-01T12:00:00Z'
              }
            }),
            reqItem({ name: 'Delete Announcement', method: 'DELETE', url: 'http://localhost:5000/api/communication/announcements/:id' })
          ]
        },
        {
          name: '11.5 Broadcast Channels',
          item: [
            reqItem({ name: 'List Broadcast Channels', method: 'GET', url: 'http://localhost:5000/api/communication/channels' }),
            reqItem({
              name: 'Create Broadcast Channel',
              method: 'POST',
              url: 'http://localhost:5000/api/communication/channels',
              body: {
                name: 'Facilities Emergency Broadcast',
                description: 'Urgent announcements and facilities notices across all parks',
                isPublic: true
              }
            }),
            reqItem({
              name: 'Broadcast Message to Channel',
              method: 'POST',
              url: 'http://localhost:5000/api/communication/channels/:id/broadcast',
              body: {
                title: 'Emergency Generator Test',
                message: 'Testing will take place at 15:00 today. Brief power flickers may occur.'
              }
            }),
            reqItem({ name: 'Delete Broadcast Channel', method: 'DELETE', url: 'http://localhost:5000/api/communication/channels/:id' })
          ]
        },
        {
          name: '11.6 Activity Timeline',
          item: [
            reqItem({ name: 'Get Issue Communication Activity Timeline', method: 'GET', url: 'http://localhost:5000/api/communication/issues/:id/timeline' })
          ]
        }
      ]
    },

    // ═════════════════════════════════════════════════════════════════
    // MODULE 12: NOTIFICATIONS & ALERTS (20 endpoints)
    // ═════════════════════════════════════════════════════════════════
    {
      name: '12. Notifications & Alerts',
      item: [
        {
          name: '12.1 Overview & Inbox Feed',
          item: [
            reqItem({ name: 'Get Notification Dashboard Stats', method: 'GET', url: 'http://localhost:5000/api/notifications/overview' }),
            reqItem({ name: 'Get Unread Notifications Count', method: 'GET', url: 'http://localhost:5000/api/notifications/unread-count' }),
            reqItem({ name: 'List Notifications (User Inbox)', method: 'GET', url: 'http://localhost:5000/api/notifications' }),
            reqItem({ name: 'Get Notification by ID', method: 'GET', url: 'http://localhost:5000/api/notifications/:id' }),
            reqItem({ name: 'Mark Single Notification as Read', method: 'PATCH', url: 'http://localhost:5000/api/notifications/:id/read' }),
            reqItem({ name: 'Mark Single Notification as Unread', method: 'PATCH', url: 'http://localhost:5000/api/notifications/:id/unread' }),
            reqItem({ name: 'Mark All Notifications as Read', method: 'PATCH', url: 'http://localhost:5000/api/notifications/mark-all-read' }),
            reqItem({ name: 'Dismiss / Archive Notification', method: 'DELETE', url: 'http://localhost:5000/api/notifications/:id' })
          ]
        },
        {
          name: '12.2 Dispatch & Trigger Operations',
          item: [
            reqItem({
              name: 'Trigger Notification by Business Event',
              method: 'POST',
              url: 'http://localhost:5000/api/notifications/event',
              body: {
                eventType: 'ISSUE_ASSIGNED',
                entityType: 'ISSUE',
                entityId: 1,
                recipientUserId: 1,
                payload: {
                  issueTitle: 'Water Leak Floor 2',
                  assignedBy: 'Super Admin'
                }
              }
            }),
            reqItem({
              name: 'Direct Multi-Channel Notification Dispatch',
              method: 'POST',
              url: 'http://localhost:5000/api/notifications/dispatch',
              body: {
                recipientUserId: 1,
                channels: ['IN_APP', 'EMAIL'],
                title: 'Critical Incident Alert',
                body: 'Immediate response required for server room cooling failure.',
                priority: 'CRITICAL'
              }
            }),
            reqItem({
              name: 'Dispatch Diagnostic Test Email',
              method: 'POST',
              url: 'http://localhost:5000/api/notifications/test-email',
              body: {
                to: 'admin@enterprise.com',
                subject: 'Enterprise ITMS — SMTP Health Verification Test'
              }
            })
          ]
        },
        {
          name: '12.3 Notification Preferences',
          item: [
            reqItem({ name: 'Get Current User Notification Preferences', method: 'GET', url: 'http://localhost:5000/api/notifications/preferences' }),
            reqItem({
              name: 'Update Notification Preferences',
              method: 'PUT',
              url: 'http://localhost:5000/api/notifications/preferences',
              body: {
                emailEnabled: true,
                smsEnabled: false,
                inAppEnabled: true,
                digestFrequency: 'DAILY',
                quietHoursStart: '22:00',
                quietHoursEnd: '06:00'
              }
            })
          ]
        },
        {
          name: '12.4 Templates & Delivery Auditing',
          item: [
            reqItem({ name: 'List Notification Templates', method: 'GET', url: 'http://localhost:5000/api/notifications/templates' }),
            reqItem({
              name: 'Create Notification Template',
              method: 'POST',
              url: 'http://localhost:5000/api/notifications/templates',
              body: {
                templateCode: 'TPL_ISSUE_RESOLVED',
                name: 'Issue Resolved Notification',
                channel: 'EMAIL',
                subject: 'Your issue #{{issueId}} has been resolved',
                bodyTemplate: '<p>Dear {{userName}},</p><p>Issue <strong>{{issueTitle}}</strong> is now resolved.</p>',
                isActive: true
              }
            }),
            reqItem({
              name: 'Update Notification Template',
              method: 'PUT',
              url: 'http://localhost:5000/api/notifications/templates/:id',
              body: {
                name: 'Issue Resolved Notification (Revised)',
                subject: 'Resolved: {{issueTitle}} (Ticket #{{issueId}})',
                isActive: true
              }
            }),
            reqItem({ name: 'Get Delivery Logs & Failure Audits', method: 'GET', url: 'http://localhost:5000/api/notifications/delivery-log' })
          ]
        },
        {
          name: '12.5 Reminders & Scheduled Follow-ups',
          item: [
            reqItem({ name: 'List Active Reminders', method: 'GET', url: 'http://localhost:5000/api/notifications/reminders' }),
            reqItem({
              name: 'Schedule New Reminder',
              method: 'POST',
              url: 'http://localhost:5000/api/notifications/reminders',
              body: {
                entityType: 'ISSUE',
                entityId: 1,
                reminderTime: '2026-11-05T09:00:00Z',
                message: 'Follow up with tenant regarding air quality post-filter installation.'
              }
            }),
            reqItem({
              name: 'Complete / Acknowledge Reminder',
              method: 'PATCH',
              url: 'http://localhost:5000/api/notifications/reminders/:id/complete'
            })
          ]
        }
      ]
    },

    // ═════════════════════════════════════════════════════════════════
    // MODULE 13: FILE & DOCUMENT MANAGEMENT (16 endpoints)
    // ═════════════════════════════════════════════════════════════════
    {
      name: '13. File & Document Management',
      item: [
        {
          name: '13.1 Metrics & Public Shares',
          item: [
            reqItem({
              name: 'Public Document Access (By Share Token)',
              method: 'GET',
              url: 'http://localhost:5000/api/documents/share/:shareToken',
              isPublic: true,
              description: 'Anonymous download via cryptographically secured share link token.'
            }),
            reqItem({ name: 'Get Storage & Document Telemetry Metrics', method: 'GET', url: 'http://localhost:5000/api/documents/metrics' })
          ]
        },
        {
          name: '13.2 Categories',
          item: [
            reqItem({ name: 'List Document Categories', method: 'GET', url: 'http://localhost:5000/api/documents/categories' }),
            reqItem({
              name: 'Create Document Category',
              method: 'POST',
              url: 'http://localhost:5000/api/documents/categories',
              body: {
                categoryCode: 'ELEC_SCHEMATICS',
                name: 'Electrical Schematics & Diagrams',
                description: 'Circuit layouts, wiring blueprints, and transformer diagrams',
                allowedMimeTypes: ['application/pdf', 'image/png'],
                maxSizeBytes: 52428800
              }
            })
          ]
        },
        {
          name: '13.3 Documents CRUD & Query',
          item: [
            reqItem({ name: 'Search & List Documents', method: 'GET', url: 'http://localhost:5000/api/documents' }),
            reqItem({ name: 'Get Document Metadata by ID', method: 'GET', url: 'http://localhost:5000/api/documents/:id' }),
            reqItem({
              name: 'Update Document Metadata',
              method: 'PATCH',
              url: 'http://localhost:5000/api/documents/:id',
              body: {
                title: 'Building A Floor 2 Electrical Blueprint v2.1',
                categoryId: 1,
                description: 'Updated with redundant breaker routes'
              }
            }),
            reqItem({ name: 'Soft Delete Document', method: 'DELETE', url: 'http://localhost:5000/api/documents/:id' })
          ]
        },
        {
          name: '13.4 File Uploads',
          item: [
            reqItem({
              name: 'Upload Single File (Multipart)',
              method: 'POST',
              url: 'http://localhost:5000/api/documents/upload',
              isMultipart: true,
              body: {
                fieldName: 'file',
                extraFields: [
                  { key: 'categoryId', value: '1' },
                  { key: 'title', value: 'Air Conditioning Technical Manual' },
                  { key: 'entityType', value: 'SERVICE' },
                  { key: 'entityId', value: '1' }
                ]
              }
            }),
            reqItem({
              name: 'Upload Multiple Files (Batch)',
              method: 'POST',
              url: 'http://localhost:5000/api/documents/upload-multiple',
              isMultipart: true,
              body: {
                fieldName: 'files',
                extraFields: [
                  { key: 'categoryId', value: '1' },
                  { key: 'entityType', value: 'ISSUE' },
                  { key: 'entityId', value: '1' }
                ]
              }
            })
          ]
        },
        {
          name: '13.5 File Retrieval & Sharing',
          item: [
            reqItem({ name: 'Download Binary File Content', method: 'GET', url: 'http://localhost:5000/api/documents/:id/download' }),
            reqItem({ name: 'Preview Document / Inline Stream', method: 'GET', url: 'http://localhost:5000/api/documents/:id/preview' }),
            reqItem({
              name: 'Upload New Version for Document',
              method: 'POST',
              url: 'http://localhost:5000/api/documents/:id/versions',
              isMultipart: true,
              body: {
                fieldName: 'file',
                extraFields: [{ key: 'versionNotes', value: 'Updated calibration specifications for 2026' }]
              }
            }),
            reqItem({
              name: 'Generate Secure Share Link',
              method: 'POST',
              url: 'http://localhost:5000/api/documents/:id/share',
              body: {
                expiresInHours: 72,
                allowDownload: true,
                password: 'SharePassword@2026'
              }
            })
          ]
        },
        {
          name: '13.6 Lifecycle & Trash Management',
          item: [
            reqItem({ name: 'Restore Deleted Document from Trash', method: 'POST', url: 'http://localhost:5000/api/documents/:id/restore' }),
            reqItem({ name: 'Permanently Purge Document from Disk', method: 'DELETE', url: 'http://localhost:5000/api/documents/:id/permanent' })
          ]
        }
      ]
    },

    // ═════════════════════════════════════════════════════════════════
    // MODULE 14: REPORTING & ANALYTICS (19 endpoints)
    // ═════════════════════════════════════════════════════════════════
    {
      name: '14. Reporting & Analytics',
      item: [
        {
          name: '14.1 Operational & Executive Dashboards',
          item: [
            reqItem({ name: 'Executive Overview KPI Dashboard', method: 'GET', url: 'http://localhost:5000/api/reports/dashboard/executive' }),
            reqItem({ name: 'Issue Request Trend & Volume Analytics', method: 'GET', url: 'http://localhost:5000/api/reports/requests' }),
            reqItem({ name: 'Technician Workload & Assignment Distribution', method: 'GET', url: 'http://localhost:5000/api/reports/assignments' }),
            reqItem({ name: 'SLA Compliance & Target Breaches Analytics', method: 'GET', url: 'http://localhost:5000/api/reports/sla' }),
            reqItem({ name: 'Tenant Ticket Consumption & Incident History', method: 'GET', url: 'http://localhost:5000/api/reports/tenants' }),
            reqItem({ name: 'Department Resolution Performance Benchmarks', method: 'GET', url: 'http://localhost:5000/api/reports/departments' }),
            reqItem({ name: 'Approval Bottleneck & Cycle Time Report', method: 'GET', url: 'http://localhost:5000/api/reports/approvals' }),
            reqItem({ name: 'System Security & Governance Audit Log Report', method: 'GET', url: 'http://localhost:5000/api/reports/audit' })
          ]
        },
        {
          name: '14.2 Export Operations',
          item: [
            reqItem({ name: 'Export Report (PDF / Excel / CSV)', method: 'GET', url: 'http://localhost:5000/api/reports/export/:reportType?format=csv' })
          ]
        },
        {
          name: '14.3 Saved Custom Reports',
          item: [
            reqItem({ name: 'List Saved Reports', method: 'GET', url: 'http://localhost:5000/api/reports/saved' }),
            reqItem({
              name: 'Save Custom Report Definition',
              method: 'POST',
              url: 'http://localhost:5000/api/reports/saved',
              body: {
                name: 'Quarterly High-Priority HVAC Outages',
                description: 'Filter for all critical HVAC issues taking > 4 hours to resolve',
                reportType: 'REQUESTS',
                filters: { priority: 'CRITICAL', serviceCategory: 'HVAC' }
              }
            }),
            reqItem({
              name: 'Update Saved Report Definition',
              method: 'PUT',
              url: 'http://localhost:5000/api/reports/saved/:id',
              body: {
                name: 'Quarterly Critical Infrastructure Outages',
                description: 'Filter for all critical issues across all categories',
                filters: { priority: 'CRITICAL' }
              }
            }),
            reqItem({ name: 'Delete Saved Report Definition', method: 'DELETE', url: 'http://localhost:5000/api/reports/saved/:id' })
          ]
        },
        {
          name: '14.4 Schedules & Automation',
          item: [
            reqItem({ name: 'List Scheduled Report Jobs', method: 'GET', url: 'http://localhost:5000/api/reports/schedules' }),
            reqItem({
              name: 'Create Report Dispatch Schedule',
              method: 'POST',
              url: 'http://localhost:5000/api/reports/schedules',
              body: {
                savedReportId: 1,
                cronExpression: '0 8 * * 1',
                recipients: ['executives@enterprise.com'],
                format: 'PDF',
                isActive: true
              }
            }),
            reqItem({
              name: 'Update Report Dispatch Schedule',
              method: 'PUT',
              url: 'http://localhost:5000/api/reports/schedules/:id',
              body: {
                cronExpression: '0 9 1 * *',
                format: 'EXCEL',
                isActive: true
              }
            }),
            reqItem({ name: 'Delete Report Dispatch Schedule', method: 'DELETE', url: 'http://localhost:5000/api/reports/schedules/:id' }),
            reqItem({ name: 'Manually Trigger Scheduled Report Execution', method: 'POST', url: 'http://localhost:5000/api/reports/schedules/:id/trigger' })
          ]
        },
        {
          name: '14.5 Executions History',
          item: [
            reqItem({ name: 'List Report Generation Runs & Executions', method: 'GET', url: 'http://localhost:5000/api/reports/executions' })
          ]
        }
      ]
    },

    // ═════════════════════════════════════════════════════════════════
    // MODULE 15: CONFIGURATION MANAGEMENT (66 endpoints)
    // ═════════════════════════════════════════════════════════════════
    {
      name: '15. Configuration Management',
      item: [
        {
          name: '15.1 System Bootstrap',
          item: [
            reqItem({ name: 'Client Initialization Bootstrap Payload', method: 'GET', url: 'http://localhost:5000/api/configuration/bootstrap' })
          ]
        },
        {
          name: '15.2 System Settings',
          item: [
            reqItem({ name: 'List System Settings', method: 'GET', url: 'http://localhost:5000/api/configuration/system-settings' }),
            reqItem({ name: 'Get Setting by Key', method: 'GET', url: 'http://localhost:5000/api/configuration/system-settings/key/:key' }),
            reqItem({ name: 'Get Setting by ID', method: 'GET', url: 'http://localhost:5000/api/configuration/system-settings/:id' }),
            reqItem({
              name: 'Create System Setting',
              method: 'POST',
              url: 'http://localhost:5000/api/configuration/system-settings',
              body: {
                settingKey: 'GLOBAL_MAINTENANCE_WINDOW',
                settingValue: 'Sun 02:00-04:00 UTC',
                valueType: 'STRING',
                description: 'Weekly scheduled platform maintenance outage window'
              }
            }),
            reqItem({
              name: 'Update System Setting',
              method: 'PUT',
              url: 'http://localhost:5000/api/configuration/system-settings/:id',
              body: {
                settingValue: 'Sun 03:00-05:00 UTC',
                description: 'Adjusted weekly maintenance outage window'
              }
            }),
            reqItem({ name: 'Delete System Setting', method: 'DELETE', url: 'http://localhost:5000/api/configuration/system-settings/:id' })
          ]
        },
        {
          name: '15.3 Feature Flags',
          item: [
            reqItem({ name: 'List Feature Flags', method: 'GET', url: 'http://localhost:5000/api/configuration/feature-flags' }),
            reqItem({ name: 'Get Feature Flag by Code', method: 'GET', url: 'http://localhost:5000/api/configuration/feature-flags/code/:code' }),
            reqItem({ name: 'Evaluate Feature Flag State', method: 'GET', url: 'http://localhost:5000/api/configuration/feature-flags/code/:code/enabled' }),
            reqItem({ name: 'Get Feature Flag by ID', method: 'GET', url: 'http://localhost:5000/api/configuration/feature-flags/:id' }),
            reqItem({
              name: 'Create Feature Flag',
              method: 'POST',
              url: 'http://localhost:5000/api/configuration/feature-flags',
              body: {
                flagCode: 'ENABLE_AI_DISPATCH_RECOMMENDER',
                name: 'AI-Powered Auto Dispatch Engine',
                description: 'Toggles predictive assignment model for facilities dispatch',
                isEnabled: false
              }
            }),
            reqItem({
              name: 'Update Feature Flag',
              method: 'PUT',
              url: 'http://localhost:5000/api/configuration/feature-flags/:id',
              body: {
                name: 'AI Auto Dispatch Engine v2',
                description: 'Enhanced machine learning dispatch algorithm'
              }
            }),
            reqItem({
              name: 'Toggle Feature Flag Status',
              method: 'PATCH',
              url: 'http://localhost:5000/api/configuration/feature-flags/:id/toggle',
              body: {
                isEnabled: true
              }
            }),
            reqItem({ name: 'Delete Feature Flag', method: 'DELETE', url: 'http://localhost:5000/api/configuration/feature-flags/:id' })
          ]
        },
        {
          name: '15.4 Business Rules',
          item: [
            reqItem({ name: 'List Business Rules', method: 'GET', url: 'http://localhost:5000/api/configuration/business-rules' }),
            reqItem({ name: 'Get Business Rule by Code', method: 'GET', url: 'http://localhost:5000/api/configuration/business-rules/code/:code' }),
            reqItem({ name: 'Get Business Rule by ID', method: 'GET', url: 'http://localhost:5000/api/configuration/business-rules/:id' }),
            reqItem({
              name: 'Create Business Rule',
              method: 'POST',
              url: 'http://localhost:5000/api/configuration/business-rules',
              body: {
                ruleCode: 'AUTO_ESCALATE_FIRE_ALARM',
                ruleName: 'Auto Escalate Fire & Life Safety Incidents',
                ruleExpression: 'issue.category == "FIRE_SAFETY" && issue.status == "OPEN"',
                actions: [{ action: 'SET_PRIORITY', value: 'CRITICAL' }, { action: 'NOTIFY_ROLES', value: ['PARK_ADMIN'] }]
              }
            }),
            reqItem({
              name: 'Update Business Rule',
              method: 'PUT',
              url: 'http://localhost:5000/api/configuration/business-rules/:id',
              body: {
                ruleName: 'Auto Escalate Fire & Life Safety Incidents v2',
                isActive: true
              }
            }),
            reqItem({ name: 'Delete Business Rule', method: 'DELETE', url: 'http://localhost:5000/api/configuration/business-rules/:id' })
          ]
        },
        {
          name: '15.5 Number Sequences',
          item: [
            reqItem({ name: 'List Number Sequences', method: 'GET', url: 'http://localhost:5000/api/configuration/number-sequences' }),
            reqItem({ name: 'Get Number Sequence by Code', method: 'GET', url: 'http://localhost:5000/api/configuration/number-sequences/code/:code' }),
            reqItem({ name: 'Generate Next Number in Sequence', method: 'POST', url: 'http://localhost:5000/api/configuration/number-sequences/code/:code/next' }),
            reqItem({ name: 'Get Number Sequence by ID', method: 'GET', url: 'http://localhost:5000/api/configuration/number-sequences/:id' }),
            reqItem({
              name: 'Create Number Sequence',
              method: 'POST',
              url: 'http://localhost:5000/api/configuration/number-sequences',
              body: {
                sequenceCode: 'SEQ_WORK_ORDER',
                prefix: 'WO-',
                suffix: '-2026',
                nextNumber: 10001,
                paddingLength: 5,
                step: 1
              }
            }),
            reqItem({
              name: 'Update Number Sequence',
              method: 'PUT',
              url: 'http://localhost:5000/api/configuration/number-sequences/:id',
              body: {
                nextNumber: 10500,
                step: 1
              }
            }),
            reqItem({ name: 'Delete Number Sequence', method: 'DELETE', url: 'http://localhost:5000/api/configuration/number-sequences/:id' })
          ]
        },
        {
          name: '15.6 Dynamic Lookups',
          item: [
            reqItem({ name: 'List Lookups for Entity Key', method: 'GET', url: 'http://localhost:5000/api/configuration/lookups/:entityKey' }),
            reqItem({ name: 'Get Lookup by Code within Entity', method: 'GET', url: 'http://localhost:5000/api/configuration/lookups/:entityKey/code/:code' }),
            reqItem({ name: 'Get Lookup by ID within Entity', method: 'GET', url: 'http://localhost:5000/api/configuration/lookups/:entityKey/:id' }),
            reqItem({
              name: 'Create Lookup for Entity',
              method: 'POST',
              url: 'http://localhost:5000/api/configuration/lookups/:entityKey',
              body: {
                lookupCode: 'SEV_1',
                lookupValue: 'Severity 1 (Total Outage)',
                displayOrder: 1,
                isActive: true
              }
            }),
            reqItem({
              name: 'Update Lookup for Entity',
              method: 'PUT',
              url: 'http://localhost:5000/api/configuration/lookups/:entityKey/:id',
              body: {
                lookupValue: 'Severity 1 (Catastrophic Business Interruption)',
                displayOrder: 1
              }
            }),
            reqItem({ name: 'Delete Lookup for Entity', method: 'DELETE', url: 'http://localhost:5000/api/configuration/lookups/:entityKey/:id' })
          ]
        },
        {
          name: '15.7 Lookup Types & Values',
          item: [
            reqItem({ name: 'List All Lookup Types', method: 'GET', url: 'http://localhost:5000/api/configuration/lookup-types' }),
            reqItem({ name: 'Get Lookup Type by Code', method: 'GET', url: 'http://localhost:5000/api/configuration/lookup-types/code/:code' }),
            reqItem({ name: 'Get Lookup Type by ID', method: 'GET', url: 'http://localhost:5000/api/configuration/lookup-types/:id' }),
            reqItem({
              name: 'Create Lookup Type',
              method: 'POST',
              url: 'http://localhost:5000/api/configuration/lookup-types',
              body: {
                typeCode: 'EQUIPMENT_CONDITION',
                name: 'Equipment Operating Condition',
                description: 'Operational status ratings for physical plant machinery'
              }
            }),
            reqItem({
              name: 'Update Lookup Type',
              method: 'PUT',
              url: 'http://localhost:5000/api/configuration/lookup-types/:id',
              body: {
                name: 'Equipment Condition & Reliability Rating',
                description: 'Updated machinery status ratings'
              }
            }),
            reqItem({ name: 'Delete Lookup Type', method: 'DELETE', url: 'http://localhost:5000/api/configuration/lookup-types/:id' }),
            reqItem({ name: 'List Values for Lookup Type', method: 'GET', url: 'http://localhost:5000/api/configuration/lookup-types/:id/values' }),
            reqItem({
              name: 'Add Value to Lookup Type',
              method: 'POST',
              url: 'http://localhost:5000/api/configuration/lookup-types/:id/values',
              body: {
                valueCode: 'COND_EXCELLENT',
                displayValue: 'Brand New / Pristine Condition',
                sortOrder: 1,
                isActive: true
              }
            }),
            reqItem({
              name: 'Update Specific Value in Lookup Type',
              method: 'PUT',
              url: 'http://localhost:5000/api/configuration/lookup-types/:lookupTypeId/values/:valueId',
              body: {
                displayValue: 'Optimal Operating Condition',
                sortOrder: 1
              }
            }),
            reqItem({ name: 'Delete Specific Value from Lookup Type', method: 'DELETE', url: 'http://localhost:5000/api/configuration/lookup-types/:lookupTypeId/values/:valueId' })
          ]
        },
        {
          name: '15.8 Working Calendars, Hours & Holidays',
          item: [
            reqItem({ name: 'List Operating Calendars', method: 'GET', url: 'http://localhost:5000/api/configuration/calendars' }),
            reqItem({ name: 'Get Operating Calendar by ID', method: 'GET', url: 'http://localhost:5000/api/configuration/calendars/:id' }),
            reqItem({
              name: 'Create Operating Calendar',
              method: 'POST',
              url: 'http://localhost:5000/api/configuration/calendars',
              body: {
                calendarCode: 'CAL_ETHIOPIA_DEFAULT',
                name: 'Standard Ethiopian Business Calendar',
                timeZone: 'Africa/Addis_Ababa',
                isDefault: true
              }
            }),
            reqItem({
              name: 'Update Operating Calendar',
              method: 'PUT',
              url: 'http://localhost:5000/api/configuration/calendars/:id',
              body: {
                name: 'Standard Ethiopian Business Calendar 2026',
                isDefault: true
              }
            }),
            reqItem({ name: 'Delete Operating Calendar', method: 'DELETE', url: 'http://localhost:5000/api/configuration/calendars/:id' }),
            reqItem({ name: 'List Working Hours for Calendar', method: 'GET', url: 'http://localhost:5000/api/configuration/calendars/:id/working-hours' }),
            reqItem({
              name: 'Add Working Hour Shift to Calendar',
              method: 'POST',
              url: 'http://localhost:5000/api/configuration/calendars/:id/working-hours',
              body: {
                dayOfWeek: 1,
                startTime: '08:30:00',
                endTime: '17:30:00',
                isWorkingDay: true
              }
            }),
            reqItem({
              name: 'Update Working Hour Shift',
              method: 'PUT',
              url: 'http://localhost:5000/api/configuration/calendars/:calendarId/working-hours/:workingHourId',
              body: {
                startTime: '08:00:00',
                endTime: '17:00:00'
              }
            }),
            reqItem({ name: 'Delete Working Hour Shift', method: 'DELETE', url: 'http://localhost:5000/api/configuration/calendars/:calendarId/working-hours/:workingHourId' }),
            reqItem({ name: 'List Holidays for Calendar', method: 'GET', url: 'http://localhost:5000/api/configuration/calendars/:id/holidays' }),
            reqItem({
              name: 'Add Holiday to Calendar',
              method: 'POST',
              url: 'http://localhost:5000/api/configuration/calendars/:id/holidays',
              body: {
                holidayDate: '2026-01-07',
                holidayName: 'Genna (Ethiopian Christmas)',
                isRecurring: true
              }
            }),
            reqItem({
              name: 'Update Holiday in Calendar',
              method: 'PUT',
              url: 'http://localhost:5000/api/configuration/calendars/:calendarId/holidays/:holidayId',
              body: {
                holidayName: 'Genna (Ethiopian Christmas Observance)'
              }
            }),
            reqItem({ name: 'Delete Holiday from Calendar', method: 'DELETE', url: 'http://localhost:5000/api/configuration/calendars/:calendarId/holidays/:holidayId' })
          ]
        },
        {
          name: '15.9 Localizations & Multilingual Resources',
          item: [
            reqItem({ name: 'List System Localizations', method: 'GET', url: 'http://localhost:5000/api/configuration/localizations' }),
            reqItem({ name: 'Get Localization by ID', method: 'GET', url: 'http://localhost:5000/api/configuration/localizations/:id' }),
            reqItem({
              name: 'Create System Localization',
              method: 'POST',
              url: 'http://localhost:5000/api/configuration/localizations',
              body: {
                localeCode: 'am-ET',
                languageName: 'Amharic',
                direction: 'LTR',
                isDefault: false
              }
            }),
            reqItem({
              name: 'Update System Localization',
              method: 'PUT',
              url: 'http://localhost:5000/api/configuration/localizations/:id',
              body: {
                languageName: 'Amharic (Ethiopia)',
                direction: 'LTR'
              }
            }),
            reqItem({ name: 'Delete System Localization', method: 'DELETE', url: 'http://localhost:5000/api/configuration/localizations/:id' }),
            reqItem({ name: 'List Translation Resources for Localization', method: 'GET', url: 'http://localhost:5000/api/configuration/localizations/:id/resources' }),
            reqItem({
              name: 'Add Translation Resource to Localization',
              method: 'POST',
              url: 'http://localhost:5000/api/configuration/localizations/:id/resources',
              body: {
                resourceKey: 'BTN_SUBMIT_ISSUE',
                resourceValue: 'ችግሩን አስገባ',
                category: 'UI_BUTTONS'
              }
            }),
            reqItem({
              name: 'Update Translation Resource in Localization',
              method: 'PUT',
              url: 'http://localhost:5000/api/configuration/localizations/:localizationId/resources/:resourceId',
              body: {
                resourceValue: 'ጥያቄውን ያቅርቡ'
              }
            }),
            reqItem({ name: 'Delete Translation Resource', method: 'DELETE', url: 'http://localhost:5000/api/configuration/localizations/:localizationId/resources/:resourceId' })
          ]
        }
      ]
    }
  ];
}
