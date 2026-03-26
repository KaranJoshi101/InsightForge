import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import surveyService from '../services/surveyService';
import responseService from '../services/responseService';
import LoadingSpinner from '../components/LoadingSpinner';
import BackLink from '../components/BackLink';

const TakeSurveyPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [survey, setSurvey] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [answers, setAnswers] = useState({});
    const [alreadySubmitted, setAlreadySubmitted] = useState(false);

    const getQuestionTypeLabel = (questionType) => {
        switch (questionType) {
            case 'multiple_choice':
                return 'Select one option';
            case 'checkbox':
                return 'Select one or more options';
            case 'rating':
                return 'Choose a rating';
            case 'text':
                return 'Write your response (multi-line)';
            case 'text_only':
                return 'Short text (letters and spaces only)';
            case 'number_only':
                return 'Numbers only';
            default:
                return '';
        }
    };

    const fetchSurvey = useCallback(async () => {
        try {
            setLoading(true);
            const [surveyResponse, userResponsesResponse] = await Promise.all([
                surveyService.getSurveyById(id),
                responseService.getUserResponses(1, 200),
            ]);

            const submittedSurveyIds = new Set(
                (userResponsesResponse.data.responses || []).map((response) => Number(response.survey_id))
            );

            setSurvey(surveyResponse.data.survey);
            setAlreadySubmitted(submittedSurveyIds.has(parseInt(id, 10)));
            setError('');
        } catch (err) {
            setError('Failed to load survey');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchSurvey();
    }, [fetchSurvey]);

    const handleAnswerChange = (questionId, value) => {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: value,
        }));
    };

    const handleCheckboxChange = (questionId, optionId) => {
        setAnswers((prev) => {
            const currentSelections = Array.isArray(prev[questionId]) ? prev[questionId] : [];
            const optionValue = optionId.toString();
            const hasSelection = currentSelections.includes(optionValue);

            return {
                ...prev,
                [questionId]: hasSelection
                    ? currentSelections.filter((selectedId) => selectedId !== optionValue)
                    : [...currentSelections, optionValue],
            };
        });
    };

    const validateAnswers = () => {
        for (const question of survey.questions) {
            if (!question.is_required) {
                continue;
            }

            const value = answers[question.id];

            if ((question.question_type === 'text'
                || question.question_type === 'text_only'
                || question.question_type === 'number_only') && !String(value || '').trim()) {
                return `Please answer question ${question.order_index || ''}: ${question.question_text}`;
            }

            if ((question.question_type === 'multiple_choice' || question.question_type === 'rating') && !value) {
                return `Please select an answer for question ${question.order_index || ''}: ${question.question_text}`;
            }

            if (question.question_type === 'checkbox' && (!Array.isArray(value) || value.length === 0)) {
                return `Please select at least one option for question ${question.order_index || ''}: ${question.question_text}`;
            }

            if (question.question_type === 'text_only' && value && !/^[A-Za-z\s]+$/.test(String(value).trim())) {
                return `Question ${question.order_index || ''} accepts letters and spaces only`;
            }

            if (question.question_type === 'number_only' && value && Number.isNaN(Number(value))) {
                return `Question ${question.order_index || ''} accepts numbers only`;
            }
        }

        return '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (alreadySubmitted) {
            setError('You have already submitted this survey.');
            return;
        }

        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const validationError = validateAnswers();
            if (validationError) {
                setError(validationError);
                setSubmitting(false);
                return;
            }

            // Convert answers object to array format expected by backend.
            const answersArray = survey.questions.flatMap((question) => {
                const rawAnswer = answers[question.id];

                if (question.question_type === 'checkbox') {
                    const selectedOptionIds = Array.isArray(rawAnswer) ? rawAnswer : [];

                    return selectedOptionIds.map((selectedOptionId) => ({
                        question_id: question.id,
                        option_id: parseInt(selectedOptionId, 10),
                    }));
                }

                if (question.question_type === 'multiple_choice') {
                    return rawAnswer
                        ? [{ question_id: question.id, option_id: parseInt(rawAnswer, 10) }]
                        : [];
                }

                if (
                    question.question_type === 'rating'
                    || question.question_type === 'text'
                    || question.question_type === 'text_only'
                    || question.question_type === 'number_only'
                ) {
                    const answerText = String(rawAnswer || '').trim();
                    return answerText ? [{ question_id: question.id, answer_text: answerText }] : [];
                }

                return [];
            });

            await responseService.submitResponse(parseInt(id), answersArray);
            setAlreadySubmitted(true);
            setSuccess('Survey submitted successfully!');
            setTimeout(() => {
                navigate('/responses');
            }, 2000);
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Failed to submit survey';
            setError(errorMsg);

            if (err.response?.status === 409) {
                setAlreadySubmitted(true);
            }

            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <LoadingSpinner fullScreen={false} />;
    }

    if (error && !survey) {
        return (
            <div className="container mt-4">
                <BackLink to="/surveys" label="Go Back" />
                <div className="alert alert-danger">{error}</div>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <div className="survey-form-shell">
            <BackLink to={`/surveys/${id}`} label="Back to Survey" />

            <div className="card survey-form-card">
                <div className="card-body">
                    <h1>{survey?.title}</h1>
                    <p style={{ color: '#555', marginBottom: '24px' }}>Please answer all questions:</p>
                    <div className="survey-meta-row">
                        <span className="survey-meta-chip primary">
                            {survey?.questions?.length || 0} Questions
                        </span>
                        <span className="survey-meta-chip accent">
                            {survey?.questions?.filter((question) => question.is_required).length || 0} Required
                        </span>
                    </div>

                    {error && <div className="alert alert-danger">{error}</div>}
                    {success && <div className="alert alert-success">{success}</div>}

                    <form onSubmit={handleSubmit}>
                        {survey?.questions?.map((question, index) => (
                            <div key={question.id} className="survey-question-card">
                                <div className="survey-question-header">
                                    <label className="survey-question-label">
                                        {index + 1}. {question.question_text}
                                        {question.is_required && <span style={{ color: '#c0392b' }}> *</span>}
                                    </label>
                                    <p className="survey-question-type">{getQuestionTypeLabel(question.question_type)}</p>
                                </div>

                                {question.question_type === 'text' && (
                                    <textarea
                                        value={answers[question.id] || ''}
                                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                        placeholder="Enter your answer"
                                        rows="4"
                                        required={question.is_required}
                                        disabled={alreadySubmitted || submitting}
                                    />
                                )}

                                {question.question_type === 'text_only' && (
                                    <input
                                        type="text"
                                        value={answers[question.id] || ''}
                                        onChange={(e) => handleAnswerChange(question.id, e.target.value.replace(/[^A-Za-z\s]/g, ''))}
                                        placeholder="Letters and spaces only"
                                        required={question.is_required}
                                        disabled={alreadySubmitted || submitting}
                                    />
                                )}

                                {question.question_type === 'number_only' && (
                                    <input
                                        type="number"
                                        value={answers[question.id] || ''}
                                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                        placeholder="Enter a number"
                                        required={question.is_required}
                                        disabled={alreadySubmitted || submitting}
                                    />
                                )}

                                {question.question_type === 'rating' && (
                                    <div className="survey-rating-grid">
                                        {[1, 2, 3, 4, 5].map((rating) => (
                                            <label
                                                key={rating}
                                                className={`survey-rating-option ${parseInt(answers[question.id]) === rating ? 'selected' : ''}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name={`rating-${question.id}`}
                                                    value={rating}
                                                    checked={parseInt(answers[question.id]) === rating}
                                                    onChange={() => handleAnswerChange(question.id, rating.toString())}
                                                    required={question.is_required}
                                                    disabled={alreadySubmitted || submitting}
                                                />
                                                <span className="survey-rating-value">{rating}</span>
                                                <span className="survey-rating-caption">out of 5</span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {(question.question_type === 'multiple_choice' || question.question_type === 'checkbox') && (
                                    <div className="survey-choice-group">
                                        {question.options?.map((option) => (
                                            (() => {
                                                const isSelected = question.question_type === 'checkbox'
                                                    ? Array.isArray(answers[question.id]) && answers[question.id].includes(option.id.toString())
                                                    : parseInt(answers[question.id]) === option.id;

                                                return (
                                            <label
                                                key={option.id}
                                                className={`survey-choice-option ${isSelected ? 'selected' : ''}`}
                                            >
                                                <input
                                                    type={question.question_type === 'checkbox' ? 'checkbox' : 'radio'}
                                                    name={`option-${question.id}`}
                                                    value={option.id}
                                                    checked={isSelected}
                                                    onChange={() => (
                                                        question.question_type === 'checkbox'
                                                            ? handleCheckboxChange(question.id, option.id)
                                                            : handleAnswerChange(question.id, option.id.toString())
                                                    )}
                                                    required={question.is_required && question.question_type === 'multiple_choice'}
                                                    disabled={alreadySubmitted || submitting}
                                                />
                                                {option.option_text}
                                            </label>
                                                );
                                            })()
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        <button
                            type="submit"
                            className="btn btn-success btn-block survey-submit-btn"
                            disabled={submitting || alreadySubmitted}
                        >
                            {alreadySubmitted ? '✓ Already Submitted' : (submitting ? 'Submitting...' : 'Submit Survey')}
                        </button>
                    </form>
                </div>
            </div>
            </div>
        </div>
    );
};

export default TakeSurveyPage;
