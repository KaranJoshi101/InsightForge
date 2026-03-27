import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Chart as ChartJS,
    CategoryScale,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import userService from '../services/userService';
import LoadingSpinner from '../components/LoadingSpinner';

ChartJS.register(
    CategoryScale,
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
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
            legend: { position: 'bottom' },
            title: { display: true, text: 'Survey Status Distribution' },
        },
    };

    const articleStatusChartData = dashboardStats ? {
        labels: dashboardStats.article_status_distribution.map((a) =>
            a.status.charAt(0).toUpperCase() + a.status.slice(1)
        ),
        datasets: [{
            data: dashboardStats.article_status_distribution.map((a) => a.count),
            backgroundColor: ['#27ae60', '#FFB81C'],
            borderWidth: 2,
        }],
    } : null;

    const articleStatusChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
            legend: { position: 'bottom' },
            title: { display: true, text: 'Article Status Distribution' },
        },
    };

    const userStatusChartData = dashboardStats ? {
        labels: ['Active', 'Banned'],
        datasets: [{
            data: [
                Math.max(0, dashboardStats.summary.total_users - dashboardStats.summary.banned_users),
                dashboardStats.summary.banned_users,
            ],
            backgroundColor: ['#27ae60', '#c0392b'],
            borderWidth: 2,
        }],
    } : null;

    const userStatusChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
            legend: { position: 'bottom' },
            title: { display: true, text: 'User Status Distribution' },
        },
    };

    const mediaStatusChartData = dashboardStats ? {
        labels: dashboardStats.media_status_distribution.map((m) =>
            m.status.charAt(0).toUpperCase() + m.status.slice(1)
        ),
        datasets: [{
            data: dashboardStats.media_status_distribution.map((m) => m.count),
            backgroundColor: ['#3B82F6', '#FFB81C'],
            borderWidth: 2,
        }],
    } : null;

    const mediaStatusChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
            legend: { position: 'bottom' },
            title: { display: true, text: 'Media Status Distribution' },
        },
    };

    const trainingVideoStatusChartData = dashboardStats ? {
        labels: dashboardStats.training_video_status_distribution.map((t) =>
            t.status.charAt(0).toUpperCase() + t.status.slice(1)
        ),
        datasets: [{
            data: dashboardStats.training_video_status_distribution.map((t) => t.count),
            backgroundColor: ['#27ae60', '#c0392b'],
            borderWidth: 2,
        }],
    } : null;

    const trainingVideoStatusChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
            legend: { position: 'bottom' },
            title: { display: true, text: 'Training Video Status Distribution' },
        },
    };

    const surveyCounts = dashboardStats
        ? dashboardStats.survey_status_distribution.reduce((acc, item) => {
            acc.total += item.count;
            if (item.status === 'published') acc.published += item.count;
            if (item.status === 'draft') acc.draft += item.count;
            return acc;
        }, { total: 0, published: 0, draft: 0 })
        : { total: 0, published: 0, draft: 0 };

    const articleCounts = dashboardStats
        ? dashboardStats.article_status_distribution.reduce((acc, item) => {
            acc.total += item.count;
            if (item.status === 'published') acc.published += item.count;
            if (item.status === 'draft') acc.draft += item.count;
            return acc;
        }, { total: 0, published: 0, draft: 0 })
        : { total: 0, published: 0, draft: 0 };

    const mediaCounts = dashboardStats
        ? dashboardStats.media_status_distribution.reduce((acc, item) => {
            acc.total += item.count;
            if (item.status === 'linked') acc.linked += item.count;
            if (item.status === 'standalone') acc.standalone += item.count;
            return acc;
        }, { total: 0, linked: 0, standalone: 0 })
        : { total: 0, linked: 0, standalone: 0 };

    const trainingVideoCounts = dashboardStats
        ? dashboardStats.training_video_status_distribution.reduce((acc, item) => {
            acc.total += item.count;
            if (item.status === 'active') acc.active += item.count;
            if (item.status === 'inactive') acc.inactive += item.count;
            return acc;
        }, { total: 0, active: 0, inactive: 0 })
        : { total: 0, active: 0, inactive: 0 };

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

            {/* Charts */}
            {dashboardStats && (
                <div className="admin-chart-grid">
                    <div className="card">
                        <div className="card-body">
                            <h2>Survey Status</h2>
                            <div className="admin-chip-row">
                                <span className="admin-chip total">Total: {surveyCounts.total}</span>
                                <span className="admin-chip published">Published: {surveyCounts.published}</span>
                                <span className="admin-chip draft">Draft: {surveyCounts.draft}</span>
                            </div>
                            {doughnutChartData && doughnutChartData.labels.length > 0 ? (
                                <div style={{ height: '340px' }}>
                                    <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
                                </div>
                            ) : (
                                <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
                                    No surveys created yet
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-body">
                            <h2>User Status</h2>
                            <div className="admin-chip-row">
                                <span className="admin-chip total">Total: {dashboardStats.summary.total_users}</span>
                                <span className="admin-chip published">Active: {Math.max(0, dashboardStats.summary.total_users - dashboardStats.summary.banned_users)}</span>
                                <span className="admin-chip draft">Banned: {dashboardStats.summary.banned_users}</span>
                            </div>
                            {userStatusChartData ? (
                                <div style={{ height: '340px' }}>
                                    <Doughnut data={userStatusChartData} options={userStatusChartOptions} />
                                </div>
                            ) : (
                                <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
                                    No user data available yet
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-body">
                            <h2>Article Status</h2>
                            <div className="admin-chip-row">
                                <span className="admin-chip total">Total: {articleCounts.total}</span>
                                <span className="admin-chip published">Published: {articleCounts.published}</span>
                                <span className="admin-chip draft">Draft: {articleCounts.draft}</span>
                            </div>
                            {articleStatusChartData && articleStatusChartData.labels.length > 0 ? (
                                <div style={{ height: '340px' }}>
                                    <Doughnut data={articleStatusChartData} options={articleStatusChartOptions} />
                                </div>
                            ) : (
                                <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
                                    No articles created yet
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-body">
                            <h2>Media Status</h2>
                            <div className="admin-chip-row">
                                <span className="admin-chip total">Total: {mediaCounts.total}</span>
                                <span className="admin-chip published">Linked: {mediaCounts.linked}</span>
                                <span className="admin-chip draft">Standalone: {mediaCounts.standalone}</span>
                            </div>
                            {mediaStatusChartData && mediaStatusChartData.labels.length > 0 ? (
                                <div style={{ height: '340px' }}>
                                    <Doughnut data={mediaStatusChartData} options={mediaStatusChartOptions} />
                                </div>
                            ) : (
                                <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
                                    No media posts created yet
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-body">
                            <h2>Training Video Status</h2>
                            <div className="admin-chip-row">
                                <span className="admin-chip total">Total: {trainingVideoCounts.total}</span>
                                <span className="admin-chip published">Active: {trainingVideoCounts.active}</span>
                                <span className="admin-chip draft">Inactive: {trainingVideoCounts.inactive}</span>
                            </div>
                            {trainingVideoStatusChartData && trainingVideoStatusChartData.labels.length > 0 ? (
                                <div style={{ height: '340px' }}>
                                    <Doughnut data={trainingVideoStatusChartData} options={trainingVideoStatusChartOptions} />
                                </div>
                            ) : (
                                <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
                                    No training videos created yet
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
                        <Link to="/admin/media" className="admin-management-link">
                            <strong>Manage Media</strong>
                            <span>Create and curate media feed cards and linked content.</span>
                        </Link>
                        <Link to="/admin/training" className="admin-management-link">
                            <strong>Manage Training Videos</strong>
                            <span>Add YouTube lessons shown in the public training section.</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;
