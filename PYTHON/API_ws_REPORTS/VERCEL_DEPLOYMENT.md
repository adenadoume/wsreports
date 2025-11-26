# Vercel Deployment Guide - WS Daily Sales Report

## ✅ Step 1: Access Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"** or **"Login"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub account

---

## ✅ Step 2: Import GitHub Repository

1. Click **"Add New..."** → **"Project"**
2. In the repository list, find **"adenadoume/wsreports"**
   - If you don't see it, click **"Adjust GitHub App Permissions"**
   - Select the wsreports repository
3. Click **"Import"** next to wsreports

---

## ✅ Step 3: Configure Project Settings

### Framework Preset
- Select: **Other** (or leave as default)

### Root Directory
- Leave as: **PYTHON/API_ws_REPORTS** (Vercel will auto-detect)
- If not auto-detected, click "Edit" and set: `PYTHON/API_ws_REPORTS`

### Build Settings
- **Build Command**: Leave empty (not needed for serverless functions)
- **Output Directory**: Leave empty
- **Install Command**: `npm install`

---

## ✅ Step 4: Add Environment Variables

Click **"Environment Variables"** and add these **9 variables**:

### SoftOne API Configuration

| Variable Name | Value |
|--------------|-------|
| `SOFTONE_URL` | `https://aromaioniou.oncloud.gr/s1services/` |
| `SOFTONE_CLIENT_ID` | `9J8pHdbOGq9gU5LNNs4bDZ17LsnGGKvHPIKrHLXLPLT7K69DTsXYJMjuPb5sT41IJ71IG2KrHK5HJsPqKrObDK9LHKr1J6DJKKLtLIKrGqLbM5fHKaXs9JL3GqzkGK1QJ6HGHYKtHYKtGt129JT3J6LKNr5rLbLLG4n0T651QqXLLLL1HbHFPM52LcnnJrHvTbSbDKHP9JOmIaXmK4XJIKLL9JT3K7LNLq57` |
| `SOFTONE_APP_ID` | `1971` |
| `SOFTONE_REPORT_OBJECT` | `VSALSTATS` |

### Email Configuration

| Variable Name | Value |
|--------------|-------|
| `EMAIL_FROM` | `george@agop.pro` |
| `EMAIL_PASSWORD` | `X1UYKTXJNS5X` |
| `SMTP_HOST` | `smtp.zoho.com` |
| `SMTP_PORT` | `465` |

### Email Recipient

| Variable Name | Value |
|--------------|-------|
| `EMAIL_TO` | `giorgos@palerosdreamhomes.com` |

**For each variable:**
1. Type the **Variable Name** in the "Key" field
2. Paste the **Value** in the "Value" field
3. Select **"Production"** environment
4. Click **"Add"**

---

## ✅ Step 5: Deploy

1. After adding all environment variables, click **"Deploy"**
2. Wait 1-2 minutes for deployment to complete
3. Look for **green checkmark** ✅ and "Ready" status

---

## ✅ Step 6: Test the Function

### Manual Test (Recommended First)

1. Go to **"Deployments"** tab
2. Click on the latest deployment
3. Go to **"Functions"** tab
4. Find **"api/daily-report"**
5. Click **"Invoke Function"**
6. Wait for response (should take 5-10 seconds)
7. Check for `"success": true` in the response
8. Check email at **giorgos@palerosdreamhomes.com**

### Check Logs

1. Go to **"Deployments"** → Click latest deployment
2. Click **"View Function Logs"**
3. You should see:
   ```
   [API] Calling GetReportInfo...
   [API] Got reqID: ...
   [EXCEL] Excel file created...
   [EMAIL] Email sent successfully
   ```

---

## ✅ Step 7: Verify Cron Schedule

The system is configured to run automatically:

- **Schedule**: Monday to Saturday at **6 PM UTC** (8 PM Athens time)
- **Vercel.json**: Already configured with `"0 16 * * 1-6"`

To verify:
1. Go to **Settings** → **Cron Jobs**
2. You should see: `/api/daily-report` scheduled

---

## ✅ Step 8: Switch to Boss Email (After Testing)

Once you confirm the test email works:

1. Go to **Settings** → **Environment Variables**
2. Find **EMAIL_TO**
3. Click **"Edit"**
4. Change value to: `roko@palerosdreamhomes.com`
5. Click **"Save"**
6. Vercel will automatically redeploy

---

## 🎯 What Happens Automatically

Every Monday-Saturday at 6 PM UTC:
1. ✅ Vercel triggers the cron job
2. ✅ Function connects to SoftOne API
3. ✅ Fetches VSALSTATS report
4. ✅ Creates clean Excel file
5. ✅ Sends email with attachment
6. ✅ Report delivered!

---

## 🔧 Troubleshooting

### Email not received?
- Check **Vercel Logs** for errors
- Verify all 9 environment variables are set correctly
- Check spam folder
- Verify email address is correct

### Function timeout?
- SoftOne API might be slow
- Check Vercel logs for the exact error
- Function has 10 second timeout (can be increased in Vercel Pro)

### Wrong data in report?
- Date filter is currently set to **2025-11-12** for testing
- To use current date, remove the date filter in code
- Or update the filter date in `api/daily-report.js`

---

## 📝 Important Notes

1. **Cost**: Free on Vercel Hobby plan (up to 100 cron jobs/day)
2. **Monitoring**: Check Vercel dashboard regularly for errors
3. **Logs**: Available for 24 hours on free plan
4. **Date Filter**: Currently testing with Nov 12, 2025 - adjust as needed

---

## ✅ You're Done!

Your WS Daily Sales Report is now:
- ✅ Deployed to Vercel
- ✅ Sending automated daily reports
- ✅ Running Monday-Saturday at 6 PM
- ✅ Zero maintenance required

Questions? Check the Vercel logs or contact support!
