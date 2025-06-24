const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 8000;

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Ensure local uploads directory exists for temporary files
const uploadsDir = path.join(__dirname, 'backend', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files - serve everything from root
app.use(express.static(__dirname));

// File upload configuration - using memory storage for Supabase
const storage = multer.memoryStorage();

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images for ID uploads and video for verification
    const imageTypes = /jpeg|jpg|png|gif|webp/;
    const videoTypes = /mp4|webm|mov/;
    const extname = path.extname(file.originalname).toLowerCase();
    
    if (file.fieldname === 'video') {
      const isValidVideo = videoTypes.test(extname.substring(1)) || file.mimetype.startsWith('video/');
      if (isValidVideo) {
        return cb(null, true);
      } else {
        return cb(new Error('Only MP4, WebM, and MOV video files are allowed'));
      }
    } else {
      // For ID uploads (idFront, idBack)
      const isValidImage = imageTypes.test(extname.substring(1)) || file.mimetype.startsWith('image/');
      if (isValidImage) {
        return cb(null, true);
      } else {
        return cb(new Error('Only image files are allowed for ID uploads'));
      }
    }
  }
});

// Helper function to upload file to Supabase Storage
async function uploadToSupabase(file, fileName, folderName) {
  try {
    const filePath = `applications/${folderName}/${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('job-applications')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('job-applications')
      .getPublicUrl(filePath);

    return {
      success: true,
      url: publicUrl,
      path: filePath
    };
  } catch (error) {
    console.error('Upload to Supabase failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/health', (req, res) => {
  try {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      port: PORT,
      storage: 'Supabase Cloud',
      uptime: process.uptime(),
      supabaseConfigured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY)
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      error: error.message
    });
  }
});

// Application submission endpoint
app.post('/api/submit-application', upload.fields([
  { name: 'idFront', maxCount: 1 },
  { name: 'idBack', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, email, phone, firstName, lastName, experience, schedule, location } = req.body;
    const files = req.files;
    
    // Create folder name
    const fullName = `${firstName} ${lastName}`;
    const safeFolderName = fullName
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .toLowerCase();
    
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const folderName = `${timestamp}_${safeFolderName}`;
    
    // Upload files to Supabase Storage
    const uploadResults = {};
    const fileUrls = {};
    
    if (files && files.idFront) {
      const file = files.idFront[0];
      const fileName = `front-id${path.extname(file.originalname)}`;
      uploadResults.idFront = await uploadToSupabase(file, fileName, folderName);
      if (uploadResults.idFront.success) {
        fileUrls.idFront = uploadResults.idFront.url;
      }
    }
    
    if (files && files.idBack) {
      const file = files.idBack[0];
      const fileName = `back-id${path.extname(file.originalname)}`;
      uploadResults.idBack = await uploadToSupabase(file, fileName, folderName);
      if (uploadResults.idBack.success) {
        fileUrls.idBack = uploadResults.idBack.url;
      }
    }
    
    if (files && files.video) {
      const file = files.video[0];
      const fileName = `verification-video${path.extname(file.originalname)}`;
      uploadResults.video = await uploadToSupabase(file, fileName, folderName);
      if (uploadResults.video.success) {
        fileUrls.video = uploadResults.video.url;
      }
    }
    
    // Create application info
    const applicationInfo = {
      timestamp: new Date().toISOString(),
      applicantName: `${firstName} ${lastName}`,
      email: email,
      phone: phone,
      location: location,
      experience: experience,
      schedule: schedule,

      applicationId: 'APP-' + Date.now(),
      folderName: folderName,
      fileUrls: fileUrls,
      filesUploaded: {
        idFront: uploadResults.idFront?.success ? 'Yes' : 'No',
        idBack: uploadResults.idBack?.success ? 'Yes' : 'No',
        video: uploadResults.video?.success ? 'Yes' : 'No'
      }
    };
    
    // Save application info to Supabase Storage as text file
    const infoText = `CUSTOMER SERVICE APPLICATION
========================================

Applicant Information:
- Full Name: ${applicationInfo.applicantName}
- Email: ${applicationInfo.email}
- Phone: ${applicationInfo.phone}
- Location: ${applicationInfo.location}
- Experience Level: ${applicationInfo.experience}
- Preferred Schedule: ${applicationInfo.schedule}

Application Details:
- Application ID: ${applicationInfo.applicationId}
- Submission Date: ${applicationInfo.timestamp}
- Folder: ${folderName}

File URLs:
- Front ID: ${fileUrls.idFront || 'Not uploaded'}
- Back ID: ${fileUrls.idBack || 'Not uploaded'}
- Verification Video: ${fileUrls.video || 'Not uploaded'}

Files Uploaded:
- Front ID: ${applicationInfo.filesUploaded.idFront}
- Back ID: ${applicationInfo.filesUploaded.idBack}
- Verification Video: ${applicationInfo.filesUploaded.video}

Status: Pending Review
========================================`;

    // Upload application info to Supabase
    const infoBuffer = Buffer.from(infoText, 'utf8');
    const infoFilePath = `applications/${folderName}/application-info.txt`;
    
    const { data: infoUpload, error: infoError } = await supabase.storage
      .from('job-applications')
      .upload(infoFilePath, infoBuffer, {
        contentType: 'text/plain',
        upsert: false
      });

    if (infoError) {
      console.error('Failed to upload application info:', infoError);
    }

    // Get public URL for application info
    const { data: { publicUrl: infoUrl } } = supabase.storage
      .from('job-applications')
      .getPublicUrl(infoFilePath);
    
    console.log('=== New Application Received ===');
    console.log('Applicant:', applicationInfo.applicantName);
    console.log('Folder Created:', folderName);
    console.log('Email:', email);
    console.log('Phone:', phone);
    console.log('Supabase Storage URLs:');
    if (fileUrls.idFront) console.log('- ID Front:', fileUrls.idFront);
    if (fileUrls.idBack) console.log('- ID Back:', fileUrls.idBack);
    if (fileUrls.video) console.log('- Video:', fileUrls.video);
    console.log('- Application Info:', infoUrl);
    console.log('================================');
    
    // Simulate processing time
    setTimeout(() => {
      res.json({ 
        success: true, 
        message: 'Application submitted successfully! We will contact you within 24 hours.',
        applicationId: applicationInfo.applicationId,
        applicantFolder: folderName,
        storageType: 'Supabase Cloud Storage',
        fileUrls: fileUrls,
        infoUrl: infoUrl,
        nextSteps: [
          'Check your email for confirmation',
          'Prepare for a brief phone screening',
          'Review job details and requirements'
        ]
      });
    }, 1500);
    
  } catch (error) {
    console.error('Application submission error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'There was an error processing your application. Please try again.' 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Please upload files smaller than 10MB.'
      });
    }
    if (error.code === 'MISSING_FIELD_NAME') {
      return res.status(400).json({
        success: false,
        message: 'Invalid file upload. Please ensure all required files are properly selected.'
      });
    }
  }
  
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error. Please try again later.'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Customer Service Landing Page Server running on port ${PORT}`);
  console.log(`📍 Local URL: http://localhost:${PORT}`);
  console.log(`📁 Serving static files from: ${__dirname}`);
  console.log(`📤 Upload directory: ${uploadsDir}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔧 Railway Deploy: ${process.env.RAILWAY_ENVIRONMENT_NAME || 'local'}`);
  
  // Ensure uploads directory exists with proper permissions
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log(`✅ Created uploads directory: ${uploadsDir}`);
    }
    console.log(`✅ Server startup complete - Ready to accept connections`);
  } catch (error) {
    console.error(`❌ Error setting up uploads directory:`, error);
  }
}); 