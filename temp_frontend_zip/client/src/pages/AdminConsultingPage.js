import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import consultingService from '../services/consultingService';
import LoadingSpinner from '../components/LoadingSpinner';
import BackLink from '../components/BackLink';
import { useToast } from '../context/ToastContext';

const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list',
    'blockquote',
    'link',
];

const quillModules = {
    toolbar: [
        [{ header: [2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['blockquote', 'link'],
        ['clean'],
    ],
};

const REQUEST_STATUS_OPTIONS = [
    { value: 'new', label: 'New', bg: '#e8f0fe', color: '#003594' },
    { value: 'in_progress', label: 'In Progress', bg: '#fff8e1', color: '#8a6d00' },
    { value: 'waiting_user', label: 'Waiting User', bg: '#fde8e8', color: '#922b21' },
    { value: 'resolved', label: 'Resolved', bg: '#e8f8f0', color: '#1a6e42' },
    { value: 'closed', label: 'Closed', bg: '#f1f3f5', color: '#495057' },
];

const REQUEST_PRIORITY_OPTIONS = [
    { value: 'low', label: 'Low', bg: '#e8f8f0', color: '#1a6e42' },
    { value: 'medium', label: 'Medium', bg: '#e8f0fe', color: '#003594' },
    { value: 'high', label: 'High', bg: '#fff3cd', color: '#8a6d00' },
    { value: 'urgent', label: 'Urgent', bg: '#fde8e8', color: '#922b21' },
];

const EMAIL_TEMPLATES = {
    request_more_information: {
        label: 'Request More Information',
        subject: (request) => `Regarding Your ${request?.service_title || 'Consulting'} Consultation Request`,
        body: (request) => {
            const name = request?.name || 'there';
            const serviceName = request?.service_title || 'the consulting service';

            return [
                `Hi ${name},`,
                '',
                `Thank you for your request regarding ${serviceName}.`,
                '',
                'We have reviewed your submission and would like a few additional details to confirm scope:',
                '- Expected timeline and key milestone dates',
                '- Preferred deliverables and reporting format',
                '- Any constraints or assumptions we should account for',
                '',
                'Once we receive this information, we will share next steps and an estimated timeline.',
                '',
                'Best regards,',
                'Consulting Team',
            ].join('\n');
        },
    },
    confirm_scope: {
        label: 'Confirm Scope',
        subject: (request) => `Scope Confirmation for ${request?.service_title || 'Your Consultation'} Request`,
        body: (request) => {
            const name = request?.name || 'there';
            const serviceName = request?.service_title || 'the consulting service';

            return [
                `Hi ${name},`,
                '',
                `Thank you for your ${serviceName} request. We are ready to proceed and would like to confirm scope before kickoff.`,
                '',
                'Please confirm:',
                '- Primary objectives and decision criteria',
                '- Stakeholders who should be included in review cycles',
                '- Preferred target date for first draft outputs',
                '',
                'After confirmation, we will provide a proposed plan and timeline.',
                '',
                'Best regards,',
                'Consulting Team',
            ].join('\n');
        },
    },
    schedule_discussion: {
        label: 'Schedule Discussion',
        subject: (request) => `Scheduling Discussion for ${request?.service_title || 'Consultation Request'}`,
        body: (request) => {
            const name = request?.name || 'there';
            const serviceName = request?.service_title || 'the consulting service';

            return [
                `Hi ${name},`,
                '',
                `Thank you for your interest in ${serviceName}.`,
                '',
                'We would like to schedule a short discussion to align on objectives, timeline, and expected outputs.',
                'Please share your availability for a 30-minute call this week, along with your preferred timezone.',
                '',
                'Once confirmed, we will send an agenda and meeting details.',
                '',
                'Best regards,',
                'Consulting Team',
            ].join('\n');
        },
    },
};

const slugify = (value) => value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const defaultForm = {
    title: '',
    slug: '',
    short_description: '',
    hero_subtitle: '',
    hero_benefits_text: '',
    content: '',
    deliverables: '',
    target_audience: '',
    is_active: true,
};

const getBadgeStyle = (value, options) => {
    const item = options.find((opt) => opt.value === value);
    if (!item) {
        return {
            label: value || 'N/A',
            style: {
                backgroundColor: '#f1f3f5',
                color: '#495057',
            },
        };
    }

    return {
        label: item.label,
        style: {
            backgroundColor: item.bg,
            color: item.color,
        },
    };
};

const AdminConsultingPage = () => {
    const [services, setServices] = useState([]);
    const [requests, setRequests] = useState([]);
    const [requestsPage, setRequestsPage] = useState(1);
    const [requestsPagination, setRequestsPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [requestsLoading, setRequestsLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(defaultForm);
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const [requestModalOpen, setRequestModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [requestModalLoading, setRequestModalLoading] = useState(false);
    const [requestModalSaving, setRequestModalSaving] = useState(false);
    const [requestWorkflowForm, setRequestWorkflowForm] = useState({
        status: 'new',
        priority: 'medium',
        notes: '',
    });
    const { addToast } = useToast();
    const [templateKey, setTemplateKey] = useState('request_more_information');
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');

    const editingService = useMemo(
        () => services.find((service) => service.id === editingId) || null,
        [services, editingId]
    );

    const fetchServices = useCallback(async () => {
        try {
            setLoading(true);
            const response = await consultingService.getAdminServices();
            setServices(response.data.services || []);
            setError('');
        } catch (_err) {
            const message = 'Failed to load consulting services';
            setError(message);
            addToast(message, 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    const fetchRequests = useCallback(async (page = 1) => {
        try {
            setRequestsLoading(true);
            const response = await consultingService.getRequests(page, 20);
            setRequests(response.data.requests || []);
            setRequestsPagination(response.data.pagination || null);
        } catch (_err) {
            const message = 'Failed to load consulting requests';
            setError(message);
            addToast(message, 'error');
        } finally {
            setRequestsLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    useEffect(() => {
        fetchRequests(requestsPage);
    }, [fetchRequests, requestsPage]);

    const openCreate = () => {
        setEditingId(null);
        setForm(defaultForm);
        setShowForm(true);
    };

    const openEdit = (service) => {
        setEditingId(service.id);
        setForm({
            title: service.title || '',
            slug: service.slug || '',
            short_description: service.short_description || '',
            hero_subtitle: service.hero_subtitle || '',
            hero_benefits_text: Array.isArray(service.hero_benefits) ? service.hero_benefits.join('\n') : '',
            content: service.content || '',
            deliverables: service.deliverables || '',
            target_audience: service.target_audience || '',
            is_active: Boolean(service.is_active),
        });
        setShowForm(true);
    };

    const closeForm = () => {
        setEditingId(null);
        setForm(defaultForm);
        setShowForm(false);
    };

    const handleFormChange = (event) => {
        const { name, value, type, checked } = event.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
            ...(name === 'title' && !editingId && !prev.slug ? { slug: slugify(value) } : {}),
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const payload = {
            title: form.title.trim(),
            slug: slugify(form.slug || form.title),
            short_description: form.short_description.trim(),
            hero_subtitle: form.hero_subtitle.trim() || null,
            hero_benefits: form.hero_benefits_text
                .split('\n')
                .map((item) => item.trim())
                .filter(Boolean),
            content: form.content,
            deliverables: form.deliverables || null,
            target_audience: form.target_audience || null,
            is_active: Boolean(form.is_active),
        };

        if (payload.hero_benefits.length === 0) {
            payload.hero_benefits = null;
        }

        if (!payload.title || !payload.slug || !payload.short_description || !payload.content) {
            setError('Title, slug, short description, and content are required');
            return;
        }

        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            if (editingId) {
                await consultingService.updateService(editingId, payload);
                const successMessage = 'Consulting service updated successfully';
                setSuccess(successMessage);
                addToast(successMessage, 'success');
            } else {
                await consultingService.createService(payload);
                const successMessage = 'Consulting service created successfully';
                setSuccess(successMessage);
                addToast(successMessage, 'success');
            }

            closeForm();
            fetchServices();
            setTimeout(() => setSuccess(''), 2200);
        } catch (err) {
            const validationMessages = err.response?.data?.details
                ?.map((item) => item.message)
                .filter(Boolean);

            const messageText = validationMessages?.length
                ? validationMessages.join('. ')
                : (err.response?.data?.error || 'Failed to save consulting service');

            setError(messageText);
            addToast(messageText, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this consulting service? This will also remove related requests.')) {
            return;
        }

        try {
            setDeletingId(id);
            await consultingService.deleteService(id);
            setServices((prev) => prev.filter((item) => item.id !== id));
            const successMessage = 'Consulting service deleted successfully';
            setSuccess(successMessage);
            addToast(successMessage, 'success');
            setTimeout(() => setSuccess(''), 2200);
        } catch (err) {
            const message = err.response?.data?.error || 'Failed to delete consulting service';
            setError(message);
            addToast(message, 'error');
        } finally {
            setDeletingId(null);
        }
    };

    const renderServiceStatusBadge = (isActive) => (
        <span
            style={{
                display: 'inline-block',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '0.8rem',
                fontWeight: 700,
                backgroundColor: isActive ? '#e8f8f0' : '#fff3f3',
                color: isActive ? '#1a6e42' : '#a33',
            }}
        >
            {isActive ? 'Active' : 'Inactive'}
        </span>
    );

    const applyTemplate = useCallback((nextTemplateKey, request) => {
        const template = EMAIL_TEMPLATES[nextTemplateKey];
        if (!template) return;

        setTemplateKey(nextTemplateKey);
        setEmailSubject(template.subject(request));
        setEmailBody(template.body(request));
    }, []);

    const openRequestDetail = async (requestId) => {
        setRequestModalOpen(true);
        setRequestModalLoading(true);
        setError('');

        try {
            const response = await consultingService.getRequestById(requestId);
            const detail = response.data.request;
            setSelectedRequest(detail);
            setRequestWorkflowForm({
                status: detail.status || 'new',
                priority: detail.priority || 'medium',
                notes: detail.notes || '',
            });
            applyTemplate('request_more_information', detail);
        } catch (_err) {
            const message = 'Failed to load request details';
            setError(message);
            addToast(message, 'error');
            setRequestModalOpen(false);
        } finally {
            setRequestModalLoading(false);
        }
    };

    const closeRequestModal = () => {
        setRequestModalOpen(false);
        setSelectedRequest(null);
    };

    const handleRequestWorkflowSave = async () => {
        if (!selectedRequest) return;

        setRequestModalSaving(true);
        setError('');

        try {
            const payload = {
                status: requestWorkflowForm.status,
                priority: requestWorkflowForm.priority,
                notes: requestWorkflowForm.notes || null,
            };

            const response = await consultingService.updateRequest(selectedRequest.id, payload);
            const updated = response.data.request;

            setSelectedRequest((prev) => ({
                ...prev,
                ...updated,
            }));

            setRequests((prev) => prev.map((req) => (
                req.id === selectedRequest.id
                    ? {
                        ...req,
                        status: payload.status,
                        priority: payload.priority,
                        notes: payload.notes,
                    }
                    : req
            )));

            const successMessage = 'Consultation request updated successfully';
            setSuccess(successMessage);
            addToast(successMessage, 'success');
            setTimeout(() => setSuccess(''), 2200);
        } catch (err) {
            const validationMessages = err.response?.data?.details
                ?.map((item) => item.message)
                .filter(Boolean);

            const messageText = validationMessages?.length
                ? validationMessages.join('. ')
                : (err.response?.data?.error || 'Failed to update request');

            setError(messageText);
            addToast(messageText, 'error');
        } finally {
            setRequestModalSaving(false);
        }
    };

    const handleReplyViaEmail = () => {
        if (!selectedRequest?.email) return;

        const subject = encodeURIComponent(emailSubject || 'Consultation Request Update');
        const body = encodeURIComponent(emailBody || '');
        window.location.href = `mailto:${selectedRequest.email}?subject=${subject}&body=${body}`;
    };

    const handleCopyEmailBody = async () => {
        try {
            await navigator.clipboard.writeText(emailBody || '');
            const successMessage = 'Email body copied to clipboard';
            setSuccess(successMessage);
            addToast(successMessage, 'success');
            setTimeout(() => setSuccess(''), 2200);
        } catch (_err) {
            const message = 'Failed to copy email body';
            setError(message);
            addToast(message, 'error');
        }
    };

    if (loading) {
        return <LoadingSpinner fullScreen={false} />;
    }

    return (
        <div className="container mt-4">
            <BackLink to="/admin" label="Back to Admin" />

            <h1 style={{ color: '#003594', marginBottom: '8px' }}>Manage Consulting Services</h1>
            <p style={{ color: '#555', marginBottom: '20px' }}>
                Manage service content and review incoming consultation requests.
            </p>

            <div style={{ marginBottom: '16px' }}>
                <Link to="/admin/consulting/analytics" className="btn btn-info">
                    View Consulting Analytics
                </Link>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {showForm ? (
                <div className="card mb-4">
                    <div className="card-body">
                        <h2 style={{ marginTop: 0 }}>{editingId ? 'Edit Service' : 'Create Service'}</h2>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="service-title">Title *</label>
                                <input
                                    id="service-title"
                                    name="title"
                                    type="text"
                                    value={form.title}
                                    onChange={handleFormChange}
                                    required
                                    maxLength={200}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="service-slug">Slug *</label>
                                <input
                                    id="service-slug"
                                    name="slug"
                                    type="text"
                                    value={form.slug}
                                    onChange={handleFormChange}
                                    required
                                    maxLength={220}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="service-short-description">Short Description *</label>
                                <textarea
                                    id="service-short-description"
                                    name="short_description"
                                    value={form.short_description}
                                    onChange={handleFormChange}
                                    required
                                    rows={3}
                                    maxLength={500}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="service-hero-subtitle">Hero Subtitle (Optional)</label>
                                <textarea
                                    id="service-hero-subtitle"
                                    name="hero_subtitle"
                                    value={form.hero_subtitle}
                                    onChange={handleFormChange}
                                    rows={3}
                                    maxLength={400}
                                    placeholder="Value-focused subtitle shown in the hero section"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="service-hero-benefits">Hero Benefits (Optional)</label>
                                <textarea
                                    id="service-hero-benefits"
                                    name="hero_benefits_text"
                                    value={form.hero_benefits_text}
                                    onChange={handleFormChange}
                                    rows={5}
                                    maxLength={1200}
                                    placeholder="One benefit per line"
                                />
                            </div>

                            <div className="form-group">
                                <label>Detailed Content *</label>
                                <ReactQuill
                                    theme="snow"
                                    value={form.content}
                                    onChange={(value) => setForm((prev) => ({ ...prev, content: value }))}
                                    modules={quillModules}
                                    formats={quillFormats}
                                />
                            </div>

                            <div className="form-group">
                                <label>Deliverables (Optional)</label>
                                <ReactQuill
                                    theme="snow"
                                    value={form.deliverables}
                                    onChange={(value) => setForm((prev) => ({ ...prev, deliverables: value }))}
                                    modules={quillModules}
                                    formats={quillFormats}
                                />
                            </div>

                            <div className="form-group">
                                <label>Target Audience (Optional)</label>
                                <ReactQuill
                                    theme="snow"
                                    value={form.target_audience}
                                    onChange={(value) => setForm((prev) => ({ ...prev, target_audience: value }))}
                                    modules={quillModules}
                                    formats={quillFormats}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#2B2B2B' }}>
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={form.is_active}
                                        onChange={handleFormChange}
                                    />
                                    Active
                                </label>
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="btn btn-success" type="submit" disabled={submitting}>
                                    {submitting ? 'Saving...' : (editingId ? 'Update Service' : 'Create Service')}
                                </button>
                                <button className="btn btn-secondary" type="button" onClick={closeForm}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : (
                <div style={{ marginBottom: '18px' }}>
                    <button type="button" className="btn btn-success" onClick={openCreate}>
                        + Create Service
                    </button>
                </div>
            )}

            <div className="card mb-4">
                <div className="card-body">
                    <h2 style={{ marginTop: 0, marginBottom: '14px' }}>Services ({services.length})</h2>

                    {services.length === 0 ? (
                        <p style={{ margin: 0, color: '#666' }}>No consulting services found.</p>
                    ) : (
                        <div style={{ display: 'grid', gap: '12px' }}>
                            {services.map((service) => (
                                <div key={service.id} className="card" style={{ margin: 0 }}>
                                    <div className="card-body">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                            <div style={{ flex: '1 1 240px', minWidth: 0 }}>
                                                <h3 style={{ marginTop: 0 }}>{service.title}</h3>
                                                <p style={{ color: '#555', margin: '0 0 8px 0' }}>{service.short_description}</p>
                                                <p style={{ color: '#888', margin: 0, fontSize: '0.9rem' }}>
                                                    Slug: /consulting/{service.slug}
                                                </p>
                                            </div>
                                            {renderServiceStatusBadge(service.is_active)}
                                        </div>

                                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                                            <button type="button" className="btn btn-primary" onClick={() => openEdit(service)}>Edit</button>
                                            <button
                                                type="button"
                                                className="btn btn-danger"
                                                onClick={() => handleDelete(service.id)}
                                                disabled={deletingId === service.id}
                                            >
                                                {deletingId === service.id ? 'Deleting...' : 'Delete'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="card">
                <div className="card-body">
                    <h2 style={{ marginTop: 0 }}>Consultation Requests</h2>

                    {requestsLoading ? (
                        <LoadingSpinner fullScreen={false} />
                    ) : requests.length === 0 ? (
                        <p style={{ margin: 0, color: '#666' }}>No consultation requests submitted yet.</p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="admin-table" style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th>Service</th>
                                        <th>Requester</th>
                                        <th>Status</th>
                                        <th>Priority</th>
                                        <th>Submitted</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.map((request) => {
                                        const statusBadge = getBadgeStyle(request.status || 'new', REQUEST_STATUS_OPTIONS);
                                        const priorityBadge = getBadgeStyle(request.priority || 'medium', REQUEST_PRIORITY_OPTIONS);

                                        return (
                                            <tr key={request.id}>
                                                <td>{request.service_title}</td>
                                                <td>
                                                    <div style={{ fontWeight: 600 }}>{request.name}</div>
                                                    <div style={{ color: '#666', fontSize: '0.85rem' }}>{request.email}</div>
                                                </td>
                                                <td>
                                                    <span style={{ ...statusBadge.style, padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 700 }}>
                                                        {statusBadge.label}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span style={{ ...priorityBadge.style, padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 700 }}>
                                                        {priorityBadge.label}
                                                    </span>
                                                </td>
                                                <td>{new Date(request.created_at).toLocaleString()}</td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="btn btn-primary btn-sm"
                                                        onClick={() => openRequestDetail(request.id)}
                                                    >
                                                        View / Update
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {requestsPagination && requestsPagination.pages > 1 && (
                        <div className="pagination" style={{ marginTop: '14px' }}>
                            <button
                                type="button"
                                onClick={() => setRequestsPage((prev) => Math.max(1, prev - 1))}
                                disabled={requestsPage === 1}
                            >
                                Previous
                            </button>
                            <span style={{ padding: '6px 12px' }}>
                                Page {requestsPagination.page} of {requestsPagination.pages}
                            </span>
                            <button
                                type="button"
                                onClick={() => setRequestsPage((prev) => Math.min(requestsPagination.pages, prev + 1))}
                                disabled={requestsPage === requestsPagination.pages}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {requestModalOpen && (
                <div
                    onClick={closeRequestModal}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.45)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 3000,
                        padding: '16px',
                    }}
                >
                    <div
                        onClick={(event) => event.stopPropagation()}
                        style={{
                            width: '100%',
                            maxWidth: '980px',
                            maxHeight: '92vh',
                            overflowY: 'auto',
                            backgroundColor: '#fff',
                            borderRadius: '10px',
                            boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
                            padding: '20px',
                        }}
                    >
                        {requestModalLoading || !selectedRequest ? (
                            <LoadingSpinner fullScreen={false} />
                        ) : (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                    <h2 style={{ margin: 0, color: '#003594' }}>Consultation Request Details</h2>
                                    <button type="button" className="btn btn-secondary" onClick={closeRequestModal}>Close</button>
                                </div>

                                <div className="responsive-two-col-grid" style={{ gap: '16px', marginBottom: '16px' }}>
                                    <div>
                                        <p style={{ margin: 0, color: '#666', fontSize: '0.85rem' }}>Name</p>
                                        <p style={{ margin: '4px 0 0 0', fontWeight: 600 }}>{selectedRequest.name}</p>
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, color: '#666', fontSize: '0.85rem' }}>Email</p>
                                        <p style={{ margin: '4px 0 0 0', fontWeight: 600 }}>{selectedRequest.email}</p>
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, color: '#666', fontSize: '0.85rem' }}>Service</p>
                                        <p style={{ margin: '4px 0 0 0', fontWeight: 600 }}>{selectedRequest.service_title}</p>
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, color: '#666', fontSize: '0.85rem' }}>Created</p>
                                        <p style={{ margin: '4px 0 0 0', fontWeight: 600 }}>
                                            {new Date(selectedRequest.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '12px' }}>
                                    <p style={{ margin: 0, color: '#666', fontSize: '0.85rem' }}>Message</p>
                                    <div style={{ marginTop: '6px', padding: '10px', border: '1px solid #E8E9EE', borderRadius: '6px', whiteSpace: 'pre-wrap' }}>
                                        {selectedRequest.message}
                                    </div>
                                </div>

                                <div style={{ marginBottom: '18px' }}>
                                    <p style={{ margin: 0, color: '#666', fontSize: '0.85rem' }}>Uploaded File</p>
                                    <div style={{ marginTop: '6px' }}>
                                        {selectedRequest.file_url ? (
                                            <a
                                                href={`${(process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')}${selectedRequest.file_url}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Download Attachment
                                            </a>
                                        ) : 'No file uploaded'}
                                    </div>
                                </div>

                                <div className="card" style={{ marginBottom: '16px' }}>
                                    <div className="card-body">
                                        <h3 style={{ marginTop: 0 }}>Internal Workflow</h3>
                                        <div className="responsive-two-col-grid" style={{ gap: '12px' }}>
                                            <div className="form-group">
                                                <label htmlFor="req-status">Status</label>
                                                <select
                                                    id="req-status"
                                                    value={requestWorkflowForm.status}
                                                    onChange={(event) => setRequestWorkflowForm((prev) => ({ ...prev, status: event.target.value }))}
                                                >
                                                    {REQUEST_STATUS_OPTIONS.map((option) => (
                                                        <option key={option.value} value={option.value}>{option.label}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="form-group">
                                                <label htmlFor="req-priority">Priority</label>
                                                <select
                                                    id="req-priority"
                                                    value={requestWorkflowForm.priority}
                                                    onChange={(event) => setRequestWorkflowForm((prev) => ({ ...prev, priority: event.target.value }))}
                                                >
                                                    {REQUEST_PRIORITY_OPTIONS.map((option) => (
                                                        <option key={option.value} value={option.value}>{option.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="req-notes">Notes</label>
                                            <textarea
                                                id="req-notes"
                                                value={requestWorkflowForm.notes}
                                                onChange={(event) => setRequestWorkflowForm((prev) => ({ ...prev, notes: event.target.value }))}
                                                rows={4}
                                                maxLength={5000}
                                                placeholder="Add internal notes for handling this request"
                                            />
                                        </div>

                                        <button
                                            type="button"
                                            className="btn btn-success"
                                            onClick={handleRequestWorkflowSave}
                                            disabled={requestModalSaving}
                                        >
                                            {requestModalSaving ? 'Saving...' : 'Save Update'}
                                        </button>
                                    </div>
                                </div>

                                <div className="card">
                                    <div className="card-body">
                                        <h3 style={{ marginTop: 0 }}>Reply via Email</h3>
                                        <p style={{ color: '#666', marginTop: 0 }}>
                                            Select a template, refine it, and send via your default mail client.
                                        </p>

                                        <div className="form-group">
                                            <label htmlFor="email-template">Template</label>
                                            <select
                                                id="email-template"
                                                value={templateKey}
                                                onChange={(event) => applyTemplate(event.target.value, selectedRequest)}
                                            >
                                                {Object.entries(EMAIL_TEMPLATES).map(([key, template]) => (
                                                    <option key={key} value={key}>{template.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="email-subject">Subject</label>
                                            <input
                                                id="email-subject"
                                                type="text"
                                                value={emailSubject}
                                                onChange={(event) => setEmailSubject(event.target.value)}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="email-body">Message</label>
                                            <textarea
                                                id="email-body"
                                                value={emailBody}
                                                onChange={(event) => setEmailBody(event.target.value)}
                                                rows={10}
                                            />
                                        </div>

                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            <button type="button" className="btn btn-primary" onClick={handleReplyViaEmail}>
                                                Reply via Email
                                            </button>
                                            <button type="button" className="btn btn-secondary" onClick={handleCopyEmailBody}>
                                                Copy Message
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {editingService && !showForm && (
                <div className="sr-only">Editing {editingService.title}</div>
            )}
        </div>
    );
};

export default AdminConsultingPage;
