import React from 'react';
import BackLink from '../components/BackLink';
import MediaGrid from '../components/MediaGrid';

const AdminMediaPage = () => {
    return (
        <div style={{ padding: '30px 20px' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                <BackLink to="/admin" label="Back to Admin" />
                <h1 style={{ color: '#003594', marginBottom: '16px', fontSize: '2.3rem' }}>
                    Manage Media
                </h1>
                <p style={{ color: '#555', marginBottom: '32px', fontSize: '1.05rem' }}>
                    Create, edit, and remove media posts shown in the public media feed.
                </p>
                <MediaGrid title="" limit={100} clickable={true} adminMode={true} />
            </div>
        </div>
    );
};

export default AdminMediaPage;
