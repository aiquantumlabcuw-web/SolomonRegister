const { resetFailedAttempts, unblockUser, clearFailedAttempts, BLOCK_ACTIONS } = require("../helpers/loginBlockingRules");
const { User } = require('../models/userModel');
const Role = require("../models/role");
const key = require("../config/secret");
const jwt = require("jsonwebtoken");
require('dotenv').config();
const { transporter } = require('../service/mailService');
const { passwordSchema } = require('../models/zod');
const FailedLogin = require('../models/Failedlogin');
const tickets = require('../models/tickets');
const TicketAdminEmail = require('../models/ticketAdminEmail');
const BlockingRule = require("../models/BlockingRule");
const AuditLog = require('../models/AuditLog');
const EmailTemplate = require('../models/EmailTemplate');

exports.getAllUsers = async (req, res) => {
    try {
          const allUsers = await User.find({}).select('email first_name last_name role_id').populate({
                path: 'role_id',
                select: 'role_name'
          });
          res.json({ Users: allUsers });
    } catch (error) {
          console.error('Error fetching users:', error);
          res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const _id = req.params.id;
        const user = await User.findById(_id).select('email first_name last_name imageurl').populate({
            path: 'role_id',
            select: 'role_name'
        });
        res.json({ success: true, user });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.uploadImage = async (req, res) => {
    try {
        const _id = req.body.id;
        const imageurl = req.file ? req.file.path : null;
        if (!_id || !imageurl) {
            return res.status(400).json({ success: false, msg: "Missing user id or image file" });
        }
        const user = await User.findByIdAndUpdate(
            _id,
            { imageurl },
            { new: true }
        );
        res.json({
            success: true,
            imageurl: user.imageurl,
            msg: "Image uploaded successfully"
        });
    } catch (err) {
        res.status(400).send(err);
    }
};

exports.updateUserPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        const parsedPassword = passwordSchema.safeParse(newPassword);
        if (!parsedPassword.success) {
            res.json({
                success: false, msg: "Password must contain at least one uppercase letter and one special character."
            });
            return;
        }

        const user = await User.findById(id);
        user.password = newPassword; // This triggers the pre-save hook
        await user.save();
        const token = jwt.sign(user.email, key);

        res.json({ success: true, token: token, msg: "Password updated successfully" });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


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
        });
    } catch (error) {
        console.error('Error sending password reset email:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { email } = req.body;
        const Tickets = await tickets.find({ email }).exec();
        if (Tickets.every(ticket => ticket.status === 'Closed')) {
            await User.deleteOne({ email });
            res.json({ success: true, msg: "User deleted successfully" });
        } else {
            const openTicket = Tickets.find(ticket => ticket.status !== 'Closed');
            res.json({ success: false, msg: `User ticket is in ${openTicket.status} ! You can't delete the user` });
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, msg: 'An error occurred' });
    }
};
exports.updateUserById = async (req, res) => {
    try {
        const update = {};
        const _id = req.params.id;
        const { email, firstName, lastName, role_name } = req.body;
        const imageurl = req.file ? req.file.path : null;

        if (email && email.trim()) update.email = email;
        if (firstName && firstName.trim()) update.first_name = firstName;
        if (lastName && lastName.trim()) update.last_name = lastName;
        if (imageurl && imageurl.trim()) update.imageurl = imageurl;

        if (role_name) {
            const roleId = await Role.findOne({ role_name });
            update.role_id = roleId._id;
        }

        if (Object.keys(update).length === 0) {
            return res.json({ success: false, msg: "No fields to update" });
        }

        await User.findByIdAndUpdate(_id, update, { new: true });
        res.json({ success: true, msg: "User updated successfully" });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getCurrentEmailAdmin = async (req, res) => {
    try {
        const emails = await TicketAdminEmail.find();
        const emailResponse = { siteOwner: [], ticket: [], faq: [] };

        // First, ensure siteOwner exists with default email
        let siteOwnerDoc = emails.find(e => e.emailType === 'siteOwner');
        if (!siteOwnerDoc || siteOwnerDoc.emails.length === 0) {
            // Create or update siteOwner with default email
            siteOwnerDoc = await TicketAdminEmail.findOneAndUpdate(
                { emailType: 'siteOwner' },
                { 
                    emailType: 'siteOwner',
                    emails: ['computer.science.cuwaa@gmail.com']
                },
                { upsert: true, new: true }
            );
        }
        emailResponse.siteOwner = siteOwnerDoc.emails;

        // Handle ticket and faq types
        for (const type of ['ticket', 'faq']) {
            const typeDoc = emails.find(e => e.emailType === type);
            if (!typeDoc || typeDoc.emails.length === 0) {
                // If no emails for this type, use siteOwner emails
                const newDoc = await TicketAdminEmail.findOneAndUpdate(
                    { emailType: type },
                    { 
                        emailType: type,
                        emails: siteOwnerDoc.emails 
                    },
                    { upsert: true, new: true }
                );
                emailResponse[type] = newDoc.emails;
            } else {
                emailResponse[type] = typeDoc.emails;
            }
        }

        res.json({ success: true, emails: emailResponse });
    } catch (error) {
        console.error('Error fetching emails:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.updateEmailAdmin = async (req, res) => {
    try {
        const { emailType, email } = req.body;

        if (!emailType || !email) {
            return res.status(400).json({ success: false, msg: "Email type and email are required" });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, msg: "Invalid email format" });
        }

        const existingEmail = await TicketAdminEmail.findOne({ emailType });

        if (existingEmail) {
            if (existingEmail.emails.includes(email)) {
                return res.status(400).json({ success: false, msg: "Email already exists" });
            }

            existingEmail.emails.push(email);
            await existingEmail.save();
        } else {
            const newEmail = new TicketAdminEmail({ emailType, emails: [email] });
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

        const updatedEmail = await TicketAdminEmail.findOneAndUpdate(
            { emailType },
            { $pull: { emails: email } },
            { new: true }
        );

        if (!updatedEmail) {
            return res.status(404).json({ error: "Email type not found" });
        }

        res.json({ success: true, msg: "Email deleted successfully", updatedEmail });
    } catch (error) {
        console.error("Error deleting email:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.unblockUser = async (req, res) => {
    try {
        const { mac, fingerprint, ip } = req.body;

        if (!ip && (!mac || !fingerprint)) {
            return res.status(400).json({ 
                success: false, 
                msg: "Either IP address or MAC + fingerprint are required" 
            });
        }

        let userData;
        if (ip) {
            userData = await unblockUser(ip);
        } else if (mac && fingerprint) {
            // Legacy support for MAC+fingerprint
            userData = await FailedLogin.findOne({ mac, fingerprint });
            if (userData) {
                userData.isBlocked = false;
                userData.unblockDate = null;
                userData.adminBlockExpires = null;
                userData.adminPermBlocked = false;
                userData.blockHistory.push({
                    timestamp: new Date(),
                    action: "Unblocked",
                    duration: "0"
                });
                await userData.save();
            }
        }

        if (!userData) {
            return res.status(404).json({ success: false, msg: "User not found" });
        }

        return res.status(200).json({ 
            success: true, 
            msg: "User successfully unblocked and moved to failed attempts list."
        });
    } catch (error) {
        console.error("Error unblocking user:", error);
        res.status(500).json({ success: false, msg: "Error unblocking user" });
    }
};

exports.modifyUserBlockDuration = async (req, res) => {
    try {
        const { mac, fingerprint, newDuration } = req.body;
        const userData = await FailedLogin.findOne({ mac, fingerprint });

        if (!userData) {
            return res.status(404).json({ success: false, msg: "User not found" });
        }

        // Update only admin block expiration
        userData.adminBlockExpires = new Date(Date.now() + (newDuration * 60000));
        userData.blockHistory.push({
            timestamp: new Date(),
            duration: `${newDuration} minutes (admin)`,
            action: 'Modified',
            adminNote: `Manual block duration modification`
        });

        const savedData = await userData.save();
        console.log("Updated user data:", savedData);

        return res.status(200).json({
            success: true,
            msg: "Admin block duration updated successfully",
            newExpiry: savedData.adminBlockExpires,
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
        // Fetch all records, both failed attempts and blocked users
        const allLogins = await FailedLogin.find()
            .select('ip failedAttempts lastFailedAttempt blockExpires blockHistory isBlocked unblockDate thresholdReached currentRuleId adminBlockExpires adminPermBlocked signInBlockExpires')
            .sort({ lastFailedAttempt: -1 })
            .populate('currentRuleId');

        // Separate into failed attempts and blocked users
        const now = new Date();
        const failedAttempts = [];
        const blockedUsers = [];

        for (const login of allLogins) {
            const loginObj = login.toObject();
            
            // Is this user currently blocked by any block?
            const isAdminPermanent = login.adminPermBlocked;
            const isAdminTemporary = login.adminBlockExpires && login.adminBlockExpires > now;
            const isRuleBlocked = login.isBlocked && login.unblockDate && login.unblockDate > now;
            const isSignInBlocked = login.signInBlockExpires && login.signInBlockExpires > now;
            
            // Calculate active block time remaining
            let remainingBlockTime = 0;
            let blockExpires = null;
            let blockType = "None";
            
            if (isAdminPermanent) {
                blockType = "Permanent Admin Block";
                remainingBlockTime = Infinity;
            } else if (isAdminTemporary) {
                blockType = "Temporary Admin Block";
                blockExpires = login.adminBlockExpires;
                remainingBlockTime = Math.max(0, login.adminBlockExpires - now) / 60000; // minutes
            } else if (isRuleBlocked) {
                blockType = "Rule Threshold Block";
                blockExpires = login.unblockDate;
                remainingBlockTime = Math.max(0, login.unblockDate - now) / 60000; // minutes
            } else if (isSignInBlocked) {
                blockType = "Sign-In Block";
                blockExpires = login.signInBlockExpires;
                remainingBlockTime = Math.max(0, login.signInBlockExpires - now) / 60000; // minutes
            }
            
            // Determine user status
            let status = 'Active';
            if (isAdminPermanent) {
                status = 'Permanently Blocked';
            } else if (isAdminTemporary) {
                status = 'Temporarily Blocked (Admin)';
            } else if (isRuleBlocked) {
                status = `Blocked (Threshold: ${login.thresholdReached || 'Unknown'})`;
            } else if (isSignInBlocked) {
                status = `Temporarily Blocked (Sign-In)`;
            }
            
            // Add enhanced data
            const enhancedLogin = {
                ...loginObj,
                status,
                blockType,
                blockExpires,
                remainingBlockTime,
                ruleName: login.currentRuleId ? login.currentRuleId.description : null,
                isCurrentlyBlocked: isAdminPermanent || isAdminTemporary || isRuleBlocked || isSignInBlocked
            };
            
            // Add to the appropriate list
            if (enhancedLogin.isCurrentlyBlocked) {
                blockedUsers.push(enhancedLogin);
            } else if (login.failedAttempts > 0) {
                failedAttempts.push(enhancedLogin);
            }
        }

        res.status(200).json({
            success: true,
            failedAttempts,
            blockedUsers
        });
    } catch (error) {
        console.error("Error fetching failed logins:", error);
        res.status(500).json({ success: false, msg: "Error fetching login data" });
    }
};

exports.getAllRules = async (req, res) => {
    try {
        const rules = await BlockingRule.find();
        res.status(200).json({ success: true, rules });
    } catch (error) {
        console.error("Error fetching rules:", error);
        res.status(500).json({ success: false, msg: "Error fetching rules" });
    }
};

exports.createRule = async (req, res) => {
    console.log("CreateRule req.body:", req.body); // Debug log
    try {
        const { description, threshold, duration, action, type, ips } = req.body;
        let missingFields = [];
        if (!description || description.trim() === "") missingFields.push("description");
        if (threshold === undefined || threshold === "") missingFields.push("threshold");
        if (duration === undefined || duration === "") missingFields.push("duration");
        if (!action || action.trim() === "") missingFields.push("action");
        if (missingFields.length > 0) {
            console.error("Missing required fields:", missingFields, req.body);
            return res.status(400).json({ success: false, msg: "Missing required fields: " + missingFields.join(", ") });
        }
        const numThreshold = Number(threshold);
        const numDuration = Number(duration);
        if (isNaN(numThreshold) || isNaN(numDuration)) {
            console.error("Invalid numbers provided:", { threshold, duration });
            return res.status(400).json({ success: false, msg: "Threshold and duration must be numbers" });
        }
        const newRule = new BlockingRule({
            description,
            threshold: numThreshold,
            duration: numDuration,
            action,
            type: type || 'global',
            ips: ips || []
        });
        await newRule.save();
        // Rule is now persisted; the caller (UI) may use the returned rule details.
        res.status(201).json({ success: true, msg: "Rule created successfully", rule: newRule });
    } catch (error) {
        console.error("Error creating rule:", error);
        res.status(500).json({ success: false, msg: "Error creating rule" });
    }
};

exports.updateRule = async (req, res) => {
    try {
        const { ruleId } = req.params;
        const { description, threshold, duration, action, type, ips } = req.body;
        const updatedRule = await BlockingRule.findByIdAndUpdate(ruleId, { description, threshold, duration, action, type, ips }, { new: true });
        res.status(200).json({ success: true, msg: "Rule updated successfully", rule: updatedRule });
    } catch (error) {
        console.error("Error updating rule:", error);
        res.status(500).json({ success: false, msg: "Error updating rule" });
    }
};

exports.deleteRule = async (req, res) => {
    try {
        const { ruleId } = req.params;
        await BlockingRule.findByIdAndDelete(ruleId);
        res.status(200).json({ success: true, msg: "Rule deleted successfully" });
    } catch (error) {
        console.error("Error deleting rule:", error);
        res.status(500).json({ success: false, msg: "Error deleting rule" });
    }
};

exports.getAuditLogs = async (req, res) => {
    try {
        const logs = await AuditLog.find().sort({ timestamp: -1 });
        res.status(200).json({ success: true, logs });
    } catch (error) {
        console.error("Error fetching audit logs:", error);
        res.status(500).json({ success: false, msg: "Error fetching audit logs" });
    }
};

exports.assignRule = async (req, res) => {
    try {
        const { mac, fingerprint, ruleId } = req.body;

        const userData = await FailedLogin.findOne({ mac, fingerprint });
        if (!userData) {
            return res.status(404).json({ success: false, msg: "User not found" });
        }

        const alertLevels = {
            1: 'low',
            2: 'medium',
            3: 'high',
            4: 'critical',
            5: 'custom'
        };

        userData.ruleId = ruleId;
        userData.alert = alertLevels[ruleId];

        const ruleEffects = {
            1: { duration: 30 * 60 * 1000, perm: false },
            2: { duration: 60 * 60 * 1000, perm: false },
            3: { duration: 24 * 60 * 60 * 1000, perm: false },
            4: { duration: 7 * 24 * 60 * 60 * 1000, perm: false },
            5: { duration: null, perm: true }
        };

        const effect = ruleEffects[ruleId];
        userData.adminPermBlocked = effect.perm;
        userData.adminBlockExpires = effect.duration ? new Date(Date.now() + effect.duration) : null;

        await userData.save();
        res.status(200).json({ success: true, msg: "Rule applied successfully" });
    } catch (error) {
        console.error("Error assigning rule:", error);
        res.status(500).json({ success: false, msg: "Error assigning rule" });
    }
};

exports.applyGlobalRule = async (req, res) => {
    try {
        const { ruleId } = req.body;
        const rule = await BlockingRule.findById(ruleId);
        if (!rule) return res.status(400).json({ success:false,msg:"Invalid ruleId" });
        const expiresAt = rule.duration != null ? new Date(Date.now() + rule.duration) : null;
        const perm = rule.duration == null;
        // Update only IPs without a custom rule assignment
        await FailedLogin.updateMany(
            { ruleId: { $exists: false } },
            { $set: {
                ruleId: rule._id,
                appliedRule: rule.description,
                adminBlockExpires: expiresAt,
                adminPermBlocked: perm
            }}
        );
        return res.status(200).json({ success:true, msg:`Global rule '${rule.description}' applied successfully.` });
    } catch (error) {
        console.error("Error applying global rule:", error);
        return res.status(500).json({ success:false,msg:"Failed to apply global rule." });
    }
};

// New handler to apply IP-specific rule
const applyIpRule = async (req, res) => {
    try {
        const { ruleId, ips } = req.body;
        if (!ruleId || !ips || !Array.isArray(ips)) return res.status(400).json({ success:false,msg:"Invalid parameters" });
        const rule = await BlockingRule.findById(ruleId);
        if (!rule) return res.status(404).json({ success:false,msg:"Rule not found" });
        const expiresAt = rule.duration != null ? new Date(Date.now() + rule.duration) : null;
        const perm = rule.duration == null;
        await FailedLogin.updateMany(
            { ip: { $in: ips } },
            { $set: {
                appliedRule: rule.description,
                ruleId: rule._id,
                adminBlockExpires: expiresAt,
                adminPermBlocked: perm
            }}
        );
        res.status(200).json({ success:true,msg:"IP-specific rule applied successfully" });
    } catch (error) {
        console.error("Error in applyIpRule:", error);
        res.status(500).json({ success:false,msg:"Internal server error" });
    }
};
module.exports.applyIpRule = applyIpRule;

// Alias for fetching IP block statuses
exports.getIpBlocks = exports.getAllFailedLogin;

// New handler to unblock by IP
exports.unblockIp = async (req, res) => {
  try {
    const { ip } = req.body;
    
    if (!ip) {
      return res.status(400).json({ 
        success: false, 
        msg: "IP address is required" 
      });
    }
    
    console.log(`Attempting to unblock IP: ${ip}`);
    
    // Find the record first to check if it exists
    const record = await FailedLogin.findOne({ ip });
    
    if (!record) {
      return res.status(404).json({ 
        success: false, 
        msg: `No record found for IP ${ip}` 
      });
    }
    
    // Reset all block-related fields
    record.isBlocked = false;
    record.unblockDate = null;
    record.adminBlockExpires = null;
    record.signInBlockExpires = null;
    record.adminPermBlocked = false;
    record.thresholdReached = null;
    record.currentRuleId = null;
    
    // Add to block history
    record.blockHistory.push({
      timestamp: new Date(),
      duration: "0",
      action: BLOCK_ACTIONS.ADMIN_UNBLOCKED,
      adminNote: "Manually unblocked by admin"
    });
    
    await record.save();
    
    return res.status(200).json({ 
      success: true, 
      msg: `IP ${ip} has been successfully unblocked.` 
    });
    
  } catch (error) {
    console.error("Error unblocking IP:", error);
    return res.status(500).json({ 
      success: false, 
      msg: "Failed to unblock IP. Internal server error." 
    });
  }
};

exports.getEmailTemplates = async (req, res) => {
    try {
        const templates = await EmailTemplate.find();
        res.json({ success: true, templates });
    } catch (error) {
        console.error('Error fetching email templates:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

exports.updateEmailTemplate = async (req, res) => {
    try {
        const { type, subject, body } = req.body;

        if (!type || !subject || !body) {
            return res.status(400).json({ success: false, msg: "Type, subject, and body are required" });
        }

        // Extract variables from subject and body
        const variableRegex = /{([^}]+)}/g;
        const subjectVars = [...new Set(subject.match(variableRegex)?.map(v => v.slice(1, -1)) || [])];
        const bodyVars = [...new Set(body.match(variableRegex)?.map(v => v.slice(1, -1)) || [])];
        const variables = [...new Set([...subjectVars, ...bodyVars])];

        const template = await EmailTemplate.findOneAndUpdate(
            { type },
            { 
                subject, 
                body, 
                variables,
                lastModified: new Date()
            },
            { new: true, upsert: true }
        );

        res.json({ success: true, template });
    } catch (error) {
        console.error('Error updating email template:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

exports.unblockUserAndKeepInFailedAttempts = async (req, res) => {
    try {
        const { ip } = req.body;
        
        if (!ip) {
            return res.status(400).json({ success: false, msg: "IP is required" });
        }
        
        const userData = await FailedLogin.findOne({ ip });
        
        if (!userData) {
            return res.status(404).json({ success: false, msg: "User not found" });
        }
        
        // Unblock user but keep in failed attempts table
        userData.isBlocked = false;
        userData.unblockDate = null;
        userData.adminBlockExpires = null;
        userData.signInBlockExpires = null;
        userData.adminPermBlocked = false;
        // We don't reset failedAttempts so they stay in the failed attempts table
        
        userData.blockHistory.push({
            timestamp: new Date(),
            duration: "0",
            action: "Unblocked"
        });
        
        await userData.save();
        
        res.status(200).json({ success: true, msg: "User unblocked and moved to failed attempts table" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, msg: "Error unblocking user" });
    }
};

exports.clearFailedAttempts = async (req, res) => {
    try {
        const { ip } = req.body;
        if (!ip) {
            return res.status(400).json({ success: false, msg: "IP is required" });
        }
        const userData = await FailedLogin.findOne({ ip });
        if (!userData) {
            return res.status(404).json({ success: false, msg: "User not found" });
        }
        await FailedLogin.deleteOne({ ip });
        return res.status(200).json({ success: true, msg: "IP deleted successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, msg: "Error deleting IP" });
    }
};

exports.clearUserFailedAttempts = async (req, res) => {
    try {
        const { ip } = req.body;
        
        if (!ip) {
            return res.status(400).json({ 
                success: false, 
                msg: "IP address is required" 
            });
        }
        
        // Use the helper function
        const userData = await clearFailedAttempts(ip);
        
        if (!userData) {
            return res.status(404).json({ 
                success: false, 
                msg: "User not found" 
            });
        }
        
        return res.status(200).json({ 
            success: true, 
            msg: "Failed attempts cleared successfully. User removed from tracking."
        });
    } catch (error) {
        console.error("Error clearing failed attempts:", error);
        res.status(500).json({ 
            success: false, 
            msg: "Error clearing failed attempts" 
        });
    }
};

exports.applyRuleToIP = async (req, res) => {
    try {
        const { ip, ruleId } = req.body;
        
        if (!ip || !ruleId) {
            return res.status(400).json({
                success: false,
                msg: "IP and rule ID are required"
            });
        }
        
        // Get the rule and IP record
        const rule = await BlockingRule.findById(ruleId);
        const userData = await FailedLogin.findOne({ ip });
        
        if (!rule) {
            return res.status(404).json({
                success: false,
                msg: "Rule not found"
            });
        }
        
        if (!userData) {
            return res.status(404).json({
                success: false,
                msg: "IP not found in records"
            });
        }
        
        // Apply the rule
        userData.isBlocked = true;
        userData.thresholdReached = rule.threshold;
        userData.currentRuleId = rule._id;
        
        if (rule.duration === null) {
            // Permanent block
            userData.unblockDate = null;
            userData.adminPermBlocked = true;
        } else {
            // Temporary block
            userData.unblockDate = new Date(Date.now() + rule.duration);
        }
        
        // Record in block history
        userData.blockHistory.push({
            timestamp: new Date(),
            duration: rule.duration === null ? "permanent" : `${rule.duration}ms`,
            action: BLOCK_ACTIONS.MANUAL_BLOCK,
            rule: rule.description,
            admin: true
        });
        
        await userData.save();
        
        return res.status(200).json({
            success: true,
            msg: `Rule "${rule.description}" applied to IP ${ip} successfully.`
        });
    } catch (error) {
        console.error("Error applying rule to IP:", error);
        return res.status(500).json({
            success: false,
            msg: "Error applying rule"
        });
    }
};

// Manual Block IP handler
exports.manualBlockIp = async (req, res) => {
  try {
    const { ip, threshold, duration, permanent } = req.body;
    if (!ip || !threshold || (duration === undefined && !permanent)) {
      return res.status(400).json({ success: false, msg: 'IP, threshold, and duration are required.' });
    }
    // Validate IPv4 format
    const ipRegex = /^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
    if (!ipRegex.test(ip)) {
      return res.status(400).json({ success: false, msg: 'Invalid IP address format.' });
    }
    const now = new Date();
    let unblockDate = null;
    let adminPermBlocked = false;
    if (permanent || duration === null) {
      unblockDate = null;
      adminPermBlocked = true;
    } else {
      unblockDate = new Date(now.getTime() + Number(duration));
    }
    // Upsert the FailedLogin record
    const FailedLogin = require('../models/Failedlogin');
    let rec = await FailedLogin.findOne({ ip });
    if (!rec) {
      rec = new FailedLogin({ ip });
    }
    rec.isBlocked = true;
    rec.failedAttempts = Number(threshold);
    rec.unblockDate = unblockDate;
    rec.adminPermBlocked = adminPermBlocked;
    rec.thresholdReached = Number(threshold);
    rec.blockHistory = rec.blockHistory || [];
    rec.blockHistory.push({
      timestamp: now,
      duration: permanent || duration === null ? 'permanent' : `${duration}ms`,
      action: 'Manual Block',
      admin: true,
      adminNote: permanent || duration === null ? 'Permanent manual block' : undefined
    });
    await rec.save();
    return res.status(200).json({ success: true, msg: 'IP manually blocked.', ip });
  } catch (err) {
    console.error('Manual block IP error:', err);
    return res.status(500).json({ success: false, msg: 'Server error during manual block.' });
  }
};