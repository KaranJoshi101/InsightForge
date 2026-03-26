-- Add youtube_playlist_url column to training_playlists table

ALTER TABLE training_playlists ADD COLUMN youtube_playlist_url VARCHAR(500);
