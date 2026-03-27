const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const hasMailConfig = () => {
    return Boolean(
        process.env.SMTP_HOST
        && process.env.SMTP_PORT
        && process.env.SMTP_USER
        && process.env.SMTP_PASS
        && process.env.SMTP_FROM_EMAIL
    );
};

const getTransporter = () => {
    if (!hasMailConfig()) {
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
    });
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
    const transporter = getTransporter();

    if (!transporter) {
        return {
            sent: false,
            skipped: true,
            reason: 'SMTP is not configured',
        };
    }

    const fromName = process.env.SMTP_FROM_NAME || 'Survey App';
    const fromEmail = process.env.SMTP_FROM_EMAIL;
    const attachments = normalizeAttachments(templateAttachments);

    const payload = (templateSubject || templateBody)
        ? buildCustomEmail({ userName, surveyTitle, templateSubject, templateBody, submittedAt })
        : buildGenericEmail({ userName, surveyTitle, submittedAt });

    await transporter.sendMail({
        from: `${fromName} <${fromEmail}>`,
        to,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
        attachments,
    });

    return {
        sent: true,
        skipped: false,
        attachmentCount: attachments.length,
    };
};

const sendSignupOtpEmail = async ({ to, userName, otpCode, expiresMinutes = 10 }) => {
    const transporter = getTransporter();

    if (!transporter) {
        return {
            sent: false,
            skipped: true,
            reason: 'SMTP is not configured',
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

    await transporter.sendMail({
        from: `${fromName} <${fromEmail}>`,
        to,
        subject,
        text,
        html,
    });

    return {
        sent: true,
        skipped: false,
    };
};

module.exports = {
    sendSurveySubmissionEmail,
    sendSignupOtpEmail,
};
