const express = require('express');
const router = express.Router();
const multer = require('multer');
const isAllowedToUpdateTicketDetails = require('../Middlewares/isAllowedToUpdateTicketDetails');
const isAllowedToViewAllTickets = require('../Middlewares/isAllowedToViewAllTickets');
const isAllowedToChangeTicketStatus = require('../Middlewares/isAllowedToChangeTicketStatus');
const isAllowedtoSendCommentsToUser = require('../Middlewares/isAllowedToSendCommentsToUser');
const authMiddleware = require('../Middlewares/authMiddleware');
const {submitTicket, upload, getAllTickets, submitComment, getAllComments, getMyTickets, updateTicketStatus, updateTicket, deleteTicket, getTicketById,getTicketsByDepartment, getLatestTicketsDashboard, getTicketsByStatus,getMyLatestTicketsDashboard, getMyLatestCommments, downloadFile, markMessagesAsRead, getNextUnprocessedTicket } = require('../controllers/ticketController');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  });
router.post('/submitTicket', authMiddleware, upload.array('attachments', 10), submitTicket);
router.get('/getAllTickets',isAllowedToViewAllTickets , getAllTickets);
router.get('/getLatestTickets' , getLatestTicketsDashboard);
router.post('/submitComment',upload.single('file'),isAllowedtoSendCommentsToUser, submitComment);
router.get('/getAllComments', isAllowedtoSendCommentsToUser, getAllComments);
router.get('/getMyTickets', authMiddleware, getMyTickets)
router.patch('/updateStatus/:id',isAllowedToChangeTicketStatus, updateTicketStatus);
router.patch('/updateTicket/:id', isAllowedToUpdateTicketDetails,updateTicket);
router.delete('/deleteTicket/:id',  deleteTicket);
router.get('/getTicketById?:id', getTicketById);
router.get('/getCountByDept', isAllowedtoSendCommentsToUser, getTicketsByDepartment)
router.get('/getCountByStatus', getTicketsByStatus)
router.get('/getMyLatestTickets', authMiddleware, getMyLatestTicketsDashboard)
router.get('/getMyLatestComments',authMiddleware, getMyLatestCommments)
router.get('/download', downloadFile);
router.put('/markMessagesAsRead/:ticketId', markMessagesAsRead);
router.get('/getNextUnprocessedTicket', isAllowedToViewAllTickets, getNextUnprocessedTicket);
module.exports = router;