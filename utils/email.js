// ============================================
// utils/email.js - Brevo Email Service
// ============================================
const axios = require('axios');

const sendBrevoEmail = async (to, subject, htmlContent) => {
  try {
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          name: 'Relief Hub',
          email: 'noreply@reliefhub.com'
        },
        to: [{ email: to }],
        subject: subject,
        htmlContent: htmlContent
      },
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Email error:', error.response?.data || error.message);
    throw error;
  }
};

exports.sendEmailToAll = async (request) => {
  try {
    const User = require('../models/User');
    const users = await User.find({ 
      _id: { $ne: request.requester._id },
      isActive: true 
    }).select('email name');

    const emailPromises = users.map(user => {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">🆘 New Help Request on Relief Hub</h2>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="margin-top: 0;">${request.title}</h3>
            <p><strong>Type:</strong> ${request.type.toUpperCase()}</p>
            <p><strong>Requested by:</strong> ${request.requester.name}</p>
            <p><strong>Location:</strong> ${request.address || 'See map for location'}</p>
            <p style="margin-bottom: 0;"><strong>Description:</strong></p>
            <p>${request.description}</p>
          </div>
          <p>Log in to Relief Hub to help!</p>
          <a href="${process.env.FRONTEND_URL}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">View Request</a>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">
            You're receiving this because you're a registered member of Relief Hub. 
            This notification helps connect those in need with volunteers.
          </p>
        </div>
      `;

      return sendBrevoEmail(
        user.email,
        `🆘 New ${request.type} request from ${request.requester.name}`,
        htmlContent
      ).catch(err => console.error(`Failed to send to ${user.email}:`, err.message));
    });

    await Promise.allSettled(emailPromises);
    console.log(`✅ Sent ${emailPromises.length} notification emails`);
  } catch (error) {
    console.error('Error sending bulk emails:', error);
  }
};

exports.sendBrevoEmail = sendBrevoEmail;