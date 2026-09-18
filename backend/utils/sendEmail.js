import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error(
      "EMAIL_USER and EMAIL_PASS are not set. For Gmail, EMAIL_PASS must be a 16-character App Password."
    );
  }

  // Create a transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS.replace(/\s+/g, ""), // Google shows app passwords with spaces
    },
  });

  // Define the email options
  const mailOptions = {
    from: `AgriSense <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  // Send the email
  await transporter.sendMail(mailOptions);
};

export default sendEmail;
