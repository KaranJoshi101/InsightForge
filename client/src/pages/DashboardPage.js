import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaChartBar, FaNewspaper, FaCog } from 'react-icons/fa';

const DashboardPage = () => {
    const { user, isAdmin } = useAuth();

    return (
        <div className="container mt-4">
            <header className="page-header">
                <h1 className="page-header-title">Welcome, {user?.name}!</h1>
                <p className="page-header-subtitle">Here is what you can do next.</p>
            </header>

            <div className="dashboard-action-grid">
                <Link to="/responses" className="dashboard-action-link">
                    <div className="card dashboard-action-card">
                        <div className="card-body">
                            <div style={{ margin: '0 0 12px 0', color: '#003594' }}>
                                <FaChartBar size={38} aria-hidden="true" />
                            </div>
                            <h3 style={{ color: '#003594' }}>My Responses</h3>
                            <p style={{ color: '#555' }}>
                                View feedback forms you have already submitted
                            </p>
                        </div>
                    </div>
                </Link>

                <Link to="/articles" className="dashboard-action-link">
                    <div className="card dashboard-action-card">
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
                    <Link to="/admin" className="dashboard-action-link">
                        <div className="card dashboard-action-card admin">
                            <div className="card-body">
                                <div style={{ margin: '0 0 12px 0', color: '#003594' }}>
                                    <FaCog size={38} aria-hidden="true" />
                                </div>
                                <h3 style={{ color: '#003594' }}>Admin Panel</h3>
                                <p style={{ color: '#555' }}>
                                    Manage feedback forms, articles, media, training, and analytics
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
