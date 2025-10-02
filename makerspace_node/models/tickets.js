const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ticketSchema = new Schema({
    serialNumber: {
        type: Number,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
    },
    department: {
        type: String,
        required: true,
    },
    ticketType: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true,
    },
    subject: {
        type: String,
        required: true,
    },
    details : {
        type: String,
        required: true,
    },
    ticketID: {
        type: String,
    },
    status: {
        type: String,
        default: 'Open',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    attachments: { type: [String], default: [] },  // Ensure attachments is an array of strings
    cloudLink: {
        type: [String],
        default: [], // New field to store the cloud link
    },
    lastChangedAt: {
        type: Date,
        default: Date.now
    }

});
module.exports = mongoose.model('Ticket', ticketSchema);