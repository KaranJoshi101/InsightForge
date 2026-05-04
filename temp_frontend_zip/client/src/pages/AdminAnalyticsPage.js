import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import BackLink from '../components/BackLink';
import analyticsService from '../services/analyticsService';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const compactNumber = (value) => new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
}).format(Number(value) || 0);

const numberOrZero = (value) => Number(value) || 0;

const cardStyle = {
    borderLeftColor: '#003594',
};

const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { position: 'bottom' },
    },
    scales: {
        y: {
            beginAtZero: true,
            ticks: { precision: 0 },
        },
        x: {
            ticks: { maxTicksLimit: 8 },
        },
    },
};

const moduleColors = {
    survey: '#003594',
    article: '#2f7ed8',
    media: '#ffb81c',
    training: '#27ae60',
    consulting: '#6a5acd',
};

const LoadingSkeleton = () => (
    <div className="container mt-4">
        <BackLink to="/admin" label="Back to Admin" />
        <div className="admin-stats-grid" style={{ marginBottom: '20px' }}>
            {Array.from({ length: 4 }).map((_, index) => (
                <div key={`summary-skeleton-${index}`} className="card" style={{ minHeight: '110px' }}>
                    <div className="card-body">
                        <div style={{ height: '12px', width: '55%', background: '#eef2f7', borderRadius: '6px', marginBottom: '14px' }} />
                        <div style={{ height: '28px', width: '35%', background: '#e1e7f0', borderRadius: '8px' }} />
                    </div>
                </div>
            ))}
        </div>

        <div className="admin-chart-grid" style={{ marginBottom: '20px' }}>
            {Array.from({ length: 2 }).map((_, index) => (
                <div key={`chart-skeleton-${index}`} className="card">
                    <div className="card-body">
                        <div style={{ height: '14px', width: '45%', background: '#eef2f7', borderRadius: '6px', marginBottom: '18px' }} />
                        <div style={{ height: '280px', width: '100%', background: '#f3f6fb', borderRadius: '8px' }} />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const TopTable = ({ title, columns, rows, emptyText }) => (
    <div className="card" style={{ marginBottom: '16px' }}>
        <div className="card-body">
            <h2 style={{ marginTop: 0 }}>{title}</h2>
            {!rows.length ? (
                <p style={{ color: '#666', margin: 0 }}>{emptyText}</p>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                {columns.map((column) => (
                                    <th key={`${title}-${column.key}`}>{column.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={`${title}-${row.id}`}>
                                    {columns.map((column) => (
                                        <td key={`${title}-${row.id}-${column.key}`}>
                                            {column.render ? column.render(row[column.key], row) : row[column.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    </div>
);

const AdminAnalyticsPage = () => {
    const [overview, setOverview] = useState(null);
    const [trends, setTrends] = useState([]);
    const [topContent, setTopContent] = useState(null);
    const [moduleBreakdown, setModuleBreakdown] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const loadDashboard = useCallback(async (silent = false) => {
        try {
            if (!silent) {
                setLoading(true);
            } else {
                setRefreshing(true);
            }
            const [overviewRes, trendsRes, topContentRes, breakdownRes] = await Promise.all([
                analyticsService.getOverview(),
                analyticsService.getTrends(),
                analyticsService.getTopContent(),
                analyticsService.getModuleBreakdown(),
            ]);

            setOverview(overviewRes.data || {});
            setTrends(trendsRes.data?.daily || []);
            setTopContent(topContentRes.data || {});
            setModuleBreakdown(breakdownRes.data?.modules || []);
            setError('');
        } catch (_err) {
            setError('Failed to load unified analytics dashboard.');
        } finally {
            if (!silent) {
                setLoading(false);
            }
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            loadDashboard(true);
        }, 30000);

        return () => clearInterval(intervalId);
    }, [loadDashboard]);

    const trendLabels = useMemo(() => trends.map((row) => row.day), [trends]);

    const pageViewTrendData = useMemo(() => ({
        labels: trendLabels,
        datasets: [{
            label: 'Page Views',
            data: trends.map((row) => numberOrZero(row.page_views)),
            borderColor: '#003594',
            backgroundColor: 'rgba(0, 53, 148, 0.18)',
            tension: 0.25,
            fill: true,
            borderWidth: 2,
            pointRadius: 2,
        }],
    }), [trendLabels, trends]);

    const engagementTrendData = useMemo(() => ({
        labels: trendLabels,
        datasets: [
            {
                label: 'Article Views',
                data: trends.map((row) => numberOrZero(row.article_views)),
                borderColor: '#2f7ed8',
                backgroundColor: 'rgba(47, 126, 216, 0.12)',
                tension: 0.25,
                fill: false,
                borderWidth: 2,
                pointRadius: 2,
            },
            {
                label: 'Media Views',
                data: trends.map((row) => numberOrZero(row.media_views)),
                borderColor: '#ffb81c',
                backgroundColor: 'rgba(255, 184, 28, 0.14)',
                tension: 0.25,
                fill: false,
                borderWidth: 2,
                pointRadius: 2,
            },
            {
                label: 'Training Views',
                data: trends.map((row) => numberOrZero(row.training_views)),
                borderColor: '#27ae60',
                backgroundColor: 'rgba(39, 174, 96, 0.14)',
                tension: 0.25,
                fill: false,
                borderWidth: 2,
                pointRadius: 2,
            },
            {
                label: 'Consulting Views',
                data: trends.map((row) => numberOrZero(row.consulting_views)),
                borderColor: '#6a5acd',
                backgroundColor: 'rgba(106, 90, 205, 0.14)',
                tension: 0.25,
                fill: false,
                borderWidth: 2,
                pointRadius: 2,
            },
        ],
    }), [trendLabels, trends]);

    const conversionTrendData = useMemo(() => ({
        labels: trendLabels,
        datasets: [
            {
                label: 'Survey Submissions',
                data: trends.map((row) => numberOrZero(row.survey_submissions)),
                borderColor: '#27ae60',
                backgroundColor: 'rgba(39, 174, 96, 0.18)',
                tension: 0.25,
                fill: true,
                borderWidth: 2,
                pointRadius: 2,
            },
            {
                label: 'Consulting Requests',
                data: trends.map((row) => numberOrZero(row.consulting_requests)),
                borderColor: '#ffb81c',
                backgroundColor: 'rgba(255, 184, 28, 0.2)',
                tension: 0.25,
                fill: true,
                borderWidth: 2,
                pointRadius: 2,
            },
        ],
    }), [trendLabels, trends]);

    const moduleChartData = useMemo(() => ({
        labels: moduleBreakdown.map((item) => item.entity_type),
        datasets: [{
            data: moduleBreakdown.map((item) => numberOrZero(item.events)),
            backgroundColor: moduleBreakdown.map((item) => moduleColors[item.entity_type] || '#9aa5b1'),
            borderWidth: 2,
        }],
    }), [moduleBreakdown]);

    const moduleChartOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom' },
        },
    }), []);

    if (loading) {
        return <LoadingSkeleton />;
    }

    return (
        <div className="container mt-4">
            <BackLink to="/admin" label="Back to Admin" />

            <h1 style={{ color: '#003594', marginBottom: '8px' }}>Unified Analytics Dashboard</h1>
            <p style={{ color: '#555', marginBottom: '20px' }}>
                Consolidated engagement analytics across surveys, content, training, and consulting.
            </p>

            <div style={{ marginBottom: '20px' }}>
                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => loadDashboard(true)}
                    disabled={refreshing}
                >
                    {refreshing ? 'Refreshing...' : 'Refresh Analytics'}
                </button>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <div className="admin-stats-grid" style={{ marginBottom: '20px' }}>
                <div className="card admin-stat-card users" style={cardStyle}>
                    <p>Total Users</p>
                    <h2>{compactNumber(overview?.total_users)}</h2>
                </div>
                <div className="card admin-stat-card surveys" style={cardStyle}>
                    <p>Total Page Views</p>
                    <h2>{compactNumber(overview?.total_page_views)}</h2>
                </div>
                <div className="card admin-stat-card responses" style={cardStyle}>
                    <p>Total Sessions</p>
                    <h2>{compactNumber(overview?.total_sessions)}</h2>
                </div>
                <div className="card admin-stat-card users" style={cardStyle}>
                    <p>Total Events</p>
                    <h2>{compactNumber(overview?.total_events)}</h2>
                </div>
            </div>

            <div className="admin-stats-grid" style={{ marginBottom: '20px' }}>
                <div className="card admin-stat-card surveys" style={{ borderLeftColor: '#27ae60' }}>
                    <p>Survey Submissions</p>
                    <h2>{compactNumber(overview?.total_survey_submissions)}</h2>
                </div>
                <div className="card admin-stat-card responses" style={{ borderLeftColor: '#ffb81c' }}>
                    <p>Consulting Requests</p>
                    <h2>{compactNumber(overview?.total_consulting_requests)}</h2>
                </div>
                <div className="card admin-stat-card users" style={{ borderLeftColor: '#2f7ed8' }}>
                    <p>Article Views</p>
                    <h2>{compactNumber(overview?.total_article_views)}</h2>
                </div>
                <div className="card admin-stat-card surveys" style={{ borderLeftColor: '#6a5acd' }}>
                    <p>Training Views</p>
                    <h2>{compactNumber(overview?.total_training_views)}</h2>
                </div>
            </div>

            <div className="admin-stats-grid" style={{ marginBottom: '20px', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                <div className="card admin-stat-card responses" style={{ borderLeftColor: '#ffb81c' }}>
                    <p>Media Views</p>
                    <h2>{compactNumber(overview?.total_media_views)}</h2>
                </div>
                <div className="card admin-stat-card surveys" style={{ borderLeftColor: '#6a5acd' }}>
                    <p>Consulting Views</p>
                    <h2>{compactNumber(overview?.total_consulting_views)}</h2>
                </div>
            </div>

            <div className="admin-chart-grid" style={{ marginBottom: '20px' }}>
                <div className="card" style={{ maxWidth: '100%' }}>
                    <div className="card-body">
                        <h2>Page Views Over Time (30 Days)</h2>
                        <div className="admin-chart-canvas compact">
                            <Line data={pageViewTrendData} options={lineOptions} />
                        </div>
                    </div>
                </div>
                <div className="card" style={{ maxWidth: '100%' }}>
                    <div className="card-body">
                        <h2>Content & Module Views Over Time (30 Days)</h2>
                        <div className="admin-chart-canvas compact">
                            <Line data={engagementTrendData} options={lineOptions} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '20px' }}>
                <div className="card-body">
                    <h2>Conversion Events Over Time (30 Days)</h2>
                    <div className="admin-chart-canvas compact">
                        <Line data={conversionTrendData} options={lineOptions} />
                    </div>
                </div>
            </div>

            <TopTable
                title="Most Viewed Articles"
                rows={topContent?.top_articles || []}
                emptyText="No article view events yet."
                columns={[
                    { key: 'title', label: 'Article' },
                    { key: 'views', label: 'Views', render: (value) => compactNumber(value) },
                ]}
            />

            <TopTable
                title="Most Submitted Surveys"
                rows={topContent?.top_surveys || []}
                emptyText="No survey submission events yet."
                columns={[
                    { key: 'title', label: 'Survey' },
                    { key: 'submissions', label: 'Submissions', render: (value) => compactNumber(value) },
                ]}
            />

            <TopTable
                title="Most Requested Consulting Services"
                rows={topContent?.top_consulting || []}
                emptyText="No consulting engagement events yet."
                columns={[
                    { key: 'title', label: 'Service' },
                    { key: 'views', label: 'Views', render: (value) => compactNumber(value) },
                    { key: 'requests', label: 'Requests', render: (value) => compactNumber(value) },
                ]}
            />

            <div className="admin-chart-grid" style={{ marginBottom: '20px' }}>
                <TopTable
                    title="Top Media Content"
                    rows={topContent?.top_media || []}
                    emptyText="No media view events yet."
                    columns={[
                        { key: 'title', label: 'Media' },
                        { key: 'views', label: 'Views', render: (value) => compactNumber(value) },
                    ]}
                />

                <TopTable
                    title="Top Training Content"
                    rows={topContent?.top_training || []}
                    emptyText="No training view events yet."
                    columns={[
                        { key: 'title', label: 'Training' },
                        { key: 'views', label: 'Views', render: (value) => compactNumber(value) },
                    ]}
                />
            </div>

            <div className="card" style={{ marginBottom: '20px' }}>
                <div className="card-body">
                    <h2>Module Breakdown</h2>
                    {(moduleBreakdown || []).length === 0 ? (
                        <p style={{ margin: 0, color: '#666' }}>No module activity recorded yet.</p>
                    ) : (
                        <div className="admin-chart-grid">
                            <div className="admin-chart-canvas">
                                <Doughnut data={moduleChartData} options={moduleChartOptions} />
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="admin-table" style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th>Module</th>
                                            <th>Events</th>
                                            <th>Usage %</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {moduleBreakdown.map((item) => (
                                            <tr key={`module-${item.entity_type}`}>
                                                <td style={{ textTransform: 'capitalize' }}>{item.entity_type}</td>
                                                <td>{compactNumber(item.events)}</td>
                                                <td>{item.percentage}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminAnalyticsPage;
