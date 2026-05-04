const pool = require('../config/database');

const purgeExpiredSignupOtps = async () => {
    await pool.query('DELETE FROM signup_otp_verifications WHERE expires_at < CURRENT_TIMESTAMP');
};

const findUserByEmail = async (email) => {
    const res = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    return res.rows[0] || null;
};

const insertUser = async (name, email, passwordHash, role = 'user') => {
    const res = await pool.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
        [name, email, passwordHash, role]
    );
    return res.rows[0];
};

const insertOrUpdateSignupOtp = async (email, name, passwordHash, otpHash, expiryMinutes) => {
    await pool.query(
        `INSERT INTO signup_otp_verifications (email, name, password_hash, otp_hash, expires_at, attempts, updated_at)
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP + ($5::text || ' minutes')::interval, 0, CURRENT_TIMESTAMP)
             ON CONFLICT (email)
             DO UPDATE SET
                name = EXCLUDED.name,
                password_hash = EXCLUDED.password_hash,
                otp_hash = EXCLUDED.otp_hash,
                expires_at = EXCLUDED.expires_at,
                attempts = 0,
                updated_at = CURRENT_TIMESTAMP`,
        [email, name, passwordHash, otpHash, expiryMinutes]
    );
};

const getPendingOtpByEmail = async (email) => {
    const res = await pool.query(
        `SELECT email, name, password_hash, otp_hash, expires_at, attempts
             FROM signup_otp_verifications
             WHERE email = $1`,
        [email]
    );
    return res.rows[0] || null;
};

const incrementOtpAttempts = async (email) => {
    await pool.query('UPDATE signup_otp_verifications SET attempts = attempts + 1, updated_at = CURRENT_TIMESTAMP WHERE email = $1', [email]);
};

const deleteSignupOtp = async (email) => {
    await pool.query('DELETE FROM signup_otp_verifications WHERE email = $1', [email]);
};

const createUserFromPending = async (name, email, passwordHash) => {
    const res = await pool.query(
        `INSERT INTO users (name, email, password_hash, role)
             VALUES ($1, $2, $3, 'user')
             RETURNING id, name, email, role`,
        [name, email, passwordHash]
    );
    return res.rows[0];
};

const findUserByEmailForAuth = async (email) => {
    const res = await pool.query('SELECT id, name, email, password_hash, role, is_banned FROM users WHERE email = $1', [email]);
    return res.rows[0] || null;
};

const getUserById = async (id) => {
    const res = await pool.query('SELECT id, name, email, role, is_banned, created_at FROM users WHERE id = $1', [id]);
    return res.rows[0] || null;
};

module.exports = {
    purgeExpiredSignupOtps,
    findUserByEmail,
    insertUser,
    insertOrUpdateSignupOtp,
    getPendingOtpByEmail,
    incrementOtpAttempts,
    deleteSignupOtp,
    createUserFromPending,
    findUserByEmailForAuth,
    getUserById,
};
