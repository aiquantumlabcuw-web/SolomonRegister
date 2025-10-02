const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI || process.env.URI;
if (!uri) {
  console.error('ERROR: No Mongo connection string set. Define MONGODB_URI or URI.');
  process.exit(1);
}

async function connectDB() {
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      family: 4, // prefer IPv4; avoids IPv6 issues in some Docker setups
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Using URI host: ${new URL(uri).hostname}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
}

module.exports = connectDB;
