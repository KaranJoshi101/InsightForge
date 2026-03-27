import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaClipboardList, FaUserCircle, FaUser, FaSignOutAlt } from 'react-icons/fa';

const NO_NAV_ROUTES = ['/login', '/register'];
const PUBLIC_ONLY_NAV_ROUTES = ['/', '/surveys', '/articles', '/training'];

const Navbar = () => {
    const { user, logout, isAdmin, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMenu]);

    if (NO_NAV_ROUTES.includes(location.pathname)) return null;
    if (!isAuthenticated && PUBLIC_ONLY_NAV_ROUTES.includes(location.pathname)) return null;

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // Public (unauthenticated) navbar
    if (!isAuthenticated) {
        return (
            <nav
                style={{
                    backgroundColor: '#003594',
                    color: 'white',
                    padding: '0 20px',
                    height: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
            >
                <Link
                    to="/"
                    style={{
                        color: 'white',
                        textDecoration: 'none',
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        fontFamily: "'Merriweather', serif",
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                    }}
                >
                    <FaClipboardList size={20} aria-hidden="true" />
                    <span>Survey Pro</span>
                </Link>
                <div className="flex align-center gap-3">
                    <Link to="/articles" style={{ color: 'white', textDecoration: 'none', fontSize: '0.95rem' }}>Articles</Link>
                </div>
                <div className="flex align-center gap-3">
                    <Link
                        to="/login"
                        style={{
                            color: 'white',
                            textDecoration: 'none',
                            fontSize: '0.95rem',
                            padding: '7px 16px',
                            border: '1px solid rgba(255,255,255,0.5)',
                            borderRadius: '4px',
                        }}
                    >
                        Login
                    </Link>
                    <Link
                        to="/register"
                        style={{
                            color: '#003594',
                            backgroundColor: '#FFB81C',
                            textDecoration: 'none',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            padding: '7px 16px',
                            borderRadius: '4px',
                        }}
                    >
                        Register
                    </Link>
                </div>
            </nav>
        );
    }

    return (
        <nav
            style={{
                backgroundColor: '#003594',
                color: 'white',
                padding: '0 20px',
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
        >
            <div className="flex align-center gap-3">
                <Link
                    to="/dashboard"
                    style={{
                        color: 'white',
                        textDecoration: 'none',
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        fontFamily: "'Merriweather', serif",
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                    }}
                >
                    <FaClipboardList size={20} aria-hidden="true" />
                    <span>Survey Pro</span>
                </Link>
            </div>

            <div className="flex align-center gap-3">
                <Link
                    to="/articles"
                    style={{ color: 'white', textDecoration: 'none', fontSize: '0.95rem' }}
                >
                    Articles
                </Link>
                <Link
                    to="/training"
                    style={{ color: 'white', textDecoration: 'none', fontSize: '0.95rem' }}
                >
                    Training
                </Link>
                <Link
                    to="/media"
                    style={{ color: 'white', textDecoration: 'none', fontSize: '0.95rem' }}
                >
                    Media
                </Link>
                {isAdmin && (
                    <Link
                        to="/admin"
                        style={{ color: 'white', textDecoration: 'none', fontSize: '0.95rem' }}
                    >
                        Admin
                    </Link>
                )}
            </div>

            <div ref={menuRef} style={{ position: 'relative' }}>
                <button
                    onClick={() => setShowMenu(!showMenu)}
                    style={{
                        background: 'rgba(255,184,28,0.2)',
                        color: 'white',
                        border: 'none',
                        padding: '8px 15px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                    }}
                >
                    <FaUserCircle size={16} aria-hidden="true" /> {user?.name}
                </button>

                {showMenu && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '45px',
                            right: 0,
                            backgroundColor: 'white',
                            color: '#333',
                            borderRadius: '4px',
                            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                            minWidth: '200px',
                            zIndex: 1000,
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                padding: '12px 16px',
                                borderBottom: '1px solid #eee',
                                fontSize: '0.9rem',
                            }}
                        >
                            <p style={{ margin: 0 }}>
                                <strong>{user?.name}</strong>
                            </p>
                            <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '0.85rem' }}>
                                {user?.email}
                            </p>
                            <p
                                style={{
                                    margin: '4px 0 0 0',
                                    color: '#003594',
                                    fontSize: '0.85rem',
                                    textTransform: 'uppercase',
                                    fontWeight: 'bold',
                                }}
                            >
                                {user?.role}
                            </p>
                        </div>
                        <Link
                            to="/profile"
                            onClick={() => setShowMenu(false)}
                            style={{
                                display: 'block',
                                padding: '12px 16px',
                                borderBottom: '1px solid #eee',
                                textDecoration: 'none',
                                color: '#003594',
                                fontSize: '0.95rem',
                                fontWeight: '500',
                            }}
                        >
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                <FaUser size={14} aria-hidden="true" />
                                My Profile
                            </span>
                        </Link>
                        <button
                            onClick={handleLogout}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                textAlign: 'left',
                                fontSize: '0.95rem',
                                color: '#dc3545',
                                fontWeight: '500',
                            }}
                        >
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                <FaSignOutAlt size={14} aria-hidden="true" />
                                Logout
                            </span>
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
