const axios = require('axios');
const XLSX = require('xlsx');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuration
const CONFIG = {
  softoneUrl: process.env.SOFTONE_URL,
  clientId: process.env.SOFTONE_CLIENT_ID,
  appId: parseInt(process.env.SOFTONE_APP_ID),
  reportObject: process.env.SOFTONE_REPORT_OBJECT,
  emailFrom: process.env.EMAIL_FROM,
  emailPassword: process.env.EMAIL_PASSWORD,
  smtpHost: process.env.SMTP_HOST,
  smtpPort: parseInt(process.env.SMTP_PORT),
  emailTo: process.env.EMAIL_TO || process.env.BOSS_EMAIL,
  timezone: 'Europe/Athens'
};

console.log('[INIT] SoftOne Daily Report Scheduler');
console.log(`[CONFIG] Report Object: ${CONFIG.reportObject}`);
console.log(`[CONFIG] Email: ${CONFIG.emailFrom} → ${CONFIG.emailTo}`);

// Step 1: Get Report Reference ID from SoftOne
async function getReportInfo() {
  try {
    console.log('[API] Calling GetReportInfo...');

    // Date filter for testing: 12 Nov 2025
    const filterDate = '2025-11-12';
    const filters = `FDATE=${filterDate};TDATE=${filterDate}`;

    console.log('[API] Using date filter:', filters);

    const response = await axios.post(CONFIG.softoneUrl, {
      service: 'getReportInfo',
      clientID: CONFIG.clientId,
      appId: CONFIG.appId,
      object: CONFIG.reportObject,
      list: '',
      filters: filters
    }, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('[API] Response status:', response.status);

    if (response.data.error) {
      throw new Error(`SoftOne API Error: ${response.data.error}`);
    }

    if (!response.data.reqID) {
      throw new Error('No reqID returned from GetReportInfo');
    }

    console.log(`[API] Got reqID: ${response.data.reqID}`);
    console.log(`[API] Total pages: ${response.data.pagenum || 1}`);

    return {
      reqID: response.data.reqID,
      pagenum: response.data.pagenum || 1
    };
  } catch (error) {
    console.error('[ERROR] GetReportInfo failed:', error.message);
    throw error;
  }
}

// Step 2: Get Report Data (HTML format) from SoftOne
async function getReportData(reqID, pagenum = 1) {
  try {
    console.log(`[API] Calling GetReportData (page ${pagenum})...`);
    
    const response = await axios.post(CONFIG.softoneUrl, {
      service: 'getReportData',
      clientID: CONFIG.clientId,
      appId: CONFIG.appId,
      reqID: reqID,
      pagenum: pagenum
    }, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.data.error) {
      throw new Error(`SoftOne API Error: ${response.data.error}`);
    }

    console.log('[API] Got report data (HTML format)');
    return response.data;
  } catch (error) {
    console.error('[ERROR] GetReportData failed:', error.message);
    throw error;
  }
}

// Step 3: Parse HTML Report to Extract Table Data
function parseHTMLReport(htmlData) {
  try {
    console.log('[PARSE] Parsing HTML report...');
    
    // Extract table rows from HTML
    const tableRegex = /<table[^>]*>(.+?)<\/table>/is;
    const rowRegex = /<tr[^>]*>(.+?)<\/tr>/is;
    const cellRegex = /<td[^>]*>(.+?)<\/td>/i;
    
    const tableMatch = htmlData.match(tableRegex);
    if (!tableMatch) {
      throw new Error('No table found in HTML report');
    }

    const tableContent = tableMatch[1];
    const rows = tableContent.match(/<tr[^>]*>(.+?)<\/tr>/gi) || [];
    
    console.log(`[PARSE] Found ${rows.length} rows`);

    const data = [];
    let isHeader = true;
    let headers = [];

    rows.forEach((row, index) => {
      const cells = row.match(/<td[^>]*>(.+?)<\/td>/gi) || [];
      const rowData = cells.map(cell => {
        // Remove HTML tags and decode entities
        return cell
          .replace(/<[^>]*>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .trim();
      });

      if (isHeader && rowData.length > 0) {
        headers = rowData;
        isHeader = false;
        console.log('[PARSE] Headers:', headers);
      } else if (rowData.length > 0 && rowData.some(cell => cell.length > 0)) {
        // Skip empty rows
        const rowObj = {};
        headers.forEach((header, i) => {
          rowObj[header] = rowData[i] || '';
        });
        data.push(rowObj);
      }
    });

    console.log(`[PARSE] Extracted ${data.length} data rows`);
    return data;
  } catch (error) {
    console.error('[ERROR] HTML parsing failed:', error.message);
    throw error;
  }
}

// Step 4: Create Excel File with Report Data
function createExcelFile(reportData) {
  try {
    console.log('[EXCEL] Creating Excel workbook...');

    // Remove first column from all rows
    const cleanedData = reportData.map(row => {
      const newRow = { ...row };
      const firstKey = Object.keys(newRow)[0];
      delete newRow[firstKey];
      return newRow;
    });

    // Create worksheet from cleaned data
    const ws = XLSX.utils.json_to_sheet(cleanedData);

    // Set basic column widths
    if (cleanedData.length > 0) {
      const headers = Object.keys(cleanedData[0]);
      ws['!cols'] = headers.map(() => ({ wch: 20 }));
    }

    // Create workbook and add worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'WS DAILY REPORT ΜΙΚΤΟ ΚΕΡΔΟΣ');

    // Convert to buffer
    const buffer = XLSX.write(wb, {
      bookType: 'xlsx',
      type: 'buffer'
    });

    console.log('[EXCEL] Excel file created, size:', buffer.length, 'bytes');
    return buffer;
  } catch (error) {
    console.error('[ERROR] Excel creation failed:', error.message);
    throw error;
  }
}

// Step 5: Send Email with Excel Attachment
async function sendEmailReport(excelBuffer) {
  try {
    console.log('[EMAIL] Configuring Zoho Mail SMTP...');
    
    const transporter = nodemailer.createTransport({
      host: CONFIG.smtpHost,
      port: CONFIG.smtpPort,
      secure: true,
      auth: {
        user: CONFIG.emailFrom,
        pass: CONFIG.emailPassword
      }
    });

    // Verify connection
    await transporter.verify();
    console.log('[EMAIL] SMTP connection verified');

    // Format date as DDMMMYY (e.g., 26NOV25)
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
                        'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = monthNames[now.getMonth()];
    const year = String(now.getFullYear()).slice(-2);
    const dateStr = `${day}${month}${year}`;

    const filename = `WS DAILY REPORT ${dateStr}.xlsx`;

    const mailOptions = {
      from: CONFIG.emailFrom,
      to: CONFIG.emailTo,
      subject: `WS DAILY SALES REPORT - ${dateStr}`,
      html: `
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; color: #333; }
              .header { background-color: #f0f0f0; padding: 15px; border-bottom: 2px solid #007bff; }
              .content { padding: 15px; }
              .footer { color: #666; font-size: 12px; margin-top: 20px; padding-top: 10px; border-top: 1px solid #ddd; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>WS DAILY SALES REPORT</h2>
              <p><strong>Ημερομηνία:</strong> ${dateStr}</p>
            </div>
            <div class="content">
              <p>Καλημέρα,</p>
              <p>WS DAILY SALES REPORT με αναλυτικά στοιχεία πωλήσεων, κόστους και μικτού κέρδους ανά πελάτη.</p>
              <p><strong>Το αρχείο Excel περιέχει:</strong></p>
              <ul>
                <li>Επωνυμία πελάτη</li>
                <li>Ποσότητα πωλήσεων</li>
                <li>Αξία πωλήσεων</li>
                <li>Κόστος πωληθέντων</li>
                <li>Μικτό κέρδος</li>
                <li>Ποσοστό μικτού κέρδους</li>
              </ul>
            </div>
          </body>
        </html>
      `,
      attachments: [{
        filename: filename,
        content: excelBuffer
      }]
    };

    console.log('[EMAIL] Sending email to:', CONFIG.emailTo);
    const info = await transporter.sendMail(mailOptions);
    console.log('[EMAIL] Email sent successfully. Message ID:', info.messageId);
    
    return info;
  } catch (error) {
    console.error('[ERROR] Email sending failed:', error.message);
    throw error;
  }
}

// Main Handler
module.exports = async (req, res) => {
  const startTime = new Date();
  console.log('\n' + '='.repeat(60));
  console.log('START: Daily SoftOne Report Generation');
  console.log('Time:', startTime.toISOString());
  console.log('='.repeat(60) + '\n');

  try {
    // Step 1: Get report reference
    const reportInfo = await getReportInfo();

    // Step 2: Get report data (first page only)
    const reportHTML = await getReportData(reportInfo.reqID, 1);

    // Step 3: Parse HTML to extract table data
    const reportData = parseHTMLReport(reportHTML);

    if (reportData.length === 0) {
      throw new Error('No data extracted from report');
    }

    // Step 4: Create Excel file
    const excelBuffer = createExcelFile(reportData);

    // Step 5: Send email with Excel attachment
    const emailInfo = await sendEmailReport(excelBuffer);

    const duration = ((new Date() - startTime) / 1000).toFixed(2);
    
    console.log('\n' + '='.repeat(60));
    console.log('SUCCESS: Report sent successfully');
    console.log(`Duration: ${duration}s`);
    console.log('='.repeat(60) + '\n');

    return res.status(200).json({
      success: true,
      message: 'Daily report generated and sent successfully',
      data: {
        rowsProcessed: reportData.length,
        emailSentTo: CONFIG.emailTo,
        timestamp: startTime.toISOString(),
        duration: `${duration}s`
      }
    });

  } catch (error) {
    const duration = ((new Date() - startTime) / 1000).toFixed(2);
    
    console.error('\n' + '='.repeat(60));
    console.error('ERROR: Report generation failed');
    console.error('Error:', error.message);
    console.error(`Duration: ${duration}s`);
    console.error('='.repeat(60) + '\n');

    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: startTime.toISOString(),
      duration: `${duration}s`
    });
  }
};

// Allow local testing
if (process.env.NODE_ENV !== 'production') {
  const mockReq = {};
  const mockRes = {
    status: (code) => ({
      json: (data) => {
        console.log('\n[RESPONSE]', data);
        process.exit(data.success ? 0 : 1);
      }
    })
  };

  if (require.main === module) {
    module.exports(mockReq, mockRes);
  }
}
