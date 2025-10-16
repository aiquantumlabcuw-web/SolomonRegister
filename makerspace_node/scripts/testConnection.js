require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('Testing MongoDB Atlas connection...');
    
    const uri = process.env.MONGODB_URI || process.env.URI;
    
    if (!uri) {
      console.error('❌ ERROR: No MongoDB URI found in environment variables');
      console.log('Please create a .env file with your MongoDB Atlas connection string');
      process.exit(1);
    }
    
    console.log(`Connecting to: ${uri.replace(/\/\/.*@/, '//***:***@')}`);
    
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    
    console.log('✅ Successfully connected to MongoDB Atlas!');
    
    // Test database operations
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log(`📊 Found ${collections.length} collections in database`);
    
    if (collections.length > 0) {
      console.log('Collections:');
      collections.forEach(col => console.log(`  - ${col.name}`));
    }
    
    await mongoose.disconnect();
    console.log('🔌 Connection closed successfully');
    console.log('\n🎉 Your MongoDB Atlas setup is working correctly!');
    console.log('You can now run: npm run dev');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.message.includes('authentication')) {
      console.log('\n💡 Authentication failed. Please check:');
      console.log('  - Username and password in connection string');
      console.log('  - Database user permissions in MongoDB Atlas');
    } else if (error.message.includes('network')) {
      console.log('\n💡 Network error. Please check:');
      console.log('  - Internet connection');
      console.log('  - IP address whitelist in MongoDB Atlas');
      console.log('  - Connection string format');
    } else {
      console.log('\n💡 Please check your .env file and MongoDB Atlas configuration');
    }
    
    process.exit(1);
  }
}

testConnection();
