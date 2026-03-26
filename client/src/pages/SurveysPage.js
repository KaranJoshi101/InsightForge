import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import surveyService from '../services/surveyService';
import responseService from '../services/responseService';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import BackLink from '../components/BackLink';

const SurveysPage = () => {
    const { isAuthenticated } = useAuth();
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [submittedSurveys, setSubmittedSurveys] = useState(new Map());

    const formatSubmittedAt = (submittedAt) => {
        if (!submittedAt) {
            return '';
        }

        const date = new Date(submittedAt);
        if (Number.isNaN(date.getTime())) {
            return '';
        }

        return date.toLocaleString([], {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    const fetchUserResponses = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const response = await responseService.getUserResponses(1, 200);
            const submissionMap = new Map();

            response.data.responses.forEach((entry) => {
                const surveyId = Number(entry.survey_id);

                if (!submissionMap.has(surveyId)) {
                    submissionMap.set(surveyId, entry.submitted_at || null);
                }
            });

            setSubmittedSurveys(submissionMap);
        } catch (err) {
            // Silently fail if endpoint not available
            console.error('Failed to load user responses:', err);
        }
    }, [isAuthenticated]);

    const fetchSurveys = useCallback(async () => {
        try {
            setLoading(true);
            const response = await surveyService.getAllSurveys(page, 10, 'published');
            setSurveys(response.data.surveys);
            setTotalPages(response.data.pagination.pages);
            setError('');
        } catch (err) {
            setError('Failed to load surveys');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchSurveys();
        fetchUserResponses();
    }, [fetchSurveys, fetchUserResponses]);

    if (loading && surveys.length === 0) {
        return <LoadingSpinner fullScreen={false} />;
    }

    const backTo = isAuthenticated ? '/dashboard' : '/';

    return (
        <div className="container mt-4">
            <BackLink to={backTo} label="Go Back" />
            <h1 style={{ margin: 0, color: '#003594' }}>Available Surveys</h1>
            <p style={{ color: '#555', marginBottom: '24px' }}>
                Explore and take surveys to share your feedback
            </p>

            {error && <div className="alert alert-danger">{error}</div>}

            {surveys.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p style={{ fontSize: '1.1rem', color: '#555' }}>
                        No surveys available at the moment.
                    </p>
                </div>
            ) : (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '20px',
                        marginBottom: '24px',
                    }}
                >
                    {surveys.map((survey) => (
                        <div key={survey.id} className="survey-card">
                            <div className="card-body">
                                <h3>{survey.title}</h3>
                                <p style={{ color: '#555', marginBottom: '12px' }}>
                                    {survey.description}
                                </p>
                                <p style={{ fontSize: '0.9rem', color: '#999', marginBottom: '16px' }}>
                                    Status:{' '}
                                    <span
                                        style={{
                                            backgroundColor:
                                                survey.status === 'published' ? '#e8f8f0' : '#fff8e1',
                                            color: survey.status === 'published' ? '#1a6e42' : '#8a6d00',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontSize: '0.85rem',
                                        }}
                                    >
                                        {survey.status}
                                    </span>
                                </p>
                                {submittedSurveys.has(survey.id) ? (
                                    <>
                                        <button
                                            disabled
                                            className="btn btn-success btn-block"
                                            style={{ marginTop: 'auto', textAlign: 'center', opacity: 0.6 }}
                                        >
                                            ✓ Submitted
                                        </button>
                                        <div
                                            style={{
                                                marginTop: '10px',
                                                fontSize: '0.85rem',
                                                color: '#1a6e42',
                                                backgroundColor: '#e8f8f0',
                                                borderRadius: '6px',
                                                padding: '6px 10px',
                                                textAlign: 'center',
                                            }}
                                        >
                                            Submitted on {formatSubmittedAt(submittedSurveys.get(survey.id)) || 'N/A'}
                                        </div>
                                    </>
                                ) : (
                                    <Link
                                        to={`/surveys/${survey.id}`}
                                        className="btn btn-primary btn-block"
                                        style={{ marginTop: 'auto', textAlign: 'center' }}
                                    >
                                        View & Take
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

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
    );
};

export default SurveysPage;
