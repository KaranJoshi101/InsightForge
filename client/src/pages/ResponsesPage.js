import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import responseService from '../services/responseService';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import BackLink from '../components/BackLink';

const ResponsesPage = () => {
    const navigate = useNavigate();
    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [feedbackSurveyIds, setFeedbackSurveyIds] = useState(new Set());

    const pureCount = responses.filter((response) => !feedbackSurveyIds.has(Number(response.survey_id))).length;
    const feedbackCount = responses.filter((response) => feedbackSurveyIds.has(Number(response.survey_id))).length;

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

    useEffect(() => {
        const fetchFeedbackSurveyIds = async () => {
            try {
                const mediaResponse = await api.get('/media', { params: { limit: 500 } });
                const posts = Array.isArray(mediaResponse.data?.posts) ? mediaResponse.data.posts : [];
                const ids = new Set(
                    posts
                        .map((post) => Number(post.survey_id))
                        .filter((surveyId) => Number.isInteger(surveyId) && surveyId > 0)
                );
                setFeedbackSurveyIds(ids);
            } catch (_err) {
                setFeedbackSurveyIds(new Set());
            }
        };

        fetchFeedbackSurveyIds();
    }, []);

    if (loading) {
        return <LoadingSpinner fullScreen={false} />;
    }

    return (
        <div className="container mt-4">
            <div className="responses-shell">
            <div className="responses-header">
                <div>
                    <BackLink to="/dashboard" label="Go Back" />
                    <h1 style={{ color: '#003594', marginBottom: 0 }}>My Survey Responses</h1>
                    <p>Review the surveys you have already completed.</p>
                </div>
                <div className="admin-page-actions">
                    {responses.length > 0 && (
                        <div className="survey-meta-row" style={{ marginBottom: 0 }}>
                            <span className="survey-meta-chip primary">{responses.length} on this page</span>
                            <span className="survey-meta-chip accent">Page {page} of {totalPages || 1}</span>
                            <span className="survey-meta-chip" style={{ backgroundColor: '#e7efff', color: '#003594', border: '1px solid #cfe0ff' }}>
                                Survey: {pureCount}
                            </span>
                            <span className="survey-meta-chip" style={{ backgroundColor: '#fff1c7', color: '#8a6d00', border: '1px solid #ffe1a3' }}>
                                Feedback: {feedbackCount}
                            </span>
                        </div>
                    )}
                    
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
                    {responses.map((response) => {
                        const isFeedback = feedbackSurveyIds.has(Number(response.survey_id));

                        return (
                            <div key={response.id} className="response-list-card" style={{ border: isFeedback ? '1px solid #ffe1a3' : '1px solid #cfe0ff' }}>
                                <div className="response-list-top">
                                    <div>
                                        <p className="response-list-title">{response.survey_title || 'Survey'}</p>
                                        <p className="response-list-meta">
                                            Submitted on {new Date(response.submitted_at).toLocaleDateString()}
                                        </p>
                                        <p style={{ margin: '6px 0 0 0' }}>
                                            <span className={`response-type-chip ${isFeedback ? 'feedback' : 'survey'}`}>
                                                {isFeedback ? 'Feedback' : 'Survey'}
                                            </span>
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
                        );
                    })}

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
