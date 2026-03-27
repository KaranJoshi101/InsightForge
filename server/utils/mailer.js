const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const fs = require('fs');
const path = require('path');

const hasSendGridConfig = () => {
    return Boolean(process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.trim());
};

const hasSmtpConfig = () => {
    return Boolean(
        process.env.SMTP_HOST
        && process.env.SMTP_PORT
        && process.env.SMTP_USER
        && process.env.SMTP_PASS
        && process.env.SMTP_FROM_EMAIL
    );
};

const hasMailConfig = () => {
    return hasSendGridConfig() || hasSmtpConfig();
};

const getTransporter = () => {
    if (!hasSmtpConfig()) {
        return null;
    }

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT, 10),
        secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        connectionTimeout: 10000,
        socketTimeout: 10000,
    });
};

const initSendGrid = () => {
    if (!hasSendGridConfig()) {
        return null;
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    return sgMail;
};

const sendMailWithTimeout = async (transporter, mailOptions, timeoutMs = 15000) => {
    return Promise.race([
        transporter.sendMail(mailOptions),
        new Promise((_, reject) =>
            setTimeout(
                () => reject(new Error(`Email send timeout after ${timeoutMs}ms`)),
                timeoutMs
            )
        ),
    ]);
};

const sendViaSendGrid = async (mailOptions, timeoutMs = 15000) => {
    const sg = initSendGrid();
    if (!sg) {
        return null;
    }

    return Promise.race([
        sg.send(mailOptions),
        new Promise((_, reject) =>
            setTimeout(
                () => reject(new Error(`SendGrid send timeout after ${timeoutMs}ms`)),
                timeoutMs
            )
        ),
    ]);
};

const normalizeAttachments = (rawAttachments) => {
    if (!Array.isArray(rawAttachments)) return [];

    const uploadsDir = path.join(__dirname, '..', 'uploads');

    return rawAttachments
        .map((item) => {
            if (!item || typeof item !== 'object') return null;

            const filename = typeof item.name === 'string' ? item.name : 'attachment';

            if (typeof item.path === 'string' && item.path.startsWith('/uploads/')) {
                const relativePath = item.path.replace('/uploads/', '');
                const absolutePath = path.join(uploadsDir, relativePath);
                if (fs.existsSync(absolutePath)) {
                    return {
                        filename,
                        path: absolutePath,
                    };
                }
            }

            if (typeof item.url === 'string' && item.url.trim()) {
                return {
                    filename,
                    path: item.url.trim(),
                };
            }

            return null;
        })
        .filter(Boolean);
};

const buildGenericEmail = ({ userName, surveyTitle, submittedAt }) => {
    const displayName = userName || 'there';
    const dateText = submittedAt ? new Date(submittedAt).toLocaleString() : new Date().toLocaleString();

    const subject = `Thank you for submitting: ${surveyTitle}`;
    const text = [
        `Hello ${displayName},`,
        '',
        `Thank you for submitting your response to "${surveyTitle}".`,
        `We have recorded your submission on ${dateText}.`,
        '',
        'We appreciate your time and feedback.',
        '',
        'Best regards,',
        'Survey Team',
    ].join('\n');

    const html = `
        <p>Hello ${displayName},</p>
        <p>Thank you for submitting your response to <strong>${surveyTitle}</strong>.</p>
        <p>We have recorded your submission on ${dateText}.</p>
        <p>We appreciate your time and feedback.</p>
        <p>Best regards,<br/>Survey Team</p>
    `;

    return { subject, text, html };
};

const buildCustomEmail = ({ userName, surveyTitle, templateSubject, templateBody, submittedAt }) => {
    const tokens = {
        '{{user_name}}': userName || 'User',
        '{{survey_title}}': surveyTitle,
        '{{submitted_at}}': submittedAt ? new Date(submittedAt).toLocaleString() : new Date().toLocaleString(),
    };

    const replaceTokens = (input) => {
        let output = input || '';
        Object.entries(tokens).forEach(([key, value]) => {
            output = output.split(key).join(String(value));
        });
        return output;
    };

    const subject = replaceTokens(templateSubject || `Thank you for submitting: ${surveyTitle}`);
    const body = replaceTokens(templateBody || 'Thank you for your submission.');

    return {
        subject,
        text: body,
        html: `<p>${body.replace(/\n/g, '<br/>')}</p>`,
    };
};

const sendSurveySubmissionEmail = async ({
    to,
    userName,
    surveyTitle,
    submittedAt,
    templateSubject,
    templateBody,
    templateAttachments,
}) => {
    if (!hasMailConfig()) {
        return {
            sent: false,
            skipped: true,
            reason: 'Email is not configured',
        };
    }

    const fromName = process.env.SMTP_FROM_NAME || 'Survey App';
    const fromEmail = process.env.SMTP_FROM_EMAIL;
    const attachments = normalizeAttachments(templateAttachments);

    const payload = (templateSubject || templateBody)
        ? buildCustomEmail({ userName, surveyTitle, templateSubject, templateBody, submittedAt })
        : buildGenericEmail({ userName, surveyTitle, submittedAt });

    // Try SendGrid first if configured
    if (hasSendGridConfig()) {
        const sgMailOptions = {
            to,
            from: `${fromName} <${fromEmail}>`,
            subject: payload.subject,
            text: payload.text,
            html: payload.html,
        };

        try {
            await sendViaSendGrid(sgMailOptions, 20000);
            console.log(`✅ Survey submission email sent via SendGrid to ${to}`);
            return {
                sent: true,
                skipped: false,
                attachmentCount: attachments.length,
                provider: 'sendgrid',
            };
        } catch (err) {
            console.error(`⚠️ SendGrid send failed: ${err.message}, falling back to SMTP`);
        }
    }

    // Fallback to SMTP
    if (hasSmtpConfig()) {
        const transporter = getTransporter();
        const mailOptions = {
            from: `${fromName} <${fromEmail}>`,
            to,
            subject: payload.subject,
            text: payload.text,
            html: payload.html,
            attachments,
        };

        try {
            await sendMailWithTimeout(transporter, mailOptions, 20000);
            console.log(`✅ Survey submission email sent via SMTP to ${to}`);
            return {
                sent: true,
                skipped: false,
                attachmentCount: attachments.length,
                provider: 'smtp',
            };
        } catch (err) {
            console.error(`❌ Survey submission email send failed: ${err.message}`);
            return {
                sent: false,
                skipped: false,
                reason: err.message,
                provider: 'smtp',
            };
        }
    }

    return {
        sent: false,
        skipped: true,
        reason: 'No email provider configured',
    };
};

const sendSignupOtpEmail = async ({ to, userName, otpCode, expiresMinutes = 10 }) => {
    if (!hasMailConfig()) {
        return {
            sent: false,
            skipped: true,
            reason: 'Email is not configured',
        };
    }

    const fromName = process.env.SMTP_FROM_NAME || 'Survey Pro';
    const fromEmail = process.env.SMTP_FROM_EMAIL;
    const displayName = userName || 'there';
    const subject = 'Your Survey Pro signup verification code';
    const text = [
        `Hello ${displayName},`,
        '',
        `Your one-time verification code is: ${otpCode}`,
        `This code expires in ${expiresMinutes} minutes.`,
        '',
        'If you did not request this code, please ignore this email.',
        '',
        'Survey Pro Team',
    ].join('\n');

    const html = `
        <p>Hello ${displayName},</p>
        <p>Your one-time verification code is:</p>
        <p style="font-size: 1.6rem; font-weight: 700; letter-spacing: 4px; margin: 12px 0;">${otpCode}</p>
        <p>This code expires in ${expiresMinutes} minutes.</p>
        <p>If you did not request this code, please ignore this email.</p>
        <p>Survey Pro Team</p>
    `;

    // Try SendGrid first if configured
    if (hasSendGridConfig()) {
        const sgMailOptions = {
            to,
            from: `${fromName} <${fromEmail}>`,
            subject,
            text,
            html,
        };

        try {
            await sendViaSendGrid(sgMailOptions, 15000);
            console.log(`✅ OTP email sent via SendGrid to ${to}`);
            return {
                sent: true,
                skipped: false,
                provider: 'sendgrid',
            };
        } catch (err) {
            console.error(`⚠️ SendGrid send failed: ${err.message}, falling back to SMTP`);
        }
    }

    // Fallback to SMTP
    if (hasSmtpConfig()) {
        const transporter = getTransporter();
        const mailOptions = {
            from: `${fromName} <${fromEmail}>`,
            to,
            subject,
            text,
            html,
        };

        try {
            await sendMailWithTimeout(transporter, mailOptions, 15000);
            console.log(`✅ OTP email sent via SMTP to ${to}`);
            return {
                sent: true,
                skipped: false,
                provider: 'smtp',
            };
        } catch (err) {
            console.error(`❌ OTP email send failed for ${to}: ${err.message}`);
            return {
                sent: false,
                skipped: false,
                reason: err.message,
                provider: 'smtp',
            };
        }
    }

    return {
        sent: false,
        skipped: true,
        reason: 'No email provider configured',
    };
};

module.exports = {
    sendSurveySubmissionEmail,
    sendSignupOtpEmail,
};
