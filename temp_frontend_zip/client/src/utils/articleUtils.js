/**
 * Article utilities for SEO and UX enhancements
 */

const extractTextFromHtml = (html) => {
    if (!html) return '';

    const container = document.createElement('div');
    container.innerHTML = html;

    const text = container.textContent || container.innerText || '';
    return text.replace(/\s+/g, ' ').trim();
};

// Estimate reading time in minutes (average 200 words per minute)
export const estimateReadingTime = (html) => {
    const text = extractTextFromHtml(html);
    const wordCount = text ? text.split(/\s+/).filter((word) => word.length > 0).length : 0;

    return Math.max(1, Math.ceil(wordCount / 200));
};

// Generate table of contents from HTML headings
export const generateTableOfContents = (html) => {
    if (!html) return [];

    const container = document.createElement('div');
    container.innerHTML = html;

    const headings = Array.from(container.querySelectorAll('h1, h2, h3'));
    const toc = [];

    headings.forEach((heading, index) => {
        const level = parseInt(heading.tagName[1], 10);
        const text = heading.textContent || '';
        const id = heading.id || `heading-${index}`;

        // Update heading ID if not present
        if (!heading.id) {
            heading.id = id;
        }

        toc.push({
            id,
            text,
            level,
        });
    });

    return toc;
};

// Generate slug from text
export const generateSlug = (text) => {
    return String(text || '')
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 120);
};

// Extract first paragraph as preview
export const extractPreview = (html, maxLength = 160) => {
    if (!html) return '';

    const container = document.createElement('div');
    container.innerHTML = html;

    const firstParagraph = container.querySelector('p');
    const text = (firstParagraph?.textContent || '').replace(/\s+/g, ' ').trim();

    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

// Word count
export const countWords = (html) => {
    const text = extractTextFromHtml(html);
    return text ? text.split(/\s+/).filter((word) => word.length > 0).length : 0;
};

// Char count
export const countCharacters = (html) => {
    if (!html) return 0;
    const text = html.replace(/<[^>]*>/g, '');
    return text.length;
};
