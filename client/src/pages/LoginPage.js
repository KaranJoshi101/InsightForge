import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BackLink from '../components/BackLink';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const redirectPath = location.state?.from || '/dashboard';
    const redirectState = useMemo(() => {
        if (!location.state?.from) {
            return undefined;
        }

        return Object.entries(location.state).reduce((acc, [key, value]) => {
            if (key !== 'from') {
                acc[key] = value;
            }
            return acc;
        }, {});
    }, [location.state]);

    useEffect(() => {
        if (isAuthenticated) {
            navigate(redirectPath, { replace: true, state: redirectState });
        }
    }, [isAuthenticated, navigate, redirectPath, redirectState]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate(redirectPath, { replace: true, state: redirectState });
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
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
                            <h1 className="auth-title">Login</h1>
                        </div>

                        {error && (
                            <div className="alert alert-danger">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
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
                                    placeholder="Enter your password"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-block"
                                disabled={loading}
                            >
                                {loading ? 'Logging in...' : 'Login'}
                            </button>
                        </form>

                        <p className="auth-switch-text">
                            Don't have an account?{' '}
                            <Link
                                to="/register"
                                style={{
                                    color: '#003594',
                                    textDecoration: 'none'
                                }}
                            >
                                Sign up
                            </Link>
                        </p>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;