require('dotenv').config();
const mongoose = require('mongoose');
const EmailTemplate = require('../models/EmailTemplate');

const templates = [
  {
    type: 'ticketSubmission',
    name: 'Ticket Submission Confirmation',
    subject: 'Your ticket {ticketID} has been submitted successfully',
    body: `<h2>Ticket Submission Confirmation</h2>
<p>Dear {userName},</p>
<p>Your ticket has been successfully submitted. Here are the details:</p>
<ul>
  <li><strong>Ticket ID:</strong> {ticketID}</li>
  <li><strong>Subject:</strong> {subject}</li>
  <li><strong>Department:</strong> {department}</li>
  <li><strong>Type:</strong> {ticketType}</li>
  <li><strong>Status:</strong> {status}</li>
</ul>
<p>Details of your request:</p>
<p>{details}</p>
<p>We will review your ticket and get back to you soon.</p>
<p>Best regards,<br>Support Team</p>`,
    variables: ['userName', 'ticketID', 'subject', 'department', 'ticketType', 'status', 'details']
  },
  {
    type: 'ticketSubmissionAdmin',
    name: 'New Ticket Notification (Admin)',
    subject: 'New ticket {ticketID} submitted',
    body: `<h2>New Ticket Submission</h2>
<p>A new ticket has been submitted with the following details:</p>
<ul>
  <li><strong>Ticket ID:</strong> {ticketID}</li>
  <li><strong>User:</strong> {userName} ({userEmail})</li>
  <li><strong>Subject:</strong> {subject}</li>
  <li><strong>Department:</strong> {department}</li>
  <li><strong>Type:</strong> {ticketType}</li>
  <li><strong>Status:</strong> {status}</li>
</ul>
<p><strong>Details:</strong></p>
<p>{details}</p>
<p>Please review and take appropriate action.</p>`,
    variables: ['ticketID', 'userName', 'userEmail', 'subject', 'department', 'ticketType', 'status', 'details']
  },
  {
    type: 'ticketStatusUpdate',
    name: 'Ticket Status Update',
    subject: 'Update on your ticket {ticketID}',
    body: `<h2>Ticket Status Update</h2>
<p>Dear {userName},</p>
<p>Your ticket status has been updated:</p>
<ul>
  <li><strong>Ticket ID:</strong> {ticketID}</li>
  <li><strong>New Status:</strong> {status}</li>
  <li><strong>Updated By:</strong> {updatedBy}</li>
</ul>
<p>{message}</p>
<p>Best regards,<br>Support Team</p>`,
    variables: ['userName', 'ticketID', 'status', 'updatedBy', 'message']
  },
  {
    type: 'faqSubmission',
    name: 'FAQ Contact Form Submission',
    subject: 'Your inquiry has been received',
    body: `<h2>Thank You for Your Inquiry</h2>
<p>Dear {userName},</p>
<p>We have received your inquiry. Our team will review it and get back to you soon.</p>
<p><strong>Your Message:</strong></p>
<p>{message}</p>
<p>Best regards,<br>Support Team</p>`,
    variables: ['userName', 'message']
  },
  {
    type: 'faqResponse',
    name: 'FAQ Response',
    subject: 'Response to your inquiry',
    body: `<h2>Response to Your Inquiry</h2>
<p>Dear {userName},</p>
<p>Thank you for your patience. Here is our response to your inquiry:</p>
<p><strong>Your Question:</strong></p>
<p>{question}</p>
<p><strong>Our Response:</strong></p>
<p>{response}</p>
<p>Best regards,<br>Support Team</p>`,
    variables: ['userName', 'question', 'response']
  },
  {
    type: 'orderCreated',
    name: 'Order Confirmation',
    subject: 'Your order #{orderNumber} has been received',
    body: `<h2>Order Confirmation</h2>
<p>Dear {userName},</p>
<p>Thank you for your order. Here are the details:</p>
<ul>
  <li><strong>Order Number:</strong> {orderNumber}</li>
  <li><strong>Order Date:</strong> {orderDate}</li>
  <li><strong>Total Amount:</strong> {totalAmount}</li>
</ul>
<p>{orderDetails}</p>
<p>We will process your order soon.</p>
<p>Best regards,<br>Support Team</p>`,
    variables: ['userName', 'orderNumber', 'orderDate', 'totalAmount', 'orderDetails']
  },
  {
    type: 'orderStatusUpdate',
    name: 'Order Status Update',
    subject: 'Update on your order #{orderNumber}',
    body: `<h2>Order Status Update</h2>
<p>Dear {userName},</p>
<p>Your order status has been updated:</p>
<ul>
  <li><strong>Order Number:</strong> {orderNumber}</li>
  <li><strong>New Status:</strong> {status}</li>
  <li><strong>Updated On:</strong> {updateDate}</li>
</ul>
<p>{message}</p>
<p>Best regards,<br>Support Team</p>`,
    variables: ['userName', 'orderNumber', 'status', 'updateDate', 'message']
  }
];

async function initTemplates() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.URI);
    console.log('Connected to MongoDB');

    for (const template of templates) {
      await EmailTemplate.findOneAndUpdate(
        { type: template.type },
        template,
        { upsert: true, new: true }
      );
      console.log(`Template ${template.type} initialized`);
    }

    console.log('All templates initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing templates:', error);
    process.exit(1);
  }
}

initTemplates(); 