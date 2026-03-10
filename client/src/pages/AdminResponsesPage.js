import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import surveyService from '../services/surveyService';
import responseService from '../services/responseService';
import LoadingSpinner from '../components/LoadingSpinner';

const AdminResponsesPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedSurvey, setSelectedSurvey] = useState(null);
    const [responses, setResponses] = useState([]);
    const [loadingResponses, setLoadingResponses] = useState(false);
    const [analytics, setAnalytics] = useState(null);

    // Search and filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredResponses, setFilteredResponses] = useState([]);
    const [exporting, setExporting] = useState(false);

    const fetchSurveys = useCallback(async () => {
        try {
            setLoading(true);
            const response = await surveyService.getAllSurveys(1, 100);
            setSurveys(response.data.surveys);
            setError('');
        } catch (err) {
            setError('Failed to load surveys');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSurveys();
    }, [fetchSurveys]);

    // Fetch responses when survey is selected
    const handleSelectSurvey = useCallback(async (survey, syncUrl = true) => {
        setSelectedSurvey(survey);
        setSearchQuery('');
        setLoadingResponses(true);
        setError('');

        if (syncUrl) {
            setSearchParams({ surveyId: String(survey.id) });
        }

        try {
            // Fetch responses
            const responsesData = await responseService.getSurveyResponses(survey.id, 1, 100);
            setResponses(responsesData.data.responses || []);
            setFilteredResponses(responsesData.data.responses || []);

            // Fetch analytics
            try {
                const analyticsData = await responseService.getSurveyAnalytics(survey.id);
                setAnalytics(analyticsData.data);
            } catch (err) {
                console.log('Analytics not available');
            }
        } catch (err) {
            setError('Failed to load responses');
            console.error(err);
        } finally {
            setLoadingResponses(false);
        }
    }, [setSearchParams]);

    useEffect(() => {
        const surveyIdParam = parseInt(searchParams.get('surveyId') || '', 10);

        if (!surveyIdParam || surveys.length === 0) {
            return;
        }

        if (selectedSurvey?.id === surveyIdParam) {
            return;
        }

        const matchedSurvey = surveys.find((survey) => survey.id === surveyIdParam);
        if (matchedSurvey) {
            handleSelectSurvey(matchedSurvey, false);
        }
    }, [searchParams, surveys, selectedSurvey, handleSelectSurvey]);

    // Handle search and filter
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredResponses(responses);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = responses.filter((response) => {
            const userName = response.user_name?.toLowerCase() || '';
            const userEmail = response.user_email?.toLowerCase() || '';
            const userId = response.user_id?.toString() || '';

            return (
                userName.includes(query) ||
                userEmail.includes(query) ||
                userId.includes(query)
            );
        });

        setFilteredResponses(filtered);
    }, [searchQuery, responses]);

    const handleExportExcel = async () => {
        if (!selectedSurvey) return;
        setExporting(true);
        try {
            const response = await responseService.exportSurveyResponses(selectedSurvey.id);
            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${selectedSurvey.title.replace(/[^a-zA-Z0-9 ]/g, '')}-responses.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError('Failed to export responses');
            console.error(err);
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return <LoadingSpinner fullScreen={false} />;
    }

    return (
        <div className="container mt-4">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ color: '#003594' }}>Survey Responses & Analytics</h1>
                <Link to="/admin/surveys" className="btn btn-secondary">
                    ← Back to Manage Surveys
                </Link>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', minHeight: '600px' }}>
                {/* Surveys List */}
                <div>
                    <div className="card">
                        <div className="card-body">
                            <h2 style={{ marginTop: 0 }}>Surveys</h2>
                            {surveys.length === 0 ? (
                                <p style={{ color: '#666' }}>No surveys available</p>
                            ) : (
                                <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                    {surveys.map((survey) => (
                                        <div
                                            key={survey.id}
                                            onClick={() => handleSelectSurvey(survey)}
                                            style={{
                                                padding: '12px',
                                                marginBottom: '8px',
                                                borderRadius: '4px',
                                                backgroundColor: selectedSurvey?.id === survey.id ? '#003594' : '#f8f9fa',
                                                color: selectedSurvey?.id === survey.id ? 'white' : '#333',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                border: '1px solid ' + (selectedSurvey?.id === survey.id ? '#002570' : '#d1d5db'),
                                            }}
                                            onMouseOver={(e) => {
                                                e.currentTarget.style.backgroundColor = selectedSurvey?.id === survey.id ? '#002570' : '#e8f0fe';
                                            }}
                                            onMouseOut={(e) => {
                                                e.currentTarget.style.backgroundColor = selectedSurvey?.id === survey.id ? '#003594' : '#f8f9fa';
                                            }}
                                        >
                                            <strong>{survey.title}</strong>
                                            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', opacity: 0.8 }}>
                                                Status: {survey.status}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Responses & Analytics */}
                <div>
                    {!selectedSurvey ? (
                        <div className="card">
                            <div className="card-body" style={{ textAlign: 'center', padding: '40px' }}>
                                <p style={{ color: '#666', fontSize: '1.1rem' }}>
                                    Select a survey to view responses and analytics
                                </p>
                            </div>
                        </div>
                    ) : loadingResponses ? (
                        <LoadingSpinner fullScreen={false} />
                    ) : (
                        <>
                            {/* Analytics Summary */}
                            {analytics && (
                                <div className="card" style={{ marginBottom: '24px' }}>
                                    <div className="card-body">
                                        <h3>Analytics for "{selectedSurvey.title}"</h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '16px' }}>
                                            <div style={{
                                                padding: '16px',
                                                backgroundColor: '#e8f0fe',
                                                borderRadius: '4px',
                                                borderLeft: '4px solid #003594',
                                            }}>
                                                <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Total Responses</p>
                                                <h2 style={{ margin: '8px 0 0 0', color: '#003594' }}>
                                                    {analytics.total_responses || responses.length}
                                                </h2>
                                            </div>

                                            <div style={{
                                                padding: '16px',
                                                backgroundColor: '#e8f8f0',
                                                borderRadius: '4px',
                                                borderLeft: '4px solid #27ae60',
                                            }}>
                                                <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Unique Users</p>
                                                <h2 style={{ margin: '8px 0 0 0', color: '#27ae60' }}>
                                                    {analytics.unique_users || new Set(responses.map(r => r.user_id)).size}
                                                </h2>
                                            </div>

                                            <div style={{
                                                padding: '16px',
                                                backgroundColor: '#fff8e1',
                                                borderRadius: '4px',
                                                borderLeft: '4px solid #FFB81C',
                                            }}>
                                                <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Questions</p>
                                                <h2 style={{ margin: '8px 0 0 0', color: '#b8860b' }}>
                                                    {analytics.analytics ? analytics.analytics.length : 0}
                                                </h2>
                                            </div>
                                        </div>
                                        <div style={{ marginTop: '16px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                            <button
                                                onClick={handleExportExcel}
                                                disabled={exporting}
                                                className="btn btn-secondary"
                                                style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                                            >
                                                {exporting ? 'Exporting...' : 'Download Excel'}
                                            </button>
                                            <Link
                                                to={`/admin/surveys/${selectedSurvey.id}/analytics`}
                                                className="btn btn-primary"
                                                style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                                            >
                                                View Full Analytics →
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Search */}
                            <div className="card" style={{ marginBottom: '24px' }}>
                                <div className="card-body">
                                    <input
                                        type="text"
                                        placeholder="Search by name, email, or user ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="form-control"
                                    />
                                    <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '0.85rem' }}>
                                        Showing {filteredResponses.length} of {responses.length} responses
                                    </p>
                                </div>
                            </div>

                            {/* Responses List */}
                            <div className="card">
                                <div className="card-body">
                                    <h3>Responses ({filteredResponses.length})</h3>
                                    {filteredResponses.length === 0 ? (
                                        <p style={{ color: '#666', textAlign: 'center', padding: '24px' }}>
                                            No responses found
                                        </p>
                                    ) : (
                                        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                            {filteredResponses.map((response, index) => (
                                                <div
                                                    key={response.id}
                                                    style={{
                                                        padding: '12px',
                                                        marginBottom: '12px',
                                                        borderRadius: '4px',
                                                        backgroundColor: '#f0f4f8',
                                                        borderLeft: '4px solid #003594',
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <div>
                                                            <p style={{ margin: 0, fontWeight: 'bold', marginBottom: '4px' }}>
                                                                {index + 1}. {response.user_name || 'Anonymous User'}
                                                            </p>
                                                            <p style={{ margin: '4px 0', color: '#666', fontSize: '0.85rem' }}>
                                                                Email: {response.user_email || 'N/A'}
                                                            </p>
                                                            <p style={{ margin: '4px 0', color: '#666', fontSize: '0.85rem' }}>
                                                                Submitted: {new Date(response.submitted_at).toLocaleString()}
                                                            </p>
                                                        </div>
                                                        <span
                                                            style={{
                                                                display: 'inline-block',
                                                                backgroundColor: '#d4edda',
                                                                color: '#155724',
                                                                padding: '4px 8px',
                                                                borderRadius: '4px',
                                                                fontSize: '0.85rem',
                                                                fontWeight: 'bold',
                                                            }}
                                                        >
                                                            ✓ Completed
                                                        </span>
                                                    </div>

                                                    {/* Responses Summary */}
                                                    {response.answers && response.answers.length > 0 && (
                                                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #dee2e6' }}>
                                                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#666', marginBottom: '8px' }}>
                                                                <strong>Answers:</strong> {response.answers.length} questions answered
                                                            </p>
                                                            <div style={{ fontSize: '0.8rem', color: '#666' }}>
                                                                {response.answers.slice(0, 2).map((answer, idx) => (
                                                                    <p key={idx} style={{ margin: '4px 0' }}>
                                                                        • {answer.question_text?.substring(0, 50)}...
                                                                    </p>
                                                                ))}
                                                                {response.answers.length > 2 && (
                                                                    <p style={{ margin: '4px 0', fontStyle: 'italic' }}>
                                                                        + {response.answers.length - 2} more answers
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminResponsesPage;
