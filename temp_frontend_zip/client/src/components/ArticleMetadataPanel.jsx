import React from 'react';
import { generateSlug, countWords } from '../utils/articleUtils';
import Card, { CardBody } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Textarea from './ui/Textarea';

export const ArticleMetadataPanel = ({ article, onChange }) => {
    const [autoSlug, setAutoSlug] = React.useState(true);
    const contentHtml = String(article.content || '');
    const wordCount = React.useMemo(() => countWords(contentHtml), [contentHtml]);
    const readingTime = React.useMemo(
        () => Math.max(1, Math.ceil(wordCount / 200)),
        [wordCount]
    );

    const handleChange = (field, value) => {
        let newArticle = { ...article, [field]: value };

        // Auto-generate slug if enabled
        if (autoSlug && field === 'title') {
            newArticle.slug = generateSlug(value);
        }

        onChange(newArticle);
    };

    const handleSlugChange = (e) => {
        const value = e.target.value;
        setAutoSlug(false);
        handleChange('slug', generateSlug(value)); // Ensure slug is sanitized
    };

    return (
        <Card>
            <CardBody className="space-y-5">
                <div>
                    <h3 className="text-base font-semibold text-slate-900">Article Metadata</h3>
                    <p className="mt-1 text-sm text-slate-500">Keep metadata concise and search-friendly.</p>
                </div>

                <div className="space-y-2">
                    <label htmlFor="meta-description" className="text-sm font-medium text-slate-700">Meta Description</label>
                    <Textarea
                        id="meta-description"
                        maxLength={160}
                        rows={3}
                        placeholder="Brief description for search results"
                        value={article.meta_description || ''}
                        onChange={(e) => handleChange('meta_description', e.target.value)}
                    />
                    <p className="text-xs text-slate-500">{(article.meta_description || '').length}/160 characters</p>
                </div>

                <div className="space-y-2">
                    <label htmlFor="slug" className="text-sm font-medium text-slate-700">URL Slug</label>
                    <div className="flex gap-2">
                        <Input
                            id="slug"
                            type="text"
                            placeholder="article-url-slug"
                            value={article.slug || ''}
                            onChange={handleSlugChange}
                        />
                        <Button
                            variant="outline"
                            size="md"
                            onClick={() => {
                                setAutoSlug(true);
                                handleChange('slug', generateSlug(article.title));
                            }}
                            title="Auto-generate from title"
                        >
                            Auto
                        </Button>
                    </div>
                    <p className="text-xs text-slate-500">Preview: /articles/{article.slug || 'article-title'}</p>
                </div>

                <div className="space-y-2">
                    <label htmlFor="tags" className="text-sm font-medium text-slate-700">Tags</label>
                    <Input
                        id="tags"
                        type="text"
                        placeholder="tag1, tag2, tag3"
                        value={article.tags || ''}
                        onChange={(e) => handleChange('tags', e.target.value)}
                    />
                    <p className="text-xs text-slate-500">Comma-separated tags for categorization</p>
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div>
                        <p className="text-xs font-medium text-slate-500">Word Count</p>
                        <p className="mt-1 text-xl font-semibold text-slate-800">{wordCount}</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500">Reading Time</p>
                        <p className="mt-1 text-xl font-semibold text-slate-800">{readingTime} min</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                        <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 text-slate-700 focus:ring-slate-300"
                            checked={article.is_published || false}
                            onChange={(e) => handleChange('is_published', e.target.checked)}
                        />
                        Published
                    </label>
                    <p className="text-xs text-slate-500">Leave unchecked to keep this article as a draft.</p>
                </div>
            </CardBody>
        </Card>
    );
};

export default ArticleMetadataPanel;
