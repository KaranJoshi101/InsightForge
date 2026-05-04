import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import articleService from '../services/articleService';
import LoadingSpinner from '../components/LoadingSpinner';
import BackLink from '../components/BackLink';
import SeoMeta from '../components/SeoMeta';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

const normalizeLinkHref = (href) => {
    if (!href) return href;
    const trimmed = href.trim();
    if (!trimmed) return trimmed;

    if (/^(https?:|mailto:|tel:|#|\/)/i.test(trimmed)) {
        return trimmed;
    }

    return `https://${trimmed}`;
};

const normalizeArticleContent = (html) => {
    if (!html) return html;

    const container = document.createElement('div');
    container.innerHTML = html;

    container.querySelectorAll('img[src]').forEach((image) => {
        const src = image.getAttribute('src');
        if (src && src.startsWith('/uploads/')) {
            image.setAttribute('src', `${API_ORIGIN}${src}`);
        }
    });

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

const plainText = (value) => {
    const container = document.createElement('div');
    container.innerHTML = value || '';
    return (container.textContent || '').trim();
};

const ArticleDetailPage = () => {
    const { slug } = useParams();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchArticle = useCallback(async () => {
        try {
            setLoading(true);
            const response = await articleService.getArticleById(slug);
            setArticle(response.data.article);
            setError('');
        } catch (err) {
            setError('Failed to load article');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [slug]);

    useEffect(() => {
        fetchArticle();
    }, [fetchArticle]);

    if (loading) {
        return <LoadingSpinner fullScreen={false} />;
    }

    if (error || !article) {
        return (
            <div className="container mt-4">
                <BackLink to="/articles" label="Go Back" />
                <div className="alert alert-danger">{error || 'Article not found'}</div>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <SeoMeta
                title={`${article.title} | InsightForge Articles`}
                description={plainText(article.content).slice(0, 160)}
                keywords={['article', 'survey insights', article.author_name || 'author']}
                path={`/articles/${article.slug || slug}`}
                type="article"
            />
            <BackLink to="/articles" label="Back to Articles" />

            <article className="card mt-3" style={{ maxWidth: '800px', margin: '24px auto 0' }}>
                <div className="card-body">
                    <h1>{article.title}</h1>
                    <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: '24px' }}>
                        <p>
                            By <strong>{article.author_name}</strong> on{' '}
                            {new Date(article.created_at).toLocaleDateString()}
                        </p>
                    </div>

                    <div
                        className="article-content"
                        style={{
                            lineHeight: '1.8',
                            color: '#2B2B2B',
                            fontSize: '1.05rem',
                        }}
                        dangerouslySetInnerHTML={{ __html: normalizeArticleContent(article.content) }}
                    />
                    <p style={{ marginTop: '24px' }}>
                        Want to apply these ideas? <Link to="/surveys">Take a survey</Link>.
                    </p>
                </div>
            </article>
        </div>
    );
};

export default ArticleDetailPage;
