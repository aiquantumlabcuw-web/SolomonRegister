const nodemailer = require('nodemailer');
require('dotenv').config();
const fs = require('fs');
const EmailTemplate = require('../models/EmailTemplate');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  logger: true,
  debug: true, 
});

// Default fallback templates for each type
const fallbackTemplates = {
  ticketSubmission: {
    subject: 'Ticket Submission Confirmation - {ticketId}',
    body: `
      <h2>Thank you for submitting your ticket</h2>
      <p>Dear {userName},</p>
      <p>Your ticket has been successfully submitted with the following details:</p>
      <ul>
        <li>Ticket ID: {ticketId}</li>
        <li>Subject: {ticketTitle}</li>
        <li>Type: {ticketType}</li>
        <li>Department: {department}</li>
      </ul>
      <p>We will review your request and get back to you shortly.</p>
      <p>Best regards,<br>Support Team</p>
    `
  },
  ticketSubmissionAdmin: {
    subject: 'New Ticket Submitted - {ticketId}',
    body: `
      <h2>New Ticket Submitted</h2>
      <p>A new ticket has been submitted with the following details:</p>
      <ul>
        <li>Ticket ID: {ticketId}</li>
        <li>User: {userEmail}</li>
        <li>Subject: {ticketTitle}</li>
        <li>Type: {ticketType}</li>
        <li>Department: {department}</li>
        <li>Details: {ticketDescription}</li>
      </ul>
      <p>Please review and respond accordingly.</p>
    `
  },
  ticketStatusUpdate: {
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
    `
  },
  faqSubmission: {
    subject: 'Your Question Has Been Received',
    body: `
      <h2>Thank you for your question</h2>
      <p>Dear {userName},</p>
      <p>We have received your question:</p>
      <blockquote>{question}</blockquote>
      <p>Our team will review your question and provide a response shortly.</p>
      <p>Best regards,<br>Support Team</p>
    `
  },
  faqResponse: {
    subject: 'Answer to Your Question',
    body: `
      <h2>Answer to Your Question</h2>
      <p>Dear {userName},</p>
      <p>Here is the answer to your question:</p>
      <blockquote>{answer}</blockquote>
      <p>If you have any further questions, please don't hesitate to ask.</p>
      <p>Best regards,<br>Support Team</p>
    `
  }
};

const processTemplate = async (type, variables) => {
  try {
    const template = await EmailTemplate.findOne({ type });
    if (!template) {
      console.warn(`Template not found for type: ${type}, using fallback template`);
      const fallback = fallbackTemplates[type];
      if (!fallback) {
        throw new Error(`No fallback template available for type: ${type}`);
      }
      template = fallback;
    }

    let subject = template.subject;
    let body = template.body;

    // Replace all variables in subject and body
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, 'g');
      subject = subject.replace(regex, value || '');
      body = body.replace(regex, value || '');
    });

    // Add default styling to the email body
    const styledBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            h2 {
              color: #2c3e50;
              margin-bottom: 20px;
            }
            ul {
              padding-left: 20px;
            }
            li {
              margin-bottom: 10px;
            }
            p {
              margin-bottom: 15px;
            }
            blockquote {
              background-color: #f5f5f5;
              padding: 15px;
              border-left: 4px solid #2c3e50;
              margin: 15px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          ${body}
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </body>
      </html>
    `;

    return { subject, body: styledBody };
  } catch (error) {
    console.error('Error processing template:', error);
    return null;
  }
};

const sendMail = async (mailOptions) => {
  try {
    // If template processing is requested
    if (mailOptions.template) {
      const processed = await processTemplate(mailOptions.template, mailOptions.variables || {});
      if (processed) {
        mailOptions.subject = processed.subject;
        mailOptions.html = processed.body; // Using HTML to preserve formatting
      } else {
        // Fallback to default subject and text if template processing fails
        console.warn('Template processing failed, using fallback content');
        mailOptions.html = `
          <h2>System Notification</h2>
          <p>An error occurred while processing the email template. Please contact support if this persists.</p>
        `;
      }
    }

    // Set default from address if not provided
    if (!mailOptions.from) {
      mailOptions.from = process.env.EMAIL_USER;
    }

    return new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
          reject(error);
        } else {
          console.log('Email sent:', info.response);
          resolve(info);
        }
      });
    });
  } catch (error) {
    console.error('Error in sendMail:', error);
    throw error;
  }
};

module.exports = {
  transporter,
  sendMail
};
