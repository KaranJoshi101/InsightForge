-- Sample Media Posts for Testing
-- This data populates the media_posts table with realistic sample posts

INSERT IGNORE INTO media_posts (title, description, image_url, size, source, created_at)
VALUES
    (
        'Multistate Model of Chronic Wounds Research',
        'Presenting latest findings on chronic wound outcomes using advanced statistical modeling techniques.',
        'https://via.placeholder.com/600x400?text=Research+Presentation',
        'medium',
        'manual',
        DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 5 DAY)
    ),
    (
        'Health Economics Panel Discussion',
        'Engaging discussion on healthcare utilization patterns and policy implications in South Asia.',
        'https://via.placeholder.com/400x400?text=Conference+Panel',
        'small',
        'manual',
        DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 4 DAY)
    ),
    (
        'International Collaboration Summit',
        'Working with leading researchers from three continents on biostatistics and epidemiological modeling.',
        'https://via.placeholder.com/800x600?text=Global+Collaboration',
        'large',
        'manual',
        DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 3 DAY)
    ),
    (
        'Data Science for Public Health',
        'Workshop covering applied statistical methods in public health data analysis and visualization.',
        'https://via.placeholder.com/600x500?text=Workshop',
        'medium',
        'manual',
        DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 2 DAY)
    ),
    (
        'Urban Green Space Assessment Project',
        'GIS-based analysis of green spaces in Delhi using novel assessment indexing methodology.',
        'https://via.placeholder.com/500x500?text=GIS+Study',
        'small',
        'manual',
        DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY)
    ),
    (
        'Epidemiological Modeling in Practice',
        'Real-world applications of statistical modeling in disease prevention and health interventions.',
        'https://via.placeholder.com/700x400?text=Epidemiology+Model',
        'medium',
        'manual',
        DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 12 HOUR)
    ),
    (
        'Journal Publication Launch',
        'New peer-reviewed publication in Annals of Surgery on chronic wound outcomes and prevention.',
        'https://via.placeholder.com/400x600?text=Publication',
        'small',
        'manual',
        DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 6 HOUR)
    ),
    (
        'Research Methodology Masterclass',
        'In-depth workshop on quantitative research design, statistical analysis, and reproducible science.',
        'https://via.placeholder.com/800x500?text=Masterclass',
        'large',
        'manual',
        CURRENT_TIMESTAMP
    )
;
