import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import articleService from '../services/articleService';
import LoadingSpinner from '../components/LoadingSpinner';
import BackLink from '../components/BackLink';

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
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [deleting, setDeleting] = useState(null);
    const [publishing, setPublishing] = useState(null);

    // Form states
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const quillRef = useRef(null);

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
            } catch (err) {
                setError(err.message || 'Failed to insert image');
            }
        };
    }, []);

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

    const fetchArticles = useCallback(async () => {
        try {
            setLoading(true);
            const response = await articleService.getAdminArticles(1, 100);
            setArticles(response.data.articles);
            setError('');
        } catch (err) {
            setError('Failed to load articles');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchArticles();
    }, [fetchArticles]);

    const handleStartCreate = () => {
        setEditingId(null);
        setTitle('');
        setContent('');
        setShowForm(true);
    };

    const handleStartEdit = (article) => {
        setEditingId(article.id);
        setTitle(article.title);
        setContent(article.content);
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingId(null);
        setTitle('');
        setContent('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const normalizedTitle = title.trim();
        const normalizedContent = normalizeEditorHtml((content || '').trim());

        if (!normalizedTitle || isContentEmpty(normalizedContent)) {
            setError('Title and content are required');
            return;
        }

        if (normalizedTitle.length < TITLE_MIN_LENGTH || normalizedTitle.length > TITLE_MAX_LENGTH) {
            setError(`Title must be between ${TITLE_MIN_LENGTH} and ${TITLE_MAX_LENGTH} characters`);
            return;
        }

        if (normalizedContent.length > CONTENT_MAX_LENGTH) {
            setError(`Content must be at most ${CONTENT_MAX_LENGTH} characters`);
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            if (editingId) {
                await articleService.updateArticle(editingId, { title: normalizedTitle, content: normalizedContent });
                setSuccess('Article updated successfully!');
                setArticles(
                    articles.map((a) =>
                        a.id === editingId ? { ...a, title: normalizedTitle, content: normalizedContent } : a
                    )
                );
            } else {
                const response = await articleService.createArticle(normalizedTitle, normalizedContent);
                setSuccess('Article created successfully!');
                setArticles([response.data.article, ...articles]);
            }
            handleCancel();
            setTimeout(() => setSuccess(''), 2000);
        } catch (err) {
            const validationMessages = err.response?.data?.details
                ?.map((item) => item.message)
                .filter(Boolean);
            const errorMsg = validationMessages?.length
                ? validationMessages.join('. ')
                : (err.response?.data?.error || 'Failed to save article');
            setError(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const handlePublish = async (articleId) => {
        try {
            setPublishing(articleId);
            await articleService.publishArticle(articleId);
            setArticles(
                articles.map((a) =>
                    a.id === articleId ? { ...a, is_published: true } : a
                )
            );
            setSuccess('Article published!');
            setTimeout(() => setSuccess(''), 2000);
        } catch (err) {
            setError('Failed to publish article');
        } finally {
            setPublishing(null);
        }
    };

    const handleUnpublish = async (articleId) => {
        try {
            setPublishing(articleId);
            await articleService.unpublishArticle(articleId);
            setArticles(
                articles.map((a) =>
                    a.id === articleId ? { ...a, is_published: false } : a
                )
            );
            setSuccess('Article unpublished!');
            setTimeout(() => setSuccess(''), 2000);
        } catch (err) {
            setError('Failed to unpublish article');
        } finally {
            setPublishing(null);
        }
    };

    const handleDelete = async (articleId) => {
        if (window.confirm('Are you sure you want to delete this article?')) {
            try {
                setDeleting(articleId);
                await articleService.deleteArticle(articleId);
                setArticles(articles.filter((a) => a.id !== articleId));
                setSuccess('Article deleted!');
                setTimeout(() => setSuccess(''), 2000);
            } catch (err) {
                setError('Failed to delete article');
            } finally {
                setDeleting(null);
            }
        }
    };

    if (loading) {
        return <LoadingSpinner fullScreen={false} />;
    }

    return (
        <div className="container mt-4">
            <BackLink to="/admin" label="Back to Admin" />
            <h1 style={{ color: '#003594' }}>Manage Articles</h1>

            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* Create/Edit Form */}
            {showForm ? (
                <div className="card mb-4" style={{ maxWidth: '900px', margin: '24px auto' }}>
                    <div className="card-body">
                        <h2>{editingId ? 'Edit Article' : 'Create New Article'}</h2>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Article Title *</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter article title"
                                    required
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div className="form-group">
                                <label>Content *</label>
                                <ReactQuill
                                    ref={quillRef}
                                    theme="snow"
                                    value={content}
                                    onChange={setContent}
                                    modules={quillModules}
                                    formats={quillFormats}
                                    placeholder="Write your article content here..."
                                    style={{ backgroundColor: 'white', minHeight: '250px' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                                <button
                                    type="submit"
                                    className="btn btn-success"
                                    disabled={submitting}
                                    style={{ flex: 1 }}
                                >
                                    {submitting ? (editingId ? 'Updating...' : 'Creating...') : (editingId ? 'Update Article' : 'Create Article')}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="btn btn-secondary"
                                    style={{ flex: 1 }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : (
                <div style={{ marginBottom: '24px' }}>
                    <button
                        onClick={handleStartCreate}
                        className="btn btn-success"
                        style={{ padding: '8px 16px' }}
                    >
                        + Create New Article
                    </button>
                </div>
            )}

            {/* Articles List */}
            <div style={{ marginBottom: '32px' }}>
                <h2 style={{ color: '#003594' }}>Your Articles ({articles.length})</h2>
                {articles.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                        <p style={{ color: '#666' }}>No articles created yet</p>
                    </div>
                ) : (
                    <div style={{ maxWidth: '800px' }}>
                        {articles.map((article) => (
                            <div
                                key={article.id}
                                className="card"
                                style={{ marginBottom: '16px' }}
                            >
                                <div className="card-body">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ margin: 0, marginBottom: '8px' }}>{article.title}</h3>
                                            <p style={{ color: '#888', fontSize: '0.9rem', margin: 0 }}>
                                                Created:{' '}
                                                {new Date(article.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <span
                                            style={{
                                                backgroundColor: article.is_published ? '#e8f8f0' : '#fff8e1',
                                                color: article.is_published ? '#1a6e42' : '#8a6d00',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.85rem',
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            {article.is_published ? 'Published' : 'Draft'}
                                        </span>
                                    </div>

                                    <p style={{ color: '#555', marginBottom: '16px', maxHeight: '60px', overflow: 'hidden' }}>
                                        {stripHtml(article.content).substring(0, 150)}...
                                    </p>

                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <button
                                            onClick={() => handleStartEdit(article)}
                                            className="btn btn-primary"
                                            style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                                        >
                                            Edit
                                        </button>

                                        {!article.is_published ? (
                                            <button
                                                onClick={() => handlePublish(article.id)}
                                                className="btn btn-success"
                                                disabled={publishing === article.id}
                                                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                                            >
                                                {publishing === article.id ? 'Publishing...' : 'Publish'}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleUnpublish(article.id)}
                                                className="btn btn-warning"
                                                disabled={publishing === article.id}
                                                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                                            >
                                                {publishing === article.id ? 'Unpublishing...' : 'Unpublish'}
                                            </button>
                                        )}

                                        <button
                                            onClick={() => handleDelete(article.id)}
                                            className="btn btn-danger"
                                            disabled={deleting === article.id}
                                            style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                                        >
                                            {deleting === article.id ? 'Deleting...' : 'Delete'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminArticlesPage;
