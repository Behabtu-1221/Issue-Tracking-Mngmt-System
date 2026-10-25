import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const collection = {
  info: {
    _postman_id: 'itms-api-collection-v2-modules-1-to-5',
    name: 'Enterprise ITMS — Modules 1 to 5 Postman Inventory',
    description: 'Verified Postman Collection covering Modules 1 to 5 of the Enterprise Issue Tracking Management System (ITMS).\n\nBase URL: http://localhost:5000\nAuth: Bearer JWT Token',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
  },
  variable: [
    { key: 'baseUrl', value: 'http://localhost:5000', type: 'string' },
    { key: 'token', value: '', type: 'string' },
    { key: 'refreshToken', value: '', type: 'string' },
    { key: 'userId', value: '1', type: 'string' },
    { key: 'roleId', value: '1', type: 'string' },
    { key: 'parkId', value: '1', type: 'string' },
    { key: 'buildingId', value: '1', type: 'string' },
    { key: 'floorId', value: '1', type: 'string' },
    { key: 'officeId', value: '1', type: 'string' },
    { key: 'locationId', value: '1', type: 'string' },
    { key: 'facilityZoneId', value: '1', type: 'string' },
    { key: 'tenantId', value: '1', type: 'string' },
    { key: 'subTenantId', value: '1', type: 'string' },
    { key: 'contactId', value: '1', type: 'string' },
    { key: 'addressId', value: '1', type: 'string' },
    { key: 'leaseId', value: '1', type: 'string' },
    { key: 'allocationId', value: '1', type: 'string' },
    { key: 'departmentId', value: '1', type: 'string' },
    { key: 'teamId', value: '1', type: 'string' },
    { key: 'positionId', value: '1', type: 'string' },
    { key: 'assignmentId', value: '1', type: 'string' },
    { key: 'hierarchyId', value: '1', type: 'string' },
    { key: 'costCenterId', value: '1', type: 'string' },
    { key: 'budgetId', value: '1', type: 'string' }
  ],
  auth: {
    type: 'bearer',
    bearer: [
      { key: 'token', value: '{{token}}', type: 'string' }
    ]
  },
  item: [
    // ═════════════════════════════════════════════════════════════════
    // MODULE 1: SYSTEM HEALTH & DIAGNOSTICS
    // ═════════════════════════════════════════════════════════════════
    {
      name: '1. System Health & Diagnostics',
      item: [
        {
          name: 'Comprehensive Health Status',
          request: {
            auth: { type: 'noauth' },
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/api/health',
              host: ['{{baseUrl}}'],
              path: ['api', 'health']
            },
            description: 'Public health probe checking DB connection, migrations status, and uptime.'
          }
        },
        {
          name: 'Liveness Probe (/live)',
          request: {
            auth: { type: 'noauth' },
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/api/health/live',
              host: ['{{baseUrl}}'],
              path: ['api', 'health', 'live']
            },
            description: 'Kubernetes/Docker liveness probe verifying event loop responsiveness.'
          }
        },
        {
          name: 'Readiness Probe (/ready)',
          request: {
            auth: { type: 'noauth' },
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/api/health/ready',
              host: ['{{baseUrl}}'],
              path: ['api', 'health', 'ready']
            },
            description: 'Readiness probe verifying MySQL connectivity and schema at migration head.'
          }
        }
      ]
    },

    // ═════════════════════════════════════════════════════════════════
    // MODULE 2: IDENTITY & ACCESS MANAGEMENT
    // ═════════════════════════════════════════════════════════════════
    {
      name: '2. Identity & Access Management',
      item: [
        {
          name: '2.1 Authentication & Sessions',
          item: [
            {
              name: 'Login (Super Admin)',
              event: [
                {
                  listen: 'test',
                  script: {
                    type: 'text/javascript',
                    exec: [
                      'const res = pm.response.json();',
                      'if (res && res.data && res.data.accessToken) {',
                      '    pm.collectionVariables.set("token", res.data.accessToken);',
                      '    pm.collectionVariables.set("refreshToken", res.data.refreshToken);',
                      '    console.log("✓ Captured JWT Access Token and Refresh Token!");',
                      '}',
                      'pm.test("Status code is 200", () => pm.response.to.have.status(200));',
                      'pm.test("Contains JWT accessToken", () => pm.expect(res.data.accessToken).to.be.a("string"));'
                    ]
                  }
                }
              ],
              request: {
                auth: { type: 'noauth' },
                method: 'POST',
                header: [{ key: 'Content-Type', value: 'application/json' }],
                body: {
                  mode: 'raw',
                  raw: JSON.stringify({
                    username: 'superadmin',
                    password: 'Admin@123'
                  }, null, 2)
                },
                url: {
                  raw: '{{baseUrl}}/api/auth/login',
                  host: ['{{baseUrl}}'],
                  path: ['api', 'auth', 'login']
                },
                description: 'Authenticates with username/password and automatically sets {{token}} for all subsequent requests.'
              }
            },
            {
              name: 'Refresh Access Token',
              request: {
                auth: { type: 'noauth' },
                method: 'POST',
                header: [{ key: 'Content-Type', value: 'application/json' }],
                body: {
                  mode: 'raw',
                  raw: JSON.stringify({
                    refreshToken: '{{refreshToken}}'
                  }, null, 2)
                },
                url: {
                  raw: '{{baseUrl}}/api/auth/refresh',
                  host: ['{{baseUrl}}'],
                  path: ['api', 'auth', 'refresh']
                }
              }
            },
            {
              name: 'Get Current Actor Profile (/me)',
              request: {
                method: 'GET',
                header: [],
                url: {
                  raw: '{{baseUrl}}/api/auth/me',
                  host: ['{{baseUrl}}'],
                  path: ['api', 'auth', 'me']
                }
              }
            },
            {
              name: 'Update Current User Profile',
              request: {
                method: 'PUT',
                header: [{ key: 'Content-Type', value: 'application/json' }],
                body: {
                  mode: 'raw',
                  raw: JSON.stringify({
                    firstName: 'System',
                    lastName: 'Super Admin',
                    phoneNumber: '+251911000000',
                    preferredLanguage: 'en'
                  }, null, 2)
                },
                url: {
                  raw: '{{baseUrl}}/api/auth/profile',
                  host: ['{{baseUrl}}'],
                  path: ['api', 'auth', 'profile']
                }
              }
            },
            {
              name: 'Update Notification Preferences',
              request: {
                method: 'PUT',
                header: [{ key: 'Content-Type', value: 'application/json' }],
                body: {
                  mode: 'raw',
                  raw: JSON.stringify({
                    emailNotifications: true,
                    inAppNotifications: true,
                    digestFrequency: 'DAILY'
                  }, null, 2)
                },
                url: {
                  raw: '{{baseUrl}}/api/auth/notification-preferences',
                  host: ['{{baseUrl}}'],
                  path: ['api', 'auth', 'notification-preferences']
                }
              }
            },
            {
              name: 'Change Password',
              request: {
                method: 'POST',
                header: [{ key: 'Content-Type', value: 'application/json' }],
                body: {
                  mode: 'raw',
                  raw: JSON.stringify({
                    currentPassword: 'Admin@123',
                    newPassword: 'NewAdmin@123!'
                  }, null, 2)
                },
                url: {
                  raw: '{{baseUrl}}/api/auth/change-password',
                  host: ['{{baseUrl}}'],
                  path: ['api', 'auth', 'change-password']
                }
              }
            },
            {
              name: 'List Active User Sessions',
              request: {
                method: 'GET',
                header: [],
                url: {
                  raw: '{{baseUrl}}/api/auth/sessions',
                  host: ['{{baseUrl}}'],
                  path: ['api', 'auth', 'sessions']
                }
              }
            },
            {
              name: 'Revoke Specific Session',
              request: {
                method: 'DELETE',
                header: [],
                url: {
                  raw: '{{baseUrl}}/api/auth/sessions/:sessionId',
                  host: ['{{baseUrl}}'],
                  path: ['api', 'auth', 'sessions', ':sessionId'],
                  variable: [{ key: 'sessionId', value: '1' }]
                }
              }
            },
            {
              name: 'Forgot Password Request',
              request: {
                auth: { type: 'noauth' },
                method: 'POST',
                header: [{ key: 'Content-Type', value: 'application/json' }],
                body: {
                  mode: 'raw',
                  raw: JSON.stringify({
                    email: 'superadmin@businesspark.local'
                  }, null, 2)
                },
                url: {
                  raw: '{{baseUrl}}/api/auth/forgot-password',
                  host: ['{{baseUrl}}'],
                  path: ['api', 'auth', 'forgot-password']
                }
              }
            },
            {
              name: 'Reset Password With Token',
              request: {
                auth: { type: 'noauth' },
                method: 'POST',
                header: [{ key: 'Content-Type', value: 'application/json' }],
                body: {
                  mode: 'raw',
                  raw: JSON.stringify({
                    token: '32_CHARACTER_CRYPTOGRAPHIC_RESET_TOKEN',
                    newPassword: 'SecureReset@2026!'
                  }, null, 2)
                },
                url: {
                  raw: '{{baseUrl}}/api/auth/reset-password',
                  host: ['{{baseUrl}}'],
                  path: ['api', 'auth', 'reset-password']
                }
              }
            },
            {
              name: 'Logout Session',
              request: {
                method: 'POST',
                header: [],
                url: {
                  raw: '{{baseUrl}}/api/auth/logout',
                  host: ['{{baseUrl}}'],
                  path: ['api', 'auth', 'logout']
                }
              }
            }
          ]
        },
        {
          name: '2.2 User Accounts & Profiles',
          item: [
            {
              name: 'List Users (Paginated & Filterable)',
              request: {
                method: 'GET',
                header: [],
                url: {
                  raw: '{{baseUrl}}/api/users?limit=10&offset=0',
                  host: ['{{baseUrl}}'],
                  path: ['api', 'users'],
                  query: [
                    { key: 'limit', value: '10' },
                    { key: 'offset', value: '0' },
                    { key: 'search', value: '', disabled: true },
                    { key: 'tenantId', value: '1', disabled: true },
                    { key: 'userTypeCode', value: 'EMPLOYEE', disabled: true }
                  ]
                }
              }
            },
            {
              name: 'Get User By ID',
              request: {
                method: 'GET',
                header: [],
                url: {
                  raw: '{{baseUrl}}/api/users/{{userId}}',
                  host: ['{{baseUrl}}'],
                  path: ['api', 'users', '{{userId}}']
                }
              }
            },
            {
              name: 'Create User',
              request: {
                method: 'POST',
                header: [{ key: 'Content-Type', value: 'application/json' }],
                body: {
                  mode: 'raw',
                  raw: JSON.stringify({
                    firstName: 'Abebe',
                    lastName: 'Kebede',
                    email: 'abebe.kebede@testcorp.com',
                    userTypeCode: 'STAFF',
                    tenantId: 1,
                    jobTitle: 'Facilities Coordinator',
                    phoneNumber: '+251911223344',
                    preferredLanguage: 'en',
                    accountStatusCode: 'ACTIVE'
                  }, null, 2)
                },
                url: {
                  raw: '{{baseUrl}}/api/users',
                  host: ['{{baseUrl}}'],
                  path: ['api', 'users']
                }
              }
            },
            {
              name: 'Update User Profile',
              request: {
                method: 'PUT',
                header: [{ key: 'Content-Type', value: 'application/json' }],
                body: {
                  mode: 'raw',
                  raw: JSON.stringify({
                    firstName: 'Abebe',
                    lastName: 'Kebede Modified',
                    jobTitle: 'Senior Facilities Coordinator',
                    phoneNumber: '+251911998877'
                  }, null, 2)
                },
                url: {
                  raw: '{{baseUrl}}/api/users/{{userId}}',
                  host: ['{{baseUrl}}'],
                  path: ['api', 'users', '{{userId}}']
                }
              }
            },
            {
              name: 'Update User Account Status',
              request: {
                method: 'PATCH',
                header: [{ key: 'Content-Type', value: 'application/json' }],
                body: {
                  mode: 'raw',
                  raw: JSON.stringify({
                    status: 'ACTIVE'
                  }, null, 2)
                },
                url: {
                  raw: '{{baseUrl}}/api/users/{{userId}}/status',
                  host: ['{{baseUrl}}'],
                  path: ['api', 'users', '{{userId}}', 'status']
                }
              }
            },
            {
              name: 'Get User Sessions',
              request: {
                method: 'GET',
                header: [],
                url: {
                  raw: '{{baseUrl}}/api/users/{{userId}}/sessions',
                  host: ['{{baseUrl}}'],
                  path: ['api', 'users', '{{userId}}', 'sessions']
                }
              }
            },
            {
              name: 'Terminate All User Sessions',
              request: {
                method: 'DELETE',
                header: [],
                url: {
                  raw: '{{baseUrl}}/api/users/{{userId}}/sessions',
                  host: ['{{baseUrl}}'],
                  path: ['api', 'users', '{{userId}}', 'sessions']
                }
              }
            },
            {
              name: 'Get User Login History',
              request: {
                method: 'GET',
                header: [],
                url: {
                  raw: '{{baseUrl}}/api/users/{{userId}}/login-history?limit=10&offset=0',
                  host: ['{{baseUrl}}'],
                  path: ['api', 'users', '{{userId}}', 'login-history'],
                  query: [
                    { key: 'limit', value: '10' },
                    { key: 'offset', value: '0' }
                  ]
                }
              }
            },
            {
              name: 'Soft Delete User',
              request: {
                method: 'DELETE',
                header: [],
                url: {
                  raw: '{{baseUrl}}/api/users/{{userId}}',
                  host: ['{{baseUrl}}'],
                  path: ['api', 'users', '{{userId}}']
                }
              }
            }
          ]
        },
        {
          name: '2.3 Roles, Permissions & Security',
          item: [
            {
              name: 'Get All System Permissions',
              request: {
                method: 'GET',
                header: [],
                url: {
                  raw: '{{baseUrl}}/api/roles/permissions',
                  host: ['{{baseUrl}}'],
                  path: ['api', 'roles', 'permissions']
                }
              }
            },
            {
              name: 'Get RBAC Audit Logs',
              request: {
                method: 'GET',
                header: [],
                url: {
                  raw: '{{baseUrl}}/api/roles/audit-logs',
                  host: ['{{baseUrl}}'],
                  path: ['api', 'roles', 'audit-logs']
                }
              }
            },
            {
              name: 'List Roles',
              request: {
                method: 'GET',
                header: [],
                url: {
                  raw: '{{baseUrl}}/api/roles?limit=20&offset=0',
                  host: ['{{baseUrl}}'],
                  path: ['api', 'roles'],
                  query: [
                    { key: 'limit', value: '20' },
                    { key: 'offset', value: '0' }
                  ]
                }
              }
            },
            {
              name: 'Get Role By ID',
              request: {
                method: 'GET',
                header: [],
                url: {
                  raw: '{{baseUrl}}/api/roles/{{roleId}}',
                  host: ['{{baseUrl}}'],
                  path: ['api', 'roles', '{{roleId}}']
                }
              }
            },
            {
              name: 'Create Role',
              request: {
                method: 'POST',
                header: [{ key: 'Content-Type', value: 'application/json' }],
                body: {
                  mode: 'raw',
                  raw: JSON.stringify({
                    roleCode: 'FACILITY_INSPECTOR',
                    roleName: 'Facility Inspector',
                    description: 'Conducts periodic physical facility safety audits',
                    permissionIds: [1, 2, 3]
                  }, null, 2)
                },
                url: {
                  raw: '{{baseUrl}}/api/roles',
                  host: ['{{baseUrl}}'],
                  path: ['api', 'roles']
                }
              }
            },
            {
              name: 'Update Role',
              request: {
                method: 'PUT',
                header: [{ key: 'Content-Type', value: 'application/json' }],
                body: {
                  mode: 'raw',
                  raw: JSON.stringify({
                    roleName: 'Senior Facility Inspector',
                    description: 'Updated inspection scope authority'
                  }, null, 2)
                },
                url: {
                  raw: '{{baseUrl}}/api/roles/{{roleId}}',
                  host: ['{{baseUrl}}'],
                  path: ['api', 'roles', '{{roleId}}']
                }
              }
            },
            {
              name: 'Update Role Permissions (Sync)',
              request: {
                method: 'PUT',
                header: [{ key: 'Content-Type', value: 'application/json' }],
                body: {
                  mode: 'raw',
                  raw: JSON.stringify({
                    permissionIds: [1, 2, 3, 4]
                  }, null, 2)
                },
                url: {
                  raw: '{{baseUrl}}/api/roles/{{roleId}}/permissions',
                  host: ['{{baseUrl}}'],
                  path: ['api', 'roles', '{{roleId}}', 'permissions']
                }
              }
            },
            {
              name: 'Assign Roles to User',
              request: {
                method: 'POST',
                header: [{ key: 'Content-Type', value: 'application/json' }],
                body: {
                  mode: 'raw',
                  raw: JSON.stringify({
                    roleIds: [2]
                  }, null, 2)
                },
                url: {
                  raw: '{{baseUrl}}/api/roles/users/{{userId}}/assign',
                  host: ['{{baseUrl}}'],
                  path: ['api', 'roles', 'users', '{{userId}}', 'assign']
                }
              }
            },
            {
              name: 'Remove Role from User',
              request: {
                method: 'DELETE',
                header: [],
                url: {
                  raw: '{{baseUrl}}/api/roles/users/{{userId}}/roles/{{roleId}}',
                  host: ['{{baseUrl}}'],
                  path: ['api', 'roles', 'users', '{{userId}}', 'roles', '{{roleId}}']
                }
              }
            },
            {
              name: 'Delete Role',
              request: {
                method: 'DELETE',
                header: [],
                url: {
                  raw: '{{baseUrl}}/api/roles/{{roleId}}',
                  host: ['{{baseUrl}}'],
                  path: ['api', 'roles', '{{roleId}}']
                }
              }
            }
          ]
        }
      ]
    },

    // ═════════════════════════════════════════════════════════════════
    // MODULE 3: BUSINESS PARK & CAMPUS FACILITY MANAGEMENT
    // ═════════════════════════════════════════════════════════════════
    {
      name: '3. Business Park & Facilities',
      item: [
        {
          name: 'List Business Parks',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/api/parks',
              host: ['{{baseUrl}}'],
              path: ['api', 'parks']
            }
          }
        },
        {
          name: 'Get Park Metrics',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/api/parks/metrics',
              host: ['{{baseUrl}}'],
              path: ['api', 'parks', 'metrics']
            }
          }
        },
        {
          name: 'Get Park By ID',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/api/parks/{{parkId}}',
              host: ['{{baseUrl}}'],
              path: ['api', 'parks', '{{parkId}}']
            }
          }
        },
        {
          name: 'List Buildings',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/api/buildings',
              host: ['{{baseUrl}}'],
              path: ['api', 'buildings']
            }
          }
        },
        {
          name: 'Get Building By ID',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/api/buildings/{{buildingId}}',
              host: ['{{baseUrl}}'],
              path: ['api', 'buildings', '{{buildingId}}']
            }
          }
        },
        {
          name: 'Get Floors in Building',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/api/buildings/{{buildingId}}/floors',
              host: ['{{baseUrl}}'],
              path: ['api', 'buildings', '{{buildingId}}', 'floors']
            }
          }
        },
        {
          name: 'Create Building',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                BusinessParkID: 1,
                FacilityZoneID: 1,
                BuildingCode: 'BLD-TEST-01',
                BuildingName: 'Innovation Hub North',
                TotalFloors: 5,
                TotalAreaSquareMeter: 12500.5,
                IsActive: 1
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/buildings',
              host: ['{{baseUrl}}'],
              path: ['api', 'buildings']
            }
          }
        },
        {
          name: 'List Floors',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/api/floors',
              host: ['{{baseUrl}}'],
              path: ['api', 'floors']
            }
          }
        },
        {
          name: 'Get Offices on Floor',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/api/floors/{{floorId}}/offices',
              host: ['{{baseUrl}}'],
              path: ['api', 'floors', '{{floorId}}', 'offices']
            }
          }
        },
        {
          name: 'Create Floor',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                BuildingID: 1,
                FloorNumber: 3,
                FloorCode: 'FL-03',
                FloorName: 'Third Floor Tech Wing',
                TotalOfficeSpaces: 12,
                IsActive: 1
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/floors',
              host: ['{{baseUrl}}'],
              path: ['api', 'floors']
            }
          }
        },
        {
          name: 'List Offices',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/api/offices',
              host: ['{{baseUrl}}'],
              path: ['api', 'offices']
            }
          }
        },
        {
          name: 'Create Office',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                FloorID: 1,
                OfficeTypeID: 1,
                OfficeNumber: 'OFF-305',
                OfficeName: 'Executive Suite 305',
                SquareMeters: 85.5,
                MaxOccupancy: 10,
                MonthlyRentAmount: 45000,
                AvailabilityStatus: 'VACANT',
                IsActive: 1
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/offices',
              host: ['{{baseUrl}}'],
              path: ['api', 'offices']
            }
          }
        },
        {
          name: 'Update Office Status',
          request: {
            method: 'PATCH',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                status: 'OCCUPIED'
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/offices/{{officeId}}/status',
              host: ['{{baseUrl}}'],
              path: ['api', 'offices', '{{officeId}}', 'status']
            }
          }
        },
        {
          name: 'List Locations',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/api/locations',
              host: ['{{baseUrl}}'],
              path: ['api', 'locations']
            }
          }
        },
        {
          name: 'Create Location',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                BusinessParkID: 1,
                LocationCode: 'LOC-PARK-01',
                LocationName: 'Main Campus East Courtyard',
                LocationType: 'CAMPUS',
                IsActive: 1
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/locations',
              host: ['{{baseUrl}}'],
              path: ['api', 'locations']
            }
          }
        },
        {
          name: 'List Facility Zones',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/api/facility-zones',
              host: ['{{baseUrl}}'],
              path: ['api', 'facility-zones']
            }
          }
        },
        {
          name: 'Get Buildings in Zone',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/api/facility-zones/{{facilityZoneId}}/buildings',
              host: ['{{baseUrl}}'],
              path: ['api', 'facility-zones', '{{facilityZoneId}}', 'buildings']
            }
          }
        },
        {
          name: 'Get Floor Plan By Floor ID',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/api/floor-plans/floor/{{floorId}}',
              host: ['{{baseUrl}}'],
              path: ['api', 'floor-plans', 'floor', '{{floorId}}']
            }
          }
        }
      ]
    },

    // ═════════════════════════════════════════════════════════════════
    // MODULE 4: TENANT ORGANIZATIONS & SPACE ALLOCATIONS
    // ═════════════════════════════════════════════════════════════════
    {
      name: '4. Tenant Management',
      item: [
        {
          name: 'List Tenants',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/api/tenants',
              host: ['{{baseUrl}}'],
              path: ['api', 'tenants']
            }
          }
        },
        {
          name: 'Get Tenant Dashboard Metrics',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/api/tenants/metrics',
              host: ['{{baseUrl}}'],
              path: ['api', 'tenants', 'metrics']
            }
          }
        },
        {
          name: 'Get Tenant By ID',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/api/tenants/{{tenantId}}',
              host: ['{{baseUrl}}'],
              path: ['api', 'tenants', '{{tenantId}}']
            }
          }
        },
        {
          name: 'Create Tenant Organization',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                BusinessParkID: 1,
                TenantTypeID: 1,
                TenantCode: 'TNT-SOLUTIONS-01',
                CompanyName: 'Apex Tech Solutions PLC',
                RegistrationNumber: 'REG-ETH-2026-99',
                TaxIdentificationNo: 'TIN-0099887766',
                Status: 'ACTIVE',
                Website: 'https://apexsolutions.et',
                IsActive: 1
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/tenants',
              host: ['{{baseUrl}}'],
              path: ['api', 'tenants']
            }
          }
        },
        {
          name: 'Update Tenant Status',
          request: {
            method: 'PATCH',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                Status: 'ACTIVE'
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/tenants/{{tenantId}}/status',
              host: ['{{baseUrl}}'],
              path: ['api', 'tenants', '{{tenantId}}', 'status']
            }
          }
        },
        {
          name: 'List Sub-Tenants',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/api/sub-tenants',
              host: ['{{baseUrl}}'],
              path: ['api', 'sub-tenants']
            }
          }
        },
        {
          name: 'Create Sub-Tenant',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                ParentTenantID: 1,
                CompanyName: 'Apex Cloud Services (Subsidiary)',
                RelationshipType: 'SUBSIDIARY',
                Status: 'ACTIVE',
                IsActive: 1
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/sub-tenants',
              host: ['{{baseUrl}}'],
              path: ['api', 'sub-tenants']
            }
          }
        },
        {
          name: 'List Tenant Contacts',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/api/tenant-contacts',
              host: ['{{baseUrl}}'],
              path: ['api', 'tenant-contacts']
            }
          }
        },
        {
          name: 'Create Tenant Contact',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                TenantID: 1,
                ContactType: 'EMAIL',
                Label: 'Primary Operational Support',
                ContactValue: 'ops@apexsolutions.et',
                IsPrimary: 1,
                IsActive: 1
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/tenant-contacts',
              host: ['{{baseUrl}}'],
              path: ['api', 'tenant-contacts']
            }
          }
        },
        {
          name: 'List Tenant Addresses',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/api/tenant-addresses',
              host: ['{{baseUrl}}'],
              path: ['api', 'tenant-addresses']
            }
          }
        },
        {
          name: 'Create Tenant Address',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                TenantID: 1,
                AddressType: 'LEGAL',
                Country: 'Ethiopia',
                City: 'Addis Ababa',
                AddressLine1: 'Bole Subcity, IT Park Road',
                IsActive: 1
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/tenant-addresses',
              host: ['{{baseUrl}}'],
              path: ['api', 'tenant-addresses']
            }
          }
        },
        {
          name: 'List Leases',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/api/leases',
              host: ['{{baseUrl}}'],
              path: ['api', 'leases']
            }
          }
        },
        {
          name: 'Get Leases Expiring Soon',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/api/leases/expiring-soon',
              host: ['{{baseUrl}}'],
              path: ['api', 'leases', 'expiring-soon']
            }
          }
        },
        {
          name: 'Create Lease Agreement',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                TenantID: 1,
                AgreementNumber: 'LSE-2026-APEX-01',
                StartDate: '2026-01-01',
                EndDate: '2027-12-31',
                ExecutionDate: '2025-12-15',
                MonthlyRentAmount: 50000.0,
                SecurityDepositAmount: 150000.0,
                CurrencyCode: 'ETB',
                GracePeriodDays: 5,
                Status: 'ACTIVE',
                IsActive: 1
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/leases',
              host: ['{{baseUrl}}'],
              path: ['api', 'leases']
            }
          }
        },
        {
          name: 'List Office Allocations',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/api/office-allocations',
              host: ['{{baseUrl}}'],
              path: ['api', 'office-allocations']
            }
          }
        },
        {
          name: 'Allocate Office Space',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                TenantID: 1,
                AllocationScope: 'OFFICE',
                OfficeSpaceID: 1,
                AllocatedDate: '2026-01-01',
                IsActive: 1
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/office-allocations',
              host: ['{{baseUrl}}'],
              path: ['api', 'office-allocations']
            }
          }
        },
        {
          name: 'Release Office Allocation',
          request: {
            method: 'PATCH',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                Remarks: 'Office vacated following scheduled tenancy expansion'
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/office-allocations/{{allocationId}}/release',
              host: ['{{baseUrl}}'],
              path: ['api', 'office-allocations', '{{allocationId}}', 'release']
            }
          }
        }
      ]
    },

    // ═════════════════════════════════════════════════════════════════
    // MODULE 5: ORGANIZATIONAL STRUCTURE & STAFF MANAGEMENT
    // ═════════════════════════════════════════════════════════════════
    {
      name: '5. Organizational Structure',
      item: [
        {
          name: 'List Departments',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/api/departments',
              host: ['{{baseUrl}}'],
              path: ['api', 'departments']
            }
          }
        },
        {
          name: 'Get Department By ID',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/api/departments/{{departmentId}}',
              host: ['{{baseUrl}}'],
              path: ['api', 'departments', '{{departmentId}}']
            }
          }
        },
        {
          name: 'Create Department',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                DepartmentCode: 'DEPT-ENG',
                DepartmentName: 'Network & Telecommunications Engineering',
                ManagerUserID: 1,
                IsActive: 1
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/departments',
              host: ['{{baseUrl}}'],
              path: ['api', 'departments']
            }
          }
        },
        {
          name: 'Get Department Locations',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/api/departments/{{departmentId}}/locations',
              host: ['{{baseUrl}}'],
              path: ['api', 'departments', '{{departmentId}}', 'locations']
            }
          }
        },
        {
          name: 'List Teams',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/api/teams',
              host: ['{{baseUrl}}'],
              path: ['api', 'teams']
            }
          }
        },
        {
          name: 'Get Team Workload Summary',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/api/teams/workload-summary',
              host: ['{{baseUrl}}'],
              path: ['api', 'teams', 'workload-summary']
            }
          }
        },
        {
          name: 'Get Eligible Technicians',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/api/teams/eligible-technicians',
              host: ['{{baseUrl}}'],
              path: ['api', 'teams', 'eligible-technicians']
            }
          }
        },
        {
          name: 'Create Team',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                DepartmentID: 1,
                TeamCode: 'TEAM-FIBER',
                TeamName: 'Fiber Optics Rapid Response',
                LeaderUserID: 5,
                IsActive: 1
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/teams',
              host: ['{{baseUrl}}'],
              path: ['api', 'teams']
            }
          }
        },
        {
          name: 'Get Team Members',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/api/teams/{{teamId}}/members',
              host: ['{{baseUrl}}'],
              path: ['api', 'teams', '{{teamId}}', 'members']
            }
          }
        },
        {
          name: 'Add Team Member',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                UserID: 5,
                MemberRoleCode: 'PRIMARY_TECHNICIAN'
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/teams/{{teamId}}/members',
              host: ['{{baseUrl}}'],
              path: ['api', 'teams', '{{teamId}}', 'members']
            }
          }
        },
        {
          name: 'List Positions',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/api/positions',
              host: ['{{baseUrl}}'],
              path: ['api', 'positions']
            }
          }
        },
        {
          name: 'Create Position',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                PositionCode: 'POS-NET-ENG',
                PositionTitle: 'Lead Fiber Network Engineer',
                Description: 'Responsible for core campus backbone uptime',
                IsActive: 1
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/positions',
              host: ['{{baseUrl}}'],
              path: ['api', 'positions']
            }
          }
        },
        {
          name: 'List Employee Assignments',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/api/employee-assignments',
              host: ['{{baseUrl}}'],
              path: ['api', 'employee-assignments']
            }
          }
        },
        {
          name: 'Create Employee Assignment',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                UserID: 5,
                DepartmentID: 1,
                PositionID: 1,
                IsPrimary: 1,
                JoinedDate: '2026-01-15',
                IsActive: 1
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/employee-assignments',
              host: ['{{baseUrl}}'],
              path: ['api', 'employee-assignments']
            }
          }
        },
        {
          name: 'List Reporting Hierarchies',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/api/reporting-hierarchies',
              host: ['{{baseUrl}}'],
              path: ['api', 'reporting-hierarchies']
            }
          }
        },
        {
          name: 'Create Reporting Hierarchy',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                EmployeeUserID: 5,
                SupervisorUserID: 1,
                ReportingTypeCode: 'DIRECT',
                IsActive: 1
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/reporting-hierarchies',
              host: ['{{baseUrl}}'],
              path: ['api', 'reporting-hierarchies']
            }
          }
        },
        {
          name: 'List Cost Centers',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/api/financials/cost-centers',
              host: ['{{baseUrl}}'],
              path: ['api', 'financials', 'cost-centers']
            }
          }
        },
        {
          name: 'Create Cost Center',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                CostCenterCode: 'CC-FAC-01',
                CostCenterName: 'Facility Maintenance OPEX',
                Description: 'General campus maintenance cost center',
                IsActive: 1
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/financials/cost-centers',
              host: ['{{baseUrl}}'],
              path: ['api', 'financials', 'cost-centers']
            }
          }
        },
        {
          name: 'List Department Budgets',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/api/financials/budgets',
              host: ['{{baseUrl}}'],
              path: ['api', 'financials', 'budgets']
            }
          }
        },
        {
          name: 'Create Department Budget',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                DepartmentID: 1,
                CostCenterID: 1,
                FiscalYear: 2026,
                AllocatedAmount: 500000.0,
                CurrencyCode: 'ETB',
                IsActive: 1
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/financials/budgets',
              host: ['{{baseUrl}}'],
              path: ['api', 'financials', 'budgets']
            }
          }
        }
      ]
    }
  ]
};

const outputDir = path.resolve(__dirname, '../docs/postman');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const outputPath = path.join(outputDir, 'ITMS_Modules_1_to_5.postman_collection.json');
fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2), 'utf-8');
console.log(`✅ Generated Postman Collection at: ${outputPath}`);
