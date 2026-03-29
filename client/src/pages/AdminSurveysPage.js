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
    const [searchTerm, setSearchTerm] = useState('');

    const publishedCount = surveys.filter((s) => s.status === 'published').length;
    const draftCount = surveys.filter((s) => s.status === 'draft').length;
    const filteredSurveys = surveys.filter((s) =>
        String(s.title || '').toLowerCase().includes(searchTerm.trim().toLowerCase())
    );

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
                    <h1 style={{ marginBottom: '6px' }}>Manage Surveys</h1>
                    <p style={{ margin: 0 }}>Centralized control for survey lifecycle and reporting.</p>
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

            <div style={{ marginBottom: '14px' }}>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search surveys by name"
                    aria-label="Search surveys by name"
                    className="market-search-input"
                />
            </div>

            {filteredSurveys.length === 0 ? (
                <div className="card admin-empty-card">
                    <p className="admin-empty-text">
                        {surveys.length === 0 ? 'No surveys created yet' : 'No surveys match your search'}
                    </p>
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
                            {filteredSurveys.map((survey) => (
                                <tr key={survey.id}>
                                    <td className="admin-cell">
                                        <strong>{survey.title}</strong>
                                    </td>
                                    <td className="admin-cell">
                                        <span className={`badge ${survey.status === 'published' ? 'badge-published' : 'badge-draft'}`}>
                                            {survey.status}
                                        </span>
                                    </td>
                                    <td className="admin-cell" style={{ textAlign: 'center' }}>
                                        {Number.isInteger(Number(survey.question_count)) ? Number(survey.question_count) : 0}
                                    </td>
                                    <td className="admin-cell-muted">
                                        {new Date(survey.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="admin-cell">
                                        <div className="admin-actions-wrap">
                                            <Link
                                                to={`/admin/surveys/${survey.id}/edit`}
                                                className="btn btn-primary btn-compact"
                                            >
                                                Edit
                                            </Link>
                                            <Link
                                                to={`/admin/surveys/${survey.id}/analytics`}
                                                className="btn btn-info btn-compact"
                                            >
                                                Analytics
                                            </Link>
                                            <button
                                                onClick={() => handleExportExcel(survey)}
                                                className="btn btn-secondary btn-compact"
                                                disabled={exporting === survey.id}
                                            >
                                                {exporting === survey.id ? 'Exporting...' : 'Export'}
                                            </button>
                                            {survey.status === 'draft' ? (
                                                <button
                                                    onClick={() => handlePublish(survey.id)}
                                                    className="btn btn-success btn-compact"
                                                    disabled={publishing === survey.id}
                                                >
                                                    {publishing === survey.id ? 'Publishing...' : 'Publish'}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleUnpublish(survey.id)}
                                                    className="btn btn-warning btn-compact"
                                                    disabled={publishing === survey.id}
                                                >
                                                    {publishing === survey.id ? 'Unpublishing...' : 'Unpublish'}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(survey.id)}
                                                className="btn btn-danger btn-compact"
                                                disabled={deleting === survey.id}
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
