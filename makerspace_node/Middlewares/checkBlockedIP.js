const FailedLogin = require("../models/Failedlogin");
const { checkBlockStatus } = require('../helpers/loginBlockingRules');
const jwt = require("jsonwebtoken");
const key = require("../config/secret");
const { User } = require('../models/userModel');

const checkBlockedIP = async (req, res, next) => {
  // IMPORTANT: Skip ALL IP block checks for admin routes
  // This will completely bypass the middleware for admin routes
  if (req.path.includes('/admin/')) {
    console.log("Admin route detected, bypassing IP block check:", req.path);
    return next();
  }
  
  // Only apply IP blocking for signin attempts
  const isSigninRoute = req.path === '/api/signin' || req.path === '/api/login';
  
  // For non-signin routes, we don't need to check IP blocking
  if (!isSigninRoute) {
    return next();
  }
  
  // For signin routes, proceed with IP block check
  const ip = req.ip;
  const blockStatus = await checkBlockStatus(ip);

  if (blockStatus.blocked) {
    const timeRemaining = blockStatus.expires - new Date();
    let timeMessage;

    if (timeRemaining < 60 * 1000) {
      timeMessage = `${Math.floor(timeRemaining / 1000)} seconds remaining`;
    } else if (timeRemaining < 60 * 60 * 1000) {
      timeMessage = `${Math.floor(timeRemaining / (60 * 1000))} minutes remaining`;
    } else if (timeRemaining < 24 * 60 * 60 * 1000) {
      timeMessage = `${Math.floor(timeRemaining / (60 * 60 * 1000))} hours remaining`;
    } else {
      timeMessage = `${Math.floor(timeRemaining / (24 * 60 * 60 * 1000))} days remaining`;
    }
p
    return res.status(403).json({ message: `Your IP is blocked until ${timeMessage}`, time: timeMessage });
  }

  next();
};

module.exports = checkBlockedIP;
