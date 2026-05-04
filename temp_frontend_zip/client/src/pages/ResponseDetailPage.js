import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import responseService from '../services/responseService';
import LoadingSpinner from '../components/LoadingSpinner';
import BackLink from '../components/BackLink';

const getAnswerLabel = (answer) => {
    if (answer.question_type === 'checkbox' || answer.question_type === 'multiple_choice') {
        return answer.option_text || 'No option selected';
    }

    if (answer.question_type === 'rating') {
        return answer.answer_text ? `${answer.answer_text} / 5` : 'No rating given';
    }

    return answer.answer_text || 'No response provided';
};

const ResponseDetailPage = () => {
    const { id } = useParams();
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchResponse = useCallback(async () => {
        try {
            setLoading(true);
            const apiResponse = await responseService.getResponseDetails(id);
            setResponse(apiResponse.data.response);
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load response details');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchResponse();
    }, [fetchResponse]);

    if (loading) {
        return <LoadingSpinner fullScreen={false} />;
    }

    if (error || !response) {
        return (
            <div className="container mt-4">
                <BackLink to="/responses" label="Go Back" />
                <div className="alert alert-danger">{error || 'Response not found'}</div>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <div className="responses-shell">
            <BackLink to="/responses" label="Back to My Responses" />

            <div className="card survey-form-card">
                <div className="card-body">
                    <h1 style={{ marginBottom: '8px' }}>{response.survey_title || `Survey #${response.survey_id}`}</h1>
                    <p style={{ color: '#666', marginBottom: '20px' }}>
                        Submitted on {new Date(response.submitted_at).toLocaleString()}
                    </p>

                    <div className="survey-meta-row">
                        <span className="survey-meta-chip primary">
                            {response.answers?.length || 0} Answers
                        </span>
                        <span className="survey-meta-chip accent">
                            Response #{response.id}
                        </span>
                    </div>

                    <div style={{ display: 'grid', gap: '14px' }}>
                        {response.answers?.map((answer, index) => (
                            <div key={answer.id} className="survey-question-card" style={{ marginBottom: 0 }}>
                                <div className="survey-question-header">
                                    <label className="survey-question-label">
                                        {index + 1}. {answer.question_text}
                                    </label>
                                    <p className="survey-question-type" style={{ textTransform: 'capitalize' }}>
                                        {answer.question_type.replace('_', ' ')}
                                    </p>
                                </div>
                                <div className="response-answer-box">
                                    {getAnswerLabel(answer)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
};

export default ResponseDetailPage;
