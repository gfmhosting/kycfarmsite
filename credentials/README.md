# Google Service Account Setup

## Steps to set up Google Sheets integration:

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Note your project ID

### 2. Enable Google Sheets API
1. In Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google Sheets API"
3. Click "Enable"

### 3. Create Service Account
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Enter name: `kyc-farm-sheets`
4. Click "Create and Continue"
5. Skip role assignment (click "Continue")
6. Click "Done"

### 4. Generate JSON Key
1. Click on the created service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create New Key"
4. Choose "JSON" format
5. Download the file and rename it to `google-service-account.json`
6. Place it in this `credentials/` folder

### 5. Share Google Sheet
1. Open your target Google Sheet
2. Click "Share" button
3. Add the service account email (found in the JSON file under "client_email")
4. Give "Editor" permissions
5. Copy the Sheet ID from the URL (the long string between `/d/` and `/edit`)

### 6. Set Environment Variables
Add these to your environment:
```bash
GOOGLE_SHEET_ID=your_sheet_id_here
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
```

### File Structure:
```
credentials/
├── google-service-account.json  # Your downloaded JSON key
└── README.md                    # This file
```

## Security Note:
- Never commit `google-service-account.json` to version control
- The credentials folder is already in .gitignore 