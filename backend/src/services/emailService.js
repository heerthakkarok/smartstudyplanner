const nodemailer = require('nodemailer');

const createTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;

  if (!user || user.includes('your_email') || !pass || pass.includes('your_email_app_password')) {
    console.warn('[NODEMAILER WARNING] Missing real EMAIL_USER or EMAIL_PASSWORD in backend .env file.');
    return null;
  }

  // Gmail SMTP Service Transporter
  if (!process.env.EMAIL_HOST || process.env.EMAIL_HOST === 'smtp.gmail.com') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });
  }

  // Standard Custom SMTP Transporter
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: {
      user,
      pass,
    },
  });
};

// Verify Transporter configuration at startup
const verifyEmailTransporter = async () => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log('[SMTP CONFIG] Please configure EMAIL_USER and EMAIL_PASSWORD (Gmail App Password) in backend .env file.');
    return false;
  }

  return new Promise((resolve) => {
    transporter.verify((error, success) => {
      if (error) {
        console.error('SMTP CONNECTION ERROR:', error.message || error);
        resolve(false);
      } else {
        console.log('SMTP SERVER READY');
        resolve(true);
      }
    });
  });
};

const sendResetCodeEmail = async (toEmail, userName, resetCode) => {
  const transporter = createTransporter();

  if (!transporter) {
    throw new Error('SMTP transporter is not configured. Please add valid EMAIL_USER and EMAIL_PASSWORD (Gmail App Password) to backend .env file.');
  }

  const senderUser = process.env.EMAIL_USER;
  let fromHeader = process.env.EMAIL_FROM;
  if (!fromHeader || fromHeader.includes('no-reply@smartstudyplanner.com') || fromHeader.includes('your_email')) {
    fromHeader = `"Smart Study Planner" <${senderUser}>`;
  }

  const mailOptions = {
    from: fromHeader,
    to: toEmail,
    subject: 'Smart Study Planner - Password Reset Code',
    text: `Hello ${userName || ''},\n\nWe received a request to reset your password. Your 6-digit verification code is: ${resetCode}\n\nThis code expires in 10 minutes.\n\nIf you did not request a password reset, please ignore this email.\n\nSmart Study Planner`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; color: #1e293b; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
        <h2 style="color: #2563eb; margin-bottom: 5px;">Smart Study Planner</h2>
        <p style="color: #64748b; margin-top: 0;">Hello ${userName || 'Student'},</p>
        <p style="color: #334155;">We received a request to reset your password.</p>
        <p style="color: #334155;">Your password reset verification code is:</p>
        
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; color: #dc2626; background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
          ${resetCode}
        </div>

        <p style="color: #64748b; font-size: 13px;">This code expires in <strong>10 minutes</strong>.</p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 25px;">If you did not request a password reset, you can safely ignore this email.</p>
        <p style="color: #64748b; font-size: 13px;">Smart Study Planner</p>
      </div>
    `,
  };

  // Safe delivery diagnostic logging (No OTP / No Passwords)
  console.log("RESET EMAIL FROM:", mailOptions.from);
  console.log("RESET EMAIL TO:", mailOptions.to);
  console.log("RESET EMAIL SUBJECT:", mailOptions.subject);

  const info = await transporter.sendMail(mailOptions);

  console.log("RESET EMAIL MESSAGE ID:", info.messageId);
  console.log("RESET EMAIL ACCEPTED:", info.accepted);
  console.log("RESET EMAIL REJECTED:", info.rejected);
  console.log("RESET EMAIL RESPONSE:", info.response);

  // Validate SMTP acceptance (Case-insensitive recipient check)
  const isAccepted = Array.isArray(info.accepted) && info.accepted.some(
    (addr) => addr.toLowerCase() === toEmail.toLowerCase()
  );

  if (!info.accepted || info.accepted.length === 0 || !isAccepted) {
    console.error(`[SMTP ERROR] Recipient ${toEmail} was not accepted by SMTP server. Accepted:`, info.accepted, 'Rejected:', info.rejected);
    throw new Error("SMTP did not accept the recipient email address.");
  }

  return info;
};

const sendMonthlyReportEmail = async (toEmail, userName, reportData) => {
  const transporter = createTransporter();
  if (!transporter) return false;

  const senderUser = process.env.EMAIL_USER;
  let fromHeader = process.env.EMAIL_FROM;
  if (!fromHeader || fromHeader.includes('no-reply@smartstudyplanner.com') || fromHeader.includes('your_email')) {
    fromHeader = `"Smart Study Planner" <${senderUser}>`;
  }

  const mailOptions = {
    from: fromHeader,
    to: toEmail,
    subject: `Your Monthly Study Report - Smart Study Planner`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 25px; color: #1e293b; background-color: #f8fafc; border-radius: 12px;">
        <h2 style="color: #2563eb; margin-bottom: 5px;">Monthly Study Report</h2>
        <p style="color: #64748b; margin-top: 0;">Hi ${userName}, here is your performance overview for this past month.</p>
        
        <div style="display: flex; gap: 15px; margin: 20px 0;">
          <div style="background: #ffffff; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; flex: 1;">
            <span style="font-size: 12px; color: #64748b; text-transform: uppercase;">Total Study Time</span>
            <h3 style="margin: 5px 0; color: #2563eb;">${reportData.totalStudyHours} hours</h3>
          </div>
          <div style="background: #ffffff; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; flex: 1;">
            <span style="font-size: 12px; color: #64748b; text-transform: uppercase;">Tasks Completed</span>
            <h3 style="margin: 5px 0; color: #10b981;">${reportData.completedTasksCount} / ${reportData.totalTasks} (${reportData.completionRate}%)</h3>
          </div>
        </div>

        <div style="background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 15px;">
          <h4 style="margin-top: 0; color: #1e293b;">Performance Summary</h4>
          <p style="margin: 5px 0;"><strong>Average Quiz Accuracy:</strong> ${reportData.avgQuizScore}%</p>
          <p style="margin: 5px 0;"><strong>Current Active Streak:</strong> ${reportData.studyStreak} days 🔥</p>
        </div>

        ${reportData.weakTopics?.length > 0 ? `
          <div style="background: #fff1f2; padding: 15px; border-radius: 8px; border: 1px solid #fecdd3; margin-bottom: 15px;">
            <h4 style="margin-top: 0; color: #e11d48;">Weak Topics Needing Attention</h4>
            <ul style="margin: 5px 0; padding-left: 20px;">
              ${reportData.weakTopics.map(t => `<li><strong>${t.name}</strong> (${t.subjectName})</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        <p style="color: #64748b; font-size: 13px; margin-top: 25px;">Keep up the great effort towards your exam targets!</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Monthly report email sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error(`Failed to send monthly report to ${toEmail}:`, error.message);
    return false;
  }
};

module.exports = {
  verifyEmailTransporter,
  sendResetCodeEmail,
  sendMonthlyReportEmail,
};
