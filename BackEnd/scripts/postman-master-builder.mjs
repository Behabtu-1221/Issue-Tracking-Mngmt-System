import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  reqItem,
  loginTestScript,
  refreshTestScript,
  forgotPasswordTestScript
} from './postman-builder-helpers.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Common Collection Variables
const commonVariables = [
  { key: 'baseUrl', value: 'http://localhost:5000', type: 'string' },
  { key: 'token', value: '', type: 'string' },
  { key: 'refreshToken', value: '', type: 'string' },
  { key: 'devResetToken', value: '', type: 'string' },
  { key: 'entityId', value: '1', type: 'string' },
  { key: 'userId', value: '1', type: 'string' },
  { key: 'roleId', value: '1', type: 'string' },
  { key: 'parkId', value: '1', type: 'string' },
  { key: 'buildingId', value: '1', type: 'string' },
  { key: 'floorId', value: '1', type: 'string' },
  { key: 'officeId', value: '1', type: 'string' },
  { key: 'locationId', value: '1', type: 'string' },
  { key: 'facilityZoneId', value: '1', type: 'string' },
  { key: 'floorPlanId', value: '1', type: 'string' },
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
  { key: 'budgetId', value: '1', type: 'string' },
  { key: 'categoryId', value: '1', type: 'string' },
  { key: 'serviceId', value: '1', type: 'string' },
  { key: 'mappingId', value: '1', type: 'string' },
  { key: 'issueRequestId', value: '1', type: 'string' },
  { key: 'commentId', value: '1', type: 'string' },
  { key: 'investigationId', value: '1', type: 'string' },
  { key: 'resolutionId', value: '1', type: 'string' },
  { key: 'approvalId', value: '1', type: 'string' },
  { key: 'delegationId', value: '1', type: 'string' },
  { key: 'approvalRuleId', value: '1', type: 'string' },
  { key: 'approvalGroupId', value: '1', type: 'string' },
  { key: 'dispatchId', value: '1', type: 'string' },
  { key: 'slaPolicyId', value: '1', type: 'string' },
  { key: 'conversationId', value: '1', type: 'string' },
  { key: 'channelId', value: '1', type: 'string' },
  { key: 'messageId', value: '1', type: 'string' },
  { key: 'announcementId', value: '1', type: 'string' },
  { key: 'notificationId', value: '1', type: 'string' },
  { key: 'templateId', value: '1', type: 'string' },
  { key: 'reminderId', value: '1', type: 'string' },
  { key: 'documentId', value: '1', type: 'string' },
  { key: 'reportId', value: '1', type: 'string' },
  { key: 'scheduleId', value: '1', type: 'string' },
  { key: 'settingId', value: '1', type: 'string' },
  { key: 'flagId', value: '1', type: 'string' },
  { key: 'ruleId', value: '1', type: 'string' },
  { key: 'sequenceId', value: '1', type: 'string' },
  { key: 'lookupTypeId', value: '1', type: 'string' },
  { key: 'lookupValueId', value: '1', type: 'string' },
  { key: 'calendarId', value: '1', type: 'string' },
  { key: 'workingHourId', value: '1', type: 'string' },
  { key: 'holidayId', value: '1', type: 'string' },
  { key: 'localizationId', value: '1', type: 'string' },
  { key: 'resourceId', value: '1', type: 'string' }
];

// Helper to build a Postman Collection wrapper
function buildCollection(name, description, items) {
  return {
    info: {
      name,
      description,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    },
    variable: commonVariables,
    auth: {
      type: 'bearer',
      bearer: [{ key: 'token', value: '{{token}}', type: 'string' }]
    },
    item: items
  };
}

console.log('Postman master suite builder initialized.');
export { buildCollection, commonVariables };
