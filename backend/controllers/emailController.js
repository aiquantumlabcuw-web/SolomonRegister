const renderTemplate = (template, variables) => {
    return template.replace(/{(\w+)}/g, (_, key) => variables[key] || `{${key}}`);
};

const sendEmail = async (req, res) => {
    try {
        const { type, variables } = req.body;
        const template = await getTemplateFromDatabase(type); // Fetch template from DB

        if (!template) {
            return res.status(404).json({ success: false, error: 'Template not found' });
        }

        const renderedSubject = renderTemplate(template.subject, variables);
        const renderedBody = renderTemplate(template.body, variables);

        // Example: Sending email using a hypothetical email service
        const emailServiceResponse = await emailService.send({
            to: variables.recipientEmail,
            subject: renderedSubject,
            body: renderedBody,
        });

        if (emailServiceResponse.success) {
            return res.status(200).json({ success: true, message: 'Email sent successfully' });
        } else {
            return res.status(500).json({ success: false, error: 'Failed to send email' });
        }
    } catch (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

const getTemplateFromDatabase = async (type) => {
    // Example: Fetching template from a database
    const templates = {
        ticketSubmission: {
            subject: 'Ticket Submission: {ticketTitle}',
            body: 'Hello {userName},\n\nYour ticket "{ticketTitle}" has been submitted successfully.',
        },
        ticketStatusUpdate: {
            subject: 'Ticket Update: {ticketTitle}',
            body: 'Hello {userName},\n\nThe status of your ticket "{ticketTitle}" has been updated to {status}.',
        },
    };

    return templates[type] || null;
};

const emailService = {
    send: async ({ to, subject, body }) => {
        // Example: Simulating email sending
        console.log('Sending email to:', to);
        console.log('Subject:', subject);
        console.log('Body:', body);

        return { success: true }; // Simulate success response
    },
};

module.exports = {
    renderTemplate,
    sendEmail,
};