import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FaArrowRight,
    FaChartLine,
    FaCheckCircle,
    FaGlobe,
    FaIdBadge,
    FaLaptopCode,
    FaLinkedinIn,
    FaMapMarkerAlt,
    FaPhoneAlt,
    FaUniversity,
    FaUserCircle,
    FaVial,
    FaEnvelope,
} from 'react-icons/fa';
import './LandingPage.css';

const LandingPage = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            icon: FaChartLine,
            title: 'Clinical Trials & Biostatistical Methods',
            description: 'Expert analysis of clinical trial data and development of robust statistical methods for biomedical research. Specialization includes multistate modeling, survival analysis, longitudinal study design, and pharmaceutical research across Phase I-III trials.',
        },
        {
            icon: FaVial,
            title: 'Chronic Wounds, Diabetes & Medical Conditions',
            description: 'Research on complex health conditions including diabetic foot ulcers, chronic wounds, dental health studies, cancer, Parkinson\'s disease, and schizophrenia. Focus on translating clinical observations into statistical insights and evidence-based treatment strategies.',
        },
        {
            icon: FaLaptopCode,
            title: 'Applied Statistics & Machine Learning Analytics',
            description: 'Advanced statistical programming in R, SAS, SPSS-AMOS, STATA, and Python. Applications include omics analysis (metabolomics, genomics), machine learning for prediction models, EHR/survey-based research, and causal inference methodologies.',
        },
        {
            icon: FaGlobe,
            title: 'Health Economics & Public Health Policy',
            description: 'Econometric analysis of healthcare systems, out-of-pocket expenditure studies, cost-effectiveness analysis, and policy evaluation. Focus on health disparities, community health interventions, and evidence-based public health decision making in India and globally.',
        },
        {
            icon: FaVial,
            title: 'Omics & Metabolomics Research',
            description: 'Specialization in lipid and non-lipid metabolomic profiling, microarray analysis, and genomic data interpretation. Applications include wound fluid metabolomics for tissue healing mechanisms and biomarker discovery in chronic disease.',
        },
        {
            icon: FaGlobe,
            title: 'Infectious Disease & Epidemiology',
            description: 'Phylogenetic and Bayesian analysis of viral evolution including Dengue and Zika viruses. Statistical modeling of disease progression dynamics and transmission patterns with focus on public health surveillance and outbreak investigation in India.',
        },
        {
            icon: FaChartLine,
            title: 'Registry Data & Real-World Evidence',
            description: 'Analysis of large-scale patient registries and electronic health records (EHR) for generating real-world evidence. Expertise in database management, data validation, and longitudinal outcome assessment from complex clinical datasets.',
        },
        {
            icon: FaLaptopCode,
            title: 'Statistical Software & Data Management',
            description: 'Proficiency in statistical software ecosystems (R, SAS, STATA, SPSS-AMOS, Python) and survey platforms (Qualtrics, RedCap, OnCore). Data dictionary development, questionnaire design, randomization, and sample size calculations for research protocols.',
        },
    ];

    const publications = [
        {
            title: 'Multistate Model of Chronic Wounds, Amputations, and Mortality: Cohort Study of a State-wide Registry',
            authors: 'Choi JS, Kumar M, Wilson AR, Mathew-Steiner SS, Singh K, Margolis DJ, Schleyer TKL, Sen CK',
            journal: 'Annals of Surgery',
            year: '2025',
            doi: '10.1097/SLA.0000000000006761',
            link: 'https://doi.org/10.1097/SLA.0000000000006761',
            tags: ['Biostatistics', 'Clinical Research', 'Multistate Modeling', 'Chronic Wounds'],
            featured: true,
        },
        {
            title: 'Urban Green Space Assessment Index (UGSAI): A Novel GIS-based Measure for Assessing Green Spaces in Delhi',
            authors: 'Panwar M, Mina U, Kumar K, Kumar M',
            journal: 'Environment and Urbanization ASIA',
            year: '2025',
            doi: '10.1177/09754253251337350',
            link: 'https://doi.org/10.1177/09754253251337350',
            tags: ['GIS Analysis', 'Environmental Statistics', 'Urban Studies'],
            featured: false,
        },
        {
            title: 'SEMTWIST Quantification of Biofilm Infection in Human Chronic Wound Using Scanning Electron Microscopy and Machine Learning',
            authors: 'Singh S, Muniz De Oliveira F, Wang C, Kumar M, Xuan Y, DeMazumder D, Sen CK, Roy S',
            journal: 'Advances in Wound Care',
            year: '2024',
            doi: '10.1089/wound.2024.0291',
            link: 'https://pubmed.ncbi.nlm.nih.gov/40358506/',
            tags: ['Machine Learning', 'Wound Care', 'Biostatistics', 'Clinical Analysis'],
            featured: false,
        },
        {
            title: 'Deficient Functional Wound Closure as Measured by Elevated Trans-Epidermal Water Loss Predicts Chronic Wound Recurrence',
            authors: 'Chattopadhyay D, Sinha M, Kapoor A, et al.',
            journal: 'Scientific Reports (Nature)',
            year: '2024',
            doi: '10.1038/s41598-024-74426-0',
            link: 'https://doi.org/10.1038/s41598-024-74426-0',
            tags: ['Clinical Research', 'Biostatistics', 'Wound Healing'],
            featured: false,
        },
        {
            title: 'An Efficient Hybrid Data Mining Model for Prognostication of an Imbalanced Data Set of Liver Disorder: A K-Prototype Naïve Bayes Approach',
            authors: 'Divya, Singh V, Dohare R, Kumar M',
            journal: 'Chettinad Health City Medical Journal',
            year: '2024',
            tags: ['Machine Learning', 'Data Mining', 'Health Analytics'],
            featured: false,
        },
        {
            title: 'Evolutionary Analysis of Dengue Serotype 2 Viruses Using Phylogenetic and Bayesian Methods from New Delhi, India',
            authors: 'Afreen N, Naqvi IH, Broor S, Ahmed A, Kazim SN, Dohare R, Kumar M, Parveen S',
            journal: 'PLoS Neglected Tropical Diseases',
            year: '2016',
            doi: '10.1371/journal.pntd.0004511',
            link: 'https://pubmed.ncbi.nlm.nih.gov/26978656/',
            tags: ['Phylogenetic Analysis', 'Bayesian Methods', 'Public Health'],
            featured: false,
        },
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
                    <li><Link to="/surveys" onClick={() => setMobileMenuOpen(false)}>Surveys</Link></li>
                    <li><Link to="/training" onClick={() => setMobileMenuOpen(false)}>Training</Link></li>
                    <li><Link to="/articles" onClick={() => setMobileMenuOpen(false)}>Articles</Link></li>
                    <li><Link to="/consulting" onClick={() => setMobileMenuOpen(false)}>Consulting</Link></li>
                    <li><Link to="/media" onClick={() => setMobileMenuOpen(false)}>Media</Link></li>
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
                    <h1>Dr. Manoj Kumar Diwakar</h1>
                    <p className="hero-institution">Centre for Economic Studies and Planning, School of Social Sciences, Jawaharlal Nehru University</p>
                    <p className="hero-tagline">
                        Advancing health outcomes and social research through data-driven methodologies,
                        statistical innovation, and evidence-based policy solutions.
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
                            <div className="photo-placeholder" style={{ display: 'none' }}><FaUserCircle aria-hidden="true" /></div>
                        </div>
                        <div className="acad-about-info">
                            <h2>Dr. Manoj Kumar Diwakar</h2>
                            <p className="about-role">Assistant Professor – Applied Statistics & Health Economics</p>
                            <p className="about-institution">Centre for Economic Studies and Planning, School of Social Sciences, Jawaharlal Nehru University</p>
                            <hr className="acad-gold-divider" />
                            <p className="about-bio">
                               Dr. Manoj Kumar Diwakar is an accomplished statistician and researcher specializing in biostatistics, health economics, applied statistics, and quantitative research methodologies. With strong academic and industry experience across universities, research institutions, and pharmaceutical organizations, his work focuses on applying advanced statistical and econometric methods to healthcare systems, clinical research, environmental studies, and evidence-based policy analysis.
                            </p>
                            <p className="about-bio">
                                Currently serving as an Assistant Professor at the Centre for Economic Studies and Planning (CESP), Jawaharlal Nehru University, Dr. Diwakar integrates statistical modeling, quantitative data analytics, and rigorous research methodology to support evidence-based decision making in public health, economics, and social policy. His research addresses complex challenges in healthcare utilization, clinical outcomes, environmental assessment, and policy evaluation.
                            </p>
                            <p className="about-bio">
                                His interdisciplinary research combines biostatistics, econometrics, computational analysis, and quantitative modeling to address challenges in healthcare systems, clinical trials, public health policy, environmental studies, and social science research. Through peer-reviewed publications in leading journals and international collaborations, he contributes to advancing quantitative research methods in academic and applied settings.
                            </p>
                            <ul className="about-details">
                                <li>
                                    <span className="detail-icon"><FaCheckCircle aria-hidden="true" /></span>
                                    <span>Assistant Professor – Centre for Economic Studies and Planning, JNU</span>
                                </li>
                                <li>
                                    <span className="detail-icon"><FaCheckCircle aria-hidden="true" /></span>
                                    <span>Expertise in Biostatistics, Econometrics & Health Data Analysis</span>
                                </li>
                                <li>
                                    <span className="detail-icon"><FaCheckCircle aria-hidden="true" /></span>
                                    <span>Published Research in Clinical Studies, Health Economics & Public Health Policy</span>
                                </li>
                                <li>
                                    <span className="detail-icon"><FaCheckCircle aria-hidden="true" /></span>
                                    <span>Statistical Tools: R, STATA, SAS, SPSS-AMOS, LaTeX, Excel</span>
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
                            Biostatistics and quantitative research across clinical trials, health economics, epidemiology, and applied data analytics leveraging advanced statistical methods and computational tools.
                        </p>
                    </div>
                    <div className="acad-cards-grid">
                        {researchAreas.map((area, i) => (
                            <div className="acad-card" key={i}>
                                <div className="acad-card-icon"><area.icon aria-hidden="true" /></div>
                                <h3>{area.title}</h3>
                                <p>{area.description}</p>
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
                                <div className="pub-title">
                                    {pub.link ? (
                                        <a href={pub.link} target="_blank" rel="noopener noreferrer" style={{ color: '#003594', textDecoration: 'none', cursor: 'pointer' }}>
                                            {pub.title}
                                        </a>
                                    ) : (
                                        pub.title
                                    )}
                                </div>
                                {pub.authors && (
                                    <div className="pub-authors" style={{ fontSize: '0.9em', color: '#555', marginTop: '6px', marginBottom: '6px' }}>
                                        {pub.authors}
                                    </div>
                                )}
                                <div className="pub-meta">
                                    <span>{pub.journal}</span>
                                    <span>&bull; {pub.year}</span>
                                    {pub.doi && <span>&bull; DOI: {pub.doi}</span>}
                                </div>
                                <div className="acad-pub-tags">
                                    {pub.featured && (
                                        <span className="acad-pub-tag featured-tag">Featured</span>
                                    )}
                                    {pub.tags.map((tag, j) => (
                                        <span className="acad-pub-tag" key={j}>{tag}</span>
                                    ))}
                                </div>
                                {pub.link && (
                                    <div style={{ marginTop: '12px' }}>
                                        <a href={pub.link} target="_blank" rel="noopener noreferrer" style={{ color: '#003594', textDecoration: 'none', fontWeight: '500', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                            Learn More <FaArrowRight size={12} aria-hidden="true" />
                                        </a>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== MEDIA / TALKS (hidden for now) =====
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
            ===== END MEDIA / TALKS ===== */}

            {/* ===== GALLERY (hidden for now) =====
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
            ===== END GALLERY ===== */}

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
                                <div className="contact-icon"><FaEnvelope aria-hidden="true" /></div>
                                <div className="contact-text">
                                    <h3>Email</h3>
                                    <p>
                                        <a href="mailto:manojkumardiwakar@jnu.ac.in">manojkumardiwakar@jnu.ac.in</a>
                                        <br />
                                        <a href="mailto:mak851@pitt.edu">mak851@pitt.edu</a>
                                        <br />
                                        <a href="mailto:manojdiwakarstat@gmail.com">manojdiwakarstat@gmail.com</a>
                                    </p>
                                </div>
                            </div>
                            <div className="acad-contact-item">
                                <div className="contact-icon"><FaUniversity aria-hidden="true" /></div>
                                <div className="contact-text">
                                    <h3>Current Position</h3>
                                    <p>Postdoctoral Associate (Biostatistics and Health Economics)<br />
                                        McGowan Institute for Regenerative Medicine<br />
                                        Department of Surgery<br />
                                        University of Pittsburgh, PA, USA
                                    </p>
                                </div>
                            </div>
                            <div className="acad-contact-item">
                                <div className="contact-icon"><FaMapMarkerAlt aria-hidden="true" /></div>
                                <div className="contact-text">
                                    <h3>Address</h3>
                                    <p>777 Hazelwood Ave<br />
                                        Pittsburgh, PA 15217, USA
                                    </p>
                                </div>
                            </div>
                            <div className="acad-contact-item">
                                <div className="contact-icon"><FaPhoneAlt aria-hidden="true" /></div>
                                <div className="contact-text">
                                    <h3>Phone</h3>
                                    <p>+1 412-589-8944
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="acad-contact-links">
                            <h2>Professional Profiles</h2>
                            <a
                                href="https://www.linkedin.com/in/drmanojkumardiwakarstatisticianprofessoratjnu/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="acad-link-btn"
                            >
                                <span className="link-icon"><FaLinkedinIn aria-hidden="true" /></span>
                                LinkedIn
                            </a>
                            <a
                                href="https://orcid.org/0000-0001-6444-8160"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="acad-link-btn"
                            >
                                <span className="link-icon"><FaIdBadge aria-hidden="true" /></span>
                                ORCID
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
                                <li><Link to="/training">Training Videos</Link></li>
                                <li><Link to="/media">Media &amp; Feedback</Link></li>
                                <li><Link to="/articles">Read Articles</Link></li>
                                <li><button type="button" onClick={() => scrollToSection('media-feed')}>Media Feed</button></li>
                            </ul>
                        </div>
                        <div>
                            <h4>Contact</h4>
                            <ul className="acad-footer-links">
                                <li><a href="mailto:manojkumar@jnu.ac.in">manojkumar@jnu.ac.in</a></li>
                                {/* <li><button type="button" onClick={() => scrollToSection('media')}>Media &amp; Talks</button></li> */}
                                <li><button type="button" onClick={() => scrollToSection('contact')}>Contact Info</button></li>
                                <li><Link to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Login</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="acad-footer-bottom">
                        <p>&copy; {new Date().getFullYear()} Survey Pro &mdash; Academic Research Platform. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
