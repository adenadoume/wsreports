# SoftOne Daily Sales Report Automation

Automatic daily sales report generation from SoftOne ERP 6, formatted as Excel, and emailed via Zoho Mail.

**Status:** Ready to Deploy  
**Cost:** €0 (free)  
**Maintenance:** 0 hours (fully automated)  

## Features

- ✅ Fetches daily sales report from SoftOne Web Services API
- ✅ Parses HTML report data
- ✅ Generates formatted Excel file with:
  - Customer names (Επωνυμία)
  - Sales quantities (Ποσ.1 πώλησης)
  - Sales values (Αξία Πώλησης)
  - Cost of goods sold (Κόστος Πωληθέντων)
  - Gross profit (Μικτό Κερδός)
  - Gross profit % (% Μ Κ)
- ✅ Sends professional HTML email with Excel attachment
- ✅ Runs automatically Monday-Saturday at 6 PM Athens time
- ✅ Full error handling and logging
- ✅ Zero manual work required

## Configuration

### Environment Variables (Set in Vercel)

```
SOFTONE_URL=https://aromaioniou.oncloud.gr/s1services/
SOFTONE_CLIENT_ID=<your-client-id>
SOFTONE_APP_ID=1971
SOFTONE_REPORT_OBJECT=VSALSTATS
EMAIL_FROM=george@agop.pro
EMAIL_PASSWORD=<zoho-app-password>
SMTP_HOST=smtp.zoho.eu
SMTP_PORT=465
EMAIL_TO=giorgos@palerosdreamhomes.com
```

### Schedule

Default schedule (cron): `0 16 * * 1-6`
- Time: 16:00 UTC (18:00 Athens time)
- Days: Monday-Saturday (1-6 = Mon-Sat, 0 = Sunday)

To change, edit `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/daily-report",
    "schedule": "0 16 * * 1-6"
  }]
}
```

## Deployment

### Prerequisites
- GitHub account
- Vercel account (free)
- Zoho Mail account (already configured)

### Steps

1. Create GitHub repository
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. Import to Vercel
   - Go to vercel.com
   - Click "Add New" → "Project"
   - Select this repository
   - Click "Import"

3. Add Environment Variables
   - Settings → Environment Variables
   - Add all 9 variables from above
   - Save

4. Deploy
   - Push a commit or redeploy in dashboard
   - Wait for green checkmark

5. Test
   - Functions tab → api-daily-report → Invoke
   - Check email for report

## File Structure

```
.
├── api/
│   └── daily-report.js          Main serverless function
├── package.json                  Dependencies
├── vercel.json                   Cron schedule
├── .env.example                  Environment variables template
├── .gitignore                    Git ignore rules
├── README.md                     This file
└── HOW_TO_USE_WITH_CLAUDE.txt   Guide for working with Claude AI
```

## How It Works

### Step-by-Step Process

1. **GetReportInfo** - Request report from SoftOne, get reference ID
2. **GetReportData** - Fetch HTML-formatted report data
3. **Parse HTML** - Extract table data from HTML response
4. **Create Excel** - Format data and create Excel workbook
5. **Send Email** - Email Excel file via Zoho SMTP

### Error Handling

- All API calls have 30-second timeouts
- Comprehensive logging at each step
- Full error messages in response
- Automatic retry capability (via Vercel)

### Logging

Check Vercel logs to see execution:

```
[INIT] SoftOne Daily Report Scheduler
[CONFIG] Report Object: VSALSTATS
[CONFIG] Email: george@agop.pro → giorgos@...
[API] Calling GetReportInfo...
[API] Got reqID: ...
[API] Calling GetReportData...
[PARSE] Parsing HTML report...
[PARSE] Headers: [...]
[PARSE] Extracted 48 data rows
[EXCEL] Creating Excel workbook...
[EXCEL] Excel file created, size: 12345 bytes
[EMAIL] Configuring Zoho Mail SMTP...
[EMAIL] SMTP connection verified
[EMAIL] Sending email to: giorgos@...
[EMAIL] Email sent successfully
SUCCESS: Report sent successfully
```

## Troubleshooting

### No reqID returned
- Check `SOFTONE_REPORT_OBJECT` is exactly "VSALSTATS"
- Verify SoftOne Web Services are accessible
- Check `SOFTONE_CLIENT_ID` is correct

### No table found in HTML
- SoftOne report format might have changed
- Verify report returns HTML with `<table>` tags
- Check Vercel logs for full HTML response

### SMTP Authentication failed
- Verify `EMAIL_PASSWORD` is the Zoho app password (not real password)
- Check Zoho Mail allows SMTP connections
- Verify `SMTP_HOST` and `SMTP_PORT` are correct

### Email not received
- Check `EMAIL_TO` is correct
- Verify email isn't in spam folder
- Check `EMAIL_FROM` is properly configured in Zoho
- Review Vercel logs for sending errors

### Empty report data
- Verify SoftOne has data for that date
- Check if report filters are excluding all data
- Confirm VSALSTATS report returns data when run manually

## Modifying the Project

### Change Schedule

Edit `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/daily-report",
    "schedule": "0 18 * * *"  // Changed to every day at 6 PM
  }]
}
```

Common cron formats:
- `0 16 * * 1-6` - 4 PM UTC, Mon-Sat (current)
- `0 18 * * *` - 6 PM UTC, every day
- `0 9 * * 1-5` - 9 AM UTC, Mon-Fri
- `0 */6 * * *` - Every 6 hours

### Change Email Recipient

Update `EMAIL_TO` in Vercel environment variables:
```
EMAIL_TO=new-email@example.com
```

No code changes needed - environment variables only.

### Add Custom Formatting

Edit the Excel section in `api/daily-report.js`:
```javascript
// Set column widths
ws['!cols'] = [
  { wch: 35 },  // Column A width
  { wch: 15 },  // Column B width
  // ...
];
```

### Modify Email Template

Edit the `mailOptions.html` in `api/daily-report.js` to change:
- Email subject
- HTML formatting
- Language
- Additional information

## Using with Claude AI

For modifications, debugging, or new features:

1. Upload the entire `vercel-softone-report` folder to Claude
2. Ask your question
3. Claude will provide code changes

See `HOW_TO_USE_WITH_CLAUDE.txt` for detailed guidance.

## Support

### Common Tasks

**I need to change the time:**
- Edit `vercel.json` cron schedule

**I need to change recipient:**
- Update `EMAIL_TO` in Vercel environment variables

**It's not running:**
- Check Vercel logs (Deployments → Click deployment → Scroll down)
- Verify all 9 environment variables are set

**Email formatting is wrong:**
- Edit the `mailOptions.html` in `api/daily-report.js`
- Ask Claude for help with HTML/CSS

**I want to add a feature:**
- Ask Claude what you want to add
- Upload this project to Claude
- Claude will help implement

## Dependencies

- `axios` - HTTP client for SoftOne API calls
- `xlsx` - Excel file generation
- `nodemailer` - Email sending
- `dotenv` - Environment variable management

## License

MIT

## Author

Giorgos @ AROMA IONIOU SA
