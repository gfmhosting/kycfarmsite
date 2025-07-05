# Supabase Storage Setup Guide

## 🚀 Quick Setup (15 minutes)

### Step 1: Create Supabase Project

1. **Go to [supabase.com](https://supabase.com)**
2. **Click "Start your project"**
3. **Sign up/Login** with GitHub or email
4. **Click "New Project"**
5. **Fill in project details:**
   - Name: `kyc-farm` 
   - Database Password: Generate strong password
   - Region: Choose closest to your users
6. **Click "Create new project"**

### Step 2: Create Storage Bucket

1. **In Supabase Dashboard, go to "Storage"**
2. **Click "Create a new bucket"**
3. **Name:** `kyc-farm`
4. **Public bucket:** ✅ **Enable** (for easy file access)
5. **Click "Create bucket"**

### Step 3: Get Configuration Values

1. **Go to Settings → API**
2. **Copy these values:**
   - **Project URL:** `https://your-project.supabase.co`
   - **Anon/Public Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Step 4: Configure Railway Environment Variables

1. **Go to Railway Dashboard**
2. **Open your project → Click your service**
3. **Go to "Variables" tab**
4. **Add these variables:**

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 5: Deploy & Test

1. **Commit and push your changes**
2. **Railway will automatically redeploy**
3. **Submit a test application**
4. **Check Supabase Storage for uploaded files**

## 📁 File Organization

Your Supabase bucket will organize files like this:

```
kyc-farm/
├── applications/
│   ├── 2025-06-24_john-doe/
│   │   ├── front-id.jpg
│   │   ├── back-id.jpg
│   │   ├── verification-video.webm
│   │   └── application-info.txt
│   └── 2025-06-24_jane-smith/
│       ├── front-id.png
│       ├── back-id.png
│       ├── verification-video.mp4
│       └── application-info.txt
```

## 🔍 Accessing Files

### Method 1: Supabase Dashboard
1. Go to Storage → kyc-farm bucket
2. Browse folders by date and applicant name
3. Click files to download or view

### Method 2: Direct URLs
Each file gets a public URL like:
```
https://your-project.supabase.co/storage/v1/object/public/kyc-farm/applications/2025-06-24_john-doe/front-id.jpg
```

### Method 3: Application Response
When someone submits, they get back all file URLs:
```json
{
  "success": true,
  "fileUrls": {
    "idFront": "https://...",
    "idBack": "https://...",
    "video": "https://..."
  },
  "infoUrl": "https://..."
}
```

## 🛡️ Security Features

- **Public bucket** for easy access (files are viewable by URL)
- **File type validation** (only images and videos allowed)
- **10MB file size limit**
- **Organized folder structure** prevents conflicts
- **Unique filenames** with timestamps

## 💰 Pricing

**Supabase Free Tier:**
- ✅ **1GB Storage** (enough for ~200 applications with files)
- ✅ **2GB Bandwidth** per month
- ✅ **Unlimited requests**
- ✅ **No time limit**

**Paid Plans:**
- **Pro Plan:** $25/month for 8GB storage + more bandwidth
- **Pay-as-you-go** storage: $0.021 per GB/month

## 🔧 Benefits vs Railway Volumes

| Feature | Railway Volumes | Supabase Storage |
|---------|----------------|------------------|
| **Access** | CLI only | Dashboard + URLs |
| **Setup** | Complex | 15 minutes |
| **Free Tier** | 0.5GB | 1GB |
| **File URLs** | None | Public URLs |
| **Management** | Command line | Web interface |
| **Backup** | Manual | Automatic |

## 🚨 Troubleshooting

### "Invalid bucket name" error
- Bucket name must be `kyc-farm` exactly
- Check spelling and case sensitivity

### "Row Level Security" errors
- Make sure bucket is set to **Public**
- Go to Storage → Policies → Disable RLS for public access

### Environment variables not working
- Double-check the SUPABASE_URL and SUPABASE_ANON_KEY in Railway
- Restart the Railway service after adding variables

### Files not uploading
- Check the health endpoint: `/health`
- Should show `"supabaseConfigured": true`

## ✅ Success Confirmation

After setup, you should see:
1. **Files uploaded to Supabase Storage bucket**
2. **Public URLs returned in API responses**
3. **Easy access through Supabase dashboard**
4. **No more Railway volume complications**

Your job application system now uses professional cloud storage! 🎉 