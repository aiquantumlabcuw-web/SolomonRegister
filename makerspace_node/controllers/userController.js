const { User, isSimilarPassword, forgotPasswordS } = require('../models/userModel');

const jwt = require("jsonwebtoken");
const key = require("../config/secret");
const crypto = require('crypto');
const mailService = require('../service/mailService');
const nodemailer = require('nodemailer');
require('dotenv').config();

const { passwordSchema } = require('../models/zod');
const { transporter } = require('../service/mailService');
const Role = require("../models/role");
const Privilege = require("../models/privilege");
const RolePrivilege = require('../models/rolePrivilege');
const Otp = require('../models/otp');
const {handleFailedLogin} = require('../helpers/handleFailedLogin');
const { checkBlockStatus, handleFailedAttempt, signInCheckBlockStatus } = require('../helpers/loginBlockingRules');
exports.addUserByAdmin = async (req, res) => {
  try {
    var defaultRole = await Role.findOne({ role_name: 'User' });
    if (!defaultRole) {
       defaultRole = await Role.create({ role_name: 'User' });
    }
    const { email, password, first_name, last_name } = req.body;
    var findOldUser = await User.findOne({ email });
    if (findOldUser) {
      return res.status(400).json({ success: false, msg: "User already exists" });
    }
    const newUser = await User.create({ email, password, first_name, last_name, role_id: defaultRole._id });
    var userPrivelege = await Privilege.findOne({ privilege_name: 'User' });
    if (!userPrivelege) {
       userPrivelege= await Privilege.create({ privilege_name: 'User' });
    }
    var privilegeAllowed = await RolePrivilege.findOne({role_id:defaultRole._id,privilege_id:userPrivelege._id});
    if (!privilegeAllowed) {
       privilegeAllowed= await RolePrivilege.create({role_id:defaultRole._id,privilege_id:userPrivelege._id});
    }
    await newUser.save();
    const token = jwt.sign(newUser.email, key);
    res.send({ success: true, token: token, message: "User created successfully", newUser })
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        success: false,
        msg: "An error occurred while processing your request",
      });
  }
};





exports.signup = async (req, res) => {
  try {
    const defaultRole = await Role.findOne({ role_name: 'User' });
    if (!defaultRole) {
      return res.status(500).json({
        success: false,
        msg: "Default role 'User' not found. Please ensure it's set up correctly.",
      });
    }

    const { email, password, first_name, last_name } = req.body;
    console.log(req.body)
    const newUser = new User({ email, password, first_name, last_name, role_id: defaultRole._id });
    await newUser.save();

    
      await mailService.sendMail({
        from: '',
        to: email,
        subject: `Your Makerspace Account Has Been Successfully Created`,
        text: 'Congratulations! Your account has been successfully created. You can now log in to the Makerspace to view your tickets, submit new requests, and track their progress. If you need any assistance, feel free to reach out to support.',
      });
     
    const token = jwt.sign(newUser.email, key);
    req.session.isLoggedIn = true;
    res
      .status(201)
      .json({
        success: true,
        token: token,
        message: "User created successfully",
      });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        success: false,
        msg: "An error occurred while processing your request",
      });
  }
};

exports.signin = async (req, res) => {
  try {
    req.session.isLoggedIn = true;
    const { email, password } = req.body;
    const ip = req.ip;
    const user = await User.findOne({ email }).populate('role_id');
    let userFound = Boolean(user);
    console.log(userFound)

    if (!userFound) {
      await handleFailedAttempt(ip);
      return res.status(404).json({ success: false });
    }

    const token = jwt.sign(user.email, key);

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await handleFailedAttempt(ip);
      const check = await signInCheckBlockStatus(ip)

      if (check.blocked) {
        // compute remaining milliseconds
        const now = Date.now();
        const expiresMs = new Date(check.expires).getTime();
        const remaining = expiresMs - now;

        // for example, in minutes:
        const remainingMinutes = Math.ceil(remaining / 60000);

        return res.status(403).json({
          success: false,
          msg: `You’re blocked for another ${remainingMinutes} minute(s)`,
          blocked: true,
          expires: check.expires,           // original Date
          remaining,                         // raw ms
          remainingMinutes                   // human‑friendly
        });
      }

      const blockStatus = await checkBlockStatus(ip);
      return res
        .status(403)
        .json({
          success: false,
          token: token,
          isAdmin: false,
          msg: "You have entered the wrong password",
          blocked: blockStatus.blocked,
          expires:check
        });
    }

    const blockStatus = await checkBlockStatus(ip);
    if (blockStatus.blocked) {
      return res.status(403).json({
        success: false,
        msg: blockStatus.permanent ? 
          "Your account is permanently blocked. Contact administrator." :
          `Your account is temporarily blocked until ${new Date(blockStatus.expires).toLocaleString()}`
      });
    }

    const isAdmin = user.role_id?.role_name === ('Admin');
    res.status(200).json({ success: true, token: token, isAdmin: isAdmin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
};

exports.updatepassword = async (req, res) => {

  try {
    const payload = req.headers.authorization;
    const { password, newPassword } = req.body;
    const parsedPassword = passwordSchema.safeParse(newPassword);
    const email = jwt.verify(payload, key);
    const user = await User.findOne({ email });

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, msg: "You have entered wrong current password" });

    }

    if (!parsedPassword.success) {
      res.json({
        success: false, msg: "Password must contain at least one uppercase letter and one special character."
      })
      return;
    }

    const newPassMatchOldPass = await user.comparePassword(newPassword);
    if (newPassMatchOldPass) {
      res.json({ success: false, msg: "The new password already exists! Try another one" })
      return;
    }

    if (isSimilarPassword(password, newPassword)) {
      return res.json({ success: false, msg: "The new password is too similar to the current password! Try another one" });
    }



    user.password = newPassword; // This triggers the pre-save hook
    await user.save();
    res.json({ success: true, msg: "Password updated successfully" })


  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false, msg: 'An error occurred while processing your request'
    })
  }
}

exports.checkEmailAccount = async (req, res) => {

  const { email } = req.body;
  const user = await User.findOne({ email });
  // console.log(user._id.toString());
  const userFound = Boolean(user);
  if (!userFound) {
    return res.status(400).json({ success: false, msg: 'User not found' });
  }

  const Fkey = jwt.sign(user._id.toString(), key);
  let resetCode = crypto.randomInt(100000, 999999).toString();
  let resetCodeExpires = Date.now() + 300000;

  const forgotPasswordEntry = await forgotPasswordS.findOne({ email });
  if (forgotPasswordEntry) {
    // Update existing entry
    forgotPasswordEntry.resetCode = resetCode;
    forgotPasswordEntry.resetCodeExpires = resetCodeExpires
    await forgotPasswordEntry.save();
  } else {
    const fp = new forgotPasswordS();
    fp.email = email;
    fp.resetCode = resetCode;
    fp.resetCodeExpires = resetCodeExpires;
    await fp.save();
  }

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset Code',
    text: `Your password reset code is ${resetCode}`
  });


  res.status(200).json({ success: true, Fkey: Fkey, msg: 'Reset code sent to your email' });

}

exports.forgotpassword = async (req, res) => {
  console.log(req.body)
  const email = req.body.email;
  // const payload = req.headers.authorization;
  const { newPassword } = req.body;
  const parsedPassword = passwordSchema.safeParse(newPassword);
  // const _id = jwt.verify(payload, key);
  const user = await User.findOne({ email });
  const userFound = Boolean(user);
  if (!userFound) {
    return res.status(400).json({ success: false, msg: 'User not found' });
  }

  if (!parsedPassword.success) {
    res.json({
      success: false, msg: "Password must contain at least one uppercase letter and one special character."
    })
    return;
  }

  const newPassMatchOldPass = await user.comparePassword(newPassword);
  // console.log(newPassMatchOldPass) it gives you true or false
  if (newPassMatchOldPass) {
    res.json({ success: false, msg: "The new password already exists! Try another one" })
    return;
  }

  user.password = newPassword;
  user.updated_at = Date.now(); // This triggers the pre-save hook
  await user.save();

  res.status(200).json({success:true,msg:" Your password has been successfully updated "});

}

exports.emailVerification = async (req, res) => {
  const { email, resetCode } = req.body;

  const user = await User.findOne({ email });
  const userF = Boolean(user);
  if (!userF) {
    return res.status(400).json({ success: false, msg: 'User not found' });
  }
  // const newPassMatchOldPass = await user.comparePassword(newPassword);
  // // console.log(newPassMatchOldPass) it gives you true or false
  // if (newPassMatchOldPass) {
  //   res.json({ success: false, msg: "The new password already exists! Try another one" })
  //   return;
  // }

  const foundInForgetPass = await forgotPasswordS.findOne({
    email,
    resetCode,
    resetCodeExpires: { $gt: Date.now() } // Check if the code is still valid
  });

  const userFound = Boolean(foundInForgetPass);
  if (!userFound) {
    return res.status(400).json({ success: false,msg: 'Invalid verification code' });
  }


  res.json({ success: true, msg: "Your email has successfully verified" })


}

exports.updateNames = async (req, res) => {

  try {
    const update = {};
    const payload = req.headers.authorization;
    const email = jwt.verify(payload, key);
    const { firstName, lastName } = req.body;
    const imageurl = req.file ? req.file.path : null;

    if(imageurl && imageurl.trim()){
      update.imageurl=imageurl;
  }
    if (firstName !== undefined && firstName !== "") {
      update.first_name = firstName;
    }
    if (lastName !== undefined && lastName !== "") {
      update.last_name = lastName;
    }
    if (Object.keys(update).length === 0) {
      throw new Error('No fields to update');
    }

    const user = await User.updateOne({ email }, update);
    console.log(user);


    if (user.acknowledged) {
      res.json({ success: true, msg: "Names have been successfully updated " });
    } else {
      res.json({ success: false, msg: "Unable to update names " });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false, msg: 'An error occurred while processing your request'
    })
  }

}

exports.userDetails = async (req, res) => {
  try {

    let payload = req.headers.authorization;
    payload=payload.split(" ")[1];
    const email = jwt.verify(payload, key);
    const user = await User.findOne({ email }).select('email first_name last_name imageurl');
    console.log(user);
    const userFound = Boolean(user);
    if (!userFound) {
           res.status(200).json({
              msg: " Didn't find the user "
      })
    }
      res.json({
        success:true,
        user:user,
        msg:"found the user successfully"
      })
    
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      msg: "An error occurred while processing your request",
    });
  }
};

exports.logout = async (req, res) => {
  try {
    req.session.isLoggedIn = false;
    // req.session.destroy((err) => {
    //   if(err) throw err;
    // });
    res.status(200).json({
      success: true,
      msg: "User logged out.",
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      msg: "An error occurred while processing your request",
    });
  }
};

exports.validateToken = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Authorization header is missing' });
    }

    const [authType, token] = authHeader.split(' ');
    if (authType !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Invalid authorization header' });
    }

    const SECRET_KEY = key;
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      // Token is valid, you can add additional checks here if needed
      res.status(200).json({ message: 'Token is valid', userId: decoded.id });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while processing your request' });
  }
}

exports.getOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, msg: 'User not found' });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await mailService.sendMail({
      from: '',
      to: email,
      subject: 'Your OTP for password reset',
      text: `Your OTP for password reset is ${otp}`,
    });
    const existingOtp = await Otp.findOne({ email });
    if (existingOtp) {
      existingOtp.otp = otp;
      await existingOtp.save();
    } else {
      const newOtpValidation = new Otp({ email, otp });
      await newOtpValidation.save();
    }
    res.status(200).json({ success: true, msg: 'OTP sent to your email' });
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ success: false, msg: 'An error occurred while processing your request' });
  }
}

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const existingOtp = await Otp.findOne({ email });
    if (!existingOtp) {
      return res.status(400).json({ success: false, msg: 'No OTP found for this email' });
    }
    if (existingOtp.otp !== otp) {
      return res.status(400).json({ success: false, msg: 'Invalid OTP' });
    }
    res.status(200).json({ success: true, msg: 'OTP verified' });
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ success: false, msg: 'An error occurred while processing your request' });
  }
}