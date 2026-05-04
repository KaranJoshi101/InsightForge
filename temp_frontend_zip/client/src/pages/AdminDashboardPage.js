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

    const surveyCategoryStatusDist = dashboardStats?.survey_category_status_distribution || [];
    const articleCategoryStatusDist = dashboardStats?.article_category_status_distribution || [];

    const getBucketCount = (rows, category, status) => {
        const entry = rows.find((row) => row.category === category && row.status === status);
        return entry ? Number(entry.count) : 0;
    };

    const surveyChartSlices = [
        { label: 'Survey', value: getBucketCount(surveyCategoryStatusDist, 'survey', 'published'), color: '#3B82F6' },
        { label: 'Draft', value: getBucketCount(surveyCategoryStatusDist, 'survey', 'draft'), color: '#93C5FD' },
        { label: 'Feedback', value: getBucketCount(surveyCategoryStatusDist, 'feedback', 'published'), color: '#F59E0B' },
    ];

    const articleChartSlices = [
        { label: 'Article', value: getBucketCount(articleCategoryStatusDist, 'article', 'published'), color: '#3B82F6' },
        { label: 'Draft', value: getBucketCount(articleCategoryStatusDist, 'article', 'draft'), color: '#93C5FD' },
        { label: 'Talks', value: getBucketCount(articleCategoryStatusDist, 'talks_summary', 'published'), color: '#F59E0B' },
    ];

    const surveyCategoryChartData = dashboardStats ? {
        labels: surveyChartSlices.map((slice) => slice.label),
        datasets: [{
            data: surveyChartSlices.map((slice) => slice.value),
            backgroundColor: surveyChartSlices.map((slice) => slice.color),
            borderWidth: 2,
        }],
    } : null;

    const surveyCategoryChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
            legend: { position: 'bottom' },
            title: { display: true, text: 'Survey Category Distribution' },
        },
    };

    const articleCategoryChartData = dashboardStats ? {
        labels: articleChartSlices.map((slice) => slice.label),
        datasets: [{
            data: articleChartSlices.map((slice) => slice.value),
            backgroundColor: articleChartSlices.map((slice) => slice.color),
            borderWidth: 2,
        }],
    } : null;

    const articleCategoryChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
            legend: { position: 'bottom' },
            title: { display: true, text: 'Article Category Distribution' },
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

    // Training category chart (by status)
    const trainingCategoryStatusDist = dashboardStats?.training_category_status_distribution || [];
    const getCategoryStatusCount = (status) => {
        const entry = trainingCategoryStatusDist.find((row) => row.status === status);
        return entry ? Number(entry.count) : 0;
    };
    const trainingCategoryChartData = dashboardStats ? {
        labels: ['Public', 'Draft'],
        datasets: [{
            data: [getCategoryStatusCount('public'), getCategoryStatusCount('draft')],
            backgroundColor: ['#3B82F6', '#F59E0B'],
            borderWidth: 2,
        }],
    } : null;
    const trainingCategoryChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
            legend: { position: 'bottom' },
            title: { display: true, text: 'Training Category Status Distribution' },
        },
    };

    const surveyCategoryCounts = dashboardStats
        ? dashboardStats.survey_category_distribution.reduce((acc, item) => {
            acc.total += item.count;
            if (item.category === 'survey') acc.survey += item.count;
            if (item.category === 'feedback') acc.feedback += item.count;
            return acc;
        }, { total: 0, survey: 0, feedback: 0 })
        : { total: 0, survey: 0, feedback: 0 };

    const surveyDraftCounts = dashboardStats
        ? surveyCategoryStatusDist.reduce((acc, item) => {
            if (item.status === 'published') acc.published += item.count;
            if (item.status === 'draft') acc.draft += item.count;
            return acc;
        }, { published: 0, draft: 0 })
        : { published: 0, draft: 0 };

    const articleCategoryCounts = dashboardStats
        ? dashboardStats.article_category_distribution.reduce((acc, item) => {
            acc.total += item.count;
            if (item.category === 'article') acc.article += item.count;
            if (item.category === 'talks_summary') acc.talks_summary += item.count;
            return acc;
        }, { total: 0, article: 0, talks_summary: 0 })
        : { total: 0, article: 0, talks_summary: 0 };

    const articleDraftCounts = dashboardStats
        ? articleCategoryStatusDist.reduce((acc, item) => {
            if (item.status === 'published') acc.published += item.count;
            if (item.status === 'draft') acc.draft += item.count;
            return acc;
        }, { published: 0, draft: 0 })
        : { published: 0, draft: 0 };

    const trainingCategoryCounts = dashboardStats
        ? trainingCategoryStatusDist.reduce((acc, item) => {
            acc.total += item.count;
            if (item.status === 'public') acc.public += item.count;
            if (item.status === 'draft') acc.draft += item.count;
            return acc;
        }, { total: 0, public: 0, draft: 0 })
        : { total: 0, public: 0, draft: 0 };

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
                            <h2>Survey Categories</h2>
                            <div className="admin-chip-row">
                                <span className="admin-chip total">Total: {surveyCategoryCounts.survey + surveyCategoryCounts.feedback}</span>
                                <span className="admin-chip published">Survey: {getBucketCount(surveyCategoryStatusDist, 'survey', 'published')}</span>
                                <span className="admin-chip draft">Feedback: {surveyCategoryCounts.feedback}</span>
                                <span className="admin-chip draft">Draft: {surveyDraftCounts.draft}</span>
                            </div>
                            {surveyCategoryChartData && surveyCategoryChartData.labels.length > 0 ? (
                                <>
                                    <div className="admin-chart-canvas">
                                        <Doughnut data={surveyCategoryChartData} options={surveyCategoryChartOptions} />
                                    </div>
                                    {/* legend note removed */}
                                </>
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
                                <div className="admin-chart-canvas">
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
                            <h2>Article Categories</h2>
                            <div className="admin-chip-row">
                                <span className="admin-chip total">Total: {articleCategoryCounts.article + articleCategoryCounts.talks_summary}</span>
                                <span className="admin-chip published">Article: {getBucketCount(articleCategoryStatusDist, 'article', 'published')}</span>
                                <span className="admin-chip draft">Talks: {articleCategoryCounts.talks_summary}</span>
                                <span className="admin-chip draft">Draft: {articleDraftCounts.draft}</span>
                            </div>
                            {articleCategoryChartData && articleCategoryChartData.labels.length > 0 ? (
                                <>
                                    <div className="admin-chart-canvas">
                                        <Doughnut data={articleCategoryChartData} options={articleCategoryChartOptions} />
                                    </div>
                                    {/* legend note removed */}
                                </>
                            ) : (
                                <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
                                    No articles created yet
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-body">
                            <h2>Training Categories</h2>
                            <div className="admin-chip-row">
                                <span className="admin-chip total">Total: {trainingCategoryCounts.total}</span>
                                <span className="admin-chip published">Public: {trainingCategoryCounts.public}</span>
                                <span className="admin-chip draft">Draft: {trainingCategoryCounts.draft}</span>
                            </div>
                            {trainingCategoryChartData && trainingCategoryChartData.labels.length > 0 ? (
                                <div className="admin-chart-canvas">
                                    <Doughnut data={trainingCategoryChartData} options={trainingCategoryChartOptions} />
                                </div>
                            ) : (
                                <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
                                    No training categories created yet
                                </p>
                            )}
                            {/* Category status toggle removed; now managed in Manage Training page */}
                        </div>
                    </div>
                </div>
            )}

            <div className="card">
                <div className="card-body">
                    <h2>Management</h2>
                    <div className="admin-management-grid">
                        <Link to="/admin/surveys" className="admin-management-link">
                            <strong>Manage Surveys and Feedbacks</strong>
                            <span>Create, publish, analyze, and export.</span>
                        </Link>
                        <Link to="/admin/users" className="admin-management-link">
                            <strong>Manage Users</strong>
                            <span>Search users, review details, ban/unban.</span>
                        </Link>
                        <Link to="/admin/articles" className="admin-management-link">
                            <strong>Manage Articles and Talks</strong>
                            <span>Write, edit, publish, and retire content.</span>
                        </Link>
                        <Link to="/admin/media" className="admin-management-link">
                            <strong>Manage Media</strong>
                            <span>Create and curate media feed cards and linked content.</span>
                        </Link>
                        <Link to="/admin/training" className="admin-management-link">
                            <strong>Manage Training Categories</strong>
                            <span>Add YouTube lessons and Notes shown in the public training section.</span>
                        </Link>
                        <Link to="/admin/consulting" className="admin-management-link">
                            <strong>Manage Consulting</strong>
                            <span>Maintain consulting services and review consultation requests.</span>
                        </Link>
                        {/* Unified analytics temporarily disabled.
                        <Link to="/admin/analytics" className="admin-management-link">
                            <strong>Unified Analytics</strong>
                            <span>View cross-platform activity, trends, and top content in one dashboard.</span>
                        </Link>
                        */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;
