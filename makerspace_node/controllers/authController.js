const { getIpRecord, saveIpRecord, formatDuration, checkBlockStatus } = require('../helpers/loginBlockingRules');
// Use the updated blocking functions
const { 
  signInCheckBlockStatus, 
  signInHandleFailedAttempt, 
  resetFailedAttempts,
  BLOCK_ACTIONS
} = require('../helpers/loginBlockingRules');

const User = require('../models/userModel');
const FailedLogin = require('../models/Failedlogin');
const  Role  = require("../models/role");
const key = require("../config/secret");
const jwt = require("jsonwebtoken");
require('dotenv').config();
const { transporter } = require('../service/mailService');
const { passwordSchema } = require('../models/zod');

const tickets = require('../models/tickets');
const TicketAdminEmail = require('../models/ticketAdminEmail');

exports.getAllUsers = async (req, res) => {
    try {
      const allUsers = await User.find({}).select('email first_name last_name role_id').populate({
        path: 'role_id',
        select: 'role_name'
      });
      res.json({ success: true, users: allUsers });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ success: false, msg: "Internal Server Error" });
    }
  };


exports.getUserById = async (req, res) => {
    try {
        const _id = req.params.id;
        console.log(req.params.id)
        const user = await User.findById(_id).select('email first_name last_name imageurl').populate({
            path: 'role_id',
            select: 'role_name'
          });
        res.json({success:true,user});
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


exports.uploadImage = async (req,res) => {
     
  
    const user = await User.findById(_id)
    
      try {
        const user = await User.findByIdAndUpdate(
            _id,
            imageurl,
        )
        res.json({
            success:true,
            // imageurl:user.imageurl,
            msg:" Image uploaded successfully "
        })
      } catch (err) {
        res.status(400).send(err);
      }
}


exports.updateUserPassword = async (req, res) => {

    try {
        const { id } = req.params
        const { newPassword } = req.body;

        const parsedPassword = passwordSchema.safeParse(newPassword);
        if (!parsedPassword.success) {
            res.json({
                success: false, msg: "Password must contain at least one uppercase letter and one special character."
            })
            return;
        }

        console.log(id)
        const user = await User.findById(id);
        user.password = newPassword; // This triggers the pre-save hook
        await user.save();
        const token = jwt.sign(user.email, key);

        res.json({ success: true, token: token, msg: "Password updated successfully" })
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

exports.sendPasswordResetEmail = async (req, res) => {

    try {

        const { id } = req.params;
        const { email } = req.body;
        const resetUrl = `http://localhost:5173/userpasswordchange/${id}`;
        const message = `
        <h1>Password Reset</h1>
        <p>Please click on the following link to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>`;


        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Code',
            text: message
        });

        res.json({
            success: true,
            msg: "Password reset link has been sent to the user"
        })
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

exports.deleteUser = async (req, res) => {
    try {


        const { id } = req.params;
        const { email } = req.body;
        // const user = await User.findById(id);
        const Tickets = await tickets.find({ email }).exec();
        if (Tickets.every(ticket => ticket.status === 'Closed')) {
            await User.deleteOne({ email });
            res.json({
                success: true,
                msg: "User deleted successfully"
            });
        } else {
            const openTicket = Tickets.find(ticket => ticket.status !== 'Closed');
            res.json({
                success: false,
                msg: `User ticket is in ${openTicket.status} ! You can't delete the user`
            });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            msg: 'An error occurred'
        });
    }

}

exports.updateUserById = async (req, res) => {
    try {
    
        const update = {};
        const _id = req.params.id;
        const { email, firstName, lastName, role_name } = req.body;
        console.log(email);
        const imageurl = req.file ? req.file.path : null;

        if (email && email.trim()) {
            update.email = email;
        }

        if (firstName && firstName.trim()) {
            update.first_name = firstName;
        }

        if (lastName && lastName.trim()) {
            update.last_name = lastName;
        }

        // if(role && role.trim()) {
        //     update.role = 
        // }

        if(imageurl && imageurl.trim()){
            update.imageurl=imageurl;
        }

        if( role_name){
            let roleId= await Role.find({role_name});
            update.role_id = roleId[0]._id;
        }
        if (Object.keys(update).length === 0) {
            return res.json({success:false,msg:"No fields to update"})
        }
        const user = await User.findByIdAndUpdate(
            _id,
            update,
            { new: true }
        )
        // console.log(update);
        // console.log(user);

        res.json({
            success: true,
            msg: "User updated successfully"
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getAllEmailAdmins = async (req, res) => {
    try {
        const emails = await TicketAdminEmail.find();
        const emailResponse = { siteOwner: [], ticket: [], faq: [] };

        if (emails.length === 0) {
            const defaultEmail = { emails: ["computer.science.cuwaa@gmail.com"], emailType: "siteOwner" };
            const newEmail = new TicketAdminEmail(defaultEmail);
            await newEmail.save();
            emailResponse[defaultEmail.emailType].push(defaultEmail.emails);
            return res.json({ success: true, msg: "Default email added", emails: emailResponse });
        }

        emails.forEach(email => {
            emailResponse[email.emailType]?.push(...email.emails);
        });

        return res.json({ success: true, emails: emailResponse });
    } catch (error) {
        console.error('Error fetching emails:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

exports.updateEmailAdmin = async (req, res) => {
    try {
        const { emailType, email } = req.body;

        if (!emailType || !email) {
            return res.status(400).json({ success: false, msg: "Email type and email are required" });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, msg: "Invalid email format" });
        }

        // Find the document for this emailType
        const existingEmail = await TicketAdminEmail.findOne({ emailType });

        if (existingEmail) {
            // Check if email already exists
            if (existingEmail.emails.includes(email)) {
                return res.status(400).json({ success: false, msg: "Email already exists" });
            }

            // Add the new email to the array
            existingEmail.emails.push(email);
            await existingEmail.save();
        } else {
            // Create new document if it doesn't exist
            const newEmail = new TicketAdminEmail({
                emailType,
                emails: [email]
            });
            await newEmail.save();
        }

        res.json({ success: true, msg: "Email added successfully" });
    } catch (error) {
        console.error("Error updating emails:", error);
        res.status(500).json({ success: false, msg: "Internal Server Error" });
    }
};

exports.deleteEmailAdmin = async (req, res) => {
    try {
        const { emailType, email } = req.body;

        if (!emailType || !email) {
            return res.status(400).json({ error: "Email type and email are required" });
        }

        // Find the document and update it by removing the specific email
        const updatedEmail = await TicketAdminEmail.findOneAndUpdate(
            { emailType },
            { $pull: { emails: email } }, // $pull removes the specific email from the array
            { new: true }
        );

        if (!updatedEmail) {
            return res.status(404).json({ error: "Email type not found" });
        }

        return res.json({ success: true, msg: "Email deleted successfully", updatedEmail });
    } catch (error) {
        console.error("Error deleting email:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

  
  //  Unblock IP & Reset Failed Attempts
exports.unblockUser = async (req, res) => {
    try {
        const { mac, fingerprint } = req.body; // Use MAC + Fingerprint instead of just IP

        const userData = await FailedLogin.findOne({ mac, fingerprint });

        if (!userData) {
            return res.status(404).json({ success: false, msg: "User not found" });
        }

        // Reset failed attempts and unblock user
        userData.failedAttempts = 0;
        userData.blockExpires = null;
        userData.blockHistory.push({ timestamp: new Date(), action: "Unblocked" });

        await userData.save();
        res.status(200).json({ success: true, msg: "User successfully unblocked." });
    } catch (error) {
        console.error("Error unblocking user:", error);
        res.status(500).json({ success: false, msg: "Error unblocking user" });
    }
};

   // Modify IP Block Duration
exports.modifyUserBlockDuration = async (req, res) => {
    try {
        const { mac, fingerprint, newDuration } = req.body;
        console.log("Received block request:", { mac, fingerprint, newDuration });

        // Input validation
        if (!mac || !fingerprint || !newDuration) {
            console.log("Missing parameters:", { mac, fingerprint, newDuration });
            return res.status(400).json({
                success: false,
                msg: "Missing required parameters"
            });
        }

        // Find the user record
        const userData = await FailedLogin.findOne({ mac, fingerprint });
        console.log("Found user data:", userData);

        if (!userData) {
            // If no record exists, create one
            const newUserData = new FailedLogin({
                mac,
                fingerprint,
                failedAttempts: 3,
                blockExpires: new Date(Date.now() + (newDuration * 60000))
            });
            await newUserData.save();
            console.log("Created new user data:", newUserData);
            
            return res.status(200).json({
                success: true,
                msg: "New block created",
                newExpiry: newUserData.blockExpires,
                updatedData: newUserData
            });
        }

        // Update existing record
        userData.blockExpires = new Date(Date.now() + (newDuration * 60000));
        userData.failedAttempts = Math.max(3, userData.failedAttempts);
        userData.blockHistory.push({
            timestamp: new Date(),
            duration: `${newDuration} minutes`,
            action: 'Modified',
            adminNote: `Manual block duration modification`
        });

        const savedData = await userData.save();
        console.log("Updated user data:", savedData);

        return res.status(200).json({
            success: true,
            msg: "Block updated successfully",
            newExpiry: savedData.blockExpires,
            updatedData: savedData
        });

    } catch (error) {
        console.error("Block modification error:", error);
        return res.status(500).json({
            success: false,
            msg: "Failed to update block duration",
            error: error.message
        });
    }
};

     // Update User details
    exports.updateUserDetails = async (req, res) => {
        try {
        const { userId, firstName, lastName, role } = req.body;
        const user = await User.findById(userId);
    
        if (!user) {
            return res.status(404).json({ success: false, msg: "User not found" });
        }
    
        if (firstName) user.first_name = firstName;
        if (lastName) user.last_name = lastName;
        if (role) {
            const newRole = await Role.findOne({ role_name: role });
            user.role_id = newRole._id;
        }
    
        await user.save();
        res.status(200).json({ success: true, msg: "User details updated successfully." });
        } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, msg: "Error updating user details" });
        }
    };
    
    exports.getAllFailedLogin = async (req, res) => {
        try {
            const failedLogins = await FailedLogin.find()
                .select('mac fingerprint ip failedAttempts blockExpires blockHistory isPermBlocked customRules')
                .sort({ lastFailedAttempt: -1 });

            // Enhance the response with status information
            const enhancedLogins = failedLogins.map(login => {
                const status = login.isPermBlocked ? 'Permanently Blocked' :
                              login.blockExpires && login.blockExpires > new Date() ? 'Temporarily Blocked' : 'Active';
                
                return {
                    ...login.toObject(),
                    status,
                    remainingBlockTime: login.blockExpires ? 
                        Math.max(0, login.blockExpires - new Date()) / 1000 / 60 : 0 // in minutes
                };
            });

            res.status(200).json({ 
                success: true, 
                failedLogins: enhancedLogins
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, msg: "Error fetching failed logins" });
        }
    };

// Add new endpoints for rule management
exports.addCustomRule = async (req, res) => {
    try {
        const { mac, fingerprint, threshold, duration, action } = req.body;
        const userData = await FailedLogin.findOne({ mac, fingerprint });
        
        if (!userData) {
            return res.status(404).json({ success: false, msg: "User not found" });
        }

        userData.customRules.push({ threshold, duration, action });
        await userData.save();

        res.status(200).json({ success: true, msg: "Custom rule added successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, msg: "Error adding custom rule" });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const ip = req.ip;

        // sequential sign-in block logic
        const block = await signInCheckBlockStatus(ip);
        if (block.blocked) {
            const remainingMs = new Date(block.expires) - new Date();
            const mins = Math.ceil(remainingMs / 60000);
            return res.status(429).json({ success: false, msg: `Too many failed attempts. Blocked for ${mins} minute${mins!==1?'s':''}.`, until: block.expires });
        }
        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.comparePassword(password))) {
            const result = await signInHandleFailedAttempt(ip);
            if (result.blockExpires) {
                const human = formatDuration(new Date(result.blockExpires) - new Date());
                return res.status(429).json({ success: false, msg: `Too many failed attempts. Blocked for ${human}.`, until: result.blockExpires });
            }
            const left = result.attempts < 3 ? 3 - result.attempts : 0;
            return res.status(401).json({ success: false, msg: `Invalid credentials. You have ${left} attempt${left!==1?'s':''} remaining.`, attemptsRemaining: left });
        }
        // on successful login
        await resetFailedAttempts(ip);
        // ... existing success logic ...
    } catch (error) {
        // ... existing error handling ...
    }
};

// New Sign-In endpoint handler with sequential blocking workflow
exports.signin = async (req, res) => {
  try {
    const ip = req.ip || req.socket.remoteAddress;
    const now = Date.now();
    
    // First, check if this IP is blocked
    let blockStatus;
    try {
      blockStatus = await checkBlockStatus(ip);
    } catch (error) {
      console.error("Error checking block status:", error);
      blockStatus = { blocked: false }; // Default to not blocked in case of error
    }
    
    if (blockStatus.blocked && typeof blockStatus.remainingMinutes !== 'undefined') {
      return res.status(423).json({
        error: "blocked",
        remainingMinutes: blockStatus.remainingMinutes // Always present
      });
    }

    // Attempt authentication
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Email and password are required" 
      });
    }
    
    const user = await User.findOne({ email }).select('+password').populate({
      path: 'role_id',
      select: 'role_name'
    });
    
    // Authentication successful
    if (user && await user.comparePassword(password)) {
      // On successful login, simply delete ANY record from the failed logins table with this IP
      try {
        console.log(`Successful login for ${email} from IP ${ip} - deleting from failed logins table`);
        await FailedLogin.deleteOne({ ip });
      } catch (error) {
        console.error("Error deleting from failed logins table:", error);
        // Continue with login even if deletion fails
      }
      
      // Check if user is admin
      const isAdmin = user.role_id && user.role_id.role_name === "Admin";
      
      // Create token with user information
      const token = jwt.sign(
        { 
          userId: user._id,
          email: user.email,
          role: user.role_id?.role_name || 'User'
        }, 
        key, 
        { expiresIn: '24h' }
      );
      
      console.log(`Login successful for ${email}, role: ${user.role_id?.role_name || 'User'}, isAdmin: ${isAdmin}`);
      
      return res.status(200).json({ 
        success: true, 
        token,
        isAdmin,
        role: user.role_id?.role_name || 'User'
      });
    }
    
    // Authentication failed - record the failed attempt
    let failResult;
    try {
      failResult = await signInHandleFailedAttempt(ip);
    } catch (error) {
      console.error("Error handling failed attempt:", error);
      failResult = { 
        blocked: false, 
        failedAttempts: 1,
        message: "Invalid credentials. Authentication error occurred."
      };
    }
    
    if (failResult.blocked) {
      // User just got blocked
      return res.status(429).json({ 
        success: false, 
        message: failResult.message || `Too many failed login attempts. Your account has been temporarily blocked.`,
        blocked: true,
        until: failResult.blockExpires,
        remainingMinutes: failResult.remainingMinutes,
        failedAttempts: failResult.failedAttempts,
        thresholdReached: failResult.thresholdReached,
        ruleName: failResult.ruleName,
        duration: failResult.duration
      });
    } else {
      // User not blocked yet, but increment failed attempts
      return res.status(401).json({ 
        success: false, 
        message: failResult.message || `Invalid credentials.`,
        attemptsRemaining: failResult.attemptsUntilBlock || null,
        failedAttempts: failResult.failedAttempts || 1,
        nextThreshold: failResult.nextThreshold || null
      });
    }
  } catch (error) {
    console.error('Signin error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'An error occurred during login. Please try again later.'
    });
  }
};

// New endpoint to explicitly clear failed logins for the current IP
exports.clearFailedLogin = async (req, res) => {
  try {
    const ip = req.ip || req.socket.remoteAddress;
    console.log(`Manual cleanup request for IP: ${ip}`);
    
    // Simply try to delete any record with this IP
    const result = await FailedLogin.deleteOne({ ip });
    
    if (result.deletedCount > 0) {
      console.log(`Successfully deleted failed login record for IP: ${ip}`);
      return res.status(200).json({ 
        success: true, 
        message: "Failed login record cleared successfully" 
      });
    } else {
      console.log(`No failed login record found for IP: ${ip}`);
      return res.status(200).json({ 
        success: true, 
        message: "No failed login record found to clear" 
      });
    }
  } catch (error) {
    console.error("Error clearing failed login record:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Error clearing failed login record" 
    });
  }
};