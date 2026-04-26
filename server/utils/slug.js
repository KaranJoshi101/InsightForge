const toSlugBase = (value) => {
    const normalized = String(value || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);

    return normalized || 'item';
};

const generateUniqueSlug = async (pool, tableName, title, excludedId = null) => {
    const base = toSlugBase(title);
    let candidate = base;
    let suffix = 1;

    while (true) {
        const params = [candidate];
        let sql = `SELECT id FROM ${tableName} WHERE slug = $1`;

        if (excludedId !== null && excludedId !== undefined) {
            sql += ' AND id <> $2';
            params.push(excludedId);
        }

        const existing = await pool.query(sql, params);
        if (existing.rows.length === 0) {
            return candidate;
        }

        suffix += 1;
        candidate = `${base}-${suffix}`.slice(0, 95);
    }
};

module.exports = {
    toSlugBase,
    generateUniqueSlug,
};
