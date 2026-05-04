import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import consultingService from '../services/consultingService';
import analyticsService from '../services/analyticsService';
import LoadingSpinner from '../components/LoadingSpinner';
import BackLink from '../components/BackLink';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

const normalizeLinkHref = (href) => {
    if (!href) return href;
    const trimmed = href.trim();
    if (!trimmed) return trimmed;

    if (/^(https?:|mailto:|tel:|#|\/)/i.test(trimmed)) {
        return trimmed;
    }

    return `https://${trimmed}`;
};

const normalizeHtml = (html) => {
    if (!html) return html;

    const container = document.createElement('div');
    container.innerHTML = html;

    container.querySelectorAll('img[src]').forEach((image) => {
        const src = image.getAttribute('src');
        if (src && src.startsWith('/uploads/')) {
            image.setAttribute('src', `${API_ORIGIN}${src}`);
        }
    });

    container.querySelectorAll('a[href]').forEach((anchor) => {
        const normalizedHref = normalizeLinkHref(anchor.getAttribute('href'));
        if (normalizedHref) {
            anchor.setAttribute('href', normalizedHref);
        }
        anchor.setAttribute('target', '_blank');
        anchor.setAttribute('rel', 'noopener noreferrer');
    });

    return container.innerHTML;
};

const MAX_FILE_SIZE_MB = 25;

const HERO_BENEFITS_FALLBACK = [
    'Tailored strategy aligned to your project goals',
    'Actionable recommendations from statistical experts',
    'Clear outputs for publication and decision-making',
    'Reliable support from scoping to final delivery',
];

const FORM_TRUST_POINTS = [
    'Free initial consultation',
    'Response within 24 hours',
    '100% confidentiality',
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const parseContentSections = (html) => {
    if (!html) return [];

    const sectionConfig = [
        { key: 'overview', title: 'Overview', pattern: /overview/i },
        { key: 'what-we-do', title: 'What We Do', pattern: /what\s+we\s+do/i },
        { key: 'our-approach', title: 'Our Approach', pattern: /our\s+approach/i },
        { key: 'why-it-matters', title: 'Why It Matters', pattern: /why\s+it\s+matters/i },
    ];

    const sections = sectionConfig.map((item) => ({ ...item, html: '' }));
    const container = document.createElement('div');
    container.innerHTML = html;

    let currentSection = sections[0];

    Array.from(container.children).forEach((node) => {
        if (/^H[1-6]$/.test(node.tagName)) {
            const headingText = (node.textContent || '').trim();
            const matchedSection = sections.find((section) => section.pattern.test(headingText));
            if (matchedSection) {
                currentSection = matchedSection;
                return;
            }
        }

        currentSection.html += node.outerHTML;
    });

    const populated = sections
        .map((section) => ({ title: section.title, html: section.html.trim() }))
        .filter((section) => section.html);

    if (populated.length) {
        return populated;
    }

    return [{ title: 'Overview', html }];
};

const parseDeliverables = (html) => {
    if (!html) return [];

    const container = document.createElement('div');
    container.innerHTML = html;

    const listItems = Array.from(container.querySelectorAll('li'))
        .map((item) => item.textContent?.trim())
        .filter(Boolean);

    if (listItems.length) return listItems;

    const fallbackText = (container.textContent || '').replace(/\s+/g, ' ').trim();
    return fallbackText
        .split(/[.;]/)
        .map((part) => part.trim())
        .filter((part) => part.length > 5)
        .slice(0, 8);
};

const validateField = (name, value) => {
    if (name === 'name') {
        if (!value.trim()) return 'Name is required.';
        if (value.trim().length < 2) return 'Name should have at least 2 characters.';
    }

    if (name === 'email') {
        if (!value.trim()) return 'Email is required.';
        if (!EMAIL_REGEX.test(value.trim())) return 'Enter a valid email address.';
    }

    if (name === 'message') {
        if (!value.trim()) return 'Message is required.';
        if (value.trim().length < 20) return 'Please provide at least 20 characters for better context.';
    }

    return '';
};

const ConsultingDetailPage = () => {
    const { user, isAuthenticated } = useAuth();
    const { addToast } = useToast();
    const { slug } = useParams();
    const navigate = useNavigate();
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [form, setForm] = useState({
        name: '',
        email: '',
        message: '',
        file: null,
    });
    const trackedViewRef = useRef(null);

    const fetchService = useCallback(async () => {
        try {
            setLoading(true);
            const response = await consultingService.getServiceBySlug(slug);
            setService(response.data.service);
            setError('');
        } catch (err) {
            setError('Failed to load consulting service details');
        } finally {
            setLoading(false);
        }
    }, [slug]);

    useEffect(() => {
        fetchService();
    }, [fetchService]);

    useEffect(() => {
        if (!isAuthenticated || !user) return;

        setForm((prev) => ({
            ...prev,
            name: prev.name || user.name || '',
            email: prev.email || user.email || '',
        }));
    }, [isAuthenticated, user]);

    const contentSections = useMemo(() => parseContentSections(normalizeHtml(service?.content || '')), [service?.content]);
    const deliverables = useMemo(() => parseDeliverables(normalizeHtml(service?.deliverables || '')), [service?.deliverables]);
    const heroBenefits = useMemo(() => {
        if (Array.isArray(service?.hero_benefits) && service.hero_benefits.length) {
            return service.hero_benefits;
        }
        return HERO_BENEFITS_FALLBACK;
    }, [service?.hero_benefits]);

    useEffect(() => {
        if (!service?.id) return;
        if (trackedViewRef.current === service.id) return;

        trackedViewRef.current = service.id;

        consultingService.trackEvent({
            service_id: service.id,
            event_type: 'view',
            metadata: {
                slug,
                source: 'consulting-detail-page',
            },
        }).catch(() => {
            // Ignore analytics failures so page UX is never blocked.
        });

        analyticsService.trackEvent({
            event_type: 'consulting_view',
            entity_type: 'consulting',
            entity_id: service.id,
            metadata: {
                slug,
                source: 'consulting-detail-page',
            },
        }).catch(() => {
            // Ignore analytics failures so page UX is never blocked.
        });
    }, [service?.id, slug]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));

        if (fieldErrors[name]) {
            setFieldErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        const validationMessage = validateField(name, value);
        setFieldErrors((prev) => ({ ...prev, [name]: validationMessage }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0] || null;

        if (file && file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            setFormError(`File size must be less than ${MAX_FILE_SIZE_MB}MB.`);
            return;
        }

        setFormError('');
        setForm((prev) => ({ ...prev, file }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!service) return;

        if (!isAuthenticated) {
            const message = 'Please login to submit a consulting request.';
            setFormError(message);
            addToast(message, 'warning');
            navigate('/login', { state: { from: `/consulting/${slug}` } });
            return;
        }

        const name = form.name.trim();
        const email = form.email.trim();
        const message = form.message.trim();

        const nextErrors = {
            name: validateField('name', name),
            email: validateField('email', email),
            message: validateField('message', message),
        };

        setFieldErrors(nextErrors);

        if (nextErrors.name || nextErrors.email || nextErrors.message) {
            const message = 'Please fix the highlighted fields and submit again.';
            setFormError(message);
            addToast(message, 'warning');
            return;
        }

        setSubmitting(true);
        setFormError('');
        setFormSuccess('');

        try {
            await consultingService.submitRequest({
                service_id: service.id,
                name,
                email,
                message,
                file: form.file,
            });

            consultingService.trackEvent({
                service_id: service.id,
                event_type: 'submit',
                metadata: {
                    slug,
                    source: 'consulting-request-form',
                },
            }).catch(() => {
                // Ignore analytics failures so successful submissions are not disrupted.
            });

            analyticsService.trackEvent({
                event_type: 'consulting_request',
                entity_type: 'consulting',
                entity_id: service.id,
                metadata: {
                    slug,
                    source: 'consulting-request-form',
                },
            }).catch(() => {
                // Ignore analytics failures so successful submissions are not disrupted.
            });

            setForm({
                name: '',
                email: '',
                message: '',
                file: null,
            });

            const fileInput = document.getElementById('consulting-request-file');
            if (fileInput) {
                fileInput.value = '';
            }

            const successMessage = "Your request has been submitted. We'll respond within 24 hours.";
            setFormSuccess(successMessage);
            addToast(successMessage, 'success');
        } catch (err) {
            const validationMessages = err.response?.data?.details
                ?.map((item) => item.message)
                .filter(Boolean);

            const messageText = validationMessages?.length
                ? validationMessages.join('. ')
                : (err.response?.data?.error || 'Failed to submit consultation request');

            setFormError(messageText);
            addToast(messageText, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <LoadingSpinner fullScreen={false} />;
    }

    if (error || !service) {
        return (
            <div className="container mt-4">
                <BackLink to="/consulting" label="Back to Consulting" />
                <div className="alert alert-danger">{error || 'Service not found'}</div>
            </div>
        );
    }

    return (
        <div className="container mt-4" style={{ position: 'relative' }}>
            <BackLink to="/consulting" label="Back to Consulting" />

            <section className="card consulting-detail-hero" style={{ marginBottom: '20px' }}>
                <div className="card-body">
                    <p className="consulting-kicker">Consulting Service</p>
                    <h1 className="consulting-hero-title" style={{ marginBottom: '12px' }}>{service.title}</h1>
                    <p className="consulting-hero-subtitle" style={{ marginBottom: '14px' }}>
                        {service.hero_subtitle || service.short_description}
                    </p>
                    <ul className="consulting-trust-list">
                        {heroBenefits.map((benefit) => (
                            <li key={benefit}>{benefit}</li>
                        ))}
                    </ul>
                </div>
            </section>

            <div className="consulting-detail-layout">
                <section className="card consulting-detail-content-card">
                    <div className="card-body">
                        {contentSections.map((section) => (
                            <section key={section.title} className="consulting-content-section">
                                <h2 className="consulting-section-title">{section.title}</h2>
                                <div
                                    className="consulting-rich-text"
                                    dangerouslySetInnerHTML={{ __html: section.html }}
                                />
                            </section>
                        ))}

                        {deliverables.length > 0 && (
                            <section className="consulting-content-section">
                                <h3 className="consulting-section-title">Deliverables</h3>
                                <ul className="consulting-deliverables-list">
                                    {deliverables.map((item) => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {service.target_audience && (
                            <section className="consulting-content-section">
                                <h3 className="consulting-section-title">Target Audience</h3>
                                <div
                                    className="consulting-rich-text"
                                    dangerouslySetInnerHTML={{ __html: normalizeHtml(service.target_audience) }}
                                />
                            </section>
                        )}

                    </div>
                </section>

                <aside id="consulting-request-form" className="card consulting-request-form-card">
                    <div className="card-body">
                        <h2 style={{ color: '#003594', marginTop: 0 }}>Request Consultation</h2>
                        <p style={{ color: '#555', marginBottom: '12px' }}>
                            Share your project details and we will respond with next steps.
                        </p>

                        <ul className="consulting-form-trust-list">
                            {FORM_TRUST_POINTS.map((point) => (
                                <li key={point}>{point}</li>
                            ))}
                        </ul>

                        {formError && <div className="alert alert-danger">{formError}</div>}
                        {formSuccess && <div className="alert alert-success">{formSuccess}</div>}

                        {!isAuthenticated && (
                            <div className="alert alert-info" style={{ marginBottom: '12px' }}>
                                Please <Link to="/login" state={{ from: `/consulting/${slug}` }}>login</Link> to submit a consulting request.
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="consulting-name">Name *</label>
                                <input
                                    id="consulting-name"
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    required
                                    maxLength={120}
                                    disabled={!isAuthenticated}
                                    aria-invalid={Boolean(fieldErrors.name)}
                                />
                                <small className="consulting-field-helper">Enter your full name for project coordination.</small>
                                {fieldErrors.name && <small className="consulting-field-error">{fieldErrors.name}</small>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="consulting-email">Email *</label>
                                <input
                                    id="consulting-email"
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    required
                                    disabled={!isAuthenticated}
                                    aria-invalid={Boolean(fieldErrors.email)}
                                />
                                <small className="consulting-field-helper">We will use this for updates and next steps.</small>
                                {fieldErrors.email && <small className="consulting-field-error">{fieldErrors.email}</small>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="consulting-message">Message *</label>
                                <textarea
                                    id="consulting-message"
                                    name="message"
                                    value={form.message}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    rows={5}
                                    required
                                    maxLength={5000}
                                    placeholder="Describe your study, timeline, and consulting needs"
                                    disabled={!isAuthenticated}
                                    aria-invalid={Boolean(fieldErrors.message)}
                                />
                                <small className="consulting-field-helper">Include scope, expected timeline, and key challenges.</small>
                                {fieldErrors.message && <small className="consulting-field-error">{fieldErrors.message}</small>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="consulting-request-file">Upload Dataset/Document (Optional)</label>
                                <input
                                    id="consulting-request-file"
                                    type="file"
                                    name="file"
                                    onChange={handleFileChange}
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                                    disabled={!isAuthenticated}
                                />
                                <small style={{ display: 'block', color: '#666', marginTop: '6px' }}>
                                    Accepted: PDF, DOC, DOCX, XLS, XLSX, CSV, TXT. Max {MAX_FILE_SIZE_MB}MB.
                                </small>
                            </div>

                            <div className="consulting-submit-wrap">
                                <button type="submit" className="btn btn-primary consulting-submit-btn" disabled={submitting || !isAuthenticated}>
                                    {submitting ? 'Submitting...' : (isAuthenticated ? 'Submit Request' : 'Login to Submit Request')}
                                </button>
                            </div>
                        </form>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default ConsultingDetailPage;
