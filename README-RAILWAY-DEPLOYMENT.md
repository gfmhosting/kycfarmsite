# 🚂 Railway Deployment Guide

## Quick Start (5 minutes)

Your customer service landing page is now ready for Railway deployment with a full Express.js backend!

### Prerequisites
- Node.js 18+ installed
- Railway account (sign up at [railway.app](https://railway.app))
- This project files

### 1. Install Railway CLI

```bash
npm install -g @railway/cli
```

### 2. Login to Railway

```bash
railway login --browserless
```

Follow the authentication process in your browser.

### 3. Initialize Project

```bash
railway init
```

Choose "Empty Project" and give it a name like "customer-service-landing".

### 4. Link Your Project

```bash
railway link
```

Select the project you just created.

### 5. Deploy

```bash
railway up
```

Railway will:
- Detect your Node.js project
- Install dependencies automatically
- Start your Express.js server
- Deploy to production

### 6. Get Your URL

```bash
railway domain
```

This generates a public URL for your landing page!

## 🎯 What's Deployed

### Backend Features
✅ **Express.js Server** - Serves your landing page  
✅ **File Upload Handling** - Resume upload with validation  
✅ **Form Processing** - Handles application submissions  
✅ **CORS Configuration** - Ready for cross-origin requests  
✅ **Health Checks** - Railway monitoring endpoint  
✅ **Error Handling** - Comprehensive error responses  

### Frontend Features  
✅ **Modular Architecture** - All your existing components  
✅ **Form Validation** - Client-side validation intact  
✅ **File Upload UI** - Drag & drop functionality  
✅ **Responsive Design** - Mobile-optimized layout  
✅ **Analytics Ready** - Conversion tracking included  

## 🔧 Local Development

### Install Dependencies
```bash
npm install
```

### Start Development Server
```bash
npm run dev
```

Visit `http://localhost:8000` to test locally.

### Test Form Submission
1. Fill out the application form
2. Upload a resume (PDF, DOC, DOCX)
3. Submit the form
4. Check server logs for application data

## 🚀 Production Configuration

### Environment Variables
Set these in Railway dashboard under "Variables":

```
NODE_ENV=production
PORT=8000
```

### Custom Domain (Optional)
1. Go to Railway dashboard
2. Select your service
3. Navigate to "Settings" > "Domains"
4. Add your custom domain
5. Configure DNS records as shown

### File Storage (Optional Upgrade)
For production use, consider upgrading to cloud storage:
- AWS S3
- Cloudinary
- Railway Volume

## 📊 Monitoring & Logs

### View Logs
```bash
railway logs
```

### Health Check
Your deployed app includes a health endpoint:
```
GET /health
```

### Application Monitoring
Monitor form submissions in Railway logs:
- Application data received
- File upload status
- Processing timestamps

## 🔄 Updates & Redeployment

### Update Your Code
1. Make changes to your files
2. Deploy updates:
```bash
railway up
```

### Quick Redeployment
```bash
railway up --detach
```

## 🛠️ Troubleshooting

### Common Issues

**Build Fails**
- Check `package.json` dependencies
- Ensure Node.js version compatibility

**Form Not Submitting**
- Verify API endpoint in browser network tab
- Check Railway logs for errors

**File Upload Issues**
- Confirm file size < 10MB
- Verify file types (PDF, DOC, DOCX only)

**Static Files Not Loading**
- Ensure proper file paths in HTML
- Check Express.js static file serving

### Get Help
- Railway Discord: [discord.gg/railway](https://discord.gg/railway)
- Railway Docs: [docs.railway.app](https://docs.railway.app)
- Railway Support: Available in dashboard

## 📈 Scaling & Performance

### Automatic Scaling
Railway automatically scales based on traffic:
- CPU and memory scaling
- Geographic load balancing
- Traffic-based scaling

### Performance Optimization
- Enable Railway's built-in CDN
- Configure caching headers
- Monitor resource usage

### Cost Management
- Free tier: 500 hours/month
- Pro plan: $5/month per user
- Usage-based scaling

## 🔐 Security Features

### Built-in Security
✅ **HTTPS by default** - Automatic SSL certificates  
✅ **DDoS Protection** - Railway infrastructure security  
✅ **File Upload Validation** - Type and size restrictions  
✅ **CORS Configuration** - Controlled cross-origin access  
✅ **Input Sanitization** - Express.js security middleware  

### Additional Security (Recommended)
- Rate limiting for form submissions
- Captcha integration for spam prevention
- Email verification for applications

## 🎯 Analytics & Conversion Tracking

### Built-in Tracking
Your landing page includes:
- Form submission tracking
- File upload analytics
- Error monitoring
- Performance metrics

### External Integration
Add tracking codes in `index.html`:
- Google Analytics
- Facebook Pixel
- Custom analytics

### Conversion Funnel
Monitor these key metrics:
1. Landing page views
2. Form interactions
3. Application submissions
4. File uploads completed

---

## ✅ Deployment Complete!

Your customer service landing page is now live on Railway with:
- 🌍 Global CDN delivery
- 📱 Mobile-optimized experience  
- 📄 Working form submissions
- 📎 File upload functionality
- 📊 Real-time monitoring
- 🔒 Production-grade security

**Next Steps:**
1. Test all functionality on your live URL
2. Configure custom domain (optional)
3. Set up monitoring alerts
4. Add analytics tracking codes
5. Start collecting job applications!

---

*Need help? Check the troubleshooting section above or contact Railway support.* 