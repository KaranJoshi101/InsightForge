import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import trainingService from '../services/trainingService';
import analyticsService from '../services/analyticsService';
import BackLink from '../components/BackLink';
import { useAuth } from '../context/AuthContext';
import SeoMeta from '../components/SeoMeta';
import { toSlug } from '../utils/slug';
import './TrainingPage.css';

const thumbnailFor = (youtubeId) => `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;

const TrainingPage = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const { category: categorySlug, slug: playlistSlug } = useParams();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [playlistVideosLoading, setPlaylistVideosLoading] = useState(false);
    const [error, setError] = useState('');

    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSection, setSelectedSection] = useState(null); // notes | videos
    const [selectedPlaylist, setSelectedPlaylist] = useState(null);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const trackedCategoryIdsRef = useRef(new Set());
    const trackedPlaylistIdsRef = useRef(new Set());

    const fetchCategories = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const response = await trainingService.getPublicCategories();
            const apiCategories = Array.isArray(response.data?.categories) ? response.data.categories : [];

            const hydrated = await Promise.all(
                apiCategories.map(async (category) => {
                    const playlists = Array.isArray(category.playlists) ? category.playlists : [];
                    const notes = Array.isArray(category.notes) ? category.notes : [];

                    const enrichedPlaylists = await Promise.all(
                        playlists.map(async (playlist) => {
                            try {
                                const itemsRes = await trainingService.getPlaylistItems(playlist.id);
                                const items = Array.isArray(itemsRes.data?.items) ? itemsRes.data.items : [];
                                return {
                                    ...playlist,
                                    videos: items,
                                    videoCount: items.length,
                                    thumbnail: items[0]?.youtube_id ? thumbnailFor(items[0].youtube_id) : null,
                                };
                            } catch (_err) {
                                return {
                                    ...playlist,
                                    videos: [],
                                    videoCount: 0,
                                    thumbnail: null,
                                };
                            }
                        })
                    );

                    return {
                        ...category,
                        playlists: enrichedPlaylists,
                        notes,
                    };
                })
            );

            // Remove auto-generated uncategorized/general section from public view.
            setCategories(hydrated.filter((category) => category.id !== null));
        } catch (_err) {
            setError('Failed to load training categories.');
        } finally {
            setLoading(false);
        }
    }, []);

    const openPlaylist = useCallback(async (playlist) => {
        try {
            setPlaylistVideosLoading(true);
            setSelectedPlaylist(playlist);
            const response = await trainingService.getPlaylistItems(playlist.id);
            const playlistVideos = Array.isArray(response.data?.items) ? response.data.items : [];
            const playlistInfo = response.data?.playlist || {};
            const hydratedPlaylist = {
                ...playlist,
                ...playlistInfo,
                videos: playlistVideos,
                videoCount: playlistVideos.length,
                thumbnail: playlistVideos[0]?.youtube_id ? thumbnailFor(playlistVideos[0].youtube_id) : playlist.thumbnail,
            };
            setSelectedPlaylist(hydratedPlaylist);
            setSelectedVideo(playlistVideos[0] || null);
            setError('');
            if (selectedCategory?.name && playlist?.name) {
                navigate(`/training/${toSlug(selectedCategory.name)}/${toSlug(playlist.name)}`, { replace: true });
            }
        } catch (_err) {
            setError('Failed to load selected playlist videos.');
        } finally {
            setPlaylistVideosLoading(false);
        }
    }, [navigate, selectedCategory]);

    const resetToCategories = () => {
        setSelectedCategory(null);
        setSelectedSection(null);
        setSelectedPlaylist(null);
        setSelectedVideo(null);
        setError('');
        navigate('/training', { replace: true });
    };

    const resetToCategoryVideos = () => {
        setSelectedPlaylist(null);
        setSelectedVideo(null);
        setError('');
        if (selectedCategory?.name) {
            navigate(`/training/${toSlug(selectedCategory.name)}`, { replace: true });
        }
    };

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    useEffect(() => {
        if (!categories.length || !categorySlug) {
            return;
        }

        const matchedCategory = categories.find((item) => toSlug(item.name) === categorySlug);
        if (!matchedCategory) {
            return;
        }

        if (!selectedCategory || selectedCategory.id !== matchedCategory.id) {
            setSelectedCategory(matchedCategory);
        }

        if (playlistSlug) {
            const matchedPlaylist = (matchedCategory.playlists || []).find((item) => toSlug(item.name) === playlistSlug);
            if (matchedPlaylist && (!selectedPlaylist || selectedPlaylist.id !== matchedPlaylist.id)) {
                setSelectedSection('videos');
                openPlaylist(matchedPlaylist);
            }
        }
    }, [categories, categorySlug, openPlaylist, playlistSlug, selectedCategory, selectedPlaylist]);

    useEffect(() => {
        if (!selectedCategory?.id) return;
        if (trackedCategoryIdsRef.current.has(selectedCategory.id)) return;

        trackedCategoryIdsRef.current.add(selectedCategory.id);

        analyticsService.trackEvent({
            event_type: 'training_view',
            entity_type: 'training',
            entity_id: selectedCategory.id,
            metadata: {
                source: 'training-category-open',
                category_name: selectedCategory.name,
            },
        }).catch(() => {
            // Ignore analytics failures.
        });
    }, [selectedCategory?.id, selectedCategory?.name]);

    useEffect(() => {
        if (!selectedPlaylist?.id || !selectedCategory?.id) return;
        if (trackedPlaylistIdsRef.current.has(selectedPlaylist.id)) return;

        trackedPlaylistIdsRef.current.add(selectedPlaylist.id);

        analyticsService.trackEvent({
            event_type: 'training_view',
            entity_type: 'training',
            entity_id: selectedCategory.id,
            metadata: {
                source: 'training-playlist-open',
                category_name: selectedCategory.name,
                playlist_id: selectedPlaylist.id,
                playlist_name: selectedPlaylist.name,
            },
        }).catch(() => {
            // Ignore analytics failures.
        });
    }, [selectedPlaylist?.id, selectedPlaylist?.name, selectedCategory?.id, selectedCategory?.name]);

    const backTo = isAuthenticated ? '/dashboard' : '/';

    return (
        <div className="container mt-4 training-page-wrap space-y-6">
            <SeoMeta
                title={selectedPlaylist ? `${selectedPlaylist.name} | Training | InsightForge` : 'Training Platform | InsightForge'}
                description={selectedPlaylist?.description || selectedCategory?.description || 'Explore categorized training videos and notes on InsightForge.'}
                keywords={['training videos', 'learning playlists', 'survey training']}
                path={selectedPlaylist && selectedCategory
                    ? `/training/${toSlug(selectedCategory.name)}/${toSlug(selectedPlaylist.name)}`
                    : '/training'}
            />
            {!selectedCategory && !selectedSection && !selectedPlaylist && <BackLink to={backTo} label="Go Back" />}

            <header className="training-header pb-2 transition-all duration-200 ease-in-out">
                <h1>Training Platform</h1>
                <p>Choose a category, then explore notes or videos.</p>
                <p style={{ marginTop: '8px' }}>
                    Complement your learning with <Link to="/articles">published articles</Link>.
                </p>
            </header>

            {error && <div className="alert alert-info alert-danger">{error}</div>}

            {loading ? (
                <section className="playlist-grid">
                    {Array.from({ length: 6 }).map((_, idx) => (
                        <article key={`skeleton-${idx}`} className="playlist-card skeleton-card">
                            <div className="playlist-thumb skeleton-block" />
                            <div className="playlist-body">
                                <div className="skeleton-line skeleton-title" />
                                <div className="skeleton-line" />
                                <div className="skeleton-line short" />
                            </div>
                        </article>
                    ))}
                </section>
            ) : (
                <>
                    {!selectedCategory && !selectedPlaylist && (
                        <section className="pt-1">
                            {categories.length === 0 ? (
                                <div className="player-empty">No training categories available yet.</div>
                            ) : (
                                <div className="training-catalog-panel">
                                    <div className="training-catalog-grid">
                                    {categories.map((category) => (
                                        <article
                                            key={category.id}
                                            className="training-catalog-card training-catalog-card--category group cursor-pointer transition-all duration-200 ease-in-out hover:shadow-lg hover:scale-[1.01] hover:bg-[rgba(0,53,148,0.03)] focus-within:ring-2 focus-within:ring-[rgba(0,53,148,0.35)]"
                                            onClick={() => setSelectedCategory(category)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    setSelectedCategory(category);
                                                }
                                            }}
                                        >
                                            <div className="training-catalog-card-icon" aria-hidden="true">CAT</div>
                                            <div className="training-catalog-card-body">
                                                <h3>{category.name}</h3>
                                                <p>{category.description || 'Organized learning resources and guided material.'}</p>
                                            </div>
                                            <div className="training-catalog-card-arrow transform transition-transform duration-200 ease-in-out group-hover:translate-x-1" aria-hidden="true">&gt;</div>
                                        </article>
                                    ))}
                                    </div>
                                </div>
                            )}
                        </section>
                    )}

                    {selectedCategory && !selectedPlaylist && (
                        <section className="pt-1">
                            <div className="playlist-detail-head" style={{ marginBottom: '16px' }}>
                                <div>
                                    <h2 style={{ marginBottom: '6px' }}>{selectedCategory.name}</h2>
                                    {selectedCategory.description && (
                                        <p className="playlist-detail-description">{selectedCategory.description}</p>
                                    )}
                                </div>
                                <button type="button" className="btn btn-secondary transition-all duration-200 ease-in-out hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,53,148,0.35)] active:scale-95" onClick={resetToCategories}>
                                    ← Back to Categories
                                </button>
                            </div>

                            <div className="training-catalog-panel">
                                <div className="training-catalog-grid training-catalog-grid--compact">
                                <article
                                    className={`training-catalog-card group cursor-pointer transition-all duration-200 ease-in-out hover:shadow-lg hover:scale-[1.01] hover:bg-[rgba(0,53,148,0.03)] focus-within:ring-2 focus-within:ring-[rgba(0,53,148,0.35)] ${selectedSection === 'notes' ? 'training-catalog-card--active' : ''}`}
                                    onClick={() => setSelectedSection('notes')}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            setSelectedSection('notes');
                                        }
                                    }}
                                >
                                    <div className="training-catalog-card-icon" aria-hidden="true">NOTE</div>
                                    <div className="training-catalog-card-body">
                                        <h3>Notes</h3>
                                        <p>{(selectedCategory.notes || []).length} note{(selectedCategory.notes || []).length === 1 ? '' : 's'}</p>
                                    </div>
                                    <div className="training-catalog-card-arrow transform transition-transform duration-200 ease-in-out group-hover:translate-x-1" aria-hidden="true">&gt;</div>
                                </article>

                                <article
                                    className={`training-catalog-card group cursor-pointer transition-all duration-200 ease-in-out hover:shadow-lg hover:scale-[1.01] hover:bg-[rgba(0,53,148,0.03)] focus-within:ring-2 focus-within:ring-[rgba(0,53,148,0.35)] ${selectedSection === 'videos' ? 'training-catalog-card--active' : ''}`}
                                    onClick={() => setSelectedSection('videos')}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            setSelectedSection('videos');
                                        }
                                    }}
                                >
                                    <div className="training-catalog-card-icon" aria-hidden="true">VID</div>
                                    <div className="training-catalog-card-body">
                                        <h3>Videos</h3>
                                        <p>{(selectedCategory.playlists || []).length} playlist{(selectedCategory.playlists || []).length === 1 ? '' : 's'}</p>
                                    </div>
                                    <div className="training-catalog-card-arrow transform transition-transform duration-200 ease-in-out group-hover:translate-x-1" aria-hidden="true">&gt;</div>
                                </article>
                                </div>
                            </div>
                        </section>
                    )}

                    {selectedCategory && selectedSection === 'notes' && !selectedPlaylist && (
                        <section style={{ marginTop: '4px' }} className="pt-1">
                            <div className="playlist-detail-head" style={{ marginBottom: '14px' }}>
                                <div>
                                    <h2 style={{ marginBottom: '6px' }}>{selectedCategory.name} - Notes</h2>
                                </div>
                            </div>

                            {Array.isArray(selectedCategory.notes) && selectedCategory.notes.length > 0 ? (
                                <div className="training-file-grid">
                                    {selectedCategory.notes.map((note) => (
                                        <article key={note.id} className="training-file-card transition-all duration-200 ease-in-out hover:shadow-md hover:bg-[rgba(0,53,148,0.02)]">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: note.content ? '12px' : '8px' }}>
                                                <strong style={{ fontSize: '15px', color: '#003594', wordBreak: 'break-word', flex: 1 }}>{note.title || '(Untitled Note)'}</strong>
                                                {note.document_url && (
                                                    <a
                                                        href={note.document_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="transition-all duration-200 ease-in-out hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,53,148,0.35)] active:scale-95"
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            padding: '6px 14px',
                                                            border: '1px solid #003594',
                                                            borderRadius: '6px',
                                                            backgroundColor: '#f0f7ff',
                                                            fontSize: '12px',
                                                            fontWeight: '600',
                                                            textDecoration: 'none',
                                                            color: '#003594',
                                                            whiteSpace: 'nowrap',
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        View Document
                                                    </a>
                                                )}
                                            </div>
                                            {note.content && <p style={{ margin: '0', whiteSpace: 'pre-wrap', color: '#666', fontSize: '13px', lineHeight: '1.5' }}>{note.content}</p>}
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <div className="player-empty">No notes available in this category yet.</div>
                            )}
                        </section>
                    )}

                    {selectedCategory && selectedSection === 'videos' && !selectedPlaylist && (
                        <section style={{ marginTop: '4px' }} className="pt-1">
                            <div className="playlist-detail-head" style={{ marginBottom: '14px' }}>
                                <div>
                                    <h2 style={{ marginBottom: '6px' }}>{selectedCategory.name} - Videos</h2>
                                    <p className="playlist-detail-description">Choose a playlist to view attached videos.</p>
                                </div>
                            </div>

                            {(selectedCategory.playlists || []).length > 0 ? (
                                <div className="training-catalog-panel">
                                    <section className="playlist-grid" style={{ marginTop: 0 }}>
                                        {(selectedCategory.playlists || []).map((playlist) => (
                                            <article
                                                key={playlist.id}
                                                className="playlist-card group cursor-pointer transition-all duration-200 ease-in-out hover:shadow-lg hover:scale-[1.01] hover:bg-[rgba(0,53,148,0.03)] focus-within:ring-2 focus-within:ring-[rgba(0,53,148,0.35)]"
                                                onClick={() => openPlaylist(playlist)}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        openPlaylist(playlist);
                                                    }
                                                }}
                                            >
                                                <div className="playlist-thumb-wrap">
                                                    {playlist.thumbnail ? (
                                                        <img src={playlist.thumbnail} alt={playlist.name} className="playlist-thumb" loading="lazy" />
                                                    ) : (
                                                        <div className="playlist-thumb fallback">No Preview</div>
                                                    )}
                                                    <div className="thumb-overlay">
                                                        <span className="play-badge transform transition-transform duration-200 ease-in-out group-hover:translate-x-1">▶</span>
                                                    </div>
                                                </div>
                                                <div className="playlist-body">
                                                    <h3>{playlist.name}</h3>
                                                    <p>{playlist.description || 'Curated training playlist for focused upskilling.'}</p>
                                                    <div className="playlist-meta">{playlist.videoCount} video{playlist.videoCount === 1 ? '' : 's'}</div>
                                                </div>
                                            </article>
                                        ))}
                                    </section>
                                </div>
                            ) : (
                                <div className="player-empty">No playlists attached to this category yet.</div>
                            )}
                        </section>
                    )}

                    {selectedPlaylist && (
                        <section className="playlist-detail pt-1">
                            <div className="playlist-detail-head">
                                <div>
                                    <h2>{selectedPlaylist.name}</h2>
                                    {selectedPlaylist.description && (
                                        <p className="playlist-detail-description">{selectedPlaylist.description}</p>
                                    )}
                                </div>
                                <button type="button" className="btn btn-secondary transition-all duration-200 ease-in-out hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,53,148,0.35)] active:scale-95" onClick={resetToCategoryVideos}>
                                    ← Back to Playlists
                                </button>
                            </div>

                            <div className="player-layout">
                                <div className="main-player">
                                    {playlistVideosLoading ? (
                                        <div className="player-skeleton skeleton-block" />
                                    ) : selectedVideo ? (
                                        <>
                                            <div className="player-frame">
                                                <iframe
                                                    src={`https://www.youtube.com/embed/${selectedVideo.youtube_id}`}
                                                    title={selectedVideo.title}
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                    referrerPolicy="strict-origin-when-cross-origin"
                                                    allowFullScreen
                                                />
                                            </div>
                                            <h3 className="player-title">{selectedVideo.title}</h3>
                                        </>
                                    ) : (
                                        <div className="player-empty">No videos in this playlist yet.</div>
                                    )}
                                </div>

                                <aside className="video-list">
                                    <div className="video-list-inner">
                                        {(selectedPlaylist.videos || []).map((video) => (
                                            <button
                                                type="button"
                                                key={video.id || video.youtube_id}
                                                className={`video-item transition-all duration-200 ease-in-out hover:shadow-md hover:scale-[1.01] hover:bg-[rgba(0,53,148,0.03)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,53,148,0.35)] active:scale-95 ${(selectedVideo?.id || selectedVideo?.youtube_id) === (video.id || video.youtube_id) ? 'active' : ''}`}
                                                onClick={() => setSelectedVideo(video)}
                                            >
                                                <img
                                                    src={thumbnailFor(video.youtube_id)}
                                                    alt={video.title}
                                                    className="video-item-thumb"
                                                />
                                                <div className="video-item-meta">
                                                    <span className="video-item-title">{video.title}</span>
                                                    <span className="video-item-duration">{video.duration_minutes ? `${video.duration_minutes} min` : 'Duration N/A'}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </aside>
                            </div>
                        </section>
                    )}
                </>
            )}
        </div>
    );
};

export default TrainingPage;
