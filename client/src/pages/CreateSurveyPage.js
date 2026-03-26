import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import surveyService from '../services/surveyService';
import LoadingSpinner from '../components/LoadingSpinner';

const QUESTION_TYPES = [
    { value: 'text', label: 'Long Text' },
    { value: 'text_only', label: 'Short Text' },
    { value: 'number_only', label: 'Number Only' },
    { value: 'multiple_choice', label: 'Multiple Choice' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'rating', label: 'Rating Scale' },
];

const OPTION_BASED_TYPES = new Set(['multiple_choice', 'checkbox']);

const QUESTION_TYPE_HINTS = {
    text: 'Multi-line free-form response. Users can enter any text across multiple lines.',
    text_only: 'Single-line text. Accepts letters and spaces only — no numbers or symbols.',
    number_only: 'Numeric response only. Useful for age, count, score, etc.',
    multiple_choice: 'Users select one option. Add at least 2 options below.',
    checkbox: 'Users can select multiple options. Add at least 2 options below.',
    rating: 'Users choose a score from 1 to 5.',
};

const makeLocalId = () => `local_${Date.now()}_${Math.random().toString(16).slice(2)}`;

const normalizeOptions = (options) => (options || [])
    .filter((option) => option && (
        option.id
        || option.localId
        || String(option.option_text || '').trim().length > 0
    ))
    .map((option, index) => ({
        id: option.id,
        localId: option.localId || makeLocalId(),
        option_text: option.option_text || '',
        order_index: option.order_index ?? index + 1,
    }));

const normalizeQuestions = (questions) => (questions || []).map((question, index) => ({
    id: question.id,
    localId: question.localId || makeLocalId(),
    question_text: question.question_text || '',
    question_type: question.question_type || 'text',
    is_required: question.is_required !== false,
    order_index: question.order_index ?? index + 1,
    options: normalizeOptions(question.options),
}));

const CreateSurveyPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [submissionEmailSubject, setSubmissionEmailSubject] = useState('');
    const [submissionEmailBody, setSubmissionEmailBody] = useState('');
    const [submissionEmailAttachments, setSubmissionEmailAttachments] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [originalQuestions, setOriginalQuestions] = useState([]);

    const [loading, setLoading] = useState(isEditMode);
    const [submitting, setSubmitting] = useState(false);
    const [uploadingAttachments, setUploadingAttachments] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const successTimerRef = useRef(null);

    const clearSuccessSoon = () => {
        if (successTimerRef.current) {
            clearTimeout(successTimerRef.current);
        }
        successTimerRef.current = setTimeout(() => setSuccess(''), 2500);
    };

    useEffect(() => () => {
        if (successTimerRef.current) {
            clearTimeout(successTimerRef.current);
        }
    }, []);

    useEffect(() => {
        if (!isEditMode) {
            setLoading(false);
            return;
        }

        const fetchSurvey = async () => {
            try {
                const response = await surveyService.getSurveyById(id);
                const survey = response.data?.survey;

                setTitle(survey?.title || '');
                setDescription(survey?.description || '');
                setSubmissionEmailSubject(survey?.submission_email_subject || '');
                setSubmissionEmailBody(survey?.submission_email_body || '');
                setSubmissionEmailAttachments(Array.isArray(survey?.submission_email_attachments) ? survey.submission_email_attachments : []);

                const normalized = normalizeQuestions(survey?.questions || []);
                setQuestions(normalized);
                setOriginalQuestions(normalized);
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to load survey');
            } finally {
                setLoading(false);
            }
        };

        fetchSurvey();
    }, [id, isEditMode]);

    const canSubmit = useMemo(() => {
        return title.trim().length > 0 && !submitting;
    }, [title, submitting]);

    const handleAttachmentFilesSelected = async (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) {
            return;
        }

        try {
            setUploadingAttachments(true);
            const response = await surveyService.uploadSurveyEmailAttachments(files);
            const uploaded = Array.isArray(response.data?.attachments) ? response.data.attachments : [];
            setSubmissionEmailAttachments((prev) => [...prev, ...uploaded]);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to upload email attachments');
        } finally {
            setUploadingAttachments(false);
            event.target.value = '';
        }
    };

    const removeAttachment = (indexToRemove) => {
        setSubmissionEmailAttachments((prev) => prev.filter((_, index) => index !== indexToRemove));
    };

    const addQuestion = () => {
        setQuestions((prev) => [
            ...prev,
            {
                localId: makeLocalId(),
                question_text: '',
                question_type: 'text',
                is_required: true,
                order_index: prev.length + 1,
                options: [],
            },
        ]);
    };

    const updateQuestion = (localId, updater) => {
        setQuestions((prev) => prev.map((question, index) => {
            if (question.localId !== localId) {
                return { ...question, order_index: index + 1 };
            }

            const next = typeof updater === 'function' ? updater(question) : { ...question, ...updater };
            const requiresOptions = OPTION_BASED_TYPES.has(next.question_type);
            return {
                ...next,
                order_index: index + 1,
                options: requiresOptions ? normalizeOptions(next.options) : [],
            };
        }));
    };

    const removeQuestion = (localId) => {
        setQuestions((prev) => prev
            .filter((question) => question.localId !== localId)
            .map((question, index) => ({ ...question, order_index: index + 1 })));
    };

    const addOption = (questionLocalId) => {
        updateQuestion(questionLocalId, (question) => ({
            ...question,
            options: [
                ...(question.options || []),
                {
                    localId: makeLocalId(),
                    option_text: '',
                    order_index: (question.options?.length || 0) + 1,
                },
            ],
        }));
    };

    const updateOption = (questionLocalId, optionLocalId, optionText) => {
        updateQuestion(questionLocalId, (question) => ({
            ...question,
            options: (question.options || []).map((option, index) => (
                option.localId === optionLocalId
                    ? { ...option, option_text: optionText, order_index: index + 1 }
                    : { ...option, order_index: index + 1 }
            )),
        }));
    };

    const removeOption = (questionLocalId, optionLocalId) => {
        updateQuestion(questionLocalId, (question) => ({
            ...question,
            options: (question.options || [])
                .filter((option) => option.localId !== optionLocalId)
                .map((option, index) => ({ ...option, order_index: index + 1 })),
        }));
    };

    const validateDraft = () => {
        if (!title.trim()) {
            return 'Survey title is required';
        }

        for (let i = 0; i < questions.length; i += 1) {
            const question = questions[i];
            if (!question.question_text.trim()) {
                return `Question ${i + 1} text is required`;
            }

            if (OPTION_BASED_TYPES.has(question.question_type)) {
                const nonEmptyOptions = (question.options || [])
                    .map((option) => option.option_text.trim())
                    .filter(Boolean);

                if (nonEmptyOptions.length < 2) {
                    return `Question ${i + 1} needs at least 2 options`;
                }
            }
        }

        return '';
    };

    const syncOptions = async (questionId, newQuestion, oldQuestion) => {
        const prevOptions = oldQuestion?.options || [];
        const nextOptions = (newQuestion.options || [])
            .map((option, index) => ({ ...option, order_index: index + 1 }))
            .filter((option) => option.option_text.trim());

        const nextOptionIds = new Set(nextOptions.filter((option) => option.id).map((option) => option.id));

        for (const option of prevOptions) {
            if (!nextOptionIds.has(option.id)) {
                await surveyService.deleteOption(option.id);
            }
        }

        for (const option of nextOptions) {
            if (option.id) {
                await surveyService.updateOption(option.id, {
                    option_text: option.option_text.trim(),
                    order_index: option.order_index,
                });
            } else {
                await surveyService.addOption(
                    questionId,
                    option.option_text.trim(),
                    option.order_index
                );
            }
        }
    };

    const syncQuestions = async (surveyId) => {
        const prevById = new Map(originalQuestions.filter((q) => q.id).map((q) => [q.id, q]));

        const nextQuestions = questions
            .map((question, index) => ({ ...question, order_index: index + 1 }))
            .filter((question) => question.question_text.trim());

        const nextQuestionIds = new Set(nextQuestions.filter((q) => q.id).map((q) => q.id));

        for (const original of originalQuestions) {
            if (original.id && !nextQuestionIds.has(original.id)) {
                await surveyService.deleteQuestion(original.id);
            }
        }

        for (const question of nextQuestions) {
            const payload = {
                question_text: question.question_text.trim(),
                question_type: question.question_type,
                is_required: question.is_required,
                order_index: question.order_index,
            };

            if (question.id) {
                await surveyService.updateQuestion(question.id, payload);
                const oldQuestion = prevById.get(question.id);

                if (OPTION_BASED_TYPES.has(question.question_type)) {
                    await syncOptions(question.id, question, oldQuestion);
                } else if ((oldQuestion?.options || []).length > 0) {
                    for (const option of oldQuestion.options) {
                        await surveyService.deleteOption(option.id);
                    }
                }
            } else {
                const response = await surveyService.addQuestion(
                    surveyId,
                    payload.question_text,
                    payload.question_type,
                    payload.is_required,
                    payload.order_index
                );

                if (OPTION_BASED_TYPES.has(question.question_type)) {
                    const createdQuestionId = response.data?.question?.id;
                    const options = (question.options || [])
                        .map((option, index) => ({ ...option, order_index: index + 1 }))
                        .filter((option) => option.option_text.trim());

                    for (const option of options) {
                        await surveyService.addOption(
                            createdQuestionId,
                            option.option_text.trim(),
                            option.order_index
                        );
                    }
                }
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const validationError = validateDraft();
        if (validationError) {
            setError(validationError);
            return;
        }

        setSubmitting(true);

        try {
            let surveyId = id;

            if (isEditMode) {
                await surveyService.updateSurvey(id, {
                    title: title.trim(),
                    description: description.trim() || null,
                    submission_email_subject: submissionEmailSubject.trim() || null,
                    submission_email_body: submissionEmailBody.trim() || null,
                    submission_email_attachments: submissionEmailAttachments,
                });
            } else {
                const createResponse = await surveyService.createSurvey({
                    title: title.trim(),
                    description: description.trim() || null,
                    submission_email_subject: submissionEmailSubject.trim() || null,
                    submission_email_body: submissionEmailBody.trim() || null,
                    submission_email_attachments: submissionEmailAttachments,
                });
                surveyId = createResponse.data?.survey?.id;
            }

            await syncQuestions(surveyId);

            const refreshed = await surveyService.getSurveyById(surveyId);
            const normalized = normalizeQuestions(refreshed.data?.survey?.questions || []);
            setQuestions(normalized);
            setOriginalQuestions(normalized);

            setSuccess(isEditMode ? 'Survey updated successfully.' : 'Survey created successfully.');
            clearSuccessSoon();

            if (!isEditMode) {
                navigate(`/admin/surveys/${surveyId}/edit`);
            }
        } catch (err) {
            setError(err.response?.data?.error || `Failed to ${isEditMode ? 'update' : 'create'} survey`);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="container mt-4" style={{ maxWidth: '980px' }}>
            <Link to="/admin/surveys" style={{ color: '#003594', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <FaArrowLeft size={12} aria-hidden="true" />
                Back to Manage Surveys
            </Link>

            <div className="card mt-3">
                <div className="card-body">
                    <h1 style={{ marginBottom: '8px' }}>{isEditMode ? 'Update Survey' : 'Create Survey'}</h1>
                    <p style={{ color: '#666', marginTop: 0 }}>
                        {isEditMode
                            ? 'Edit title, description, questions, and options in one place, then update at the bottom.'
                            : 'Build the full survey now: title, description, questions, and options.'}
                    </p>

                    {error && <div className="alert alert-danger">{error}</div>}
                    {success && <div className="alert alert-success">{success}</div>}

                    <form
                        onSubmit={handleSubmit}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.type !== 'submit') {
                                e.preventDefault();
                            }
                        }}
                    >
                        <div className="form-group">
                            <label>Survey Title *</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter survey title"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe what this survey is about"
                                rows="4"
                            />
                        </div>

                        <div style={{ marginTop: '20px', border: '1px solid #dbe4f2', borderRadius: '8px', padding: '16px', backgroundColor: '#f9fbff' }}>
                            <h3 style={{ margin: '0 0 10px 0', color: '#003594' }}>Submission Email</h3>
                            <p style={{ marginTop: 0, color: '#5a6f95', fontSize: '0.9rem' }}>
                                A confirmation email is automatically sent when a user submits this survey.
                                Leave fields blank to use the default generic email.
                                You can use tokens: {'{{user_name}}'}, {'{{survey_title}}'}, {'{{submitted_at}}'}.
                            </p>

                            <div className="form-group">
                                <label>Custom Email Subject (Optional)</label>
                                <input
                                    type="text"
                                    value={submissionEmailSubject}
                                    onChange={(e) => setSubmissionEmailSubject(e.target.value)}
                                    placeholder="Thanks for submitting {{survey_title}}"
                                    maxLength={255}
                                />
                            </div>

                            <div className="form-group">
                                <label>Custom Email Body (Optional)</label>
                                <textarea
                                    value={submissionEmailBody}
                                    onChange={(e) => setSubmissionEmailBody(e.target.value)}
                                    placeholder="Hello {{user_name}}, thank you for completing {{survey_title}}."
                                    rows="5"
                                    maxLength={10000}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Add Email Attachments (Optional)</label>
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleAttachmentFilesSelected}
                                    disabled={uploadingAttachments}
                                />
                                <p style={{ margin: '6px 0 0 0', color: '#5a6f95', fontSize: '0.85rem' }}>
                                    You can attach files that will be included in each submission confirmation email.
                                </p>

                                {uploadingAttachments && (
                                    <p style={{ margin: '8px 0 0 0', color: '#003594', fontSize: '0.9rem' }}>
                                        Uploading attachments...
                                    </p>
                                )}

                                {submissionEmailAttachments.length > 0 && (
                                    <div style={{ marginTop: '10px' }}>
                                        {submissionEmailAttachments.map((attachment, index) => (
                                            <div
                                                key={`${attachment.name}-${index}`}
                                                style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center', marginBottom: '6px', backgroundColor: '#fff', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e4e9f5' }}
                                            >
                                                <span style={{ fontSize: '0.9rem', color: '#2b2b2b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {attachment.name}
                                                </span>
                                                <button
                                                    type="button"
                                                    className="btn btn-danger"
                                                    style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                                                    onClick={() => removeAttachment(index)}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ marginTop: '28px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0 }}>Questions</h2>
                            <button
                                type="button"
                                className="btn btn-success"
                                onClick={addQuestion}
                            >
                                + Add Question
                            </button>
                        </div>

                        {questions.length === 0 && (
                            <div
                                style={{
                                    padding: '18px',
                                    border: '1px dashed #b7c7e6',
                                    borderRadius: '8px',
                                    color: '#4a5b7a',
                                    marginBottom: '18px',
                                    backgroundColor: '#f7faff',
                                }}
                            >
                                No questions yet. Add at least one question to complete the survey.
                            </div>
                        )}

                        {questions.map((question, index) => {
                            const usesOptions = OPTION_BASED_TYPES.has(question.question_type);
                            return (
                                <div
                                    key={question.localId}
                                    style={{
                                        border: '1px solid #dbe4f2',
                                        borderRadius: '8px',
                                        padding: '16px',
                                        marginBottom: '14px',
                                        backgroundColor: '#fff',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                                        <strong style={{ color: '#003594' }}>Question {index + 1}</strong>
                                        <button
                                            type="button"
                                            className="btn btn-danger"
                                            style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                                            onClick={() => removeQuestion(question.localId)}
                                        >
                                            Remove
                                        </button>
                                    </div>

                                    <div className="form-group">
                                        <label>Question Text *</label>
                                        <textarea
                                            value={question.question_text}
                                            onChange={(e) => updateQuestion(question.localId, { question_text: e.target.value })}
                                            placeholder="Enter your question"
                                            rows="2"
                                            required
                                        />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'end' }}>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label>Question Type</label>
                                            <select
                                                value={question.question_type}
                                                onChange={(e) => updateQuestion(question.localId, { question_type: e.target.value })}
                                            >
                                                {QUESTION_TYPES.map((item) => (
                                                    <option key={item.value} value={item.value}>{item.label}</option>
                                                ))}
                                            </select>
                                            <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: '#5a6f95' }}>
                                                {QUESTION_TYPE_HINTS[question.question_type]}
                                            </p>
                                        </div>

                                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                                            <input
                                                type="checkbox"
                                                checked={question.is_required}
                                                onChange={(e) => updateQuestion(question.localId, { is_required: e.target.checked })}
                                            />
                                            Required
                                        </label>
                                    </div>

                                    {usesOptions && (
                                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #edf1f7' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <strong>Options</strong>
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary"
                                                    style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                                                    onClick={() => addOption(question.localId)}
                                                >
                                                    + Add Option
                                                </button>
                                            </div>

                                            {(question.options || []).length === 0 && (
                                                <p style={{ color: '#666', margin: 0, fontSize: '0.9rem' }}>
                                                    Add at least 2 options for this question type.
                                                </p>
                                            )}

                                            {(question.options || []).map((option, optionIndex) => (
                                                <div key={option.localId} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                                                    <span style={{ width: '24px', color: '#6d7ea3', fontSize: '0.85rem' }}>{optionIndex + 1}.</span>
                                                    <input
                                                        type="text"
                                                        value={option.option_text}
                                                        onChange={(e) => updateOption(question.localId, option.localId, e.target.value)}
                                                        placeholder="Option text"
                                                        style={{ flex: 1 }}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="btn btn-danger"
                                                        style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                                                        onClick={() => removeOption(question.localId, option.localId)}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        <button
                            type="submit"
                            className="btn btn-primary btn-block"
                            disabled={!canSubmit}
                            style={{ marginTop: '20px', width: '100%', padding: '12px 16px', fontWeight: 700 }}
                        >
                            {submitting
                                ? (isEditMode ? 'Updating Survey...' : 'Creating Survey...')
                                : (isEditMode ? 'Update Survey' : 'Create Survey')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateSurveyPage;
