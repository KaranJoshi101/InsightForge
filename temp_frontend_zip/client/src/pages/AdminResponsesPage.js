import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import surveyService from '../services/surveyService';
import responseService from '../services/responseService';
import LoadingSpinner from '../components/LoadingSpinner';
import BackLink from '../components/BackLink';
import Button from '../components/ui/Button';
import Card, { CardBody, CardHeader } from '../components/ui/Card';
import Input from '../components/ui/Input';

const AdminResponsesPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedSurvey, setSelectedSurvey] = useState(null);
    const [responses, setResponses] = useState([]);
    const [loadingResponses, setLoadingResponses] = useState(false);
    const [analytics, setAnalytics] = useState(null);

    // Search and filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredResponses, setFilteredResponses] = useState([]);
    const [exporting, setExporting] = useState(false);

    const fetchSurveys = useCallback(async () => {
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
    }, []);

    useEffect(() => {
        fetchSurveys();
    }, [fetchSurveys]);

    // Fetch responses when survey is selected
    const handleSelectSurvey = useCallback(async (survey, syncUrl = true) => {
        setSelectedSurvey(survey);
        setSearchQuery('');
        setLoadingResponses(true);
        setError('');

        if (syncUrl) {
            setSearchParams({ surveyId: String(survey.id) });
        }

        try {
            // Fetch responses
            const responsesData = await responseService.getSurveyResponses(survey.id, 1, 100);
            setResponses(responsesData.data.responses || []);
            setFilteredResponses(responsesData.data.responses || []);

            // Fetch analytics
            try {
                const analyticsData = await responseService.getSurveyAnalytics(survey.id);
                setAnalytics(analyticsData.data);
            } catch (_err) {
                // Analytics endpoint is optional; continue showing responses table.
            }
        } catch (err) {
            setError('Failed to load responses');
            console.error(err);
        } finally {
            setLoadingResponses(false);
        }
    }, [setSearchParams]);

    useEffect(() => {
        const surveyIdParam = parseInt(searchParams.get('surveyId') || '', 10);

        if (!surveyIdParam || surveys.length === 0) {
            return;
        }

        if (selectedSurvey?.id === surveyIdParam) {
            return;
        }

        const matchedSurvey = surveys.find((survey) => survey.id === surveyIdParam);
        if (matchedSurvey) {
            handleSelectSurvey(matchedSurvey, false);
        }
    }, [searchParams, surveys, selectedSurvey, handleSelectSurvey]);

    // Handle search and filter
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredResponses(responses);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = responses.filter((response) => {
            const userName = response.user_name?.toLowerCase() || '';
            const userEmail = response.user_email?.toLowerCase() || '';
            const userId = response.user_id?.toString() || '';

            return (
                userName.includes(query) ||
                userEmail.includes(query) ||
                userId.includes(query)
            );
        });

        setFilteredResponses(filtered);
    }, [searchQuery, responses]);

    const handleExportExcel = async () => {
        if (!selectedSurvey) return;
        setExporting(true);
        try {
            const response = await responseService.exportSurveyResponses(selectedSurvey.id);
            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${selectedSurvey.title.replace(/[^a-zA-Z0-9 ]/g, '')}-responses.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError('Failed to export responses');
            console.error(err);
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return <LoadingSpinner fullScreen={false} />;
    }

    return (
        <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
            <BackLink to="/admin/surveys" label="Back to Manage Surveys and Feedbacks" />
            <Card>
                <CardHeader>
                    <h1 className="text-2xl font-semibold text-slate-900">Survey Responses and Analytics</h1>
                    <p className="mt-1 text-sm text-slate-500">Review submissions and open detailed analytics reports.</p>
                </CardHeader>
            </Card>

            {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
                <div className="lg:col-span-4 xl:col-span-3">
                    <Card>
                        <CardHeader>
                            <h2 className="text-base font-semibold text-slate-900">Surveys</h2>
                        </CardHeader>
                        <CardBody>
                            {surveys.length === 0 ? (
                                <p className="text-sm text-slate-600">No surveys available</p>
                            ) : (
                                <div className="space-y-2">
                                    {surveys.map((survey) => (
                                        <div
                                            key={survey.id}
                                            onClick={() => handleSelectSurvey(survey)}
                                            className={[
                                                'cursor-pointer rounded-lg border px-3 py-3 transition-all duration-200',
                                                selectedSurvey?.id === survey.id
                                                    ? 'border-slate-800 bg-slate-900 text-white'
                                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                                            ].join(' ')}
                                        >
                                            <strong>{survey.title}</strong>
                                            <p className="mt-1 text-xs opacity-80">
                                                Status: {survey.status}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>

                <div className="lg:col-span-8 xl:col-span-9">
                    {!selectedSurvey ? (
                        <Card>
                            <CardBody className="py-10 text-center">
                                <p className="text-sm text-slate-600">
                                    Select a survey to view responses and analytics
                                </p>
                            </CardBody>
                        </Card>
                    ) : loadingResponses ? (
                        <LoadingSpinner fullScreen={false} />
                    ) : (
                        <>
                            {analytics && (
                                <Card className="mb-5">
                                    <CardBody>
                                        <h3 className="text-base font-semibold text-slate-900">Analytics for "{selectedSurvey.title}"</h3>
                                        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                                <p className="text-xs font-medium text-slate-500">Total Responses</p>
                                                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                                                    {analytics.total_responses || responses.length}
                                                </h2>
                                            </div>

                                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                                <p className="text-xs font-medium text-slate-500">Unique Users</p>
                                                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                                                    {analytics.unique_users || new Set(responses.map(r => r.user_id)).size}
                                                </h2>
                                            </div>

                                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                                <p className="text-xs font-medium text-slate-500">Questions</p>
                                                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                                                    {analytics.analytics ? analytics.analytics.length : 0}
                                                </h2>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex justify-end gap-2">
                                            <Button
                                                onClick={handleExportExcel}
                                                disabled={exporting}
                                                variant="outline"
                                            >
                                                {exporting ? 'Exporting...' : 'Download Excel'}
                                            </Button>
                                            <Link
                                                to={`/admin/surveys/${selectedSurvey.id}/analytics`}
                                                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-4 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-slate-800 hover:shadow-md"
                                            >
                                                View Full Analytics
                                            </Link>
                                        </div>
                                    </CardBody>
                                </Card>
                            )}

                            <Card className="mb-5">
                                <CardBody>
                                    <Input
                                        type="text"
                                        placeholder="Search by name, email, or user ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <p className="mt-2 text-xs text-slate-500">
                                        Showing {filteredResponses.length} of {responses.length} responses
                                    </p>
                                </CardBody>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <h3 className="text-base font-semibold text-slate-900">Responses ({filteredResponses.length})</h3>
                                </CardHeader>
                                <CardBody>
                                    {filteredResponses.length === 0 ? (
                                        <p className="py-6 text-center text-sm text-slate-600">
                                            No responses found
                                        </p>
                                    ) : (
                                        <div className="max-h-[500px] space-y-3 overflow-y-auto">
                                            {filteredResponses.map((response, index) => (
                                                <div
                                                    key={response.id}
                                                    className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                                                >
                                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="mb-1 text-sm font-semibold text-slate-800">
                                                                {index + 1}. {response.user_name || 'Anonymous User'}
                                                            </p>
                                                            <p className="text-xs text-slate-500">
                                                                Email: {response.user_email || 'N/A'}
                                                            </p>
                                                            <p className="mt-1 text-xs text-slate-500">
                                                                Submitted: {new Date(response.submitted_at).toLocaleString()}
                                                            </p>
                                                        </div>
                                                        <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                                                            Completed
                                                        </span>
                                                    </div>

                                                    {response.answers && response.answers.length > 0 && (
                                                        <div className="mt-3 border-t border-slate-200 pt-3">
                                                            <p className="mb-2 text-xs text-slate-500">
                                                                <strong>Answers:</strong> {response.answers.length} questions answered
                                                            </p>
                                                            <div className="space-y-1 text-xs text-slate-500">
                                                                {response.answers.slice(0, 2).map((answer, idx) => (
                                                                    <p key={idx}>
                                                                        - {answer.question_text?.substring(0, 50)}...
                                                                    </p>
                                                                ))}
                                                                {response.answers.length > 2 && (
                                                                    <p className="italic">
                                                                        + {response.answers.length - 2} more answers
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminResponsesPage;
