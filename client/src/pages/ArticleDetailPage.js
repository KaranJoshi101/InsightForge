import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import articleService from '../services/articleService';
import LoadingSpinner from '../components/LoadingSpinner';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

const normalizeArticleImageUrls = (html) => {
    if (!html) return html;

    // Rewrite root-relative uploads to backend origin so images resolve in dev and prod.
    return html.replace(/src=(['"])\/uploads\//gi, `src=$1${API_ORIGIN}/uploads/`);
};

const ArticleDetailPage = () => {
    const { id } = useParams();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchArticle = useCallback(async () => {
        try {
            setLoading(true);
            const response = await articleService.getArticleById(id);
            setArticle(response.data.article);
            setError('');
        } catch (err) {
            setError('Failed to load article');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchArticle();
    }, [fetchArticle]);

    if (loading) {
        return <LoadingSpinner fullScreen={false} />;
    }

    if (error || !article) {
        return (
            <div className="container mt-4">
                <div className="alert alert-danger">{error || 'Article not found'}</div>
                <Link to="/articles" className="btn btn-primary">
                    Back to Articles
                </Link>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <Link to="/articles" style={{ color: '#003594', textDecoration: 'none' }}>
                ← Back to Articles
            </Link>

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
                        dangerouslySetInnerHTML={{ __html: normalizeArticleImageUrls(article.content) }}
                    />
                </div>
            </article>
        </div>
    );
};

export default ArticleDetailPage;
