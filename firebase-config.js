const admin = require('firebase-admin');

// Initialize Firebase Admin (you'll need to add your service account key)
let firebaseApp;

const initializeFirebase = () => {
  if (!firebaseApp) {
    try {
      // For production, use environment variables for Firebase config
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : null;

      if (serviceAccount) {
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'your-project.appspot.com'
        });
      } else {
        console.log('⚠️  Firebase not configured - using local storage fallback');
        return null;
      }
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error.message);
      return null;
    }
  }
  return firebaseApp;
};

const uploadToFirebase = async (fileBuffer, fileName, folder = '') => {
  try {
    const app = initializeFirebase();
    if (!app) {
      throw new Error('Firebase not initialized');
    }

    const bucket = admin.storage().bucket();
    const filePath = folder ? `${folder}/${fileName}` : fileName;
    const file = bucket.file(filePath);

    // Upload the file
    await file.save(fileBuffer, {
      metadata: {
        contentType: 'auto', // Auto-detect content type
      },
    });

    // Make the file publicly accessible
    await file.makePublic();

    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    
    console.log(`✅ File uploaded to Firebase: ${publicUrl}`);
    return publicUrl;

  } catch (error) {
    console.error('❌ Firebase upload failed:', error.message);
    throw error;
  }
};

const deleteFromFirebase = async (filePath) => {
  try {
    const app = initializeFirebase();
    if (!app) {
      throw new Error('Firebase not initialized');
    }

    const bucket = admin.storage().bucket();
    const file = bucket.file(filePath);
    
    await file.delete();
    console.log(`✅ File deleted from Firebase: ${filePath}`);
    
  } catch (error) {
    console.error('❌ Firebase delete failed:', error.message);
    throw error;
  }
};

module.exports = {
  initializeFirebase,
  uploadToFirebase,
  deleteFromFirebase
}; 