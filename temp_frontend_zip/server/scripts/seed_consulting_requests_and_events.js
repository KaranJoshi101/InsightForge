const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const pool = require('../config/database');

const DAY_MS = 24 * 60 * 60 * 1000;

const requestMessages = [
    'Need support finalizing statistical methods for a multicenter clinical study with tight submission timelines.',
    'Looking for a robust SAP with clear estimands and sensitivity strategy for regulatory-facing analysis.',
    'Please help validate sample size assumptions and attrition scenarios before ethics submission.',
    'Need TLF shells aligned to protocol endpoints and executive reporting expectations.',
    'Requesting methodology review for observational study with confounding risk and missingness concerns.',
    'Need report writing support to communicate findings to clinical and non-technical stakeholders.',
    'Manuscript draft requires statistical refinement in methods, effect interpretation, and limitation framing.',
    'We need quick consultation on endpoint hierarchy and analysis populations before kickoff.',
    'Require defensible power calculations for grant proposal resubmission within this month.',
    'Need structured support for reviewer comments focused on statistical assumptions and robustness checks.',
];

const firstNames = [
    'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Cameron', 'Avery', 'Drew', 'Quinn',
    'Harper', 'Reese', 'Kendall', 'Parker', 'Skyler', 'Dakota', 'Emerson', 'Finley', 'Sawyer', 'Hayden',
];

const lastNames = [
    'Johnson', 'Lee', 'Patel', 'Nguyen', 'Smith', 'Garcia', 'Kim', 'Brown', 'Wilson', 'Davis',
    'Miller', 'Martinez', 'Anderson', 'Thomas', 'Moore', 'Jackson', 'White', 'Harris', 'Clark', 'Lewis',
];

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];

const randomDateWithinDays = (daysBack = 30) => {
    const now = Date.now();
    const offset = rand(0, daysBack * DAY_MS);
    const jitter = rand(0, 23 * 60 * 60 * 1000);
    return new Date(now - offset + jitter);
};

const makeSessionId = () => `seed_sess_${Math.random().toString(36).slice(2, 12)}`;

const buildSeedRequests = (services, users, total = 42) => {
    const rows = [];

    for (let i = 0; i < total; i += 1) {
        const service = services[i % services.length];
        const first = pick(firstNames);
        const last = pick(lastNames);
        const name = `${first} ${last}`;
        const email = `${first.toLowerCase()}.${last.toLowerCase()}${rand(1, 999)}@example.org`;
        const message = `[SEED] ${pick(requestMessages)}`;
        const user = users.length ? users[rand(0, users.length - 1)] : null;
        const createdAt = randomDateWithinDays(30);
        const attach = Math.random() < 0.25;

        rows.push({
            service_id: service.id,
            user_id: user ? user.id : null,
            name,
            email,
            message,
            file_url: attach ? '/uploads/consulting-requests/seed-sample.pdf' : null,
            created_at: createdAt,
            session_id: makeSessionId(),
        });
    }

    return rows;
};

const buildSeedViewEvents = (services, daysBack = 30) => {
    const events = [];
    const now = new Date();

    for (let d = daysBack - 1; d >= 0; d -= 1) {
        const day = new Date(now.getTime() - d * DAY_MS);

        services.forEach((service) => {
            const dailyViews = rand(2, 9);
            for (let i = 0; i < dailyViews; i += 1) {
                const createdAt = new Date(day.getTime() + rand(0, 20 * 60 * 60 * 1000));
                events.push({
                    service_id: service.id,
                    event_type: 'view',
                    user_id: null,
                    session_id: makeSessionId(),
                    metadata: {
                        source: 'seed',
                        channel: 'web',
                        page: 'consulting-detail',
                    },
                    created_at: createdAt,
                });
            }
        });
    }

    return events;
};

const run = async () => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const servicesResult = await client.query(
            'SELECT id, slug, title FROM consulting_services WHERE is_active = true ORDER BY id ASC'
        );
        const services = servicesResult.rows;

        if (!services.length) {
            throw new Error('No active consulting services found. Seed services first.');
        }

        const usersResult = await client.query(
            "SELECT id FROM users WHERE role <> 'admin' ORDER BY id ASC LIMIT 50"
        );
        const users = usersResult.rows;

        // Idempotent cleanup for previously seeded records.
        await client.query("DELETE FROM consulting_events WHERE metadata->>'source' = 'seed'");
        await client.query("DELETE FROM consulting_requests WHERE message LIKE '[SEED] %'");

        const seedRequests = buildSeedRequests(services, users, 42);

        for (const row of seedRequests) {
            const requestInsert = await client.query(
                `INSERT INTO consulting_requests
                    (service_id, user_id, name, email, message, file_url, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING id, service_id, user_id, created_at`,
                [
                    row.service_id,
                    row.user_id,
                    row.name,
                    row.email,
                    row.message,
                    row.file_url,
                    row.created_at,
                ]
            );

            const created = requestInsert.rows[0];

            await client.query(
                `INSERT INTO consulting_events
                    (service_id, event_type, user_id, session_id, metadata, created_at)
                 VALUES ($1, 'submit', $2, $3, $4::jsonb, $5)`,
                [
                    created.service_id,
                    created.user_id,
                    row.session_id,
                    JSON.stringify({
                        source: 'seed',
                        channel: 'form',
                        request_id: created.id,
                        page: 'consulting-request-form',
                    }),
                    created.created_at,
                ]
            );
        }

        const viewEvents = buildSeedViewEvents(services, 30);
        for (const event of viewEvents) {
            await client.query(
                `INSERT INTO consulting_events
                    (service_id, event_type, user_id, session_id, metadata, created_at)
                 VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
                [
                    event.service_id,
                    event.event_type,
                    event.user_id,
                    event.session_id,
                    JSON.stringify(event.metadata),
                    event.created_at,
                ]
            );
        }

        await client.query('COMMIT');

        const totals = await client.query(
            `SELECT
                (SELECT COUNT(*)::int FROM consulting_requests WHERE message LIKE '[SEED] %') AS request_count,
                (SELECT COUNT(*)::int FROM consulting_events WHERE event_type = 'view' AND metadata->>'source' = 'seed') AS seeded_views,
                (SELECT COUNT(*)::int FROM consulting_events WHERE event_type = 'submit' AND metadata->>'source' = 'seed') AS seeded_submits`
        );

        const overview = await client.query(
            `SELECT
                COUNT(*) FILTER (WHERE event_type = 'view')::int AS total_views,
                COUNT(*) FILTER (WHERE event_type = 'submit')::int AS total_requests
             FROM consulting_events`
        );

        const serviceBreakdown = await client.query(
            `SELECT
                cs.title,
                COUNT(*) FILTER (WHERE ce.event_type = 'view')::int AS views,
                COUNT(*) FILTER (WHERE ce.event_type = 'submit')::int AS requests
             FROM consulting_services cs
             LEFT JOIN consulting_events ce ON ce.service_id = cs.id
             GROUP BY cs.id, cs.title
             ORDER BY cs.title ASC`
        );

        const summary = totals.rows[0];
        const ov = overview.rows[0];
        const conversion = Number(ov.total_views) > 0
            ? ((Number(ov.total_requests) / Number(ov.total_views)) * 100).toFixed(2)
            : '0.00';

        console.log('Seed completed successfully.');
        console.log(`Inserted seed requests: ${summary.request_count}`);
        console.log(`Inserted seed submit events: ${summary.seeded_submits}`);
        console.log(`Inserted seed view events: ${summary.seeded_views}`);
        console.log('--- Analytics Overview (All Events) ---');
        console.log(`Total views: ${ov.total_views}`);
        console.log(`Total requests: ${ov.total_requests}`);
        console.log(`Conversion rate: ${conversion}%`);
        console.log('--- Service Breakdown ---');
        console.table(serviceBreakdown.rows);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Seeding failed:', error.message);
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
};

run();
