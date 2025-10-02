const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: [
            'ticketSubmission',
            'ticketSubmissionAdmin',
            'ticketStatusUpdate',
            'faqSubmission',
            'faqResponse'
        ],
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    variables: [{
        type: String,
        required: true
    }],
    lastModified: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Create a compound index to ensure unique template types
emailTemplateSchema.index({ type: 1 }, { unique: true });

// Update lastModified on save
emailTemplateSchema.pre('save', function(next) {
    this.lastModified = new Date();
    next();
});

// Static method to create default templates if they don't exist
emailTemplateSchema.statics.initializeDefaultTemplates = async function() {
    const defaultTemplates = [
        {
            type: 'ticketSubmission',
            name: 'Ticket Submission Confirmation',
            subject: 'Your Ticket Has Been Submitted - {ticketId}',
            body: `
                <h2>Thank you for submitting your ticket</h2>
                <p>Dear {userName},</p>
                <p>Your ticket has been successfully submitted with the following details:</p>
                <ul>
                    <li>Ticket ID: {ticketId}</li>
                    <li>Subject: {ticketTitle}</li>
                    <li>Type: {ticketType}</li>
                </ul>
                <p>We will review your request and get back to you shortly.</p>
                <p>Best regards,<br>Support Team</p>
            `,
            variables: ['userName', 'ticketId', 'ticketTitle', 'ticketType']
        },
        {
            type: 'ticketSubmissionAdmin',
            name: 'New Ticket Notification (Admin)',
            subject: 'New Ticket Submitted - {ticketId}',
            body: `
                <h2>New Ticket Submitted</h2>
                <p>A new ticket has been submitted with the following details:</p>
                <ul>
                    <li>Ticket ID: {ticketId}</li>
                    <li>User: {userName}</li>
                    <li>Email: {userEmail}</li>
                    <li>Subject: {ticketTitle}</li>
                    <li>Type: {ticketType}</li>
                    <li>Description: {ticketDescription}</li>
                </ul>
                <p>Please review and respond accordingly.</p>
            `,
            variables: ['ticketId', 'userName', 'userEmail', 'ticketTitle', 'ticketType', 'ticketDescription']
        },
        {
            type: 'ticketStatusUpdate',
            name: 'Ticket Status Update',
            subject: 'Ticket Status Updated - {ticketId}',
            body: `
                <h2>Ticket Status Update</h2>
                <p>Dear {userName},</p>
                <p>The status of your ticket has been updated:</p>
                <ul>
                    <li>Ticket ID: {ticketId}</li>
                    <li>New Status: {status}</li>
                    <li>Updated By: {updatedBy}</li>
                </ul>
                <p>You can view the updated status in your dashboard.</p>
                <p>Best regards,<br>Support Team</p>
            `,
            variables: ['userName', 'ticketId', 'status', 'updatedBy']
        },
        {
            type: 'faqSubmission',
            name: 'FAQ Submission Confirmation',
            subject: 'Your Question Has Been Received',
            body: `
                <h2>Thank you for your question</h2>
                <p>Dear {userName},</p>
                <p>We have received your question:</p>
                <blockquote>{question}</blockquote>
                <p>Our team will review your question and provide a response shortly.</p>
                <p>Best regards,<br>Support Team</p>
            `,
            variables: ['userName', 'question']
        },
        {
            type: 'faqResponse',
            name: 'FAQ Response',
            subject: 'Answer to Your Question',
            body: `
                <h2>Answer to Your Question</h2>
                <p>Dear {userName},</p>
                <p>Here is the answer to your question:</p>
                <blockquote>{answer}</blockquote>
                <p>If you have any further questions, please don't hesitate to ask.</p>
                <p>Best regards,<br>Support Team</p>
            `,
            variables: ['userName', 'answer']
        }
    ];

    for (const template of defaultTemplates) {
        const exists = await this.findOne({ type: template.type });
        if (!exists) {
            await this.create(template);
        }
    }
};

const EmailTemplate = mongoose.model('EmailTemplate', emailTemplateSchema);

module.exports = EmailTemplate; 