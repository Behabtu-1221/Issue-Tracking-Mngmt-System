import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildCollection, commonVariables } from './postman-master-builder.mjs';
import { getFullModules1To5 } from './postman-modules-1-to-5-full.mjs';
import { getModules6To10 } from './postman-modules-6-to-10.mjs';
import { getModules11To15 } from './postman-modules-11-to-15.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.resolve(__dirname, '../docs/postman');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Helper to count total requests recursively
function countRequests(items) {
  let count = 0;
  for (const item of items) {
    if (item.request) {
      count++;
    }
    if (item.item && Array.isArray(item.item)) {
      count += countRequests(item.item);
    }
  }
  return count;
}

console.log('🔄 Loading and assembling Postman suites...');

const mod1to5Items = getFullModules1To5();
const mod6to10Items = getModules6To10();
const mod11to15Items = getModules11To15();

const count1to5 = countRequests(mod1to5Items);
const count6to10 = countRequests(mod6to10Items);
const count11to15 = countRequests(mod11to15Items);
const masterItems = [...mod1to5Items, ...mod6to10Items, ...mod11to15Items];
const masterCount = countRequests(masterItems);

console.log(`📊 Endpoint Counts:`);
console.log(` - Modules 1 to 5:   ${count1to5} endpoints`);
console.log(` - Modules 6 to 10:  ${count6to10} endpoints`);
console.log(` - Modules 11 to 15: ${count11to15} endpoints`);
console.log(` ---------------------------------------------`);
console.log(` 🌟 MASTER TOTAL:    ${masterCount} endpoints`);

// 1. Build Master Collection (All 416 Endpoints)
const masterCollection = buildCollection(
  'Enterprise ITMS — Complete Master API Test Suite (All 416 Endpoints)',
  'Comprehensive Postman Collection covering all 15 enterprise modules of the Issue Tracking Management System (ITMS).\n\nIncludes 416 verified endpoints with pre-configured Bearer Auth, dynamic variable interpolation, realistic sample payloads, and test assertions.\n\nBase URL: http://localhost:5000',
  masterItems
);
const masterPath = path.join(outputDir, 'ITMS_ALL_416_ENDPOINTS.postman_collection.json');
fs.writeFileSync(masterPath, JSON.stringify(masterCollection, null, 2), 'utf8');
console.log(`✅ Saved Master Collection: ${masterPath}`);

// 2. Build Modules 1 to 5 Collection
const collection1to5 = buildCollection(
  'Enterprise ITMS — Modules 1 to 5 Postman Inventory (Core Foundation)',
  'Covers Modules 1 to 5: Health & Diagnostics, Identity & Access (Auth, Users, Roles), Business Park & Infrastructure, Tenant Management, and Organization Structure & Staff.',
  mod1to5Items
);
const path1to5 = path.join(outputDir, 'ITMS_Modules_1_to_5.postman_collection.json');
fs.writeFileSync(path1to5, JSON.stringify(collection1to5, null, 2), 'utf8');
console.log(`✅ Saved Modules 1 to 5: ${path1to5}`);

// 3. Build Modules 6 to 10 Collection
const collection6to10 = buildCollection(
  'Enterprise ITMS — Modules 6 to 10 Postman Inventory (Operations Core)',
  'Covers Modules 6 to 10: Service Catalog & Category Mappings, Issue Requests & Ticket Lifecycle, Technical Workbench & Investigations, Dispatch & SLA Automation, and Governance & Approvals.',
  mod6to10Items
);
const path6to10 = path.join(outputDir, 'ITMS_Modules_6_to_10.postman_collection.json');
fs.writeFileSync(path6to10, JSON.stringify(collection6to10, null, 2), 'utf8');
console.log(`✅ Saved Modules 6 to 10: ${path6to10}`);

// 4. Build Modules 11 to 15 Collection
const collection11to15 = buildCollection(
  'Enterprise ITMS — Modules 11 to 15 Postman Inventory (Enterprise Services)',
  'Covers Modules 11 to 15: Communication & Collaboration, Notifications & Alerts, File & Document Management, Reporting & Analytics, and Configuration Management.',
  mod11to15Items
);
const path11to15 = path.join(outputDir, 'ITMS_Modules_11_to_15.postman_collection.json');
fs.writeFileSync(path11to15, JSON.stringify(collection11to15, null, 2), 'utf8');
console.log(`✅ Saved Modules 11 to 15: ${path11to15}`);

// 5. Build Environment JSON file
const environment = {
  id: 'itms-local-dev-env',
  name: 'ITMS Local Dev Environment',
  values: [
    { key: 'baseUrl', value: 'http://localhost:5000', type: 'default', enabled: true },
    { key: 'token', value: '', type: 'secret', enabled: true },
    { key: 'refreshToken', value: '', type: 'secret', enabled: true },
    { key: 'devResetToken', value: '', type: 'default', enabled: true },
    { key: 'entityId', value: '1', type: 'default', enabled: true },
    { key: 'userId', value: '1', type: 'default', enabled: true },
    { key: 'roleId', value: '1', type: 'default', enabled: true },
    { key: 'parkId', value: '1', type: 'default', enabled: true },
    { key: 'buildingId', value: '1', type: 'default', enabled: true },
    { key: 'floorId', value: '1', type: 'default', enabled: true },
    { key: 'officeId', value: '1', type: 'default', enabled: true },
    { key: 'locationId', value: '1', type: 'default', enabled: true },
    { key: 'facilityZoneId', value: '1', type: 'default', enabled: true },
    { key: 'floorPlanId', value: '1', type: 'default', enabled: true },
    { key: 'tenantId', value: '1', type: 'default', enabled: true },
    { key: 'subTenantId', value: '1', type: 'default', enabled: true },
    { key: 'contactId', value: '1', type: 'default', enabled: true },
    { key: 'addressId', value: '1', type: 'default', enabled: true },
    { key: 'leaseId', value: '1', type: 'default', enabled: true },
    { key: 'allocationId', value: '1', type: 'default', enabled: true },
    { key: 'departmentId', value: '1', type: 'default', enabled: true },
    { key: 'teamId', value: '1', type: 'default', enabled: true },
    { key: 'positionId', value: '1', type: 'default', enabled: true },
    { key: 'assignmentId', value: '1', type: 'default', enabled: true },
    { key: 'hierarchyId', value: '1', type: 'default', enabled: true },
    { key: 'costCenterId', value: '1', type: 'default', enabled: true },
    { key: 'budgetId', value: '1', type: 'default', enabled: true },
    { key: 'categoryId', value: '1', type: 'default', enabled: true },
    { key: 'serviceId', value: '1', type: 'default', enabled: true },
    { key: 'mappingId', value: '1', type: 'default', enabled: true },
    { key: 'issueRequestId', value: '1', type: 'default', enabled: true },
    { key: 'commentId', value: '1', type: 'default', enabled: true },
    { key: 'investigationId', value: '1', type: 'default', enabled: true },
    { key: 'resolutionId', value: '1', type: 'default', enabled: true },
    { key: 'approvalId', value: '1', type: 'default', enabled: true },
    { key: 'delegationId', value: '1', type: 'default', enabled: true },
    { key: 'approvalRuleId', value: '1', type: 'default', enabled: true },
    { key: 'approvalGroupId', value: '1', type: 'default', enabled: true },
    { key: 'dispatchId', value: '1', type: 'default', enabled: true },
    { key: 'slaPolicyId', value: '1', type: 'default', enabled: true },
    { key: 'conversationId', value: '1', type: 'default', enabled: true },
    { key: 'channelId', value: '1', type: 'default', enabled: true },
    { key: 'messageId', value: '1', type: 'default', enabled: true },
    { key: 'announcementId', value: '1', type: 'default', enabled: true },
    { key: 'notificationId', value: '1', type: 'default', enabled: true },
    { key: 'templateId', value: '1', type: 'default', enabled: true },
    { key: 'reminderId', value: '1', type: 'default', enabled: true },
    { key: 'documentId', value: '1', type: 'default', enabled: true },
    { key: 'reportId', value: '1', type: 'default', enabled: true },
    { key: 'scheduleId', value: '1', type: 'default', enabled: true },
    { key: 'settingId', value: '1', type: 'default', enabled: true },
    { key: 'flagId', value: '1', type: 'default', enabled: true },
    { key: 'ruleId', value: '1', type: 'default', enabled: true },
    { key: 'sequenceId', value: '1', type: 'default', enabled: true },
    { key: 'lookupTypeId', value: '1', type: 'default', enabled: true },
    { key: 'lookupValueId', value: '1', type: 'default', enabled: true },
    { key: 'calendarId', value: '1', type: 'default', enabled: true },
    { key: 'workingHourId', value: '1', type: 'default', enabled: true },
    { key: 'holidayId', value: '1', type: 'default', enabled: true },
    { key: 'localizationId', value: '1', type: 'default', enabled: true },
    { key: 'resourceId', value: '1', type: 'default', enabled: true }
  ],
  _postman_variable_scope: 'environment'
};

const envPath = path.join(outputDir, 'ITMS_Local.postman_environment.json');
fs.writeFileSync(envPath, JSON.stringify(environment, null, 2), 'utf8');
console.log(`✅ Saved Environment File: ${envPath}`);

console.log('\n🎉 ALL POSTMAN ARTIFACTS GENERATED SUCCESSFULLY!');
