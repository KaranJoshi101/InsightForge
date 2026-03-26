import React, { useEffect, useState, useCallback } from 'react';
import trainingService from '../services/trainingService';
import BackLink from '../components/BackLink';
import { useAuth } from '../context/AuthContext';
import './TrainingPage.css';

const thumbnailFor = (youtubeId) => `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;

const TrainingPage = () => {
    const { isAuthenticated } = useAuth();
    const [playlists, setPlaylists] = useState([]);
    const [playlistsLoading, setPlaylistsLoading] = useState(true);
    const [playlistVideosLoading, setPlaylistVideosLoading] = useState(false);
    const [error, setError] = useState('');

    const [selectedPlaylist, setSelectedPlaylist] = useState(null);
    const [selectedVideo, setSelectedVideo] = useState(null);

    const fetchPlaylists = useCallback(async () => {
        try {
            setPlaylistsLoading(true);
            setError('');
            const response = await trainingService.getPublicPlaylists();
            const apiPlaylists = Array.isArray(response.data?.playlists) ? response.data.playlists : [];

            const hydrated = await Promise.all(
                apiPlaylists.map(async (playlist) => {
                    try {
                        const itemsRes = await trainingService.getPlaylistItems(playlist.id);
                        const items = Array.isArray(itemsRes.data?.items) ? itemsRes.data.items : [];
                        return {
                            ...playlist,
                            videos: items,
                            videoCount: items.length,
                            thumbnail: items[0]?.youtube_id ? thumbnailFor(items[0].youtube_id) : null,
                        };
                    } catch (_itemErr) {
                        return {
                            ...playlist,
                            videos: [],
                            videoCount: 0,
                            thumbnail: null,
                        };
                    }
                })
            );

            setPlaylists(hydrated);
        } catch (err) {
            setError('Failed to load playlists.');
        } finally {
            setPlaylistsLoading(false);
        }
    }, []);

    const openPlaylist = async (playlist) => {
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
        } catch (err) {
            setError('Failed to load selected playlist videos.');
        } finally {
            setPlaylistVideosLoading(false);
        }
    };

    const closePlaylist = () => {
        setSelectedPlaylist(null);
        setSelectedVideo(null);
        setError('');
    };

    useEffect(() => {
        const loadData = async () => {
            await fetchPlaylists();
        };
        loadData();
    }, [fetchPlaylists]);

    const backTo = isAuthenticated ? '/dashboard' : '/';

    return (
        <div className="container mt-4 training-page-wrap">
            {!selectedPlaylist && <BackLink to={backTo} label="Go Back" />}

            {!selectedPlaylist && (
                <header className="training-header">
                    <h1>Training Platform</h1>
                    <p>Explore curated learning playlists to advance your skills</p>
                </header>
            )}

            {error && <div className="alert alert-info alert-danger">{error}</div>}

            {!selectedPlaylist && (
                <>
                    <section className="playlist-grid">
                        {playlistsLoading
                            ? Array.from({ length: 6 }).map((_, idx) => (
                                <article key={`skeleton-${idx}`} className="playlist-card skeleton-card">
                                    <div className="playlist-thumb skeleton-block" />
                                    <div className="playlist-body">
                                        <div className="skeleton-line skeleton-title" />
                                        <div className="skeleton-line" />
                                        <div className="skeleton-line short" />
                                    </div>
                                </article>
                            ))
                            : playlists.map((playlist) => (
                                <article
                                    key={playlist.id}
                                    className="playlist-card"
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
                                            <img src={playlist.thumbnail} alt={playlist.name} className="playlist-thumb" />
                                        ) : (
                                            <div className="playlist-thumb fallback">No Preview</div>
                                        )}
                                        <div className="thumb-overlay">
                                            <span className="play-badge">▶</span>
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
                </>
            )}

            {selectedPlaylist && (
                <section className="playlist-detail">
                    <div className="playlist-detail-head">
                        <div>
                            <h2>{selectedPlaylist.name}</h2>
                            {selectedPlaylist.description && (
                                <p className="playlist-detail-description">{selectedPlaylist.description}</p>
                            )}
                        </div>
                        <button type="button" className="btn btn-secondary" onClick={closePlaylist}>
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
                                        className={`video-item ${(selectedVideo?.id || selectedVideo?.youtube_id) === (video.id || video.youtube_id) ? 'active' : ''}`}
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
        </div>
    );
};

export default TrainingPage;
