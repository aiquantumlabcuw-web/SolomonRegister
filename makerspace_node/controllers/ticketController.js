const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Ticket = require('../models/tickets');
const Comment = require('../models/ticketComment');
const mailService = require('../service/mailService');
const shortid = require('shortid');
const STLParser = require('stl-parser');
const OBJFileParser = require('obj-file-parser');
const { User, isSimilarPassword, forgotPasswordS } = require('../models/userModel');
const { ConnectionPoolClosedEvent } = require('mongodb');
const TicketAdminEmail = require('../models/ticketAdminEmail');

// Add function to get next serial number
const getNextSerialNumber = async () => {
  const lastTicket = await Ticket.findOne().sort({ serialNumber: -1 });
  return lastTicket ? lastTicket.serialNumber + 1 : 1;
};

// Add function to initialize serial numbers for existing tickets
const initializeSerialNumbers = async () => {
  const tickets = await Ticket.find({ serialNumber: { $exists: false } }).sort({ createdAt: 1 });
  let currentSerialNumber = 1;
  
  for (const ticket of tickets) {
    ticket.serialNumber = currentSerialNumber++;
    await ticket.save();
  }
};

// Call initializeSerialNumbers when the server starts
initializeSerialNumbers().catch(console.error);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const filename = `${Date.now()}-${file.originalname}`;
    cb(null, filename);
  },
});
const upload = multer({ storage });

const isValidURL = (url) => {
  const urlPattern = new RegExp(
    '^(https?:\\/\\/)?' + // protocol
      '((([a-zA-Z0-9$-_@.&+!*"(),]|%[0-9a-fA-F]{2})+' +
      '(\\.[a-zA-Z]{2,})+)|localhost)' +
      '(:\\d+)?(\\/[-a-zA-Z0-9@:%_+.~#?&/=]*)*$',
    'i'
  );
  return urlPattern.test(url);
};

const downloadFile = async (req, res) => {
  let { filePath } = req.query;
  if (!filePath) {
    return res.status(400).json({ message: 'File path is required' });
  }
  try {
    filePath = decodeURIComponent(filePath);
    const resolvedPath = path.resolve(filePath);
    if (!fs.existsSync(resolvedPath)) {
      console.error('File not found:', resolvedPath);
      return res.status(404).json({ message: 'File not found' });
    }
    res.download(resolvedPath, (err) => {
      if (err) {
        console.error('Error while downloading file:', err);
        return res.status(500).json({ message: 'Error downloading file' });
      }
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const submitTicket = async (req, res) => {
  const { phone, department, ticketType, role, subject, details, testTicket } = req.body;
  const email = req.email;
  const isTestTicket = (testTicket === 'true');
  const ticketID = department.charAt(0).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();

  try {
    let cloudLink = [];
    if (req.body.cloudLinks) {
      cloudLink = JSON.parse(req.body.cloudLinks);
    }
    // Handle attachments
    const attachments = req.files ? req.files.map((file) => file.path) : [];

    // Get next serial number
    const serialNumber = await getNextSerialNumber();

    const ticket = new Ticket({
      serialNumber,
      ticketID,
      email,
      phone,
      department,
      ticketType,
      role,
      subject,
      details,
      attachments,
      cloudLinks : cloudLink,
      status: 'Open',
      createdAt: new Date().now,
    });

    await ticket.save();

    // Send confirmation email to user
    await mailService.sendMail({
      to: email,
      template: 'ticketSubmission',
      variables: {
        ticketId: ticketID,
        ticketTitle: subject,
        ticketType,
        department,
        userName: email,
        ticketDescription: details,
      }
    });

    // Get admin emails for ticket notifications
    let adminEmails = await TicketAdminEmail.findOne({ emailType: "ticket" });
    if (!adminEmails || adminEmails.emails.length === 0) {
      // Fallback to siteOwner emails if no ticket-specific emails are configured
      adminEmails = await TicketAdminEmail.findOne({ emailType: "siteOwner" });
    }

    // Send notification to admin(s)
    if (adminEmails && adminEmails.emails.length > 0) {
      await mailService.sendMail({
        to: adminEmails.emails,
        template: 'ticketSubmissionAdmin',
        variables: {
          ticketId: ticketID,
          userEmail: email,
          ticketTitle: subject,
          ticketDescription: details,
          ticketType,
          department,
          userName: email,

        }
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Ticket submitted successfully',
      ticketID,
    });
  } catch (error) {
    console.error('Error submitting ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting ticket',
      error: error.message,
    });
  }
};

const getAllTickets = async (req, res) => {
  try {
    const { searchTerm, priority, department, ticketType, role, status, ticketID, cloudLink } = req.query;
    let query = {};
    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { ticketType: { $regex: searchTerm, $options: 'i' } },
        { priority: { $regex: searchTerm, $options: 'i' } },
        { ticketID: { $regex: searchTerm, $options: 'i' } },
        { subject: { $regex: searchTerm, $options: 'i' } },
        { details: { $regex: searchTerm, $options: 'i' } },
        { cloudLink: { $regex: searchTerm, $options: 'i' } },
        { createdAt: { $regex: searchTerm, $options: 'i' } },
      ];
    }
    if (priority) query.priority = priority;
    if (department) query.department = department;
    if (ticketType) query.ticketType = ticketType;
    if (role) query.role = role;
    if (status) query.status = status;
    if (cloudLink) query.cloudLink = cloudLink;
    if (ticketID) query.ticketID = ticketID;
    const tickets = await Ticket.find(query);
    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve tickets', error: error.message });
  }
};

const getLatestTicketsCommentsDashboard = async (req, res) => {
  try {
    const tickets = await Ticket.find();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const shortlistedTickets = tickets.filter((ticket) => ticket.createdAt > twentyFourHoursAgo);
    res.status(200).json(shortlistedTickets);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve tickets', error: error.message });
  }
};

const submitComment = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ _id: req.body.ticketID });
    if (!ticket) {
      throw new Error('Ticket not found');
    }
    const email = ticket.email;
    const ticketCode = ticket.ticketID;
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }
    const parentTicket = await Comment.findOne({
      ticketId: req.body.ticketID,
      userId: user._id,
    }).sort({ createdAt: -1 });
    let parentCommentId = null;
    if (parentTicket) {
      parentCommentId = parentTicket._id;
    }
    const { ticketID, message, from } = req.body;
    const userId = user._id;
    let messageStatus;
    if (from === 'user') {
      messageStatus = { user: 'read', admin: 'unread' };
    } else if (from === 'admin') {
      messageStatus = { user: 'unread', admin: 'read' };
    } else {
      messageStatus = { user: 'unread', admin: 'unread' };
    }
    const ticketComment = new Comment({
      ticketId: ticketID,
      message, // Updated field name
      from,
      messageType: from, // Same as sender type
      userId,
      parentCommentId,
      messageStatus,
      createdAt: Date.now(),
    });
    if (req.file) {
      ticketComment.attachment = req.file.path;
    }
    await ticketComment.save();
    await Ticket.findByIdAndUpdate(req.body.ticketID, { lastChangedAt: Date.now() });
    if (from === 'admin') {
      await mailService.sendMail({
        from: '',
        to: email,
        subject: `You have a new message on your ticket ${ticketCode} from Admin`,
        text: 'There is a new message on your ticket. Please log in to view it.',
      });
    }
    res.status(200).json({ message: 'Message submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit message', error: error.message });
  }
};

const getAllComments = async (req, res) => {
  try {
    const { ticketId } = req.query;
    const comments = await Comment.find({ ticketId }).sort({ createdAt: 1 });
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve messages', error: error.message });
  }
};

const getMyTickets = async (req, res) => {
  try {
    const { email } = req;
    const { searchTerm, priority, department, ticketType, identity, cloudLink } = req.query;
    let query = { email };
    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { ticketType: { $regex: searchTerm, $options: 'i' } },
        { priority: { $regex: searchTerm, $options: 'i' } },
        { ticketID: { $regex: searchTerm, $options: 'i' } },
        { subject: { $regex: searchTerm, $options: 'i' } },
        { details: { $regex: searchTerm, $options: 'i' } },
        { cloudLink: { $regex: searchTerm, $options: 'i' } },
        { createdAt: { $regex: searchTerm, $options: 'i' } },
      ];
    }
    if (priority) query.priority = priority;
    if (department) query.department = department;
    if (ticketType) query.ticketType = ticketType;
    if (identity) query.identity = identity;
    if (cloudLink) query.cloudLink = cloudLink;
    const tickets = await Ticket.find(query);
    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve tickets', error: error.message });
  }
};

const updateTicketStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.status = status;
    console.log(ticket)
    // console.log('Ticket details:',  {variables: {
    //   ticketId: ticket.ticketID,
    //   status,
    //   updatedBy: 'Support Team',
    //   userName: ticket.email,
    //   ticketTitle: ticket.subject,
    //   ticketType: ticket.ticketType,
    //   department: ticket.department,
    //   ticketDescription: ticket.details}}); 
    await mailService.sendMail({
      to: ticket.email,
      template: 'ticketStatusUpdate',
      variables: {
      ticketId: ticket.ticketID,
      status,
      updatedBy: 'Support Team',
      userName: ticket.email,
      ticketTitle: ticket.subject,
      ticketType: ticket.ticketType,
      department: ticket.department,
      ticketDescription: ticket.details, // Ensure this is the correct field
      }
    });
    await ticket.save();

    res.json(ticket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  } 
}

const updateTicket = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  updates.lastChangedAt = Date.now();
  try {
    const updatedTicket = await Ticket.findByIdAndUpdate(id, updates, { new: true });
    if (!updatedTicket) {
      return res.status(404).send('Ticket not found');
    }
    await mailService.sendMail({
      from: '',
      to: updatedTicket.email,
      subject: 'You have a change in your ticket from Admin side ' + updatedTicket.ticketID,
      text: `There is an update to your ticket. New changes are `,
    });
    res.json(updatedTicket);
  } catch (error) {
    res.status(500).send('Server error');
  }
};

const deleteTicket = async (req, res) => {
  const { id } = req.params;
  console.log(id);
  try {
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    if (['shipped', 'closed'].includes(ticket.status.toLowerCase())) {
      return res.status(400).json({ message: 'Cannot delete ticket with status shipped or closed' });
    }
    await ticket.deleteOne();
    return res.status(200).json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getTicketById = async (req, res) => {
  const { id } = req.query;
  try {
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    console.log(ticket);
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error, message: 'Server error' });
  }
};

const getTicketsByDepartment = async (req, res) => {
  try {
    let result = await Ticket.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
          label: { $first: '$department' },
        },
      },
    ]);
    result = result.map(({ _id: id, count: value, ...rest }) => ({ id, value, ...rest }));
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message, message: 'Server error' });
  }
};

const getTicketsByStatus = async (req, res) => {
  try {
    let result = await Ticket.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          label: { $first: '$status' },
        },
      },
    ]);
    result = result.map(({ _id: id, count: value, ...rest }) => ({ id, value, ...rest }));
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message, message: 'Server error' });
  }
};

const getLatestTicketsDashboard = async (req, res) => {
  try {
    const tickets = await Ticket.find();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const shortlistedTickets = tickets.filter((ticket) => ticket.createdAt > twentyFourHoursAgo);
    res.status(200).json(shortlistedTickets);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve tickets', error: error.message });
  }
};

const getMyLatestTicketsDashboard = async (req, res) => {
  try {
    const { email } = req;
    const tickets = await Ticket.find({ email });
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const shortlistedTickets = tickets.filter((ticket) => ticket.createdAt > twentyFourHoursAgo);
    res.status(200).json(shortlistedTickets);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve tickets', error: error.message });
  }
};

const getMyLatestCommments = async (req, res) => {
  try {
    const { email } = req;
    const user = await User.findOne({ email });
    const comments = await Comment.find({ userId: user._id });
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let shortlistedComments = comments.filter((comment) => comment.createdAt > twentyFourHoursAgo);
    shortlistedComments = shortlistedComments.map(async (comment) => {
      const ticket = await Ticket.findOne({ _id: comment.ticketId });
      comment.ticketId = ticket.ticketID;
      return comment;
    });
    shortlistedComments = await Promise.all(shortlistedComments);
    res.status(200).json(shortlistedComments);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve tickets', error: error.message });
  }
};

// New endpoint: Mark messages as read for a given role (user or admin)
const markMessagesAsRead = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const role = req.query.role; // Expected to be 'user' or 'admin'
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }
    const updateResult = await Comment.updateMany(
      { ticketId, [`messageStatus.${role}`]: 'unread' },
      { $set: { [`messageStatus.${role}`]: 'read' } }
    );
    res.status(200).json({ message: 'Messages marked as read', result: updateResult });
  } catch (error) {
    res.status(500).json({ message: 'Error marking messages as read', error: error.message });
  }
};

/**
 * Get the next ticket that needs attention
 * Prioritization:
 * 1. Open tickets with unread messages
 * 2. In Progress tickets with unread messages
 * 3. Open tickets (regardless of messages)
 * 4. In Progress tickets (regardless of messages)
 */
const getNextUnprocessedTicket = async (req, res) => {
  try {
    const { currentId } = req.query;
    
    // First, try to find tickets with unread messages for admin
    // We need to find all comments with unread status for admin
    const unreadComments = await Comment.find({
      'messageStatus.admin': 'unread'
    }).distinct('ticketId');
    
    // Convert string IDs to ObjectIDs if needed (depends on your model setup)
    const unreadTicketIds = unreadComments;
    
    // Query to find tickets with specific statuses, excluding the current ticket
    const query = {
      _id: { $ne: currentId }, // Exclude current ticket
      status: { $in: ['Open', 'In Progress'] } // Only Open or In Progress tickets
    };
    
    // First try to find tickets with unread messages
    if (unreadTicketIds.length > 0) {
      const ticketsWithUnread = await Ticket.find({
        ...query,
        _id: { $in: unreadTicketIds }
      })
      .sort({ status: 1, createdAt: 1 }) // Sort by status (Open first) then by oldest first
      .limit(1);
      
      if (ticketsWithUnread.length > 0) {
        return res.status(200).json(ticketsWithUnread[0]);
      }
    }
    
    // If no tickets with unread messages, find any Open or In Progress ticket
    const nextTicket = await Ticket.find(query)
      .sort({ status: 1, createdAt: 1 }) // Sort by status (Open first) then by oldest first
      .limit(1);
    
    if (nextTicket.length > 0) {
      return res.status(200).json(nextTicket[0]);
    }
    
    // No tickets to process
    return res.status(200).json(null);
  } catch (error) {
    console.error('Error finding next ticket:', error);
    res.status(500).json({ message: 'Error finding next ticket', error: error.message });
  }
};

module.exports = {
  getMyLatestCommments,
  getTicketsByStatus,
  submitTicket,
  upload,
  getAllTickets,
  submitComment,
  getAllComments,
  getMyTickets,
  updateTicketStatus,
  updateTicket,
  deleteTicket,
  getTicketById,
  getTicketsByDepartment,
  getLatestTicketsDashboard,
  getMyLatestTicketsDashboard,
  downloadFile,
  markMessagesAsRead,
  getNextUnprocessedTicket,
};
