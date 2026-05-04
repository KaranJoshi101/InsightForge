import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import surveyService from '../services/surveyService';
import responseService from '../services/responseService';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import BackLink from '../components/BackLink';
import SeoMeta from '../components/SeoMeta';

const SurveyDetailPage = () => {
    const { slug } = useParams();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const fromMediaPath = location.state?.fromMedia;
    const [survey, setSurvey] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [alreadySubmitted, setAlreadySubmitted] = useState(false);
    const [submittedAt, setSubmittedAt] = useState(null);

    const formatSubmittedAt = (value) => {
        if (!value) {
            return '';
        }

        const date = new Date(value);
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

    const fetchSurvey = useCallback(async () => {
        try {
            setLoading(true);
            const [surveyResponse, userResponsesResponse] = await Promise.all([
                surveyService.getSurveyById(slug),
                isAuthenticated ? responseService.getUserResponses(1, 200) : Promise.resolve({ data: { responses: [] } }),
            ]);

            const currentSurvey = surveyResponse.data.survey;
            const currentSurveyId = Number(currentSurvey?.id);

            const submittedSurveyIds = new Set(
                (userResponsesResponse.data.responses || []).map((response) => Number(response.survey_id))
            );

            const currentSubmission = (userResponsesResponse.data.responses || []).find(
                (response) => Number(response.survey_id) === currentSurveyId
            );

            setSurvey(currentSurvey);
            setAlreadySubmitted(submittedSurveyIds.has(currentSurveyId));
            setSubmittedAt(currentSubmission?.submitted_at || null);
            setError('');
        } catch (err) {
            setError('Failed to load survey');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [slug, isAuthenticated]);

    useEffect(() => {
        fetchSurvey();
    }, [fetchSurvey]);

    if (loading) {
        return <LoadingSpinner fullScreen={false} />;
    }

    const isFeedbackSurvey = Boolean(survey?.is_feedback);
    const backTo = survey ? (isFeedbackSurvey ? '/media' : '/surveys') : (fromMediaPath || '/surveys');
    const backLabel = survey ? (isFeedbackSurvey ? 'Back to Media' : 'Back to Surveys') : (fromMediaPath ? 'Back to Media' : 'Back to Surveys');

    if (error || !survey) {
        return (
            <div className="container mt-4">
                <BackLink to={backTo} label={backLabel} />
                <div className="alert alert-danger">{error || 'Survey not found'}</div>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <SeoMeta
                title={`${survey.title} | InsightForge`}
                description={survey.description || 'Take this survey on InsightForge and share your responses.'}
                keywords={['survey', 'feedback', survey.title]}
                path={`/surveys/${survey.slug || slug}`}
            />
            <BackLink to={backTo} label={backLabel} />

            <div className="card mt-3">
                <div className="card-body">
                    <h1>{survey.title}</h1>
                    <p style={{ color: '#555', fontSize: '1.1rem', marginBottom: '24px' }}>
                        {survey.description}
                    </p>

                    {alreadySubmitted && (
                        <div
                            style={{
                                display: 'inline-block',
                                marginBottom: '20px',
                                padding: '8px 12px',
                                backgroundColor: '#e8f8f0',
                                color: '#1a6e42',
                                borderRadius: '6px',
                                fontSize: '0.95rem',
                                fontWeight: 600,
                            }}
                        >
                            Submitted on {formatSubmittedAt(submittedAt) || 'N/A'}
                        </div>
                    )}

                    <div style={{ marginBottom: '24px' }}>
                        <h3>Questions ({survey.questions?.length || 0})</h3>
                        {survey.questions && survey.questions.length > 0 ? (
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {survey.questions.map((question, index) => (
                                    <li
                                        key={question.id}
                                        style={{
                                            padding: '12px',
                                            borderBottom: '1px solid #eee',
                                            marginBottom: '8px',
                                        }}
                                    >
                                        <strong>
                                            {index + 1}. {question.question_text}
                                        </strong>
                                        <p style={{ margin: '8px 0 0 0', color: '#555', fontSize: '0.9rem' }}>
                                            Type: <span style={{ fontWeight: 'bold', color: '#003594' }}>{question.question_type}</span>
                                            {!question.is_required && ' (Optional)'}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p style={{ color: '#555' }}>No questions yet</p>
                        )}
                    </div>

                    <div style={{ marginTop: '24px' }}>
                        {isAuthenticated ? (
                            alreadySubmitted ? (
                                <button
                                    disabled
                                    className="btn btn-success"
                                    style={{ fontSize: '1.1rem', padding: '12px 24px', opacity: 0.65 }}
                                >
                                    ✓ Already Submitted
                                </button>
                            ) : (
                                <button
                                    onClick={() => navigate(`/survey/${survey.id}/take`, { state: { fromMedia: backTo } })}
                                    className="btn btn-success"
                                    style={{ fontSize: '1.1rem', padding: '12px 24px' }}
                                >
                                    Take Survey
                                </button>
                            )
                        ) : (
                            <div className="alert alert-info">
                                <p>
                                    Please{' '}
                                    <Link
                                        to="/login"
                                        state={{ from: `/survey/${survey.id}/take`, fromMedia: backTo }}
                                        style={{ color: '#003594', fontWeight: 'bold' }}
                                    >
                                        login
                                    </Link>{' '}
                                    to take this survey
                                </p>
                            </div>
                        )}
                    </div>
                    <p style={{ marginTop: '12px' }}>
                        Need context first? <Link to="/articles">Read related articles</Link>.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SurveyDetailPage;
