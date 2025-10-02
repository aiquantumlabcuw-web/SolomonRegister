const mongoose = require("mongoose");

// Define valid actions as constants
const VALID_ACTIONS = [
  'Blocked', 
  'Unblocked', 
  'Reset Attempts', 
  'Modified', 
  'Block Expired', 
  'Login Success - Attempts Reset', 
  'Admin Unblocked', 
  'Admin Reset Attempts', 
  'Manual Block'
];

const failedLoginSchema = new mongoose.Schema({
  ip: { type: String, required: true, unique: true },
  failedAttempts: { type: Number, default: 0 },
  lastFailedAttempt: { type: Date },
  // Sign-in workflow fields (isolated from admin blocks)
  signInFailedCount: { type: Number, default: 0 },   // 0–2 before block
  signInStage: { type: Number, default: 1 },         // 1–4 stages
  signInBlockExpires: { type: Date, default: null }, // isolated sign-in block timestamp
  blockHistory: [{ 
    timestamp: { type: Date, default: Date.now },
    duration: { type: String, default: "0" },
    action: { 
      type: String, 
      enum: VALID_ACTIONS,
      default: 'Blocked' 
    },
    // Add additional fields that might be in existing records
    rule: { type: String },
    threshold: { type: Number },
    admin: { type: Boolean },
    adminNote: { type: String }
  }],
  adminBlockExpires: { type: Date, default: null },  // block set by admin rules
  adminPermBlocked: { type: Boolean, default: false }, // permanent admin block
  // Track if this is a failed attempt or a blocked user
  isBlocked: { type: Boolean, default: false },      // Indicates if user is currently blocked
  unblockDate: { type: Date, default: null },        // When user will be unblocked
  thresholdReached: { type: Number, default: null },  // Which threshold triggered the current block
  currentRuleId: { type: mongoose.Schema.Types.ObjectId, ref: 'BlockingRule', default: null }, // Current applied rule
  // New field to track which thresholds have already been applied to this IP
  appliedThresholds: { type: [Number], default: [] } // List of thresholds that have already blocked this IP
});

// Export the valid actions for use in other modules
failedLoginSchema.statics.VALID_ACTIONS = VALID_ACTIONS;

module.exports = mongoose.model("Failedlogin", failedLoginSchema);
