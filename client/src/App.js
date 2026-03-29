import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import SurveysPage from './pages/SurveysPage';
import SurveyDetailPage from './pages/SurveyDetailPage';
import TakeSurveyPage from './pages/TakeSurveyPage';
import ResponsesPage from './pages/ResponsesPage';
import ResponseDetailPage from './pages/ResponseDetailPage';
import ArticlesPage from './pages/ArticlesPage';
import ArticleDetailPage from './pages/ArticleDetailPage';
import TrainingPage from './pages/TrainingPage';
import ConsultingPage from './pages/ConsultingPage';
import ConsultingDetailPage from './pages/ConsultingDetailPage';
import ProfilePage from './pages/ProfilePage';
import MediaPage from './pages/MediaPage';
import MediaDetailPage from './pages/MediaDetailPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminArticlesPage from './pages/AdminArticlesPage';
import AdminResponsesPage from './pages/AdminResponsesPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminSurveysPage from './pages/AdminSurveysPage';
import AdminTrainingPage from './pages/AdminTrainingPage';
import AdminMediaPage from './pages/AdminMediaPage';
import AdminConsultingPage from './pages/AdminConsultingPage';
import AdminConsultingAnalyticsPage from './pages/AdminConsultingAnalyticsPage';
// import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import CreateSurveyPage from './pages/CreateSurveyPage';
import SurveyAnalyticsPage from './pages/SurveyAnalyticsPage';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
// import analyticsService from './services/analyticsService';

const AppContent = () => {
    const { loading } = useAuth();

    // Unified analytics temporarily disabled.
    // useEffect(() => {
    //     const pathname = location.pathname || '/';
    //     let entityType = 'platform';
    //
    //     if (pathname.startsWith('/survey') || pathname.startsWith('/surveys')) {
    //         entityType = 'survey';
    //     } else if (pathname.startsWith('/articles')) {
    //         entityType = 'article';
    //     } else if (pathname.startsWith('/media')) {
    //         entityType = 'media';
    //     } else if (pathname.startsWith('/training')) {
    //         entityType = 'training';
    //     } else if (pathname.startsWith('/consulting')) {
    //         entityType = 'consulting';
    //     }
    //
    //     analyticsService.trackEvent({
    //         event_type: 'page_view',
    //         entity_type: entityType,
    //         entity_id: null,
    //         metadata: {
    //             path: pathname,
    //             query: location.search || '',
    //         },
    //     }).catch(() => {
    //         // Never block route transitions for analytics.
    //     });
    // }, [location.pathname, location.search]);

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <>
            <Navbar />
            <main style={{ minHeight: 'calc(100vh - 60px)', paddingBottom: '32px' }}>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/articles" element={<ArticlesPage />} />
                    <Route path="/articles/:id" element={<ArticleDetailPage />} />
                    <Route path="/training" element={<TrainingPage />} />
                    <Route path="/consulting" element={<ConsultingPage />} />
                    <Route path="/consulting/:slug" element={<ConsultingDetailPage />} />
                    <Route path="/surveys" element={<SurveysPage />} />
                    <Route path="/surveys/:id" element={<SurveyDetailPage />} />

                    {/* Protected User Routes */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <DashboardPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/survey/:id/take"
                        element={
                            <ProtectedRoute>
                                <TakeSurveyPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/responses"
                        element={
                            <ProtectedRoute>
                                <ResponsesPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/responses/:id"
                        element={
                            <ProtectedRoute>
                                <ResponseDetailPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute>
                                <ProfilePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/media" element={<MediaPage />} />
                    <Route path="/media/:id" element={<MediaDetailPage />} />

                    {/* Protected Admin Routes */}
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute adminOnly>
                                <AdminDashboardPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/articles"
                        element={
                            <ProtectedRoute adminOnly>
                                <AdminArticlesPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/responses"
                        element={
                            <ProtectedRoute adminOnly>
                                <AdminResponsesPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/users"
                        element={
                            <ProtectedRoute adminOnly>
                                <AdminUsersPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/surveys"
                        element={
                            <ProtectedRoute adminOnly>
                                <AdminSurveysPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/surveys/create"
                        element={
                            <ProtectedRoute adminOnly>
                                <CreateSurveyPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/surveys/:id/edit"
                        element={
                            <ProtectedRoute adminOnly>
                                <CreateSurveyPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/surveys/:id/analytics"
                        element={
                            <ProtectedRoute adminOnly>
                                <SurveyAnalyticsPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/media"
                        element={
                            <ProtectedRoute adminOnly>
                                <AdminMediaPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/training"
                        element={
                            <ProtectedRoute adminOnly>
                                <AdminTrainingPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/consulting"
                        element={
                            <ProtectedRoute adminOnly>
                                <AdminConsultingPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/consulting/analytics"
                        element={
                            <ProtectedRoute adminOnly>
                                <AdminConsultingAnalyticsPage />
                            </ProtectedRoute>
                        }
                    />
                    {/* Unified analytics temporarily disabled.
                    <Route
                        path="/admin/analytics"
                        element={
                            <ProtectedRoute adminOnly>
                                <AdminAnalyticsPage />
                            </ProtectedRoute>
                        }
                    />
                    */}

                    {/* Catch all - redirect to home */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
        </>
    );
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </Router>
    );
}

export default App;
