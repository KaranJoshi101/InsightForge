import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import BackLink from '../components/BackLink';
import { useAuth } from '../context/AuthContext';

const MediaDetailPage = () => {
    const { id } = useParams();
    const { isAuthenticated } = useAuth();
    const [media, setMedia] = useState(null);
    const [article, setArticle] = useState(null);
    const [survey, setSurvey] = useState(null);
    const [alreadySubmitted, setAlreadySubmitted] = useState(false);
    const [submittedAt, setSubmittedAt] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

    const fetchMediaAndLinkedContent = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            // Fetch media post
            const mediaResponse = await api.get(`/media/${id}`);
            const mediaPost = mediaResponse.data.post || mediaResponse.data;
            setMedia(mediaPost);

            // Fetch article if article_id exists
            if (mediaPost.article_id) {
                try {
                    const articleResponse = await api.get(`/articles/${mediaPost.article_id}`);
                    setArticle(articleResponse.data.article || articleResponse.data);
                } catch (err) {
                    console.warn('Could not load article:', err.message);
                    setArticle(null);
                }
            }

            // Fetch survey if survey_id exists
            if (mediaPost.survey_id) {
                try {
                    const surveyResponse = await api.get(`/surveys/${mediaPost.survey_id}`);
                    const linkedSurvey = surveyResponse.data.survey || surveyResponse.data;
                    setSurvey(linkedSurvey);

                    if (isAuthenticated && linkedSurvey?.id) {
                        try {
                            const responsesResponse = await api.get('/responses/user?page=1&limit=200');
                            const matchingSubmission = (responsesResponse.data.responses || []).find(
                                (response) => Number(response.survey_id) === Number(linkedSurvey.id)
                            );

                            setAlreadySubmitted(Boolean(matchingSubmission));
                            setSubmittedAt(matchingSubmission?.submitted_at || null);
                        } catch (submissionErr) {
                            console.warn('Could not load submission status:', submissionErr.message);
                            setAlreadySubmitted(false);
                            setSubmittedAt(null);
                        }
                    } else {
                        setAlreadySubmitted(false);
                        setSubmittedAt(null);
                    }
                } catch (err) {
                    console.warn('Could not load survey:', err.message);
                    setSurvey(null);
                    setAlreadySubmitted(false);
                    setSubmittedAt(null);
                }
            }
        } catch (err) {
            setError('Failed to load media details');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [id, isAuthenticated]);

    useEffect(() => {
        fetchMediaAndLinkedContent();
    }, [fetchMediaAndLinkedContent]);

    if (loading) {
        return <LoadingSpinner fullScreen={false} />;
    }

    if (error || !media) {
        return (
            <div className="container mt-4">
                <BackLink to="/media" label="Go Back" />
                <div className="alert alert-danger">{error || 'Media not found'}</div>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <BackLink to="/media" label="Back to Media" />

            <article className="card mt-3" style={{ maxWidth: '900px', margin: '24px auto 0' }}>
                <div className="card-body">
                    {/* Header */}
                    <div style={{ marginBottom: '24px' }}>
                        <h1 style={{ color: '#003594', marginBottom: '12px' }}>{media.title}</h1>
                        <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: '16px' }}>
                            <p style={{ margin: '4px 0' }}>
                                📌 {media.source === 'linkedin' ? 'LinkedIn' : 'Featured'} · {new Date(media.created_at).toLocaleDateString()}
                            </p>
                            {media.size && (
                                <p style={{ margin: '4px 0' }}>
                                    📐 Size: <strong>{media.size.charAt(0).toUpperCase() + media.size.slice(1)}</strong>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Featured Image */}
                    {media.image_url && (
                        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                            <img 
                                src={media.image_url} 
                                alt={media.title} 
                                style={{ 
                                    maxWidth: '100%', 
                                    height: 'auto',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    maxHeight: '500px'
                                }} 
                            />
                        </div>
                    )}

                    {/* Description */}
                    {media.description && (
                        <div style={{ 
                            backgroundColor: '#f8f9fa', 
                            padding: '16px', 
                            borderLeft: '4px solid #003594',
                            borderRadius: '4px',
                            marginBottom: '24px',
                            fontStyle: 'italic',
                            color: '#555'
                        }}>
                            <p style={{ margin: 0 }}>{media.description}</p>
                        </div>
                    )}

                    {/* Detailed Content - Linked Article */}
                    {article && (
                        <div
                            className="media-article-content"
                            style={{
                                lineHeight: '1.8',
                                color: '#2B2B2B',
                                fontSize: '1.05rem',
                                marginBottom: '32px',
                                borderTop: '2px solid #e0e0e0',
                                paddingTop: '24px'
                            }}
                        >
                            <h2 style={{ color: '#003594', marginBottom: '12px' }}>📄 {article.title}</h2>
                            <p style={{ color: '#888', marginBottom: '16px' }}>
                                By <strong>{article.author_name}</strong> · {new Date(article.created_at).toLocaleDateString()}
                            </p>
                            <div
                                dangerouslySetInnerHTML={{ __html: article.content }}
                                style={{ marginBottom: '16px' }}
                            />
                        </div>
                    )}

                    {/* No Linked Content Message */}
                    {!article && !survey && (
                        <div style={{
                            marginTop: '32px',
                            paddingTop: '24px',
                            borderTop: '2px solid #e0e0e0',
                            textAlign: 'center',
                            color: '#999',
                        }}>
                            <p style={{ fontSize: '1rem' }}>No linked article or survey attached to this media post.</p>
                        </div>
                    )}
                    {survey && (
                        <div style={{
                            marginTop: '32px',
                            paddingTop: '24px',
                            borderTop: '2px solid #e0e0e0'
                        }}>
                            <h2 style={{ color: '#003594', marginBottom: '12px' }}>📋 Feedback & Survey</h2>
                            <p style={{ color: '#666', marginBottom: '16px' }}>
                                Please share your feedback on this post by completing the survey below.
                            </p>
                            
                            <div style={{
                                backgroundColor: '#f0f4f9',
                                padding: '16px',
                                borderRadius: '8px',
                                marginBottom: '16px'
                            }}>
                                <h3 style={{ color: '#003594', marginTop: 0 }}>{survey.title}</h3>
                                <p style={{ color: '#555', margin: '8px 0 0 0' }}>{survey.description}</p>
                            </div>

                            {alreadySubmitted ? (
                                <>
                                    <button
                                        type="button"
                                        disabled
                                        style={{
                                            display: 'inline-block',
                                            backgroundColor: '#1a6e42',
                                            color: 'white',
                                            padding: '12px 24px',
                                            borderRadius: '6px',
                                            textDecoration: 'none',
                                            fontWeight: '600',
                                            border: 'none',
                                            opacity: 0.7,
                                            cursor: 'not-allowed'
                                        }}
                                    >
                                        ✓ Already Submitted
                                    </button>
                                    <p style={{ color: '#1a6e42', marginTop: '10px', fontSize: '0.9rem' }}>
                                        Submitted on {formatSubmittedAt(submittedAt) || 'N/A'}
                                    </p>
                                </>
                            ) : (
                                <Link
                                    to={`/survey/${survey.id}/take`}
                                    style={{
                                        display: 'inline-block',
                                        backgroundColor: '#003594',
                                        color: 'white',
                                        padding: '12px 24px',
                                        borderRadius: '6px',
                                        textDecoration: 'none',
                                        fontWeight: '600',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#002255'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = '#003594'}
                                >
                                    Take Survey
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </article>
        </div>
    );
};

export default MediaDetailPage;
