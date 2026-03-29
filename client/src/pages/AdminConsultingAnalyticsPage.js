import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import BackLink from '../components/BackLink';
import LoadingSpinner from '../components/LoadingSpinner';
import consultingService from '../services/consultingService';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const formatPercent = (value) => `${Number(value || 0).toFixed(2)}%`;

const AdminConsultingAnalyticsPage = () => {
    const [overview, setOverview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchOverview = useCallback(async () => {
        try {
            setLoading(true);
            const response = await consultingService.getAnalyticsOverview();
            setOverview(response.data);
            setError('');
        } catch (_err) {
            setError('Failed to load consulting analytics');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOverview();
    }, [fetchOverview]);

    const trendRows = useMemo(() => overview?.daily_trend || [], [overview?.daily_trend]);

    const viewsTrendData = useMemo(() => ({
        labels: trendRows.map((row) => row.day),
        datasets: [
            {
                label: 'Views',
                data: trendRows.map((row) => row.views),
                borderColor: '#003594',
                backgroundColor: 'rgba(0, 53, 148, 0.18)',
                tension: 0.25,
                fill: true,
                borderWidth: 2,
                pointRadius: 2,
            },
        ],
    }), [trendRows]);

    const requestsTrendData = useMemo(() => ({
        labels: trendRows.map((row) => row.day),
        datasets: [
            {
                label: 'Requests',
                data: trendRows.map((row) => row.requests),
                borderColor: '#27ae60',
                backgroundColor: 'rgba(39, 174, 96, 0.18)',
                tension: 0.25,
                fill: true,
                borderWidth: 2,
                pointRadius: 2,
            },
        ],
    }), [trendRows]);

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
                ticks: {
                    maxTicksLimit: 8,
                },
            },
        },
    };

    if (loading) {
        return <LoadingSpinner fullScreen={false} />;
    }

    return (
        <div className="container mt-4">
            <BackLink to="/admin/consulting" label="Back to Manage Consulting" />

            <h1 style={{ color: '#003594', marginBottom: '8px' }}>Consulting Analytics</h1>
            <p style={{ color: '#555', marginBottom: '20px' }}>
                Monitor engagement and conversion performance across consulting services.
            </p>

            {error && <div className="alert alert-danger">{error}</div>}

            {overview && (
                <>
                    <div className="admin-stats-grid" style={{ marginBottom: '20px' }}>
                        <div className="card admin-stat-card users" style={{ borderLeftColor: '#003594' }}>
                            <p>Total Views</p>
                            <h2>{overview.total_views || 0}</h2>
                        </div>
                        <div className="card admin-stat-card surveys" style={{ borderLeftColor: '#27ae60' }}>
                            <p>Total Requests</p>
                            <h2>{overview.total_requests || 0}</h2>
                        </div>
                        <div className="card admin-stat-card responses" style={{ borderLeftColor: '#FFB81C' }}>
                            <p>Conversion Rate</p>
                            <h2>{formatPercent(overview.conversion_rate)}</h2>
                        </div>
                    </div>

                    <div className="admin-chart-grid" style={{ marginBottom: '20px' }}>
                        <div className="card" style={{ maxWidth: '100%' }}>
                            <div className="card-body">
                                <h2>Views Over Time (30 Days)</h2>
                                <div style={{ height: '320px' }}>
                                    <Line data={viewsTrendData} options={lineOptions} />
                                </div>
                            </div>
                        </div>
                        <div className="card" style={{ maxWidth: '100%' }}>
                            <div className="card-body">
                                <h2>Requests Over Time (30 Days)</h2>
                                <div style={{ height: '320px' }}>
                                    <Line data={requestsTrendData} options={lineOptions} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card mb-4">
                        <div className="card-body">
                            <h2 style={{ marginTop: 0 }}>Service Conversion Table</h2>

                            {(overview.service_metrics || []).length === 0 ? (
                                <p style={{ margin: 0, color: '#666' }}>No consulting analytics events recorded yet.</p>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="admin-table" style={{ width: '100%' }}>
                                        <thead>
                                            <tr>
                                                <th>Service</th>
                                                <th>Views</th>
                                                <th>Requests</th>
                                                <th>Conversion</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {overview.service_metrics.map((service) => (
                                                <tr key={service.id}>
                                                    <td>{service.title}</td>
                                                    <td>{service.views}</td>
                                                    <td>{service.requests}</td>
                                                    <td>{formatPercent(service.conversion_rate)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-body">
                            <h2 style={{ marginTop: 0 }}>Top Services</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                                <div>
                                    <h3 style={{ marginTop: 0 }}>Most Viewed</h3>
                                    {(overview.most_viewed_services || []).length === 0 ? (
                                        <p style={{ color: '#666', margin: 0 }}>No views tracked yet.</p>
                                    ) : (
                                        <ul style={{ margin: 0, paddingLeft: '18px' }}>
                                            {overview.most_viewed_services.map((item) => (
                                                <li key={`viewed-${item.id}`}>
                                                    {item.title} ({item.views})
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <div>
                                    <h3 style={{ marginTop: 0 }}>Most Requested</h3>
                                    {(overview.most_requested_services || []).length === 0 ? (
                                        <p style={{ color: '#666', margin: 0 }}>No requests tracked yet.</p>
                                    ) : (
                                        <ul style={{ margin: 0, paddingLeft: '18px' }}>
                                            {overview.most_requested_services.map((item) => (
                                                <li key={`requested-${item.id}`}>
                                                    {item.title} ({item.requests})
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminConsultingAnalyticsPage;
