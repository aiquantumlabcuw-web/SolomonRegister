const mongoose = require('mongoose');

const blockingRuleSchema = new mongoose.Schema({
  description: { 
    type: String, 
    required: true,
    trim: true
  },
  threshold: { 
    type: Number, 
    required: true,
    min: 1,
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value'
    }
  },
  duration: { 
    type: Number, 
    default: null, // Duration in milliseconds; null for permanent block
    validate: {
      validator: function(v) {
        return v === null || (Number.isInteger(v) && v > 0);
      },
      message: 'Duration must be null (for permanent) or a positive integer'
    }
  },
  action: { 
    type: String, 
    required: true,
    enum: ['block', 'notify', 'log']
  },
  // New fields for rule type and IP-specific configuration:
  type: { 
    type: String, 
    enum: ['global', 'ip'], 
    default: 'global', 
    required: true 
  },
  ips: { 
    type: [String], 
    default: [] 
  },
  // New field to enable/disable a rule without deleting it
  enabled: {
    type: Boolean,
    default: true
  },
  // Allow tracking which IPs this rule is currently applied to
  appliedTo: {
    type: [String],
    default: []
  }
}, { timestamps: true });

// Ensure threshold is unique for global rules (to maintain a clear progression)
blockingRuleSchema.index(
  { threshold: 1, type: 1 }, 
  { unique: true, partialFilterExpression: { type: 'global' } }
);

module.exports = mongoose.model('BlockingRule', blockingRuleSchema);
