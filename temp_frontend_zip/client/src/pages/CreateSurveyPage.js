import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import surveyService from '../services/surveyService';
import { useToast } from '../context/ToastContext';
import { validateSurvey } from '../utils/validation';
import LoadingSpinner from '../components/LoadingSpinner';
import QuestionCard from '../components/QuestionCard';
import SurveySettingsPanel from '../components/SurveySettingsPanel';
import Button from '../components/ui/Button';
import Card, { CardBody, CardHeader } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';

const QUESTION_TYPES = [
    { value: 'text', label: 'Long Text' },
    { value: 'text_only', label: 'Short Text' },
    { value: 'number_only', label: 'Number Only' },
    { value: 'multiple_choice', label: 'Multiple Choice' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'rating', label: 'Rating Scale' },
];

const OPTION_BASED_TYPES = new Set(['multiple_choice', 'checkbox']);

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
    description: question.description || '',
    help_text: question.help_text || '',
    order_index: question.order_index ?? index + 1,
    options: normalizeOptions(question.options),
}));

const serializeSurveyState = ({
    title,
    description,
    submissionEmailSubject,
    submissionEmailBody,
    submissionEmailAttachments,
    surveySettings,
    questions,
}) => JSON.stringify({
    title: (title || '').trim(),
    description: (description || '').trim(),
    submissionEmailSubject: (submissionEmailSubject || '').trim(),
    submissionEmailBody: (submissionEmailBody || '').trim(),
    submissionEmailAttachments: (submissionEmailAttachments || []).map((item) => (
        item?.path || item?.url || item?.name || ''
    )),
    surveySettings: {
        allow_multiple_submissions: Boolean(surveySettings?.allow_multiple_submissions),
        is_anonymous: Boolean(surveySettings?.is_anonymous),
        collect_email: Boolean(surveySettings?.collect_email),
        expiry_date: surveySettings?.expiry_date || null,
    },
    questions: (questions || []).map((question, index) => ({
        id: question.id || null,
        question_text: (question.question_text || '').trim(),
        question_type: question.question_type || 'text',
        is_required: question.is_required !== false,
        description: (question.description || '').trim(),
        help_text: (question.help_text || '').trim(),
        order_index: question.order_index ?? index + 1,
        options: (question.options || []).map((option, optionIndex) => ({
            id: option.id || null,
            option_text: (option.option_text || '').trim(),
            order_index: option.order_index ?? optionIndex + 1,
        })),
    })),
});

const CreateSurveyPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { addToast } = useToast();
    const isEditMode = !!id;

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [submissionEmailSubject, setSubmissionEmailSubject] = useState('');
    const [submissionEmailBody, setSubmissionEmailBody] = useState('');
    const [submissionEmailAttachments, setSubmissionEmailAttachments] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [originalQuestions, setOriginalQuestions] = useState([]);

    // UI state
    const [loading, setLoading] = useState(isEditMode);
    const [submitting, setSubmitting] = useState(false);
    const [uploadingAttachments, setUploadingAttachments] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Advanced features state
    const [previewMode, setPreviewMode] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [autosaving, setAutosaving] = useState(false);
    const [draggedQuestion, setDraggedQuestion] = useState(null);
    const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);

    const [surveySettings, setSurveySettings] = useState({
        allow_multiple_submissions: false,
        is_anonymous: false,
        collect_email: false,
        expiry_date: null,
    });

    // Refs for autosave and timers
    const autosaveTimerRef = useRef(null);
    const successTimerRef = useRef(null);
    const unsavedChangesRef = useRef(false);
    const lastSavedStateRef = useRef('');

    // Cleanup on unmount
    useEffect(() => {
        lastSavedStateRef.current = serializeSurveyState({
            title: '',
            description: '',
            submissionEmailSubject: '',
            submissionEmailBody: '',
            submissionEmailAttachments: [],
            surveySettings: {
                allow_multiple_submissions: false,
                is_anonymous: false,
                collect_email: false,
                expiry_date: null,
            },
            questions: [],
        });

        return () => {
            if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
            if (successTimerRef.current) clearTimeout(successTimerRef.current);
        };
    }, []);

    // Warn on unsaved changes before leaving
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (unsavedChangesRef.current && !submitting) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [submitting]);

    // Load survey data
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

                setSurveySettings({
                    allow_multiple_submissions: survey?.allow_multiple_submissions || false,
                    is_anonymous: survey?.is_anonymous || false,
                    collect_email: survey?.collect_email || false,
                    expiry_date: survey?.expiry_date || null,
                });

                const normalized = normalizeQuestions(survey?.questions || []);
                lastSavedStateRef.current = serializeSurveyState({
                    title: survey?.title || '',
                    description: survey?.description || '',
                    submissionEmailSubject: survey?.submission_email_subject || '',
                    submissionEmailBody: survey?.submission_email_body || '',
                    submissionEmailAttachments: Array.isArray(survey?.submission_email_attachments)
                        ? survey.submission_email_attachments
                        : [],
                    surveySettings: {
                        allow_multiple_submissions: survey?.allow_multiple_submissions || false,
                        is_anonymous: survey?.is_anonymous || false,
                        collect_email: survey?.collect_email || false,
                        expiry_date: survey?.expiry_date || null,
                    },
                    questions: normalized,
                });
                setQuestions(normalized);
                setOriginalQuestions(normalized);
                unsavedChangesRef.current = false;
            } catch (err) {
                addToast(err.response?.data?.error || 'Failed to load survey', 'error');
                setError(err.response?.data?.error || 'Failed to load survey');
            } finally {
                setLoading(false);
            }
        };

        fetchSurvey();
    }, [id, isEditMode, addToast]);

    // Track unsaved changes
    useEffect(() => {
        const currentSnapshot = serializeSurveyState({
            title,
            description,
            submissionEmailSubject,
            submissionEmailBody,
            submissionEmailAttachments,
            surveySettings,
            questions,
        });

        unsavedChangesRef.current = currentSnapshot !== lastSavedStateRef.current;
    }, [title, description, questions, surveySettings, submissionEmailSubject, submissionEmailBody, submissionEmailAttachments]);

    // Autosave functionality (debounced)
    useEffect(() => {
        if (!isEditMode || !unsavedChangesRef.current) {
            return;
        }

        if (autosaveTimerRef.current) {
            clearTimeout(autosaveTimerRef.current);
        }

        autosaveTimerRef.current = setTimeout(async () => {
            if (!id) return;

            try {
                setAutosaving(true);
                await surveyService.autosaveSurvey(id, {
                    title,
                    description,
                    questions: questions.map((q) => ({
                        ...q,
                        localId: undefined,
                    })),
                    settings: surveySettings,
                });
                lastSavedStateRef.current = serializeSurveyState({
                    title,
                    description,
                    submissionEmailSubject,
                    submissionEmailBody,
                    submissionEmailAttachments,
                    surveySettings,
                    questions,
                });
                unsavedChangesRef.current = false;
                addToast('Draft saved automatically', 'info');
            } catch (err) {
                console.error('Autosave failed:', err);
            } finally {
                setAutosaving(false);
            }
        }, 5000); // Autosave after 5 seconds of inactivity
    }, [
        id,
        isEditMode,
        title,
        description,
        questions,
        surveySettings,
        submissionEmailSubject,
        submissionEmailBody,
        submissionEmailAttachments,
        addToast,
    ]);

    const canSubmit = useMemo(() => {
        return title.trim().length > 0 && !submitting && !autosaving;
    }, [title, submitting, autosaving]);

    const clearSuccessSoon = () => {
        if (successTimerRef.current) clearTimeout(successTimerRef.current);
        successTimerRef.current = setTimeout(() => setSuccess(''), 2500);
    };

    const handleAttachmentFilesSelected = async (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        try {
            setUploadingAttachments(true);
            const response = await surveyService.uploadSurveyEmailAttachments(files);
            const uploaded = Array.isArray(response.data?.attachments) ? response.data.attachments : [];
            setSubmissionEmailAttachments((prev) => [...prev, ...uploaded]);
            addToast('Attachments uploaded successfully', 'success');
        } catch (err) {
            addToast(err.response?.data?.error || 'Failed to upload attachments', 'error');
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
                description: '',
                help_text: '',
                order_index: prev.length + 1,
                options: [],
            },
        ]);
        addToast('Question added', 'info');
    };

    const duplicateQuestion = (index) => {
        const question = questions[index];
        const newQuestion = {
            ...question,
            id: undefined,
            localId: makeLocalId(),
            options: (question.options || []).map((opt) => ({
                ...opt,
                id: undefined,
                localId: makeLocalId(),
            })),
        };
        setQuestions((prev) => {
            const updated = [...prev];
            updated.splice(index + 1, 0, newQuestion);
            return updated.map((q, i) => ({ ...q, order_index: i + 1 }));
        });
        addToast('Question duplicated', 'info');
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
        addToast('Question removed', 'info');
    };

    // Drag and drop support
    const handleDragStart = (index) => {
        setDraggedQuestion(index);
    };

    const handleQuestionMove = (targetIndex) => {
        if (draggedQuestion === null || draggedQuestion === targetIndex) return;

        setQuestions((prev) => {
            const reordered = [...prev];
            const [moved] = reordered.splice(draggedQuestion, 1);
            reordered.splice(targetIndex, 0, moved);
            return reordered.map((question, index) => ({
                ...question,
                order_index: index + 1,
            }));
        });

        setDraggedQuestion(targetIndex);
    };

    const handleDragEnd = () => {
        setDraggedQuestion(null);
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
        const validation = validateSurvey({
            title,
            questions,
        });

        if (!validation.valid) {
            return validation.errors[0];
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
        const seenQuestionIds = new Set();

        const nextQuestions = questions
            .map((question, index) => {
                const normalizedQuestion = { ...question, order_index: index + 1 };

                if (normalizedQuestion.id && seenQuestionIds.has(normalizedQuestion.id)) {
                    normalizedQuestion.id = undefined;
                }

                if (normalizedQuestion.id) {
                    seenQuestionIds.add(normalizedQuestion.id);
                }

                if (Array.isArray(normalizedQuestion.options)) {
                    const seenOptionIds = new Set();
                    normalizedQuestion.options = normalizedQuestion.options.map((option) => {
                        const normalizedOption = { ...option };
                        if (normalizedOption.id && seenOptionIds.has(normalizedOption.id)) {
                            normalizedOption.id = undefined;
                        }
                        if (normalizedOption.id) {
                            seenOptionIds.add(normalizedOption.id);
                        }
                        return normalizedOption;
                    });
                }

                return normalizedQuestion;
            })
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
                description: question.description || null,
                help_text: question.help_text || null,
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
                const response = await surveyService.addQuestion(surveyId, payload);

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
            addToast(validationError, 'error');
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
                    ...surveySettings,
                });
            } else {
                const createResponse = await surveyService.createSurvey({
                    title: title.trim(),
                    description: description.trim() || null,
                    submission_email_subject: submissionEmailSubject.trim() || null,
                    submission_email_body: submissionEmailBody.trim() || null,
                    submission_email_attachments: submissionEmailAttachments,
                    ...surveySettings,
                });
                surveyId = createResponse.data?.survey?.id;
            }

            await syncQuestions(surveyId);

            const refreshed = await surveyService.getSurveyById(surveyId);
            const normalized = normalizeQuestions(refreshed.data?.survey?.questions || []);
            setQuestions(normalized);
            setOriginalQuestions(normalized);
            lastSavedStateRef.current = serializeSurveyState({
                title,
                description,
                submissionEmailSubject,
                submissionEmailBody,
                submissionEmailAttachments,
                surveySettings,
                questions: normalized,
            });
            unsavedChangesRef.current = false;

            const message = isEditMode ? 'Survey updated successfully.' : 'Survey created successfully.';
            addToast(message, 'success');
            setSuccess(message);
            clearSuccessSoon();

            if (!isEditMode) {
                navigate(`/admin/surveys/${surveyId}/edit`);
            }
        } catch (err) {
            const errorMsg = err.response?.data?.error || `Failed to ${isEditMode ? 'update' : 'create'} survey`;
            addToast(errorMsg, 'error');
            setError(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
                <Link to="/admin/surveys" className="text-sm font-medium text-slate-600 transition-all duration-200 hover:text-slate-900">
                    Back to Manage Surveys
                </Link>
                {autosaving && <span className="text-xs text-slate-500">Saving draft...</span>}
            </div>

            <Card>
                <CardHeader className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">{isEditMode ? 'Update Survey' : 'Create Survey'}</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            {isEditMode ? 'Edit survey details, questions, and settings.' : 'Build your survey with questions and settings.'}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => setPreviewMode(!previewMode)}>
                            {previewMode ? 'Edit Mode' : 'Preview'}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setShowSettings(!showSettings)}>
                            {showSettings ? 'Hide Settings' : 'Show Settings'}
                        </Button>
                    </div>
                </CardHeader>
                <CardBody>
                    {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
                    {success && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <h2 className="text-base font-semibold text-slate-900">Basic Information</h2>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Survey Title</label>
                                <Input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter survey title"
                                    required
                                    maxLength={255}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Description</label>
                                <Textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe what this survey is about"
                                    rows={3}
                                />
                            </div>
                        </div>

                        {!previewMode && (
                            <>
                                <Card>
                                    <CardHeader>
                                        <h2 className="text-base font-semibold text-slate-900">Submission Email</h2>
                                    </CardHeader>
                                    <CardBody className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">Custom Email Subject (Optional)</label>
                                            <Input
                                                type="text"
                                                value={submissionEmailSubject}
                                                onChange={(e) => setSubmissionEmailSubject(e.target.value)}
                                                placeholder="Thanks for submitting {{survey_title}}"
                                                maxLength={255}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">Custom Email Body (Optional)</label>
                                            <Textarea
                                                value={submissionEmailBody}
                                                onChange={(e) => setSubmissionEmailBody(e.target.value)}
                                                placeholder="Hello {{user_name}}, thank you for completing {{survey_title}}."
                                                rows={5}
                                                maxLength={10000}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">Add Email Attachments (Optional)</label>
                                            <Input type="file" multiple onChange={handleAttachmentFilesSelected} disabled={uploadingAttachments} />
                                            {uploadingAttachments && <p className="text-xs text-slate-500">Uploading attachments...</p>}
                                            {submissionEmailAttachments.length > 0 && (
                                                <div className="space-y-2 pt-2">
                                                    {submissionEmailAttachments.map((attachment, index) => (
                                                        <div key={`${attachment.name}-${index}`} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                                            <span className="truncate text-sm text-slate-700">{attachment.name}</span>
                                                            <Button type="button" variant="danger" size="sm" onClick={() => removeAttachment(index)}>Remove</Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </CardBody>
                                </Card>

                                {showSettings && <SurveySettingsPanel settings={surveySettings} onChange={setSurveySettings} />}

                                <Card>
                                    <CardHeader className="flex items-center justify-between">
                                        <h2 className="text-base font-semibold text-slate-900">Questions ({questions.length})</h2>
                                        <Button type="button" onClick={addQuestion}>Add Question</Button>
                                    </CardHeader>
                                    <CardBody className="space-y-3">
                                        {questions.length === 0 && (
                                            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
                                                No questions yet. Add at least one question to complete the survey.
                                            </div>
                                        )}

                                        <div className="space-y-3">
                                            {questions.map((question, index) => (
                                                <QuestionCard
                                                    key={question.localId}
                                                    question={question}
                                                    index={index}
                                                    totalQuestions={questions.length}
                                                    isEditing={editingQuestionIndex === index}
                                                    isDragging={draggedQuestion === index}
                                                    onDragStart={() => handleDragStart(index)}
                                                    onDragEnd={handleDragEnd}
                                                    onEdit={() => setEditingQuestionIndex(editingQuestionIndex === index ? null : index)}
                                                    onDelete={() => removeQuestion(question.localId)}
                                                    onDuplicate={() => duplicateQuestion(index)}
                                                    onMove={handleQuestionMove}
                                                />
                                            ))}
                                        </div>

                                        {editingQuestionIndex !== null && (
                                            <QuestionEditor
                                                question={questions[editingQuestionIndex]}
                                                index={editingQuestionIndex}
                                                onUpdate={(updater) => updateQuestion(questions[editingQuestionIndex].localId, updater)}
                                                onAddOption={() => addOption(questions[editingQuestionIndex].localId)}
                                                onUpdateOption={(optionLocalId, text) => updateOption(questions[editingQuestionIndex].localId, optionLocalId, text)}
                                                onRemoveOption={(optionLocalId) => removeOption(questions[editingQuestionIndex].localId, optionLocalId)}
                                                onClose={() => setEditingQuestionIndex(null)}
                                            />
                                        )}
                                    </CardBody>
                                </Card>
                            </>
                        )}

                        {previewMode && (
                            <Card>
                                <CardHeader>
                                    <h2 className="text-base font-semibold text-slate-900">Preview</h2>
                                </CardHeader>
                                <CardBody className="space-y-3">
                                    <h3 className="text-lg font-semibold text-slate-900">{title || 'Untitled Survey'}</h3>
                                    {description ? <p className="text-sm text-slate-600">{description}</p> : null}
                                    <p className="text-sm text-slate-500">{questions.length} question{questions.length === 1 ? '' : 's'}</p>

                                    <div className="space-y-3">
                                        {questions.map((question, index) => (
                                            <div key={question.localId} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                                <p className="mb-2 text-sm font-semibold text-slate-800">{index + 1}. {question.question_text || '(No question text)'}</p>
                                                {question.help_text ? <p className="mb-2 text-sm text-slate-500">{question.help_text}</p> : null}
                                                {OPTION_BASED_TYPES.has(question.question_type) && (question.options || []).length > 0 ? (
                                                    <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                                                        {(question.options || []).map((option) => (
                                                            <li key={option.localId || option.id}>{option.option_text || '(Empty option)'}</li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="text-sm text-slate-500">{question.question_type.replace('_', ' ')} response</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </CardBody>
                            </Card>
                        )}

                        <div className="flex justify-end">
                            <Button type="submit" disabled={!canSubmit}>{submitting ? 'Saving...' : isEditMode ? 'Update Survey' : 'Create Survey'}</Button>
                        </div>
                    </form>
                </CardBody>
            </Card>
        </div>
    );
};

// Question Editor Component
const QuestionEditor = ({
    question,
    index,
    onUpdate,
    onAddOption,
    onUpdateOption,
    onRemoveOption,
    onClose,
}) => {
    const usesOptions = OPTION_BASED_TYPES.has(question.question_type);

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4 py-6">
            <div className="w-full max-w-2xl rounded-lg border border-slate-200 bg-white shadow-md">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <h3 className="text-base font-semibold text-slate-900">Question {index + 1}</h3>
                    <Button type="button" variant="outline" size="sm" onClick={onClose}>Close</Button>
                </div>

                <div className="space-y-4 px-5 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Question Text</label>
                        <Textarea
                            value={question.question_text}
                            onChange={(e) => onUpdate({ question_text: e.target.value })}
                            placeholder="Enter your question"
                            rows={2}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Description (optional)</label>
                        <Textarea
                            value={question.description || ''}
                            onChange={(e) => onUpdate({ description: e.target.value })}
                            placeholder="Additional context or example"
                            rows={2}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Help Text (optional)</label>
                        <Input
                            type="text"
                            value={question.help_text || ''}
                            onChange={(e) => onUpdate({ help_text: e.target.value })}
                            placeholder="Hint shown to respondents"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-end">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Question Type</label>
                            <select
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                                value={question.question_type}
                                onChange={(e) => onUpdate({ question_type: e.target.value })}
                            >
                                {QUESTION_TYPES.map((type) => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>
                        </div>

                        <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-slate-300 text-slate-700 focus:ring-slate-300"
                                checked={question.is_required}
                                onChange={(e) => onUpdate({ is_required: e.target.checked })}
                            />
                            Required
                        </label>
                    </div>

                    {usesOptions && (
                        <div className="space-y-3 rounded-lg border border-slate-200 p-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-slate-800">Options ({question.options?.length || 0})</h4>
                                <Button type="button" variant="outline" size="sm" onClick={onAddOption}>Add Option</Button>
                            </div>

                            <div className="space-y-2">
                                {question.options?.map((option, optIndex) => (
                                    <div key={option.localId} className="flex items-center gap-2">
                                        <span className="w-6 text-sm text-slate-500">{optIndex + 1}</span>
                                        <Input
                                            type="text"
                                            value={option.option_text}
                                            onChange={(e) => onUpdateOption(option.localId, e.target.value)}
                                            placeholder={`Option ${optIndex + 1}`}
                                        />
                                        <Button type="button" variant="danger" size="sm" onClick={() => onRemoveOption(option.localId)}>Remove</Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Button type="button" variant="outline" onClick={onClose}>Done</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateSurveyPage;
