import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BackLink from '../components/BackLink';

const RegisterPage = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [otpStep, setOtpStep] = useState(false);
    const [otpSentTo, setOtpSentTo] = useState('');
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [loading, setLoading] = useState(false);
    const { requestSignupOtp, verifySignupOtp, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setError('');
        setInfo('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,128}$/;
        if (!strongPasswordPattern.test(password)) {
            setError('Password must be 10-128 chars and include uppercase, lowercase, number, and special character');
            return;
        }

        setLoading(true);

        try {
            await requestSignupOtp(name, email, password);
            setOtpStep(true);
            setOtpSentTo(email.trim().toLowerCase());
            setInfo('Verification code sent. Please check your email.');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send verification code');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setInfo('');

        const safeOtp = otp.trim();
        if (!/^\d{6}$/.test(safeOtp)) {
            setError('Enter a valid 6-digit verification code');
            return;
        }

        setLoading(true);
        try {
            await verifySignupOtp(otpSentTo || email.trim().toLowerCase(), safeOtp);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'OTP verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setError('');
        setInfo('');
        setLoading(true);
        try {
            await requestSignupOtp(name, email, password);
            setInfo('A new verification code has been sent.');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to resend verification code');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-shell p-4">
                <div className="card">
                    <div className="card-body">
                        <div className="auth-back-row">
                            <BackLink to="/" label="Go Back" />
                        </div>

                        <div className="auth-header">
                            <h1 className="auth-title">{otpStep ? 'Verify Email' : 'Create Account'}</h1>
                        </div>

                        {error && <div className="alert alert-danger">{error}</div>}
                        {info && <div className="alert alert-success">{info}</div>}

                        {!otpStep ? (
                            <form onSubmit={handleRequestOtp}>
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Enter your full name"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Password</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter a password"
                                        required
                                    />
                                    <small style={{ color: '#666' }}>
                                        Use 10+ characters with uppercase, lowercase, number, and symbol.
                                    </small>
                                </div>

                                <div className="form-group">
                                    <label>Confirm Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm your password"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary btn-block"
                                    disabled={loading}
                                >
                                    {loading ? 'Sending code...' : 'Send Verification Code'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyOtp}>
                                <p style={{ color: '#555', marginBottom: '14px', fontSize: '0.95rem' }}>
                                    Enter the 6-digit code sent to <strong>{otpSentTo || email}</strong>
                                </p>

                                <div className="form-group">
                                    <label>Verification Code</label>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                                        placeholder="Enter 6-digit OTP"
                                        inputMode="numeric"
                                        pattern="[0-9]{6}"
                                        maxLength={6}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary btn-block"
                                    disabled={loading}
                                >
                                    {loading ? 'Verifying...' : 'Verify & Create Account'}
                                </button>

                                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                    <button
                                        type="button"
                                        className="btn btn-secondary btn-block"
                                        onClick={handleResendOtp}
                                        disabled={loading}
                                    >
                                        Resend Code
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-warning btn-block"
                                        onClick={() => {
                                            setOtpStep(false);
                                            setOtp('');
                                            setError('');
                                            setInfo('');
                                        }}
                                        disabled={loading}
                                    >
                                        Edit Details
                                    </button>
                                </div>
                            </form>
                        )}

                        <p className="auth-switch-text">
                            Already have an account?{' '}
                            <Link to="/login" style={{ color: '#003594', textDecoration: 'none' }}>
                                Login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
