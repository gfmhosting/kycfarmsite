# Firebase Storage Setup Guide

## 🚀 Quick Setup (15 minutes)

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `job-applications` (or your preferred name)
4. Disable Google Analytics (not needed)
5. Click "Create project"

### Step 2: Enable Storage
1. In Firebase console, click "Storage" in left sidebar
2. Click "Get started"
3. Choose "Start in production mode"
4. Select storage location (choose closest to your users)
5. Click "Done"

### Step 3: Create Service Account
1. Go to Project Settings (gear icon) → "Service accounts"
2. Click "Generate new private key"
3. Download the JSON file
4. **IMPORTANT:** Keep this file secure, never commit to git

### Step 4: Configure Railway Environment Variables

Add these environment variables in Railway dashboard:

#### Required Variables:
```
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project-id",...}
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

**How to add:**
1. Go to Railway dashboard
2. Click your service → "Variables" tab
3. Add new variable `FIREBASE_SERVICE_ACCOUNT`
4. Copy entire contents of downloaded JSON file as value
5. Add `FIREBASE_STORAGE_BUCKET` with your bucket URL

### Step 5: Update Storage Rules (Optional)
In Firebase Console → Storage → Rules:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true; // Public access for job applications
    }
  }
}
```

## ✅ Benefits of Firebase Storage

### Immediate Access
- **Firebase Console:** View all uploaded files instantly
- **Direct URLs:** Each file gets a permanent public URL
- **No CLI needed:** Browse files through web interface

### Professional Features
- **Global CDN:** Fast file delivery worldwide
- **Automatic scaling:** Handles any number of uploads
- **File processing:** Automatic image optimization
- **Security:** Configurable access rules

### Easy Management
- **Visual interface:** See all applications and files
- **Search and filter:** Find specific applications quickly
- **Download files:** Direct download from console
- **File details:** See upload dates, sizes, types

## 📁 File Organization

Your files will be organized as:
```
job-applications.appspot.com/
├── 2025-06-24_john-doe/
│   ├── front-id.jpg
│   ├── back-id.jpg
│   └── verification-video.webm
├── 2025-06-24_jane-smith/
│   ├── front-id.png
│   ├── back-id.png
│   └── verification-video.mp4
```

## 🔗 Access Your Files

### Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click "Storage" → "Files"
4. Browse all uploaded files

### Direct URLs
Each file gets a public URL like:
`https://storage.googleapis.com/your-project.appspot.com/2025-06-24_john-doe/front-id.jpg`

### Application Info
Local Railway files still contain all application details + Firebase URLs:
```
CUSTOMER SERVICE APPLICATION
========================================
...
Firebase File URLs:
- Front ID URL: https://storage.googleapis.com/...
- Back ID URL: https://storage.googleapis.com/...
- Video URL: https://storage.googleapis.com/...
```

## 🆘 Troubleshooting

### Issue: "Firebase not configured"
- Check Railway environment variables are set correctly
- Ensure `FIREBASE_SERVICE_ACCOUNT` is valid JSON
- Verify `FIREBASE_STORAGE_BUCKET` matches your project

### Issue: Upload fails
- Check Firebase Storage is enabled
- Verify storage rules allow writes
- Confirm service account has Storage Admin role

### Issue: Files not public
- Update storage rules to allow public reads
- Or files are made public automatically by the code

## 💰 Pricing
- **Free tier:** 5GB storage, 1GB/day downloads
- **Paid:** $0.026/GB/month for storage
- **Transfer:** $0.12/GB for downloads

Your job application system will easily fit in the free tier!

## 🔄 Fallback Mode
If Firebase isn't configured, the system automatically falls back to local Railway storage, so your app keeps working during setup. 