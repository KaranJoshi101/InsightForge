import React, { useEffect, useState, useCallback, useMemo } from 'react';
import trainingService from '../services/trainingService';
import LoadingSpinner from '../components/LoadingSpinner';
import BackLink from '../components/BackLink';

const initialCategoryForm = {
    name: '',
    description: '',
};

const initialPlaylistForm = {
    youtube_playlist_url: '',
};

const initialNoteForm = {
    title: '',
    document_url: '',
};

const AdminTrainingPage = () => {
    const [categories, setCategories] = useState([]);
    const [playlists, setPlaylists] = useState([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [selectedSection, setSelectedSection] = useState(null); // notes | videos
    const [notes, setNotes] = useState([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState(null);
    const [playlistItems, setPlaylistItems] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [categoryForm, setCategoryForm] = useState(initialCategoryForm);
    const [editingCategoryId, setEditingCategoryId] = useState(null);

    const [playlistForm, setPlaylistForm] = useState(initialPlaylistForm);

    const [noteForm, setNoteForm] = useState(initialNoteForm);
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [uploadingNoteFile, setUploadingNoteFile] = useState(false);

    const selectedCategory = useMemo(
        () => categories.find((category) => category.id === selectedCategoryId) || null,
        [categories, selectedCategoryId]
    );

    const filteredPlaylists = useMemo(
        () => playlists.filter((playlist) => playlist.category_id === selectedCategoryId),
        [playlists, selectedCategoryId]
    );

    const breadcrumb = useMemo(() => {
        const trail = ['Categories'];

        if (selectedCategory?.name) {
            trail.push(selectedCategory.name);
        }

        if (selectedSection === 'notes') {
            trail.push('Notes');
        }

        if (selectedSection === 'videos') {
            trail.push('Videos');
            if (selectedPlaylist?.name) {
                trail.push(selectedPlaylist.name);
            }
        }

        return trail;
    }, [selectedCategory, selectedSection, selectedPlaylist]);


    // Restore missing utility functions
    const resetTransientMessages = () => {
        setError('');
        setSuccessMessage('');
    };

    const loadCategories = useCallback(async () => {
        const response = await trainingService.getAdminCategories();
        const next = Array.isArray(response.data?.categories) ? response.data.categories : [];
        setCategories(next);

        if (!next.length) {
            setSelectedCategoryId(null);
            return;
        }

        setSelectedCategoryId((prev) => {
            if (prev && next.some((category) => category.id === prev)) {
                return prev;
            }
            return next[0].id;
        });
    }, []);

    const loadPlaylists = useCallback(async () => {
        const response = await trainingService.getAdminPlaylists(1, 200);
        const next = Array.isArray(response.data?.playlists) ? response.data.playlists : [];
        setPlaylists(next);
    }, []);

    const loadNotes = useCallback(async (categoryId) => {
        if (!categoryId) {
            setNotes([]);
            return;
        }

        try {
            const response = await trainingService.getAdminCategoryNotes(categoryId);
            setNotes(Array.isArray(response.data?.notes) ? response.data.notes : []);
        } catch (_err) {
            setNotes([]);
        }
    }, []);

    const loadPlaylistItems = useCallback(async (playlistId) => {
        if (!playlistId) {
            setPlaylistItems([]);
            return;
        }

        try {
            const response = await trainingService.getPlaylistItems(playlistId);
            setPlaylistItems(Array.isArray(response.data?.items) ? response.data.items : []);
        } catch (_err) {
            setPlaylistItems([]);
        }
    }, []);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                resetTransientMessages();
                await Promise.all([loadCategories(), loadPlaylists()]);
            } catch (_err) {
                setError('Failed to load training administration data.');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [loadCategories, loadPlaylists]);

    useEffect(() => {
        loadNotes(selectedCategoryId);
        setSelectedSection(null);
        setSelectedPlaylist((prev) => {
            if (!prev) return null;
            return prev.category_id === selectedCategoryId ? prev : null;
        });
        setPlaylistItems([]);
    }, [selectedCategoryId, loadNotes]);

    const handleSubmitCategory = async (e) => {
        e.preventDefault();
        resetTransientMessages();

        if (!categoryForm.name.trim()) {
            setError('Category name is required.');
            return;
        }

        try {
            setSaving(true);
            const payload = {
                name: categoryForm.name.trim(),
                description: categoryForm.description.trim() || null,
            };

            if (editingCategoryId) {
                await trainingService.updateCategory(editingCategoryId, payload);
                setSuccessMessage('Category updated successfully.');
            } else {
                await trainingService.createCategory(payload);
                setSuccessMessage('Category created successfully.');
            }

            setCategoryForm(initialCategoryForm);
            setEditingCategoryId(null);
            await loadCategories();
            await loadPlaylists();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save category.');
        } finally {
            setSaving(false);
        }
    };

    const handleEditCategory = (category) => {
        setEditingCategoryId(category.id);
        setCategoryForm({
            name: category.name || '',
            description: category.description || '',
        });
        resetTransientMessages();
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm('Delete this category? Notes in this category will be deleted and playlists will be uncategorized.')) {
            return;
        }

        try {
            setSaving(true);
            resetTransientMessages();
            await trainingService.deleteCategory(id);
            setSuccessMessage('Category deleted successfully.');

            if (selectedCategoryId === id) {
                setSelectedCategoryId(null);
                setSelectedSection(null);
                setSelectedPlaylist(null);
                setPlaylistItems([]);
            }

            await loadCategories();
            await loadPlaylists();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete category.');
        } finally {
            setSaving(false);
        }
    };

    const handleSubmitPlaylist = async (e) => {
        e.preventDefault();
        resetTransientMessages();

        if (!selectedCategoryId) {
            setError('Select a category first to import a playlist under it.');
            return;
        }

        if (!playlistForm.youtube_playlist_url.trim()) {
            setError('YouTube playlist URL is required.');
            return;
        }

        try {
            setSaving(true);
            const response = await trainingService.createPlaylist({
                youtube_playlist_url: playlistForm.youtube_playlist_url.trim(),
                category_id: selectedCategoryId,
            });

            const importedCount = response?.data?.imported_videos_count;
            const countText = Number.isInteger(importedCount) ? ` (${importedCount} videos)` : '';
            setSuccessMessage(`Playlist imported successfully${countText}.`);
            setPlaylistForm(initialPlaylistForm);
            await loadPlaylists();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to import playlist.');
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
            resetTransientMessages();
            await trainingService.deletePlaylist(id);
            setSuccessMessage('Playlist deleted successfully.');
            await loadPlaylists();

            if (selectedPlaylist?.id === id) {
                setSelectedPlaylist(null);
                setPlaylistItems([]);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete playlist.');
        } finally {
            setSaving(false);
        }
    };

    const handleSelectPlaylist = async (playlist) => {
        setSelectedPlaylist(playlist);
        await loadPlaylistItems(playlist.id);
    };

    const resetToCategorySections = () => {
        setSelectedSection(null);
        setSelectedPlaylist(null);
        setPlaylistItems([]);
        resetTransientMessages();
    };

    const handleSubmitNote = async (e) => {
        e.preventDefault();
        resetTransientMessages();

        if (!selectedCategoryId) {
            setError('Select a category first to manage notes.');
            return;
        }

        if (!noteForm.title.trim()) {
            setError('Note title is required.');
            return;
        }

        if (!noteForm.document_url.trim()) {
            setError('Document URL is required.');
            return;
        }

        const payload = {
            title: noteForm.title.trim(),
            document_url: noteForm.document_url.trim() || null,
        };

        try {
            setSaving(true);
            if (editingNoteId) {
                await trainingService.updateCategoryNote(editingNoteId, payload);
                setSuccessMessage('Note updated successfully.');
            } else {
                await trainingService.createCategoryNote(selectedCategoryId, payload);
                setSuccessMessage('Note created successfully.');
            }

            setNoteForm(initialNoteForm);
            setEditingNoteId(null);
            await loadNotes(selectedCategoryId);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save note.');
        } finally {
            setSaving(false);
        }
    };

    const handleNoteFileSelected = async (e) => {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }

        try {
            setUploadingNoteFile(true);
            resetTransientMessages();
            const response = await trainingService.uploadCategoryNoteDocument(file);
            const uploadedUrl = response.data?.document?.url || response.data?.document?.path || '';
            if (!uploadedUrl) {
                setError('File uploaded but no document URL was returned.');
                return;
            }

            // Extract filename without extension for title if title is empty
            const fileName = file.name;
            const fileNameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;

            setNoteForm((prev) => ({
                ...prev,
                document_url: uploadedUrl,
                // Auto-populate title with filename if title is still empty
                title: prev.title.trim() || fileNameWithoutExt,
            }));
            setSuccessMessage('Document uploaded. You can now save the note.');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to upload note document.');
        } finally {
            setUploadingNoteFile(false);
            e.target.value = '';
        }
    };

    const handleEditNote = (note) => {
        setEditingNoteId(note.id);
        setNoteForm({
            title: note.title || '',
            document_url: note.document_url || '',
        });
        resetTransientMessages();
    };

    const handleDeleteNote = async (id) => {
        if (!window.confirm('Delete this note?')) {
            return;
        }

        try {
            setSaving(true);
            resetTransientMessages();
            await trainingService.deleteCategoryNote(id);
            setSuccessMessage('Note deleted successfully.');
            await loadNotes(selectedCategoryId);
            if (editingNoteId === id) {
                setEditingNoteId(null);
                setNoteForm(initialNoteForm);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete note.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <LoadingSpinner fullScreen={false} />;
    }

    return (
        <div className="container mt-4 space-y-5">
            <BackLink to="/admin" label="Back to Admin" />

            <div style={{ marginTop: '24px' }} className="space-y-4">
                <h2>Training Administration</h2>
                <p style={{ color: '#666', marginBottom: '20px' }}>
                    Create categories and manage organized playlists and notes for each category.
                </p>
                <div
                    style={{
                        marginBottom: '16px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#f8fbff',
                        border: '1px solid #dbe8ff',
                        color: '#274472',
                        fontSize: '13px',
                        fontWeight: 600,
                    }}
                    aria-label="Training admin breadcrumb"
                >
                    {breadcrumb.join(' > ')}
                </div>

                {error && (
                    <div style={{ backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb', borderRadius: '6px', padding: '12px', marginBottom: '12px' }}>
                        {error}
                    </div>
                )}
                {successMessage && (
                    <div style={{ backgroundColor: '#d4edda', color: '#155724', border: '1px solid #c3e6cb', borderRadius: '6px', padding: '12px', marginBottom: '12px' }}>
                        {successMessage}
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '16px', marginBottom: '20px' }} className="transition-all duration-200 ease-in-out">
                    <div style={{ border: '1px solid #dee2e6', borderRadius: '8px', padding: '16px', backgroundColor: '#fff' }}>
                        <h4 style={{ marginTop: 0 }}>{editingCategoryId ? 'Edit Category' : 'Create Category'}</h4>
                        <form onSubmit={handleSubmitCategory}>
                            <div style={{ marginBottom: '10px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Category Name</label>
                                <input
                                    type="text"
                                    value={categoryForm.name}
                                    onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
                                    disabled={saving}
                                    style={{ width: '100%', padding: '10px', border: '1px solid #ced4da', borderRadius: '4px' }}
                                />
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Description</label>
                                <textarea
                                    value={categoryForm.description}
                                    onChange={(e) => setCategoryForm((prev) => ({ ...prev, description: e.target.value }))}
                                    disabled={saving}
                                    rows={3}
                                    style={{ width: '100%', padding: '10px', border: '1px solid #ced4da', borderRadius: '4px', resize: 'vertical' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button type="submit" disabled={saving} className="btn btn-primary transition-all duration-200 ease-in-out hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,53,148,0.35)] active:scale-95">
                                    {saving ? 'Saving...' : editingCategoryId ? 'Update Category' : 'Create Category'}
                                </button>
                                {editingCategoryId && (
                                    <button
                                        type="button"
                                        disabled={saving}
                                        className="btn btn-secondary transition-all duration-200 ease-in-out hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,53,148,0.35)] active:scale-95"
                                        onClick={() => {
                                            setEditingCategoryId(null);
                                            setCategoryForm(initialCategoryForm);
                                            resetTransientMessages();
                                        }}
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    <div style={{ border: '1px solid #dee2e6', borderRadius: '8px', padding: '16px', backgroundColor: '#fff' }}>
                        <h4 style={{ marginTop: 0 }}>Categories ({categories.length})</h4>
                        {categories.length === 0 ? (
                            <p style={{ color: '#666', marginBottom: 0 }}>No categories yet. Create one to begin.</p>
                        ) : (
                            <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'grid', gap: '8px' }}>
                                {categories.map((category) => {
                                    const playlistCount = playlists.filter((playlist) => playlist.category_id === category.id).length;
                                    const active = selectedCategoryId === category.id;
                                    return (
                                        <div
                                            key={category.id}
                                            className="transition-all duration-200 ease-in-out hover:shadow-md hover:scale-[1.01] hover:bg-[rgba(0,53,148,0.03)]"
                                            style={{ border: active ? '2px solid #003594' : '1px solid #dee2e6', borderRadius: '6px', padding: '10px', backgroundColor: active ? '#f0f5ff' : '#fff' }}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => setSelectedCategoryId(category.id)}
                                                className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,53,148,0.35)] rounded"
                                                style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', padding: 0 }}
                                            >
                                                <div style={{ fontWeight: 700, color: '#003594' }}>{category.name}</div>
                                                <div style={{ fontSize: '12px', color: '#666' }}>{playlistCount} playlists</div>
                                            </button>
                                            <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <button
                                                    type="button"
                                                    className="admin-category-action-btn edit transition-all duration-200 ease-in-out hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,53,148,0.35)] active:scale-95"
                                                    onClick={() => handleEditCategory(category)}
                                                    disabled={saving}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    className="admin-category-action-btn delete transition-all duration-200 ease-in-out hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,53,148,0.35)] active:scale-95"
                                                    onClick={() => handleDeleteCategory(category.id)}
                                                    disabled={saving}
                                                >
                                                    Delete
                                                </button>
                                                {category.is_active ? (
                                                    <button
                                                        type="button"
                                                        className="admin-category-action-btn unpublish transition-all duration-200 ease-in-out hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,53,148,0.35)] active:scale-95"
                                                        style={{ marginLeft: 8, backgroundColor: saving ? '#FFE082' : undefined }}
                                                        disabled={saving}
                                                        onClick={async () => {
                                                            setSaving(true);
                                                            resetTransientMessages();
                                                            try {
                                                                await trainingService.updateCategory(category.id, { is_active: false });
                                                                setSuccessMessage('Category unpublished successfully.');
                                                                await loadCategories();
                                                            } catch (err) {
                                                                setError(err.response?.data?.error || 'Failed to unpublish category.');
                                                            } finally {
                                                                setSaving(false);
                                                            }
                                                        }}
                                                    >
                                                        Unpublish
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="admin-category-action-btn publish transition-all duration-200 ease-in-out hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,53,148,0.35)] active:scale-95"
                                                        style={{ marginLeft: 8, backgroundColor: saving ? '#66bb6a' : undefined }}
                                                        disabled={saving}
                                                        onClick={async () => {
                                                            setSaving(true);
                                                            resetTransientMessages();
                                                            try {
                                                                await trainingService.updateCategory(category.id, { is_active: true });
                                                                setSuccessMessage('Category published successfully.');
                                                                await loadCategories();
                                                            } catch (err) {
                                                                setError(err.response?.data?.error || 'Failed to publish category.');
                                                            } finally {
                                                                setSaving(false);
                                                            }
                                                        }}
                                                    >
                                                        Publish
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ border: '1px solid #dee2e6', borderRadius: '8px', padding: '16px', backgroundColor: '#fff', marginBottom: '20px' }} className="transition-all duration-200 ease-in-out">
                    <h4 style={{ marginTop: 0 }}>Import Playlist into Category</h4>
                    <p style={{ color: '#666' }}>
                        Selected Category: <strong>{selectedCategory?.name || 'None'}</strong>
                    </p>
                    {selectedCategoryId ? (
                        <>
                            <div className="responsive-two-col-grid" style={{ gap: '12px', marginBottom: '12px' }}>
                                <button
                                    type="button"
                                    className={`btn transition-all duration-200 ease-in-out hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,53,148,0.35)] active:scale-95 ${selectedSection === 'notes' ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => {
                                        setSelectedSection('notes');
                                        setSelectedPlaylist(null);
                                        setPlaylistItems([]);
                                    }}
                                >
                                    Notes
                                </button>
                                <button
                                    type="button"
                                    className={`btn transition-all duration-200 ease-in-out hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,53,148,0.35)] active:scale-95 ${selectedSection === 'videos' ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => {
                                        setSelectedSection('videos');
                                        setSelectedPlaylist(null);
                                        setPlaylistItems([]);
                                    }}
                                >
                                    Videos
                                </button>
                            </div>

                            {selectedSection === 'videos' && (
                                <form onSubmit={handleSubmitPlaylist}>
                                    <input
                                        type="text"
                                        placeholder="https://www.youtube.com/playlist?list=..."
                                        value={playlistForm.youtube_playlist_url}
                                        onChange={(e) => setPlaylistForm({ youtube_playlist_url: e.target.value })}
                                        disabled={saving}
                                        style={{ width: '100%', padding: '10px', border: '1px solid #ced4da', borderRadius: '4px', marginBottom: '10px', fontFamily: 'monospace' }}
                                    />
                                    <button type="submit" disabled={saving || !selectedCategoryId} className="btn btn-primary transition-all duration-200 ease-in-out hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,53,148,0.35)] active:scale-95">
                                        {saving ? 'Importing...' : 'Import Playlist'}
                                    </button>
                                </form>
                            )}
                        </>
                    ) : (
                        <p style={{ color: '#666', marginBottom: 0 }}>Select a category to continue.</p>
                    )}
                </div>

                {selectedSection === 'notes' && (
                <div style={{ border: '1px solid #dee2e6', borderRadius: '8px', padding: '16px', backgroundColor: '#fff', marginBottom: '20px' }} className="transition-all duration-200 ease-in-out">
                    <h4 style={{ marginTop: 0 }}>Category Notes and Documents</h4>
                    <p style={{ color: '#666' }}>
                        Add reading notes or document links under <strong>{selectedCategory?.name || 'a category'}</strong>.
                    </p>
                    <div style={{ marginBottom: '12px' }}>
                        <button type="button" className="btn btn-secondary transition-all duration-200 ease-in-out hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,53,148,0.35)] active:scale-95" onClick={resetToCategorySections}>← Back</button>
                    </div>

                    <form onSubmit={handleSubmitNote} style={{ marginBottom: '14px' }}>
                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#000' }}>Note Title (Required)</label>
                            <input
                                type="text"
                                placeholder="Enter a descriptive title for this note"
                                value={noteForm.title}
                                onChange={(e) => setNoteForm((prev) => ({ ...prev, title: e.target.value }))}
                                disabled={saving}
                                required
                                style={{ width: '100%', padding: '10px', border: '2px solid #003594', borderRadius: '4px', fontSize: '15px', fontWeight: '500' }}
                            />
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '14px' }}>Document URL (Auto-filled)</label>
                            <input
                                type="text"
                                placeholder="Auto-filled when you upload a file"
                                value={noteForm.document_url}
                                onChange={(e) => setNoteForm((prev) => ({ ...prev, document_url: e.target.value }))}
                                readOnly
                                style={{ width: '100%', padding: '10px', border: '1px solid #ced4da', borderRadius: '4px', backgroundColor: '#f9f9f9', color: '#666' }}
                            />
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Upload Document From Device</label>
                            <input
                                type="file"
                                accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx,.csv,.md,.rtf,.odt"
                                onChange={handleNoteFileSelected}
                                disabled={saving || uploadingNoteFile}
                                style={{ width: '100%' }}
                            />
                            <small style={{ color: '#666' }}>
                                {uploadingNoteFile ? 'Uploading document...' : 'Upload a file to auto-fill the document URL.'}
                            </small>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="submit" disabled={saving || !selectedCategoryId} className="btn btn-primary transition-all duration-200 ease-in-out hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,53,148,0.35)] active:scale-95">
                                {saving ? 'Saving...' : editingNoteId ? 'Update Note' : 'Create Note'}
                            </button>
                            {editingNoteId && (
                                <button
                                    type="button"
                                    className="btn btn-secondary transition-all duration-200 ease-in-out hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,53,148,0.35)] active:scale-95"
                                    onClick={() => {
                                        setEditingNoteId(null);
                                        setNoteForm(initialNoteForm);
                                        resetTransientMessages();
                                    }}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>

                    {notes.length === 0 ? (
                        <p style={{ color: '#666', marginBottom: 0 }}>No notes in this category yet.</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', width: '100%' }}>
                            {notes.map((note) => (
                                <div key={note.id} className="transition-all duration-200 ease-in-out hover:shadow-md hover:scale-[1.01] hover:bg-[rgba(0,53,148,0.02)]" style={{ border: '1px solid #dee2e6', borderRadius: '8px', padding: '14px 16px', backgroundColor: '#ffffff' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                        <strong style={{ fontSize: '16px', fontWeight: '600', color: '#003594', wordBreak: 'break-word', flex: 1 }}>{note.title || '(Untitled Note)'}</strong>
                                        {note.document_url && (
                                            <a
                                                href={note.document_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="transition-all duration-200 ease-in-out hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,53,148,0.35)] active:scale-95"
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    padding: '6px 14px',
                                                    border: '1px solid #003594',
                                                    borderRadius: '6px',
                                                    backgroundColor: '#f0f7ff',
                                                    fontSize: '13px',
                                                    fontWeight: '600',
                                                    textDecoration: 'none',
                                                    color: '#003594',
                                                    whiteSpace: 'normal',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                View Document
                                            </a>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                        <button type="button" className="btn btn-sm btn-outline-primary transition-all duration-200 ease-in-out hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,53,148,0.35)] active:scale-95" onClick={() => handleEditNote(note)} disabled={saving}>Edit</button>
                                        <button type="button" className="btn btn-sm btn-outline-danger transition-all duration-200 ease-in-out hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,53,148,0.35)] active:scale-95" onClick={() => handleDeleteNote(note.id)} disabled={saving}>Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                )}

                {selectedSection === 'videos' && (
                <div style={{ border: '1px solid #dee2e6', borderRadius: '8px', padding: '16px', backgroundColor: '#fff' }} className="transition-all duration-200 ease-in-out">
                    <h4 style={{ marginTop: 0 }}>
                        Playlists in {selectedCategory?.name || 'Selected Category'} ({filteredPlaylists.length})
                    </h4>
                    <div style={{ marginBottom: '12px' }}>
                        <button type="button" className="btn btn-secondary transition-all duration-200 ease-in-out hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,53,148,0.35)] active:scale-95" onClick={resetToCategorySections}>← Back</button>
                    </div>

                    {filteredPlaylists.length === 0 ? (
                        <p style={{ color: '#666', marginBottom: 0 }}>No playlists in this category yet.</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                            {filteredPlaylists.map((playlist) => (
                                <div key={playlist.id} className="transition-all duration-200 ease-in-out hover:shadow-md hover:scale-[1.01] hover:bg-[rgba(0,53,148,0.02)]" style={{ border: selectedPlaylist?.id === playlist.id ? '2px solid #003594' : '1px solid #dee2e6', borderRadius: '8px', padding: '12px' }}>
                                    <button
                                        type="button"
                                        onClick={() => handleSelectPlaylist(playlist)}
                                        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,53,148,0.35)] rounded"
                                        style={{ background: 'none', border: 'none', textAlign: 'left', width: '100%', cursor: 'pointer', padding: 0 }}
                                    >
                                        <h5 style={{ margin: '0 0 8px 0', color: '#003594' }}>{playlist.name}</h5>
                                        <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>
                                            {playlist.description || 'No description'}
                                        </p>
                                    </button>
                                    <div style={{ marginTop: '10px' }}>
                                        <button type="button" className="btn btn-sm btn-outline-danger transition-all duration-200 ease-in-out hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,53,148,0.35)] active:scale-95" onClick={() => handleDeletePlaylist(playlist.id)} disabled={saving}>
                                            Delete Playlist
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {selectedPlaylist && (
                        <div style={{ marginTop: '20px', borderTop: '1px solid #e9ecef', paddingTop: '16px' }}>
                            <h5 style={{ color: '#003594' }}>Playlist Videos: {selectedPlaylist.name}</h5>
                            {playlistItems.length === 0 ? (
                                <p style={{ color: '#666' }}>No videos found for this playlist.</p>
                            ) : (
                                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                    {playlistItems.map((item) => (
                                        <li key={item.id} style={{ marginBottom: '6px' }}>{item.title}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
                )}
            </div>
        </div>
    );
};

export default AdminTrainingPage;
