import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import surveyService from '../services/surveyService';
import LoadingSpinner from '../components/LoadingSpinner';

const CreateSurveyPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(isEditMode);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState('');

    // Questions state
    const [questions, setQuestions] = useState([]);
    const [showAddQuestion, setShowAddQuestion] = useState(false);
    const [questionText, setQuestionText] = useState('');
    const [questionType, setQuestionType] = useState('text');
    const [isRequired, setIsRequired] = useState(true);
    const [addingQuestion, setAddingQuestion] = useState(false);
    const [editingQuestionId, setEditingQuestionId] = useState(null);
    const [editingQuestionText, setEditingQuestionText] = useState('');

    // Options state
    const [selectedQuestionForOptions, setSelectedQuestionForOptions] = useState(null);
    const [optionText, setOptionText] = useState('');
    const [addingOption, setAddingOption] = useState(false);
    const [editingOptionId, setEditingOptionId] = useState(null);
    const [editingOptionText, setEditingOptionText] = useState('');

    const questionTypesWithOptions = ['multiple_choice', 'checkbox', 'rating'];

    // Fetch survey data if in edit mode
    useEffect(() => {
        if (isEditMode) {
            const fetchSurvey = async () => {
                try {
                    const response = await surveyService.getSurveyById(id);
                    setTitle(response.data.title);
                    setDescription(response.data.description);
                    setQuestions(response.data.questions || []);
                    setLoading(false);
                } catch (err) {
                    const errorMsg = err.response?.data?.error || 'Failed to load survey';
                    setError(errorMsg);
                    setLoading(false);
                }
            };
            fetchSurvey();
        }
    }, [id, isEditMode]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);

        try {
            if (isEditMode) {
                await surveyService.updateSurvey(id, { title, description });
                setSuccess('Survey updated successfully!');
                setTimeout(() => {
                    navigate('/admin/surveys');
                }, 1500);
            } else {
                const response = await surveyService.createSurvey(title, description);
                setSuccess('Survey created successfully!');
                setTimeout(() => {
                    navigate(`/admin/surveys/${response.data.survey.id}/edit`);
                }, 1500);
            }
        } catch (err) {
            const errorMsg = err.response?.data?.error || `Failed to ${isEditMode ? 'update' : 'create'} survey`;
            setError(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddQuestion = async (e) => {
        e.preventDefault();
        if (!questionText.trim()) {
            setError('Question text is required');
            return;
        }

        setAddingQuestion(true);
        setError('');

        try {
            const response = await surveyService.addQuestion(
                id,
                questionText,
                questionType,
                isRequired,
                questions.length + 1
            );
            setQuestions([...questions, response.data.question]);
            setQuestionText('');
            setQuestionType('text');
            setIsRequired(true);
            setShowAddQuestion(false);
            setSuccess('Question added successfully!');
            setTimeout(() => setSuccess(''), 2000);
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Failed to add question';
            setError(errorMsg);
        } finally {
            setAddingQuestion(false);
        }
    };

    const handleDeleteQuestion = async (questionId) => {
        if (window.confirm('Are you sure you want to delete this question?')) {
            try {
                setError('');
                await surveyService.deleteQuestion(questionId);
                setQuestions(questions.filter(q => q.id !== questionId));
                setSelectedQuestionForOptions(null);
                setSuccess('Question deleted!');
                setTimeout(() => setSuccess(''), 2000);
            } catch (err) {
                setError('Failed to delete question');
            }
        }
    };

    const handleAddOption = async (e) => {
        e.preventDefault();
        if (!optionText.trim()) {
            setError('Option text is required');
            return;
        }

        setAddingOption(true);
        setError('');

        try {
            const response = await surveyService.addOption(
                selectedQuestionForOptions.id,
                optionText,
                (selectedQuestionForOptions.options?.length || 0) + 1
            );

            const updatedQuestion = {
                ...selectedQuestionForOptions,
                options: [...(selectedQuestionForOptions.options || []), response.data.option],
            };
            setSelectedQuestionForOptions(updatedQuestion);

            setQuestions(
                questions.map((q) =>
                    q.id === selectedQuestionForOptions.id ? updatedQuestion : q
                )
            );

            setOptionText('');
            setSuccess('Option added successfully!');
            setTimeout(() => setSuccess(''), 2000);
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Failed to add option';
            setError(errorMsg);
        } finally {
            setAddingOption(false);
        }
    };

    const handleDeleteOption = async (optionId) => {
        if (window.confirm('Are you sure you want to delete this option?')) {
            try {
                setError('');
                await surveyService.deleteOption(optionId);

                const updatedQuestion = {
                    ...selectedQuestionForOptions,
                    options: selectedQuestionForOptions.options.filter(o => o.id !== optionId),
                };
                setSelectedQuestionForOptions(updatedQuestion);

                setQuestions(
                    questions.map((q) =>
                        q.id === selectedQuestionForOptions.id ? updatedQuestion : q
                    )
                );

                setSuccess('Option deleted!');
                setTimeout(() => setSuccess(''), 2000);
            } catch (err) {
                setError('Failed to delete option');
            }
        }
    };

    const handleStartEditQuestion = (question) => {
        setEditingQuestionId(question.id);
        setEditingQuestionText(question.question_text);
    };

    const handleSaveEditQuestion = async (questionId) => {
        if (!editingQuestionText.trim()) {
            setError('Question text cannot be empty');
            return;
        }

        try {
            setError('');
            await surveyService.updateQuestion(questionId, { question_text: editingQuestionText });

            const updatedQuestions = questions.map((q) =>
                q.id === questionId ? { ...q, question_text: editingQuestionText } : q
            );
            setQuestions(updatedQuestions);

            if (selectedQuestionForOptions?.id === questionId) {
                setSelectedQuestionForOptions({
                    ...selectedQuestionForOptions,
                    question_text: editingQuestionText,
                });
            }

            setEditingQuestionId(null);
            setEditingQuestionText('');
            setSuccess('Question updated!');
            setTimeout(() => setSuccess(''), 2000);
        } catch (err) {
            setError('Failed to update question');
        }
    };

    const handleStartEditOption = (option) => {
        setEditingOptionId(option.id);
        setEditingOptionText(option.option_text);
    };

    const handleSaveEditOption = async (optionId) => {
        if (!editingOptionText.trim()) {
            setError('Option text cannot be empty');
            return;
        }

        try {
            setError('');
            await surveyService.updateOption(optionId, { option_text: editingOptionText });

            const updatedQuestion = {
                ...selectedQuestionForOptions,
                options: selectedQuestionForOptions.options.map((o) =>
                    o.id === optionId ? { ...o, option_text: editingOptionText } : o
                ),
            };
            setSelectedQuestionForOptions(updatedQuestion);

            setQuestions(
                questions.map((q) =>
                    q.id === selectedQuestionForOptions.id ? updatedQuestion : q
                )
            );

            setEditingOptionId(null);
            setEditingOptionText('');
            setSuccess('Option updated!');
            setTimeout(() => setSuccess(''), 2000);
        } catch (err) {
            setError('Failed to update option');
        }
    };

    return (
        <div className="container mt-4">
            <Link to="/admin/surveys" style={{ color: '#003594', textDecoration: 'none' }}>
                ← Back to Manage Surveys
            </Link>

            {loading && <LoadingSpinner />}

            {!loading && (
                <>
                    {/* Survey Details Card */}
                    <div className="card mt-3" style={{ maxWidth: '600px', margin: '24px auto' }}>
                        <div className="card-body">
                            <h1>{isEditMode ? 'Edit Survey' : 'Create New Survey'}</h1>

                            {error && <div className="alert alert-danger">{error}</div>}
                            {success && <div className="alert alert-success">{success}</div>}

                            <form onSubmit={handleSubmit}>
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
                                        placeholder="Enter survey description (optional)"
                                        rows="5"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary btn-block"
                                    disabled={submitting}
                                    style={{ marginTop: isEditMode ? '16px' : '0' }}
                                >
                                    {submitting
                                        ? isEditMode ? 'Updating...' : 'Creating...'
                                        : isEditMode ? 'Update Survey' : 'Create Survey'}
                                </button>
                            </form>

                            <p style={{ marginTop: '24px', color: '#666', fontSize: '0.9rem', textAlign: 'center' }}>
                                {isEditMode
                                    ? 'Edit survey details, questions, and options above.'
                                    : "After creating the survey, you'll be able to add questions."}
                            </p>
                        </div>
                    </div>

                    {/* Questions Card - only show in edit mode */}
                    {isEditMode && (
                        <div className="card mt-4" style={{ maxWidth: '600px', margin: '24px auto' }}>
                            <div className="card-body">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h2>Questions ({questions.length})</h2>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddQuestion(!showAddQuestion)}
                                        className="btn btn-success"
                                        style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                                    >
                                        {showAddQuestion ? '✕ Cancel' : '+ Add Question'}
                                    </button>
                                </div>

                                {/* Add Question Form */}
                                {showAddQuestion && (
                                    <form onSubmit={handleAddQuestion} style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f0f4f8', borderRadius: '4px' }}>
                                        <div className="form-group">
                                            <label>Question Text *</label>
                                            <input
                                                type="text"
                                                value={questionText}
                                                onChange={(e) => setQuestionText(e.target.value)}
                                                placeholder="Enter question"
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Question Type *</label>
                                            <select
                                                value={questionType}
                                                onChange={(e) => setQuestionType(e.target.value)}
                                            >
                                                <option value="text">Short Text</option>
                                                <option value="textarea">Long Text</option>
                                                <option value="multiple_choice">Multiple Choice</option>
                                                <option value="checkbox">Checkboxes</option>
                                                <option value="rating">Rating Scale</option>
                                            </select>
                                        </div>

                                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <input
                                                type="checkbox"
                                                id="isRequired"
                                                checked={isRequired}
                                                onChange={(e) => setIsRequired(e.target.checked)}
                                            />
                                            <label htmlFor="isRequired" style={{ margin: 0 }}>
                                                Required question
                                            </label>
                                        </div>

                                        <button
                                            type="submit"
                                            className="btn btn-success btn-block"
                                            disabled={addingQuestion}
                                        >
                                            {addingQuestion ? 'Adding...' : 'Add Question'}
                                        </button>
                                    </form>
                                )}

                                {/* Questions List */}
                                {questions.length === 0 ? (
                                    <p style={{ color: '#666', textAlign: 'center', padding: '24px' }}>
                                        No questions yet. Add one to get started!
                                    </p>
                                ) : (
                                    <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                        {questions.map((question, index) => (
                                            <div
                                                key={question.id}
                                                style={{
                                                    padding: '12px',
                                                    borderBottom: '1px solid #eee',
                                                    marginBottom: '8px',
                                                    backgroundColor: '#fff',
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div style={{ flex: 1 }}>
                                                        {editingQuestionId === question.id ? (
                                                            <div style={{ marginBottom: '8px' }}>
                                                                <input
                                                                    type="text"
                                                                    value={editingQuestionText}
                                                                    onChange={(e) => setEditingQuestionText(e.target.value)}
                                                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #003594', marginBottom: '8px' }}
                                                                />
                                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleSaveEditQuestion(question.id)}
                                                                        className="btn btn-success"
                                                                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                                                    >
                                                                        Save
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setEditingQuestionId(null);
                                                                            setEditingQuestionText('');
                                                                        }}
                                                                        className="btn btn-secondary"
                                                                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <strong>
                                                                    {index + 1}. {question.question_text}
                                                                </strong>
                                                                <p style={{ margin: '6px 0 0 0', color: '#666', fontSize: '0.85rem' }}>
                                                                    Type: <span style={{ fontWeight: 'bold' }}>{question.question_type}</span>
                                                                    {!question.is_required && ' (Optional)'}
                                                                </p>
                                                            </>
                                                        )}

                                                        {/* Options summary for applicable question types */}
                                                        {!editingQuestionId && questionTypesWithOptions.includes(question.question_type) && (
                                                            <div style={{ marginTop: '8px' }}>
                                                                <p style={{ margin: 0, color: '#666', fontSize: '0.8rem' }}>
                                                                    Options ({question.options?.length || 0}):
                                                                </p>
                                                                {question.options && question.options.length > 0 ? (
                                                                    <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px', fontSize: '0.85rem' }}>
                                                                        {question.options.map((option) => (
                                                                            <li key={option.id} style={{ marginBottom: '4px' }}>
                                                                                {option.option_text}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                ) : (
                                                                    <p style={{ margin: '4px 0 0 0', color: '#999', fontSize: '0.85rem', fontStyle: 'italic' }}>
                                                                        No options yet
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '4px', marginLeft: '8px', flexShrink: 0 }}>
                                                        {editingQuestionId !== question.id && !editingOptionId && (
                                                            <>
                                                                {questionTypesWithOptions.includes(question.question_type) && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setSelectedQuestionForOptions(
                                                                                selectedQuestionForOptions?.id === question.id ? null : question
                                                                            )
                                                                        }
                                                                        className="btn btn-info"
                                                                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                                                        title="Manage options"
                                                                    >
                                                                        ⚙️
                                                                    </button>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleStartEditQuestion(question)}
                                                                    className="btn btn-primary"
                                                                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteQuestion(question.id)}
                                                                    className="btn btn-danger"
                                                                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                                                >
                                                                    Delete
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Options Management Panel */}
                                                {selectedQuestionForOptions?.id === question.id && questionTypesWithOptions.includes(question.question_type) && (
                                                    <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#e8f0fe', borderRadius: '4px', border: '1px solid #b3cde8' }}>
                                                        <h4 style={{ marginTop: 0, marginBottom: '12px', color: '#003594' }}>
                                                            Manage Options for: {question.question_text}
                                                        </h4>

                                                        <form onSubmit={handleAddOption} style={{ marginBottom: '12px' }}>
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                <input
                                                                    type="text"
                                                                    value={optionText}
                                                                    onChange={(e) => setOptionText(e.target.value)}
                                                                    placeholder="Enter option text"
                                                                    style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                                />
                                                                <button
                                                                    type="submit"
                                                                    className="btn btn-success"
                                                                    disabled={addingOption}
                                                                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                                                                >
                                                                    {addingOption ? 'Adding...' : '+ Add'}
                                                                </button>
                                                            </div>
                                                        </form>

                                                        {question.options && question.options.length > 0 && (
                                                            <div>
                                                                <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                                                    Current Options:
                                                                </p>
                                                                {question.options.map((option) => (
                                                                    <div
                                                                        key={option.id}
                                                                        style={{
                                                                            display: 'flex',
                                                                            justifyContent: 'space-between',
                                                                            alignItems: 'center',
                                                                            padding: '8px',
                                                                            marginBottom: '6px',
                                                                            backgroundColor: 'white',
                                                                            borderRadius: '4px',
                                                                            border: '1px solid #ddd',
                                                                        }}
                                                                    >
                                                                        {editingOptionId === option.id ? (
                                                                            <input
                                                                                type="text"
                                                                                value={editingOptionText}
                                                                                onChange={(e) => setEditingOptionText(e.target.value)}
                                                                                style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #003594', marginRight: '8px' }}
                                                                            />
                                                                        ) : (
                                                                            <span style={{ fontSize: '0.9rem', flex: 1 }}>
                                                                                {option.option_text}
                                                                            </span>
                                                                        )}
                                                                        <div style={{ display: 'flex', gap: '4px' }}>
                                                                            {editingOptionId === option.id ? (
                                                                                <>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleSaveEditOption(option.id)}
                                                                                        className="btn btn-success"
                                                                                        style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                                                                                    >
                                                                                        Save
                                                                                    </button>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => {
                                                                                            setEditingOptionId(null);
                                                                                            setEditingOptionText('');
                                                                                        }}
                                                                                        className="btn btn-secondary"
                                                                                        style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                                                                                    >
                                                                                        Cancel
                                                                                    </button>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleStartEditOption(option)}
                                                                                        className="btn btn-primary"
                                                                                        style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                                                                                    >
                                                                                        Edit
                                                                                    </button>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleDeleteOption(option.id)}
                                                                                        className="btn btn-danger"
                                                                                        style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                                                                                    >
                                                                                        Remove
                                                                                    </button>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default CreateSurveyPage;
