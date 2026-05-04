const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const pool = require('../config/database');

const toHtmlList = (items) => `<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`;

const services = [
    {
        slug: 'protocol-development',
        short_description:
            'Turn your clinical or applied research idea into a protocol that is operationally feasible, statistically sound, and ready for review.',
        hero: {
            subtitle: 'Build a protocol that aligns scientific intent, study operations, and analysis strategy from the first draft.',
            benefits: [
                'Clarifies objectives, estimands, and endpoint hierarchy early',
                'Reduces amendment risk by resolving design gaps upfront',
                'Improves alignment across investigators, biostatistics, and operations',
                'Supports faster ethics and sponsor review cycles',
            ],
        },
        content:
            '<h2>Overview</h2><p>Protocol quality determines whether a study runs smoothly or stalls in revisions. We help you structure a protocol that is practical in the field and defensible in review.</p><p>Designed to meet regulatory and academic standards, this service creates a stronger foundation for execution, analysis, and reporting.</p><h2>What We Do</h2><ul><li>Refine primary and secondary objectives into measurable endpoints</li><li>Define analysis populations and key statistical considerations</li><li>Stress-test eligibility, visit schedules, and data collection feasibility</li><li>Align protocol language with downstream SAP and TLF needs</li></ul><h2>Our Approach</h2><p>We run focused working sessions with your team, then produce structured drafts with tracked rationale for each major decision. Ambiguities are converted into explicit assumptions so the protocol remains implementation-ready.</p><h2>Why It Matters</h2><p>A well-built protocol improves cross-functional execution and protects study credibility. It ensures clarity, accuracy, and defensibility when results are interpreted by reviewers, sponsors, and publication teams.</p>',
        deliverables: [
            'Protocol architecture and endpoint mapping document',
            'Draft statistical considerations section',
            'Assumptions and risk register with mitigation notes',
            'Protocol review memo with prioritized revisions',
            'Versioned change log for stakeholder alignment',
        ],
        target_audience: ['Clinical research teams', 'Principal investigators', 'Biotech study leads', 'Academic trial units'],
    },
    {
        slug: 'statistical-data-analysis-plan',
        short_description:
            'Convert protocol objectives into a detailed SAP that guides programming, quality checks, and interpretation with full traceability.',
        hero: {
            subtitle: 'Create a decision-ready SAP that removes ambiguity and standardizes execution across data, programming, and reporting teams.',
            benefits: [
                'Defines populations, estimands, and model strategy clearly',
                'Pre-specifies handling for missing data and protocol deviations',
                'Improves reproducibility and audit readiness',
                'Reduces analysis rework during lock and reporting',
            ],
        },
        content:
            '<h2>Overview</h2><p>An SAP is the operational blueprint for valid inference. We develop plans that connect protocol intent to executable statistical methods and output specifications.</p><p>Used by researchers, analysts, and industry teams, our SAPs are built for practical implementation, not generic template language.</p><h2>What We Do</h2><ul><li>Define endpoint-specific estimands and analysis populations</li><li>Specify model assumptions, covariates, and sensitivity analyses</li><li>Document rules for missing data, outliers, and intercurrent events</li><li>Map analyses to planned tables, listings, and figures</li></ul><h2>Our Approach</h2><p>We use a traceability-first workflow: each SAP section links to protocol objectives and expected outputs. Drafts are iterated with statistical and clinical stakeholders to close interpretation gaps before programming starts.</p><h2>Why It Matters</h2><p>A robust SAP minimizes post-hoc decisions, supports defensible conclusions, and strengthens reviewer confidence. It ensures clarity, accuracy, and defensibility from database lock through final reporting.</p>',
        deliverables: [
            'Full SAP draft with section-level traceability',
            'Population and estimand definition matrix',
            'Missing data and sensitivity analysis strategy',
            'Analysis-to-output mapping table',
            'SAP quality checklist and issue log',
            'Final review-ready SAP package',
        ],
        target_audience: ['Biostatistics teams', 'CRO biostatistical leads', 'Clinical development groups', 'Medical affairs analytics teams'],
    },
    {
        slug: 'sample-size-power-analysis',
        short_description:
            'Estimate sample size with transparent assumptions so your study is neither underpowered nor over-resourced.',
        hero: {
            subtitle: 'Make enrollment decisions with confidence using scenario-based power planning tailored to your endpoint and constraints.',
            benefits: [
                'Quantifies trade-offs between effect size, power, and feasibility',
                'Improves budget and timeline planning',
                'Supports ethics and grant justification with defensible logic',
                'Flags design sensitivity to dropout and noncompliance',
            ],
        },
        content:
            '<h2>Overview</h2><p>Sample size decisions influence scientific validity, cost, and timeline risk. We deliver power analyses that are transparent, assumption-driven, and suitable for protocol and funding review.</p><p>Designed to meet regulatory and academic standards, each recommendation includes rationale that non-statistical stakeholders can understand.</p><h2>What We Do</h2><ul><li>Select methods based on endpoint type, design, and analysis model</li><li>Build scenarios for effect size uncertainty and variance assumptions</li><li>Adjust for dropout, clustering, multiplicity, or stratification as needed</li><li>Summarize recommended enrollment targets with decision logic</li></ul><h2>Our Approach</h2><p>We start with realistic clinical or operational assumptions, then run structured scenarios rather than a single-point estimate. Results are translated into practical recommendations for recruitment and resource planning.</p><h2>Why It Matters</h2><p>Underpowered studies waste effort; oversized studies waste budget and time. A defensible power strategy ensures clarity, accuracy, and defensibility when plans are reviewed by ethics boards, sponsors, or grant panels.</p>',
        deliverables: [
            'Sample size assumptions table',
            'Power scenario outputs with interpretation',
            'Dropout-adjusted enrollment recommendation',
            'Design option comparison summary',
            'Reviewer-friendly methods appendix',
        ],
        target_audience: ['Principal investigators', 'Grant applicants', 'Clinical study planners', 'Health outcomes research teams'],
    },
    {
        slug: 'tlf-development',
        short_description:
            'Design clear, publication-ready and submission-ready TLF shells that streamline programming and interpretation.',
        hero: {
            subtitle: 'Standardize your reporting outputs with TLF specifications that align SAP definitions and stakeholder expectations.',
            benefits: [
                'Improves consistency across outputs and reporting cycles',
                'Reduces programming ambiguity and rework',
                'Enhances readability for clinical and executive audiences',
                'Strengthens traceability from analysis to reporting',
            ],
        },
        content:
            '<h2>Overview</h2><p>Well-designed TLFs make results easier to generate, review, and defend. We develop shell packages that reflect study objectives, endpoint hierarchy, and interpretation needs.</p><p>Used by researchers, analysts, and industry teams, our TLF frameworks support both regulatory-style reporting and manuscript workflows.</p><h2>What We Do</h2><ul><li>Design table, listing, and figure shells aligned to SAP outputs</li><li>Define numbering conventions, titles, footnotes, and abbreviations</li><li>Create metadata guidance for population flags and derivations</li><li>Prepare handoff notes for programming and medical writing teams</li></ul><h2>Our Approach</h2><p>We combine statistical logic with communication clarity. Each shell is reviewed for analytical correctness, visual readability, and downstream usability in slide decks, reports, and submissions.</p><h2>Why It Matters</h2><p>Strong TLF design accelerates production and improves interpretability under tight timelines. It ensures clarity, accuracy, and defensibility in every reporting milestone.</p>',
        deliverables: [
            'TLF shell library with standardized structure',
            'Labeling and numbering convention guide',
            'Footnote and notation style guide',
            'Output traceability cross-reference sheet',
            'Programming handoff package with implementation notes',
        ],
        target_audience: ['Statistical programmers', 'Biostatisticians', 'Medical writers', 'Regulatory submission teams', 'Clinical reporting leads'],
    },
    {
        slug: 'research-methodology',
        short_description:
            'Strengthen your study design and analytical logic so conclusions are credible, reproducible, and fit for peer or policy review.',
        hero: {
            subtitle: 'Refine methodology choices across design, measurement, and inference to produce more defensible evidence.',
            benefits: [
                'Improves internal validity and interpretability',
                'Reduces bias through explicit mitigation planning',
                'Aligns design decisions with feasible analysis strategy',
                'Supports stronger peer-review and stakeholder confidence',
            ],
        },
        content:
            '<h2>Overview</h2><p>Methodological misalignment often undermines otherwise strong projects. We help you connect research questions, design choices, measurement strategy, and statistical inference into one coherent framework.</p><p>Designed to meet regulatory and academic standards, this service is especially valuable for complex clinical, observational, and mixed-method studies.</p><h2>What We Do</h2><ul><li>Review design logic, sampling strategy, and variable definitions</li><li>Assess bias, confounding, and validity threats</li><li>Recommend methodological refinements and analytic safeguards</li><li>Support methods section drafting for proposals and manuscripts</li></ul><h2>Our Approach</h2><p>We perform a structured diagnostic review, identify high-impact risks, and prioritize practical fixes. Recommendations are tied to your timeline, data reality, and publication or decision context.</p><h2>Why It Matters</h2><p>Robust methodology protects result credibility and improves decision quality. It ensures clarity, accuracy, and defensibility when evidence informs clinical action, policy, or investment.</p>',
        deliverables: [
            'Methodology diagnostic report',
            'Bias and confounding mitigation plan',
            'Design refinement recommendations with rationale',
            'Analysis alignment memo',
            'Methods narrative draft support',
        ],
        target_audience: ['Academic researchers', 'Clinical methodologists', 'Policy and public health teams', 'Applied research consultants'],
    },
    {
        slug: 'report-writing',
        short_description:
            'Transform complex analyses into clear, decision-oriented reports that communicate findings with precision and confidence.',
        hero: {
            subtitle: 'Deliver reports that are scientifically rigorous, easy to scan, and tailored to technical and non-technical stakeholders.',
            benefits: [
                'Translates statistical outputs into clear narratives',
                'Improves decision speed for leadership and partners',
                'Maintains methodological integrity in plain language',
                'Reduces revision cycles during stakeholder review',
            ],
        },
        content:
            '<h2>Overview</h2><p>Strong reporting bridges analysis and action. We help you produce structured reports that present methods, findings, and implications with clarity and discipline.</p><p>Used by researchers, analysts, and industry teams, our reporting style balances technical accuracy with stakeholder readability.</p><h2>What We Do</h2><ul><li>Draft or refine methods, results, and interpretation sections</li><li>Integrate tables and figures into a coherent evidence narrative</li><li>Strengthen language around uncertainty, limitations, and implications</li><li>Align report tone to academic, clinical, or executive audiences</li></ul><h2>Our Approach</h2><p>We work from your outputs, analysis notes, and audience requirements to create a concise narrative arc. Each section is edited for analytical correctness, readability, and defensible interpretation.</p><h2>Why It Matters</h2><p>Clear reporting improves trust, alignment, and implementation of findings. It ensures clarity, accuracy, and defensibility in internal decisions, submissions, and external communication.</p>',
        deliverables: [
            'Structured report draft (or section-level rewrite)',
            'Results narrative with statistical interpretation',
            'Figure and table integration recommendations',
            'Executive summary tailored to audience',
            'Two revision rounds with tracked changes',
        ],
        target_audience: ['Research teams', 'Healthcare organizations', 'Biotech and pharma functions', 'Consulting and analytics teams'],
    },
    {
        slug: 'statistical-input-in-manuscript',
        short_description:
            'Strengthen manuscript methods and results with targeted statistical review before journal submission.',
        hero: {
            subtitle: 'Increase submission confidence by aligning claims, analyses, and limitations to withstand reviewer scrutiny.',
            benefits: [
                'Improves statistical transparency in Methods and Results',
                'Reduces reviewer objections related to analysis choices',
                'Sharpens interpretation without overstating findings',
                'Supports faster and more focused revision cycles',
            ],
        },
        content:
            '<h2>Overview</h2><p>Many manuscripts are delayed by preventable statistical issues: unclear methods, inconsistent claims, or weak limitation framing. We provide focused statistical input to improve technical credibility before submission.</p><p>Designed to meet regulatory and academic standards, this service supports stronger peer-review performance.</p><h2>What We Do</h2><ul><li>Review statistical framing across abstract, methods, results, and discussion</li><li>Check consistency between analyses performed and claims made</li><li>Refine reporting of effect estimates, uncertainty, and assumptions</li><li>Support author responses to statistical reviewer comments</li></ul><h2>Our Approach</h2><p>We provide annotated, section-specific feedback with clear priority levels. Edits focus on defensibility, transparency, and journal-facing clarity while preserving your study voice and contribution.</p><h2>Why It Matters</h2><p>Better statistical presentation increases reviewer trust and acceptance readiness. It ensures clarity, accuracy, and defensibility at submission and during revision rounds.</p>',
        deliverables: [
            'Annotated manuscript statistical review',
            'Suggested edits for Methods and Results sections',
            'Claim-to-analysis consistency check',
            'Reviewer response support for statistical comments',
            'Submission-readiness checklist',
        ],
        target_audience: ['Authors and co-authors', 'Academic labs', 'Medical publication teams', 'Clinical investigators', 'Health outcomes researchers'],
    },
];

const run = async () => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        let updated = 0;

        for (const service of services) {
            const result = await client.query(
                `UPDATE consulting_services
                 SET short_description = $1,
                     hero_subtitle = $2,
                     hero_benefits = $3::jsonb,
                     content = $4,
                     deliverables = $5,
                     target_audience = $6,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE slug = $7`,
                [
                    service.short_description,
                    service.hero.subtitle,
                    JSON.stringify(service.hero.benefits),
                    service.content,
                    toHtmlList(service.deliverables),
                    toHtmlList(service.target_audience),
                    service.slug,
                ]
            );

            updated += result.rowCount;
        }

        await client.query('COMMIT');

        const verify = await client.query(
            `SELECT slug, short_description, updated_at
             FROM consulting_services
             WHERE slug = ANY($1::text[])
             ORDER BY slug ASC`,
            [services.map((s) => s.slug)]
        );

        console.log(`Updated rows: ${updated}`);
        console.table(verify.rows.map((row) => ({
            slug: row.slug,
            short_description: row.short_description.slice(0, 80),
            updated_at: row.updated_at,
        })));
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Failed to update consulting content:', error.message);
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
};

run();
