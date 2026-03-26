import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaChartBar, FaNewspaper, FaCog } from 'react-icons/fa';

const DashboardPage = () => {
    const { user, isAdmin } = useAuth();

    return (
        <div className="container mt-4">
            <h1 style={{ color: '#003594' }}>Welcome, {user?.name}!</h1>
            <p style={{ color: '#555', marginBottom: '32px', fontSize: '1.1rem' }}>
                Here's what you can do:
            </p>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '20px',
                }}
            >
                {/* <Link
                    to="/surveys"
                    style={{ textDecoration: 'none', color: 'inherit' }}
                >
                    <div className="card" style={{ cursor: 'pointer', height: '100%', transition: 'transform 0.2s, box-shadow 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,53,148,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
                    >
                        <div className="card-body">
                            <div style={{ margin: '0 0 12px 0', color: '#003594' }}>
                                <FaClipboardList size={38} aria-hidden="true" />
                            </div>
                            <h3 style={{ color: '#003594' }}>Take Surveys</h3>
                            <p style={{ color: '#555' }}>
                                Participate in surveys and share your feedback
                            </p>
                        </div>
                    </div>
                </Link>
                */}

                <Link
                    to="/responses"
                    style={{ textDecoration: 'none', color: 'inherit' }}
                >
                    <div className="card" style={{ cursor: 'pointer', height: '100%', transition: 'box-shadow 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,53,148,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
                    >
                        <div className="card-body">
                            <div style={{ margin: '0 0 12px 0', color: '#003594' }}>
                                <FaChartBar size={38} aria-hidden="true" />
                            </div>
                            <h3 style={{ color: '#003594' }}>My Responses</h3>
                            <p style={{ color: '#555' }}>
                                View surveys you've already responded to
                            </p>
                        </div>
                    </div>
                </Link>

                <Link
                    to="/articles"
                    style={{ textDecoration: 'none', color: 'inherit' }}
                >
                    <div className="card" style={{ cursor: 'pointer', height: '100%', transition: 'box-shadow 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,53,148,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
                    >
                        <div className="card-body">
                            <div style={{ margin: '0 0 12px 0', color: '#003594' }}>
                                <FaNewspaper size={38} aria-hidden="true" />
                            </div>
                            <h3 style={{ color: '#003594' }}>Articles</h3>
                            <p style={{ color: '#555' }}>
                                Read helpful articles and guides
                            </p>
                        </div>
                    </div>
                </Link>

                {isAdmin && (
                    <Link
                        to="/admin"
                        style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                        <div className="card" style={{ cursor: 'pointer', height: '100%', background: 'linear-gradient(135deg, rgba(0,53,148,0.05), rgba(255,184,28,0.08))', transition: 'box-shadow 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,53,148,0.1)'}
                            onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
                        >
                            <div className="card-body">
                                <div style={{ margin: '0 0 12px 0', color: '#003594' }}>
                                    <FaCog size={38} aria-hidden="true" />
                                </div>
                                <h3 style={{ color: '#003594' }}>Admin Panel</h3>
                                <p style={{ color: '#555' }}>
                                    Manage surveys, articles and analytics
                                </p>
                            </div>
                        </div>
                    </Link>
                )}
            </div>

            <div className="card mt-4">
                <div className="card-body">
                    <h2 style={{ color: '#003594' }}>Your Profile</h2>
                    <table style={{ width: '100%' }}>
                        <tbody>
                            <tr>
                                <td style={{ padding: '8px', borderBottom: '1px solid #E8E9EE' }}>
                                    <strong style={{ color: '#003594' }}>Name:</strong>
                                </td>
                                <td style={{ padding: '8px', borderBottom: '1px solid #E8E9EE' }}>
                                    {user?.name}
                                </td>
                            </tr>
                            <tr>
                                <td style={{ padding: '8px', borderBottom: '1px solid #E8E9EE' }}>
                                    <strong style={{ color: '#003594' }}>Email:</strong>
                                </td>
                                <td style={{ padding: '8px', borderBottom: '1px solid #E8E9EE' }}>
                                    {user?.email}
                                </td>
                            </tr>
                            <tr>
                                <td style={{ padding: '8px' }}>
                                    <strong style={{ color: '#003594' }}>Role:</strong>
                                </td>
                                <td style={{ padding: '8px' }}>
                                    <span
                                        style={{
                                            backgroundColor: isAdmin ? '#FFB81C' : '#E8E9EE',
                                            color: isAdmin ? '#003594' : '#555',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            textTransform: 'capitalize',
                                        }}
                                    >
                                        {user?.role}
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
