// Utility script to reset all FailedLogin records - run this to fix inconsistent data
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const FailedLogin = require('./models/Failedlogin');
const { BLOCK_ACTIONS } = require('./helpers/loginBlockingRules');

async function resetAllRecords() {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    
    console.log('Finding all failed login records...');
    const records = await FailedLogin.find({});
    console.log(`Found ${records.length} records to reset`);
    
    let updatedCount = 0;
    
    for (const record of records) {
      console.log(`Processing record for IP ${record.ip}`);
      console.log(`  Before: failedAttempts=${record.failedAttempts}, isBlocked=${record.isBlocked}`);
      
      // Reset critical fields
      record.failedAttempts = 0;
      record.signInFailedCount = 0;
      record.signInStage = 1;
      record.signInBlockExpires = null;
      record.isBlocked = false;
      record.unblockDate = null;
      record.thresholdReached = null;
      record.currentRuleId = null;
      // Keep appliedThresholds for history
      
      // Add a block history entry
      record.blockHistory.push({
        timestamp: new Date(),
        duration: "0",
        action: BLOCK_ACTIONS.ADMIN_RESET,
        adminNote: "Manual reset via admin script"
      });
      
      await record.save();
      updatedCount++;
      
      console.log(`  After: failedAttempts=${record.failedAttempts}, isBlocked=${record.isBlocked}`);
    }
    
    console.log(`Successfully reset ${updatedCount} records`);
    console.log('All records have been reset to zero failed attempts');
    process.exit(0);
  } catch (error) {
    console.error('Failed to reset records:', error);
    process.exit(1);
  }
}

resetAllRecords(); 