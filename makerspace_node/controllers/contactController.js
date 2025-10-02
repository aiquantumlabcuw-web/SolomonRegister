const ContactUsModel = require('../models/contactUs');
const { sendMail } = require('../service/mailService');
const jwt = require('jsonwebtoken');
const secret = require('./../config/secret')
const { User } = require('../models/userModel');
const Role = require('../models/role');
const RolePrivilege  = require('../models/rolePrivilege');
const Privilege  = require('../models/privilege');
// controllers/contactController.js
const axios = require('axios');
const TicketAdminEmail = require('../models/ticketAdminEmail');
// Function to generate a 6-digit unique ID
const generateUniqueId = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};


// Controller function to handle contact form submissions
const handleContactFormSubmission = async (req, res) => {
  const { name, email, question, recaptchaToken } = req.body;

  // Verify reCAPTCHA
  const recaptchaSecret = "6LfgryEqAAAAAKcM2Hr1Dg5G_k1DetDdvnOHZgiw"; 
  const recaptchaVerificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${recaptchaToken}`;

  try {
    const recaptchaResponse = await axios.post(recaptchaVerificationUrl);

    if (!recaptchaResponse.data.success) {
      return res.status(400).json({ message: 'reCAPTCHA verification failed' });
    }
    // Generate unique ID
    const uniqueId = generateUniqueId();
    // Save the contact request to MongoDB
    const newContactRequest = new ContactUsModel({
      Name: name,
      email: email,
      question: question,
      uniqueId: uniqueId
    });

    await newContactRequest.save();

    // Send confirmation email to user using template
    await sendMail({
      to: email,
      template: 'faqSubmission',
      variables: {
        userName: name,
        question: question
      }
    });

    // Get admin emails for FAQ notifications
    let adminEmails = await TicketAdminEmail.findOne({ emailType: "faq" });
    if (!adminEmails || !adminEmails.emails || adminEmails.emails.length === 0) {
      // Fallback to siteOwner emails if no faq-specific emails are configured
      adminEmails = await TicketAdminEmail.findOne({ emailType: "siteOwner" });
    }

    // Send notification to admin(s)
    if (adminEmails && adminEmails.emails && adminEmails.emails.length > 0) {
      await sendMail({
        to: adminEmails.emails,
        subject: 'New FAQ/Contact Request',
        html: `
          <h2>New Contact Request</h2>
          <p><strong>From:</strong> ${name} (${email})</p>
          <p><strong>Question:</strong></p>
          <p>${question}</p>
          <p><strong>ID:</strong> ${uniqueId}</p>
          <p>Please log in to the admin panel to respond to this inquiry.</p>
        `
      });
    }

    res.status(200).json({ message: 'Contact request submitted successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'An error occurred while processing your request' });
  }
};

const getAllQuestions = async (req, res) => {
  const { searchTerm, status } = req.query;
  const query = {};
  try {
    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: "i" } },
        { email: { $regex: searchTerm, $options: "i" } },
        { question: { $regex: searchTerm, $options: "i" } },
        { uniqueId: { $regex: searchTerm, $options: "i" } },
      ];
    }

    if (status) {
      query.status = status;
    }

    const questions = await ContactUsModel.find(query).sort({ createdAt: -1 });
    res.json(questions);
  } catch (error) { 
    res
      .status(500)
      .json({ error: error.message, message: "Error fetching questions" });
  }
};

const getQuestionById = async (req, res) => {
  try {
    const question = await ContactUsModel.findOne({ uniqueId: req.params.uniqueId });
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching question' });
  }
};

const respondToQuestion = async (req, res) => {
  try {
    const  { id } = req.params;
    const  { response }  = req.body;

    // Find the question by ID and update the responses array
    const question = await ContactUsModel.findByIdAndUpdate(
      id,
      { response: response , status: 'responded' }, // Push new response to array and update status
      { new: true } 
    );
    console.log("Question",question)
    if (!question) { 
      return res.status(404).json({ message: 'Question not found' });
    }

    // Send response email using template
    await sendMail({
      to: question.email,
      template: 'faqResponse',
      variables: {
        userName: question.Name,
        answer: response
      }
    });

    res.status(200).json({ message: 'Response added and email sent successfully' });
  } catch (error) {
    console.error('Failed to send response:', error);
    res.status(500).json({ message: 'Failed to send response' });
  }
};
const markAsUnread = async (req, res) => {
  try {
    const question = await ContactUsModel.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    question.status = 'unread';
    await question.save();

    res.json({ message: 'Marked as unread' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking as unread' });
  }
};

const openQuestion = async (req, res) => {
  try {
    const question = await ContactUsModel.findByIdAndUpdate(
      req.params.id,
      { status: 'in review' },
      { new: true }
    );
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update status to In Review' });
  }
};

const closeQuestion = async (req, res) => {
  try {
    const question = await ContactUsModel.findById(req.params.id);

    if (question.status !== 'responded') {
      return res.status(400).json({ message: 'Can only close questions that have been responded to' });
    }

    question.status = 'closed';
    await question.save();
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: 'Failed to close question' });
  }
};

const reviewLater = async (req, res) => {
  try {
    const question = await ContactUsModel.findByIdAndUpdate(
      req.params.id,
      { status: 'review later' },
      { new: true }
    );
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update status to Review Later' });
  }
};
const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await ContactUsModel.findByIdAndDelete(id);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.status(200).json({ message: 'Question deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete question' });
  }
};

const updateQuestionStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const updatedQuestion = await ContactUsModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    if (!updatedQuestion) {
      return res.status(404).json({ message: 'Question not found' });
    }
    res.json(updatedQuestion);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update status' });
  }
};


module.exports = {
  handleContactFormSubmission,
  getAllQuestions,
  getQuestionById,
  respondToQuestion,
  markAsUnread,
  deleteQuestion,
  openQuestion,
  closeQuestion,
  reviewLater,
  updateQuestionStatus
};
