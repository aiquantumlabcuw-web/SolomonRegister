const mongoose = require('mongoose');

const ticketAdminEmailSchema = new mongoose.Schema({
    emailType: {
      type: String,
      required: true,
      enum: ['siteOwner', 'ticket', 'faq'],
      unique: true, // one document per type
      index: true,
    },
    emails: {
      type: [String],
      required: true,
      validate: {
        validator: function(v) {
          // Ensure each email is valid
          return v.every(email => /.+\@.+\..+/.test(email));
        },
        message: 'Please fill valid email addresses'
      },
    },
  });
  
  const TicketAdminEmail = mongoose.model('TicketAdminEmail', ticketAdminEmailSchema);
  module.exports = TicketAdminEmail;
  