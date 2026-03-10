import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import responseService from '../services/responseService';
import LoadingSpinner from '../components/LoadingSpinner';

const ResponsesPage = () => {
    const navigate = useNavigate();
    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    const fetchResponses = useCallback(async () => {
        try {
            setLoading(true);
            const response = await responseService.getUserResponses(page, 10);
            setResponses(response.data.responses || []);
            setTotalPages(response.data.pagination?.pages || 1);
            setError('');
        } catch (err) {
            setResponses([]);
            setError(err.response?.data?.error || 'Failed to load responses');
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchResponses();
    }, [fetchResponses]);

    if (loading) {
        return <LoadingSpinner fullScreen={false} />;
    }

    return (
        <div className="container mt-4">
            <div className="responses-shell">
            <div className="responses-header">
                <div>
                    <h1 style={{ color: '#003594', marginBottom: 0 }}>My Survey Responses</h1>
                    <p>Review the surveys you have already completed.</p>
                </div>
                <div className="admin-page-actions">
                    {responses.length > 0 && (
                        <div className="survey-meta-row" style={{ marginBottom: 0 }}>
                            <span className="survey-meta-chip primary">{responses.length} on this page</span>
                            <span className="survey-meta-chip accent">Page {page} of {totalPages || 1}</span>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={() => navigate('/dashboard')}
                        className="btn btn-secondary"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            {responses.length === 0 ? (
                <div className="empty-state">
                    <h2>No responses yet</h2>
                    <p>
                        You haven't submitted any survey responses yet. Start by taking a survey!
                    </p>
                    <button
                        onClick={() => navigate('/surveys')}
                        className="btn btn-primary"
                    >
                        Take a Survey
                    </button>
                </div>
            ) : (
                <div className="response-list">
                    {responses.map((response) => (
                        <div key={response.id} className="response-list-card">
                            <div className="response-list-top">
                                <div>
                                    <p className="response-list-title">{response.survey_title || 'Survey'}</p>
                                    <p className="response-list-meta">
                                        Submitted on {new Date(response.submitted_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className="response-status-badge">
                                    Completed
                                </span>
                            </div>

                            <div className="response-list-actions">
                                <button
                                    onClick={() => navigate(`/responses/${response.id}`)}
                                    className="btn btn-primary"
                                    style={{ padding: '8px 14px', fontSize: '0.9rem' }}
                                >
                                    View Details
                                </button>
                            </div>
                        </div>
                    ))}

                    {totalPages > 1 && (
                        <div className="pagination">
                            <button
                                onClick={() => setPage(Math.max(1, page - 1))}
                                disabled={page === 1}
                            >
                                Previous
                            </button>
                            <span style={{ padding: '6px 12px' }}>
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(Math.min(totalPages, page + 1))}
                                disabled={page === totalPages}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}
            </div>
        </div>
    );
};

export default ResponsesPage;
