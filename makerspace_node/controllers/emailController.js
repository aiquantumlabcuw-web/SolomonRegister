const nodemailer = require('nodemailer');
const Email = require('../models/email');
const mailService = require('../service/mailService');
const EmailTemplate = require('../models/EmailTemplate');

exports.sendEmail = async (req, res) => {
    try {
        const { to, from, subject, body } = req.body;


        const mailOptions = {
            from: from,
            to: to,
            subject: subject,
            text: body
        };

    
        await mailService.sendMail(mailOptions);

        const newEmail = new Email({ to, from, subject, body });
        await newEmail.save();


        res.status(200).send('Email sent and saved successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error sending email');
    }
};

exports.getEmailTemplates  = async (req, res) => {
try{
    const emailTemplates = await EmailTemplate.find();
    res.status(200).json(emailTemplates);
}
catch(err){
    console.error('Error fetching email templates:', err);
    res.status(500).json({ error: 'Internal Server Error', err : err }); 
}
}

exports.getTemplateById = async (req, res) => {
    
    try{
        const template = await EmailTemplate.findById(req.params.id);
        res.status(201).json(template);
    }
    catch(err){
        console.error('Error fetching email templates:', err);
        res.status(500).json({ error: 'Internal Server Error', err : err }); 
    }}

exports.updateEmailTemplate = async (req, res) => {
    try{
        const  { name, subject, body, placeholders } = req.body;
        const template = await EmailTemplate.findOneAndUpdate(
            { name },
            { subject, body, placeholders },
            { new: true, upsert: true }
          );
          res.status(204).json({sg:"Resource Updated Successfully","template" : template});
        }
    catch(err){
        console.error('Error updating email template:', err);
        res.status(500).json({ error: 'Internal Server Error', err : err }); 
    }
} 