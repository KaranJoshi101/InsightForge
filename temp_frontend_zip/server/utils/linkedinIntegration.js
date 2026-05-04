/**
 * LinkedIn Integration Helper
 * Fetches LinkedIn posts using access token and normalizes them for media_posts table
 */

const axios = require('axios');

const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';

/**
 * Normalize LinkedIn post to media_posts format
 * @param {Object} linkedInPost - Original LinkedIn API post object
 * @returns {Object} Normalized post object
 */
const normalizeLinkedInPost = (linkedInPost) => {
    return {
        title: linkedInPost.title || linkedInPost.content?.description?.text?.slice(0, 500) || 'LinkedIn Post',
        description: linkedInPost.content?.description?.text || null,
        image_url: linkedInPost.content?.media?.[0]?.image?.imageDisplayUrl || linkedInPost.content?.media?.[0]?.url || null,
        size: linkedInPost.content?.media?.length > 1 ? 'large' : 'medium',
        source: 'linkedin',
        external_id: linkedInPost.id || `linkedin_${linkedInPost.urn}`,
    };
};

/**
 * Fetch LinkedIn posts for a specific profile/organization
 * Note: This requires a valid LinkedIn access token with appropriate permissions
 * 
 * @param {string} accessToken - LinkedIn API access token
 * @param {string} profileUrn - LinkedIn profile URN (e.g., "urn:li:person:XXXXX")
 * @param {number} limit - Maximum posts to fetch (default: 10)
 * @returns {Promise<Array>} Array of normalized media posts
 */
const fetchLinkedInPosts = async (accessToken, profileUrn, limit = 10) => {
    try {
        console.log('[LinkedIn] Fetching posts for profile...');

        const response = await axios.get(
            `${LINKEDIN_API_BASE}/ugcPosts?q=authors&authors=List(${profileUrn})&count=${limit}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'LinkedIn-Version': '202401',
                    'Accept': 'application/vnd.linkedin.normalized+json+2.1',
                },
            }
        );

        if (!response.data.elements || response.data.elements.length === 0) {
            console.log('[LinkedIn] No posts found');
            return [];
        }

        // Normalize posts
        const normalizedPosts = response.data.elements.map(normalizeLinkedInPost);
        console.log(`[LinkedIn] Fetched and normalized ${normalizedPosts.length} posts`);

        return normalizedPosts;
    } catch (error) {
        console.error('[LinkedIn] Error fetching posts:', error.message);
        if (error.response?.status === 401) {
            console.error('[LinkedIn] Authentication failed - check access token');
        }
        throw error;
    }
};

/**
 * Fetch LinkedIn profile share feed (alternative endpoint)
 * This is a more reliable endpoint for getting posts
 * 
 * @param {string} accessToken - LinkedIn API access token
 * @param {string} profileId - LinkedIn profile ID
 * @param {number} limit - Maximum posts to fetch
 * @returns {Promise<Array>} Array of normalized media posts
 */
const fetchLinkedInProfileShares = async (accessToken, profileId, limit = 10) => {
    try {
        console.log('[LinkedIn] Fetching profile shares...');

        const response = await axios.get(
            `${LINKEDIN_API_BASE}/posts?q=author&author=urn:li:person:${profileId}&count=${limit}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'X-Restli-Protocol-Version': '2.0.0',
                },
            }
        );

        if (!response.data.elements || response.data.elements.length === 0) {
            console.log('[LinkedIn] No shares found');
            return [];
        }

        const normalizedPosts = response.data.elements.map(normalizeLinkedInPost);
        console.log(`[LinkedIn] Fetched and normalized ${normalizedPosts.length} profile shares`);

        return normalizedPosts;
    } catch (error) {
        console.error('[LinkedIn] Error fetching profile shares:', error.message);
        throw error;
    }
};

/**
 * Sync LinkedIn posts to the database
 * Used by cron jobs or manual triggers
 * 
 * @param {Object} mediaController - Media controller with insertMediaPosts function
 * @param {string} accessToken - LinkedIn API access token
 * @param {string} profileUrn - LinkedIn profile URN
 * @returns {Promise<Object>} Sync result with inserted/skipped counts
 */
const syncLinkedInPosts = async (mediaController, accessToken, profileUrn) => {
    try {
        console.log('[LinkedIn Sync] Starting sync...');

        const posts = await fetchLinkedInPosts(accessToken, profileUrn, 20);

        if (posts.length === 0) {
            console.log('[LinkedIn Sync] No posts to sync');
            return { inserted: 0, skipped: 0 };
        }

        const result = await mediaController.insertMediaPosts(posts);
        console.log('[LinkedIn Sync] Completed:', result);

        return result;
    } catch (error) {
        console.error('[LinkedIn Sync] Error:', error.message);
        throw error;
    }
};

/**
 * Create a mock LinkedIn post for testing/demo
 * Useful when LinkedIn API is unavailable
 * 
 * @returns {Object} Mock media post
 */
const createMockLinkedInPost = (index = 1) => {
    const titles = [
        'Excited to announce my new research on biostatistics',
        'Grateful for the opportunity to present at the conference',
        'Latest publication on health economics is now live',
        'Collaborating with international research teams',
        'Insights from recent fieldwork in public health',
    ];

    const descriptions = [
        'Working on advancing statistical methods in clinical research to improve patient outcomes.',
        'Sharing insights from our latest survey on healthcare utilization patterns.',
        'Exploring the intersection of data science and public health policy.',
        'Thrilled to discuss emerging trends in health economics research.',
        'New findings on epidemiological modeling and disease prevention.',
    ];

    const sizes = ['small', 'medium', 'large'];
    const mocks = [
        'https://via.placeholder.com/500x400?text=Research+Presentation',
        'https://via.placeholder.com/600x600?text=Conference+Talk',
        'https://via.placeholder.com/800x400?text=Publication',
        'https://via.placeholder.com/400x500?text=Fieldwork',
        'https://via.placeholder.com/600x400?text=Collaboration',
    ];

    return {
        title: titles[index % titles.length],
        description: descriptions[index % descriptions.length],
        image_url: mocks[index % mocks.length],
        size: sizes[index % sizes.length],
        source: 'linkedin',
        external_id: `linkedin_mock_${Date.now()}_${index}`,
    };
};

module.exports = {
    normalizeLinkedInPost,
    fetchLinkedInPosts,
    fetchLinkedInProfileShares,
    syncLinkedInPosts,
    createMockLinkedInPost,
};
