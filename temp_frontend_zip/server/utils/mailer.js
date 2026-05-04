const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const hasPrimarySmtpConfig = () => {
    return Boolean(
        process.env.SMTP_HOST
        && process.env.SMTP_PORT
        && process.env.SMTP_USER
        && process.env.SMTP_PASS
        && process.env.SMTP_FROM_EMAIL
    );
};

const hasFallbackSmtpConfig = () => {
    return Boolean(
        process.env.SMTP_FALLBACK_HOST
        && process.env.SMTP_FALLBACK_PORT
        && process.env.SMTP_FALLBACK_USER
        && process.env.SMTP_FALLBACK_PASS
        && process.env.SMTP_FALLBACK_FROM_EMAIL
    );
};

const hasMailConfig = () => hasPrimarySmtpConfig() || hasFallbackSmtpConfig();

const parseBoolean = (value, fallback = false) => {
    if (value === undefined || value === null || value === '') {
        return fallback;
    }

    return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
};

const getSmtpTransportConfigs = () => {
    const primaryHost = String(process.env.SMTP_HOST || '').trim();
    const primaryPort = parseInt(process.env.SMTP_PORT, 10);
    const primarySecure = parseBoolean(process.env.SMTP_SECURE, false);
    const primaryUser = String(process.env.SMTP_USER || '').trim();
    const primaryPass = process.env.SMTP_PASS;
    const primaryFromEmail = String(process.env.SMTP_FROM_EMAIL || '').trim();
    const primaryFromName = String(process.env.SMTP_FROM_NAME || '').trim();

    const fallbackHost = String(process.env.SMTP_FALLBACK_HOST || '').trim();
    const fallbackPort = parseInt(process.env.SMTP_FALLBACK_PORT || '', 10);
    const fallbackSecure = parseBoolean(process.env.SMTP_FALLBACK_SECURE, !primarySecure);
    const fallbackUser = String(process.env.SMTP_FALLBACK_USER || '').trim();
    const fallbackPass = process.env.SMTP_FALLBACK_PASS;
    const fallbackFromEmail = String(process.env.SMTP_FALLBACK_FROM_EMAIL || '').trim();
    const fallbackFromName = String(process.env.SMTP_FALLBACK_FROM_NAME || '').trim();
    const enableAutoFallback = !parseBoolean(process.env.SMTP_DISABLE_AUTO_FALLBACK, false);

    const configs = [];
    const seen = new Set();
    const pushConfig = (config) => {
        const key = `${config.host}:${config.port}:${config.secure}:${config.user}`;
        if (seen.has(key)) {
            return;
        }
        seen.add(key);
        configs.push(config);
    };

    if (hasPrimarySmtpConfig()) {
        pushConfig({
            host: primaryHost,
            port: primaryPort,
            secure: primarySecure,
            user: primaryUser,
            pass: primaryPass,
            fromEmail: primaryFromEmail,
            fromName: primaryFromName,
            label: `primary:${primaryHost}:${primaryPort}`,
        });
    }

    if (fallbackHost) {
        const resolvedFallbackPort = !Number.isNaN(fallbackPort) && fallbackPort > 0 ? fallbackPort : primaryPort;
        const resolvedFallbackUser = fallbackUser || primaryUser;
        const resolvedFallbackPass = fallbackPass || primaryPass;
        const resolvedFallbackFromEmail = fallbackFromEmail || primaryFromEmail;
        const resolvedFallbackFromName = fallbackFromName || primaryFromName;

        if (resolvedFallbackUser && resolvedFallbackPass && resolvedFallbackFromEmail) {
            pushConfig({
                host: fallbackHost,
                port: resolvedFallbackPort,
                secure: fallbackSecure,
                user: resolvedFallbackUser,
                pass: resolvedFallbackPass,
                fromEmail: resolvedFallbackFromEmail,
                fromName: resolvedFallbackFromName,
                label: `fallback:${fallbackHost}:${resolvedFallbackPort}`,
            });

            // Auto-try common SMTP relay ports for fallback host too.
            if (enableAutoFallback) {
                const fallbackAlternates = [
                    { port: 587, secure: false },
                    { port: 2525, secure: false },
                    { port: 465, secure: true },
                ];

                fallbackAlternates.forEach(({ port, secure }) => {
                    pushConfig({
                        host: fallbackHost,
                        port,
                        secure,
                        user: resolvedFallbackUser,
                        pass: resolvedFallbackPass,
                        fromEmail: resolvedFallbackFromEmail,
                        fromName: resolvedFallbackFromName,
                        label: `fallback-auto:${fallbackHost}:${port}`,
                    });
                });
            }
        }
    } else if (!Number.isNaN(fallbackPort) && fallbackPort > 0 && fallbackPort !== primaryPort) {
        if (hasPrimarySmtpConfig()) {
            pushConfig({
                host: primaryHost,
                port: fallbackPort,
                secure: fallbackSecure,
                user: primaryUser,
                pass: primaryPass,
                fromEmail: primaryFromEmail,
                fromName: primaryFromName,
                label: `fallback:${primaryHost}:${fallbackPort}`,
            });
        }
        return configs;
    }

    if (enableAutoFallback && hasPrimarySmtpConfig()) {
        if (primaryPort === 587) {
            pushConfig({
                host: primaryHost,
                port: 465,
                secure: true,
                user: primaryUser,
                pass: primaryPass,
                fromEmail: primaryFromEmail,
                fromName: primaryFromName,
                label: `auto-fallback:${primaryHost}:465`,
            });
            pushConfig({
                host: primaryHost,
                port: 2525,
                secure: false,
                user: primaryUser,
                pass: primaryPass,
                fromEmail: primaryFromEmail,
                fromName: primaryFromName,
                label: `auto-fallback:${primaryHost}:2525`,
            });
        } else if (primaryPort === 465) {
            pushConfig({
                host: primaryHost,
                port: 587,
                secure: false,
                user: primaryUser,
                pass: primaryPass,
                fromEmail: primaryFromEmail,
                fromName: primaryFromName,
                label: `auto-fallback:${primaryHost}:587`,
            });
            pushConfig({
                host: primaryHost,
                port: 2525,
                secure: false,
                user: primaryUser,
                pass: primaryPass,
                fromEmail: primaryFromEmail,
                fromName: primaryFromName,
                label: `auto-fallback:${primaryHost}:2525`,
            });
        }
    }

    return configs;
};

const getTransporter = ({ host, port, secure, user, pass }) => {
    if (!host || !port || !user || !pass) {
        return null;
    }

    const ipFamily = parseInt(process.env.SMTP_IP_FAMILY || '4', 10);

    return nodemailer.createTransport({
        host,
        port,
        secure,
        requireTLS: !secure,
        family: Number.isNaN(ipFamily) ? 4 : ipFamily,
        auth: {
            user,
            pass,
        },
        tls: {
            servername: host,
            rejectUnauthorized: true,
            minVersion: 'TLSv1.2',
        },
        connectionTimeout: 10000,
        socketTimeout: 10000,
    });
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

const sendSmtpWithFallback = async (mailOptionsBuilder, timeoutMs = 15000) => {
    const transportConfigs = getSmtpTransportConfigs();
    const failures = [];

    for (const config of transportConfigs) {
        const transporter = getTransporter({
            host: config.host,
            port: config.port,
            secure: config.secure,
            user: config.user,
            pass: config.pass,
        });
        if (!transporter) {
            break;
        }

        const mailOptions = mailOptionsBuilder(config);

        try {
            await sendMailWithTimeout(transporter, mailOptions, timeoutMs);
            return { host: config.host, port: config.port, secure: config.secure, label: config.label };
        } catch (err) {
            failures.push(`${config.label}:${err.message}`);
            console.warn(`⚠️ SMTP attempt failed on ${config.label} (${config.secure ? 'secure' : 'starttls'}): ${err.message}`);
        }
    }

    throw new Error(failures.join(' | ') || 'SMTP send failed with no transport attempts');
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
            reason: 'SMTP is not configured',
        };
    }

    const attachments = normalizeAttachments(templateAttachments);

    const payload = (templateSubject || templateBody)
        ? buildCustomEmail({ userName, surveyTitle, templateSubject, templateBody, submittedAt })
        : buildGenericEmail({ userName, surveyTitle, submittedAt });

    try {
        const smtpMeta = await sendSmtpWithFallback((config) => ({
            from: `${config.fromName || 'InsightForge'} <${config.fromEmail}>`,
            to,
            subject: payload.subject,
            text: payload.text,
            html: payload.html,
            attachments,
        }), 20000);
        return {
            sent: true,
            skipped: false,
            attachmentCount: attachments.length,
            port: smtpMeta.port,
            host: smtpMeta.host,
        };
    } catch (err) {
        console.error('❌ Survey submission email send failed:', err.message);
        return {
            sent: false,
            skipped: false,
            reason: err.message,
        };
    }
};

const sendSignupOtpEmail = async ({ to, userName, otpCode, expiresMinutes = 10 }) => {
    if (!hasMailConfig()) {
        return {
            sent: false,
            skipped: true,
            reason: 'SMTP is not configured',
        };
    }

    const displayName = userName || 'there';
    const subject = 'Your InsightForge signup verification code';
    const text = [
        `Hello ${displayName},`,
        '',
        `Your one-time verification code is: ${otpCode}`,
        `This code expires in ${expiresMinutes} minutes.`,
        '',
        'If you did not request this code, please ignore this email.',
        '',
        'InsightForge Team',
    ].join('\n');

    const html = `
        <p>Hello ${displayName},</p>
        <p>Your one-time verification code is:</p>
        <p style="font-size: 1.6rem; font-weight: 700; letter-spacing: 4px; margin: 12px 0;">${otpCode}</p>
        <p>This code expires in ${expiresMinutes} minutes.</p>
        <p>If you did not request this code, please ignore this email.</p>
        <p>InsightForge Team</p>
    `;

    try {
        const smtpMeta = await sendSmtpWithFallback((config) => ({
            from: `${config.fromName || 'InsightForge'} <${config.fromEmail}>`,
            to,
            subject,
            text,
            html,
        }), 15000);
        console.log(`✅ OTP email sent to ${to} via SMTP ${smtpMeta.host}:${smtpMeta.port}`);
        return {
            sent: true,
            skipped: false,
            port: smtpMeta.port,
            host: smtpMeta.host,
        };
    } catch (err) {
        console.error(`❌ OTP email send failed for ${to}:`, err.message);
        return {
            sent: false,
            skipped: false,
            reason: err.message,
        };
    }
};

module.exports = {
    sendSurveySubmissionEmail,
    sendSignupOtpEmail,
};
