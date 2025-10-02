const express = require('express');
const { verifyOTP, getOTP, signup, signin, userDetails, logout, updatepassword, updateNames, checkEmailAccount, forgotpassword, emailVerification, addUserByAdmin, validateToken } = require('../controllers/userController');
const { clearFailedLogin } = require('../controllers/authController');
const router = express.Router();
const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });
const isAllowedToEditAndDeleteUsers = require('../Middlewares/isAllowedToEditAndDeleteUsers');
const checkBlockedIP = require('../Middlewares/checkBlockedIP');
router.post('/signin', checkBlockedIP, signin);
 
// New route to explicitly clear failed login records
router.post('/clear-failed-login', clearFailedLogin);
 
router.post('/updatepassword', updatepassword)
router.post('/updatenames',upload.single('image'), updateNames)
router.post('/check-email', checkEmailAccount)
router.post('/forgot-password', forgotpassword)
router.post('/reset-password', emailVerification)
router.post('/updatepassword', updatepassword)
router.post('/updatenames',upload.single('image'), updateNames)
router.post('/check-email', checkEmailAccount)
router.post('/forgot-password', forgotpassword)
router.post('/reset-password', emailVerification)
router.post('/signup', signup);
router.post('/upload', upload.single('image'), signup);

router.get('/userDetails', userDetails);
router.post('/logout', logout);
router.post('/addUserByAdmin', isAllowedToEditAndDeleteUsers, addUserByAdmin);
router.post('/validate-token', validateToken);
router.post('/getOtp', getOTP);
router.post('/verifyOtp', verifyOTP);

module.exports = router;
