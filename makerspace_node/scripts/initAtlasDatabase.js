require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const { User } = require('../models/userModel');
const Role = require('../models/role');
const Privilege = require('../models/privilege');
const RolePrivilege = require('../models/rolePrivilege');
const EmailTemplate = require('../models/EmailTemplate');

// Initial data from mongo-init.js
const initialData = {
  users: [{
    "_id": new mongoose.Types.ObjectId("675225d9c50165864ff9f0e2"),
    "email": "123@email.com",
    "password": "$2b$10$3LzAANlwrSsLzwv.1E1Q6OVGIs.PGaYSQzpXMUzO52hdNxl2ftd.O",
    "role_id": new mongoose.Types.ObjectId("66aa86ed44bd2867f27ede9a"),
    "imageurl": "",
    "created_at": new Date(),
    "updated_at": new Date(),
    "__v": 0
  },
  {
    "_id": new mongoose.Types.ObjectId("675225ffc50165864ff9f0e5"),
    "email": "computer.science.cuwaa@gmail.com",
    "password": "$2b$10$Vf9tS0oCqhbBc4dFAelNIeC01YeIcGbE/cTNkHgKM1yDFLfv6Dm.i",
    "role_id": new mongoose.Types.ObjectId("66980c5d0ee1038a079892b7"),
    "imageurl": "",
    "created_at": new Date(),
    "updated_at": new Date(),
    "__v": 0
  }],
  
  roles: [{
    "_id": new mongoose.Types.ObjectId("66980c5d0ee1038a079892b7"),
    "role_name": "Admin",
    "created_at": new Date(),
    "updated_at": new Date(),
  },
  {
    "_id": new mongoose.Types.ObjectId("66aa86ed44bd2867f27ede9a"),
    "role_name": "User",
    "created_at": new Date(),
    "updated_at": new Date(),
    "__v": 0
  },
  {
    "_id": new mongoose.Types.ObjectId("66b276095080ffcfc251f312"),
    "role_name": "manager",
    "created_at": new Date(),
    "updated_at": new Date(),
    "__v": 0
  }],
  
  privileges: [{
    "_id": new mongoose.Types.ObjectId("66aa86ed44bd2867f27edea0"),
    "privilege_name": "User",
    "isAllowedToChangeTicketStatus": false,
    "isAllowedToUpdateTicketDetails": false,
    "isAllowedToViewAllTickets": false,
    "isAllowedToSendAndRecieveComments": false,
    "isAllowerToAddDeleteUsers": false,
    "created_at": new Date(),
    "updated_at": new Date(),
    "__v": 0
  },
  {
    "_id": new mongoose.Types.ObjectId("66aa9855bfda880abf6ae1c8"),
    "privilege_name": "Admin",
    "isAllowedToChangeTicketStatus": true,
    "isAllowedToUpdateTicketDetails": true,
    "isAllowedToViewAllTickets": true,
    "isAllowedToSendAndRecieveComments": true,
    "isAllowerToAddDeleteUsers": true,
    "created_at": new Date(),
    "updated_at": new Date(),
  }],
  
  rolePrivileges: [{
    "_id": new mongoose.Types.ObjectId("66aa86ed44bd2867f27edea3"),
    "role_id": new mongoose.Types.ObjectId("66aa86ed44bd2867f27ede9a"),
    "privilege_id": new mongoose.Types.ObjectId("66aa86ed44bd2867f27edea0"),
    "created_at": new Date(),
    "updated_at": new Date(),
    "__v": 0
  },
  {
    "_id": new mongoose.Types.ObjectId("66aa98bfbfda880abf6ae1ca"),
    "privilege_id": new mongoose.Types.ObjectId("66aa9855bfda880abf6ae1c8"),
    "role_id": new mongoose.Types.ObjectId("66980c5d0ee1038a079892b7"),
    "created_at": new Date(),
    "updated_at": new Date(),
  },
  {
    "_id": new mongoose.Types.ObjectId("66b276135080ffcfc251f322"),
    "role_id": new mongoose.Types.ObjectId("66b276095080ffcfc251f312"),
    "privilege_id": new mongoose.Types.ObjectId("66b275f05080ffcfc251f309"),
    "created_at": new Date(),
    "updated_at": new Date(),
    "__v": 0
  }],
  
  emailTemplates: [
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
      variables: ['userName', 'ticketId', 'ticketTitle', 'ticketType'],
      lastModified: new Date(),
      createdAt: new Date()
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
      variables: ['ticketId', 'userName', 'userEmail', 'ticketTitle', 'ticketType', 'ticketDescription'],
      lastModified: new Date(),
      createdAt: new Date()
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
      variables: ['userName', 'ticketId', 'status', 'updatedBy'],
      lastModified: new Date(),
      createdAt: new Date()
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
      variables: ['userName', 'question'],
      lastModified: new Date(),
      createdAt: new Date()
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
      variables: ['userName', 'answer'],
      lastModified: new Date(),
      createdAt: new Date()
    }
  ]
};

async function initializeDatabase() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    const uri = process.env.MONGODB_URI || process.env.URI;
    
    if (!uri) {
      console.error('ERROR: No MongoDB URI found. Please set MONGODB_URI or URI in .env file');
      process.exit(1);
    }
    
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    
    console.log('Connected to MongoDB Atlas successfully!');
    
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Role.deleteMany({}),
      Privilege.deleteMany({}),
      RolePrivilege.deleteMany({}),
      EmailTemplate.deleteMany({})
    ]);
    
    // Insert initial data
    console.log('Inserting initial data...');
    
    // Insert roles first (they're referenced by users)
    await Role.insertMany(initialData.roles);
    console.log('✓ Roles inserted');
    
    // Insert privileges
    await Privilege.insertMany(initialData.privileges);
    console.log('✓ Privileges inserted');
    
    // Insert role-privilege mappings
    await RolePrivilege.insertMany(initialData.rolePrivileges);
    console.log('✓ Role-privilege mappings inserted');
    
    // Insert users
    await User.insertMany(initialData.users);
    console.log('✓ Users inserted');
    
    // Insert email templates
    await EmailTemplate.insertMany(initialData.emailTemplates);
    console.log('✓ Email templates inserted');
    
    console.log('\n🎉 Database initialization completed successfully!');
    console.log('\nInitial users created:');
    console.log('- 123@email.com (User role)');
    console.log('- computer.science.cuwaa@gmail.com (Admin role)');
    console.log('\nYou can now start your server with: npm run dev');
    
    process.exit(0);
    
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeDatabase();
