import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { useNavigate } from 'react-router-dom';
import articleService from '../services/articleService';
import { useToast } from '../context/ToastContext';
import { validateArticle } from '../utils/validation';
import { estimateReadingTime, generateTableOfContents, generateSlug, countWords } from '../utils/articleUtils';
import LoadingSpinner from '../components/LoadingSpinner';
import ArticleMetadataPanel from '../components/ArticleMetadataPanel';
import Button from '../components/ui/Button';
import Card, { CardBody, CardHeader } from '../components/ui/Card';
import Input from '../components/ui/Input';

const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list',
    'blockquote', 'code-block',
    'link', 'image',
    'align',
];

const stripHtml = (html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
};

const isContentEmpty = (html) => {
    if (!html) return true;
    const text = stripHtml(html).trim();
    return text.length === 0;
};

const TITLE_MIN_LENGTH = 3;
const TITLE_MAX_LENGTH = 300;
const CONTENT_MAX_LENGTH = 2000000;

const normalizeLinkHref = (href) => {
    if (!href) return href;
    const trimmed = href.trim();
    if (!trimmed) return trimmed;

    if (/^(https?:|mailto:|tel:|#|\/)/i.test(trimmed)) {
        return trimmed;
    }

    return `https://${trimmed}`;
};

const normalizeEditorHtml = (html) => {
    if (!html) return html;

    const container = document.createElement('div');
    container.innerHTML = html;

    container.querySelectorAll('a[href]').forEach((anchor) => {
        const normalizedHref = normalizeLinkHref(anchor.getAttribute('href'));
        if (normalizedHref) {
            anchor.setAttribute('href', normalizedHref);
        }
        anchor.setAttribute('target', '_blank');
        anchor.setAttribute('rel', 'noopener noreferrer');
    });

    return container.innerHTML;
};

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
});

const loadImage = (dataUrl) => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image'));
    image.src = dataUrl;
});

const compressImageDataUrl = async (dataUrl, mimeType = 'image/jpeg', quality = 0.78, maxSize = 1600) => {
    const image = await loadImage(dataUrl);

    const ratio = Math.min(1, maxSize / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * ratio));
    const height = Math.max(1, Math.round(image.height * ratio));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, width, height);

    return canvas.toDataURL(mimeType, quality);
};

const AdminArticlesPage = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [deleting, setDeleting] = useState(null);
    const [publishing, setPublishing] = useState(null);

    // Form states
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [autosaving, setAutosaving] = useState(false);
    const quillRef = useRef(null);

    // SEO metadata
    const [article, setArticle] = useState({
        title: '',
        content: '',
        meta_description: '',
        slug: '',
        tags: '',
        is_published: false,
    });

    // Table of contents
    const [tableOfContents, setTableOfContents] = useState([]);

    // Autosave
    const autosaveTimerRef = useRef(null);
    const unsavedChangesRef = useRef(false);
    const lastSavedArticleRef = useRef('');

    const serializeArticleState = useCallback((value) => JSON.stringify({
        title: String(value?.title || '').trim(),
        content: String(value?.content || ''),
        meta_description: String(value?.meta_description || '').trim(),
        tags: String(value?.tags || '').trim(),
        slug: String(value?.slug || '').trim(),
    }), []);

    // Cleanup
    useEffect(() => {
        return () => {
            if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
        };
    }, []);

    const getEffectiveIsPublished = (article) => {
        if (article?.is_talk) {
            return true;
        }
        return Boolean(article?.is_published);
    };

    const articleCount = articles.filter((article) => !article.is_talk).length;
    const talksCount = articles.filter((article) => article.is_talk).length;
    const publishedCount = articles.filter((article) => getEffectiveIsPublished(article)).length;
    const draftCount = articles.length - publishedCount;

    const contentWordCount = React.useMemo(() => countWords(article.content), [article.content]);
    const contentReadingTime = React.useMemo(
        () => Math.max(1, Math.ceil(contentWordCount / 200)),
        [contentWordCount]
    );

    const handleImageInsert = useCallback(() => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/png,image/jpeg,image/jpg,image/webp');
        input.click();

        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;

            try {
                const rawDataUrl = await readFileAsDataUrl(file);
                const optimizedDataUrl = await compressImageDataUrl(rawDataUrl);

                const editor = quillRef.current?.getEditor();
                if (!editor) return;

                const range = editor.getSelection(true);
                const insertIndex = range?.index ?? editor.getLength();
                editor.insertEmbed(insertIndex, 'image', optimizedDataUrl, 'user');
                editor.setSelection(insertIndex + 1, 0);
                addToast('Image inserted and optimized', 'success');
            } catch (err) {
                addToast(err.message || 'Failed to insert image', 'error');
                setError(err.message || 'Failed to insert image');
            }
        };
    }, [addToast]);

    const quillModules = useMemo(() => ({
        toolbar: {
            container: [
                [{ header: [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ list: 'ordered' }, { list: 'bullet' }],
                ['blockquote', 'code-block'],
                ['link', 'image'],
                [{ align: [] }],
                ['clean'],
            ],
            handlers: {
                image: handleImageInsert,
            },
        },
    }), [handleImageInsert]);

    // Update table of contents when content changes
    useEffect(() => {
        const toc = generateTableOfContents(article.content);
        setTableOfContents(toc);
    }, [article.content]);

    const fetchArticles = useCallback(async () => {
        try {
            setLoading(true);
            const articlesResponse = await articleService.getAdminArticles(1, 100);
            setArticles(articlesResponse.data.articles);
            setError('');
        } catch (err) {
            setError('Failed to load articles');
            addToast('Failed to load articles', 'error');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchArticles();
    }, [fetchArticles]);

    const handleStartCreate = () => {
        setEditingId(null);
        const initialArticle = {
            title: '',
            content: '',
            meta_description: '',
            slug: '',
            tags: '',
            is_published: false,
        };
        setArticle(initialArticle);
        setShowForm(true);
        lastSavedArticleRef.current = serializeArticleState(initialArticle);
        unsavedChangesRef.current = false;
    };

    const handleStartEdit = (editArticle) => {
        setEditingId(editArticle.id);
        const initialArticle = {
            title: editArticle.title || '',
            content: editArticle.content || '',
            meta_description: editArticle.meta_description || '',
            slug: editArticle.slug || '',
            tags: editArticle.tags || '',
            is_published: getEffectiveIsPublished(editArticle),
        };
        setArticle(initialArticle);
        setShowForm(true);
        lastSavedArticleRef.current = serializeArticleState(initialArticle);
        unsavedChangesRef.current = false;
    };

    const handleCancel = () => {
        if (autosaveTimerRef.current) {
            clearTimeout(autosaveTimerRef.current);
        }
        setShowForm(false);
        setEditingId(null);
        setArticle({
            title: '',
            content: '',
            meta_description: '',
            slug: '',
            tags: '',
            is_published: false,
        });
        lastSavedArticleRef.current = '';
        unsavedChangesRef.current = false;
    };

    // Autosave functionality
    useEffect(() => {
        if (!editingId || !showForm || !unsavedChangesRef.current) {
            return;
        }

        if (autosaveTimerRef.current) {
            clearTimeout(autosaveTimerRef.current);
        }

        autosaveTimerRef.current = setTimeout(async () => {
            try {
                setAutosaving(true);
                await articleService.autosaveArticle(editingId, {
                    title: article.title,
                    content: article.content,
                    meta_description: article.meta_description,
                    tags: article.tags,
                });
                lastSavedArticleRef.current = serializeArticleState(article);
                unsavedChangesRef.current = false;
                addToast('Draft saved automatically', 'info');
            } catch (err) {
                console.error('Autosave failed:', err);
            } finally {
                setAutosaving(false);
            }
        }, 5000); // Autosave after 5 seconds
    }, [editingId, showForm, article, addToast, serializeArticleState]);

    // Track unsaved changes
    useEffect(() => {
        unsavedChangesRef.current = serializeArticleState(article) !== lastSavedArticleRef.current;
    }, [article, serializeArticleState]);

    const validateForm = () => {
        const validation = validateArticle({
            title: article.title,
            content: article.content,
            meta_description: article.meta_description,
        });

        return validation;
    };

    const handleSubmit = async (e, shouldPublish = false) => {
        e.preventDefault();
        
        const validation = validateForm();
        if (!validation.valid) {
            const errorMsg = validation.errors[0];
            addToast(errorMsg, 'error');
            setError(errorMsg);
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const normalizedTitle = article.title.trim();
            const normalizedContent = normalizeEditorHtml((article.content || '').trim());

            if (normalizedTitle.length < TITLE_MIN_LENGTH || normalizedTitle.length > TITLE_MAX_LENGTH) {
                throw new Error(`Title must be between ${TITLE_MIN_LENGTH} and ${TITLE_MAX_LENGTH} characters`);
            }

            if (normalizedContent.length > CONTENT_MAX_LENGTH) {
                throw new Error(`Content must be at most ${CONTENT_MAX_LENGTH} characters`);
            }

            const readingTime = estimateReadingTime(normalizedContent);
            const dataToSave = {
                title: normalizedTitle,
                content: normalizedContent,
                meta_description: article.meta_description || null,
                slug: article.slug || generateSlug(normalizedTitle),
                tags: article.tags || null,
                reading_time_minutes: readingTime,
                is_published: shouldPublish,
            };

            if (editingId) {
                await articleService.updateArticle(editingId, {
                    title: normalizedTitle,
                    content: normalizedContent,
                    is_published: shouldPublish,
                });
                await articleService.updateArticleMetadata(editingId, {
                    meta_description: dataToSave.meta_description,
                    slug: dataToSave.slug,
                    tags: dataToSave.tags,
                    reading_time_minutes: dataToSave.reading_time_minutes,
                });
                setSuccess(`Article ${shouldPublish ? 'published' : 'saved as draft'} successfully!`);
                addToast(
                    `Article ${shouldPublish ? 'published' : 'saved as draft'} successfully!`,
                    'success'
                );
                setArticles(
                    articles.map((a) =>
                        a.id === editingId ? { ...a, ...dataToSave } : a
                    )
                );
            } else {
                const response = await articleService.createArticle(normalizedTitle, normalizedContent);
                const newArticle = response.data.article;
                await articleService.updateArticleMetadata(newArticle.id, {
                    meta_description: article.meta_description || null,
                    slug: article.slug || generateSlug(normalizedTitle),
                    tags: article.tags || null,
                    reading_time_minutes: readingTime,
                });
                if (shouldPublish) {
                    await articleService.publishArticle(newArticle.id);
                }
                setSuccess(`Article ${shouldPublish ? 'published' : 'created'} successfully!`);
                addToast(
                    `Article ${shouldPublish ? 'published' : 'created'} successfully!`,
                    'success'
                );
                setArticles([{ ...newArticle, ...dataToSave }, ...articles]);
            }
            lastSavedArticleRef.current = serializeArticleState({
                ...article,
                title: normalizedTitle,
                content: normalizedContent,
                slug: dataToSave.slug,
                meta_description: dataToSave.meta_description || '',
                tags: dataToSave.tags || '',
            });
            unsavedChangesRef.current = false;
            handleCancel();
            setTimeout(() => setSuccess(''), 2000);
        } catch (err) {
            const errorMsg = err.message || (err.response?.data?.error || 'Failed to save article');
            addToast(errorMsg, 'error');
            setError(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this article?')) return;

        setDeleting(id);
        try {
            await articleService.deleteArticle(id);
            setArticles(articles.filter((a) => a.id !== id));
            addToast('Article deleted successfully', 'success');
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Failed to delete article';
            setError(errorMsg);
            addToast(errorMsg, 'error');
        } finally {
            setDeleting(null);
        }
    };

    const handlePublishToggle = async (id, shouldPublish) => {
        setPublishing(id);
        try {
            if (shouldPublish) {
                await articleService.publishArticle(id);
                addToast('Article published', 'success');
            } else {
                await articleService.unpublishArticle(id);
                addToast('Article unpublished', 'success');
            }
            setArticles(articles.map((a) => (a.id === id ? { ...a, is_published: shouldPublish } : a)));
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Failed to update article';
            setError(errorMsg);
            addToast(errorMsg, 'error');
        } finally {
            setPublishing(null);
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    const handleBackNavigation = () => {
        if (showForm) {
            handleCancel();
            return;
        }
        navigate('/admin');
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
                <Button type="button" variant="outline" onClick={handleBackNavigation}>
                    {showForm ? 'Back to Manage Articles' : 'Back to Admin'}
                </Button>
                <Button type="button" onClick={handleStartCreate} disabled={showForm}>New Article</Button>
            </div>

            <Card>
                <CardBody className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">Manage Articles</h1>
                        <p className="mt-1 text-sm text-slate-500">Create, update, and publish content from one place.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">Articles: {articleCount}</span>
                        <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">Published: {publishedCount}</span>
                        <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">Drafts: {draftCount}</span>
                        {talksCount > 0 && <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">Talks: {talksCount}</span>}
                    </div>
                </CardBody>
            </Card>

            {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            {success && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

            {showForm ? (
                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-900">{editingId ? 'Edit Article' : 'Create New Article'}</h2>
                        <Button type="button" variant="outline" size="sm" onClick={handleCancel}>Close</Button>
                    </CardHeader>
                    <CardBody>
                        <form className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                            <div className="space-y-4 lg:col-span-8">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Article Title</label>
                                    <Input
                                        type="text"
                                        value={article.title}
                                        onChange={(e) => setArticle({ ...article, title: e.target.value })}
                                        placeholder="Enter article title"
                                        required
                                        maxLength={300}
                                    />
                                    <p className="text-xs text-slate-500">{article.title.length}/{TITLE_MAX_LENGTH} characters</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Content</label>
                                    <div className="overflow-visible rounded-lg border border-slate-300 bg-white">
                                        <ReactQuill
                                            ref={quillRef}
                                            value={article.content}
                                            onChange={(html) => setArticle({ ...article, content: html })}
                                            modules={quillModules}
                                            formats={quillFormats}
                                            placeholder="Write your article here..."
                                        />
                                    </div>
                                    {!isContentEmpty(article.content) && (
                                        <div className="flex items-center justify-between text-xs text-slate-500">
                                            <span>Words: {contentWordCount.toLocaleString()}</span>
                                            <span>Reading time: ~{contentReadingTime} min</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <aside className="space-y-4 lg:col-span-4">
                                <ArticleMetadataPanel article={article} onChange={setArticle} />

                                {tableOfContents.length > 0 && (
                                    <Card>
                                        <CardBody className="space-y-2">
                                            <h3 className="text-sm font-semibold text-slate-800">Table of Contents</h3>
                                            <ul className="space-y-1">
                                                {tableOfContents.map((item) => (
                                                    <li key={item.id} className={item.level === 3 ? 'pl-3' : ''}>
                                                        <a className="text-sm text-slate-600 transition-all duration-200 hover:text-slate-900" href={`#${item.id}`}>
                                                            {item.text}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardBody>
                                    </Card>
                                )}

                                <Card>
                                    <CardBody className="space-y-2">
                                        {autosaving && <p className="text-xs text-slate-500">Saving draft...</p>}
                                        <Button type="button" variant="outline" className="w-full" onClick={() => handleSubmit({ preventDefault: () => {} }, false)} disabled={submitting || autosaving}>
                                            Save as Draft
                                        </Button>
                                        <Button type="button" className="w-full" onClick={() => handleSubmit({ preventDefault: () => {} }, true)} disabled={submitting || autosaving}>
                                            Publish
                                        </Button>
                                        <Button type="button" variant="outline" className="w-full" onClick={handleCancel}>Cancel</Button>
                                    </CardBody>
                                </Card>
                            </aside>
                        </form>
                    </CardBody>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {articles.length === 0 ? (
                        <Card className="md:col-span-2 xl:col-span-3">
                            <CardBody>
                                <p className="text-sm text-slate-600">No articles yet. Create your first article.</p>
                            </CardBody>
                        </Card>
                    ) : (
                        articles.map((row) => (
                            <Card key={row.id} className="h-full">
                                <CardBody className="space-y-3 flex h-full flex-col justify-between">
                                    <div>
                                        <div className="flex items-start justify-between gap-3">
                                            <h3 className="line-clamp-2 text-base font-semibold text-slate-900">{row.title}</h3>
                                            <span className={[
                                                'rounded-md border px-2 py-1 text-xs font-medium',
                                                getEffectiveIsPublished(row)
                                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                    : 'border-amber-200 bg-amber-50 text-amber-700',
                                            ].join(' ')}>
                                                {getEffectiveIsPublished(row) ? 'Published' : 'Draft'}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                                            <span>{countWords(row.content).toLocaleString()} words</span>
                                            <span>{estimateReadingTime(row.content)} min read</span>
                                            {row.created_at && <span>Created: {new Date(row.created_at).toLocaleDateString()}</span>}
                                        </div>

                                        <p className="line-clamp-4 text-sm text-slate-600">{stripHtml(row.content).substring(0, 150)}...</p>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        <Button variant="outline" size="sm" onClick={() => handleStartEdit(row)}>Edit</Button>
                                        <Button
                                            size="sm"
                                            variant={getEffectiveIsPublished(row) ? 'outline' : 'solid'}
                                            onClick={() => handlePublishToggle(row.id, !getEffectiveIsPublished(row))}
                                            disabled={publishing === row.id}
                                        >
                                            {getEffectiveIsPublished(row) ? 'Unpublish' : 'Publish'}
                                        </Button>
                                        <Button variant="danger" size="sm" onClick={() => handleDelete(row.id)} disabled={deleting === row.id}>Delete</Button>
                                    </div>
                                </CardBody>
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminArticlesPage;
