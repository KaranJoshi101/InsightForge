import React from 'react';
import MediaGrid from '../components/MediaGrid';

const MediaPage = () => {
    return (
        <div style={{ padding: '30px 20px' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                <h1 style={{ color: '#003594', marginBottom: '30px', fontSize: '2.5rem' }}>
                    Media Feed
                </h1>
                <p style={{ color: '#555', marginBottom: '40px', fontSize: '1.1rem' }}>
                    Explore highlights and research updates
                </p>
                <MediaGrid title="" limit={50} clickable={true} />
            </div>
        </div>
    );
};

export default MediaPage;
