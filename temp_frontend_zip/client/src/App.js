import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import './index.css';

// Pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const SurveysPage = lazy(() => import('./pages/SurveysPage'));
const SurveyDetailPage = lazy(() => import('./pages/SurveyDetailPage'));
const TakeSurveyPage = lazy(() => import('./pages/TakeSurveyPage'));
const ResponsesPage = lazy(() => import('./pages/ResponsesPage'));
const ResponseDetailPage = lazy(() => import('./pages/ResponseDetailPage'));
const ArticlesPage = lazy(() => import('./pages/ArticlesPage'));
const ArticleDetailPage = lazy(() => import('./pages/ArticleDetailPage'));
const TrainingPage = lazy(() => import('./pages/TrainingPage'));
const ConsultingPage = lazy(() => import('./pages/ConsultingPage'));
const ConsultingDetailPage = lazy(() => import('./pages/ConsultingDetailPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const MediaPage = lazy(() => import('./pages/MediaPage'));
const MediaDetailPage = lazy(() => import('./pages/MediaDetailPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const AdminArticlesPage = lazy(() => import('./pages/AdminArticlesPage'));
const AdminResponsesPage = lazy(() => import('./pages/AdminResponsesPage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const AdminSurveysPage = lazy(() => import('./pages/AdminSurveysPage'));
const AdminTrainingPage = lazy(() => import('./pages/AdminTrainingPage'));
const AdminMediaPage = lazy(() => import('./pages/AdminMediaPage'));
const AdminConsultingPage = lazy(() => import('./pages/AdminConsultingPage'));
const AdminConsultingAnalyticsPage = lazy(() => import('./pages/AdminConsultingAnalyticsPage'));
// import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
const CreateSurveyPage = lazy(() => import('./pages/CreateSurveyPage'));
const SurveyAnalyticsPage = lazy(() => import('./pages/SurveyAnalyticsPage'));
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
                <Suspense fallback={<LoadingSpinner fullScreen={false} />}>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/articles" element={<ArticlesPage />} />
                    <Route path="/articles/:slug" element={<ArticleDetailPage />} />
                    <Route path="/training" element={<TrainingPage />} />
                    <Route path="/training/:category" element={<TrainingPage />} />
                    <Route path="/training/:category/:slug" element={<TrainingPage />} />
                    <Route path="/consulting" element={<ConsultingPage />} />
                    <Route path="/consulting/:slug" element={<ConsultingDetailPage />} />
                    <Route path="/surveys" element={<SurveysPage />} />
                    <Route path="/surveys/:slug" element={<SurveyDetailPage />} />

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
                </Suspense>
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
