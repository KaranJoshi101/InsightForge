const pool = require('../config/database');

async function getPublicTrainingVideos(limit) {
    const result = await pool.query(
        `SELECT id, title, description, youtube_id, duration_minutes, display_order
         FROM training_videos
         WHERE is_active = true
         ORDER BY display_order ASC, id DESC
         LIMIT $1`,
        [limit]
    );
    return result.rows;
}

async function getAdminTrainingVideos(limit, offset) {
    const rowsResult = await pool.query(
        `SELECT id, title, description, youtube_id, duration_minutes, display_order, is_active, created_at, updated_at
         FROM training_videos
         ORDER BY display_order ASC, created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
    );
    const countResult = await pool.query('SELECT COUNT(*)::int AS count FROM training_videos');
    return { rows: rowsResult.rows, total: countResult.rows[0].count };
}

async function getTrainingVideoById(id) {
    const result = await pool.query('SELECT id FROM training_videos WHERE id = $1', [id]);
    return result.rows[0] || null;
}

async function createTrainingVideo({ title, description, youtube_id, duration_minutes, display_order, is_active }) {
    const result = await pool.query(
        `INSERT INTO training_videos
            (title, description, youtube_id, duration_minutes, display_order, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, title, description, youtube_id, duration_minutes, display_order, is_active, created_at, updated_at`,
        [title, description, youtube_id, duration_minutes, display_order, Boolean(is_active)]
    );
    return result.rows[0];
}

async function updateTrainingVideoDynamic(id, fieldsObj) {
    const fields = [];
    const values = [];
    let idx = 1;
    for (const key of Object.keys(fieldsObj)) {
        fields.push(`${key} = $${idx++}`);
        values.push(fieldsObj[key]);
    }
    if (fields.length === 0) return null;
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    const sql = `UPDATE training_videos SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING id, title, description, youtube_id, duration_minutes, display_order, is_active, created_at, updated_at`;
    const result = await pool.query(sql, values);
    return result.rows[0] || null;
}

async function deleteTrainingVideo(id) {
    const result = await pool.query('DELETE FROM training_videos WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
}

// Playlists
async function getPublicPlaylists() {
    const result = await pool.query(
        `SELECT id, category_id, name, description, display_order
         FROM training_playlists
         WHERE is_active = true
         ORDER BY display_order ASC, id DESC`
    );
    return result.rows;
}

async function getAdminPlaylists(limit, offset) {
    const rowsResult = await pool.query(
        `SELECT id, category_id, name, description, display_order, is_active, youtube_playlist_url, created_at, updated_at
         FROM training_playlists
         ORDER BY display_order ASC, created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
    );
    const countResult = await pool.query('SELECT COUNT(*)::int AS count FROM training_playlists');
    return { rows: rowsResult.rows, total: countResult.rows[0].count };
}

async function getPlaylistById(id) {
    const result = await pool.query('SELECT id, category_id, name, description FROM training_playlists WHERE id = $1', [id]);
    return result.rows[0] || null;
}

async function getPlaylistByUrl(url) {
    const result = await pool.query('SELECT id FROM training_playlists WHERE youtube_playlist_url = $1 LIMIT 1', [url]);
    return result.rows[0] || null;
}

async function getPlaylistItems(playlistId) {
    const result = await pool.query(
        `SELECT pi.id, pi.video_id, pi.order_index, tv.title, tv.description, tv.youtube_id, tv.duration_minutes
         FROM playlist_items pi
         JOIN training_videos tv ON pi.video_id = tv.id
         WHERE pi.playlist_id = $1
         ORDER BY pi.order_index ASC`,
        [playlistId]
    );
    return result.rows;
}

async function insertPlaylist(categoryId, name, description, youtube_playlist_url, client = null) {
    const runner = client || pool;
    const result = await runner.query(
        `INSERT INTO training_playlists (category_id, name, description, youtube_playlist_url, display_order, is_active)
         VALUES ($1, $2, $3, $4, 0, true)
         RETURNING id, category_id, name, description, display_order, is_active, youtube_playlist_url, created_at, updated_at`,
        [categoryId, name, description, youtube_playlist_url]
    );
    return result.rows[0];
}

async function upsertTrainingVideo(client, metadata, youtubeId) {
    const runner = client || pool;
    const result = await runner.query(
        `INSERT INTO training_videos (title, description, youtube_id, duration_minutes, display_order, is_active)
         VALUES ($1, $2, $3, $4, 0, true)
         ON CONFLICT (youtube_id)
         DO UPDATE SET
             title = EXCLUDED.title,
             description = COALESCE(EXCLUDED.description, training_videos.description),
             duration_minutes = COALESCE(EXCLUDED.duration_minutes, training_videos.duration_minutes),
             updated_at = CURRENT_TIMESTAMP
         RETURNING id`,
        [metadata.title, metadata.description, youtubeId, metadata.duration_minutes]
    );
    return result.rows[0];
}

async function insertPlaylistItem(client, playlistId, videoId, orderIndex) {
    const runner = client || pool;
    await runner.query(
        `INSERT INTO playlist_items (playlist_id, video_id, order_index)
         VALUES ($1, $2, $3)
         ON CONFLICT (playlist_id, video_id) DO NOTHING`,
        [playlistId, videoId, orderIndex]
    );
}

async function deletePlaylistCascade(client, id) {
    const runner = client || pool;
    const existing = await runner.query('SELECT id FROM training_playlists WHERE id = $1', [id]);
    if (existing.rows.length === 0) return { notFound: true };

    const videoIdsResult = await runner.query('SELECT DISTINCT video_id FROM playlist_items WHERE playlist_id = $1', [id]);
    const videoIds = videoIdsResult.rows.map((r) => r.video_id);

    await runner.query('DELETE FROM playlist_items WHERE playlist_id = $1', [id]);
    await runner.query('DELETE FROM training_playlists WHERE id = $1', [id]);

    let deletedOrphanVideos = 0;
    if (videoIds.length > 0) {
        const orphanDeleteResult = await runner.query(
            `DELETE FROM training_videos tv
             WHERE tv.id = ANY($1::int[])
               AND NOT EXISTS (
                   SELECT 1
                   FROM playlist_items pi
                   WHERE pi.video_id = tv.id
               )
             RETURNING id`,
            [videoIds]
        );
        deletedOrphanVideos = orphanDeleteResult.rowCount || 0;
    }

    return { deletedOrphanVideos };
}

async function updatePlaylist(id, fieldsObj) {
    const fields = [];
    const values = [];
    let idx = 1;
    for (const key of Object.keys(fieldsObj)) {
        fields.push(`${key} = $${idx++}`);
        values.push(fieldsObj[key]);
    }
    if (fields.length === 0) return null;
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    const sql = `UPDATE training_playlists SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING id, category_id, name, description, display_order, is_active, youtube_playlist_url, created_at, updated_at`;
    const result = await pool.query(sql, values);
    return result.rows[0] || null;
}

async function addPlaylistItem(playlistId, videoId, orderIndex) {
    const result = await pool.query(`INSERT INTO playlist_items (playlist_id, video_id, order_index) VALUES ($1,$2,$3) RETURNING id, playlist_id, video_id, order_index, created_at`, [playlistId, videoId, orderIndex]);
    return result.rows[0];
}

async function removePlaylistItem(itemId, playlistId) {
    const result = await pool.query('DELETE FROM playlist_items WHERE id = $1 AND playlist_id = $2 RETURNING id', [itemId, playlistId]);
    return result.rows[0] || null;
}

async function updatePlaylistItemOrder(itemId, playlistId, orderIndex) {
    const result = await pool.query(`UPDATE playlist_items SET order_index = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND playlist_id = $3 RETURNING id, playlist_id, video_id, order_index, created_at, updated_at`, [orderIndex, itemId, playlistId]);
    return result.rows[0] || null;
}

// Categories and notes
async function getPublicTrainingCategories() {
    const [categoriesResult, playlistsResult, notesResult] = await Promise.all([
        pool.query(`SELECT id, name, description, display_order, is_active, created_at, updated_at FROM training_categories WHERE is_active = true ORDER BY display_order ASC, id ASC`),
        pool.query(`SELECT tp.id, tp.category_id, tp.name, tp.description, tp.display_order, tp.is_active, tp.youtube_playlist_url, tp.created_at, tp.updated_at, COUNT(pi.id)::int AS video_count FROM training_playlists tp LEFT JOIN playlist_items pi ON pi.playlist_id = tp.id WHERE tp.is_active = true GROUP BY tp.id ORDER BY tp.display_order ASC, tp.id ASC`),
        pool.query(`SELECT id, category_id, title, document_url, display_order, is_active, created_at, updated_at FROM training_notes WHERE is_active = true ORDER BY display_order ASC, id ASC`),
    ]);
    return { categories: categoriesResult.rows, playlists: playlistsResult.rows, notes: notesResult.rows };
}

async function getAdminTrainingCategories() {
    const result = await pool.query(`SELECT id, name, description, display_order, is_active, created_at, updated_at FROM training_categories ORDER BY display_order ASC, id ASC`);
    return result.rows;
}

async function getTrainingCategoryById(id) {
    const result = await pool.query('SELECT id FROM training_categories WHERE id = $1', [id]);
    return result.rows[0] || null;
}

async function createTrainingCategory({ name, description, display_order, is_active }) {
    const result = await pool.query(`INSERT INTO training_categories (name, description, display_order, is_active) VALUES ($1,$2,$3,$4) RETURNING id, name, description, display_order, is_active, created_at, updated_at`, [name, description, display_order, is_active]);
    return result.rows[0];
}

async function updateTrainingCategory(id, fieldsObj) {
    const fields = [];
    const values = [];
    let idx = 1;
    for (const key of Object.keys(fieldsObj)) {
        fields.push(`${key} = $${idx++}`);
        values.push(fieldsObj[key]);
    }
    if (fields.length === 0) return null;
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    const sql = `UPDATE training_categories SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING id, name, description, display_order, is_active, created_at, updated_at`;
    const result = await pool.query(sql, values);
    return result.rows[0] || null;
}

async function deleteTrainingCategory(id) {
    const result = await pool.query('DELETE FROM training_categories WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
}

async function getCategoryNotes(categoryId, onlyActive) {
    const query = onlyActive
        ? `SELECT id, category_id, title, document_url, display_order, is_active, created_at, updated_at FROM training_notes WHERE category_id = $1 AND is_active = true ORDER BY display_order ASC, id ASC`
        : `SELECT id, category_id, title, document_url, display_order, is_active, created_at, updated_at FROM training_notes WHERE category_id = $1 ORDER BY display_order ASC, id ASC`;
    const result = await pool.query(query, [categoryId]);
    return result.rows;
}

async function createCategoryNote(categoryId, { title, document_url, display_order, is_active }) {
    const result = await pool.query(`INSERT INTO training_notes (category_id, title, document_url, display_order, is_active) VALUES ($1,$2,$3,$4,$5) RETURNING id, category_id, title, document_url, display_order, is_active, created_at, updated_at`, [categoryId, title, document_url, display_order, is_active]);
    return result.rows[0];
}

async function updateCategoryNote(id, fieldsObj) {
    const fields = [];
    const values = [];
    let idx = 1;
    for (const key of Object.keys(fieldsObj)) {
        fields.push(`${key} = $${idx++}`);
        values.push(fieldsObj[key]);
    }
    if (fields.length === 0) return null;
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    const sql = `UPDATE training_notes SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING id, category_id, title, document_url, display_order, is_active, created_at, updated_at`;
    const result = await pool.query(sql, values);
    return result.rows[0] || null;
}

async function getTrainingNoteById(id) {
    const result = await pool.query('SELECT id FROM training_notes WHERE id = $1', [id]);
    return result.rows[0] || null;
}

async function deleteCategoryNote(id) {
    const result = await pool.query('DELETE FROM training_notes WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
}

module.exports = {
    getPublicTrainingVideos,
    getAdminTrainingVideos,
    getTrainingVideoById,
    createTrainingVideo,
    updateTrainingVideoDynamic,
    deleteTrainingVideo,
    getPublicPlaylists,
    getAdminPlaylists,
    getPlaylistById,
    getPlaylistByUrl,
    getPlaylistItems,
    insertPlaylist,
    upsertTrainingVideo,
    insertPlaylistItem,
    deletePlaylistCascade,
    updatePlaylist,
    addPlaylistItem,
    removePlaylistItem,
    updatePlaylistItemOrder,
    getPublicTrainingCategories,
    getAdminTrainingCategories,
    getTrainingCategoryById,
    createTrainingCategory,
    updateTrainingCategory,
    deleteTrainingCategory,
    getCategoryNotes,
    createCategoryNote,
    updateCategoryNote,
    getTrainingNoteById,
    deleteCategoryNote,
};
