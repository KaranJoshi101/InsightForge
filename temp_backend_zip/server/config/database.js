// Database connection configuration
const mysql = require('mysql2/promise');
require('dotenv').config();

const parseBoolean = (value, defaultValue = false) => {
    if (value === undefined || value === null || value === '') {
        return defaultValue;
    }

    return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
};

const isSslEnabled = parseBoolean(process.env.DB_SSL, false);

const mysqlPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: isSslEnabled ? { rejectUnauthorized: false } : undefined,
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_POOL_SIZE || '10', 10),
    queueLimit: 0,
    multipleStatements: true,
});

const eventHandlers = new Map();

const normalizeTableName = (raw) => {
    const table = String(raw || '').replace(/["`]/g, '').trim();
    const parts = table.split('.');
    return parts[parts.length - 1];
};

const stripPgCasts = (sql) => sql.replace(/::\s*[a-z_][a-z0-9_]*(\[\])?/gi, '');

const replaceIntervalExpressions = (sql) => {
    const withMinuteIntervals = sql
        // Support both casted and de-casted Postgres interval forms after SQL normalization.
        .replace(
            /CURRENT_TIMESTAMP\s*\+\s*\(\$(\d+)\s*\|\|\s*'\s*minutes'\s*\)(?:\s*::interval)?/gi,
            (_match, idx) => `DATE_ADD(CURRENT_TIMESTAMP, INTERVAL $${idx} MINUTE)`
        )
        .replace(
            /NOW\(\)\s*\+\s*\(\$(\d+)\s*\|\|\s*'\s*minutes'\s*\)(?:\s*::interval)?/gi,
            (_match, idx) => `DATE_ADD(NOW(), INTERVAL $${idx} MINUTE)`
        );

    return withMinuteIntervals
        .replace(/NOW\(\)\s*-\s*INTERVAL\s*'(\d+)\s+days'/gi, 'DATE_SUB(NOW(), INTERVAL $1 DAY)')
        .replace(/INTERVAL\s*'(\d+)\s+days'/gi, 'INTERVAL $1 DAY');
};

const replaceDateTrunc = (sql) => (
    sql
        .replace(/date_trunc\('day'\s*,\s*NOW\(\)\)/gi, 'DATE(NOW())')
        .replace(/date_trunc\('day'\s*,\s*([^)]+)\)\s*::date/gi, 'DATE($1)')
);

const replaceFilterAggregates = (sql) => (
    sql.replace(/COUNT\(\*\)\s*FILTER\s*\(\s*WHERE\s+([^\)]+)\)/gi, 'SUM(CASE WHEN $1 THEN 1 ELSE 0 END)')
);

const replaceOnConflict = (sql) => {
    const doNothingPattern = /ON\s+CONFLICT\s*\([^\)]+\)\s*DO\s+NOTHING/i;
    if (doNothingPattern.test(sql)) {
        return sql.replace(/^\s*INSERT\s+INTO/i, 'INSERT IGNORE INTO').replace(doNothingPattern, '');
    }

    const doUpdatePattern = /ON\s+CONFLICT\s*\([^\)]+\)\s*DO\s+UPDATE\s+SET\s+([\s\S]+)$/i;
    const match = sql.match(doUpdatePattern);
    if (!match) return sql;

    const mysqlSet = match[1].replace(/EXCLUDED\.([a-z_][a-z0-9_]*)/gi, 'VALUES($1)');
    return sql.replace(doUpdatePattern, `ON DUPLICATE KEY UPDATE ${mysqlSet}`);
};

const expandAnyExpressions = (sql, params) => {
    const expandedParams = Array.isArray(params) ? [...params] : [];
    let nextParamIndex = expandedParams.length + 1;

    const expandedSql = sql.replace(
        /([`"a-z_][`"a-z0-9_\.]*?)\s*=\s*ANY\(\$(\d+)(?:::[^)]+)?\)/gi,
        (_m, column, idxText) => {
            const index = Number(idxText) - 1;
            const value = expandedParams[index];

            if (!Array.isArray(value) || value.length === 0) {
                return '1 = 0';
            }

            const placeholders = value.map((entry) => {
                expandedParams.push(entry);
                const token = `$${nextParamIndex}`;
                nextParamIndex += 1;
                return token;
            });

            return `${column} IN (${placeholders.join(', ')})`;
        }
    );

    return { sql: expandedSql, params: expandedParams };
};

const toMysqlPlaceholders = (sql, params) => {
    const orderedParams = [];
    const mysqlSql = sql.replace(/\$(\d+)/g, (_m, idxText) => {
        const idx = Number(idxText) - 1;
        orderedParams.push(params[idx]);
        return '?';
    });

    return { sql: mysqlSql, params: orderedParams };
};

const normalizeSql = (rawSql, rawParams = []) => {
    const baseSql = String(rawSql || '').replace(/;\s*$/, '');
    const withConflict = replaceOnConflict(baseSql);
    const withCasts = stripPgCasts(withConflict);
    const withIntervals = replaceIntervalExpressions(withCasts);
    const withDateTrunc = replaceDateTrunc(withIntervals);
    const withFilters = replaceFilterAggregates(withDateTrunc);
    const withILike = withFilters.replace(/\bILIKE\b/gi, 'LIKE');

    const anyExpanded = expandAnyExpressions(withILike, rawParams);
    return toMysqlPlaceholders(anyExpanded.sql, anyExpanded.params);
};

const formatResult = (rows, rawResult) => {
    const safeRows = Array.isArray(rows) ? rows : [];
    return {
        rows: safeRows,
        rowCount: typeof rawResult?.affectedRows === 'number' ? rawResult.affectedRows : safeRows.length,
        command: rawResult?.warningStatus !== undefined ? 'MYSQL' : undefined,
        insertId: rawResult?.insertId,
        affectedRows: rawResult?.affectedRows,
    };
};

const executeBase = async (conn, sqlText, params = []) => {
    const trimmed = String(sqlText || '').trim();
    const upper = trimmed.toUpperCase();

    if (upper === 'BEGIN' || upper === 'START TRANSACTION') {
        if (typeof conn.beginTransaction === 'function') {
            await conn.beginTransaction();
        } else {
            await conn.query('START TRANSACTION');
        }
        return formatResult([], { affectedRows: 0 });
    }

    if (upper === 'COMMIT') {
        if (typeof conn.commit === 'function') {
            await conn.commit();
        } else {
            await conn.query('COMMIT');
        }
        return formatResult([], { affectedRows: 0 });
    }

    if (upper === 'ROLLBACK') {
        if (typeof conn.rollback === 'function') {
            await conn.rollback();
        } else {
            await conn.query('ROLLBACK');
        }
        return formatResult([], { affectedRows: 0 });
    }

    const normalized = normalizeSql(trimmed, params);
    const [rows, rawResult] = await conn.query(normalized.sql, normalized.params);

    if (Array.isArray(rows)) {
        return formatResult(rows, rawResult);
    }

    return formatResult([], rows);
};

const executeWithReturning = async (conn, sqlText, params = []) => {
    const sql = String(sqlText || '').trim().replace(/;\s*$/, '');
    if (!/\bRETURNING\b/i.test(sql)) {
        return executeBase(conn, sql, params);
    }

    const insertMatch = sql.match(/^\s*INSERT\s+INTO\s+([`"a-z_][`"a-z0-9_\.]*)[\s\S]*?\bRETURNING\b\s+([\s\S]+)$/i);
    if (insertMatch) {
        const table = normalizeTableName(insertMatch[1]);
        const returningCols = insertMatch[2].trim();
        const insertSql = sql.replace(/\bRETURNING\b[\s\S]*$/i, '').trim();

        const insertResult = await executeBase(conn, insertSql, params);
        if (!insertResult.insertId) {
            return formatResult([], { affectedRows: insertResult.rowCount });
        }

        const selectCols = returningCols === '*' ? '*' : returningCols;
        const selected = await executeBase(conn, `SELECT ${selectCols} FROM ${table} WHERE id = $1`, [insertResult.insertId]);
        return formatResult(selected.rows, { affectedRows: selected.rows.length });
    }

    const deleteMatch = sql.match(/^\s*DELETE\s+FROM\s+([`"a-z_][`"a-z0-9_\.]*)\s+WHERE\s+([\s\S]+?)\s+RETURNING\s+([\s\S]+)$/i);
    if (deleteMatch) {
        const table = normalizeTableName(deleteMatch[1]);
        const whereClause = deleteMatch[2].trim();
        const returningCols = deleteMatch[3].trim();
        const selected = await executeBase(conn, `SELECT ${returningCols} FROM ${table} WHERE ${whereClause}`, params);
        const deleteSql = sql.replace(/\bRETURNING\b[\s\S]*$/i, '').trim();
        await executeBase(conn, deleteSql, params);
        return formatResult(selected.rows, { affectedRows: selected.rows.length });
    }

    const updateMatch = sql.match(/^\s*UPDATE\s+([`"a-z_][`"a-z0-9_\.]*)\s+SET\s+[\s\S]+?\s+WHERE\s+([\s\S]+?)\s+RETURNING\s+([\s\S]+)$/i);
    if (updateMatch) {
        const table = normalizeTableName(updateMatch[1]);
        const whereClause = updateMatch[2].trim();
        const returningCols = updateMatch[3].trim();
        const idParamMatch = whereClause.match(/\bid\s*=\s*\$(\d+)/i);

        const updateSql = sql.replace(/\bRETURNING\b[\s\S]*$/i, '').trim();
        const updateResult = await executeBase(conn, updateSql, params);

        if (idParamMatch) {
            const idParam = Number(idParamMatch[1]) - 1;
            const idValue = params[idParam];
            const selected = await executeBase(conn, `SELECT ${returningCols} FROM ${table} WHERE id = $1`, [idValue]);
            return formatResult(selected.rows, { affectedRows: selected.rows.length });
        }

        return formatResult([], { affectedRows: updateResult.rowCount });
    }

    const stripped = sql.replace(/\bRETURNING\b[\s\S]*$/i, '').trim();
    return executeBase(conn, stripped, params);
};

const executeQuery = async (sqlText, params = [], connection = null) => {
    const conn = connection || mysqlPool;
    return executeWithReturning(conn, sqlText, params);
};

const db = {
    async query(sqlText, params, callback) {
        const hasCallback = typeof callback === 'function' || typeof params === 'function';
        const actualParams = Array.isArray(params) ? params : [];
        const actualCallback = typeof params === 'function' ? params : callback;

        const promise = executeQuery(sqlText, actualParams);

        if (hasCallback) {
            promise.then((result) => actualCallback(null, result)).catch((err) => actualCallback(err));
        }

        return promise;
    },

    async connect() {
        const connection = await mysqlPool.getConnection();

        return {
            async query(sqlText, params) {
                const safeParams = Array.isArray(params) ? params : [];
                return executeQuery(sqlText, safeParams, connection);
            },
            async release() {
                connection.release();
            },
            async end() {
                connection.release();
            },
            async beginTransaction() {
                await connection.beginTransaction();
            },
            async commit() {
                await connection.commit();
            },
            async rollback() {
                await connection.rollback();
            },
        };
    },

    async end() {
        await mysqlPool.end();
    },

    on(eventName, handler) {
        eventHandlers.set(eventName, handler);
        return db;
    },
};

mysqlPool.on('error', (err) => {
    const handler = eventHandlers.get('error');
    if (typeof handler === 'function') {
        handler(err);
        return;
    }

    console.error('Unexpected MySQL pool error', err);
});

module.exports = db;
