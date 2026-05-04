import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './MediaGrid.css';

/**
 * MediaGridSkeleton Component
 * Shows loading placeholders during data fetch
 */
const MediaGridSkeleton = ({ count = 12 }) => {
    return (
        <div className="media-grid media-grid-skeleton">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="media-card-skeleton">
                    <div className="skeleton-image"></div>
                </div>
            ))}
        </div>
    );
};

/**
 * MediaCard Component
 * Individual media post card with image, title, description, and source badge
 */
const MediaCard = ({ post, isAdmin, onEdit, onDelete, onTogglePublish, actionLoading, clickable = false, onCardClick }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    const handleCardClick = () => {
        if (isAdmin && post.status !== 'published') {
            return;
        }
        if (clickable) {
            onCardClick?.(post.id);
        }
    };

    const handleEditClick = (e) => {
        e.stopPropagation();
        onEdit(post);
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        onDelete(post.id);
    };

    const handlePublishClick = (e) => {
        e.stopPropagation();
        onTogglePublish(post);
    };


    const getGridClass = () => {
        const sizeMap = {
            small: 'media-card-small',     // 1x1
            medium: 'media-card-medium',   // 2x1
            large: 'media-card-large',     // 2x2
        };
        return sizeMap[post.size] || 'media-card-medium';
    };

    const getSourceBadgeClass = () => {
        return `source-badge source-${post.source}`;
    };

    return (
        <div className={`media-card ${getGridClass()}`} onClick={handleCardClick} style={clickable ? { cursor: 'pointer' } : {}}>
            {isAdmin && (
                <div className="media-admin-card-actions">
                    <button
                        type="button"
                        className="media-admin-btn media-admin-btn-edit"
                        onClick={handleEditClick}
                        disabled={actionLoading}
                    >
                        Edit
                    </button>
                    <button
                        type="button"
                        className="media-admin-btn media-admin-btn-delete"
                        onClick={handleDeleteClick}
                        disabled={actionLoading}
                    >
                        Delete
                    </button>
                    <button
                        type="button"
                        className={`media-admin-btn ${post.status === 'published' ? 'media-admin-btn-unpublish' : 'media-admin-btn-publish'}`}
                        onClick={handlePublishClick}
                        disabled={actionLoading}
                    >
                        {post.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                </div>
            )}
            <div className="media-card-image-wrapper">
                {!imageLoaded && !imageError && (
                    <div className="media-card-image-loading" />
                )}
                {!imageError && (
                    <img
                        src={post.image_url}
                        alt={post.title}
                        className="media-card-image"
                        loading="lazy"
                        onLoad={() => setImageLoaded(true)}
                        onError={() => {
                            setImageError(true);
                            setImageLoaded(true);
                        }}
                    />
                )}
                {imageError && (
                    <div className="media-card-image-error">
                        <span>Image not available</span>
                    </div>
                )}
                <div className="media-card-overlay">
                    <div className="media-card-content">
                        <h3 className="media-card-title">{post.title}</h3>
                        {post.description && (
                            <p className="media-card-description">{post.description}</p>
                        )}
                        {(post.article_id || post.survey_id) && (
                            <div className="media-card-links" aria-label="Linked content">
                                {post.article_id && <span className="media-card-link-chip">Talk</span>}
                                {post.survey_id && <span className="media-card-link-chip">Feedback</span>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {isAdmin && (
                <div className={`media-status-badge media-status-${post.status || 'draft'}`}>
                    {(post.status || 'draft').toUpperCase()}
                </div>
            )}
            <div className={getSourceBadgeClass()}>
                {post.source === 'linkedin' ? 'LinkedIn' : 'Featured'}
            </div>
        </div>
    );
};

/**
 * MediaGrid Component
 * Main component that fetches and displays media posts in Pinterest-style grid
 */
const MediaGrid = ({ title = 'Media Feed', limit = 50, clickable = false, adminMode = false }) => {
    const { isAdmin } = useAuth();
    const showAdminControls = isAdmin && adminMode;
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [formError, setFormError] = useState(null);
    const [surveys, setSurveys] = useState([]);
    const [articles, setArticles] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [form, setForm] = useState({
        title: '',
        description: '',
        image_url: '',
        size: 'medium',
        source: 'manual',
        status: 'draft',
        survey_id: null,
        article_id: null,
    });

    const resetForm = () => {
        setForm({
            title: '',
            description: '',
            image_url: '',
            size: 'medium',
            source: 'manual',
            status: 'draft',
            survey_id: null,
            article_id: null,
        });
        setImagePreview(null);
        setEditingId(null);
        setFormError(null);
    };

    const fetchMediaPosts = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const endpoint = showAdminControls ? '/media/admin/all' : '/media';
            const response = await api.get(endpoint, {
                params: { limit },
            });

            if (response.data.posts && Array.isArray(response.data.posts)) {
                setPosts(response.data.posts);
            } else {
                setPosts([]);
            }
        } catch (err) {
            console.error('[MediaGrid] Error fetching posts:', err.message);
            const message = err.response?.data?.error || err.message || 'Failed to load media posts';
            addToast(message, 'error');
            setError(message);
            setPosts([]);
        } finally {
            setLoading(false);
        }
    }, [limit, showAdminControls, addToast]);

    const fetchSurveys = useCallback(async () => {
        try {
            const response = await api.get('/surveys', { params: { limit: 500 } });
            const surveyList = Array.isArray(response.data?.surveys)
                ? response.data.surveys
                : [];
            setSurveys(surveyList);
        } catch (err) {
            console.warn('[MediaGrid] Could not load surveys:', err.message);
            setSurveys([]);
        }
    }, []);

    const fetchArticles = useCallback(async () => {
        try {
            const [publishedResp, adminResp] = await Promise.all([
                api.get('/articles', { params: { limit: 500 } }),
                isAdmin
                    ? api.get('/articles/admin/my-articles', { params: { limit: 500 } }).catch(() => ({ data: { articles: [] } }))
                    : Promise.resolve({ data: { articles: [] } }),
            ]);

            const publishedArticles = Array.isArray(publishedResp.data?.articles)
                ? publishedResp.data.articles
                : [];
            const adminArticles = Array.isArray(adminResp.data?.articles)
                ? adminResp.data.articles
                : [];

            const merged = [...publishedArticles, ...adminArticles];
            const deduped = merged.filter(
                (article, index, self) => self.findIndex((a) => a.id === article.id) === index
            );

            setArticles(deduped);
            if (deduped.length === 0) {
                console.warn('[MediaGrid] Articles loaded but empty list returned');
            }
        } catch (err) {
            console.warn('[MediaGrid] Could not load articles:', err.message);
            setArticles([]);
        }
    }, [isAdmin]);

    useEffect(() => {
        fetchMediaPosts();
        if (showAdminControls) {
            fetchSurveys();
            fetchArticles();
        }
    }, [fetchMediaPosts, fetchSurveys, fetchArticles, showAdminControls]);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target?.result;
                setImagePreview(base64);
                setForm((prev) => ({ ...prev, image_url: base64 }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleImageUrlChange = (e) => {
        const { value } = e.target;
        setForm((prev) => ({ ...prev, image_url: value }));
        setImagePreview(value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);

        if (!form.title.trim() || !form.image_url.trim()) {
            const validationMessage = 'Title and image are required.';
            setFormError(validationMessage);
            addToast(validationMessage, 'warning');
            return;
        }

        try {
            setActionLoading(true);
            const payload = {
                title: form.title.trim(),
                description: form.description.trim() || null,
                image_url: form.image_url.trim(),
                size: form.size,
                source: form.source,
                status: form.status,
                survey_id: form.survey_id || null,
                article_id: form.article_id || null,
            };

            if (editingId) {
                await api.put(`/media/${editingId}`, payload);
            } else {
                await api.post('/media', payload);
            }

            resetForm();
            await fetchMediaPosts();
            addToast(`Media post ${editingId ? 'updated' : 'created'} successfully`, 'success');
        } catch (err) {
            const message = err.response?.data?.error || 'Failed to save media post';
            setFormError(message);
            addToast(message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleEdit = (post) => {
        setEditingId(post.id);
        setForm({
            title: post.title || '',
            description: post.description || '',
            image_url: post.image_url || '',
            size: post.size || 'medium',
            source: post.source || 'manual',
            status: post.status || 'draft',
            survey_id: post.survey_id || null,
            article_id: post.article_id || null,
        });
        setImagePreview(post.image_url || null);
        setFormError(null);
    };

    const handleTogglePublish = async (post) => {
        try {
            setActionLoading(true);
            if (post.status === 'published') {
                await api.put(`/media/${post.id}/unpublish`);
            } else {
                await api.put(`/media/${post.id}/publish`);
            }
            await fetchMediaPosts();
            addToast('Media post status updated', 'success');
        } catch (err) {
            const message = err.response?.data?.error || 'Failed to update publish status';
            setFormError(message);
            addToast(message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this media post?')) {
            return;
        }

        try {
            setActionLoading(true);
            await api.delete(`/media/${id}`);
            await fetchMediaPosts();
            addToast('Media post deleted successfully', 'success');
            if (editingId === id) {
                resetForm();
            }
        } catch (err) {
            const message = err.response?.data?.error || 'Failed to delete media post';
            setFormError(message);
            addToast(message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // No posts message (public mode only)
    if (!loading && posts.length === 0 && !error && !showAdminControls) {
        return (
            <div className="media-grid-empty">
                <p>No media posts available yet.</p>
            </div>
        );
    }

    // Error state (public mode only)
    if (error && !loading && !showAdminControls) {
        return (
            <div className="media-grid-error">
                <p>Error loading media: {error}</p>
                <button
                    className="media-grid-retry-btn"
                    onClick={() => window.location.reload()}
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <>
            {title && <h2 className="media-grid-title">{title}</h2>}
            {showAdminControls && (
                <div className="media-admin-panel">
                    <div className="media-admin-header">
                        <h3>{editingId ? '✏️ Edit Media Post' : '➕ Add New Media Post'}</h3>
                        <p className="media-admin-hint">{editingId ? 'Update the media post details below' : 'Create a new media post with title, image, and description'}</p>
                    </div>

                    <form className="media-admin-form" onSubmit={handleSubmit}>
                        {/* Image Section */}
                        <div className="media-form-section">
                            <h4 className="media-form-section-title">📸 Image</h4>
                            
                            <div className="media-form-field">
                                <label>
                                    <strong>Add Image</strong>
                                    <span className="media-form-required">*</span>
                                </label>
                                <p className="media-form-help">Choose one: upload a file or paste a URL</p>
                                
                                <div className="media-image-input-group">
                                    <div className="media-image-input-col">
                                        <label htmlFor="image_file_input" className="media-image-upload-label">
                                            📤 Upload File
                                        </label>
                                        <input
                                            id="image_file_input"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageFileChange}
                                            className="media-form-file-input"
                                        />
                                    </div>

                                    <div className="media-image-divider">or</div>

                                    <div className="media-image-input-col">
                                        <label htmlFor="image_url_input" className="media-image-url-label">
                                            🔗 Paste URL
                                        </label>
                                        <input
                                            id="image_url_input"
                                            type="url"
                                            name="image_url"
                                            placeholder="https://example.com/image.jpg"
                                            value={form.image_url}
                                            onChange={handleImageUrlChange}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {imagePreview && (
                                <div className="media-preview-container">
                                    <p className="media-preview-label">✓ Preview:</p>
                                    <img src={imagePreview} alt="Preview" className="media-preview-image" />
                                </div>
                            )}
                        </div>

                        {/* Content Section */}
                        <div className="media-form-section">
                            <h4 className="media-form-section-title">📝 Content</h4>
                            
                            <div className="media-form-field">
                                <label htmlFor="title_input">
                                    <strong>Title</strong>
                                    <span className="media-form-required">*</span>
                                </label>
                                <input
                                    id="title_input"
                                    type="text"
                                    name="title"
                                    placeholder="e.g., Research Breakthrough in Biostatistics"
                                    value={form.title}
                                    onChange={handleFormChange}
                                    required
                                />
                                <p className="media-form-help">A catchy title for the media post (required)</p>
                            </div>

                            <div className="media-form-field">
                                <label htmlFor="description_input">
                                    <strong>Description</strong>
                                </label>
                                <textarea
                                    id="description_input"
                                    name="description"
                                    placeholder="Add a brief description of this media post..."
                                    value={form.description}
                                    onChange={handleFormChange}
                                    rows={3}
                                />
                                <p className="media-form-help">Optional short description that appears on the grid card</p>
                            </div>
                        </div>

                        {/* Linked Content Section */}
                        <div className="media-form-section">
                            <h4 className="media-form-section-title">🔗 Link Content</h4>
                            <p className="media-form-help" style={{ marginBottom: '16px' }}>Optionally attach an existing article or feedback form to this media post</p>
                            
                            <div className="media-form-field">
                                <label htmlFor="article_select">
                                    <strong>Talk Article (Optional)</strong>
                                </label>
                                <select 
                                    id="article_select" 
                                    name="article_id" 
                                    value={form.article_id || ''} 
                                    onChange={(e) => setForm((prev) => ({ ...prev, article_id: e.target.value ? parseInt(e.target.value) : null }))}
                                >
                                    <option value="">-- No Article --</option>
                                    {articles.map((article) => (
                                        <option key={article.id} value={article.id}>
                                            {article.title}
                                        </option>
                                    ))}
                                </select>
                                <p className="media-form-help">Select an article to display on this media's detail page</p>
                            </div>

                            <div className="media-form-field">
                                <label htmlFor="survey_select">
                                    <strong>Feedback Form (Optional)</strong>
                                </label>
                                <select 
                                    id="survey_select" 
                                    name="survey_id" 
                                    value={form.survey_id || ''} 
                                    onChange={(e) => setForm((prev) => ({ ...prev, survey_id: e.target.value ? parseInt(e.target.value) : null }))}
                                >
                                    <option value="">-- No Feedback Form --</option>
                                    {surveys.map((survey) => (
                                        <option key={survey.id} value={survey.id}>
                                            {survey.title}
                                        </option>
                                    ))}
                                </select>
                                <p className="media-form-help">Select a feedback form users can submit from this media page</p>
                            </div>

                            {(form.article_id || form.survey_id) && (
                                <p className="media-form-help" style={{ marginTop: '10px', color: '#8a5a00', fontWeight: 600 }}>
                                    Linked Talk/Feedback entities are auto-published; media card visibility can still be toggled.
                                </p>
                            )}
                        </div>

                        {/* Display Settings Section */}
                        <div className="media-form-section">
                            <h4 className="media-form-section-title">⚙️ Display Settings</h4>
                            
                            <div className="media-form-row">
                                <div className="media-form-field">
                                    <label htmlFor="size_select">
                                        <strong>Card Size</strong>
                                    </label>
                                    <select id="size_select" name="size" value={form.size} onChange={handleFormChange}>
                                        <option value="small">Small (1×1)</option>
                                        <option value="medium">Medium (2×1) - Recommended</option>
                                        <option value="large">Large (2×2)</option>
                                    </select>
                                    <p className="media-form-help">How large the card appears in the grid</p>
                                </div>

                                <div className="media-form-field">
                                    <label htmlFor="source_select">
                                        <strong>Source</strong>
                                    </label>
                                    <select id="source_select" name="source" value={form.source} onChange={handleFormChange}>
                                        <option value="manual">Manual Upload</option>
                                        <option value="linkedin">LinkedIn Post</option>
                                    </select>
                                    <p className="media-form-help">Where this content originated</p>
                                </div>

                                <div className="media-form-field">
                                    <label htmlFor="status_select">
                                        <strong>Status</strong>
                                    </label>
                                    <select
                                        id="status_select"
                                        name="status"
                                        value={form.status}
                                        onChange={handleFormChange}
                                        disabled={Boolean(form.article_id || form.survey_id)}
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="published">Published</option>
                                    </select>
                                    <p className="media-form-help">
                                        Draft media is hidden from public feed until published by admin.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {formError && <p className="media-admin-error">⚠️ {formError}</p>}

                        <div className="media-admin-actions">
                            <button type="submit" className="media-admin-btn-primary" disabled={actionLoading}>
                                {actionLoading ? 'Processing...' : editingId ? '💾 Update Post' : '✨ Create Post'}
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    className="media-admin-btn-cancel"
                                    onClick={resetForm}
                                    disabled={actionLoading}
                                >
                                    ✕ Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}
            {loading ? (
                <MediaGridSkeleton count={12} />
            ) : (
                <>
                    {showAdminControls && error && (
                        <div className="media-grid-error" style={{ marginBottom: '16px' }}>
                            <p>Error loading media list: {error}</p>
                            <button
                                className="media-grid-retry-btn"
                                onClick={fetchMediaPosts}
                            >
                                Retry
                            </button>
                        </div>
                    )}
                    {!error && posts.length === 0 ? (
                        <div className="media-grid-empty">
                            <p>No media posts available yet.</p>
                        </div>
                    ) : (
                        <div className="media-grid">
                            {posts.map((post) => (
                                <MediaCard
                                    key={post.id}
                                    post={post}
                                    isAdmin={showAdminControls}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onTogglePublish={handleTogglePublish}
                                    actionLoading={actionLoading}
                                    clickable={clickable}
                                    onCardClick={(postId) => {
                                        if (clickable) {
                                            navigate(`/media/${postId}`);
                                        }
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}
        </>
    );
};

export default MediaGrid;
