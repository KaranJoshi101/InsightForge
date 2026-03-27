-- Add OTP verification storage for sign-up flow

CREATE TABLE IF NOT EXISTS signup_otp_verifications (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_signup_otp_email
    ON signup_otp_verifications (email);

CREATE INDEX IF NOT EXISTS idx_signup_otp_expires_at
    ON signup_otp_verifications (expires_at);
