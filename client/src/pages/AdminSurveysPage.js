import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import surveyService from '../services/surveyService';
import responseService from '../services/responseService';
import LoadingSpinner from '../components/LoadingSpinner';
import BackLink from '../components/BackLink';

const AdminSurveysPage = () => {
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleting, setDeleting] = useState(null);
    const [publishing, setPublishing] = useState(null);
    const [exporting, setExporting] = useState(null);

    const publishedCount = surveys.filter((s) => s.status === 'published').length;
    const draftCount = surveys.filter((s) => s.status === 'draft').length;

    useEffect(() => {
        fetchSurveys();
    }, []);

    const fetchSurveys = async () => {
        try {
            setLoading(true);
            const response = await surveyService.getAllSurveys(1, 100);
            setSurveys(response.data.surveys);
            setError('');
        } catch (err) {
            setError('Failed to load surveys');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (surveyId) => {
        if (!window.confirm('Are you sure you want to delete this survey?')) return;

        try {
            setDeleting(surveyId);
            await surveyService.deleteSurvey(surveyId);
            setSurveys(surveys.filter((s) => s.id !== surveyId));
            setError('');
        } catch (err) {
            setError('Failed to delete survey');
            console.error(err);
        } finally {
            setDeleting(null);
        }
    };

    const handlePublish = async (surveyId) => {
        try {
            setPublishing(surveyId);
            await surveyService.publishSurvey(surveyId);
            setSurveys(
                surveys.map((s) =>
                    s.id === surveyId ? { ...s, status: 'published' } : s
                )
            );
            setError('');
        } catch (err) {
            setError('Failed to publish survey');
            console.error(err);
        } finally {
            setPublishing(null);
        }
    };

    const handleUnpublish = async (surveyId) => {
        try {
            setPublishing(surveyId);
            await surveyService.unpublishSurvey(surveyId);
            setSurveys(
                surveys.map((s) =>
                    s.id === surveyId ? { ...s, status: 'draft' } : s
                )
            );
            setError('');
        } catch (err) {
            setError('Failed to unpublish survey');
            console.error(err);
        } finally {
            setPublishing(null);
        }
    };

    const handleExportExcel = async (survey) => {
        setExporting(survey.id);
        try {
            const response = await responseService.exportSurveyResponses(survey.id);
            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${survey.title.replace(/[^a-zA-Z0-9 ]/g, '')}-responses.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError('Failed to export responses');
            console.error(err);
        } finally {
            setExporting(null);
        }
    };

    if (loading) {
        return <LoadingSpinner fullScreen={false} />;
    }

    return (
        <div className="container mt-4">
            <BackLink to="/admin" label="Back to Admin" />
            <div className="admin-page-header">
                <div>
                    <h1 style={{ color: '#003594', marginBottom: '6px' }}>Manage Surveys</h1>
                    <p style={{ margin: 0, color: '#666' }}>Centralized control for survey lifecycle and reporting.</p>
                </div>
                <div className="admin-page-actions">
                    <Link to="/admin/surveys/create" className="btn btn-success">
                        + Create Survey
                    </Link>
                </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <div className="admin-chip-row">
                <span className="admin-chip total">
                    Total: {surveys.length}
                </span>
                <span className="admin-chip published">
                    Published: {publishedCount}
                </span>
                <span className="admin-chip draft">
                    Draft: {draftCount}
                </span>
            </div>

            {surveys.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                    <p style={{ color: '#666' }}>No surveys created yet</p>
                </div>
            ) : (
                <div className="card admin-table-card">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Status</th>
                                <th>Questions</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {surveys.map((survey) => (
                                <tr key={survey.id}>
                                    <td style={{ padding: '12px' }}>
                                        <strong>{survey.title}</strong>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <span
                                            style={{
                                                backgroundColor: survey.status === 'published' ? '#e8f8f0' : '#fff8e1',
                                                color: survey.status === 'published' ? '#1a6e42' : '#8a6d00',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.85rem',
                                                textTransform: 'capitalize',
                                            }}
                                        >
                                            {survey.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>N/A</td>
                                    <td style={{ padding: '12px', fontSize: '0.9rem' }}>
                                        {new Date(survey.created_at).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <div className="admin-actions-wrap">
                                            <Link
                                                to={`/admin/surveys/${survey.id}/edit`}
                                                className="btn btn-primary"
                                                style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                                            >
                                                Edit
                                            </Link>
                                            <Link
                                                to={`/admin/surveys/${survey.id}/analytics`}
                                                className="btn btn-primary"
                                                style={{ padding: '4px 8px', fontSize: '0.85rem', backgroundColor: '#2980b9', borderColor: '#2980b9' }}
                                            >
                                                Analytics
                                            </Link>
                                            <button
                                                onClick={() => handleExportExcel(survey)}
                                                className="btn btn-secondary"
                                                disabled={exporting === survey.id}
                                                style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                                            >
                                                {exporting === survey.id ? 'Exporting...' : 'Export'}
                                            </button>
                                            {survey.status === 'draft' ? (
                                                <button
                                                    onClick={() => handlePublish(survey.id)}
                                                    className="btn btn-success"
                                                    disabled={publishing === survey.id}
                                                    style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                                                >
                                                    {publishing === survey.id ? 'Publishing...' : 'Publish'}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleUnpublish(survey.id)}
                                                    className="btn btn-warning"
                                                    disabled={publishing === survey.id}
                                                    style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                                                >
                                                    {publishing === survey.id ? 'Unpublishing...' : 'Unpublish'}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(survey.id)}
                                                className="btn btn-danger"
                                                disabled={deleting === survey.id}
                                                style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                                            >
                                                {deleting === survey.id ? 'Deleting...' : 'Delete'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminSurveysPage;
