import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import surveyService from '../services/surveyService';
import responseService from '../services/responseService';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import BackLink from '../components/BackLink';
import SeoMeta from '../components/SeoMeta';

const SurveysPage = () => {
    const { isAuthenticated } = useAuth();
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
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
        } catch (_err) {
            // Optional enhancement data; keep page usable when unavailable.
        }
    }, [isAuthenticated]);

    const fetchSurveys = useCallback(async () => {
        try {
            setLoading(true);
            const surveyResult = await surveyService.getAllSurveys(1, 500, 'published', true);

            setSurveys(surveyResult.data.surveys || []);
            setError('');
        } catch (err) {
            setError('Failed to load surveys');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const filteredSurveys = useMemo(() => {
        const normalized = searchTerm.trim().toLowerCase();
        if (!normalized) {
            return surveys;
        }

        return surveys.filter((survey) =>
            String(survey.title || '').toLowerCase().includes(normalized)
        );
    }, [surveys, searchTerm]);

    const pureSurveys = useMemo(() => {
        return filteredSurveys.filter((survey) => {
            return !Boolean(survey.is_feedback);
        });
    }, [filteredSurveys]);

    const renderSurveyCards = (list, palette) => {
        if (list.length === 0) {
            return null;
        }

        return (
            <section style={{ marginBottom: '28px' }}>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '20px',
                    }}
                >
                    {list.map((survey) => (
                        <div
                            key={survey.id}
                            className="survey-card"
                            style={{
                                backgroundColor: palette.cardBg,
                                border: `1px solid ${palette.border}`,
                                boxShadow: `0 6px 18px ${palette.shadow}`,
                            }}
                        >
                            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', minHeight: '190px' }}>
                                <h3 style={{ color: palette.heading }}>{survey.title}</h3>
                                <p style={{ color: '#555', marginBottom: '12px' }}>{survey.description}</p>
                                {submittedSurveys.has(survey.id) ? (
                                    <>
                                        <div className="submission-pill">Submitted</div>
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
                                        to={`/surveys/${survey.slug || survey.id}`}
                                        className="btn btn-primary btn-block"
                                        style={{
                                            marginTop: 'auto',
                                            textAlign: 'center',
                                            backgroundColor: palette.buttonBg,
                                            borderColor: palette.buttonBg,
                                        }}
                                    >
                                        View & Take
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        );
    };

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
            <SeoMeta
                title="Available Surveys | InsightForge"
                description="Explore active surveys and share your responses securely on InsightForge."
                keywords={['surveys', 'questionnaire', 'feedback', 'research']}
                path="/surveys"
            />
            <BackLink to={backTo} label="Go Back" />
            <h1 style={{ margin: 0, color: '#003594' }}>Available Surveys</h1>
            <p style={{ color: '#555', marginBottom: '24px' }}>
                Explore and take surveys to share your feedback
            </p>
            <p style={{ marginTop: '-12px', marginBottom: '24px' }}>
                Prefer reading first? <Link to="/articles">Visit published articles</Link>.
            </p>

            <div className="market-toolbar">
                <div className="survey-meta-row" style={{ marginBottom: 0 }}>
                    <span className="survey-meta-chip primary">Survey: {pureSurveys.length}</span>
                </div>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search surveys by name"
                    aria-label="Search surveys by name"
                    className="market-search-input"
                />
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            {pureSurveys.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p style={{ fontSize: '1.1rem', color: '#555' }}>
                        {surveys.length === 0
                            ? 'No surveys available at the moment.'
                            : filteredSurveys.length === 0
                                ? 'No surveys match your search.'
                                : 'No surveys available in this section.'}
                    </p>
                </div>
            ) : (
                <>
                    {renderSurveyCards(pureSurveys, {
                        heading: '#003594',
                        cardBg: '#eef5ff',
                        border: '#cfe0ff',
                        shadow: 'rgba(0, 53, 148, 0.12)',
                        buttonBg: '#003594',
                    })}
                </>
            )}

        </div>
    );
};

export default SurveysPage;
