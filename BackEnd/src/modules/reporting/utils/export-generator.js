/**
 * Export Generator Utility for Module 15: Analysis & Reporting Management
 * Standardized generation of CSV, structured Excel-compatible spreadsheets, and printable payload formats.
 */

/**
 * Escapes a cell value for CSV output in accordance with RFC-4180.
 */
function escapeCSVCell(val) {
  if (val === null || val === undefined) return '';
  if (val instanceof Date) return val.toISOString();
  let str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates standard UTF-8 encoded CSV string with BOM for universal Excel compatibility.
 */
export function generateCSV(columns, rows) {
  const headerLine = columns.map(c => escapeCSVCell(c.label || c.key)).join(',');
  const dataLines = rows.map(row => {
    return columns.map(c => escapeCSVCell(row[c.key])).join(',');
  });

  const BOM = '\uFEFF';
  return BOM + [headerLine, ...dataLines].join('\r\n');
}

/**
 * Generates an XML-based Spreadsheet / HTML Table formatted for Microsoft Excel (.xlsx / .xls).
 */
export function generateExcelHTML(title, columns, rows, summaryStats = null) {
  let statsHTML = '';
  if (summaryStats && typeof summaryStats === 'object') {
    statsHTML = `
      <table style="margin-bottom: 20px; border-collapse: collapse; font-family: Arial, sans-serif;">
        <tr style="background-color: #f1f5f9; font-weight: bold;">
          <th colspan="2" style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Report Summary & Key Performance Indicators</th>
        </tr>
        ${Object.entries(summaryStats).map(([k, v]) => `
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 6px 12px; font-weight: 600; color: #475569;">${k}</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px 12px; color: #0f172a;">${v}</td>
          </tr>
        `).join('')}
      </table>
    `;
  }

  const tableHeader = columns.map(c => `
    <th style="background-color: #1e293b; color: #ffffff; padding: 10px 14px; border: 1px solid #334155; font-weight: bold; text-align: left;">
      ${c.label || c.key}
    </th>
  `).join('');

  const tableRows = rows.map((row, idx) => {
    const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
    const cells = columns.map(c => {
      const raw = row[c.key];
      const display = raw === null || raw === undefined ? '' : String(raw);
      return `<td style="border: 1px solid #e2e8f0; padding: 8px 12px; font-size: 13px; color: #1e293b;">${display}</td>`;
    }).join('');
    return `<tr style="background-color: ${bg};">${cells}</tr>`;
  }).join('');

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        table { border-collapse: collapse; width: 100%; }
        h2 { color: #0f172a; font-family: 'Segoe UI', sans-serif; margin-bottom: 4px; }
        .meta { color: #64748b; font-size: 12px; margin-bottom: 16px; }
      </style>
    </head>
    <body>
      <h2>${title}</h2>
      <div class="meta">Generated: ${new Date().toLocaleString()} | Business Park Issue Tracking Management System</div>
      ${statsHTML}
      <table>
        <thead>
          <tr>${tableHeader}</tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </body>
    </html>
  `;
}

export default {
  generateCSV,
  generateExcelHTML
};
