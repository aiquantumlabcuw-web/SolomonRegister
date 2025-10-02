const FailedLogin = require("../models/Failedlogin");
const BlockingRule = require("../models/BlockingRule");

// Valid action values for blockHistory
const BLOCK_ACTIONS = {
  BLOCKED: 'Blocked',
  UNBLOCKED: 'Unblocked',
  RESET_ATTEMPTS: 'Reset Attempts',
  MODIFIED: 'Modified',
  BLOCK_EXPIRED: 'Block Expired',
  LOGIN_SUCCESS: 'Login Success - Attempts Reset',
  ADMIN_UNBLOCKED: 'Admin Unblocked',
  ADMIN_RESET: 'Admin Reset Attempts',
  MANUAL_BLOCK: 'Manual Block'
};

// Define the maximum time gap between failures to be considered "continuous"
// If more time than this passes between failures, we might consider it a new session
const CONTINUOUS_FAILURE_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

// Helper to persist a record
async function saveIpRecord(rec) {
  await rec.save();
  return rec;
}

// Helper: normalize IP addresses to ensure consistency
function normalizeIp(ip) {
  // Convert IPv6 localhost representations to IPv4
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    return '127.0.0.1';
  }
  return ip;
}

// Helper: fetch or create an IP record
async function getIpRecord(ip) {
  if (!ip) {
    console.error("No IP address provided to getIpRecord");
    return null;
  }
  
  // Normalize the IP address
  ip = normalizeIp(ip);
  
  let rec = await FailedLogin.findOne({ ip });
  if (!rec) {
    rec = new FailedLogin({
      ip,
      failedAttempts:      0,
      lastFailedAttempt:   null,
      signInFailedCount:   0,
      signInStage:         1,
      signInBlockExpires:  null,
      blockHistory:        [],
      adminBlockExpires:   null,
      adminPermBlocked:    false,
      isBlocked:           false,
      unblockDate:         null,
      thresholdReached:    null,
      currentRuleId:       null,
      appliedThresholds:   []
    });
    await rec.save();
  }
  return rec;
}

/**
 * Returns the current block status for an IP,
 * including remaining time in ms and minutes.
 */
const checkBlockStatus = async (ip) => {
  if (!ip) {
    console.error("No IP address provided to checkBlockStatus");
    return { blocked: false };
  }
  
  // Normalize the IP address
  ip = normalizeIp(ip);
  
  const rec = await getIpRecord(ip);
  if (!rec) {
    return { blocked: false };
  }
  
  const now = Date.now();
  let ruleName = null;
  if (rec.currentRuleId) {
    try {
      const rule = await BlockingRule.findById(rec.currentRuleId);
      if (rule) ruleName = rule.description;
    } catch (e) { ruleName = null; }
  }

  // 1) Admin‐imposed block has priority
  if (rec.adminPermBlocked) {
    return {
      blocked:           true,
      expires:           null,
      permanent:         true,
      remainingMs:       Infinity,
      remainingMinutes:  Infinity,
      failedAttempts:    rec.failedAttempts || 'N/A',
      thresholdReached:  rec.thresholdReached || 'N/A',
      ruleName:          ruleName || 'Admin Block',
      duration:          null,
      message:           "Your account has been permanently blocked by an administrator."
    };
  }

  // 2) Admin temporary block
  if (rec.adminBlockExpires && now < rec.adminBlockExpires.getTime()) {
    const remainingMs = rec.adminBlockExpires.getTime() - now;
    return {
      blocked:          true,
      expires:          rec.adminBlockExpires,
      permanent:        false,
      remainingMs,
      remainingMinutes: Math.ceil(remainingMs / 60000),
      failedAttempts:   rec.failedAttempts || 'N/A',
      thresholdReached: rec.thresholdReached || 'N/A',
      ruleName:         ruleName || 'Admin Block',
      duration:         formatDuration(remainingMs),
      message:          `Your account is temporarily blocked by an administrator. Try again in ${formatDuration(remainingMs)}.`
    };
  }

  // 3) Rule-based block - user is in blocked state
  if (rec.isBlocked && rec.unblockDate && now < rec.unblockDate.getTime()) {
    const remainingMs = rec.unblockDate.getTime() - now;
    return {
      blocked:          true,
      expires:          rec.unblockDate,
      permanent:        false,
      remainingMs,
      remainingMinutes: Math.ceil(remainingMs / 60000),
      failedAttempts:   rec.failedAttempts || 'N/A',
      thresholdReached: rec.thresholdReached || 'N/A',
      ruleName:         ruleName || 'N/A',
      duration:         formatDuration(remainingMs),
      message:          `Too many failed login attempts. Please try again in ${formatDuration(remainingMs)}.`
    };
  }

  // 4) If block has expired, update the record but don't return blocked status
  if ((rec.isBlocked && rec.unblockDate && now >= rec.unblockDate.getTime()) || 
      (rec.adminBlockExpires && now >= rec.adminBlockExpires.getTime())) {
    
    // Move user back to failed attempts list, but preserve the attempts count
    if (rec.isBlocked && rec.unblockDate && now >= rec.unblockDate.getTime()) {
      // Track that this threshold was already applied
      if (rec.thresholdReached && !rec.appliedThresholds.includes(rec.thresholdReached)) {
        rec.appliedThresholds.push(rec.thresholdReached);
      }
      
      rec.isBlocked = false;
      rec.unblockDate = null;
      // Reset the threshold and rule ID so the user can start fresh from their current attempts count
      rec.thresholdReached = null;
      rec.currentRuleId = null;
      
      rec.blockHistory.push({
        timestamp: new Date(),
        action: BLOCK_ACTIONS.BLOCK_EXPIRED,
        duration: "0"
      });
      
      await rec.save();
    }
    
    // Clear admin block if expired
    if (rec.adminBlockExpires && now >= rec.adminBlockExpires.getTime()) {
      rec.adminBlockExpires = null;
      await rec.save();
    }
  }

  // 5) Legacy sign-in block
  if (rec.signInBlockExpires && now < rec.signInBlockExpires.getTime()) {
    const remainingMs = rec.signInBlockExpires.getTime() - now;
    return {
      blocked:          true,
      expires:          rec.signInBlockExpires,
      remainingMs,
      remainingMinutes: Math.ceil(remainingMs / 60000),
      failedAttempts:   rec.failedAttempts || 'N/A',
      thresholdReached: rec.thresholdReached || 'N/A',
      ruleName:         ruleName || 'N/A',
      duration:         formatDuration(remainingMs),
      message:          `Your account is temporarily blocked. Try again in ${formatDuration(remainingMs)}.`
    };
  }

  return { blocked: false };
};

/**
 * Reset failed attempts after a successful login
 * Completely removes user from tracking on successful login
 */
const resetFailedAttempts = async (ip) => {
  try {
    if (!ip) {
      console.error("No IP address provided to resetFailedAttempts");
      return null;
    }
    
    console.log(`Attempting to delete record for IP: ${ip} from failed logins table`);
    
    // Simply delete the record - no extra checks needed
    await FailedLogin.deleteOne({ ip });
    console.log(`Deleted any record for IP ${ip} from failed logins table`);
    return { success: true };
    
  } catch (error) {
    console.error(`Error in resetFailedAttempts for IP ${ip}:`, error);
    return null;
  }
};

/**
 * Applies the business rules for blocking after failed login attempts
 * This handles the progressive blocking workflow
 */
const handleFailedAttempt = async (ip) => {
  if (!ip) {
    console.error("No IP address provided to handleFailedAttempt");
    return {
      blocked: false,
      failedAttempts: 1,
      message: "Failed login attempt recorded."
    };
  }
  
  // Normalize the IP address
  ip = normalizeIp(ip);
  
  let ipData = await getIpRecord(ip);
  if (!ipData) {
    return {
      blocked: false,
      failedAttempts: 1,
      message: "Failed login attempt recorded."
    };
  }
  
  const now = Date.now();

  // If admin permanent block is in place, we don't increase attempts
  if (ipData.adminPermBlocked) {
    return {
      blocked: true,
      permanent: true,
      failedAttempts: ipData.failedAttempts,
      thresholdReached: ipData.thresholdReached,
      ruleName: ipData.currentRuleId,
      duration: null,
      remainingMinutes: Infinity,
      message: "Your account has been permanently blocked by an administrator."
    };
  }

  // If admin temporary block is active, we don't increase attempts
  if (ipData.adminBlockExpires && now < ipData.adminBlockExpires.getTime()) {
    const remainingMs = ipData.adminBlockExpires.getTime() - now;
    return {
      blocked: true,
      expires: ipData.adminBlockExpires,
      remainingMs,
      remainingMinutes: Math.ceil(remainingMs / 60000),
      failedAttempts: ipData.failedAttempts,
      thresholdReached: ipData.thresholdReached,
      ruleName: ipData.currentRuleId,
      duration: formatDuration(remainingMs),
      message: `Your account is temporarily blocked by an administrator. Try again in ${formatDuration(remainingMs)}.`
    };
  }

  // If user is currently in the blocked list and the block is active
  if (ipData.isBlocked && ipData.unblockDate && now < ipData.unblockDate.getTime()) {
    const remainingMs = ipData.unblockDate.getTime() - now;
    return {
      blocked: true,
      expires: ipData.unblockDate,
      remainingMs,
      remainingMinutes: Math.ceil(remainingMs / 60000),
      failedAttempts: ipData.failedAttempts,
      thresholdReached: ipData.thresholdReached,
      ruleName: ipData.currentRuleId,
      duration: formatDuration(remainingMs),
      message: `Too many failed login attempts. Please try again in ${formatDuration(remainingMs)}.`
    };
  }
  
  // If block expired, move user back to failed attempts list
  if (ipData.isBlocked && ipData.unblockDate && now >= ipData.unblockDate.getTime()) {
    // Track that this threshold was already applied
    if (ipData.thresholdReached && !ipData.appliedThresholds.includes(ipData.thresholdReached)) {
      ipData.appliedThresholds.push(ipData.thresholdReached);
    }
    
    ipData.isBlocked = false;
    ipData.unblockDate = null;
    // Reset the threshold and rule ID so the user can start fresh with their current attempts
    ipData.thresholdReached = null;
    ipData.currentRuleId = null;
    
    ipData.blockHistory.push({
      timestamp: new Date(),
      action: BLOCK_ACTIONS.BLOCK_EXPIRED,
      duration: "0"
    });
  }

  // Check if this is a new session of failures by looking at the time gap
  const lastFailureTime = ipData.lastFailedAttempt ? ipData.lastFailedAttempt.getTime() : 0;
  const timeSinceLastFailure = now - lastFailureTime;
  
  // If it's been a long time since the last failure, this might be a new session
  // Reset the counter if it's been more than the continuous failure window
  if (timeSinceLastFailure > CONTINUOUS_FAILURE_WINDOW_MS && ipData.failedAttempts > 0) {
    console.log(`Large time gap (${Math.round(timeSinceLastFailure/60000)} minutes) since last failure for IP ${ip}. Resetting counter.`);
    ipData.failedAttempts = 0;
    ipData.blockHistory.push({
      timestamp: new Date(),
      action: BLOCK_ACTIONS.RESET_ATTEMPTS,
      duration: "0",
      adminNote: `Auto-reset due to ${Math.round(timeSinceLastFailure/60000)} minute gap between attempts`
    });
  }

  // Increment failed attempts counter
  ipData.failedAttempts = (ipData.failedAttempts || 0) + 1;
  ipData.lastFailedAttempt = new Date();

  // Get all available rules sorted by threshold (ascending)
  const allRules = await BlockingRule.find({ enabled: { $ne: false } }).sort({ threshold: 1 });
  
  // Check if no rules exist
  if (!allRules || allRules.length === 0) {
    await ipData.save();
    return {
      blocked: false,
      failedAttempts: ipData.failedAttempts,
      message: `Failed login attempt recorded. No blocking rules defined.`
    };
  }
  
  // If the user was previously blocked and the block expired,
  // we need to find the next threshold above their current attempts
  let applicableThreshold = null;
  let applicableRule = null;
  
  // Find the next threshold that applies based on current attempts
  for (const rule of allRules) {
    if (ipData.failedAttempts >= rule.threshold) {
      // Only consider thresholds that haven't already been applied to this IP
      if (!ipData.appliedThresholds.includes(rule.threshold)) {
        // User has reached or exceeded this threshold
        if (!applicableThreshold || rule.threshold > applicableThreshold) {
          applicableThreshold = rule.threshold;
          applicableRule = rule;
        }
      }
    }
  }
  
  // If we found a rule with a threshold that applies to the current attempts count
  // AND the user hasn't already been blocked for this threshold (thresholdReached is different)
  if (applicableRule && applicableThreshold !== ipData.thresholdReached) {
    // Apply this rule - move user to blocked list
    ipData.isBlocked = true;
    ipData.thresholdReached = applicableThreshold;
    ipData.currentRuleId = applicableRule._id;
    
    // Handle the duration
    if (applicableRule.duration === null) {
      // Permanent block (should be rare in the regular rules)
      ipData.unblockDate = null;
      ipData.adminPermBlocked = true;
    } else {
      // Temporary block
      ipData.unblockDate = new Date(now + applicableRule.duration);
      ipData.adminPermBlocked = false;
    }
    
    // Record in block history
    ipData.blockHistory.push({
      timestamp: new Date(),
      duration: applicableRule.duration === null ? "permanent" : `${applicableRule.duration}ms`,
      action: BLOCK_ACTIONS.BLOCKED,
      rule: applicableRule.description,
      threshold: applicableThreshold
    });
    
    // Save and return block status
    await ipData.save();
    
    const remainingMs = applicableRule.duration;
    return {
      blocked: true,
      failedAttempts: ipData.failedAttempts,
      blockExpires: ipData.unblockDate,
      remainingMs: remainingMs,
      remainingMinutes: remainingMs ? Math.ceil(remainingMs / 60000) : null,
      thresholdReached: applicableThreshold,
      ruleName: applicableRule.description,
      duration: formatDuration(remainingMs),
      message: `Account blocked due to ${ipData.failedAttempts} failed login attempts (threshold: ${applicableThreshold}, rule: ${applicableRule.description}). Please try again in ${formatDuration(remainingMs)}.`
    };
  }
  
  // If no rules were applied, just save the updated attempt count
  await ipData.save();
  
  // Find the next rule threshold
  const nextRule = allRules.find(r => r.threshold > ipData.failedAttempts);
  
  return {
    blocked: false,
    failedAttempts: ipData.failedAttempts,
    attemptsUntilBlock: nextRule ? (nextRule.threshold - ipData.failedAttempts) : null,
    nextThreshold: nextRule ? nextRule.threshold : null,
    message: nextRule ? `Login failed. ${ipData.failedAttempts} failed attempts. Account will be blocked after ${nextRule.threshold} attempts.` : `Login failed. ${ipData.failedAttempts} failed attempts recorded.`
  };
};

/**
 * Sign-in specific blocking check
 * Used in auth middleware
 */
const signInCheckBlockStatus = async (ip) => {
  // Use the main checkBlockStatus function
  return await checkBlockStatus(ip);
};

/**
 * Sign-in specific failed attempt handler
 * Used in auth controller
 */
const signInHandleFailedAttempt = async (ip) => {
  // Use the main handleFailedAttempt function
  return await handleFailedAttempt(ip);
};

// Helper for formatting durations in a human-readable way
const formatDuration = (ms) => {
  if (!ms) return "permanently";
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''}`;
  
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''}`;
};

/**
 * Unblock a user and move them back to failed attempts table
 * Used by admin controllers
 */
const unblockUser = async (ip) => {
  if (!ip) {
    console.error("No IP address provided to unblockUser");
    return null;
  }
  
  // Normalize the IP address
  ip = normalizeIp(ip);
  
  const rec = await getIpRecord(ip);
  if (!rec) {
    return null;
  }
  
  // Update blocked status but keep in failed attempts list
  rec.isBlocked = false;
  rec.unblockDate = null;
  rec.adminBlockExpires = null;
  rec.adminPermBlocked = false;
  // We keep the failedAttempts count so they remain in failed attempts table
  
  // Record in history
  rec.blockHistory.push({
    timestamp: new Date(),
    duration: "0",
    action: BLOCK_ACTIONS.ADMIN_UNBLOCKED
  });
  
  await rec.save();
  return rec;
};

/**
 * Clear all failed attempts and remove from both lists
 * Used by admin controllers
 */
const clearFailedAttempts = async (ip) => {
  if (!ip) {
    console.error("No IP address provided to clearFailedAttempts");
    return null;
  }
  
  // Normalize the IP address
  ip = normalizeIp(ip);
  
  const rec = await getIpRecord(ip);
  if (!rec) {
    return null;
  }
  
  // Reset everything except admin-specific blocks
  rec.failedAttempts = 0;
  rec.isBlocked = false;
  rec.unblockDate = null;
  rec.thresholdReached = null;
  rec.currentRuleId = null;
  rec.appliedThresholds = [];  // Clear applied thresholds
  
  // Record in history
  rec.blockHistory.push({
    timestamp: new Date(),
    duration: "0",
    action: BLOCK_ACTIONS.ADMIN_RESET
  });
  
  await rec.save();
  return rec;
};

/**
 * Utility function to fix any records with invalid blockHistory action values
 * This should be called once during startup to ensure data consistency
 */
const migrateInvalidBlockHistoryActions = async () => {
  try {
    console.log("Checking for records with invalid blockHistory actions...");
    
    // Get all records
    const allRecords = await FailedLogin.find({});
    let migratedCount = 0;
    
    for (const record of allRecords) {
      let needsSave = false;
      
      // Check each blockHistory entry
      if (record.blockHistory && record.blockHistory.length > 0) {
        for (let i = 0; i < record.blockHistory.length; i++) {
          const entry = record.blockHistory[i];
          
          // Skip entries with valid actions
          if (!entry.action || !Object.values(BLOCK_ACTIONS).includes(entry.action)) {
            console.log(`Fixing invalid action '${entry.action}' for IP ${record.ip}`);
            
            // Map common invalid values to valid ones
            if (entry.action === "Reset") {
              record.blockHistory[i].action = BLOCK_ACTIONS.RESET_ATTEMPTS;
            } else if (entry.action.includes("Expired")) {
              record.blockHistory[i].action = BLOCK_ACTIONS.BLOCK_EXPIRED;
            } else if (entry.action.includes("Success")) {
              record.blockHistory[i].action = BLOCK_ACTIONS.LOGIN_SUCCESS;
            } else if (entry.action.includes("Admin") && entry.action.includes("Unblock")) {
              record.blockHistory[i].action = BLOCK_ACTIONS.ADMIN_UNBLOCKED;
            } else if (entry.action.includes("Admin") && entry.action.includes("Reset")) {
              record.blockHistory[i].action = BLOCK_ACTIONS.ADMIN_RESET;
            } else if (entry.action.includes("Manual")) {
              record.blockHistory[i].action = BLOCK_ACTIONS.MANUAL_BLOCK;
            } else if (entry.action.includes("Block") && !entry.action.includes("Unblock")) {
              record.blockHistory[i].action = BLOCK_ACTIONS.BLOCKED;
            } else if (entry.action.includes("Unblock")) {
              record.blockHistory[i].action = BLOCK_ACTIONS.UNBLOCKED;
            } else {
              // Default to "Modified" for anything we can't clearly map
              record.blockHistory[i].action = BLOCK_ACTIONS.MODIFIED;
            }
            
            needsSave = true;
          }
        }
      }
      
      // Save the record if we made changes
      if (needsSave) {
        await record.save();
        migratedCount++;
      }
    }
    
    console.log(`Migration complete. Fixed ${migratedCount} records.`);
  } catch (error) {
    console.error("Error migrating invalid blockHistory actions:", error);
  }
};

module.exports = {
  checkBlockStatus,
  handleFailedAttempt,
  resetFailedAttempts,
  signInCheckBlockStatus,
  signInHandleFailedAttempt,
  formatDuration,
  unblockUser,
  clearFailedAttempts,
  getIpRecord,
  saveIpRecord,
  BLOCK_ACTIONS,
  migrateInvalidBlockHistoryActions
};
