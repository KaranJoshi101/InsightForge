import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Initialize from localStorage
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                if (typeof storedToken === 'string' && parsedUser && typeof parsedUser === 'object') {
                    setToken(storedToken);
                    setUser(parsedUser);
                } else {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            } catch (err) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    const validateSession = useCallback(async () => {
        const storedToken = localStorage.getItem('token');
        if (!storedToken) {
            return;
        }

        try {
            const response = await authService.getCurrentUser();
            const currentUser = response.data?.user;

            if (!currentUser || currentUser.is_banned) {
                authService.logout();
                setToken(null);
                setUser(null);
                setError('Your account has been banned. Please contact an administrator.');
                window.location.href = '/';
                return;
            }

            localStorage.setItem('user', JSON.stringify(currentUser));
            setUser(currentUser);
        } catch (err) {
            const status = err.response?.status;
            const message = String(err.response?.data?.error || err.response?.data?.message || '').toLowerCase();
            const code = String(err.response?.data?.code || '');

            if (status === 401) {
                authService.logout();
                setToken(null);
                setUser(null);
                return;
            }

            if (status === 403 && (code === 'ACCOUNT_BANNED' || message.includes('banned'))) {
                authService.logout();
                setToken(null);
                setUser(null);
                setError('Your account has been banned. Please contact an administrator.');
                window.location.href = '/';
            }
        }
    }, []);

    // Revalidate session on navigation so existing banned users are ejected quickly.
    useEffect(() => {
        if (!loading && token) {
            validateSession();
        }
    }, [loading, token, location.pathname, validateSession]);

    const register = useCallback(async (name, email, password) => {
        try {
            setError(null);
            const response = await authService.register(name, email, password);
            const { token: newToken, user: newUser } = response.data;

            localStorage.setItem('token', newToken);
            localStorage.setItem('user', JSON.stringify(newUser));

            setToken(newToken);
            setUser(newUser);
            return newUser;
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Registration failed';
            setError(errorMsg);
            throw err;
        }
    }, []);

    const requestSignupOtp = useCallback(async (name, email, password) => {
        try {
            setError(null);
            const response = await authService.requestSignupOtp(name, email, password);
            return response.data;
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Failed to send verification code';
            setError(errorMsg);
            throw err;
        }
    }, []);

    const verifySignupOtp = useCallback(async (email, otp) => {
        try {
            setError(null);
            const response = await authService.verifySignupOtp(email, otp);
            const { token: newToken, user: newUser } = response.data;

            localStorage.setItem('token', newToken);
            localStorage.setItem('user', JSON.stringify(newUser));

            setToken(newToken);
            setUser(newUser);
            return newUser;
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'OTP verification failed';
            setError(errorMsg);
            throw err;
        }
    }, []);

    const login = useCallback(async (email, password) => {
        try {
            setError(null);
            const response = await authService.login(email, password);
            const { token: newToken, user: newUser } = response.data;

            localStorage.setItem('token', newToken);
            localStorage.setItem('user', JSON.stringify(newUser));

            setToken(newToken);
            setUser(newUser);
            return newUser;
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Login failed';
            setError(errorMsg);
            throw err;
        }
    }, []);

    const logout = useCallback(() => {
        authService.logout();
        setToken(null);
        setUser(null);
        setError(null);
    }, []);

    const updateUser = useCallback((updatedUser) => {
        const newUser = { ...user, ...updatedUser };
        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);
    }, [user]);

    const isAdmin = typeof user?.role === 'string' && user.role.trim().toLowerCase() === 'admin';
    const isAuthenticated = !!token;

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                error,
                register,
                requestSignupOtp,
                verifySignupOtp,
                login,
                logout,
                updateUser,
                isAdmin,
                isAuthenticated,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = React.useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
