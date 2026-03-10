import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import userService from '../services/userService';
import LoadingSpinner from '../components/LoadingSpinner';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const AdminDashboardPage = () => {
    const [dashboardStats, setDashboardStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setStatsLoading(true);
                const response = await userService.getDashboardStats();
                setDashboardStats(response.data);
            } catch (err) {
                console.error('Failed to load dashboard stats:', err);
            } finally {
                setStatsLoading(false);
            }
        };
        fetchStats();
    }, []);


    // Chart data
    const barChartData = dashboardStats ? {
        labels: dashboardStats.responses_per_survey.map((s) =>
            s.title.length > 20 ? s.title.substring(0, 20) + '...' : s.title
        ),
        datasets: [{
            label: 'Number of Responses',
            data: dashboardStats.responses_per_survey.map((s) => s.response_count),
            backgroundColor: 'rgba(0, 53, 148, 0.6)',
            borderColor: 'rgba(0, 53, 148, 1)',
            borderWidth: 1,
        }],
    } : null;

    const barChartOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Responses Per Survey' },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { stepSize: 1 },
            },
        },
    };

    const doughnutChartData = dashboardStats ? {
        labels: dashboardStats.survey_status_distribution.map((s) =>
            s.status.charAt(0).toUpperCase() + s.status.slice(1)
        ),
        datasets: [{
            data: dashboardStats.survey_status_distribution.map((s) => s.count),
            backgroundColor: ['#FFB81C', '#27ae60', '#6c757d'],
            borderWidth: 2,
        }],
    } : null;

    const doughnutChartOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'bottom' },
            title: { display: true, text: 'Survey Status Distribution' },
        },
    };

    if (statsLoading) {
        return <LoadingSpinner fullScreen={false} />;
    }

    return (
        <div className="container mt-4">
            <div className="mb-4">
                <h1>Admin Dashboard</h1>
                <p style={{ color: '#666', marginTop: '6px' }}>
                    A quick overview of platform health and access to management pages.
                </p>
            </div>

            {/* Summary Stats */}
            {dashboardStats && (
                <div className="admin-stats-grid">
                    <div className="admin-stat-card users">
                        <p>Total Users</p>
                        <h2 style={{ color: '#003594' }}>{dashboardStats.summary.total_users}</h2>
                    </div>
                    <div className="admin-stat-card surveys">
                        <p>Total Surveys</p>
                        <h2 style={{ color: '#27ae60' }}>{dashboardStats.summary.total_surveys}</h2>
                    </div>
                    <div className="admin-stat-card responses">
                        <p>Total Responses</p>
                        <h2 style={{ color: '#b8860b' }}>{dashboardStats.summary.total_responses}</h2>
                    </div>
                    <div className="admin-stat-card banned">
                        <p>Banned Users</p>
                        <h2 style={{ color: '#c0392b' }}>{dashboardStats.summary.banned_users}</h2>
                    </div>
                </div>
            )}

            {/* Charts */}
            {dashboardStats && (
                <div className="admin-chart-grid">
                    <div className="card">
                        <div className="card-body">
                            <h2>Responses Per Survey</h2>
                            {barChartData && barChartData.labels.length > 0 ? (
                                <Bar data={barChartData} options={barChartOptions} />
                            ) : (
                                <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
                                    No survey data available yet
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-body">
                            <h2>Survey Status</h2>
                            {doughnutChartData && doughnutChartData.labels.length > 0 ? (
                                <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
                            ) : (
                                <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
                                    No surveys created yet
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="card">
                <div className="card-body">
                    <h2>Management</h2>
                    <div className="admin-management-grid">
                        <Link to="/admin/surveys" className="admin-management-link">
                            <strong>Manage Surveys</strong>
                            <span>Create, publish, analyze, and export.</span>
                        </Link>
                        <Link to="/admin/users" className="admin-management-link">
                            <strong>Manage Users</strong>
                            <span>Search users, review details, ban/unban.</span>
                        </Link>
                        <Link to="/admin/articles" className="admin-management-link">
                            <strong>Manage Articles</strong>
                            <span>Write, edit, publish, and retire content.</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;
