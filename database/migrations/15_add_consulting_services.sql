-- Consulting services and lead capture module

CREATE TABLE IF NOT EXISTS consulting_services (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(220) NOT NULL UNIQUE,
    short_description TEXT NOT NULL,
    content TEXT NOT NULL,
    deliverables TEXT,
    target_audience TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_consulting_services_active
    ON consulting_services (is_active);

CREATE TABLE IF NOT EXISTS consulting_requests (
    id SERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL REFERENCES consulting_services(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    file_url VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_consulting_requests_service
    ON consulting_requests (service_id);

CREATE INDEX IF NOT EXISTS idx_consulting_requests_created
    ON consulting_requests (created_at DESC);

INSERT INTO consulting_services (title, slug, short_description, content, deliverables, target_audience, is_active)
VALUES
(
    'Protocol Development',
    'protocol-development',
    'Design robust clinical and research protocols with clear objectives, endpoints, and analysis readiness.',
    '<p>We partner with your team to develop statistically sound, regulator-ready protocols that align scientific intent with operational feasibility. Our approach covers objective framing, endpoint definition, inclusion and exclusion criteria, visit schedules, and risk-aware statistical thinking from day one.</p><p>The output is a clear protocol foundation that accelerates approvals and reduces downstream rework across biostatistics, medical writing, and operations.</p>',
    '<ul><li>Protocol framework and endpoint mapping</li><li>Statistical considerations section</li><li>Assumption log and risk notes</li><li>Review-ready revision package</li></ul>',
    '<ul><li>Clinical researchers</li><li>Academic investigators</li><li>Biotech trial teams</li></ul>',
    true
),
(
    'Statistical Data Analysis Plan',
    'statistical-data-analysis-plan',
    'Develop complete SAP documents translating protocol goals into executable statistical methods.',
    '<p>Our Statistical Analysis Plan service converts protocol intent into an auditable and implementation-ready analysis blueprint. We define populations, handling rules, missing data strategy, model choices, sensitivity analyses, and output conventions.</p><p>This ensures your data management, programming, and reporting teams work from a unified source of truth.</p>',
    '<ul><li>Comprehensive SAP document</li><li>Population and endpoint analysis definitions</li><li>Missing data and sensitivity strategy</li><li>Output shells alignment notes</li></ul>',
    '<ul><li>Biostatistics teams</li><li>CRO sponsors</li><li>Clinical operations leads</li></ul>',
    true
),
(
    'Sample Size & Power Analysis',
    'sample-size-power-analysis',
    'Quantify sample requirements and power trade-offs for defensible and cost-efficient study designs.',
    '<p>We perform rigorous sample size and power analyses tailored to your endpoint type, expected effect size, design constraints, and attrition expectations. Outputs are decision-oriented and explainable for protocol committees and ethics submissions.</p><p>Where uncertainty is high, we include scenario analyses to guide practical enrollment planning.</p>',
    '<ul><li>Sample size assumptions table</li><li>Power scenarios and interpretation memo</li><li>Dropout-adjusted enrollment recommendation</li><li>Design option comparison summary</li></ul>',
    '<ul><li>Principal investigators</li><li>Grant applicants</li><li>Clinical study planners</li></ul>',
    true
),
(
    'TLF Development (Tables, Listings, Figures)',
    'tlf-development',
    'Design publication-ready and regulatory-friendly TLF shells and specifications for reporting workflows.',
    '<p>We create standardized TLF structures that map directly to study objectives, SAP definitions, and stakeholder reporting expectations. The service improves consistency between analysis, programming, and final reporting.</p><p>From shell design to traceability notes, we ensure each output supports interpretation and decision-making.</p>',
    '<ul><li>TLF shell package</li><li>Numbering and labeling conventions</li><li>Metadata and traceability notes</li><li>Programming handoff checklist</li></ul>',
    '<ul><li>Statistical programmers</li><li>Medical writers</li><li>Regulatory submission teams</li></ul>',
    true
),
(
    'Research Methodology',
    'research-methodology',
    'Strengthen study methodology across design, bias control, and analytical strategy alignment.',
    '<p>We help teams refine overall methodological architecture so that design, sampling, measurement, and analysis choices remain coherent and defensible. This includes support for observational, experimental, and mixed-method contexts.</p><p>The result is stronger internal validity, clearer causal reasoning, and improved review outcomes.</p>',
    '<ul><li>Methodology review and gap report</li><li>Design refinement recommendations</li><li>Bias and confounder mitigation plan</li><li>Method section drafting support</li></ul>',
    '<ul><li>Academic researchers</li><li>Policy and social science teams</li><li>Clinical methodologists</li></ul>',
    true
),
(
    'Report Writing',
    'report-writing',
    'Convert technical analyses into clear, decision-oriented reports for academic, clinical, and business stakeholders.',
    '<p>We provide structured report writing support that translates complex statistical outputs into clear narratives with defensible interpretation. Reports are tailored to stakeholder context while preserving methodological rigor.</p><p>We can support full report drafting or targeted sections such as methods, results, and discussion.</p>',
    '<ul><li>Structured report draft</li><li>Results narrative with statistical interpretation</li><li>Figure/table integration guidance</li><li>Revision support rounds</li></ul>',
    '<ul><li>Research teams</li><li>Healthcare organizations</li><li>Consulting and analytics teams</li></ul>',
    true
),
(
    'Statistical Input in Manuscript',
    'statistical-input-in-manuscript',
    'Provide expert statistical review and writing support for manuscripts before submission.',
    '<p>We review manuscript drafts to strengthen statistical framing, methods transparency, results interpretation, and reviewer resilience. Feedback focuses on alignment between claims, analyses, and limitations.</p><p>This improves submission confidence and reduces revision cycles related to statistical critique.</p>',
    '<ul><li>Statistical review comments</li><li>Methods and results edits</li><li>Reviewer response support</li><li>Submission-readiness checklist</li></ul>',
    '<ul><li>Authors and co-authors</li><li>Academic labs</li><li>Medical publication teams</li></ul>',
    true
)
ON CONFLICT (slug) DO UPDATE
SET
    title = EXCLUDED.title,
    short_description = EXCLUDED.short_description,
    content = EXCLUDED.content,
    deliverables = EXCLUDED.deliverables,
    target_audience = EXCLUDED.target_audience,
    is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;
