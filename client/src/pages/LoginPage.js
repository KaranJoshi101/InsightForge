import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BackLink from '../components/BackLink';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#E8E9EE'
            }}
        >
            <div style={{ width: '100%', maxWidth: '400px' }} className="p-4">
                <div className="card">
                    <div className="card-body">

                        {/* Header */}
                        
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-xl font-semibold flex items-center gap-2" style={{ color: '#003594', marginBottom: 0 }}>
                                Login
                            </h1>
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <BackLink to="/" label="Go Back" />
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

                        <p
                            style={{
                                textAlign: 'center',
                                marginTop: '16px',
                                color: '#666'
                            }}
                        >
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

                        <hr
                            style={{
                                margin: '16px 0',
                                borderColor: '#eee'
                            }}
                        />

                        <div
                            style={{
                                backgroundColor: '#e8f0fe',
                                padding: '12px',
                                borderRadius: '8px',
                                fontSize: '0.9rem'
                            }}
                        >
                            <p style={{ margin: '0 0 8px 0' }}>
                                <strong style={{ color: '#003594' }}>Demo Credentials:</strong>
                            </p>
                            <p style={{ margin: '4px 0' }}>
                                <strong style={{ color: '#003594' }}>Admin:</strong> manojkumar@jnu.ac.in
                            </p>
                            <p style={{ margin: '4px 0' }}>
                                Password: manoj123
                            </p>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;