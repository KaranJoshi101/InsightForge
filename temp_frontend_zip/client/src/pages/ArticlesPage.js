import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import articleService from '../services/articleService';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import BackLink from '../components/BackLink';
import { useAuth } from '../context/AuthContext';
import SeoMeta from '../components/SeoMeta';

const stripHtml = (html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
};

const ArticlesPage = () => {
    const { isAuthenticated } = useAuth();
    const [allArticles, setAllArticles] = useState([]);
    const [talkSummaryArticleIds, setTalkSummaryArticleIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const fetchArticles = useCallback(async () => {
        try {
            setLoading(true);
            const [articlesResult, mediaResult] = await Promise.allSettled([
                articleService.getArticles(1, 500),
                api.get('/media', { params: { limit: 500 } }),
            ]);

            if (articlesResult.status !== 'fulfilled') {
                throw articlesResult.reason;
            }

            const articlesPayload = Array.isArray(articlesResult.value.data?.articles)
                ? articlesResult.value.data.articles
                : [];
            setAllArticles(articlesPayload);

            const posts = mediaResult.status === 'fulfilled' && Array.isArray(mediaResult.value.data?.posts)
                ? mediaResult.value.data.posts
                : [];
            const attachedArticleIds = new Set(
                posts
                    .map((post) => Number(post.article_id))
                    .filter((articleId) => Number.isInteger(articleId) && articleId > 0)
            );
            setTalkSummaryArticleIds(attachedArticleIds);

            setError('');
        } catch (err) {
            setError('Failed to load articles');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const articles = useMemo(
        () => allArticles.filter((article) => !talkSummaryArticleIds.has(Number(article.id))),
        [allArticles, talkSummaryArticleIds]
    );

    const totalPages = Math.ceil(articles.length / pageSize);

    const pagedArticles = useMemo(() => {
        const startIndex = (page - 1) * pageSize;
        return articles.slice(startIndex, startIndex + pageSize);
    }, [articles, page]);

    useEffect(() => {
        fetchArticles();
    }, [fetchArticles]);

    useEffect(() => {
        const safeTotalPages = Math.max(totalPages, 1);
        if (page > safeTotalPages) {
            setPage(1);
        }
    }, [page, totalPages]);

    if (loading && allArticles.length === 0) {
        return <LoadingSpinner fullScreen={false} />;
    }

    const backTo = isAuthenticated ? '/dashboard' : '/';

    return (
        <div className="container mt-4">
            <SeoMeta
                title="Published Articles | InsightForge"
                description="Read published insights, research notes, and practical guidance from InsightForge."
                keywords={['published articles', 'survey research', 'guides', 'insights']}
                path="/articles"
            />
            <BackLink to={backTo} label="Back" />
            <h1 style={{ margin: '16px 0 8px 0', color: '#003594' }}>Published Articles</h1>
            <p style={{ color: '#555', marginBottom: '32px' }}>
                Read helpful articles and guides
            </p>
            <p style={{ marginTop: '-16px', marginBottom: '28px' }}>
                Looking for questionnaires instead? <Link to="/surveys">Browse live surveys</Link>.
            </p>

            {error && <div className="alert alert-danger">{error}</div>}

            {articles.length === 0 ? (
                <div style={{ padding: '40px' }}>
                    <p style={{ fontSize: '1.1rem', color: '#666' }}>
                        {allArticles.length === 0
                            ? 'No articles available yet.'
                            : 'No articles available in this section.'}
                    </p>
                </div>
            ) : (
                <div>
                    {pagedArticles.map((article) => (
                        <div key={article.id} className="card" style={{ marginBottom: '24px' }}>
                            <div className="card-body">
                                <h2 style={{ marginTop: '0', marginBottom: '12px' }}>
                                    <Link
                                        to={`/articles/${article.slug || article.id}`}
                                        style={{ color: '#003594', textDecoration: 'none' }}
                                    >
                                        {article.title}
                                    </Link>
                                </h2>
                                <p style={{ color: '#888', fontSize: '0.9rem', margin: '8px 0' }}>
                                    By {article.author_name} on{' '}
                                    {new Date(article.created_at).toLocaleDateString()}
                                </p>
                                <p style={{ color: '#555', marginBottom: '20px', lineHeight: '1.6' }}>
                                    {stripHtml(article.content).substring(0, 200)}...
                                </p>
                                <Link
                                    to={`/articles/${article.slug || article.id}`}
                                    className="btn btn-primary"
                                    style={{ fontSize: '0.95rem' }}
                                >
                                    Read More
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                    >
                        Previous
                    </button>
                    <span style={{ padding: '6px 12px' }}>
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default ArticlesPage;
