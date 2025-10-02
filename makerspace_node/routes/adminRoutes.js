const express = require('express');
const key = require("../config/secret");
const multer = require('multer');
const jwt = require("jsonwebtoken");
const checkBlockedIP = require('../Middlewares/checkBlockedIP');
const {
  getAllUsers,
  getUserById,
  updateUserById,
  sendPasswordResetEmail,
  updateUserPassword,
  deleteUser,
  uploadImage,
  getCurrentEmailAdmin,
  updateEmailAdmin,
  getEmailTemplates,
  updateEmailTemplate,
  deleteEmailAdmin,
  getAllFailedLogin,
  assignRule,
  applyGlobalRule,
  createRule,
  updateRule,
  deleteRule,
  getAllRules,
  applyIpRule,
  getIpBlocks,
  unblockIp,
  unblockUser,
  unblockUserAndKeepInFailedAttempts,
  clearFailedAttempts,
  clearUserFailedAttempts,
  applyRuleToIP,
  modifyUserBlockDuration,
  updateUserDetails,
  manualBlockIp
} = require('../controllers/adminController');
const { User } = require('../models/userModel');

// Fixed isAdmin middleware to properly verify admin users
const isAdmin = async (req, res, next) => {
  try {
    // Get the token from the request header
    const token = req.headers.authorization;
    
    if (!token) {
      console.log("No token provided");
      return res.status(401).json({
        success: false,
        msg: "Authorization token missing"
      });
    }

    // Decode the token without verification first to check its structure
    let decoded;
    try {
      decoded = jwt.decode(token);
      console.log("Token decoded:", decoded);
    } catch (error) {
      console.error("JWT decode failed:", error);
    }

    // Try both ways - direct email string and object with email property
    let email;
    try {
      if (typeof decoded === 'string') {
        // Token contains email directly
        email = jwt.verify(token, key);
        console.log("Token verified as string, email:", email);
      } else if (typeof decoded === 'object' && decoded !== null) {
        // Token contains an object that might have email or userId
        const verified = jwt.verify(token, key);
        if (verified.userId) {
          // If token has userId, find user and get email
          const userById = await User.findById(verified.userId);
          if (!userById) {
            return res.status(404).json({
              success: false, 
              msg: "User not found with provided id"
            });
          }
          email = userById.email;
        } else if (verified.email) {
          email = verified.email;
        } else {
          // Use whatever we have
          email = verified;
        }
        console.log("Token verified as object, extracted email:", email);
      } else {
        return res.status(401).json({
          success: false,
          msg: "Invalid token format"
        });
      }
    } catch (error) {
      console.error("JWT verification failed:", error);
      return res.status(401).json({
        success: false,
        msg: "Invalid token"
      });
    }

    // Find the user with the email
    let user;
    if (typeof email === 'string') {
      user = await User.findOne({ email }).select('role_id').populate({
        path: 'role_id',
        select: 'role_name'
      });
    } else if (typeof email === 'object' && email !== null) {
      // If email is an object, it might be a userId or have an email property
      if (email.email) {
        user = await User.findOne({ email: email.email }).select('role_id').populate({
          path: 'role_id',
          select: 'role_name'
        });
      } else {
        // Try to use it as an ID
        user = await User.findById(email).select('role_id').populate({
          path: 'role_id',
          select: 'role_name'
        });
      }
    }

    if (!user) {
      console.log("User not found for:", email);
      return res.status(404).json({
        success: false,
        msg: "User not found"
      });
    }

    // Check if user has admin role
    const roleName = user.role_id?.role_name;
    console.log("User role:", roleName);
    
    if (roleName === "Admin" || roleName === "OWNER") {
      console.log("Admin access granted");
      next();
    } else {
      console.log("Access denied for role:", roleName);
      return res.status(403).json({
        success: false,
        msg: "Access Denied: Admin privileges required"
      });
    }
  } catch (error) {
    console.error("Admin middleware error:", error);
    return res.status(500).json({
      success: false,
      msg: "Server error during authentication"
    });
  }
};

const router = express.Router();
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

router.use(checkBlockedIP);

// User management routes
router.get("/getAllUsers", isAdmin, getAllUsers);
router.get('/getUser/:id', isAdmin, getUserById);
router.post('/sendLink/:id', isAdmin, sendPasswordResetEmail);
router.post('/deleteUser/:id', isAdmin, deleteUser);
router.post('/upload', isAdmin, uploadImage);
router.put("/updateUserPassword/:id", isAdmin, updateUserPassword);
router.put('/updateUser/:id', isAdmin, upload.single('image'), updateUserById);
router.put('/updateUserDetails', isAdmin, updateUserDetails);

// Email admin routes
router.get('/getCurrentEmailAdmin', isAdmin, getCurrentEmailAdmin);
router.post('/updateEmailAdmin', isAdmin, updateEmailAdmin);
router.delete('/admin-email', isAdmin, deleteEmailAdmin);

// Email template routes
router.get('/getEmailTemplates', isAdmin, getEmailTemplates);
router.post('/updateEmailTemplate', isAdmin, updateEmailTemplate);

// Failed login and blocking management
router.get('/allfailedlogin', isAdmin, getAllFailedLogin);
router.post('/modify-user-block-duration', isAdmin, modifyUserBlockDuration);
router.post('/unblock-user', isAdmin, unblockUser);
router.post('/unblock-ip', isAdmin, unblockIp);
router.post('/unblock-and-keep-attempts', isAdmin, unblockUserAndKeepInFailedAttempts);
router.post('/clear-failed-attempts', isAdmin, clearFailedAttempts);
router.post('/clear-user-failed-attempts', isAdmin, clearUserFailedAttempts);
router.post('/apply-rule-to-ip', isAdmin, applyRuleToIP);

// Rules management
router.post('/assign-rule', isAdmin, assignRule);
router.post('/apply-global-rule', isAdmin, applyGlobalRule);
router.post('/apply-ip-rule', isAdmin, applyIpRule);
router.get('/rules', isAdmin, getAllRules);
router.post('/rules', isAdmin, createRule);
router.put('/rules/:ruleId', isAdmin, updateRule); 
router.delete('/rules/:ruleId', isAdmin, deleteRule);

// IP blocking management
router.get('/ip/blocks', isAdmin, getIpBlocks);
router.get('/manualBlockIPs', isAdmin, getIpBlocks);
router.post('/ip/blocks/:ip/unblock', isAdmin, unblockIp);
router.put('/ip/blocks/:ip/rule', isAdmin, (req, res) => {
  const ruleId = req.query.ruleId || req.body.ruleId;
  req.body = { ruleId, ips: [req.params.ip] };
  return applyIpRule(req, res);
});

// Add manual block IP route
router.post('/manual-block-ip', isAdmin, manualBlockIp);

module.exports = router;
