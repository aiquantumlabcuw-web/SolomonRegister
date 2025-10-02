const express = require('express');
const router = express.Router();
const isAllowedToViewAllTickets = require('./../Middlewares/isAllowedToViewAllTickets')
const { handleContactFormSubmission,getAllQuestions,
    getQuestionById,
    respondToQuestion,
    markAsUnread,
    deleteQuestion,
    openQuestion,
    closeQuestion,
    reviewLater,
    updateQuestionStatus} = require('./../controllers/contactController');

router.post('/contact', handleContactFormSubmission);
router.get('/getAllQuestions',isAllowedToViewAllTickets, getAllQuestions);
router.get('/getQuestionById/:uniqueId', getQuestionById);
router.patch('/respondToQuestion/:id', respondToQuestion);
router.patch('/markAsUnread/:id', markAsUnread);
router.delete('/deleteQuestion/:id', deleteQuestion); 
router.patch('/openQuestion/:id', openQuestion); 
router.patch('/closeQuestion/:id', closeQuestion);
router.patch('/reviewLater/:id', reviewLater);
router.patch('/updateQuestionStatus/:id', updateQuestionStatus); 

module.exports = router; 
