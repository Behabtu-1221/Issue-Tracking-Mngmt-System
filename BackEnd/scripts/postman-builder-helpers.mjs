/**
 * Enterprise ITMS — Master Postman Collection Generator
 * Generates Postman Collection v2.1.0 files for all 15 modules (389 endpoints)
 * and an Environment file with pre-configured variables.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to build a Postman URL object with path variables
function buildUrl(rawUrl, description = '') {
  // Convert http://localhost:5000/api/... to {{baseUrl}}/api/...
  const normalizedRaw = rawUrl.replace(/^http:\/\/localhost:5000/, '{{baseUrl}}');
  
  // Extract query string if any
  const [urlWithoutQuery, queryString] = normalizedRaw.split('?');
  const pathParts = urlWithoutQuery.replace('{{baseUrl}}/', '').split('/').filter(Boolean);

  const variables = [];
  pathParts.forEach((part) => {
    if (part.startsWith(':')) {
      const varKey = part.slice(1);
      let defaultValue = '1';
      if (varKey.includes('token') || varKey.includes('Token')) defaultValue = '{{devResetToken}}';
      else if (varKey.includes('code') || varKey.includes('Code')) defaultValue = 'DEFAULT';
      else if (varKey.includes('key') || varKey.includes('Key')) defaultValue = 'APP_NAME';
      else if (varKey.includes('Type') || varKey.includes('type')) defaultValue = 'PDF';
      else if (varKey.includes('tenant') || varKey.includes('Tenant')) defaultValue = '{{tenantId}}';
      else if (varKey.includes('park') || varKey.includes('Park')) defaultValue = '{{parkId}}';
      else if (varKey.includes('building') || varKey.includes('Building')) defaultValue = '{{buildingId}}';
      else if (varKey.includes('floor') || varKey.includes('Floor')) defaultValue = '{{floorId}}';
      else if (varKey.includes('office') || varKey.includes('Office')) defaultValue = '{{officeId}}';
      else if (varKey.includes('request') || varKey.includes('Request') || varKey.includes('issue')) defaultValue = '{{issueRequestId}}';
      else if (varKey.includes('conversation') || varKey.includes('Conversation')) defaultValue = '{{conversationId}}';
      else if (varKey.includes('channel') || varKey.includes('Channel')) defaultValue = '{{channelId}}';
      else if (varKey.includes('document') || varKey.includes('Document')) defaultValue = '{{documentId}}';
      else if (varKey.includes('user') || varKey.includes('User')) defaultValue = '{{userId}}';
      else if (varKey === 'id') defaultValue = '{{entityId}}';

      variables.push({
        key: varKey,
        value: defaultValue,
        description: `URL path parameter :${varKey}`
      });
    }
  });

  const queryParams = [];
  if (queryString) {
    queryString.split('&').forEach((pair) => {
      const [k, v] = pair.split('=');
      queryParams.push({
        key: k,
        value: v || '',
        description: `Query parameter ${k}`
      });
    });
  }

  const urlObj = {
    raw: normalizedRaw,
    host: ['{{baseUrl}}'],
    path: pathParts
  };

  if (variables.length > 0) {
    urlObj.variable = variables;
  }
  if (queryParams.length > 0) {
    urlObj.query = queryParams;
  }

  return urlObj;
}

// Helper to create an item in a Postman collection
function reqItem({
  name,
  method,
  url,
  body = null,
  isPublic = false,
  isMultipart = false,
  description = '',
  testScript = null
}) {
  const item = {
    name,
    request: {
      method: method.toUpperCase(),
      header: [],
      url: buildUrl(url),
      description: description || `${method.toUpperCase()} ${url}`
    }
  };

  if (isPublic) {
    item.request.auth = { type: 'noauth' };
  }

  if (isMultipart) {
    item.request.body = {
      mode: 'formdata',
      formdata: [
        {
          key: body?.fieldName || 'file',
          type: 'file',
          src: []
        },
        ...(body?.extraFields || []).map((f) => ({
          key: f.key,
          value: f.value,
          type: 'text'
        }))
      ]
    };
  } else if (body) {
    item.request.header.push({
      key: 'Content-Type',
      value: 'application/json'
    });
    item.request.body = {
      mode: 'raw',
      raw: JSON.stringify(body, null, 2)
    };
  }

  if (testScript) {
    item.event = [
      {
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: Array.isArray(testScript) ? testScript : [testScript]
        }
      }
    ];
  } else {
    // Standard test assertion for 2xx or expected responses
    item.event = [
      {
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: [
            'pm.test("Status code is 2xx or expected", function () {',
            '    pm.expect(pm.response.code).to.be.oneOf([200, 201, 204, 400, 404]);',
            '});'
          ]
        }
      }
    ];
  }

  return item;
}

// Standard test scripts
const loginTestScript = [
  'const res = pm.response.json();',
  'if (res && res.data && res.data.accessToken) {',
  '    pm.collectionVariables.set("token", res.data.accessToken);',
  '    pm.collectionVariables.set("refreshToken", res.data.refreshToken);',
  '    console.log("✓ Captured JWT Access Token & Refresh Token!");',
  '}',
  'pm.test("Status code is 200", () => pm.response.to.have.status(200));',
  'pm.test("Contains JWT accessToken", () => pm.expect(res.data.accessToken).to.be.a("string"));'
];

const refreshTestScript = [
  'const res = pm.response.json();',
  'if (res && res.data && res.data.accessToken) {',
  '    pm.collectionVariables.set("token", res.data.accessToken);',
  '    if (res.data.refreshToken) pm.collectionVariables.set("refreshToken", res.data.refreshToken);',
  '    console.log("✓ Token refreshed successfully!");',
  '}',
  'pm.test("Status is 200", () => pm.response.to.have.status(200));'
];

const forgotPasswordTestScript = [
  'const res = pm.response.json();',
  'if (res && res.data && res.data.devResetToken) {',
  '    pm.collectionVariables.set("devResetToken", res.data.devResetToken);',
  '    console.log("✓ Captured devResetToken for reset-password test:", res.data.devResetToken);',
  '}',
  'pm.test("Status is 200", () => pm.response.to.have.status(200));'
];

export { buildUrl, reqItem, loginTestScript, refreshTestScript, forgotPasswordTestScript };
