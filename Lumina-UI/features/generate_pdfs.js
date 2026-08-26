const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

async function renderPdfs() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const pricingMd = fs.readFileSync(path.join(__dirname, 'pricing_schedule_2026.md'), 'utf-8');
  const postOpMd = fs.readFileSync(path.join(__dirname, 'post_op_care_guidelines.md'), 'utf-8');

  function mdToHtml(md, title) {
    const lines = md.split('\n');
    let html = '';
    let inTable = false;

    for (let line of lines) {
      if (line.startsWith('# ')) {
        if (inTable) { html += '</table>'; inTable = false; }
        html += `<h1 class="doc-title">${line.replace('# ', '')}</h1>`;
      } else if (line.startsWith('## ')) {
        if (inTable) { html += '</table>'; inTable = false; }
        html += `<h2 class="section-title">${line.replace('## ', '')}</h2>`;
      } else if (line.startsWith('### ')) {
        if (inTable) { html += '</table>'; inTable = false; }
        html += `<h3 class="sub-title">${line.replace('### ', '')}</h3>`;
      } else if (line.startsWith('|') && line.includes('---')) {
        // delimiter line
        continue;
      } else if (line.startsWith('|')) {
        if (!inTable) {
          html += '<table>';
          inTable = true;
          const cells = line.split('|').filter(c => c.trim() !== '');
          html += '<thead><tr>' + cells.map(c => `<th>${c.trim()}</th>`).join('') + '</tr></thead><tbody>';
        } else {
          const cells = line.split('|').filter(c => c.trim() !== '');
          html += '<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
        }
      } else {
        if (inTable) { html += '</tbody></table>'; inTable = false; }
        if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
          let content = line.trim().replace(/^[\*\-] /, '');
          content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          content = content.replace(/`([^`]+)`/g, '<code>$1</code>');
          html += `<li>${content}</li>`;
        } else if (/^\d+\. /.test(line.trim())) {
          let content = line.trim().replace(/^\d+\. /, '');
          content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          content = content.replace(/`([^`]+)`/g, '<code>$1</code>');
          html += `<li>${content}</li>`;
        } else if (line.trim() === '---') {
          html += '<hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;" />';
        } else if (line.trim().length > 0) {
          let content = line;
          content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          content = content.replace(/`([^`]+)`/g, '<code>$1</code>');
          html += `<p>${content}</p>`;
        }
      }
    }
    if (inTable) html += '</tbody></table>';

    return `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap');
        body {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #1e293b;
          line-height: 1.5;
          padding: 20px;
          font-size: 11px;
          background: #ffffff;
        }
        .header-brand {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #0d9488;
          padding-bottom: 10px;
          margin-bottom: 16px;
        }
        .clinic-name {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
        }
        .clinic-badge {
          background: #f0fdfa;
          color: #0f766e;
          border: 1px solid #ccfbf1;
          padding: 3px 8px;
          border-radius: 9999px;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
        }
        .doc-title {
          font-family: 'Playfair Display', serif;
          font-size: 16px;
          font-weight: 800;
          color: #0f172a;
          margin: 10px 0 6px 0;
        }
        .section-title {
          font-size: 13px;
          font-weight: 700;
          color: #0f766e;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 4px;
          margin-top: 14px;
          margin-bottom: 6px;
        }
        .sub-title {
          font-size: 11.5px;
          font-weight: 700;
          color: #334155;
          margin-top: 10px;
          margin-bottom: 4px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 8px 0 12px 0;
          page-break-inside: avoid;
        }
        th {
          background-color: #0f766e;
          color: #ffffff;
          text-align: left;
          padding: 6px 10px;
          font-size: 10px;
          font-weight: 700;
          border: 1px solid #0d9488;
        }
        td {
          padding: 6px 10px;
          border: 1px solid #e2e8f0;
          font-size: 10px;
        }
        tr:nth-child(even) {
          background-color: #f8fafc;
        }
        p {
          margin: 4px 0;
        }
        li {
          margin-bottom: 3px;
        }
        code {
          background: #f1f5f9;
          color: #0d9488;
          padding: 1px 4px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
        }
        .footer {
          margin-top: 24px;
          border-top: 1px solid #e2e8f0;
          padding-top: 8px;
          font-size: 9px;
          color: #64748b;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="header-brand">
        <div>
          <div class="clinic-name">LUMINA DENTAL STUDIO</div>
          <div style="font-size: 9.5px; color: #64748b;">Clinical Operations & Patient Care Standard (2026)</div>
        </div>
        <div class="clinic-badge">Official Clinical SOP Document</div>
      </div>
      ${html}
      <div class="footer">
        Lumina Dental Studio • Bonifacio Global City • Ortigas Center • Alabang Town Center • 24/7 Care Hotline: (02) 8888-LUMI (5864)
      </div>
    </body>
    </html>`;
  }

  // 1. Generate pricing_schedule_2026.pdf
  await page.setContent(mdToHtml(pricingMd, 'Lumina Dental Studio — Pricing Schedule 2026'));
  await page.pdf({
    path: path.join(__dirname, 'pricing_schedule_2026.pdf'),
    format: 'A4',
    printBackground: true,
    margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' }
  });
  console.log('Successfully generated pricing_schedule_2026.pdf');

  // 2. Generate post_op_care_guidelines.pdf
  await page.setContent(mdToHtml(postOpMd, 'Lumina Dental Studio — Post-Op Care Guidelines 2026'));
  await page.pdf({
    path: path.join(__dirname, 'post_op_care_guidelines.pdf'),
    format: 'A4',
    printBackground: true,
    margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' }
  });
  console.log('Successfully generated post_op_care_guidelines.pdf');

  await browser.close();
}

renderPdfs();
