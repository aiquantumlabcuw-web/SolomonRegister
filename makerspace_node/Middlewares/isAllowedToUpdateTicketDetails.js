const jwt = require('jsonwebtoken');
const secret = require('../config/secret');
const Role = require('../models/role');
const RolePrivilege  = require('../models/rolePrivilege');
const Privilege  = require('../models/privilege');
const { User } = require('../models/userModel');

const isAllowedToViewAllTickets = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    // console.log(jwt.sign('gillgurvijay01@gmail.com','makerspace'));
    // Check if the authorization header exists
    if (authHeader) {
        // Split the header value into two parts: the authentication scheme and the token
        const [scheme, token] = authHeader.split(' ');

        // Check if the authentication scheme is 'Bearer'
        if (scheme === 'Bearer') {
            try {
                // Verify the token and decode its payload
                const decoded = jwt.verify(token, secret);

                // Extract the email from the decoded payload
                const email = decoded;

                // Attach the email to the request object for further use
                req.email = email;

                // Check if the user is allowed to view all tickets
               
                    const user = await User.findOne({ email})
                    const role = await Role.findOne({_id:user.role_id});
                    const rolePrivilege = await RolePrivilege.findOne({ role_id: role._id });
                    const privilege = await Privilege.findOne({ _id: rolePrivilege.privilege_id });
                    if (privilege.isAllowedToUpdateTicketDetails) {
                        // Call the next middleware or route handler
                        next();
                    } else {
                        // Handle unauthorized access
                        res.status(403).json({ error: 'Unauthorized access', user,role,rolePrivilege,privilege });
                    }
               
                    
                } catch (error) {
                // Handle token verification errors
                console.log({'error':error});
                res.status(401).json({ error,msg: 'Invalid token' });
            }
        } else {
            // Handle unsupported authentication schemes
            res.status(401).json({ error: 'Unsupported authentication scheme' });
        }
    } else {
        // Handle missing authorization header
        res.status(401).json({ error: 'Authorization header missing' });
    }
}
module.exports = isAllowedToViewAllTickets;