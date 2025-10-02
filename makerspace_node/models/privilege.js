const mongoose = require('mongoose');

const privilegeSchema = new mongoose.Schema({
  privilege_name: { type: String, required: true },
  isAllowedToChangeTicketStatus: { type: Boolean, default: false },
  isAllowedToUpdateTicketDetails: { type: Boolean, default: false },
  isAllowedToViewAllTickets: { type: Boolean, default: false },
  isAllowedToSendAndRecieveComments: { type: Boolean, default: false },
  isAllowerToAddDeleteUsers: { type: Boolean, default: false },
  description: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const Privilege = mongoose.model('Privilege', privilegeSchema);

module.exports = Privilege;
