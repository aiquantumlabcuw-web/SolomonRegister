const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ticketCommentSchema = new Schema({
  ticketId: {
    type: String,
    required: true,
  },
  // Renamed "comment" to "message"
  message: {
    type: String,
    required: true,
  },
  // Field to denote the sender type; you may also use this for display if needed
  from: {
    type: String,
    required: true,
    enum: ['user', 'admin', 'system']
  },
  // New field for message type (can be the same as "from")
  messageType: {
    type: String,
    required: true,
    enum: ['user', 'admin', 'system']
  },
  // The userId of the sender
  userId: {
    type: String,
    required: true,
  },
  // Allows nested replies if needed; you can remove this if not required
  parentCommentId: {
    type: Schema.Types.ObjectId,
    ref: 'Comment',
    default: null,
  },
  attachment: {
    type: String,
    default: null,
  },
  // New field to track read/unread status for both user and admin
  messageStatus: {
    user: {
      type: String,
      enum: ['read', 'unread'],
      default: 'unread'
    },
    admin: {
      type: String,
      enum: ['read', 'unread'],
      default: 'unread'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Comment', ticketCommentSchema);
