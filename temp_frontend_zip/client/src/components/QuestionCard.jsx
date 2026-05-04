import React from 'react';
import Button from './ui/Button';

const QUESTION_TYPE_HINTS = {
    text: 'Short text response',
    text_only: 'Text without question text',
    number_only: 'Numeric response only',
    multiple_choice: 'Single selection from options',
    checkbox: 'Multiple selections from options',
    rating: 'Rating scale (1-5)',
};

export const QuestionCard = ({
    question,
    index,
    totalQuestions,
    isEditing,
    isDragging,
    onEdit,
    onDelete,
    onDuplicate,
    onMove,
    onDragStart,
    onDragEnd,
}) => {
    const [isExpanded, setIsExpanded] = React.useState(false);

    const previewText = question.question_text
        ? question.question_text.substring(0, 60) +
          (question.question_text.length > 60 ? '...' : '')
        : 'Untitled question';

    return (
        <div
            className={[
                'rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md',
                isDragging ? 'opacity-70' : '',
            ].filter(Boolean).join(' ')}
            draggable
            onDragStart={() => onDragStart?.(index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
                event.preventDefault();
                onMove?.(index);
            }}
            onDragEnd={() => onDragEnd?.()}
        >
            <div className="flex items-center gap-3 p-4">
                <div className="inline-flex h-7 min-w-7 items-center justify-center rounded-md border border-slate-200 px-2 text-xs font-semibold text-slate-600">
                    Q{index + 1}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-800">{previewText}</div>
                    <div className="mt-1 text-xs text-slate-500">{QUESTION_TYPE_HINTS[question.question_type]}</div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 transition-all duration-200 hover:bg-slate-50"
                        onClick={() => setIsExpanded(!isExpanded)}
                        title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                        {isExpanded ? 'Collapse' : 'Expand'}
                    </button>
                    <button
                        type="button"
                        className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 transition-all duration-200 hover:bg-slate-50"
                        onClick={() => onDuplicate?.(index)}
                        title="Duplicate question"
                    >
                        Duplicate
                    </button>
                    <button
                        type="button"
                        className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 transition-all duration-200 hover:bg-red-50"
                        onClick={() => onDelete?.(index)}
                        title="Delete question"
                        disabled={totalQuestions <= 1}
                    >
                        Delete
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="space-y-3 border-t border-slate-200 bg-slate-50 p-4">
                    {question.question_text && (
                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Question Text</label>
                            <p className="text-sm text-slate-800">{question.question_text}</p>
                        </div>
                    )}

                    {question.description && (
                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Description</label>
                            <p className="text-sm text-slate-800">{question.description}</p>
                        </div>
                    )}

                    {question.help_text && (
                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Help Text</label>
                            <p className="text-sm text-slate-800">{question.help_text}</p>
                        </div>
                    )}

                    {['multiple_choice', 'checkbox'].includes(question.question_type) && (
                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Options ({question.options?.length || 0})</label>
                            <ul className="space-y-1">
                                {question.options?.map((option, i) => (
                                    <li key={i} className="text-sm text-slate-700">- {option.option_text}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {question.question_type === 'rating' && (
                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Scale</label>
                            <p className="text-sm text-slate-800">
                                {question.rating_scale_min || 1} to {question.rating_scale_max || 5}
                            </p>
                        </div>
                    )}

                    <div>
                        <Button type="button" variant="outline" size="sm" onClick={() => onEdit?.(index)} disabled={isEditing}>
                            Edit Full Question
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuestionCard;
