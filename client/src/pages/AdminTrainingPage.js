import React, { useEffect, useState, useCallback } from 'react';
import trainingService from '../services/trainingService';
import LoadingSpinner from '../components/LoadingSpinner';
import BackLink from '../components/BackLink';

const initialPlaylistForm = {
    youtube_playlist_url: '',
};

const AdminTrainingPage = () => {
    const [playlists, setPlaylists] = useState([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState(null);
    const [playlistItems, setPlaylistItems] = useState([]);
    const [isEditingPlaylist, setIsEditingPlaylist] = useState(false);
    const [editFormData, setEditFormData] = useState({ name: '', description: '' });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [playlistError, setPlaylistError] = useState('');
    const [formError, setFormError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [playlistForm, setPlaylistForm] = useState(initialPlaylistForm);

    const loadPlaylists = useCallback(async () => {
        try {
            const response = await trainingService.getAdminPlaylists(1, 50);
            setPlaylists(response.data.playlists || []);
            setPlaylistError('');
        } catch (_err) {
            setPlaylistError('Failed to load playlists');
        }
    }, []);

    const loadPlaylistItems = useCallback(async (playlistId) => {
        try {
            const response = await trainingService.getPlaylistItems(playlistId);
            setPlaylistItems(response.data.items || []);
        } catch (_err) {
            setPlaylistItems([]);
        }
    }, []);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                await loadPlaylists();
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [loadPlaylists]);

    const resetPlaylistForm = () => {
        setPlaylistForm(initialPlaylistForm);
        setFormError('');
    };

    const handleSubmitPlaylist = async (e) => {
        e.preventDefault();
        setFormError('');
        setSuccessMessage('');

        if (!playlistForm.youtube_playlist_url.trim()) {
            setFormError('YouTube playlist URL is required.');
            return;
        }

        try {
            setSaving(true);
            const payload = {
                youtube_playlist_url: playlistForm.youtube_playlist_url.trim(),
            };

            const response = await trainingService.createPlaylist(payload);
            await loadPlaylists();
            resetPlaylistForm();

            const importedCount = response?.data?.imported_videos_count;
            const countText = Number.isInteger(importedCount) ? ` (${importedCount} videos)` : '';
            setSuccessMessage(`Playlist imported successfully${countText}.`);
            setTimeout(() => setSuccessMessage(''), 4000);
        } catch (err) {
            setFormError(err.response?.data?.error || 'Failed to import playlist');
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePlaylist = async (id) => {
        if (!window.confirm('Delete this playlist?')) {
            return;
        }

        try {
            setSaving(true);
            await trainingService.deletePlaylist(id);
            await loadPlaylists();

            if (selectedPlaylist?.id === id) {
                setSelectedPlaylist(null);
                setPlaylistItems([]);
            }
        } catch (err) {
            setFormError(err.response?.data?.error || 'Failed to delete playlist');
        } finally {
            setSaving(false);
        }
    };

    const handleSelectPlaylist = async (playlist) => {
        setSelectedPlaylist(playlist);
        setIsEditingPlaylist(false);
        setEditFormData({ name: playlist.name, description: playlist.description || '' });
        await loadPlaylistItems(playlist.id);
    };

    const handleUpdatePlaylist = async (e) => {
        e.preventDefault();
        setFormError('');
        setSuccessMessage('');

        if (!editFormData.name.trim()) {
            setFormError('Playlist name is required.');
            return;
        }

        try {
            setSaving(true);
            const payload = {
                name: editFormData.name.trim(),
                description: editFormData.description.trim(),
            };

            await trainingService.updatePlaylist(selectedPlaylist.id, payload);
            await loadPlaylists();
            
            // Update selectedPlaylist with new data
            setSelectedPlaylist((prev) => ({
                ...prev,
                name: editFormData.name.trim(),
                description: editFormData.description.trim(),
            }));
            
            setIsEditingPlaylist(false);
            setSuccessMessage('Playlist updated successfully.');
            setTimeout(() => setSuccessMessage(''), 4000);
        } catch (err) {
            setFormError(err.response?.data?.error || 'Failed to update playlist');
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveVideoFromPlaylist = async (itemId) => {
        if (!window.confirm('Remove this video from the playlist?')) {
            return;
        }

        try {
            setSaving(true);
            await trainingService.removeVideoFromPlaylist(selectedPlaylist.id, itemId);
            await loadPlaylistItems(selectedPlaylist.id);
        } catch (err) {
            setFormError(err.response?.data?.error || 'Failed to remove video');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <LoadingSpinner fullScreen={false} />;
    }

    return (
        <div className="container mt-4">
            <BackLink to="/admin" label="Back to Admin" />

            <div style={{ marginTop: '24px' }}>
                <h2>Training Administration</h2>
                <p style={{ color: '#666', marginBottom: '24px' }}>
                    Import public YouTube playlists by URL. Videos are fetched and added automatically.
                </p>

                <div
                    style={{
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #dee2e6',
                        borderRadius: '8px',
                        padding: '24px',
                        marginBottom: '32px',
                    }}
                >
                    <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Import YouTube Playlist</h3>

                    <form onSubmit={handleSubmitPlaylist}>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                YouTube Playlist URL
                            </label>
                            <input
                                type="text"
                                placeholder="https://www.youtube.com/playlist?list=..."
                                value={playlistForm.youtube_playlist_url}
                                onChange={(e) =>
                                    setPlaylistForm({
                                        youtube_playlist_url: e.target.value,
                                    })
                                }
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1px solid #ced4da',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    fontFamily: 'monospace',
                                }}
                                disabled={saving}
                            />
                            <small style={{ color: '#999', display: 'block', marginTop: '6px' }}>
                                The playlist must be public.
                            </small>
                        </div>

                        {formError && (
                            <div
                                style={{
                                    backgroundColor: '#f8d7da',
                                    color: '#721c24',
                                    padding: '12px',
                                    borderRadius: '4px',
                                    marginBottom: '16px',
                                    border: '1px solid #f5c6cb',
                                }}
                            >
                                {formError}
                            </div>
                        )}

                        {successMessage && (
                            <div
                                style={{
                                    backgroundColor: '#d4edda',
                                    color: '#155724',
                                    padding: '12px',
                                    borderRadius: '4px',
                                    marginBottom: '16px',
                                    border: '1px solid #c3e6cb',
                                }}
                            >
                                {successMessage}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={saving}
                            style={{
                                backgroundColor: '#003594',
                                color: 'white',
                                padding: '10px 20px',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: saving ? 'not-allowed' : 'pointer',
                                opacity: saving ? 0.6 : 1,
                                fontSize: '14px',
                                fontWeight: '600',
                            }}
                        >
                            {saving ? 'Importing...' : 'Import Playlist'}
                        </button>
                    </form>
                </div>

                <div>
                    <h3 style={{ marginBottom: '16px' }}>Playlists ({playlists.length})</h3>

                    {playlistError && (
                        <div
                            style={{
                                backgroundColor: '#f8d7da',
                                color: '#721c24',
                                padding: '12px',
                                borderRadius: '4px',
                                marginBottom: '16px',
                            }}
                        >
                            {playlistError}
                        </div>
                    )}

                    {playlists.length === 0 ? (
                        <div
                            style={{
                                backgroundColor: '#e7f3ff',
                                border: '1px solid #b3d9ff',
                                borderRadius: '4px',
                                padding: '16px',
                                color: '#004085',
                            }}
                        >
                            No playlists yet. Import one using the URL form above.
                        </div>
                    ) : (
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                gap: '16px',
                            }}
                        >
                            {playlists.map((playlist) => (
                                <div
                                    key={playlist.id}
                                    style={{
                                        border: selectedPlaylist?.id === playlist.id ? '2px solid #003594' : '1px solid #dee2e6',
                                        borderRadius: '8px',
                                        padding: '16px',
                                        backgroundColor: selectedPlaylist?.id === playlist.id ? '#f0f5ff' : '#fff',
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => handleSelectPlaylist(playlist)}
                                >
                                    <h5 style={{ margin: '0 0 8px 0', color: '#003594' }}>{playlist.name}</h5>
                                    <p style={{ fontSize: '13px', color: '#666', margin: '8px 0' }}>
                                        {playlist.youtube_playlist_url || 'No source URL saved'}
                                    </p>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeletePlaylist(playlist.id);
                                        }}
                                        disabled={saving}
                                        style={{
                                            backgroundColor: '#dc3545',
                                            color: 'white',
                                            padding: '8px 12px',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: saving ? 'not-allowed' : 'pointer',
                                            fontSize: '13px',
                                        }}
                                    >
                                        Delete Playlist
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {selectedPlaylist && (
                    <div
                        style={{
                            marginTop: '32px',
                            backgroundColor: '#f0f5ff',
                            border: '2px solid #003594',
                            borderRadius: '8px',
                            padding: '24px',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '16px',
                            }}
                        >
                            <h4 style={{ marginTop: 0, marginBottom: 0, color: '#003594' }}>
                                {isEditingPlaylist ? 'Edit Playlist' : `Playlist: ${selectedPlaylist.name}`}
                            </h4>
                            {!isEditingPlaylist && (
                                <button
                                    onClick={() => setIsEditingPlaylist(true)}
                                    disabled={saving}
                                    style={{
                                        backgroundColor: '#FFB81C',
                                        color: '#333',
                                        padding: '8px 16px',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: saving ? 'not-allowed' : 'pointer',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                    }}
                                >
                                    Edit Playlist
                                </button>
                            )}
                        </div>

                        {isEditingPlaylist && (
                            <form onSubmit={handleUpdatePlaylist} style={{ marginBottom: '24px' }}>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                        Playlist Name
                                    </label>
                                    <input
                                        type="text"
                                        value={editFormData.name}
                                        onChange={(e) =>
                                            setEditFormData({ ...editFormData, name: e.target.value })
                                        }
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                        }}
                                        disabled={saving}
                                    />
                                </div>

                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                        Description
                                    </label>
                                    <textarea
                                        value={editFormData.description}
                                        onChange={(e) =>
                                            setEditFormData({ ...editFormData, description: e.target.value })
                                        }
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            fontFamily: '"Source Sans Pro", sans-serif',
                                            minHeight: '100px',
                                            resize: 'vertical',
                                        }}
                                        disabled={saving}
                                        placeholder="Enter a description for this playlist..."
                                    />
                                    <small style={{ color: '#999', display: 'block', marginTop: '6px' }}>
                                        Maximum 1000 characters
                                    </small>
                                </div>

                                {formError && (
                                    <div
                                        style={{
                                            backgroundColor: '#f8d7da',
                                            color: '#721c24',
                                            padding: '12px',
                                            borderRadius: '4px',
                                            marginBottom: '16px',
                                            border: '1px solid #f5c6cb',
                                        }}
                                    >
                                        {formError}
                                    </div>
                                )}

                                {successMessage && (
                                    <div
                                        style={{
                                            backgroundColor: '#d4edda',
                                            color: '#155724',
                                            padding: '12px',
                                            borderRadius: '4px',
                                            marginBottom: '16px',
                                            border: '1px solid #c3e6cb',
                                        }}
                                    >
                                        {successMessage}
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        style={{
                                            backgroundColor: '#28a745',
                                            color: 'white',
                                            padding: '10px 20px',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: saving ? 'not-allowed' : 'pointer',
                                            opacity: saving ? 0.6 : 1,
                                            fontSize: '14px',
                                            fontWeight: '600',
                                        }}
                                    >
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsEditingPlaylist(false);
                                            setFormError('');
                                            setSuccessMessage('');
                                        }}
                                        disabled={saving}
                                        style={{
                                            backgroundColor: '#6c757d',
                                            color: 'white',
                                            padding: '10px 20px',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: saving ? 'not-allowed' : 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}

                        <h4 style={{ marginTop: '16px', marginBottom: '16px', color: '#003594' }}>
                            Videos ({playlistItems.length})
                        </h4>

                        {playlistItems.length === 0 ? (
                            <p style={{ color: '#666', marginTop: '16px' }}>No videos in this playlist.</p>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#e8f0ff', borderBottom: '2px solid #003594' }}>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>#</th>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Video</th>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>YouTube ID</th>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Duration</th>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {playlistItems.map((item, index) => (
                                            <tr key={item.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                                                <td style={{ padding: '12px' }}>{index + 1}</td>
                                                <td style={{ padding: '12px' }}>{item.title}</td>
                                                <td style={{ padding: '12px', fontFamily: 'monospace' }}>{item.youtube_id}</td>
                                                <td style={{ padding: '12px' }}>
                                                    {item.duration_minutes ? `${item.duration_minutes} min` : '-'}
                                                </td>
                                                <td style={{ padding: '12px' }}>
                                                    <button
                                                        onClick={() => handleRemoveVideoFromPlaylist(item.id)}
                                                        disabled={saving}
                                                        style={{
                                                            backgroundColor: '#dc3545',
                                                            color: 'white',
                                                            padding: '6px 10px',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: saving ? 'not-allowed' : 'pointer',
                                                            fontSize: '12px',
                                                        }}
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminTrainingPage;
