import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LandingPage.css';

const LandingPage = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    const scrollToSection = (id) => {
        setMobileMenuOpen(false);
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Sample data — replace with real admin / research data
    const researchAreas = [
        {
            icon: '\u{1F4CA}',
            title: 'Biostatistics & Clinical Research',
            description: 'Applying statistical methods to biomedical and clinical datasets for disease modeling, wound research, and healthcare outcomes. Experience includes clinical data analysis in pharmaceutical research and hospital-based studies.',
        },
        {
            icon: '\u{1F9EC}',
            title: 'Health Economics & Public Health Studies',
            description: 'Research focused on healthcare utilization, out-of-pocket expenditure, and policy evaluation using econometric and statistical methods to support evidence-based public health decision making.',
        },
        {
            icon: '\u{1F4BB}',
            title: 'Applied Statistics & Data Analysis',
            description: 'Using statistical and econometric techniques to analyze complex datasets across health sciences, economics, and social research with tools such as R, SPSS-AMOS, STATA, SAS, and Excel.',
        },
        {
            icon: '\u{1F30D}',
            title: 'Research Methodology & Quantitative Modeling',
            description: 'Designing quantitative research frameworks and statistical models for interdisciplinary studies, supporting academic research, policy analysis, and evidence-based decision making.',
        },
    ];

    const publications = [
        {
            title: 'Multistate Model of Chronic Wounds, Amputations, and Mortality: Cohort Study of a State-wide Registry',
            journal: 'Annals of Surgery',
            year: '2025',
            tags: ['Biostatistics', 'Clinical Research', 'Medical Data'],
            featured: true,
        },
        {
            title: 'Urban Green Space Assessment Index (UGSAI): A Novel GIS-based Measure for Assessing Green Spaces in Delhi',
            journal: 'Environment and Urbanization ASIA',
            year: '2025',
            tags: ['GIS Analysis', 'Environmental Statistics', 'Urban Studies'],
            featured: false,
        },
        {
            title: 'Deficient Functional Wound Closure as Measured by Elevated Trans-Epidermal Water Loss Predicts Chronic Wound Recurrence',
            journal: 'Scientific Reports (Nature)',
            year: '2024',
            tags: ['Clinical Research', 'Biostatistics', 'Healthcare'],
            featured: false,
        },
        {
            title: 'Utilisation and Out-of-Pocket Expenditure for AYUSH Outpatient Care among Older Adults in India',
            journal: 'Chettinad Health City Medical Journal',
            year: '2023',
            tags: ['Health Economics', 'Public Health', 'Healthcare Policy'],
            featured: false,
        },
    ];

    const mediaTalks = [
        {
            title: 'Keynote: The Future of Digital Health Surveys',
            type: 'Conference Talk',
            description: 'Annual Global Health Informatics Summit 2025',
        },
        {
            title: 'Interview: AI in Community Health Research',
            type: 'Interview',
            description: 'Featured on HealthTech Today podcast',
        },
        {
            title: 'Workshop: Building Scalable Survey Platforms',
            type: 'Workshop',
            description: 'IEEE International Workshop on Digital Health',
        },
    ];

    const galleryItems = [
        { label: 'International Health Conference 2025', placeholder: '\u{1F3DB}' },
        { label: 'Research Lab Team', placeholder: '\u{1F468}\u{200D}\u{1F52C}' },
        { label: 'Best Paper Award 2024', placeholder: '\u{1F3C6}' },
        { label: 'Community Health Fieldwork', placeholder: '\u{1F3E5}' },
        { label: 'Digital Health Workshop', placeholder: '\u{1F4BB}' },
        { label: 'Global Health Summit Panel', placeholder: '\u{1F30D}' },
    ];

    const adminProfileImage = '/static/images/profilePic.jpg';

    return (
        <div className="academic-landing">
            {/* ===== NAVBAR ===== */}
            <nav className="acad-navbar">
                <button
                    type="button"
                    className="acad-navbar-brand"
                    onClick={() => scrollToSection('hero')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    Survey<span className="brand-accent">Pro</span>
                </button>

                <ul className={`acad-navbar-links ${mobileMenuOpen ? 'open' : ''}`}>
                    <li><button type="button" onClick={() => scrollToSection('hero')}>Home</button></li>
                    <li><button type="button" onClick={() => scrollToSection('about')}>About</button></li>
                    <li><button type="button" onClick={() => scrollToSection('research')}>Research</button></li>
                    <li><button type="button" onClick={() => scrollToSection('publications')}>Publications</button></li>
                    <li><button type="button" onClick={() => scrollToSection('media')}>Media</button></li>
                    <li><button type="button" onClick={() => scrollToSection('gallery')}>Gallery</button></li>
                    <li><button type="button" onClick={() => scrollToSection('contact')}>Contact</button></li>
                    <li>
                        <Link
                            to="/login"
                            style={{
                                color: '#FFB81C',
                                fontWeight: '700',
                                padding: '20px 16px',
                                display: 'block',
                                textDecoration: 'none',
                                fontSize: '0.92rem',
                                letterSpacing: '0.3px',
                            }}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Login
                        </Link>
                    </li>
                </ul>

                <button
                    type="button"
                    className="acad-hamburger"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Toggle navigation menu"
                >
                    <span />
                    <span />
                    <span />
                </button>
            </nav>

            {/* ===== HERO ===== */}
            <section className="acad-hero" id="hero">
                <div className="acad-hero-content">
                    <p className="hero-role">Assistant Professor - Applied Statistics & Health Economics</p>
                    <h1>Manoj Kumar</h1>
                    <p className="hero-institution">Centre for Economic Studies and Planning, School of Social Sciences, JNU</p>
                    <p className="hero-tagline">
                        Advancing health outcomes through innovative digital survey platforms,
                        data-driven research, and community-centered technology solutions.
                    </p>
                    <div className="hero-buttons">
                        <button
                            type="button"
                            className="acad-btn acad-btn-gold"
                            onClick={() => scrollToSection('research')}
                        >
                            View Research
                        </button>
                        <button
                            type="button"
                            className="acad-btn acad-btn-outline"
                            onClick={() => scrollToSection('contact')}
                        >
                            Get in Touch
                        </button>
                    </div>
                </div>
            </section>

            {/* ===== ABOUT THE ADMIN ===== */}
            <section className="acad-section acad-section-white" id="about">
                <div className="acad-container">
                    <div className="acad-about-grid">
                        <div className="acad-about-photo">
                            <img
                                src={adminProfileImage}
                                alt="Dr. Manoj Kumar"
                                loading="lazy"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const placeholder = e.currentTarget.nextElementSibling;
                                    if (placeholder) {
                                        placeholder.style.display = 'flex';
                                    }
                                }}
                            />
                            <div className="photo-placeholder" style={{ display: 'none' }}>{'\u{1F464}'}</div>
                        </div>
                        <div className="acad-about-info">
                            <h2>Dr. Manoj Kumar</h2>
                            <p className="about-role">Assistant Professor – Applied Statistics & Health Economics</p>
                            <p className="about-institution">Centre for Economic Studies and Planning School of Social Sciences, Jawaharlal Nehru University (JNU)</p>
                            <hr className="acad-gold-divider" />
                            <p className="about-bio">
                               Dr. Manoj Kumar is an accomplished statistician and researcher specializing in biostatistics, health economics, applied statistics, and data-driven research methodologies. With extensive academic and industry experience across universities, research institutions, and pharmaceutical organizations, his work focuses on applying advanced statistical and econometric methods to healthcare, clinical research, and policy analysis.
                            </p>
                            <p className="about-bio">
                                Currently serving as an Assistant Professor at the Centre for Economic Studies and Planning (CESP), JNU, and a Postdoctoral Associate in Biostatistics and Health Economics at the University of Pittsburgh, Dr. Kumar integrates statistical modeling, health data analytics, and research methodology to support evidence-based decision making in public health and economic policy.ve been adopted by organizations across three continents.
                            </p>
                            <p className="about-bio">
                                His interdisciplinary research combines statistical modeling, biostatistics, econometrics, and computational analysis to address complex challenges in healthcare systems, clinical trials, environmental studies, and social science research. Through international collaborations and peer-reviewed publications, he contributes to advancing quantitative research methods in both academic and applied settings.
                            </p>
                            <ul className="about-details">
                                <li>
                                    <span className="detail-icon">{'\u{2726}'}</span>
                                    <span>Postdoctoral Research – University of Pittsburgh (Biostatistics & Health Economics)</span>
                                </li>
                                <li>
                                    <span className="detail-icon">{'\u{2726}'}</span>
                                    <span>Assistant Professor, CESP – Jawaharlal Nehru University</span>
                                </li>
                                <li>
                                    <span className="detail-icon">{'\u{2726}'}</span>
                                    <span>Expertise in Biostatistics, Econometrics & Health Data Analysis</span>
                                </li>
                                <li>
                                    <span className="detail-icon">{'\u{2726}'}</span>
                                    <span>Research in Clinical Studies, Public Health & Applied Statistics</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== RESEARCH / WORK ===== */}
            <section className="acad-section acad-section-grey" id="research">
                <div className="acad-container">
                    <div className="acad-section-header">
                        <h2>Research &amp; Work</h2>
                        <p>
                            Exploring the intersection of technology, health, and community to create
                            impactful, scalable, and human-centered solutions.
                        </p>
                    </div>
                    <div className="acad-cards-grid">
                        {researchAreas.map((area, i) => (
                            <div className="acad-card" key={i}>
                                <div className="acad-card-icon">{area.icon}</div>
                                <h3>{area.title}</h3>
                                <p>{area.description}</p>
                                <span className="acad-card-link">
                                    Learn More &rarr;
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== PUBLICATIONS ===== */}
            <section className="acad-section acad-section-white" id="publications">
                <div className="acad-container">
                    <div className="acad-section-header">
                        <h2>Publications</h2>
                        <p>
                            Selected peer-reviewed research publications in biostatistics, health economics, and applied statistical analysis.
                        </p>
                    </div>
                    <div className="acad-pub-list">
                        {publications.map((pub, i) => (
                            <div
                                className={`acad-pub-item ${pub.featured ? 'featured' : ''}`}
                                key={i}
                            >
                                <div className="pub-title">{pub.title}</div>
                                <div className="pub-meta">
                                    <span>{pub.journal}</span>
                                    <span>&bull; {pub.year}</span>
                                </div>
                                <div className="acad-pub-tags">
                                    {pub.featured && (
                                        <span className="acad-pub-tag featured-tag">Featured</span>
                                    )}
                                    {pub.tags.map((tag, j) => (
                                        <span className="acad-pub-tag" key={j}>{tag}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== MEDIA / TALKS ===== */}
            <section className="acad-section acad-section-grey" id="media">
                <div className="acad-container">
                    <div className="acad-section-header">
                        <h2>Media &amp; Talks</h2>
                        <p>
                            Conference keynotes, invited talks, interviews, and workshop presentations.
                        </p>
                    </div>
                    <div className="acad-media-grid">
                        {mediaTalks.map((item, i) => (
                            <div className="acad-media-card" key={i}>
                                <div className="acad-media-thumbnail">
                                    <span className="media-type-badge">{item.type}</span>
                                    <div className="play-icon" />
                                </div>
                                <div className="acad-media-body">
                                    <h3>{item.title}</h3>
                                    <p>{item.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== GALLERY ===== */}
            <section className="acad-section acad-section-white" id="gallery">
                <div className="acad-container">
                    <div className="acad-section-header">
                        <h2>Gallery</h2>
                        <p>
                            Highlights from conferences, research activities, awards, and academic events.
                        </p>
                    </div>
                    <div className="acad-gallery-grid">
                        {galleryItems.map((item, i) => (
                            <div className="acad-gallery-item" key={i}>
                                <div className="gallery-placeholder">{item.placeholder}</div>
                                <div className="gallery-overlay">
                                    <p>{item.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== CONTACT ===== */}
            <section className="acad-section acad-section-grey" id="contact">
                <div className="acad-container">
                    <div className="acad-section-header">
                        <h2>Contact</h2>
                        <p>
                            For collaborations, speaking engagements, or research inquiries.
                        </p>
                    </div>
                    <div className="acad-contact-grid">
                        <div className="acad-contact-info">
                            <div className="acad-contact-item">
                                <div className="contact-icon">{'\u{2709}'}</div>
                                <div className="contact-text">
                                    <h3>Email</h3>
                                    <p>
                                        <a href="mailto:manojkumar@jnu.ac.in">manojkumar@jnu.ac.in</a>
                                    </p>
                                </div>
                            </div>
                            <div className="acad-contact-item">
                                <div className="contact-icon">{'\u{1F3E2}'}</div>
                                <div className="contact-text">
                                    <h3>Institution</h3>
                                    <p>Centre for Economic Studies and Planning (CESP)
                                        School of Social Sciences
                                        Jawaharlal Nehru University (JNU)
                                    </p>
                                </div>
                            </div>
                            <div className="acad-contact-item">
                                <div className="contact-icon">{'\u{1F4CD}'}</div>
                                <div className="contact-text">
                                    <h3>Office</h3>
                                    <p>Room No. 345, SSS-II <br></br>
                                        Centre for Economic Studies and Planning
                                        School of Social Sciences <br></br>
                                        Jawaharlal Nehru University, New Delhi
                                    </p>
                                </div>
                            </div>
                            <div className="acad-contact-item">
                                <div className="contact-icon">{'\u{260E}'}</div>
                                <div className="contact-text">
                                    <h3>Phone</h3>
                                    <p>Office: 26704145 <br></br>
                                        Mobile: 9990346151
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="acad-contact-links">
                            <h2>Professional Profiles</h2>
                            <a
                                href="https://scholar.google.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="acad-link-btn"
                            >
                                <span className="link-icon">{'\u{1F393}'}</span>
                                Google Scholar
                            </a>
                            <a
                                href="https://linkedin.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="acad-link-btn"
                            >
                                <span className="link-icon">{'\u{1F517}'}</span>
                                LinkedIn
                            </a>
                            <a
                                href="https://orcid.org"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="acad-link-btn"
                            >
                                <span className="link-icon">{'\u{1F194}'}</span>
                                ORCID
                            </a>
                            <a
                                href="https://researchgate.net"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="acad-link-btn"
                            >
                                <span className="link-icon">{'\u{1F52C}'}</span>
                                ResearchGate
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== FOOTER ===== */}
            <footer className="acad-footer">
                <div className="acad-container">
                    <div className="acad-footer-grid">
                        <div>
                            <div className="acad-footer-brand">
                                Survey<span className="brand-accent">Pro</span>
                            </div>
                            <p>
                                A professional academic research and survey platform dedicated to
                                advancing knowledge through innovative digital tools and data-driven insight.
                            </p>
                        </div>
                        <div>
                            <h4>Quick Links</h4>
                            <ul className="acad-footer-links">
                                <li><button type="button" onClick={() => scrollToSection('hero')}>Home</button></li>
                                <li><button type="button" onClick={() => scrollToSection('about')}>About</button></li>
                                <li><button type="button" onClick={() => scrollToSection('research')}>Research</button></li>
                                <li><button type="button" onClick={() => scrollToSection('publications')}>Publications</button></li>
                                <li><button type="button" onClick={() => scrollToSection('gallery')}>Gallery</button></li>
                            </ul>
                        </div>
                        <div>
                            <h4>Contact</h4>
                            <ul className="acad-footer-links">
                                <li><a href="mailto:manojkumar@jnu.ac.in">manojkumar@jnu.ac.in</a></li>
                                <li><button type="button" onClick={() => scrollToSection('media')}>Media &amp; Talks</button></li>
                                <li><button type="button" onClick={() => scrollToSection('contact')}>Contact Info</button></li>
                                <li><Link to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Login</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="acad-footer-bottom">
                        <p>&copy; {new Date().getFullYear()} SurveyPro &mdash; Academic Research Platform. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
