import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import consultingService from '../services/consultingService';
import analyticsService from '../services/analyticsService';
import LoadingSpinner from '../components/LoadingSpinner';
import BackLink from '../components/BackLink';
import { useAuth } from '../context/AuthContext';

const TRUST_POINTS = [
    'Expert-driven consulting',
    'Fast turnaround',
    'Confidential and secure',
];

const getTextFromHtml = (html) => {
    if (!html) return '';

    const container = document.createElement('div');
    container.innerHTML = html;
    return (container.textContent || '').replace(/\s+/g, ' ').trim();
};

const getServiceHighlights = (service) => {
    const points = [];

    if (service?.deliverables) {
        const container = document.createElement('div');
        container.innerHTML = service.deliverables;
        const items = Array.from(container.querySelectorAll('li'))
            .map((item) => item.textContent?.trim())
            .filter(Boolean);
        points.push(...items);
    }

    if (!points.length) {
        const summary = getTextFromHtml(service?.short_description || '');
        const fallback = summary
            .split(/[.;]/)
            .map((part) => part.trim())
            .filter((part) => part.length > 10);
        points.push(...fallback);
    }

    return points.slice(0, 3);
};

const ConsultingPage = () => {
    const { isAuthenticated } = useAuth();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchServices = useCallback(async () => {
        try {
            setLoading(true);
            const response = await consultingService.getServices();
            setServices(response.data.services || []);
            setError('');
        } catch (err) {
            setError('Failed to load consulting services');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    useEffect(() => {
        analyticsService.trackEvent({
            event_type: 'consulting_view',
            entity_type: 'consulting',
            entity_id: null,
            metadata: {
                source: 'consulting-list-page',
            },
        }).catch(() => {
            // Ignore analytics failures.
        });
    }, []);

    if (loading) {
        return <LoadingSpinner fullScreen={false} />;
    }

    const backTo = isAuthenticated ? '/dashboard' : '/';

    return (
        <div className="container mt-4">
            <BackLink to={backTo} label="Back" />

            <section className="card consulting-list-hero" style={{ marginBottom: '24px' }}>
                <div className="card-body">
                    <p className="consulting-kicker">Consulting Services</p>
                    <h1 className="consulting-hero-title">Build better decisions with expert statistical guidance</h1>
                    <p className="consulting-hero-subtitle">
                        Explore our structured offerings for research design, analysis, reporting, and evidence-backed execution.
                    </p>

                    <ul className="consulting-trust-list" aria-label="Consulting trust points">
                        {TRUST_POINTS.map((point) => (
                            <li key={point}>{point}</li>
                        ))}
                    </ul>
                </div>
            </section>

            {error && <div className="alert alert-danger">{error}</div>}

            {services.length === 0 ? (
                <div className="card">
                    <div className="card-body">
                        <p style={{ margin: 0, color: '#666' }}>No consulting services available right now.</p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="consulting-service-grid">
                    {services.map((service) => (
                        <article key={service.id} className="card consulting-service-card">
                            <div className="consulting-service-accent" aria-hidden="true" />
                            <div className="card-body consulting-service-card-body">
                                <h2 className="consulting-service-title">{service.title}</h2>
                                <p className="consulting-service-description">{service.short_description}</p>

                                {getServiceHighlights(service).length > 0 && (
                                    <ul className="consulting-service-highlights">
                                        {getServiceHighlights(service).map((highlight) => (
                                            <li key={`${service.id}-${highlight}`}>{highlight}</li>
                                        ))}
                                    </ul>
                                )}

                                <Link to={`/consulting/${service.slug}`} className="btn btn-primary consulting-card-cta">
                                    Learn More
                                </Link>
                            </div>
                        </article>
                    ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default ConsultingPage;
