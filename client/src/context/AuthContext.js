import React, { createContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
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

    const isAdmin = user?.role === 'admin';
    const isAuthenticated = !!token;

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                error,
                register,
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
