const FailedLogin = require('../models/Failedlogin.js');

exports.handleFailedLogin = async (req) => {
    const {fingerprint } = req || null; // Receive fingerprint from frontend
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress; 
    const mac = 'await macaddress.one()';  // Get the device MAC address

    let userData = await FailedLogin.findOne({ ip});

    if (!userData) {
        userData = new FailedLogin({ mac, fingerprint, ip, failedAttempts: 1, lastFailedAttempt: new Date() });
        await userData.save();
        return;
    }

    const now = new Date();
    let blockDuration = null;

    // Increment failed attempts
    userData.failedAttempts += 1;
    userData.lastFailedAttempt = now;

    // Block user after 3 failed attempts
    if (userData.failedAttempts === 3) {
        blockDuration = 30 * 60 * 1000; // 30 minutes
    } else if (userData.failedAttempts === 4) {
        blockDuration = 60 * 60 * 1000; // 1 hour
    } else if (userData.failedAttempts >= 5) {
        blockDuration = 7 * 24 * 60 * 60 * 1000; // 7 days
    }

    if (blockDuration) {
        userData.blockExpires = new Date(Date.now() + blockDuration);
        userData.blockHistory.push({ timestamp: now, duration: blockDuration });
    }

    await userData.save();
};


// New function: Reset failed login attempts & unblock IP
exports.resetFailedAttempts = async (mac, fingerprint) => {
  let userData = await FailedLogin.findOne({ mac, fingerprint });

  if (userData) {
      userData.failedAttempts = 0;  // Reset failed attempts
      userData.blockExpires = null;  // Remove block expiration
      userData.blockHistory.push({ timestamp: new Date(), action: "Reset Attempts" });
      await userData.save();
  }
};

// Get all failed logins with filtering
exports.getAllFailedLogin = async (req, res) => {
  try {
      const { mac, fingerprint, ip, minAttempts, maxAttempts } = req.query;
      let query = {};

      if (mac) query.mac = mac;
      if (fingerprint) query.fingerprint = fingerprint;
      if (ip) query.ip = { $regex: ip, $options: "i" }; // Case-insensitive IP search

      if (minAttempts || maxAttempts) {
          query.failedAttempts = {};
          if (minAttempts) query.failedAttempts.$gte = parseInt(minAttempts);
          if (maxAttempts) query.failedAttempts.$lte = parseInt(maxAttempts);
      }

      const failedLogins = await FailedLogin.finnd(query);
      res.status(200).json({ success: true, failedLogins });
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, msg: "Error fetching failed logins" });
  }
};

