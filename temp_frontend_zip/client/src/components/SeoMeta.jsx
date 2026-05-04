import React from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_URL = (process.env.REACT_APP_SITE_URL || window.location.origin || 'http://localhost:3000').replace(/\/$/, '');
const DEFAULT_IMAGE = `${SITE_URL}/static/images/profilePic.jpg`;

const SeoMeta = ({
    title,
    description,
    keywords = [],
    image,
    path = '/',
    type = 'website',
    noIndex = false,
}) => {
    const canonical = `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
    const finalDescription = description || 'InsightForge platform for surveys, articles, training, and media.';
    const keywordsText = Array.isArray(keywords) ? keywords.join(', ') : String(keywords || '');
    const ogImage = image || DEFAULT_IMAGE;

    return (
        <Helmet>
            <title>{title}</title>
            <meta name="description" content={finalDescription} />
            {keywordsText ? <meta name="keywords" content={keywordsText} /> : null}
            <meta name="robots" content={noIndex ? 'noindex,nofollow' : 'index,follow'} />
            <link rel="canonical" href={canonical} />

            <meta property="og:type" content={type} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={finalDescription} />
            <meta property="og:url" content={canonical} />
            <meta property="og:image" content={ogImage} />

            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={finalDescription} />
            <meta name="twitter:image" content={ogImage} />
        </Helmet>
    );
};

export default SeoMeta;
