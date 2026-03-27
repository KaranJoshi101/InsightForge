import React from 'react';
import MediaGrid from '../components/MediaGrid';
import BackLink from '../components/BackLink';
import { useAuth } from '../context/AuthContext';

const MediaPage = () => {
    const { isAuthenticated } = useAuth();
    const backDestination = isAuthenticated ? '/dashboard' : '/';

    return (
        <div className="page-shell-wide">
            <BackLink
                to={backDestination}
                label={isAuthenticated ? 'Back to Dashboard' : 'Back to Home'}
            />
            <header className="page-header">
                <h1 className="page-header-title">Media Feed</h1>
                <p className="page-header-subtitle">Explore highlights and research updates</p>
            </header>
            <MediaGrid title="" limit={50} clickable={true} />
        </div>
    );
};

export default MediaPage;
