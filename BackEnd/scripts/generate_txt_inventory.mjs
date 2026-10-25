import fs from 'fs';
import path from 'path';

const master = JSON.parse(fs.readFileSync('docs/postman/ITMS_ALL_416_ENDPOINTS.postman_collection.json', 'utf8'));

let lines = [];
lines.push('========================================================================================================================');
lines.push('ENTERPRISE ISSUE TRACKING MANAGEMENT SYSTEM (ITMS) — COMPLETE MASTER API INVENTORY (416 ENDPOINTS)');
lines.push('BASE URL : http://localhost:5000');
lines.push('FORMAT   : [INDEX] [METHOD] (LEFT)                    | [FULL URL] (RIGHT)');
lines.push('========================================================================================================================\n');

let counter = 0;

function walk(folder, depth = 0) {
  if (folder.name && folder.item && depth <= 1) {
    lines.push('\n# ' + '-'.repeat(118));
    lines.push('# ' + folder.name.toUpperCase());
    lines.push('# ' + '-'.repeat(118));
  }

  if (folder.item) {
    for (const child of folder.item) {
      if (child.request) {
        counter++;
        const method = child.request.method.padEnd(7);
        let rawUrl = child.request.url.raw || '';
        rawUrl = rawUrl.replace('{{baseUrl}}', 'http://localhost:5000');
        const num = counter.toString().padStart(3, '0');
        lines.push(`${num}. ${method} ${rawUrl}`);
      } else {
        walk(child, depth + 1);
      }
    }
  }
}

for (const mod of master.item) {
  walk(mod, 0);
}

fs.writeFileSync('docs/ITMS_ALL_416_ENDPOINTS_METHOD_AND_URL.txt', lines.join('\n') + '\n', 'utf8');
console.log('Successfully generated docs/ITMS_ALL_416_ENDPOINTS_METHOD_AND_URL.txt with', counter, 'endpoints!');
