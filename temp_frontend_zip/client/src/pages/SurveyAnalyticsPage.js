import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
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
import responseService from '../services/responseService';
import userService from '../services/userService';
import LoadingSpinner from '../components/LoadingSpinner';
import BackLink from '../components/BackLink';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const CHART_COLORS = ['#003594', '#27ae60', '#FFB81C', '#c0392b', '#2980b9', '#8e44ad', '#e67e22', '#6c757d'];

const SurveyAnalyticsPage = () => {
    const { id } = useParams();
    const [analytics, setAnalytics] = useState(null);
    const [demographics, setDemographics] = useState(null);
    const [respondents, setRespondents] = useState([]);
    const [respondentSearch, setRespondentSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const handleViewUser = async (userId) => {
        try {
            const response = await userService.getUserById(userId);
            setSelectedUser(response.data.user);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load user details');
        }
    };

    const fetchAnalytics = useCallback(async () => {
        try {
            setLoading(true);
            const [analyticsRes, demographicsRes, respondentsRes] = await Promise.all([
                responseService.getSurveyAnalytics(id),
                responseService.getSurveyDemographics(id),
                responseService.getSurveyResponses(id, 1, 500),
            ]);
            setAnalytics(analyticsRes.data);
            setDemographics(demographicsRes.data);
            setRespondents(respondentsRes.data.responses || []);
            setError('');
        } catch (err) {
            setError('Failed to load analytics');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    const renderChoiceQuestion = (question) => {
        const barData = {
            labels: question.option_counts.map(o => o.option_text),
            datasets: [{
                label: 'Responses',
                data: question.option_counts.map(o => o.count),
                backgroundColor: 'rgba(0, 53, 148, 0.6)',
                borderColor: 'rgba(0, 53, 148, 1)',
                borderWidth: 1,
            }],
        };

        const barOptions = {
            responsive: true,
            plugins: {
                legend: { display: false },
            },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } },
            },
        };

        const doughnutData = {
            labels: question.option_counts.map(o => o.option_text),
            datasets: [{
                data: question.option_counts.map(o => o.count),
                backgroundColor: CHART_COLORS.slice(0, question.option_counts.length),
                borderWidth: 2,
            }],
        };

        const doughnutOptions = {
            responsive: true,
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
            },
        };

        return (
            <div className="card" style={{ marginBottom: '24px' }} key={question.id}>
                <div className="card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                        <h3 style={{ margin: 0 }}>{question.question_text}</h3>
                        <span style={{
                            backgroundColor: question.question_type === 'multiple_choice' ? '#e8f0fe' : '#e8f8f0',
                            color: question.question_type === 'multiple_choice' ? '#003594' : '#1a6e42',
                            padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold',
                        }}>
                            {question.question_type === 'multiple_choice' ? 'Multiple Choice' : 'Checkbox'} | {question.total_answered} responses
                        </span>
                    </div>
                    <div className="survey-analytics-chart-split">
                        <div><Bar data={barData} options={barOptions} /></div>
                        <div><Doughnut data={doughnutData} options={doughnutOptions} /></div>
                    </div>
                    <div style={{ marginTop: '20px' }}>
                        {question.option_counts.map((opt, idx) => (
                            <div key={opt.option_id} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px',
                                padding: '10px 12px', borderBottom: idx < question.option_counts.length - 1 ? '1px solid #eee' : 'none',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 220px', minWidth: 0 }}>
                                    <div style={{
                                        width: '12px', height: '12px', borderRadius: '2px',
                                        backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                                    }} />
                                    <span style={{ wordBreak: 'break-word' }}>{opt.option_text}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 220px', minWidth: 0, justifyContent: 'flex-end' }}>
                                    <div style={{
                                        width: '100px', height: '8px', backgroundColor: '#E8E9EE', borderRadius: '4px', overflow: 'hidden',
                                    }}>
                                        <div style={{
                                            width: `${opt.percentage}%`, height: '100%',
                                            backgroundColor: CHART_COLORS[idx % CHART_COLORS.length], borderRadius: '4px',
                                        }} />
                                    </div>
                                    <span style={{ color: '#666', fontSize: '0.9rem', textAlign: 'right' }}>
                                        {opt.count} ({opt.percentage}%)
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderRatingQuestion = (question) => {
        const barData = {
            labels: question.rating_distribution.map(d => `${d.rating} Star${d.rating > 1 ? 's' : ''}`),
            datasets: [{
                label: 'Responses',
                data: question.rating_distribution.map(d => d.count),
                backgroundColor: [
                    'rgba(220, 53, 69, 0.6)',
                    'rgba(253, 126, 20, 0.6)',
                    'rgba(255, 193, 7, 0.6)',
                    'rgba(40, 167, 69, 0.6)',
                    'rgba(0, 53, 148, 0.6)',
                ],
                borderColor: [
                    'rgba(220, 53, 69, 1)',
                    'rgba(253, 126, 20, 1)',
                    'rgba(255, 193, 7, 1)',
                    'rgba(40, 167, 69, 1)',
                    'rgba(0, 53, 148, 1)',
                ],
                borderWidth: 1,
            }],
        };

        const barOptions = {
            responsive: true,
            plugins: {
                legend: { display: false },
            },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } },
            },
        };

        return (
            <div className="card" style={{ marginBottom: '24px' }} key={question.id}>
                <div className="card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                        <h3 style={{ margin: 0 }}>{question.question_text}</h3>
                        <span style={{
                            backgroundColor: '#fff8e1', color: '#8a6d00',
                            padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold',
                        }}>
                            Rating | {question.total_answered} responses
                        </span>
                    </div>
                    <div className="survey-analytics-rating-split">
                        <div><Bar data={barData} options={barOptions} /></div>
                        <div className="survey-analytics-rating-summary" style={{
                            padding: '24px 32px', textAlign: 'center',
                            backgroundColor: '#e8f0fe', borderRadius: '8px',
                        }}>
                            <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Average Rating</p>
                            <h2 style={{ margin: '8px 0 0 0', color: '#003594', fontSize: '2.5rem' }}>
                                {question.average_rating}
                            </h2>
                            <p style={{ margin: '4px 0 0 0', color: '#999', fontSize: '0.8rem' }}>out of 5</p>
                        </div>
                    </div>
                    <div style={{ marginTop: '16px' }}>
                        {question.rating_distribution.map((d, idx) => {
                            const totalAnswered = question.total_answered || 1;
                            const percentage = Math.round((d.count / totalAnswered) * 100);
                            const colors = ['#dc3545', '#fd7e14', '#ffc107', '#28a745', '#003594'];
                            return (
                                <div key={d.rating} style={{
                                    display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
                                    padding: '6px 0',
                                }}>
                                    <span style={{ flex: '1 1 120px', fontSize: '0.9rem', color: '#555' }}>{d.rating} Star{d.rating > 1 ? 's' : ''}</span>
                                    <div style={{
                                        flex: 1, height: '10px', backgroundColor: '#E8E9EE', borderRadius: '5px', overflow: 'hidden',
                                    }}>
                                        <div style={{
                                            width: `${percentage}%`, height: '100%',
                                            backgroundColor: colors[idx], borderRadius: '5px',
                                        }} />
                                    </div>
                                    <span style={{ textAlign: 'right', fontSize: '0.85rem', color: '#666' }}>
                                        {d.count} ({percentage}%)
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    const renderTextQuestion = (question) => {
        return (
            <div className="card" style={{ marginBottom: '24px' }} key={question.id}>
                <div className="card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                        <h3 style={{ margin: 0 }}>{question.question_text}</h3>
                        <span style={{
                            backgroundColor: '#f3e5f5', color: '#8e44ad',
                            padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold',
                        }}>
                            Text | {question.total_answered} responses
                        </span>
                    </div>
                    {question.text_responses.length === 0 ? (
                        <p style={{ color: '#999', textAlign: 'center', padding: '24px' }}>
                            No text responses yet
                        </p>
                    ) : (
                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {question.text_responses.map((resp, idx) => (
                                <div key={idx} style={{
                                    padding: '12px 16px', marginBottom: '8px',
                                    backgroundColor: '#f8f9fa', borderRadius: '4px',
                                    borderLeft: '3px solid #8e44ad',
                                }}>
                                    <p style={{ margin: 0, lineHeight: '1.5' }}>"{resp.answer_text}"</p>
                                    <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: '#999' }}>
                                        — {resp.user_name}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (loading) {
        return <LoadingSpinner fullScreen={false} />;
    }

    if (error) {
        return (
            <div className="container mt-4">
                <div className="alert alert-danger">{error}</div>
                <BackLink to="/admin/surveys" label="Back to Manage Surveys and Feedbacks" />
            </div>
        );
    }

    if (!analytics) {
        return null;
    }

    const filteredRespondents = respondents.filter((respondent) => {
        const query = respondentSearch.toLowerCase().trim();
        if (!query) return true;

        const userName = respondent.user_name?.toLowerCase() || '';
        const userEmail = respondent.user_email?.toLowerCase() || '';

        return userName.includes(query) || userEmail.includes(query);
    });

    return (
        <div className="container mt-4">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ margin: 0 }}>Analytics: {analytics.survey_title}</h1>
                <Link to="/admin/surveys" className="btn btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                    Back to Manage Surveys and Feedbacks
                </Link>
            </div>

            {/* Overview Stats */}
            <div className="responsive-three-col-grid" style={{ gap: '16px', marginBottom: '32px' }}>
                <div style={{
                    padding: '16px', backgroundColor: '#e8f0fe',
                    borderRadius: '4px', borderLeft: '4px solid #003594',
                }}>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Total Responses</p>
                    <h2 style={{ margin: '8px 0 0 0', color: '#003594' }}>{analytics.total_responses}</h2>
                </div>
                <div style={{
                    padding: '16px', backgroundColor: '#e8f8f0',
                    borderRadius: '4px', borderLeft: '4px solid #27ae60',
                }}>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Unique Users</p>
                    <h2 style={{ margin: '8px 0 0 0', color: '#27ae60' }}>{analytics.unique_users}</h2>
                </div>
                <div style={{
                    padding: '16px', backgroundColor: '#fff8e1',
                    borderRadius: '4px', borderLeft: '4px solid #FFB81C',
                }}>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Questions</p>
                    <h2 style={{ margin: '8px 0 0 0', color: '#b8860b' }}>{analytics.analytics.length}</h2>
                </div>
            </div>

            {/* Respondent Demographics */}
            {demographics && (demographics.gender_distribution.length > 0 || demographics.age_distribution.length > 0 || demographics.location_distribution.length > 0) && (
                <div style={{ marginBottom: '32px' }}>
                    <h2 style={{ color: '#003594', marginBottom: '16px' }}>Respondent Demographics</h2>
                    <div className="responsive-three-col-grid" style={{ gap: '24px' }}>
                        {/* Gender Distribution */}
                        <div className="card">
                            <div className="card-body">
                                <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem' }}>Gender Distribution</h3>
                                {demographics.gender_distribution.length > 0 ? (
                                    <Doughnut
                                        data={{
                                            labels: demographics.gender_distribution.map(d => d.gender),
                                            datasets: [{
                                                data: demographics.gender_distribution.map(d => d.count),
                                                backgroundColor: CHART_COLORS.slice(0, demographics.gender_distribution.length),
                                                borderWidth: 2,
                                            }],
                                        }}
                                        options={{
                                            responsive: true,
                                            plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
                                        }}
                                    />
                                ) : (
                                    <p style={{ color: '#999', textAlign: 'center', padding: '24px' }}>No data</p>
                                )}
                            </div>
                        </div>

                        {/* Age Distribution */}
                        <div className="card">
                            <div className="card-body">
                                <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem' }}>Age Distribution</h3>
                                {demographics.age_distribution.length > 0 ? (
                                    <Bar
                                        data={{
                                            labels: demographics.age_distribution.map(d => d.age_group),
                                            datasets: [{
                                                label: 'Respondents',
                                                data: demographics.age_distribution.map(d => d.count),
                                                backgroundColor: 'rgba(0, 53, 148, 0.6)',
                                                borderColor: 'rgba(0, 53, 148, 1)',
                                                borderWidth: 1,
                                            }],
                                        }}
                                        options={{
                                            responsive: true,
                                            plugins: { legend: { display: false } },
                                            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
                                        }}
                                    />
                                ) : (
                                    <p style={{ color: '#999', textAlign: 'center', padding: '24px' }}>No data</p>
                                )}
                            </div>
                        </div>

                        {/* Location Distribution */}
                        <div className="card">
                            <div className="card-body">
                                <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem' }}>Top Locations</h3>
                                {demographics.location_distribution.length > 0 ? (
                                    <Bar
                                        data={{
                                            labels: demographics.location_distribution.map(d => d.location),
                                            datasets: [{
                                                label: 'Respondents',
                                                data: demographics.location_distribution.map(d => d.count),
                                                backgroundColor: 'rgba(39, 174, 96, 0.6)',
                                                borderColor: 'rgba(39, 174, 96, 1)',
                                                borderWidth: 1,
                                            }],
                                        }}
                                        options={{
                                            indexAxis: 'y',
                                            responsive: true,
                                            plugins: { legend: { display: false } },
                                            scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } },
                                        }}
                                    />
                                ) : (
                                    <p style={{ color: '#999', textAlign: 'center', padding: '24px' }}>No data</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Per-Question Analytics */}
            {analytics.analytics.length === 0 ? (
                <div className="card">
                    <div className="card-body" style={{ textAlign: 'center', padding: '40px' }}>
                        <p style={{ color: '#666', fontSize: '1.1rem' }}>
                            No questions found for this survey
                        </p>
                    </div>
                </div>
            ) : (
                analytics.analytics.map((question, index) => (
                    <div key={question.id}>
                        <h3 style={{ color: '#555', fontSize: '0.9rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Question {index + 1}
                        </h3>
                        {(question.question_type === 'multiple_choice' || question.question_type === 'checkbox')
                            && renderChoiceQuestion(question)}
                        {question.question_type === 'rating' && renderRatingQuestion(question)}
                        {question.question_type === 'text' && renderTextQuestion(question)}
                    </div>
                ))
            )}

            {/* Respondents List */}
            <div style={{ marginTop: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '12px', flexWrap: 'wrap' }}>
                    <h2 style={{ color: '#003594', margin: 0 }}>Respondents</h2>
                    <span style={{ color: '#666', fontSize: '0.9rem' }}>
                        {filteredRespondents.length} of {respondents.length}
                    </span>
                </div>

                <div className="card" style={{ marginBottom: '16px' }}>
                    <div className="card-body">
                        <input
                            type="text"
                            placeholder="Search respondents by name or email"
                            value={respondentSearch}
                            onChange={(e) => setRespondentSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="card">
                    <div className="card-body">
                        {filteredRespondents.length === 0 ? (
                            <p style={{ color: '#666', textAlign: 'center', padding: '24px' }}>
                                No respondents found
                            </p>
                        ) : (
                            <div style={{ display: 'grid', gap: '12px' }}>
                                {filteredRespondents.map((respondent, idx) => {
                                    return (
                                        <div
                                            key={respondent.id}
                                            style={{
                                                border: '1px solid #dbe4f5',
                                                borderRadius: '8px',
                                                padding: '12px',
                                                backgroundColor: '#f8fbff',
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                <div>
                                                    <p style={{ margin: 0, fontWeight: 'bold' }}>
                                                        {idx + 1}. {respondent.user_name || 'Anonymous User'}
                                                    </p>
                                                    <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '0.9rem' }}>
                                                        {respondent.user_email || 'N/A'}
                                                    </p>
                                                    <p style={{ margin: '4px 0 0 0', color: '#555', fontSize: '0.9rem' }}>
                                                        Submitted: {new Date(respondent.submitted_at).toLocaleString()}
                                                    </p>
                                                </div>

                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    {respondent.user_id && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-primary btn-sm"
                                                            onClick={() => handleViewUser(respondent.user_id)}
                                                        >
                                                            View
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* User Detail Modal */}
            {selectedUser && (
                <div
                    onClick={() => setSelectedUser(null)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2000,
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            padding: '32px',
                            maxWidth: '500px',
                            width: '90%',
                            maxHeight: '80vh',
                            overflowY: 'auto',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, color: '#003594' }}>User Profile</h2>
                            <button
                                onClick={() => setSelectedUser(null)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    color: '#666',
                                    padding: '4px 8px',
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                            <span style={{
                                backgroundColor: selectedUser.role === 'admin' ? '#e8f0fe' : '#E8E9EE',
                                color: selectedUser.role === 'admin' ? '#003594' : '#555',
                                padding: '4px 10px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold',
                            }}>
                                {selectedUser.role}
                            </span>
                            <span style={{
                                backgroundColor: selectedUser.is_banned ? '#fde8e8' : '#e8f8f0',
                                color: selectedUser.is_banned ? '#922b21' : '#1a6e42',
                                padding: '4px 10px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold',
                            }}>
                                {selectedUser.is_banned ? 'Banned' : 'Active'}
                            </span>
                        </div>

                        <div className="responsive-two-col-grid" style={{ gap: '16px' }}>
                            <div>
                                <p style={{ margin: 0, color: '#888', fontSize: '0.8rem' }}>Name</p>
                                <p style={{ margin: '4px 0 0 0', fontWeight: 'bold' }}>{selectedUser.name}</p>
                            </div>
                            <div>
                                <p style={{ margin: 0, color: '#888', fontSize: '0.8rem' }}>Email</p>
                                <p style={{ margin: '4px 0 0 0', fontWeight: 'bold' }}>{selectedUser.email}</p>
                            </div>
                            <div>
                                <p style={{ margin: 0, color: '#888', fontSize: '0.8rem' }}>Age</p>
                                <p style={{ margin: '4px 0 0 0' }}>{selectedUser.age || 'Not provided'}</p>
                            </div>
                            <div>
                                <p style={{ margin: 0, color: '#888', fontSize: '0.8rem' }}>Gender</p>
                                <p style={{ margin: '4px 0 0 0' }}>{selectedUser.gender || 'Not provided'}</p>
                            </div>
                            <div>
                                <p style={{ margin: 0, color: '#888', fontSize: '0.8rem' }}>Phone</p>
                                <p style={{ margin: '4px 0 0 0' }}>{selectedUser.phone || 'Not provided'}</p>
                            </div>
                            <div>
                                <p style={{ margin: 0, color: '#888', fontSize: '0.8rem' }}>Location</p>
                                <p style={{ margin: '4px 0 0 0' }}>{selectedUser.location || 'Not provided'}</p>
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <p style={{ margin: 0, color: '#888', fontSize: '0.8rem' }}>Bio</p>
                                <p style={{ margin: '4px 0 0 0' }}>{selectedUser.bio || 'Not provided'}</p>
                            </div>
                            <div>
                                <p style={{ margin: 0, color: '#888', fontSize: '0.8rem' }}>Member Since</p>
                                <p style={{ margin: '4px 0 0 0' }}>{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SurveyAnalyticsPage;
