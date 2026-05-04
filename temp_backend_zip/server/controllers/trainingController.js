const pool = require('../config/database');
const ytpl = require('ytpl');
const path = require('path');

const clamp = (value, min, max, fallback) => {
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) return fallback;
    return Math.min(Math.max(parsed, min), max);
};

const parseYouTubeId = (value) => {
    if (!value || typeof value !== 'string') {
        return null;
    }

    const input = value.trim();
    if (!input) return null;

    const idPattern = /^[A-Za-z0-9_-]{11}$/;
    if (idPattern.test(input)) {
        return input;
    }

    try {
        const url = new URL(input);
        if (url.hostname.includes('youtu.be')) {
            const candidate = url.pathname.replace('/', '').trim();
            return idPattern.test(candidate) ? candidate : null;
        }

        if (url.hostname.includes('youtube.com')) {
            const candidate = url.searchParams.get('v') || url.pathname.split('/').pop();
            return idPattern.test(candidate || '') ? candidate : null;
        }
    } catch (_err) {
        return null;
    }

    return null;
};

const parseYouTubePlaylistId = (value) => {
    if (!value || typeof value !== 'string') {
        return null;
    }

    const input = value.trim();
    if (!input) return null;

    // Playlist IDs vary by prefix (PL, UU, FL, LL, OLAK, RD, etc.).
    const playlistIdPattern = /^[A-Za-z0-9_-]{10,}$/;
    if (playlistIdPattern.test(input)) {
        console.log(`✅ Playlist ID recognized directly: ${input}`);
        return input;
    }

    try {
        const url = new URL(input);
        const listParam = url.searchParams.get('list');
        if (listParam && playlistIdPattern.test(listParam)) {
            console.log(`✅ Playlist ID extracted from URL: ${listParam}`);
            return listParam;
        }
    } catch (_err) {
        // Continue to pattern matching
    }

    // Try pattern matching as fallback
    const match = input.match(/list=([A-Za-z0-9_-]+)/);
    if (match && match[1]) {
        const candidate = match[1];
        if (playlistIdPattern.test(candidate)) {
            console.log(`✅ Playlist ID matched via pattern: ${candidate}`);
            return candidate;
        }
    }

    console.warn(`⚠️  Could not parse playlist ID from input: ${input}`);
    return null;
};

const fetchYouTubePlaylistVideos = async (playlistId, playlistUrl = null) => {
    let ytplError = null;

    try {
        const ytplTarget = (playlistUrl && typeof playlistUrl === 'string' && playlistUrl.trim())
            ? playlistUrl.trim()
            : playlistId;

        const playlist = await ytpl(ytplTarget, { pages: Infinity });

        const videoIds = (playlist.items || [])
            .map((item) => item.id)
            .filter((id) => typeof id === 'string' && id.length === 11);

        if (videoIds.length) {
            // Get description from ytpl object - check all possible properties
            let description = null;
            
            console.log(`🔍 Checking ytpl object for description. Available keys:`, Object.keys(playlist).slice(0, 20));
            
            // Try different property names that ytpl might use
            if (playlist.description && typeof playlist.description === 'string' && playlist.description.trim()) {
                description = playlist.description.trim().slice(0, 500);
                console.log(`✅ Found description from ytpl.description:`, description.slice(0, 100));
            } else if (playlist.info && typeof playlist.info === 'object') {
                // ytpl might have description nested in info
                const infoDesc = playlist.info.description || playlist.info.description_snippet;
                if (infoDesc && typeof infoDesc === 'string' && infoDesc.trim()) {
                    description = infoDesc.trim().slice(0, 500);
                    console.log(`✅ Found description from ytpl.info:`, description.slice(0, 100));
                }
            }

            if (!description) {
                console.log(`⚠️ No description found from ytpl, playlistId: ${playlistId}`);
            }

            return {
                title: typeof playlist.title === 'string' ? playlist.title : null,
                description,
                videoIds: Array.from(new Set(videoIds)),
                reason: null,
            };
        }
    } catch (err) {
        ytplError = err;
        console.warn(`⚠️ ytpl fetch failed for playlist ${playlistId}: ${err.message}`);
    }

    const feedUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${encodeURIComponent(playlistId)}`;

    try {
        const feedRes = await fetch(feedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
                Accept: 'application/xml,text/xml;q=0.9,*/*;q=0.8',
            },
        });

        if (!feedRes.ok) {
            return {
                title: null,
                videoIds: [],
                reason: ytplError?.message || `YouTube feed returned ${feedRes.status}`,
            };
        }

        const xml = await feedRes.text();
        const titleMatch = xml.match(/<title>([^<]+)<\/title>/i);
        const entryTitleMatch = xml.match(/<entry>[\s\S]*?<title>([^<]+)<\/title>/i);
        const title = titleMatch?.[1]?.trim() || entryTitleMatch?.[1]?.trim() || null;

        const videoIds = [];
        const idRegex = /<yt:videoId>([A-Za-z0-9_-]{11})<\/yt:videoId>/g;
        let match;

        while ((match = idRegex.exec(xml)) !== null) {
            videoIds.push(match[1]);
        }

        return {
            title,
            description: null,
            videoIds: Array.from(new Set(videoIds)),
            reason: null,
        };
    } catch (err) {
        console.error(`❌ Error fetching YouTube playlist feed: ${err.message}`);
        return {
            title: null,
            description: null,
            videoIds: [],
            reason: ytplError?.message || err.message,
        };
    }
};

const fetchYouTubeMetadata = async (youtubeId) => {
    const fallbackTitle = `YouTube Video (${youtubeId})`;
    let title = fallbackTitle;
    let description = null;
    let durationMinutes = null;

    try {
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`;
        const oembedRes = await fetch(oembedUrl);
        if (oembedRes.ok) {
            const oembedData = await oembedRes.json();
            if (typeof oembedData.title === 'string' && oembedData.title.trim()) {
                title = oembedData.title.trim();
            }
        }
    } catch (_err) {
        // Keep fallback title.
    }

    try {
        const youtubeiRes = await fetch(
            'https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    context: {
                        client: {
                            clientName: 'WEB',
                            clientVersion: '2.20230914.04.00',
                        },
                    },
                    videoId: youtubeId,
                }),
            }
        );

        if (youtubeiRes.ok) {
            const youtubeiData = await youtubeiRes.json();
            const details = youtubeiData?.videoDetails;

            if (typeof details?.title === 'string' && details.title.trim()) {
                title = details.title.trim();
            }

            if (typeof details?.shortDescription === 'string' && details.shortDescription.trim()) {
                description = details.shortDescription.trim().slice(0, 2000);
            }

            if (details?.lengthSeconds) {
                const seconds = parseInt(details.lengthSeconds, 10);
                if (!Number.isNaN(seconds) && seconds > 0) {
                    durationMinutes = Math.max(1, Math.round(seconds / 60));
                }
            }
        }
    } catch (_err) {
        // Keep oEmbed/fallback values.
    }

    return {
        title,
        description,
        duration_minutes: durationMinutes,
    };
};

const mapRow = (row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    youtube_id: row.youtube_id,
    duration_minutes: row.duration_minutes,
    display_order: row.display_order,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
});

const getPublicTrainingVideos = async (req, res, next) => {
    try {
        const limit = clamp(req.query.limit, 1, 50, 6);

        const result = await pool.query(
            `SELECT id, title, description, youtube_id, duration_minutes, display_order
             FROM training_videos
             WHERE is_active = true
             ORDER BY display_order ASC, id DESC
             LIMIT $1`,
            [limit]
        );

        res.json({
            videos: result.rows.map(mapRow),
            count: result.rows.length,
        });
    } catch (err) {
        next(err);
    }
};

const getAdminTrainingVideos = async (req, res, next) => {
    try {
        const page = clamp(req.query.page, 1, 100000, 1);
        const limit = clamp(req.query.limit, 1, 100, 20);
        const offset = (page - 1) * limit;

        const [rowsResult, countResult] = await Promise.all([
            pool.query(
                `SELECT id, title, description, youtube_id, duration_minutes, display_order, is_active, created_at, updated_at
                 FROM training_videos
                 ORDER BY display_order ASC, created_at DESC
                 LIMIT $1 OFFSET $2`,
                [limit, offset]
            ),
            pool.query('SELECT COUNT(*)::int AS count FROM training_videos'),
        ]);

        const total = countResult.rows[0].count;

        res.json({
            videos: rowsResult.rows.map(mapRow),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        next(err);
    }
};

const createTrainingVideo = async (req, res, next) => {
    try {
        const {
            youtube_id,
            youtube_url,
            display_order = 0,
            is_active = true,
        } = req.body;

        const parsedYoutubeId = parseYouTubeId(youtube_id || youtube_url);
        if (!parsedYoutubeId) {
            return res.status(400).json({ error: 'Valid YouTube ID or URL is required' });
        }

        const metadata = await fetchYouTubeMetadata(parsedYoutubeId);

        const parsedOrder = clamp(display_order, 0, 100000, 0);

        const result = await pool.query(
            `INSERT INTO training_videos
            (title, description, youtube_id, duration_minutes, display_order, is_active)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, title, description, youtube_id, duration_minutes, display_order, is_active, created_at, updated_at`,
            [metadata.title, metadata.description, parsedYoutubeId, metadata.duration_minutes, parsedOrder, Boolean(is_active)]
        );

        res.status(201).json({
            message: 'Training video created successfully',
            video: mapRow(result.rows[0]),
        });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'This YouTube video is already added' });
        }
        next(err);
    }
};

const updateTrainingVideo = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            youtube_id,
            youtube_url,
            display_order,
            is_active,
        } = req.body;

        const existing = await pool.query('SELECT id FROM training_videos WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Training video not found' });
        }

        const fields = [];
        const values = [];
        let idx = 1;

        if (typeof youtube_id === 'string' || typeof youtube_url === 'string') {
            const parsedYoutubeId = parseYouTubeId(youtube_id || youtube_url);
            if (!parsedYoutubeId) {
                return res.status(400).json({ error: 'Valid YouTube ID or URL is required' });
            }

            const metadata = await fetchYouTubeMetadata(parsedYoutubeId);

            fields.push(`title = $${idx++}`);
            values.push(metadata.title);

            fields.push(`description = $${idx++}`);
            values.push(metadata.description);

            fields.push(`duration_minutes = $${idx++}`);
            values.push(metadata.duration_minutes);

            fields.push(`youtube_id = $${idx++}`);
            values.push(parsedYoutubeId);
        }

        if (display_order !== undefined) {
            fields.push(`display_order = $${idx++}`);
            values.push(clamp(display_order, 0, 100000, 0));
        }

        if (typeof is_active === 'boolean') {
            fields.push(`is_active = $${idx++}`);
            values.push(is_active);
        }

        if (fields.length === 0) {
            return res.status(400).json({ error: 'No valid fields provided for update' });
        }

        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        const result = await pool.query(
            `UPDATE training_videos
             SET ${fields.join(', ')}
             WHERE id = $${idx}
             RETURNING id, title, description, youtube_id, duration_minutes, display_order, is_active, created_at, updated_at`,
            values
        );

        res.json({
            message: 'Training video updated successfully',
            video: mapRow(result.rows[0]),
        });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'This YouTube video is already added' });
        }
        next(err);
    }
};

const deleteTrainingVideo = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM training_videos WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Training video not found' });
        }

        res.json({ message: 'Training video deleted successfully' });
    } catch (err) {
        next(err);
    }
};

// Playlist functions
const mapPlaylistRow = (row) => ({
    id: row.id,
    category_id: row.category_id,
    name: row.name,
    description: row.description,
    display_order: row.display_order,
    is_active: row.is_active,
    youtube_playlist_url: row.youtube_playlist_url,
    created_at: row.created_at,
    updated_at: row.updated_at,
});

const getPublicPlaylists = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT id, category_id, name, description, display_order
             FROM training_playlists
             WHERE is_active = true
             ORDER BY display_order ASC, id DESC`
        );

        res.json({
            playlists: result.rows.map(mapPlaylistRow),
            count: result.rows.length,
        });
    } catch (err) {
        next(err);
    }
};

const getAdminPlaylists = async (req, res, next) => {
    try {
        const page = clamp(req.query.page, 1, 100000, 1);
        const limit = clamp(req.query.limit, 1, 100, 20);
        const offset = (page - 1) * limit;

        const [rowsResult, countResult] = await Promise.all([
            pool.query(
                `SELECT id, category_id, name, description, display_order, is_active, youtube_playlist_url, created_at, updated_at
                 FROM training_playlists
                 ORDER BY display_order ASC, created_at DESC
                 LIMIT $1 OFFSET $2`,
                [limit, offset]
            ),
            pool.query('SELECT COUNT(*)::int AS count FROM training_playlists'),
        ]);

        const total = countResult.rows[0].count;

        res.json({
            playlists: rowsResult.rows.map(mapPlaylistRow),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        next(err);
    }
};

const getPlaylistItems = async (req, res, next) => {
    try {
        const { playlistId } = req.params;

        const playlistResult = await pool.query(
            'SELECT id, category_id, name, description FROM training_playlists WHERE id = $1',
            [playlistId]
        );

        if (playlistResult.rows.length === 0) {
            return res.status(404).json({ error: 'Playlist not found' });
        }

        const itemsResult = await pool.query(
            `SELECT pi.id, pi.video_id, pi.order_index, tv.title, tv.description, tv.youtube_id, tv.duration_minutes
             FROM playlist_items pi
             JOIN training_videos tv ON pi.video_id = tv.id
             WHERE pi.playlist_id = $1
             ORDER BY pi.order_index ASC`,
            [playlistId]
        );

        res.json({
            playlist: {
                id: playlistResult.rows[0].id,
                category_id: playlistResult.rows[0].category_id,
                name: playlistResult.rows[0].name,
                description: playlistResult.rows[0].description,
            },
            items: itemsResult.rows,
            count: itemsResult.rows.length,
        });
    } catch (err) {
        next(err);
    }
};

const createPlaylist = async (req, res, next) => {
    try {
        const { youtube_playlist_url, category_id } = req.body;

        if (!youtube_playlist_url || !String(youtube_playlist_url).trim()) {
            return res.status(400).json({ error: 'YouTube playlist URL is required' });
        }

        const normalizedUrl = String(youtube_playlist_url).trim();
        const categoryId = category_id ? clamp(category_id, 1, 10000000, null) : null;

        if (category_id !== undefined && !categoryId) {
            return res.status(400).json({ error: 'category_id must be a positive integer' });
        }

        if (categoryId) {
            const categoryCheck = await pool.query('SELECT id FROM training_categories WHERE id = $1', [categoryId]);
            if (categoryCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Training category not found' });
            }
        }

        const playlistId = parseYouTubePlaylistId(normalizedUrl);
        if (!playlistId) {
            return res.status(400).json({ error: 'Invalid YouTube playlist URL' });
        }

        const existingPlaylist = await pool.query(
            'SELECT id FROM training_playlists WHERE youtube_playlist_url = $1 LIMIT 1',
            [normalizedUrl]
        );

        if (existingPlaylist.rows.length > 0) {
            return res.status(409).json({ error: 'This YouTube playlist is already imported' });
        }

        const playlistData = await fetchYouTubePlaylistVideos(playlistId, normalizedUrl);
        if (!playlistData.videoIds.length) {
            const reason = playlistData.reason ? ` Details: ${playlistData.reason}` : '';
            return res.status(400).json({
                error: `Could not fetch videos from playlist. Please verify the playlist is public and contains videos.${reason}`,
            });
        }

        const playlistName = (playlistData.title && playlistData.title.trim())
            ? playlistData.title.trim().slice(0, 255)
            : `YouTube Playlist ${playlistId}`;
        const playlistDescription = (playlistData.description && playlistData.description.trim())
            ? playlistData.description.trim().slice(0, 1000)
            : 'Curated training playlist for focused upskilling.';

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const playlistResult = await client.query(
                `INSERT INTO training_playlists (category_id, name, description, youtube_playlist_url, display_order, is_active)
                 VALUES ($1, $2, $3, $4, 0, true)
                 RETURNING id, category_id, name, description, display_order, is_active, youtube_playlist_url, created_at, updated_at`,
                [categoryId, playlistName, playlistDescription, normalizedUrl]
            );

            const createdPlaylist = playlistResult.rows[0];

            for (let i = 0; i < playlistData.videoIds.length; i += 1) {
                const youtubeId = playlistData.videoIds[i];
                const metadata = await fetchYouTubeMetadata(youtubeId);

                const videoResult = await client.query(
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

                await client.query(
                    `INSERT INTO playlist_items (playlist_id, video_id, order_index)
                     VALUES ($1, $2, $3)
                     ON CONFLICT (playlist_id, video_id) DO NOTHING`,
                    [createdPlaylist.id, videoResult.rows[0].id, i]
                );
            }

            await client.query('COMMIT');

            res.status(201).json({
                message: 'Playlist imported successfully',
                playlist: mapPlaylistRow(createdPlaylist),
                imported_videos_count: playlistData.videoIds.length,
            });
        } catch (dbErr) {
            await client.query('ROLLBACK');
            throw dbErr;
        } finally {
            client.release();
        }

    } catch (err) {
        console.error(`❌ Playlist import error: ${err.message}`);
        next(err);
    }
};

const updatePlaylist = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, category_id } = req.body;

        const existing = await pool.query('SELECT id FROM training_playlists WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Playlist not found' });
        }

        const fields = [];
        const values = [];
        let idx = 1;

        if (typeof name === 'string' && name.trim()) {
            fields.push(`name = $${idx++}`);
            values.push(name.trim());
        }

        if (typeof description === 'string' || description === null) {
            fields.push(`description = $${idx++}`);
            values.push(description);
        }

        if (category_id !== undefined) {
            if (category_id === null || category_id === '') {
                fields.push(`category_id = $${idx++}`);
                values.push(null);
            } else {
                const categoryId = clamp(category_id, 1, 10000000, null);
                if (!categoryId) {
                    return res.status(400).json({ error: 'category_id must be a positive integer' });
                }

                const categoryCheck = await pool.query('SELECT id FROM training_categories WHERE id = $1', [categoryId]);
                if (categoryCheck.rows.length === 0) {
                    return res.status(404).json({ error: 'Training category not found' });
                }

                fields.push(`category_id = $${idx++}`);
                values.push(categoryId);
            }
        }

        if (fields.length === 0) {
            return res.status(400).json({ error: 'No valid fields provided for update' });
        }

        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        const result = await pool.query(
            `UPDATE training_playlists
             SET ${fields.join(', ')}
             WHERE id = $${idx}
             RETURNING id, category_id, name, description, display_order, is_active, youtube_playlist_url, created_at, updated_at`,
            values
        );

        res.json({
            message: 'Playlist updated successfully',
            playlist: mapPlaylistRow(result.rows[0]),
        });
    } catch (err) {
        next(err);
    }
};

const deletePlaylist = async (req, res, next) => {
    try {
        const { id } = req.params;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const existing = await client.query(
                'SELECT id FROM training_playlists WHERE id = $1',
                [id]
            );

            if (existing.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Playlist not found' });
            }

            // Get video IDs from this playlist
            const videoIdsResult = await client.query(
                'SELECT DISTINCT video_id FROM playlist_items WHERE playlist_id = $1',
                [id]
            );
            const videoIds = videoIdsResult.rows.map((row) => row.video_id);

            // Delete playlist_items for this playlist first
            await client.query('DELETE FROM playlist_items WHERE playlist_id = $1', [id]);

            // Delete the playlist
            await client.query('DELETE FROM training_playlists WHERE id = $1', [id]);

            // Delete orphan videos (videos not in ANY remaining playlist_items)
            let deletedOrphanVideos = 0;
            if (videoIds.length > 0) {
                const orphanDeleteResult = await client.query(
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
                deletedOrphanVideos = orphanDeleteResult.rowCount;
            }

            await client.query('COMMIT');

            res.json({
                message: 'Playlist deleted successfully',
                deleted_orphan_videos: deletedOrphanVideos,
            });
        } catch (dbErr) {
            await client.query('ROLLBACK');
            throw dbErr;
        } finally {
            client.release();
        }
    } catch (err) {
        next(err);
    }
};

const addVideoToPlaylist = async (req, res, next) => {
    try {
        const { playlistId } = req.params;
        const { video_id, order_index = 0 } = req.body;

        if (!video_id) {
            return res.status(400).json({ error: 'video_id is required' });
        }

        // Verify playlist exists
        const playlistCheck = await pool.query('SELECT id FROM training_playlists WHERE id = $1', [playlistId]);
        if (playlistCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Playlist not found' });
        }

        // Verify video exists
        const videoCheck = await pool.query('SELECT id FROM training_videos WHERE id = $1', [video_id]);
        if (videoCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Video not found' });
        }

        const result = await pool.query(
            `INSERT INTO playlist_items (playlist_id, video_id, order_index)
             VALUES ($1, $2, $3)
             RETURNING id, playlist_id, video_id, order_index, created_at`,
            [playlistId, video_id, clamp(order_index, 0, 100000, 0)]
        );

        res.status(201).json({
            message: 'Video added to playlist',
            item: result.rows[0],
        });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'This video is already in the playlist' });
        }
        next(err);
    }
};

const removeVideoFromPlaylist = async (req, res, next) => {
    try {
        const { playlistId, itemId } = req.params;

        const result = await pool.query(
            'DELETE FROM playlist_items WHERE id = $1 AND playlist_id = $2 RETURNING id',
            [itemId, playlistId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Playlist item not found' });
        }

        res.json({ message: 'Video removed from playlist' });
    } catch (err) {
        next(err);
    }
};

const updatePlaylistItemOrder = async (req, res, next) => {
    try {
        const { playlistId, itemId } = req.params;
        const { order_index } = req.body;

        if (order_index === undefined) {
            return res.status(400).json({ error: 'order_index is required' });
        }

        const result = await pool.query(
            `UPDATE playlist_items
             SET order_index = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2 AND playlist_id = $3
             RETURNING id, playlist_id, video_id, order_index, created_at, updated_at`,
            [clamp(order_index, 0, 100000, 0), itemId, playlistId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Playlist item not found' });
        }

        res.json({
            message: 'Playlist item order updated',
            item: result.rows[0],
        });
    } catch (err) {
        next(err);
    }
};

const mapCategoryRow = (row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    display_order: row.display_order,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
});

const mapNoteRow = (row) => ({
    id: row.id,
    category_id: row.category_id,
    title: row.title,
    document_url: row.document_url,
    display_order: row.display_order,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
});

const getPublicTrainingCategories = async (req, res, next) => {
    try {
        const [categoriesResult, playlistsResult, notesResult] = await Promise.all([
            pool.query(
                `SELECT id, name, description, display_order, is_active, created_at, updated_at
                 FROM training_categories
                 WHERE is_active = true
                 ORDER BY display_order ASC, id ASC`
            ),
            pool.query(
                `SELECT tp.id, tp.category_id, tp.name, tp.description, tp.display_order, tp.is_active,
                        tp.youtube_playlist_url, tp.created_at, tp.updated_at,
                        COUNT(pi.id)::int AS video_count
                 FROM training_playlists tp
                 LEFT JOIN playlist_items pi ON pi.playlist_id = tp.id
                 WHERE tp.is_active = true
                 GROUP BY tp.id
                 ORDER BY tp.display_order ASC, tp.id ASC`
            ),
            pool.query(
                `SELECT id, category_id, title, document_url, display_order, is_active, created_at, updated_at
                 FROM training_notes
                 WHERE is_active = true
                 ORDER BY display_order ASC, id ASC`
            ),
        ]);

        const categories = categoriesResult.rows.map((row) => ({
            ...mapCategoryRow(row),
            playlists: [],
            notes: [],
        }));

        const byId = new Map(categories.map((category) => [category.id, category]));
        const uncategorized = {
            id: null,
            name: 'General',
            description: 'Playlists not yet assigned to a category.',
            display_order: 999999,
            is_active: true,
            playlists: [],
            notes: [],
        };

        playlistsResult.rows.forEach((row) => {
            const payload = {
                ...mapPlaylistRow(row),
                video_count: row.video_count,
            };

            const category = row.category_id ? byId.get(row.category_id) : uncategorized;
            if (category) {
                category.playlists.push(payload);
            }
        });

        notesResult.rows.forEach((row) => {
            const category = byId.get(row.category_id);
            if (category) {
                category.notes.push(mapNoteRow(row));
            }
        });

        const responseCategories = [...categories];
        if (uncategorized.playlists.length > 0) {
            responseCategories.push(uncategorized);
        }

        res.json({
            categories: responseCategories,
            count: responseCategories.length,
        });
    } catch (err) {
        next(err);
    }
};

const getAdminTrainingCategories = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT id, name, description, display_order, is_active, created_at, updated_at
             FROM training_categories
             ORDER BY display_order ASC, id ASC`
        );

        res.json({
            categories: result.rows.map(mapCategoryRow),
            count: result.rows.length,
        });
    } catch (err) {
        next(err);
    }
};

const createTrainingCategory = async (req, res, next) => {
    try {
        const { name, description = null, display_order = 0, is_active = true } = req.body;
        if (!name || !String(name).trim()) {
            return res.status(400).json({ error: 'Category name is required' });
        }

        const result = await pool.query(
            `INSERT INTO training_categories (name, description, display_order, is_active)
             VALUES ($1, $2, $3, $4)
             RETURNING id, name, description, display_order, is_active, created_at, updated_at`,
            [
                String(name).trim().slice(0, 255),
                typeof description === 'string' ? description.trim().slice(0, 2000) || null : null,
                clamp(display_order, 0, 100000, 0),
                Boolean(is_active),
            ]
        );

        res.status(201).json({
            message: 'Training category created successfully',
            category: mapCategoryRow(result.rows[0]),
        });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'A training category with this name already exists' });
        }
        next(err);
    }
};

const updateTrainingCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, display_order, is_active } = req.body;

        const existing = await pool.query('SELECT id FROM training_categories WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Training category not found' });
        }

        const fields = [];
        const values = [];
        let idx = 1;

        if (typeof name === 'string' && name.trim()) {
            fields.push(`name = $${idx++}`);
            values.push(name.trim().slice(0, 255));
        }

        if (typeof description === 'string' || description === null) {
            fields.push(`description = $${idx++}`);
            values.push(description === null ? null : description.trim().slice(0, 2000));
        }

        if (display_order !== undefined) {
            fields.push(`display_order = $${idx++}`);
            values.push(clamp(display_order, 0, 100000, 0));
        }

        if (typeof is_active === 'boolean') {
            fields.push(`is_active = $${idx++}`);
            values.push(is_active);
        }

        if (fields.length === 0) {
            return res.status(400).json({ error: 'No valid fields provided for update' });
        }

        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        const result = await pool.query(
            `UPDATE training_categories
             SET ${fields.join(', ')}
             WHERE id = $${idx}
             RETURNING id, name, description, display_order, is_active, created_at, updated_at`,
            values
        );

        res.json({
            message: 'Training category updated successfully',
            category: mapCategoryRow(result.rows[0]),
        });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'A training category with this name already exists' });
        }
        next(err);
    }
};

const deleteTrainingCategory = async (req, res, next) => {
    try {
        const { id } = req.params;

        const existing = await pool.query('SELECT id FROM training_categories WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Training category not found' });
        }

        await pool.query('DELETE FROM training_categories WHERE id = $1', [id]);

        res.json({ message: 'Training category deleted successfully' });
    } catch (err) {
        next(err);
    }
};

const getCategoryNotes = async (req, res, next) => {
    try {
        const { categoryId } = req.params;
        const onlyActive = !req.path.includes('/admin/');

        const category = await pool.query('SELECT id FROM training_categories WHERE id = $1', [categoryId]);
        if (category.rows.length === 0) {
            return res.status(404).json({ error: 'Training category not found' });
        }

          const query = onlyActive
                ? `SELECT id, category_id, title, document_url, display_order, is_active, created_at, updated_at
                    FROM training_notes
                    WHERE category_id = $1 AND is_active = true
                    ORDER BY display_order ASC, id ASC`
                : `SELECT id, category_id, title, document_url, display_order, is_active, created_at, updated_at
                    FROM training_notes
                    WHERE category_id = $1
                    ORDER BY display_order ASC, id ASC`;

        const result = await pool.query(query, [categoryId]);

        res.json({
            notes: result.rows.map(mapNoteRow),
            count: result.rows.length,
        });
    } catch (err) {
        next(err);
    }
};

const createCategoryNote = async (req, res, next) => {
    try {
        const { categoryId } = req.params;
        const {
            title,
            document_url = null,
            display_order = 0,
            is_active = true,
        } = req.body;

        console.log('CREATE NOTE - Received req.body:', req.body);
        console.log('CREATE NOTE - Extracted title:', title);
        console.log('CREATE NOTE - Title type:', typeof title);

        const safeTitle = typeof title === 'string' ? title.trim() : '';
        const safeDocumentUrl = typeof document_url === 'string' ? document_url.trim() : null;

        console.log('CREATE NOTE - Safe values:', { safeTitle, safeDocumentUrl });

        if (!safeTitle) {
            return res.status(400).json({ error: 'Note title is required' });
        }

        if (!safeDocumentUrl) {
            return res.status(400).json({ error: 'Provide a document URL' });
        }

        const category = await pool.query('SELECT id FROM training_categories WHERE id = $1', [categoryId]);
        if (category.rows.length === 0) {
            return res.status(404).json({ error: 'Training category not found' });
        }

        const result = await pool.query(
            `INSERT INTO training_notes (category_id, title, document_url, display_order, is_active)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, category_id, title, document_url, display_order, is_active, created_at, updated_at`,
            [
                categoryId,
                safeTitle.slice(0, 255),
                safeDocumentUrl ? safeDocumentUrl.slice(0, 1000) : null,
                clamp(display_order, 0, 100000, 0),
                Boolean(is_active),
            ]
        );

        console.log('CREATE NOTE - Inserted row:', result.rows[0]);

        res.status(201).json({
            message: 'Category note created successfully',
            note: mapNoteRow(result.rows[0]),
        });
    } catch (err) {
        next(err);
    }
};

const updateCategoryNote = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, document_url, display_order, is_active } = req.body;

        const existing = await pool.query('SELECT id FROM training_notes WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Training note not found' });
        }

        const fields = [];
        const values = [];
        let idx = 1;

        if (typeof title === 'string') {
            const safeTitle = title.trim();
            if (!safeTitle) {
                return res.status(400).json({ error: 'Note title cannot be empty' });
            }
            fields.push(`title = $${idx++}`);
            values.push(safeTitle.slice(0, 255));
        }


        if (typeof document_url === 'string' || document_url === null) {
            fields.push(`document_url = $${idx++}`);
            values.push(document_url === null ? null : document_url.trim().slice(0, 1000));
        }

        if (display_order !== undefined) {
            fields.push(`display_order = $${idx++}`);
            values.push(clamp(display_order, 0, 100000, 0));
        }

        if (typeof is_active === 'boolean') {
            fields.push(`is_active = $${idx++}`);
            values.push(is_active);
        }

        if (fields.length === 0) {
            return res.status(400).json({ error: 'No valid fields provided for update' });
        }

        const previewValues = { ...req.body };
        if (fields.some((field) => field.startsWith('document_url'))) {
            const safeDocumentUrl = Object.prototype.hasOwnProperty.call(previewValues, 'document_url')
                ? (typeof previewValues.document_url === 'string' ? previewValues.document_url.trim() : previewValues.document_url)
                : undefined;

            if (safeDocumentUrl === '' || safeDocumentUrl === null || safeDocumentUrl === undefined) {
                return res.status(400).json({ error: 'Provide a document URL' });
            }
        }

        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        const result = await pool.query(
            `UPDATE training_notes
             SET ${fields.join(', ')}
             WHERE id = $${idx}
             RETURNING id, category_id, title, document_url, display_order, is_active, created_at, updated_at`,
            values
        );

        res.json({
            message: 'Category note updated successfully',
            note: mapNoteRow(result.rows[0]),
        });
    } catch (err) {
        next(err);
    }
};

const deleteCategoryNote = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await pool.query('DELETE FROM training_notes WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Training note not found' });
        }

        res.json({ message: 'Category note deleted successfully' });
    } catch (err) {
        next(err);
    }
};

const uploadTrainingNoteDocument = async (req, res, next) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileName = path.basename(file.path);
        const document = {
            name: file.originalname,
            path: `/uploads/training-notes/${fileName}`,
            url: `${req.protocol}://${req.get('host')}/uploads/training-notes/${fileName}`,
            size: file.size,
            mimeType: file.mimetype,
        };

        res.status(201).json({
            message: 'Training note document uploaded successfully',
            document,
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getPublicTrainingVideos,
    getAdminTrainingVideos,
    createTrainingVideo,
    updateTrainingVideo,
    deleteTrainingVideo,
    getPublicPlaylists,
    getAdminPlaylists,
    getPlaylistItems,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    updatePlaylistItemOrder,
    getPublicTrainingCategories,
    getAdminTrainingCategories,
    createTrainingCategory,
    updateTrainingCategory,
    deleteTrainingCategory,
    getCategoryNotes,
    createCategoryNote,
    updateCategoryNote,
    deleteCategoryNote,
    uploadTrainingNoteDocument,
};
